import { describe, expect, it } from 'vitest';
import type { Track } from '@/lib/catalogue/types';
import {
  currentTrack,
  cycleRepeat,
  EMPTY_QUEUE,
  jumpTo,
  loadQueue,
  next,
  previous
} from '@/lib/player/queue';

const track = (id: string): Track => ({
  id,
  title: id,
  artist: 'Artist',
  artistId: 'ar',
  album: 'Album',
  albumId: 'al',
  durationMs: 20_000,
  artworkUrl: `/api/art/${id}`,
  audioUrl: `/api/audio/${id}`,
  tags: [],
  tempo: 100,
  energy: 0.5,
  year: 2024
});

const threeTracks = [track('a'), track('b'), track('c')];

describe('loadQueue', () => {
  it('clamps a start index outside the queue', () => {
    expect(loadQueue(EMPTY_QUEUE, threeTracks, 99).index).toBe(2);
    expect(loadQueue(EMPTY_QUEUE, threeTracks, -4).index).toBe(0);
  });

  it('marks an empty queue as having nothing selected', () => {
    const state = loadQueue(EMPTY_QUEUE, []);
    expect(state.index).toBe(-1);
    expect(currentTrack(state)).toBeNull();
  });
});

describe('next', () => {
  it('advances through the queue', () => {
    const state = loadQueue(EMPTY_QUEUE, threeTracks, 0);
    const result = next(state);
    expect(result.advanced).toBe(true);
    expect(currentTrack(result.state)?.id).toBe('b');
  });

  it('stops at the end when repeat is off', () => {
    const state = loadQueue(EMPTY_QUEUE, threeTracks, 2);
    const result = next(state);
    expect(result.advanced).toBe(false);
    expect(currentTrack(result.state)?.id).toBe('c');
  });

  it('wraps to the start when repeat is all', () => {
    const state = { ...loadQueue(EMPTY_QUEUE, threeTracks, 2), repeat: 'all' as const };
    const result = next(state);
    expect(result.advanced).toBe(true);
    expect(currentTrack(result.state)?.id).toBe('a');
  });

  it('holds position when repeat is one', () => {
    const state = { ...loadQueue(EMPTY_QUEUE, threeTracks, 1), repeat: 'one' as const };
    const result = next(state);
    expect(result.advanced).toBe(true);
    expect(currentTrack(result.state)?.id).toBe('b');
  });
});

describe('previous', () => {
  it('steps back', () => {
    expect(currentTrack(previous(loadQueue(EMPTY_QUEUE, threeTracks, 2)))?.id).toBe('b');
  });

  it('stays on the first track unless repeat is all', () => {
    const first = loadQueue(EMPTY_QUEUE, threeTracks, 0);
    expect(currentTrack(previous(first))?.id).toBe('a');
    expect(currentTrack(previous({ ...first, repeat: 'all' }))?.id).toBe('c');
  });
});

describe('jumpTo', () => {
  it('selects a queued track and ignores an unknown id', () => {
    const state = loadQueue(EMPTY_QUEUE, threeTracks, 0);
    expect(currentTrack(jumpTo(state, 'c'))?.id).toBe('c');
    expect(jumpTo(state, 'zzz')).toBe(state);
  });
});

describe('cycleRepeat', () => {
  it('cycles off -> all -> one -> off', () => {
    expect(cycleRepeat('off')).toBe('all');
    expect(cycleRepeat('all')).toBe('one');
    expect(cycleRepeat('one')).toBe('off');
  });
});
