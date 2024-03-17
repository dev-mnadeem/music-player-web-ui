'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import type { Track } from '@/lib/catalogue/types';
import {
  cycleRepeat,
  currentTrack as currentOf,
  EMPTY_QUEUE,
  jumpTo,
  loadQueue,
  next as nextOf,
  previous as previousOf,
  type QueueState,
  type RepeatMode
} from '@/lib/player/queue';

/**
 * Owns the single `<audio>` element for the whole app.
 *
 * All queue arithmetic lives in `lib/player/queue`; this file is only the
 * bridge between that pure state and the media element. Keeping one element at
 * the root is what makes playback survive navigation between pages.
 */

interface PlayerContextValue {
  queue: QueueState;
  track: Track | null;
  isPlaying: boolean;
  /** Seconds. */
  position: number;
  duration: number;
  volume: number;
  repeat: RepeatMode;
  playQueue(tracks: Track[], startIndex?: number): void;
  playTrack(track: Track, within?: Track[]): void;
  toggle(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  setVolume(value: number): void;
  toggleRepeat(): void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

const DEFAULT_VOLUME = 0.7;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<QueueState>(EMPTY_QUEUE);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME);

  const track = currentOf(queue);

  // Swap the source whenever the selected track changes, and start playing
  // if the user was already listening.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    if (!track?.audioUrl) {
      audio.removeAttribute('src');
      audio.load();
      // Synchronising React with a media element is exactly what an effect is
      // for, and there is no render-time value to derive these from: the
      // element has just been emptied.
      /* eslint-disable react-hooks/set-state-in-effect */
      setIsPlaying(false);
      setPosition(0);
      setDuration(0);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    if (audio.getAttribute('src') !== track.audioUrl) {
      audio.setAttribute('src', track.audioUrl);
      audio.load();
      setPosition(0);
    }
    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false));
    }
    // `isPlaying` is deliberately excluded: toggling play must not reload src.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id, track?.audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const playQueue = useCallback((tracks: Track[], startIndex = 0) => {
    setQueue((state) => loadQueue(state, tracks, startIndex));
    setIsPlaying(true);
  }, []);

  const playTrack = useCallback((selected: Track, within?: Track[]) => {
    setQueue((state) => {
      if (within && within.length > 0) {
        const index = Math.max(
          0,
          within.findIndex((item) => item.id === selected.id)
        );
        return loadQueue(state, within, index);
      }
      const known = state.tracks.some((item) => item.id === selected.id);
      return known ? jumpTo(state, selected.id) : loadQueue(state, [selected], 0);
    });
    setIsPlaying(true);
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !track?.audioUrl) {
      return;
    }
    if (audio.paused) {
      void audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [track?.audioUrl]);

  const goNext = useCallback(() => {
    setQueue((state) => {
      const result = nextOf(state);
      if (!result.advanced) {
        setIsPlaying(false);
      }
      if (state.repeat === 'one' && audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch(() => undefined);
      }
      return result.state;
    });
  }, []);

  const goPrevious = useCallback(() => {
    const audio = audioRef.current;
    // Standard transport behaviour: past three seconds, "previous" restarts.
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    setQueue(previousOf);
  }, []);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (audio && Number.isFinite(seconds)) {
      audio.currentTime = seconds;
      setPosition(seconds);
    }
  }, []);

  const setVolume = useCallback((value: number) => {
    setVolumeState(Math.min(1, Math.max(0, value)));
  }, []);

  const toggleRepeat = useCallback(() => {
    setQueue((state) => ({ ...state, repeat: cycleRepeat(state.repeat) }));
  }, []);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      track,
      isPlaying,
      position,
      duration,
      volume,
      repeat: queue.repeat,
      playQueue,
      playTrack,
      toggle,
      next: goNext,
      previous: goPrevious,
      seek,
      setVolume,
      toggleRepeat
    }),
    [
      queue,
      track,
      isPlaying,
      position,
      duration,
      volume,
      playQueue,
      playTrack,
      toggle,
      goNext,
      goPrevious,
      seek,
      setVolume,
      toggleRepeat
    ]
  );

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={(event) => setPosition(event.currentTarget.currentTime)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration || 0)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={goNext}
      />
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer must be used inside a <PlayerProvider>');
  }
  return context;
}
