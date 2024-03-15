import { spotifyConfig, spotifyRedirectUri } from '@/lib/config';
import { CatalogueError } from '../provider';
import { clearTokens, readAccessToken, readRefreshToken, storeTokens } from './tokens';

/**
 * A thin HTTP client for the Spotify Web API.
 *
 * The one piece of real logic here is the 401 path: refresh the token, then
 * *replay the original request*. Refreshing without replaying leaves the caller
 * holding the failed response, which looks like a working refresh and behaves
 * like a broken one.
 */

const UNAUTHORISED = 401;
const TOO_MANY_REQUESTS = 429;

async function exchange(
  body: Record<string, string>
): Promise<{ access_token: string; refresh_token?: string }> {
  const response = await fetch(`${spotifyConfig.authUrl}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body)
  });

  if (!response.ok) {
    throw new CatalogueError('unauthorised', `Token exchange failed (${response.status})`, response.status);
  }
  return response.json();
}

/** Swaps an authorisation code for tokens. Called once, from `/callback`. */
export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<void> {
  const tokens = await exchange({
    grant_type: 'authorization_code',
    code,
    redirect_uri: spotifyRedirectUri(),
    client_id: spotifyConfig.clientId,
    code_verifier: codeVerifier
  });
  storeTokens(tokens.access_token, tokens.refresh_token ?? null);
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = readRefreshToken();
  if (!refreshToken) {
    return null;
  }
  try {
    const tokens = await exchange({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: spotifyConfig.clientId
    });
    storeTokens(tokens.access_token, tokens.refresh_token ?? refreshToken);
    return tokens.access_token;
  } catch {
    // A refresh token Spotify has revoked is worse than none: it makes every
    // request take two round trips to fail. Drop the session instead.
    clearTokens();
    return null;
  }
}

async function send(path: string, method: string, token: string | null): Promise<Response> {
  return fetch(`${spotifyConfig.apiUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token ?? ''}`,
      'Content-Type': 'application/json'
    }
  });
}

/** Issues an authenticated request, retrying exactly once after a refresh. */
export async function request<T>(path: string, method: 'GET' | 'PUT' | 'DELETE' = 'GET'): Promise<T | null> {
  let response: Response;
  try {
    response = await send(path, method, readAccessToken());
  } catch (cause) {
    throw new CatalogueError('transport', `Could not reach the Spotify API: ${String(cause)}`);
  }

  if (response.status === UNAUTHORISED) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      throw new CatalogueError('unauthorised', 'Spotify session has expired', UNAUTHORISED);
    }
    response = await send(path, method, refreshed);
  }

  if (response.status === TOO_MANY_REQUESTS) {
    throw new CatalogueError('rate_limited', 'Spotify rate limit reached', TOO_MANY_REQUESTS);
  }
  if (!response.ok) {
    throw new CatalogueError('transport', `Spotify responded ${response.status}`, response.status);
  }

  // PUT and DELETE on the library return 200 with an empty body.
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : null;
}
