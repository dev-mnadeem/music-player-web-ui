import { beforeEach, describe, expect, it } from 'vitest';
import { FixtureCatalogue } from '@/lib/catalogue/fixture/provider';
import {
  createLocalStorageStore,
  createMemoryStore,
  LIBRARY_STORAGE_KEY
} from '@/lib/catalogue/fixture/library-store';
import { rankTracks, scoreTrack } from '@/lib/catalogue/fixture/search';
import { buildCatalogue } from '@/lib/catalogue/fixture/seed';
import { CatalogueError } from '@/lib/catalogue/provider';
import { selectProvider } from '@/lib/catalogue/registry';

describe('buildCatalogue', () => {
  const catalogue = buildCatalogue();

  it('produces the whole demo catalogue', () => {
    expect(catalogue.artists.length).toBeGreaterThan(0);
    expect(catalogue.albums.length).toBeGreaterThan(catalogue.artists.length - 1);
    expect(catalogue.tracks.length).toBe(catalogue.byId.size);
  });

  it('gives every track a unique id, artwork and audio source', () => {
    for (const track of catalogue.tracks) {
      expect(track.artworkUrl).toBe(`/api/art/${track.albumId}`);
      expect(track.audioUrl).toBe(`/api/audio/${track.id}`);
      expect(track.durationMs).toBeGreaterThan(0);
      expect(track.tags.length).toBeGreaterThan(0);
    }
  });

  it('is reproducible', () => {
    const again = buildCatalogue();
    expect(again.tracks.map((track) => `${track.id}:${track.title}:${track.durationMs}`)).toEqual(
      catalogue.tracks.map((track) => `${track.id}:${track.title}:${track.durationMs}`)
    );
  });

  it('only puts known track ids in playlists', () => {
    for (const playlist of catalogue.playlists) {
      expect(playlist.trackIds.length).toBeGreaterThan(0);
      for (const id of playlist.trackIds) {
        expect(catalogue.byId.has(id)).toBe(true);
      }
    }
  });
});

describe('search ranking', () => {
  const catalogue = buildCatalogue();

  it('scores an exact title match above a substring match', () => {
    const track = catalogue.tracks[0];
    const exact = scoreTrack(track, track.title);
    const partial = scoreTrack(track, track.title.split(' ')[1] ?? track.title);
    expect(exact).toBeGreaterThan(partial);
  });

  it('matches on artist name', () => {
    const results = rankTracks(catalogue.tracks, 'Kestrel Dial');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((track) => track.artist === 'Kestrel Dial')).toBe(true);
  });

  it('matches on a descriptor tag', () => {
    const results = rankTracks(catalogue.tracks, 'hypnotic');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((track) => track.tags.includes('hypnotic'))).toBe(true);
  });

  it('matches on release year', () => {
    expect(rankTracks(catalogue.tracks, '2024').every((track) => track.year === 2024)).toBe(true);
  });

  it('returns nothing for an empty or unmatched query', () => {
    expect(rankTracks(catalogue.tracks, '   ')).toEqual([]);
    expect(rankTracks(catalogue.tracks, 'zzzzqqq')).toEqual([]);
  });

  it('is stable across calls', () => {
    expect(rankTracks(catalogue.tracks, 'warm').map((t) => t.id)).toEqual(
      rankTracks(catalogue.tracks, 'warm').map((t) => t.id)
    );
  });
});

describe('FixtureCatalogue', () => {
  let provider: FixtureCatalogue;

  beforeEach(() => {
    provider = new FixtureCatalogue(createMemoryStore());
  });

  it('pages the featured shelf', async () => {
    const page = await provider.featured({ limit: 6 });
    expect(page.items).toHaveLength(6);
    expect(page.hasMore).toBe(true);
  });

  it('leads the featured shelf with distinct albums', async () => {
    const page = await provider.featured({ limit: 8 });
    expect(new Set(page.items.map((track) => track.albumId)).size).toBe(8);
  });

  it('starts with an empty library and records a save', async () => {
    expect((await provider.listLibrary()).total).toBe(0);

    const track = (await provider.featured({ limit: 1 })).items[0];
    await provider.saveToLibrary(track.id);

    expect(await provider.isSaved(track.id)).toBe(true);
    expect((await provider.listLibrary()).items.map((item) => item.id)).toEqual([track.id]);
  });

  it('ignores a duplicate save', async () => {
    const track = (await provider.featured({ limit: 1 })).items[0];
    await provider.saveToLibrary(track.id);
    await provider.saveToLibrary(track.id);
    expect((await provider.listLibrary()).total).toBe(1);
  });

  it('removes a saved track', async () => {
    const track = (await provider.featured({ limit: 1 })).items[0];
    await provider.saveToLibrary(track.id);
    await provider.removeFromLibrary(track.id);
    expect((await provider.listLibrary()).total).toBe(0);
  });

  it('rejects saving a track it does not have', async () => {
    await expect(provider.saveToLibrary('nope')).rejects.toBeInstanceOf(CatalogueError);
  });

  it('resolves a playlist to real tracks', async () => {
    const [playlist] = await provider.listPlaylists();
    const result = await provider.getPlaylist(playlist.id);
    expect(result?.tracks).toHaveLength(playlist.trackIds.length);
    expect(await provider.getPlaylist('missing')).toBeNull();
  });

  it('returns null for an unknown track', async () => {
    expect(await provider.getTrack('not-a-track')).toBeNull();
  });
});

describe('library store', () => {
  beforeEach(() => window.localStorage.clear());

  it('persists ids through localStorage', () => {
    const store = createLocalStorageStore(window.localStorage);
    store.write(['a', 'b']);
    expect(createLocalStorageStore(window.localStorage).read()).toEqual(['a', 'b']);
  });

  it('survives corrupt stored data', () => {
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, '{not json');
    expect(createLocalStorageStore(window.localStorage).read()).toEqual([]);
  });

  it('drops non-string entries', () => {
    window.localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(['a', 7, null, 'b']));
    expect(createLocalStorageStore(window.localStorage).read()).toEqual(['a', 'b']);
  });
});

describe('provider registry', () => {
  it('defaults to the fixture catalogue', () => {
    expect(selectProvider('fixture', false).id).toBe('fixture');
    expect(selectProvider('nonsense', false).id).toBe('fixture');
  });

  it('falls back when Spotify is selected without a client id', () => {
    expect(selectProvider('spotify', false).id).toBe('fixture');
    expect(selectProvider('spotify', true).id).toBe('spotify');
  });
});
