import { NextResponse } from 'next/server';
import { buildCatalogue } from '@/lib/catalogue/fixture/seed';
import { catalogueProviderId, isSpotifyConfigured } from '@/lib/config';
import { getMoodPlanner, registeredPlannerIds } from '@/lib/mood/registry';

export const dynamic = 'force-dynamic';

/**
 * Liveness plus enough configuration detail to tell "the demo catalogue is
 * serving" apart from "Spotify is selected but has no client id" without
 * reading the server logs. Used by the Docker healthcheck.
 */
export async function GET() {
  const catalogue = buildCatalogue();

  return NextResponse.json({
    status: 'ok',
    catalogue: {
      selected: catalogueProviderId,
      spotifyConfigured: isSpotifyConfigured,
      artists: catalogue.artists.length,
      albums: catalogue.albums.length,
      tracks: catalogue.tracks.length,
      playlists: catalogue.playlists.length
    },
    mood: {
      planner: getMoodPlanner().id,
      registered: registeredPlannerIds()
    }
  });
}
