'use client';

import { HiOutlineHeart } from 'react-icons/hi2';
import { useLibrary } from '@/contexts/LibraryContext';
import { pluralise } from '@/lib/format';
import { TrackRow } from '../track/TrackRow';
import { SkeletonRows } from '../ui/Skeletons';

export function LibraryPanel() {
  const { tracks, isLoading, error } = useLibrary();

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-xl bg-surface">
      <header className="flex items-center justify-between px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-muted">
          <HiOutlineHeart size={18} />
          Your library
        </h2>
        {!isLoading && tracks.length > 0 ? (
          <span className="text-2xs uppercase tracking-wider text-muted">
            {pluralise(tracks.length, 'track')}
          </span>
        ) : null}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {isLoading ? (
          <SkeletonRows count={5} />
        ) : error ? (
          <p className="px-2 py-6 text-center text-xs leading-relaxed text-muted">{error}</p>
        ) : tracks.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs leading-relaxed text-muted">
            Nothing saved yet. Tap the heart on any track and it will appear here, and still be here after a
            reload.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {tracks.map((track) => (
              <TrackRow key={track.id} track={track} context={tracks} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
