import type { CatalogueProvider, ListOptions } from '../provider';
import { CatalogueError } from '../provider';
import type { Page, Playlist, Track } from '../types';
import { DEFAULT_PAGE_SIZE, emptyPage, MAX_PAGE_SIZE } from '../types';
import { request } from './client';
import { toTracks, type SpotifyTrackDto } from './mapper';

interface SearchResponse {
  tracks?: { items?: SpotifyTrackDto[]; total?: number };
}

interface SavedTracksResponse {
  items?: { track?: SpotifyTrackDto }[];
  total?: number;
}

function clampLimit(limit: number | undefined): number {
  return Math.min(MAX_PAGE_SIZE, Math.max(1, limit ?? DEFAULT_PAGE_SIZE));
}

/**
 * Spotify Web API adapter.
 *
 * Selected by `NEXT_PUBLIC_CATALOGUE_PROVIDER=spotify`, and only useful with a
 * registered application and a matching redirect URI. It is included because
 * the provider interface is worth nothing if only one implementation exists —
 * this is the second one, and it is the reason `Track` looks the way it does.
 */
export class SpotifyCatalogue implements CatalogueProvider {
  readonly id = 'spotify';
  readonly displayName = 'Spotify';
  readonly canStreamAudio = false;
  readonly canWriteLibrary = true;

  async featured(options: ListOptions = {}): Promise<Page<Track>> {
    // Spotify has no "featured tracks" endpoint that works without a market and
    // a user context, so the front page reuses the saved library.
    return this.listLibrary(options);
  }

  async search(query: string, options: ListOptions = {}): Promise<Page<Track>> {
    const trimmed = query.trim();
    const limit = clampLimit(options.limit);
    const offset = Math.max(0, options.offset ?? 0);
    if (!trimmed) {
      return emptyPage<Track>(limit, offset);
    }

    const params = new URLSearchParams({
      q: trimmed,
      type: 'track',
      limit: String(limit),
      offset: String(offset)
    });
    const body = await request<SearchResponse>(`/v1/search?${params}`);
    const items = toTracks(body?.tracks?.items);
    const total = body?.tracks?.total ?? items.length;

    return { items, total, offset, limit, hasMore: offset + items.length < total };
  }

  async getTrack(id: string): Promise<Track | null> {
    const body = await request<SpotifyTrackDto>(`/v1/tracks/${encodeURIComponent(id)}`);
    return body ? (toTracks([body])[0] ?? null) : null;
  }

  async allTracks(): Promise<Track[]> {
    // Refusing is the honest answer: the mood planner needs the whole
    // catalogue, and Spotify will not hand one over.
    throw new CatalogueError('unsupported', 'The Spotify adapter cannot enumerate a full catalogue');
  }

  async listPlaylists(): Promise<Playlist[]> {
    return [];
  }

  async getPlaylist(): Promise<{ playlist: Playlist; tracks: Track[] } | null> {
    return null;
  }

  async listLibrary(options: ListOptions = {}): Promise<Page<Track>> {
    const limit = clampLimit(options.limit);
    const offset = Math.max(0, options.offset ?? 0);
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const body = await request<SavedTracksResponse>(`/v1/me/tracks?${params}`);
    const items = toTracks(body?.items?.map((entry) => entry.track));
    const total = body?.total ?? items.length;

    return { items, total, offset, limit, hasMore: offset + items.length < total };
  }

  async saveToLibrary(trackId: string): Promise<void> {
    await request(`/v1/me/tracks?ids=${encodeURIComponent(trackId)}`, 'PUT');
  }

  async removeFromLibrary(trackId: string): Promise<void> {
    await request(`/v1/me/tracks?ids=${encodeURIComponent(trackId)}`, 'DELETE');
  }

  async isSaved(trackId: string): Promise<boolean> {
    const body = await request<boolean[]>(`/v1/me/tracks/contains?ids=${encodeURIComponent(trackId)}`);
    return body?.[0] ?? false;
  }
}
