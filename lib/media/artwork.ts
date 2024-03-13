import { seededRandom } from './seeded-random';

/**
 * Cover art, generated.
 *
 * The demo catalogue is invented, so its artwork has to be too. Hotlinking
 * real album covers would put someone else's copyrighted images in a portfolio
 * repo, so instead every cover is a deterministic SVG derived from the album
 * id: same id, same picture, forever, and nothing to store.
 */

export const ARTWORK_SIZE = 640;

/** Hue pairs that stay legible against the app's near-black surfaces. */
const PALETTES: readonly [number, number][] = [
  [18, 44],
  [340, 22],
  [268, 320],
  [196, 262],
  [148, 196],
  [38, 8],
  [286, 200],
  [4, 40]
];

type Motif = 'arcs' | 'bars' | 'grooves' | 'orbit';

const MOTIFS: readonly Motif[] = ['arcs', 'bars', 'grooves', 'orbit'];

function shapes(motif: Motif, rand: ReturnType<typeof seededRandom>): string {
  const size = ARTWORK_SIZE;
  const centre = size / 2;
  const parts: string[] = [];

  switch (motif) {
    case 'arcs': {
      const rings = rand.int(4, 7);
      for (let i = 0; i < rings; i += 1) {
        const radius = (size / 2) * (0.22 + (i / rings) * 0.78);
        const width = rand.int(4, 18);
        parts.push(
          `<circle cx="${centre}" cy="${centre}" r="${radius.toFixed(1)}" fill="none" stroke="rgba(255,255,255,${(0.08 + rand.next() * 0.22).toFixed(3)})" stroke-width="${width}"/>`
        );
      }
      break;
    }
    case 'bars': {
      const bars = rand.int(7, 13);
      const gap = size / bars;
      for (let i = 0; i < bars; i += 1) {
        const height = size * (0.12 + rand.next() * 0.78);
        parts.push(
          `<rect x="${(i * gap + gap * 0.18).toFixed(1)}" y="${(size - height).toFixed(1)}" width="${(gap * 0.64).toFixed(1)}" height="${height.toFixed(1)}" rx="${(gap * 0.32).toFixed(1)}" fill="rgba(255,255,255,${(0.07 + rand.next() * 0.2).toFixed(3)})"/>`
        );
      }
      break;
    }
    case 'grooves': {
      const lines = rand.int(12, 22);
      for (let i = 0; i < lines; i += 1) {
        const y = (i / lines) * size + rand.next() * 8;
        parts.push(
          `<rect x="0" y="${y.toFixed(1)}" width="${size}" height="${rand.int(2, 9)}" fill="rgba(0,0,0,${(0.05 + rand.next() * 0.18).toFixed(3)})"/>`
        );
      }
      break;
    }
    case 'orbit': {
      const dots = rand.int(5, 9);
      for (let i = 0; i < dots; i += 1) {
        const angle = (i / dots) * Math.PI * 2 + rand.next();
        const radius = size * (0.16 + rand.next() * 0.3);
        parts.push(
          `<circle cx="${(centre + Math.cos(angle) * radius).toFixed(1)}" cy="${(centre + Math.sin(angle) * radius).toFixed(1)}" r="${rand.int(14, 58)}" fill="rgba(255,255,255,${(0.06 + rand.next() * 0.2).toFixed(3)})"/>`
        );
      }
      break;
    }
  }

  return parts.join('');
}

/**
 * Returns a complete, self-contained SVG document for `seed`.
 * Deterministic: the same seed always returns the identical string.
 */
export function renderArtwork(seed: string): string {
  const rand = seededRandom(`artwork:${seed}`);
  const [hueA, hueB] = rand.pick(PALETTES);
  const motif = rand.pick(MOTIFS);
  const angle = rand.int(0, 3) * 45;
  const size = ARTWORK_SIZE;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Generated cover art">`,
    '<defs>',
    `<linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">`,
    `<stop offset="0%" stop-color="hsl(${hueA} 68% ${rand.int(38, 56)}%)"/>`,
    `<stop offset="100%" stop-color="hsl(${hueB} 62% ${rand.int(12, 26)}%)"/>`,
    '</linearGradient>',
    '</defs>',
    `<rect width="${size}" height="${size}" fill="url(#g)"/>`,
    shapes(motif, rand),
    `<rect width="${size}" height="${size}" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="2"/>`,
    '</svg>'
  ].join('');
}

/** The URL the catalogue puts on a track or album. */
export function artworkUrl(seed: string): string {
  return `/api/art/${encodeURIComponent(seed)}`;
}
