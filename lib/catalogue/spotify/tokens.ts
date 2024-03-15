/**
 * Token and PKCE handling for the Spotify adapter.
 *
 * The authorisation-code-with-PKCE flow is used precisely so that no client
 * secret is needed in the browser. There is no secret anywhere in this
 * directory and there must never be one: anything shipped to the browser is
 * public, and `NEXT_PUBLIC_` makes that literal.
 */

const ACCESS_TOKEN_KEY = 'tonearm.spotify.access_token';
const REFRESH_TOKEN_KEY = 'tonearm.spotify.refresh_token';
const VERIFIER_KEY = 'tonearm.spotify.code_verifier';

export const TOKEN_KEYS = {
  access: ACCESS_TOKEN_KEY,
  refresh: REFRESH_TOKEN_KEY,
  verifier: VERIFIER_KEY
} as const;

/** Fires whenever tokens change, so `useSpotifySession` can re-render. */
export const SESSION_CHANGED_EVENT = 'tonearm:session-changed';

function storage(): Storage | null {
  return typeof window === 'undefined' ? null : window.localStorage;
}

export function readAccessToken(): string | null {
  return storage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
}

export function readRefreshToken(): string | null {
  return storage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
}

export function readCodeVerifier(): string | null {
  return storage()?.getItem(VERIFIER_KEY) ?? null;
}

export function storeCodeVerifier(verifier: string): void {
  storage()?.setItem(VERIFIER_KEY, verifier);
}

export function storeTokens(accessToken: string, refreshToken?: string | null): void {
  const store = storage();
  if (!store) {
    return;
  }
  store.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    store.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

export function clearTokens(): void {
  const store = storage();
  if (!store) {
    return;
  }
  for (const key of Object.values(TOKEN_KEYS)) {
    store.removeItem(key);
  }
  window.dispatchEvent(new Event(SESSION_CHANGED_EVENT));
}

const VERIFIER_LENGTH = 64;
const STATE_LENGTH = 16;
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/** Cryptographically random, unlike `Math.random`, which is what PKCE requires. */
export function randomUrlSafeString(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => ALPHABET[byte % ALPHABET.length]).join('');
}

export function base64UrlEncode(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function createPkcePair(): Promise<{ verifier: string; challenge: string; state: string }> {
  const verifier = randomUrlSafeString(VERIFIER_LENGTH);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return {
    verifier,
    challenge: base64UrlEncode(digest),
    state: randomUrlSafeString(STATE_LENGTH)
  };
}
