/**
 * The domain model every catalogue provider maps onto.
 *
 * Nothing in the UI layer is allowed to see a provider's wire format. A
 * provider's job is to turn whatever it has — a fixture table, a REST payload —
 * into these shapes.
 */

/** A single playable item. */
export interface Track {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  album: string;
  albumId: string;
  /** Length of the audio the player will actually receive. */
  durationMs: number;
  /** Square cover art. Any URL the browser can load. */
  artworkUrl: string;
  /**
   * Audio source, or `null` when the provider exposes metadata it cannot
   * stream. The player disables transport controls for `null` sources rather
   * than pretending to play.
   */
  audioUrl: string | null;
  /** Free-form descriptors used by search and by the mood planner. */
  tags: string[];
  /** Beats per minute. Used for mood matching, shown nowhere. */
  tempo: number;
  /** 0-1. Loudness/drive, not volume. */
  energy: number;
  year: number;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  artistId: string;
  year: number;
  artworkUrl: string;
  trackIds: string[];
}

export interface Artist {
  id: string;
  name: string;
  genres: string[];
}

export interface Playlist {
  id: string;
  title: string;
  description: string;
  artworkUrl: string;
  trackIds: string[];
}

/** One slice of an unbounded list. */
export interface Page<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export function emptyPage<T>(limit: number, offset = 0): Page<T> {
  return { items: [], total: 0, offset, limit, hasMore: false };
}

/** Largest page any provider will return, however big a caller asks for. */
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 24;

/** Slice an in-memory array into a `Page` with consistent bookkeeping. */
export function paginate<T>(all: readonly T[], limit = DEFAULT_PAGE_SIZE, offset = 0): Page<T> {
  const safeLimit = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(limit) || DEFAULT_PAGE_SIZE));
  const safeOffset = Math.max(0, Math.trunc(offset) || 0);
  const items = all.slice(safeOffset, safeOffset + safeLimit);
  return {
    items,
    total: all.length,
    offset: safeOffset,
    limit: safeLimit,
    hasMore: safeOffset + items.length < all.length
  };
}
