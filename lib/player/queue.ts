import type { Track } from '@/lib/catalogue/types';

/**
 * Queue mechanics, kept away from React.
 *
 * Every transition the player can make is a pure function of the previous
 * queue, which means the awkward cases — last track with repeat off, previous
 * from the first track, playing a track that is already queued — are decided
 * once here and tested, rather than re-derived inside three event handlers.
 */

export type RepeatMode = 'off' | 'all' | 'one';

export interface QueueState {
  tracks: Track[];
  /** Index into `tracks`, or -1 when nothing is loaded. */
  index: number;
  repeat: RepeatMode;
}

export const EMPTY_QUEUE: QueueState = { tracks: [], index: -1, repeat: 'off' };

export function currentTrack(state: QueueState): Track | null {
  return state.tracks[state.index] ?? null;
}

/** Replaces the queue and starts at `startIndex`, clamped into range. */
export function loadQueue(state: QueueState, tracks: Track[], startIndex = 0): QueueState {
  if (tracks.length === 0) {
    return { ...state, tracks: [], index: -1 };
  }
  return {
    ...state,
    tracks,
    index: Math.min(Math.max(0, startIndex), tracks.length - 1)
  };
}

/**
 * Advances one track. With `repeat: 'off'` the end of the queue holds position
 * on the last track — `advanced` tells the caller whether to keep playing.
 */
export function next(state: QueueState): { state: QueueState; advanced: boolean } {
  if (state.tracks.length === 0) {
    return { state, advanced: false };
  }
  if (state.repeat === 'one') {
    return { state, advanced: true };
  }
  const nextIndex = state.index + 1;
  if (nextIndex < state.tracks.length) {
    return { state: { ...state, index: nextIndex }, advanced: true };
  }
  if (state.repeat === 'all') {
    return { state: { ...state, index: 0 }, advanced: true };
  }
  return { state, advanced: false };
}

/** Steps back, wrapping to the end only when repeat is `all`. */
export function previous(state: QueueState): QueueState {
  if (state.tracks.length === 0) {
    return state;
  }
  if (state.index > 0) {
    return { ...state, index: state.index - 1 };
  }
  return state.repeat === 'all' ? { ...state, index: state.tracks.length - 1 } : state;
}

export function jumpTo(state: QueueState, trackId: string): QueueState {
  const index = state.tracks.findIndex((track) => track.id === trackId);
  return index === -1 ? state : { ...state, index };
}

export function cycleRepeat(mode: RepeatMode): RepeatMode {
  const order: RepeatMode[] = ['off', 'all', 'one'];
  return order[(order.indexOf(mode) + 1) % order.length];
}
