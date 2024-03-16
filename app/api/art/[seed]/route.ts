import { renderArtwork } from '@/lib/media/artwork';

/** A year: the SVG for a given seed never changes, so it is safe to cache hard. */
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

export async function GET(_request: Request, context: { params: Promise<{ seed: string }> }) {
  const { seed } = await context.params;

  return new Response(renderArtwork(seed), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': CACHE_CONTROL
    }
  });
}
