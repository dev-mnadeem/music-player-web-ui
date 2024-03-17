'use client';

import { IoPlay } from 'react-icons/io5';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Track } from '@/lib/catalogue/types';
import { formatDuration } from '@/lib/format';

interface TrackRowProps {
  track: Track;
  context?: Track[];
  /** Small right-hand annotation, e.g. why the mood planner chose this. */
  note?: string;
}

/** The compact list form used in the sidebar library and the mood results. */
export function TrackRow({ track, context, note }: TrackRowProps) {
  const { track: current, isPlaying, playTrack } = usePlayer();
  const isCurrent = current?.id === track.id;

  return (
    <button
      type="button"
      onClick={() => playTrack(track, context)}
      disabled={!track.audioUrl}
      className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition hover:bg-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded bg-raised">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG from a local route */}
        <img src={track.artworkUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute inset-0 hidden items-center justify-center bg-bg/60 group-hover:flex">
          <IoPlay size={16} className="text-fg" />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span
          className="block truncate text-sm font-medium data-[current=true]:text-accent"
          data-current={isCurrent}
        >
          {track.title}
        </span>
        <span className="block truncate text-xs text-muted">{note ?? track.artist}</span>
      </span>

      {isCurrent && isPlaying ? (
        <span aria-label="Now playing" className="flex h-4 items-end gap-0.5">
          <span className="h-3 w-0.5 animate-bob bg-accent" />
          <span className="h-4 w-0.5 animate-bob bg-accent [animation-delay:150ms]" />
          <span className="h-2 w-0.5 animate-bob bg-accent [animation-delay:300ms]" />
        </span>
      ) : (
        <span className="text-xs tabular-nums text-muted">{formatDuration(track.durationMs)}</span>
      )}
    </button>
  );
}
