import type { Page, Playlist, Track } from './types';

export interface ListOptions {
  limit?: number;
  offset?: number;
}

/**
 * The seam the whole app is built against.
 *
 * Two implementations ship in this repo: a deterministic fixture catalogue
 * (`lib/catalogue/fixture`) and a Spotify Web API adapter
 * (`lib/catalogue/spotify`). The UI imports neither directly — it goes through
 * `getCatalogue()` in `./registry`.
 */
export interface CatalogueProvider {
  /** Stable machine id, e.g. `fixture`. Used by the registry and in the UI badge. */
  readonly id: string;
  /** Human label shown in the sidebar footer. */
  readonly displayName: string;
  /** False when the provider returns metadata it cannot stream. */
  readonly canStreamAudio: boolean;
  /** True when the library is writable. */
  readonly canWriteLibrary: boolean;

  /** Editorially ordered front page. */
  featured(options?: ListOptions): Promise<Page<Track>>;
  search(query: string, options?: ListOptions): Promise<Page<Track>>;
  getTrack(id: string): Promise<Track | null>;
  /** Every track the provider knows about. Used by the mood planner. */
  allTracks(): Promise<Track[]>;

  listPlaylists(): Promise<Playlist[]>;
  getPlaylist(id: string): Promise<{ playlist: Playlist; tracks: Track[] } | null>;

  listLibrary(options?: ListOptions): Promise<Page<Track>>;
  saveToLibrary(trackId: string): Promise<void>;
  removeFromLibrary(trackId: string): Promise<void>;
  isSaved(trackId: string): Promise<boolean>;
}

export type CatalogueErrorCode = 'unauthorised' | 'not_found' | 'rate_limited' | 'unsupported' | 'transport';

/** Every provider failure surfaces as one of these, so the UI has one thing to catch. */
export class CatalogueError extends Error {
  readonly code: CatalogueErrorCode;
  readonly status?: number;

  constructor(code: CatalogueErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'CatalogueError';
    this.code = code;
    this.status = status;
  }
}
