/**
 * Every environment lookup in the app lives here.
 *
 * Nothing else reads `process.env`, so `npm run build` fails loudly in one
 * place if a variable is renamed, and the test suite can reason about
 * configuration without stubbing the environment everywhere.
 */

export const APP_NAME = 'Tonearm';
export const APP_TAGLINE = 'A music browser that does not care whose catalogue it is playing.';

export type CatalogueProviderId = 'fixture' | 'spotify';

const KNOWN_PROVIDERS: readonly CatalogueProviderId[] = ['fixture', 'spotify'];

function readProviderId(): CatalogueProviderId {
  const raw = (process.env.NEXT_PUBLIC_CATALOGUE_PROVIDER ?? '').trim().toLowerCase();
  return (KNOWN_PROVIDERS as readonly string[]).includes(raw) ? (raw as CatalogueProviderId) : 'fixture';
}

export const catalogueProviderId = readProviderId();

export const spotifyConfig = {
  clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID ?? '',
  authUrl: process.env.NEXT_PUBLIC_SPOTIFY_AUTH_URL ?? 'https://accounts.spotify.com',
  apiUrl: process.env.NEXT_PUBLIC_SPOTIFY_API_URL ?? 'https://api.spotify.com',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:7261'
} as const;

/** The OAuth callback the provider must have registered. Derived, never hardcoded. */
export function spotifyRedirectUri(): string {
  return `${spotifyConfig.appUrl.replace(/\/+$/, '')}/callback`;
}

/** The Spotify adapter is unusable without a client id, whatever the env says. */
export const isSpotifyConfigured = spotifyConfig.clientId.length > 0;

export const moodPlannerId = (process.env.MOOD_PLANNER ?? 'local').trim().toLowerCase();
