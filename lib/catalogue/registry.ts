import { catalogueProviderId, isSpotifyConfigured } from '@/lib/config';
import { FixtureCatalogue } from './fixture/provider';
import type { CatalogueProvider } from './provider';
import { SpotifyCatalogue } from './spotify/provider';

/**
 * Chooses the catalogue the app runs against.
 *
 * The default is the fixture catalogue, deliberately: a clone with no
 * credentials must still show a populated, playable app. Spotify is opt-in and
 * falls back rather than throwing, because a missing client id at page load is
 * a configuration mistake, not an exception worth crashing on.
 */

const FACTORIES: Record<string, () => CatalogueProvider> = {
  fixture: () => new FixtureCatalogue(),
  spotify: () => (isSpotifyConfigured ? new SpotifyCatalogue() : new FixtureCatalogue())
};

let instance: CatalogueProvider | null = null;

export function getCatalogue(): CatalogueProvider {
  if (!instance) {
    instance = (FACTORIES[catalogueProviderId] ?? FACTORIES.fixture)();
  }
  return instance;
}

/** Test seam: drop the memoised provider. */
export function resetCatalogue(): void {
  instance = null;
}

/**
 * The choice `getCatalogue` makes, as a pure function of its two inputs.
 * Exported so the fallback rule can be tested without touching the environment.
 */
export function selectProvider(id: string, spotifyConfigured: boolean): CatalogueProvider {
  if (id === 'spotify') {
    return spotifyConfigured ? new SpotifyCatalogue() : new FixtureCatalogue();
  }
  return (FACTORIES[id] ?? FACTORIES.fixture)();
}
