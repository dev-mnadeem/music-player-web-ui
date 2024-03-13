/**
 * A tiny deterministic PRNG.
 *
 * Every generated asset in the demo catalogue — cover art, audio, the fixture
 * data itself — is derived from a string seed through this, so the same repo
 * on two machines produces byte-identical output and the tests can assert on
 * exact values instead of ranges.
 */

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** 32-bit FNV-1a. Not a security hash — a spreading function. */
export function hashSeed(seed: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}

export interface SeededRandom {
  /** Uniform in [0, 1). */
  next(): number;
  /** Integer in [min, max]. */
  int(min: number, max: number): number;
  /** Uniformly picks one element. Throws on an empty list. */
  pick<T>(items: readonly T[]): T;
}

/** mulberry32, seeded by `hashSeed`. */
export function seededRandom(seed: string): SeededRandom {
  let state = hashSeed(seed);

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => {
      if (items.length === 0) {
        throw new Error('seededRandom.pick: cannot pick from an empty list');
      }
      return items[Math.floor(next() * items.length)];
    }
  };
}
