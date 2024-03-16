import type { Tag } from '@/lib/catalogue/fixture/seed';

/**
 * How words in a prompt become catalogue descriptors.
 *
 * This is the whole "understanding" step of the local planner, written out
 * where it can be read and argued with. Each entry raises the weight of some
 * tags and, optionally, nudges the tempo and energy targets.
 */

export interface MoodSignal {
  tags: Partial<Record<Tag, number>>;
  /** Beats per minute the planner will aim for. */
  tempo?: number;
  /** 0-1 drive target. */
  energy?: number;
}

export const LEXICON: Record<string, MoodSignal> = {
  quiet: { tags: { sparse: 3, mellow: 2 }, tempo: 70, energy: 0.2 },
  calm: { tags: { mellow: 3, warm: 1 }, tempo: 74, energy: 0.22 },
  chill: { tags: { mellow: 3, 'lo-fi': 2 }, tempo: 80, energy: 0.3 },
  relax: { tags: { mellow: 3, warm: 2 }, tempo: 72, energy: 0.2 },
  sleep: { tags: { sparse: 3, hypnotic: 2 }, tempo: 62, energy: 0.12 },
  focus: { tags: { focus: 4, sparse: 2, hypnotic: 1 }, tempo: 96, energy: 0.35 },
  work: { tags: { focus: 3, 'lo-fi': 1 }, tempo: 98, energy: 0.38 },
  study: { tags: { focus: 4, sparse: 1 }, tempo: 92, energy: 0.3 },
  reading: { tags: { sparse: 3, focus: 2, orchestral: 1 }, tempo: 74, energy: 0.2 },
  night: { tags: { nocturnal: 4, mellow: 1 }, tempo: 84, energy: 0.35 },
  late: { tags: { nocturnal: 3 }, tempo: 82, energy: 0.32 },
  morning: { tags: { bright: 3, uplifting: 2 }, tempo: 108, energy: 0.55 },
  sunny: { tags: { bright: 3, warm: 2 }, tempo: 112, energy: 0.6 },
  happy: { tags: { uplifting: 4, bright: 2 }, tempo: 118, energy: 0.68 },
  sad: { tags: { melancholy: 4 }, tempo: 76, energy: 0.25 },
  melancholy: { tags: { melancholy: 4, sparse: 1 }, tempo: 74, energy: 0.24 },
  energetic: { tags: { driving: 4, danceable: 2 }, tempo: 134, energy: 0.85 },
  workout: { tags: { driving: 4, danceable: 3, dense: 1 }, tempo: 140, energy: 0.9 },
  run: { tags: { driving: 4, danceable: 2 }, tempo: 138, energy: 0.88 },
  running: { tags: { driving: 4, danceable: 2 }, tempo: 138, energy: 0.88 },
  dance: { tags: { danceable: 4, electronic: 2 }, tempo: 126, energy: 0.8 },
  party: { tags: { danceable: 4, uplifting: 2, dense: 1 }, tempo: 128, energy: 0.85 },
  drive: { tags: { driving: 4, nocturnal: 1 }, tempo: 120, energy: 0.7 },
  driving: { tags: { driving: 4 }, tempo: 120, energy: 0.7 },
  acoustic: { tags: { acoustic: 4 }, energy: 0.35 },
  guitar: { tags: { acoustic: 3, warm: 1 } },
  folk: { tags: { acoustic: 3, warm: 2 } },
  electronic: { tags: { electronic: 4 }, energy: 0.6 },
  synth: { tags: { electronic: 4, bright: 1 }, energy: 0.6 },
  techno: { tags: { electronic: 4, hypnotic: 3, driving: 2 }, tempo: 132, energy: 0.85 },
  orchestral: { tags: { orchestral: 4 } },
  classical: { tags: { orchestral: 4, sparse: 1 }, tempo: 78, energy: 0.3 },
  jazz: { tags: { warm: 3, acoustic: 2 }, tempo: 96, energy: 0.4 },
  ambient: { tags: { sparse: 4, hypnotic: 2 }, tempo: 66, energy: 0.15 },
  warm: { tags: { warm: 4 } },
  bright: { tags: { bright: 4 } },
  dark: { tags: { nocturnal: 3, melancholy: 2, dense: 1 }, energy: 0.45 },
  heavy: { tags: { dense: 4, driving: 2 }, energy: 0.8 },
  minimal: { tags: { sparse: 4, hypnotic: 2 }, energy: 0.25 },
  repetitive: { tags: { hypnotic: 4 } },
  rain: { tags: { melancholy: 2, mellow: 2, 'lo-fi': 1 }, tempo: 76, energy: 0.25 },
  coding: { tags: { focus: 4, hypnotic: 2, electronic: 1 }, tempo: 104, energy: 0.4 }
};

/** Tokens that carry no mood, so matching them would only add noise. */
export const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'for',
  'from',
  'i',
  'in',
  'is',
  'it',
  'me',
  'my',
  'of',
  'on',
  'or',
  'playlist',
  'music',
  'songs',
  'song',
  'something',
  'sound',
  'the',
  'to',
  'track',
  'tracks',
  'want',
  'with'
]);

export function tokenise(prompt: string): string[] {
  return prompt
    .toLowerCase()
    .split(/[^a-z-]+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word));
}
