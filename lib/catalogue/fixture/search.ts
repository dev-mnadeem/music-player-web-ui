import type { Track } from '../types';

/**
 * Relevance scoring for the fixture catalogue.
 *
 * Split out from the provider because ranking is the part with opinions in it,
 * and opinions deserve their own tests.
 */

const WEIGHT_TITLE_EXACT = 100;
const WEIGHT_TITLE_PREFIX = 60;
const WEIGHT_TITLE_CONTAINS = 35;
const WEIGHT_ARTIST = 28;
const WEIGHT_ALBUM = 18;
const WEIGHT_TAG = 12;
const WEIGHT_YEAR = 10;

export function normaliseQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

/** 0 means "no match at all" and callers should drop the track. */
export function scoreTrack(track: Track, query: string): number {
  const needle = normaliseQuery(query);
  if (!needle) {
    return 0;
  }

  const title = track.title.toLowerCase();
  const artist = track.artist.toLowerCase();
  const album = track.album.toLowerCase();

  let score = 0;
  if (title === needle) {
    score += WEIGHT_TITLE_EXACT;
  } else if (title.startsWith(needle)) {
    score += WEIGHT_TITLE_PREFIX;
  } else if (title.includes(needle)) {
    score += WEIGHT_TITLE_CONTAINS;
  }

  if (artist.includes(needle)) {
    score += WEIGHT_ARTIST;
  }
  if (album.includes(needle)) {
    score += WEIGHT_ALBUM;
  }
  if (track.tags.some((tag) => tag.includes(needle))) {
    score += WEIGHT_TAG;
  }
  if (String(track.year) === needle) {
    score += WEIGHT_YEAR;
  }

  return score;
}

/** Matching tracks, best first. Ties break alphabetically so results are stable. */
export function rankTracks(tracks: readonly Track[], query: string): Track[] {
  const needle = normaliseQuery(query);
  if (!needle) {
    return [];
  }

  return tracks
    .map((track) => ({ track, score: scoreTrack(track, needle) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.track.title.localeCompare(b.track.title))
    .map((entry) => entry.track);
}
