import type { Track } from '@/lib/catalogue/types';
import { LEXICON, tokenise, type MoodSignal } from './lexicon';
import type { MoodPlan, MoodPlanEntry, MoodPlanner, MoodRequest } from './types';

/**
 * Turns a sentence into a playlist without leaving the machine.
 *
 * Three steps: read the prompt into tag weights and tempo/energy targets
 * (`interpret`), score every track against them (`scoreTrack`), then take the
 * best, capped at two per artist so a twelve-track list is not one album.
 *
 * It is deterministic. The same prompt gives the same playlist every time,
 * which is what makes it testable and what makes it a usable fallback for a
 * hosted model rather than a placeholder.
 */

const TAG_WEIGHT = 10;
/** Beyond this many bpm from the target, a track scores as "wrong tempo". */
const TEMPO_TOLERANCE_BPM = 45;
/** What a completely wrong tempo leaves of a track's descriptor score. */
const TEMPO_FLOOR = 0.35;
/** Given to every track so tempo and energy still order the unmatched ones. */
const BASE_SCORE = 6;
const ENERGY_WEIGHT = 14;
const MAX_PER_ARTIST = 2;
const DEFAULT_TEMPO = 100;
const DEFAULT_ENERGY = 0.5;

export interface MoodInterpretation {
  tagWeights: Map<string, number>;
  targetTempo: number;
  targetEnergy: number;
  matchedWords: string[];
}

/** The prompt-reading step, exposed so tests can assert on it directly. */
export function interpret(prompt: string): MoodInterpretation {
  const tagWeights = new Map<string, number>();
  const matchedWords: string[] = [];
  const tempos: number[] = [];
  const energies: number[] = [];

  for (const word of tokenise(prompt)) {
    const signal: MoodSignal | undefined = LEXICON[word];
    if (!signal) {
      continue;
    }
    matchedWords.push(word);
    for (const [tag, weight] of Object.entries(signal.tags)) {
      tagWeights.set(tag, (tagWeights.get(tag) ?? 0) + (weight ?? 0));
    }
    if (signal.tempo !== undefined) {
      tempos.push(signal.tempo);
    }
    if (signal.energy !== undefined) {
      energies.push(signal.energy);
    }
  }

  const mean = (values: number[], fallback: number) =>
    values.length === 0 ? fallback : values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    tagWeights,
    targetTempo: mean(tempos, DEFAULT_TEMPO),
    targetEnergy: mean(energies, DEFAULT_ENERGY),
    matchedWords
  };
}

/**
 * Descriptor match decides *which* tracks are candidates, tempo decides the
 * order among them. Tempo is therefore a multiplier rather than another
 * addend: added, it was worth a few points against a tag score of a hundred,
 * and the planner cheerfully put a 139 bpm track in a list for reading at
 * night.
 */
export function scoreTrack(track: Track, interpretation: MoodInterpretation): number {
  let descriptorScore = BASE_SCORE;
  for (const tag of track.tags) {
    descriptorScore += (interpretation.tagWeights.get(tag) ?? 0) * TAG_WEIGHT;
  }

  const tempoGap = Math.abs(track.tempo - interpretation.targetTempo);
  const tempoCloseness = Math.max(0, 1 - tempoGap / TEMPO_TOLERANCE_BPM);
  const energyCloseness = 1 - Math.abs(track.energy - interpretation.targetEnergy);

  return (
    descriptorScore * (TEMPO_FLOOR + (1 - TEMPO_FLOOR) * tempoCloseness) + energyCloseness * ENERGY_WEIGHT
  );
}

function explain(track: Track, interpretation: MoodInterpretation): string {
  const strongest = track.tags
    .filter((tag) => (interpretation.tagWeights.get(tag) ?? 0) > 0)
    .sort((a, b) => (interpretation.tagWeights.get(b) ?? 0) - (interpretation.tagWeights.get(a) ?? 0));

  if (strongest.length > 0) {
    return `${strongest.slice(0, 2).join(' and ')} at ${track.tempo} bpm`;
  }
  return `${track.tempo} bpm, close to the tempo you asked for`;
}

function titleFor(interpretation: MoodInterpretation, prompt: string): string {
  if (interpretation.matchedWords.length === 0) {
    return 'Mixed selection';
  }
  const words = interpretation.matchedWords.slice(0, 2).map((word) => word[0].toUpperCase() + word.slice(1));
  return words.length === 2
    ? `${words[0]} and ${words[1]}`
    : `${words[0]} ${prompt.length > 40 ? 'set' : 'mix'}`;
}

export class LocalMoodPlanner implements MoodPlanner {
  readonly id = 'local';
  readonly displayName = 'Local planner';
  readonly isOffline = true;

  async plan(request: MoodRequest, tracks: readonly Track[]): Promise<MoodPlan> {
    const interpretation = interpret(request.prompt);
    const perArtist = new Map<string, number>();
    const entries: MoodPlanEntry[] = [];

    const ranked = tracks
      .map((track) => ({ track, score: scoreTrack(track, interpretation) }))
      .sort((a, b) => b.score - a.score || a.track.id.localeCompare(b.track.id));

    for (const { track, score } of ranked) {
      if (entries.length >= request.size) {
        break;
      }
      const used = perArtist.get(track.artistId) ?? 0;
      if (used >= MAX_PER_ARTIST) {
        continue;
      }
      perArtist.set(track.artistId, used + 1);
      entries.push({ track, score, reason: explain(track, interpretation) });
    }

    const rationale =
      interpretation.matchedWords.length > 0
        ? `Read "${interpretation.matchedWords.join(', ')}" from your description and aimed for about ${Math.round(interpretation.targetTempo)} bpm.`
        : 'Nothing in that description matched the catalogue vocabulary, so this is a mid-tempo spread across the library.';

    return {
      title: titleFor(interpretation, request.prompt),
      rationale,
      entries,
      plannerId: this.id
    };
  }
}
