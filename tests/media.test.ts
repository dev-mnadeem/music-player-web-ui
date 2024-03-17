import { describe, expect, it } from 'vitest';
import { renderArtwork } from '@/lib/media/artwork';
import { hashSeed, seededRandom } from '@/lib/media/seeded-random';
import { clipSpec, encodeWav, midiToHz, SAMPLE_RATE, synthesiseClip, wavByteLength } from '@/lib/media/wav';

describe('seededRandom', () => {
  it('is reproducible for the same seed', () => {
    const a = seededRandom('al-longwater');
    const b = seededRandom('al-longwater');
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()]);
  });

  it('separates different seeds', () => {
    expect(seededRandom('one').next()).not.toBe(seededRandom('two').next());
    expect(hashSeed('one')).not.toBe(hashSeed('two'));
  });

  it('stays inside the requested integer range', () => {
    const rand = seededRandom('range');
    for (let i = 0; i < 200; i += 1) {
      const value = rand.int(3, 7);
      expect(value).toBeGreaterThanOrEqual(3);
      expect(value).toBeLessThanOrEqual(7);
    }
  });

  it('refuses to pick from an empty list', () => {
    expect(() => seededRandom('x').pick([])).toThrow(/empty list/);
  });
});

describe('renderArtwork', () => {
  it('produces one self-contained SVG document', () => {
    const svg = renderArtwork('al-longwater');
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')).toBe(true);
    expect(svg.endsWith('</svg>')).toBe(true);
    expect(svg).toContain('<linearGradient');
    expect(svg).not.toContain('http://localhost');
  });

  it('is deterministic per seed and different across seeds', () => {
    expect(renderArtwork('al-a')).toBe(renderArtwork('al-a'));
    expect(renderArtwork('al-a')).not.toBe(renderArtwork('al-b'));
  });
});

describe('midiToHz', () => {
  it('anchors on A4 = 440 Hz', () => {
    expect(midiToHz(69)).toBeCloseTo(440, 6);
    expect(midiToHz(57)).toBeCloseTo(220, 6);
  });
});

describe('encodeWav', () => {
  it('writes a RIFF/WAVE header the browser will accept', () => {
    const wav = encodeWav(new Float32Array(100), SAMPLE_RATE);
    const text = new TextDecoder('ascii').decode(wav.subarray(0, 4));
    expect(text).toBe('RIFF');
    expect(new TextDecoder('ascii').decode(wav.subarray(8, 12))).toBe('WAVE');

    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    expect(view.getUint16(20, true)).toBe(1); // PCM
    expect(view.getUint16(22, true)).toBe(1); // mono
    expect(view.getUint32(24, true)).toBe(SAMPLE_RATE);
    expect(view.getUint16(34, true)).toBe(16); // bits per sample
    expect(view.getUint32(40, true)).toBe(200); // data bytes
  });

  it('matches the byte length predicted without rendering', () => {
    expect(encodeWav(synthesiseClip('t', 0.5), SAMPLE_RATE).byteLength).toBe(wavByteLength(0.5));
  });

  it('clamps samples outside -1..1 instead of wrapping', () => {
    const wav = encodeWav(new Float32Array([2, -2]), SAMPLE_RATE);
    const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
    expect(view.getInt16(44, true)).toBe(32_767);
    expect(view.getInt16(46, true)).toBe(-32_767);
  });
});

describe('synthesiseClip', () => {
  it('renders exactly the requested duration', () => {
    expect(synthesiseClip('t1', 2).length).toBe(2 * SAMPLE_RATE);
  });

  it('is deterministic for a seed', () => {
    expect(Array.from(synthesiseClip('t1', 0.1))).toEqual(Array.from(synthesiseClip('t1', 0.1)));
  });

  it('produces different audio for different tracks', () => {
    expect(Array.from(synthesiseClip('t1', 0.1))).not.toEqual(Array.from(synthesiseClip('t2', 0.1)));
  });

  it('starts and ends near silence so the clip does not click', () => {
    const samples = synthesiseClip('t1', 1);
    expect(Math.abs(samples[0])).toBeLessThan(0.01);
    expect(Math.abs(samples[samples.length - 1])).toBeLessThan(0.01);
  });

  it('stays within the representable range', () => {
    const samples = synthesiseClip('t3', 1);
    for (const sample of samples) {
      expect(Math.abs(sample)).toBeLessThanOrEqual(1);
    }
  });

  it('picks a playable root note', () => {
    const spec = clipSpec('t1');
    expect(spec.rootMidi).toBeGreaterThanOrEqual(45);
    expect(spec.rootMidi).toBeLessThanOrEqual(57);
    expect(spec.noteCount).toBeGreaterThanOrEqual(5);
  });
});
