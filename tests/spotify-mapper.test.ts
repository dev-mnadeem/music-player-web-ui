import { describe, expect, it } from 'vitest';
import { toTrack, toTracks, type SpotifyTrackDto } from '@/lib/catalogue/spotify/mapper';

const full: SpotifyTrackDto = {
  id: '1',
  name: 'A Title',
  duration_ms: 214_000,
  artists: [{ id: 'ar1', name: 'An Artist' }],
  album: {
    id: 'al1',
    name: 'An Album',
    release_date: '2019-04-02',
    images: [{ url: 'https://example.test/cover.jpg' }]
  }
};

describe('toTrack', () => {
  it('maps a complete payload', () => {
    const track = toTrack(full);
    expect(track).toMatchObject({
      id: '1',
      title: 'A Title',
      artist: 'An Artist',
      album: 'An Album',
      durationMs: 214_000,
      artworkUrl: 'https://example.test/cover.jpg',
      year: 2019
    });
  });

  it('never claims it can stream, because the Web API does not hand over audio', () => {
    expect(toTrack(full).audioUrl).toBeNull();
  });

  it('survives an album with no images instead of throwing', () => {
    const track = toTrack({ id: '2', name: 'No Art', album: { name: 'X', images: [] } });
    expect(track.artworkUrl).toBe('/api/art/spotify-unknown');
  });

  it('survives a missing album and artist list', () => {
    const track = toTrack({ id: '3', name: 'Bare' });
    expect(track.artist).toBe('Unknown artist');
    expect(track.album).toBe('Unknown album');
    expect(track.durationMs).toBe(0);
    expect(track.year).toBe(0);
  });
});

describe('toTracks', () => {
  it('drops null entries, which saved-track responses really contain', () => {
    expect(toTracks([full, null, undefined, { id: '', name: '' }])).toHaveLength(1);
  });

  it('handles a missing items array', () => {
    expect(toTracks(undefined)).toEqual([]);
  });
});
