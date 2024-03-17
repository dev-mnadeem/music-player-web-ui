'use client';

import { useCallback } from 'react';
import { HiOutlineQueueList } from 'react-icons/hi2';
import { IoPlay } from 'react-icons/io5';
import { PageHeader } from '@/components/layout/PageHeader';
import { TrackCard } from '@/components/track/TrackCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonShelf } from '@/components/ui/Skeletons';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAsync, useCatalogueProvider } from '@/hooks/useCatalogue';
import { APP_TAGLINE } from '@/lib/config';
import { pluralise } from '@/lib/format';

const SHELF_SIZE = 18;

export default function HomePage() {
  const catalogue = useCatalogueProvider();
  const { playQueue } = usePlayer();

  const featured = useAsync(`featured:${catalogue.id}:${SHELF_SIZE}`, () =>
    catalogue.featured({ limit: SHELF_SIZE })
  );
  const playlists = useAsync(`playlists:${catalogue.id}`, () => catalogue.listPlaylists());

  const playPlaylist = useCallback(
    async (playlistId: string) => {
      const result = await catalogue.getPlaylist(playlistId);
      if (result && result.tracks.length > 0) {
        playQueue(result.tracks, 0);
      }
    },
    [catalogue, playQueue]
  );

  return (
    <>
      <PageHeader eyebrow={catalogue.displayName} title="Tonight's shelf" lede={APP_TAGLINE} />

      <div className="space-y-10 px-8 pb-10">
        {(playlists.data?.length ?? 0) > 0 ? (
          <section>
            <h2 className="mb-4 text-lg font-semibold tracking-tight">Start somewhere</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {playlists.data?.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => void playPlaylist(playlist.id)}
                  className="group flex items-center gap-3 overflow-hidden rounded-lg bg-raised pr-3 text-left transition hover:bg-line/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG from a local route */}
                  <img src={playlist.artworkUrl} alt="" className="h-16 w-16 shrink-0 object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{playlist.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {pluralise(playlist.trackIds.length, 'track')}
                    </span>
                  </span>
                  <IoPlay
                    size={18}
                    className="shrink-0 text-muted transition group-hover:text-accent"
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-4 text-lg font-semibold tracking-tight">New across the catalogue</h2>
          {featured.isLoading ? (
            <SkeletonShelf count={SHELF_SIZE} />
          ) : featured.error ? (
            <EmptyState
              icon={HiOutlineQueueList}
              title="The catalogue did not answer"
              body={featured.error}
            />
          ) : (
            <div className="grid grid-cols-shelf gap-4">
              {featured.data?.items.map((track) => (
                <TrackCard key={track.id} track={track} context={featured.data?.items} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
