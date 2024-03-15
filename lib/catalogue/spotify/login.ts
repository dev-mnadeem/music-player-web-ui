'use client';

import { spotifyConfig, spotifyRedirectUri } from '@/lib/config';
import { clearTokens, createPkcePair, storeCodeVerifier } from './tokens';

/** Scopes this app actually uses. Asking for more is a reason to be declined. */
export const SPOTIFY_SCOPES = ['user-read-private', 'user-library-read', 'user-library-modify'] as const;

export async function startSpotifyLogin(): Promise<void> {
  const { verifier, challenge, state } = await createPkcePair();
  storeCodeVerifier(verifier);

  const args = new URLSearchParams({
    response_type: 'code',
    client_id: spotifyConfig.clientId,
    scope: SPOTIFY_SCOPES.join(' '),
    redirect_uri: spotifyRedirectUri(),
    state,
    code_challenge_method: 'S256',
    code_challenge: challenge
  });

  // A full navigation is required: this leaves the app for the provider's
  // consent screen, which the Next router cannot handle.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = `${spotifyConfig.authUrl}/authorize?${args}`;
}

export function logout(): void {
  clearTokens();
}
