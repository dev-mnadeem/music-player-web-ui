import type { Track } from '../types';

/** The subset of Spotify's track object this app reads. */
export interface SpotifyTrackDto {
  id: string;
  name: string;
  uri?: string;
  duration_ms?: number;
  artists?: { id?: string; name?: string }[];
  album?: {
    id?: string;
    name?: string;
    release_date?: string;
    images?: { url: string; width?: number; height?: number }[];
  };
}

const PLACEHOLDER_ARTWORK = '/api/art/spotify-unknown';
const UNKNOWN_ARTIST = 'Unknown artist';
const UNKNOWN_ALBUM = 'Unknown album';

function releaseYear(releaseDate: string | undefined): number {
  const year = Number.parseInt(releaseDate?.slice(0, 4) ?? '', 10);
  return Number.isFinite(year) ? year : 0;
}

/**
 * Turns a Spotify track into the app's `Track`.
 *
 * Every field Spotify marks optional is treated as optional — an album with no
 * images is a real response, and indexing straight into `images[0].url` is how
 * a search result page turns into a blank screen.
 */
export function toTrack(dto: SpotifyTrackDto): Track {
  const artist = dto.artists?.[0];
  return {
    id: dto.id,
    title: dto.name,
    artist: artist?.name ?? UNKNOWN_ARTIST,
    artistId: artist?.id ?? '',
    album: dto.album?.name ?? UNKNOWN_ALBUM,
    albumId: dto.album?.id ?? '',
    durationMs: dto.duration_ms ?? 0,
    artworkUrl: dto.album?.images?.[0]?.url ?? PLACEHOLDER_ARTWORK,
    // Spotify only streams through its own DRM-bound SDK, so this adapter
    // returns metadata the transport controls will refuse to play.
    audioUrl: null,
    tags: [],
    tempo: 0,
    energy: 0,
    year: releaseYear(dto.album?.release_date)
  };
}

export function toTracks(items: readonly (SpotifyTrackDto | null | undefined)[] | undefined): Track[] {
  return (items ?? []).filter((item): item is SpotifyTrackDto => Boolean(item?.id)).map(toTrack);
}
