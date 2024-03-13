import { seededRandom } from './seeded-random';

/**
 * Audio, generated.
 *
 * The demo catalogue cannot ship real recordings, and a player with nothing to
 * play is a screenshot rather than a feature. So every fixture track is a short
 * synthesised piece: a pentatonic arpeggio over a drone, rendered to 16-bit PCM
 * on request. The clip length is the track's advertised duration, so the seek
 * bar tells the truth.
 */

export const SAMPLE_RATE = 22_050;
const BITS_PER_SAMPLE = 16;
const CHANNELS = 1;
const WAV_HEADER_BYTES = 44;
const INT16_MAX = 32_767;

/** Semitone offsets of a minor pentatonic scale, two octaves. */
const PENTATONIC = [0, 3, 5, 7, 10, 12, 15, 17, 19, 22, 24];
const A4_HZ = 440;
const A4_MIDI = 69;

export function midiToHz(midi: number): number {
  return A4_HZ * 2 ** ((midi - A4_MIDI) / 12);
}

/** Little-endian RIFF/WAVE, mono, 16-bit PCM. */
export function encodeWav(samples: Float32Array, sampleRate = SAMPLE_RATE): Uint8Array {
  const dataBytes = samples.length * 2;
  const buffer = new ArrayBuffer(WAV_HEADER_BYTES + dataBytes);
  const view = new DataView(buffer);

  const writeAscii = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeAscii(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  writeAscii(8, 'WAVE');
  writeAscii(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // format: PCM
  view.setUint16(22, CHANNELS, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, (sampleRate * CHANNELS * BITS_PER_SAMPLE) / 8, true); // byte rate
  view.setUint16(32, (CHANNELS * BITS_PER_SAMPLE) / 8, true); // block align
  view.setUint16(34, BITS_PER_SAMPLE, true);
  writeAscii(36, 'data');
  view.setUint32(40, dataBytes, true);

  for (let i = 0; i < samples.length; i += 1) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(WAV_HEADER_BYTES + i * 2, Math.round(clamped * INT16_MAX), true);
  }

  return new Uint8Array(buffer);
}

/** Percussive attack, slow decay — a plucked-string shape. */
function pluckEnvelope(position: number): number {
  const attack = 0.02;
  if (position < attack) {
    return position / attack;
  }
  return Math.exp(-3.4 * (position - attack));
}

export interface ClipSpec {
  rootMidi: number;
  noteCount: number;
  noteSeconds: number;
  droneGain: number;
  brightness: number;
}

/** The musical decisions for a seed, separated out so tests can read them. */
export function clipSpec(seed: string): ClipSpec {
  const rand = seededRandom(`audio:${seed}`);
  return {
    rootMidi: rand.int(45, 57),
    noteCount: rand.int(5, 9),
    noteSeconds: 0.28 + rand.next() * 0.22,
    droneGain: 0.1 + rand.next() * 0.1,
    brightness: 0.25 + rand.next() * 0.45
  };
}

/**
 * Renders `durationSeconds` of mono audio for `seed`.
 * Deterministic: identical seed and duration give identical samples.
 */
export function synthesiseClip(
  seed: string,
  durationSeconds: number,
  sampleRate = SAMPLE_RATE
): Float32Array {
  const spec = clipSpec(seed);
  const rand = seededRandom(`melody:${seed}`);
  const totalSamples = Math.max(1, Math.round(durationSeconds * sampleRate));
  const out = new Float32Array(totalSamples);

  const noteSamples = Math.round(spec.noteSeconds * sampleRate);
  const sequence = Array.from({ length: spec.noteCount }, () => rand.pick(PENTATONIC));
  const droneHz = midiToHz(spec.rootMidi - 12);

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(i / noteSamples) % sequence.length;
    const notePosition = (i % noteSamples) / sampleRate;
    const hz = midiToHz(spec.rootMidi + sequence[noteIndex]);
    const envelope = pluckEnvelope(notePosition);

    const fundamental = Math.sin(2 * Math.PI * hz * t);
    const overtone = Math.sin(4 * Math.PI * hz * t) * spec.brightness;
    const drone = Math.sin(2 * Math.PI * droneHz * t) * spec.droneGain;
    // Slow tremolo keeps a long clip from sounding like a held test tone.
    const tremolo = 0.86 + 0.14 * Math.sin(2 * Math.PI * 0.17 * t);

    out[i] = (((fundamental + overtone) / (1 + spec.brightness)) * envelope * 0.42 + drone) * tremolo;
  }

  // 40 ms fades so the clip neither clicks on play nor on loop.
  const fade = Math.min(Math.round(0.04 * sampleRate), Math.floor(totalSamples / 2));
  for (let i = 0; i < fade; i += 1) {
    const gain = i / fade;
    out[i] *= gain;
    out[totalSamples - 1 - i] *= gain;
  }

  return out;
}

/** Bytes an encoded clip of this length will occupy, without rendering it. */
export function wavByteLength(durationSeconds: number, sampleRate = SAMPLE_RATE): number {
  return WAV_HEADER_BYTES + Math.max(1, Math.round(durationSeconds * sampleRate)) * 2;
}
