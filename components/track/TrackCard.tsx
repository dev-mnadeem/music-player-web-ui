'use client';

import { HiOutlineHeart, HiHeart } from 'react-icons/hi2';
import { IoPlay, IoPause } from 'react-icons/io5';
import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayer } from '@/contexts/PlayerContext';
import type { Track } from '@/lib/catalogue/types';
import { formatDuration } from '@/lib/format';
import { IconButton } from '../ui/IconButton';

interface TrackCardProps {
  track: Track;
  /** The list this card belongs to, so playing it queues its neighbours too. */
  context?: Track[];
}

export function TrackCard({ track, context }: TrackCardProps) {
  const { track: current, isPlaying, playTrack, toggle } = usePlayer();
  const { isSaved, toggleSaved } = useLibrary();

  const isCurrent = current?.id === track.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const saved = isSaved(track.id);

  return (
    <article className="group relative rounded-xl bg-surface p-3 transition hover:bg-raised">
      <div className="relative mb-3 aspect-square overflow-hidden rounded-lg bg-raised">
        {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG from a local route */}
        <img
          src={track.artworkUrl}
          alt={`Cover art for ${track.album}`}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        <IconButton
          icon={isCurrentlyPlaying ? IoPause : IoPlay}
          tone="accent"
          size={20}
          label={isCurrentlyPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
          disabled={!track.audioUrl}
          onClick={() => (isCurrent ? toggle() : playTrack(track, context))}
          className="absolute bottom-2 right-2 h-11 w-11 translate-y-2 opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100 data-[current=true]:translate-y-0 data-[current=true]:opacity-100"
          data-current={isCurrent}
        />
      </div>

      <h3
        className="truncate text-sm font-semibold data-[current=true]:text-accent"
        data-current={isCurrent}
        title={track.title}
      >
        {track.title}
      </h3>
      <p className="truncate text-sm text-muted" title={track.artist}>
        {track.artist}
      </p>

      <div className="mt-2 flex items-center justify-between text-xs text-muted">
        <span>{formatDuration(track.durationMs)}</span>
        <IconButton
          icon={saved ? HiHeart : HiOutlineHeart}
          size={16}
          label={saved ? `Remove ${track.title} from your library` : `Save ${track.title} to your library`}
          onClick={() => void toggleSaved(track)}
          className={saved ? 'h-7 w-7 text-accent hover:text-accent' : 'h-7 w-7'}
        />
      </div>
    </article>
  );
}
