import type { CatalogueProvider, ListOptions } from '../provider';
import { CatalogueError } from '../provider';
import type { Page, Playlist, Track } from '../types';
import { DEFAULT_PAGE_SIZE, paginate } from '../types';
import { defaultLibraryStore, type LibraryStore } from './library-store';
import { rankTracks } from './search';
import { buildCatalogue, type Catalogue } from './seed';

/**
 * The provider the app uses when nobody has supplied credentials — which, for
 * anyone who has just cloned this repo, is always. It serves the generated
 * catalogue in `./seed`, ranks search with `./search`, and keeps saved tracks
 * in whatever `LibraryStore` it was handed.
 */
export class FixtureCatalogue implements CatalogueProvider {
  readonly id = 'fixture';
  readonly displayName = 'Demo catalogue';
  readonly canStreamAudio = true;
  readonly canWriteLibrary = true;

  private readonly catalogue: Catalogue;
  private readonly store: LibraryStore;

  constructor(store: LibraryStore = defaultLibraryStore(), catalogue: Catalogue = buildCatalogue()) {
    this.catalogue = catalogue;
    this.store = store;
  }

  async featured(options: ListOptions = {}): Promise<Page<Track>> {
    // Front page order is "one track per album, newest album first" so the grid
    // shows breadth rather than six tracks off the same record.
    const albumsByRecency = [...this.catalogue.albums].sort((a, b) => b.year - a.year);
    const lead = albumsByRecency
      .map((album) => this.catalogue.byId.get(album.trackIds[0]))
      .filter((track): track is Track => Boolean(track));
    const rest = this.catalogue.tracks.filter((track) => !lead.includes(track));
    return paginate([...lead, ...rest], options.limit ?? DEFAULT_PAGE_SIZE, options.offset ?? 0);
  }

  async search(query: string, options: ListOptions = {}): Promise<Page<Track>> {
    return paginate(
      rankTracks(this.catalogue.tracks, query),
      options.limit ?? DEFAULT_PAGE_SIZE,
      options.offset ?? 0
    );
  }

  async getTrack(id: string): Promise<Track | null> {
    return this.catalogue.byId.get(id) ?? null;
  }

  async allTracks(): Promise<Track[]> {
    return [...this.catalogue.tracks];
  }

  async listPlaylists(): Promise<Playlist[]> {
    return [...this.catalogue.playlists];
  }

  async getPlaylist(id: string): Promise<{ playlist: Playlist; tracks: Track[] } | null> {
    const playlist = this.catalogue.playlists.find((entry) => entry.id === id);
    if (!playlist) {
      return null;
    }
    return {
      playlist,
      tracks: playlist.trackIds
        .map((trackId) => this.catalogue.byId.get(trackId))
        .filter((track): track is Track => Boolean(track))
    };
  }

  async listLibrary(options: ListOptions = {}): Promise<Page<Track>> {
    const saved = this.store
      .read()
      .map((id) => this.catalogue.byId.get(id))
      .filter((track): track is Track => Boolean(track));
    return paginate(saved, options.limit ?? DEFAULT_PAGE_SIZE, options.offset ?? 0);
  }

  async saveToLibrary(trackId: string): Promise<void> {
    if (!this.catalogue.byId.has(trackId)) {
      throw new CatalogueError('not_found', `No track with id ${trackId}`);
    }
    const ids = this.store.read();
    if (!ids.includes(trackId)) {
      // Newest first: a save you just made should be at the top of the sidebar.
      this.store.write([trackId, ...ids]);
    }
  }

  async removeFromLibrary(trackId: string): Promise<void> {
    this.store.write(this.store.read().filter((id) => id !== trackId));
  }

  async isSaved(trackId: string): Promise<boolean> {
    return this.store.read().includes(trackId);
  }
}
