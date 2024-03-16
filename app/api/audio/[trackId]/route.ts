import { buildCatalogue } from '@/lib/catalogue/fixture/seed';
import { encodeWav, SAMPLE_RATE, synthesiseClip } from '@/lib/media/wav';

const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const MS_PER_SECOND = 1000;

/** Built once per server process — the catalogue is pure and never changes. */
const catalogue = buildCatalogue();

/**
 * Renders a track's audio.
 *
 * The clip is synthesised from the track id at exactly the duration the
 * catalogue advertises, so the seek bar in the player is measuring something
 * real. Nothing is stored on disk: the same id always produces the same bytes.
 */
export async function GET(_request: Request, context: { params: Promise<{ trackId: string }> }) {
  const { trackId } = await context.params;
  const track = catalogue.byId.get(trackId);

  if (!track) {
    return new Response('No such track', { status: 404 });
  }

  const samples = synthesiseClip(trackId, track.durationMs / MS_PER_SECOND, SAMPLE_RATE);
  const wav = encodeWav(samples, SAMPLE_RATE);
  // Hand the Response its own ArrayBuffer rather than the view over it.
  const body = wav.buffer.slice(wav.byteOffset, wav.byteOffset + wav.byteLength) as ArrayBuffer;

  return new Response(body, {
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': String(body.byteLength),
      'Cache-Control': CACHE_CONTROL
    }
  });
}
