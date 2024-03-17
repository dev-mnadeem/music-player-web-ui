import { describe, expect, it } from 'vitest';
import { formatDuration, pluralise, progressPercent } from '@/lib/format';

describe('formatDuration', () => {
  it('renders minutes and zero-padded seconds', () => {
    expect(formatDuration(214_000)).toBe('3:34');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(9_000)).toBe('0:09');
  });

  it('treats anything unusable as zero rather than rendering NaN', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(-1)).toBe('0:00');
    expect(formatDuration(Number.NaN)).toBe('0:00');
    expect(formatDuration(Number.POSITIVE_INFINITY)).toBe('0:00');
  });
});

describe('progressPercent', () => {
  it('clamps to the 0-100 range', () => {
    expect(progressPercent(0, 1000)).toBe(0);
    expect(progressPercent(500, 1000)).toBe(50);
    expect(progressPercent(5000, 1000)).toBe(100);
    expect(progressPercent(-5, 1000)).toBe(0);
  });

  it('returns zero for an unknown duration', () => {
    expect(progressPercent(500, 0)).toBe(0);
  });
});

describe('pluralise', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralise(1, 'track')).toBe('1 track');
    expect(pluralise(0, 'track')).toBe('0 tracks');
    expect(pluralise(9, 'result')).toBe('9 results');
  });
});
