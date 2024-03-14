import { artworkUrl } from '@/lib/media/artwork';
import { seededRandom } from '@/lib/media/seeded-random';
import type { Album, Artist, Playlist, Track } from '../types';

/**
 * The demo catalogue.
 *
 * Artists, albums and track titles here are invented. They exist so the app has
 * something real to render, sort, search, page and play without an API key and
 * without borrowing anyone's catalogue. Everything downstream — cover art,
 * audio, durations — is derived from the ids below, so the whole catalogue is
 * reproducible from this one file.
 */

/** Bumping this reshuffles every generated title, duration and clip. */
export const CATALOGUE_SEED = 'tonearm-v1';

/** Descriptors the mood planner scores against. Kept small on purpose. */
export const TAG_VOCABULARY = [
  'mellow',
  'driving',
  'nocturnal',
  'warm',
  'bright',
  'sparse',
  'dense',
  'melancholy',
  'uplifting',
  'hypnotic',
  'acoustic',
  'electronic',
  'orchestral',
  'lo-fi',
  'danceable',
  'focus'
] as const;

export type Tag = (typeof TAG_VOCABULARY)[number];

interface ArtistSeed {
  id: string;
  name: string;
  genres: string[];
  tags: Tag[];
  albums: { id: string; title: string; year: number; trackCount: number }[];
}

const ARTIST_SEEDS: ArtistSeed[] = [
  {
    id: 'ar-halden',
    name: 'Halden Vesper',
    genres: ['ambient', 'modern classical'],
    tags: ['mellow', 'sparse', 'focus', 'orchestral'],
    albums: [
      { id: 'al-longwater', title: 'Longwater', year: 2019, trackCount: 6 },
      { id: 'al-pale-index', title: 'Pale Index', year: 2022, trackCount: 5 }
    ]
  },
  {
    id: 'ar-kestrel',
    name: 'Kestrel Dial',
    genres: ['synth-pop'],
    tags: ['bright', 'danceable', 'electronic', 'uplifting'],
    albums: [
      { id: 'al-signal-hour', title: 'Signal Hour', year: 2021, trackCount: 6 },
      { id: 'al-teleferic', title: 'Teleferic', year: 2024, trackCount: 5 }
    ]
  },
  {
    id: 'ar-mossbank',
    name: 'Mossbank Union',
    genres: ['folk', 'americana'],
    tags: ['acoustic', 'warm', 'melancholy'],
    albums: [{ id: 'al-fieldnotes', title: 'Fieldnotes', year: 2018, trackCount: 6 }]
  },
  {
    id: 'ar-nocturne',
    name: 'Nocturne Freight',
    genres: ['post-rock'],
    tags: ['dense', 'driving', 'nocturnal'],
    albums: [
      { id: 'al-slow-cargo', title: 'Slow Cargo', year: 2020, trackCount: 5 },
      { id: 'al-nightyard', title: 'Nightyard', year: 2023, trackCount: 6 }
    ]
  },
  {
    id: 'ar-pellucid',
    name: 'Pellucid',
    genres: ['downtempo', 'trip-hop'],
    tags: ['nocturnal', 'hypnotic', 'lo-fi', 'mellow'],
    albums: [{ id: 'al-quiet-static', title: 'Quiet Static', year: 2022, trackCount: 6 }]
  },
  {
    id: 'ar-brindle',
    name: 'Brindle & Ash',
    genres: ['indie rock'],
    tags: ['driving', 'bright', 'danceable'],
    albums: [{ id: 'al-hot-glass', title: 'Hot Glass', year: 2023, trackCount: 6 }]
  },
  {
    id: 'ar-oriel',
    name: 'Oriel Sound Company',
    genres: ['jazz', 'soul'],
    tags: ['warm', 'mellow', 'acoustic'],
    albums: [{ id: 'al-brass-weather', title: 'Brass Weather', year: 2017, trackCount: 5 }]
  },
  {
    id: 'ar-severin',
    name: 'Severin Loop',
    genres: ['techno', 'minimal'],
    tags: ['hypnotic', 'driving', 'electronic', 'dense'],
    albums: [{ id: 'al-ferrous', title: 'Ferrous', year: 2024, trackCount: 6 }]
  },
  {
    id: 'ar-thalia',
    name: 'Thalia Wren',
    genres: ['singer-songwriter'],
    tags: ['melancholy', 'sparse', 'acoustic', 'focus'],
    albums: [{ id: 'al-nine-rooms', title: 'Nine Rooms', year: 2021, trackCount: 6 }]
  },
  {
    id: 'ar-umber',
    name: 'Umber Cartographers',
    genres: ['ambient', 'drone'],
    tags: ['sparse', 'hypnotic', 'focus', 'nocturnal'],
    albums: [{ id: 'al-contour-lines', title: 'Contour Lines', year: 2020, trackCount: 5 }]
  },
  {
    id: 'ar-verdigris',
    name: 'Verdigris Choir',
    genres: ['choral', 'orchestral'],
    tags: ['orchestral', 'uplifting', 'warm'],
    albums: [{ id: 'al-anthems-small', title: 'Anthems for Small Rooms', year: 2019, trackCount: 5 }]
  },
  {
    id: 'ar-wilder',
    name: 'Wilder Tape Club',
    genres: ['lo-fi', 'hip hop'],
    tags: ['lo-fi', 'mellow', 'focus', 'danceable'],
    albums: [{ id: 'al-basement-hours', title: 'Basement Hours', year: 2025, trackCount: 6 }]
  }
];

const TITLE_HEADS = [
  'Harbour',
  'Copper',
  'Winter',
  'Lantern',
  'Paper',
  'Glasshouse',
  'Quarry',
  'Marlow',
  'Tidal',
  'Iron',
  'Velvet',
  'Northgate',
  'Amber',
  'Hollow',
  'Ridgeway',
  'Saltmarsh',
  'Brass',
  'Cinder',
  'Drift',
  'Ember'
];

const TITLE_TAILS = [
  'Lights',
  'Season',
  'Machine',
  'Letters',
  'Weather',
  'Interval',
  'Crossing',
  'Almanac',
  'Signal',
  'Corridor',
  'Garden',
  'Frequency',
  'Ledger',
  'Window',
  'Anthem',
  'Circuit',
  'Motion',
  'Hymn',
  'Rooms',
  'Chorus'
];

// Each fixture track is a synthesised clip of exactly this length, and the
// catalogue advertises that same length, so the seek bar measures real audio.
const MIN_CLIP_SECONDS = 48;
const MAX_CLIP_SECONDS = 96;

export interface Catalogue {
  artists: Artist[];
  albums: Album[];
  tracks: Track[];
  playlists: Playlist[];
  byId: Map<string, Track>;
}

function trackTitle(rand: ReturnType<typeof seededRandom>): string {
  const head = rand.pick(TITLE_HEADS);
  const tail = rand.pick(TITLE_TAILS);
  return rand.next() < 0.18 ? `${head} ${tail} (Reprise)` : `${head} ${tail}`;
}

/**
 * Builds the whole catalogue. Pure and deterministic — call it as often as you
 * like, but `lib/catalogue/fixture/provider.ts` memoises one instance.
 */
export function buildCatalogue(seed: string = CATALOGUE_SEED): Catalogue {
  const artists: Artist[] = [];
  const albums: Album[] = [];
  const tracks: Track[] = [];

  for (const artistSeed of ARTIST_SEEDS) {
    artists.push({ id: artistSeed.id, name: artistSeed.name, genres: artistSeed.genres });

    for (const albumSeed of artistSeed.albums) {
      const rand = seededRandom(`${seed}:${albumSeed.id}`);
      const trackIds: string[] = [];

      for (let index = 0; index < albumSeed.trackCount; index += 1) {
        const trackId = `${albumSeed.id}-t${index + 1}`;
        const durationSeconds = rand.int(MIN_CLIP_SECONDS, MAX_CLIP_SECONDS);
        const extraTag = rand.pick(TAG_VOCABULARY);

        tracks.push({
          id: trackId,
          title: trackTitle(rand),
          artist: artistSeed.name,
          artistId: artistSeed.id,
          album: albumSeed.title,
          albumId: albumSeed.id,
          durationMs: durationSeconds * 1000,
          artworkUrl: artworkUrl(albumSeed.id),
          audioUrl: `/api/audio/${trackId}`,
          tags: Array.from(new Set<string>([...artistSeed.tags, extraTag])),
          tempo: rand.int(62, 148),
          energy: Number((0.12 + rand.next() * 0.84).toFixed(2)),
          year: albumSeed.year
        });
        trackIds.push(trackId);
      }

      albums.push({
        id: albumSeed.id,
        title: albumSeed.title,
        artist: artistSeed.name,
        artistId: artistSeed.id,
        year: albumSeed.year,
        artworkUrl: artworkUrl(albumSeed.id),
        trackIds
      });
    }
  }

  const playlists = buildPlaylists(tracks);

  return {
    artists,
    albums,
    tracks,
    playlists,
    byId: new Map(tracks.map((track) => [track.id, track]))
  };
}

interface PlaylistSeed {
  id: string;
  title: string;
  description: string;
  matches: (track: Track) => boolean;
  limit: number;
}

const PLAYLIST_SEEDS: PlaylistSeed[] = [
  {
    id: 'pl-late-shift',
    title: 'Late Shift',
    description: 'Low light, low tempo, nothing that demands a decision.',
    matches: (track) => track.tags.includes('nocturnal') || track.tempo < 85,
    limit: 12
  },
  {
    id: 'pl-deep-focus',
    title: 'Deep Focus',
    description: 'Sparse and repetitive on purpose. Nothing with a chorus to sing along to.',
    matches: (track) => track.tags.includes('focus') || track.tags.includes('sparse'),
    limit: 12
  },
  {
    id: 'pl-first-light',
    title: 'First Light',
    description: 'Bright, warm and moving forward.',
    matches: (track) => track.tags.includes('bright') || track.tags.includes('uplifting'),
    limit: 12
  },
  {
    id: 'pl-long-drive',
    title: 'Long Drive',
    description: 'Steady momentum for a road that will not end soon.',
    matches: (track) => track.tags.includes('driving') && track.energy > 0.4,
    limit: 12
  },
  {
    id: 'pl-paper-and-wood',
    title: 'Paper and Wood',
    description: 'Acoustic sources, no synthesis.',
    matches: (track) => track.tags.includes('acoustic'),
    limit: 12
  },
  {
    id: 'pl-current-wire',
    title: 'Current and Wire',
    description: 'Everything here started life as voltage.',
    matches: (track) => track.tags.includes('electronic'),
    limit: 12
  }
];

function buildPlaylists(tracks: Track[]): Playlist[] {
  return PLAYLIST_SEEDS.map((playlistSeed) => ({
    id: playlistSeed.id,
    title: playlistSeed.title,
    description: playlistSeed.description,
    artworkUrl: artworkUrl(playlistSeed.id),
    trackIds: tracks
      .filter(playlistSeed.matches)
      .slice(0, playlistSeed.limit)
      .map((track) => track.id)
  }));
}
