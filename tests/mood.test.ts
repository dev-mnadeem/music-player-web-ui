import { describe, expect, it } from 'vitest';
import { buildCatalogue } from '@/lib/catalogue/fixture/seed';
import { tokenise } from '@/lib/mood/lexicon';
import { interpret, LocalMoodPlanner, scoreTrack } from '@/lib/mood/local-planner';
import { getMoodPlanner, registeredPlannerIds } from '@/lib/mood/registry';

const tracks = buildCatalogue().tracks;
const planner = new LocalMoodPlanner();

describe('tokenise', () => {
  it('drops stop words and single characters', () => {
    expect(tokenise('something quiet for reading at night')).toEqual(['quiet', 'reading', 'at', 'night']);
  });

  it('splits on punctuation', () => {
    expect(tokenise('dark, heavy — driving!')).toEqual(['dark', 'heavy', 'driving']);
  });
});

describe('interpret', () => {
  it('reads mood words into tag weights', () => {
    const result = interpret('quiet music for reading at night');
    expect(result.matchedWords).toContain('quiet');
    expect(result.matchedWords).toContain('night');
    expect(result.tagWeights.get('sparse')).toBeGreaterThan(0);
  });

  it('averages the tempo targets of every matched word', () => {
    expect(interpret('workout running').targetTempo).toBeCloseTo(139, 5);
  });

  it('falls back to mid-tempo when nothing matches', () => {
    const result = interpret('zzzz qqqq');
    expect(result.matchedWords).toEqual([]);
    expect(result.targetTempo).toBe(100);
    expect(result.targetEnergy).toBe(0.5);
  });
});

describe('LocalMoodPlanner', () => {
  it('returns the requested number of tracks', async () => {
    const plan = await planner.plan({ prompt: 'calm acoustic morning', size: 12 }, tracks);
    expect(plan.entries).toHaveLength(12);
  });

  it('is deterministic', async () => {
    const first = await planner.plan({ prompt: 'repetitive electronic for coding', size: 10 }, tracks);
    const second = await planner.plan({ prompt: 'repetitive electronic for coding', size: 10 }, tracks);
    expect(first.entries.map((entry) => entry.track.id)).toEqual(
      second.entries.map((entry) => entry.track.id)
    );
  });

  it('never gives one artist more than two slots', async () => {
    const plan = await planner.plan({ prompt: 'ambient minimal', size: 12 }, tracks);
    const perArtist = new Map<string, number>();
    for (const entry of plan.entries) {
      perArtist.set(entry.track.artistId, (perArtist.get(entry.track.artistId) ?? 0) + 1);
    }
    expect(Math.max(...perArtist.values())).toBeLessThanOrEqual(2);
  });

  it('answers a workout prompt with faster music than a sleep prompt', async () => {
    const fast = await planner.plan({ prompt: 'workout running', size: 8 }, tracks);
    const slow = await planner.plan({ prompt: 'quiet sleep ambient', size: 8 }, tracks);
    const mean = (entries: typeof fast.entries) =>
      entries.reduce((sum, entry) => sum + entry.track.tempo, 0) / entries.length;
    expect(mean(fast.entries)).toBeGreaterThan(mean(slow.entries));
  });

  it('gives every pick a reason and says how it read the prompt', async () => {
    const plan = await planner.plan({ prompt: 'dark nocturnal electronic', size: 6 }, tracks);
    expect(plan.rationale).toContain('bpm');
    for (const entry of plan.entries) {
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it('still returns a mix when nothing in the prompt is recognised', async () => {
    const plan = await planner.plan({ prompt: 'qqqq zzzz', size: 5 }, tracks);
    expect(plan.entries).toHaveLength(5);
    expect(plan.title).toBe('Mixed selection');
    expect(plan.rationale).toContain('matched the catalogue vocabulary');
  });

  it('cannot return more tracks than the catalogue holds', async () => {
    const plan = await planner.plan({ prompt: 'calm', size: 9999 }, tracks.slice(0, 3));
    expect(plan.entries.length).toBeLessThanOrEqual(3);
  });
});

describe('planner registry', () => {
  it('registers the offline local planner and falls back to it', () => {
    expect(registeredPlannerIds()).toContain('local');
    expect(getMoodPlanner('does-not-exist').id).toBe('local');
    expect(getMoodPlanner('local').isOffline).toBe(true);
  });
});

describe('tempo weighting', () => {
  it('ranks an on-tempo track above an off-tempo one with the same descriptors', () => {
    const interpretation = interpret('quiet reading at night');
    const base = tracks.find((track) => track.tags.includes('sparse'));
    if (!base) {
      throw new Error('fixture catalogue has no sparse track');
    }
    const onTempo = { ...base, tempo: Math.round(interpretation.targetTempo) };
    const offTempo = { ...base, tempo: Math.round(interpretation.targetTempo) + 70 };
    expect(scoreTrack(onTempo, interpretation)).toBeGreaterThan(scoreTrack(offTempo, interpretation));
  });

  it('keeps a quiet-reading mix close to its tempo target', async () => {
    const plan = await planner.plan({ prompt: 'something quiet for reading at night', size: 8 }, tracks);
    const target = interpret('something quiet for reading at night').targetTempo;
    for (const entry of plan.entries) {
      expect(Math.abs(entry.track.tempo - target)).toBeLessThan(50);
    }
  });
});
