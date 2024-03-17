'use client';

import { useEffect, useState } from 'react';
import { readAccessToken, SESSION_CHANGED_EVENT } from '@/lib/catalogue/spotify/tokens';

/**
 * Whether a Spotify access token is present.
 *
 * The value is read fresh inside the listener rather than captured once at
 * mount — a handler that closes over the initial value can only ever set the
 * state it already had.
 */
export function useSpotifySession(): boolean {
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const sync = () => setHasSession(Boolean(readAccessToken()));
    sync();

    window.addEventListener(SESSION_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return hasSession;
}
