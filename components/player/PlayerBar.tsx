'use client';

import { HiOutlineHeart, HiHeart } from 'react-icons/hi2';
import {
  IoPlay,
  IoPause,
  IoPlaySkipBack,
  IoPlaySkipForward,
  IoRepeat,
  IoVolumeHigh,
  IoVolumeMute
} from 'react-icons/io5';
import { useLibrary } from '@/contexts/LibraryContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { formatDuration } from '@/lib/format';
import { IconButton } from '../ui/IconButton';

const MS_PER_SECOND = 1000;

/**
 * The transport bar. Fixed to the bottom on every page, because the queue
 * outlives navigation.
 */
export function PlayerBar() {
  const {
    track,
    isPlaying,
    position,
    duration,
    volume,
    repeat,
    toggle,
    next,
    previous,
    seek,
    setVolume,
    toggleRepeat
  } = usePlayer();
  const { isSaved, toggleSaved } = useLibrary();

  // The element reports its own duration once metadata loads. Until then the
  // catalogue's figure keeps the seek bar from rendering at zero width.
  const fallbackDuration = track ? track.durationMs / MS_PER_SECOND : 0;
  const effectiveDuration = duration || fallbackDuration;
  const saved = track ? isSaved(track.id) : false;

  return (
    <footer className="z-20 flex h-20 items-center gap-4 border-t border-line bg-surface px-4">
      <div className="flex w-[22%] min-w-0 items-center gap-3">
        {track ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- generated SVG from a local route */}
            <img
              src={track.artworkUrl}
              alt={`Cover art for ${track.album}`}
              className="h-14 w-14 shrink-0 rounded bg-raised object-cover"
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{track.title}</p>
              <p className="truncate text-xs text-muted">{track.artist}</p>
            </div>
            <IconButton
              icon={saved ? HiHeart : HiOutlineHeart}
              size={16}
              label={saved ? 'Remove from your library' : 'Save to your library'}
              onClick={() => void toggleSaved(track)}
              className={saved ? 'h-8 w-8 shrink-0 text-accent hover:text-accent' : 'h-8 w-8 shrink-0'}
            />
          </>
        ) : (
          <>
            <div className="h-14 w-14 shrink-0 rounded border border-dashed border-line" />
            <p className="text-xs leading-relaxed text-muted">Nothing queued yet</p>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <IconButton
            icon={IoPlaySkipBack}
            label="Previous track"
            onClick={previous}
            disabled={!track}
            className="h-9 w-9"
          />
          <IconButton
            icon={isPlaying ? IoPause : IoPlay}
            tone="accent"
            size={20}
            label={isPlaying ? 'Pause' : 'Play'}
            onClick={toggle}
            disabled={!track?.audioUrl}
            className="h-10 w-10"
          />
          <IconButton
            icon={IoPlaySkipForward}
            label="Next track"
            onClick={next}
            disabled={!track}
            className="h-9 w-9"
          />
          <IconButton
            icon={IoRepeat}
            label={`Repeat: ${repeat}`}
            onClick={toggleRepeat}
            className={repeat === 'off' ? 'h-9 w-9' : 'h-9 w-9 text-accent hover:text-accent'}
          />
          {repeat === 'one' ? <span className="-ml-1 text-2xs text-accent">1</span> : null}
        </div>

        <div className="flex w-full max-w-xl items-center gap-2">
          <span className="w-10 text-right text-xs tabular-nums text-muted">
            {formatDuration(position * MS_PER_SECOND)}
          </span>
          <input
            type="range"
            className="tonearm-range"
            min={0}
            max={Math.max(1, effectiveDuration)}
            step={0.5}
            value={Math.min(position, effectiveDuration)}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek"
            disabled={!track?.audioUrl}
            style={{
              background: `linear-gradient(to right, rgb(var(--tonearm-accent)) ${
                effectiveDuration ? (position / effectiveDuration) * 100 : 0
              }%, rgb(var(--tonearm-line)) 0%)`
            }}
          />
          <span className="w-10 text-xs tabular-nums text-muted">
            {formatDuration(effectiveDuration * MS_PER_SECOND)}
          </span>
        </div>
      </div>

      <div className="flex w-[22%] items-center justify-end gap-2">
        <IconButton
          icon={volume === 0 ? IoVolumeMute : IoVolumeHigh}
          size={16}
          label={volume === 0 ? 'Unmute' : 'Mute'}
          onClick={() => setVolume(volume === 0 ? 0.7 : 0)}
          className="h-8 w-8"
        />
        <input
          type="range"
          className="tonearm-range max-w-28"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          aria-label="Volume"
          style={{
            background: `linear-gradient(to right, rgb(var(--tonearm-fg)) ${volume * 100}%, rgb(var(--tonearm-line)) 0%)`
          }}
        />
      </div>
    </footer>
  );
}
