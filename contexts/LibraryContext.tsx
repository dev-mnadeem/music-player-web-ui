'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCatalogue } from '@/lib/catalogue/registry';
import type { Track } from '@/lib/catalogue/types';

/**
 * The saved-tracks list, held once at the root.
 *
 * Saving is optimistic: the sidebar updates immediately and rolls back if the
 * provider rejects the write, because a save that appears to do nothing for
 * 300 ms reads as a broken button.
 */

interface LibraryContextValue {
  tracks: Track[];
  savedIds: Set<string>;
  isLoading: boolean;
  error: string | null;
  isSaved(trackId: string): boolean;
  toggleSaved(track: Track): Promise<void>;
  refresh(): Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

const LIBRARY_PAGE_SIZE = 100;

export function LibraryProvider({ children }: { children: ReactNode }) {
  const catalogue = useMemo(() => getCatalogue(), []);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const page = await catalogue.listLibrary({ limit: LIBRARY_PAGE_SIZE });
      setTracks(page.items);
      setError(null);
    } catch (cause) {
      setTracks([]);
      setError(cause instanceof Error ? cause.message : 'Could not load your library');
    } finally {
      setIsLoading(false);
    }
  }, [catalogue]);

  // Reading the saved list is precisely the "subscribe to an external system"
  // case effects exist for: the store lives outside React and there is no
  // render-time value to derive the list from.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await load();
  }, [load]);

  const savedIds = useMemo(() => new Set(tracks.map((track) => track.id)), [tracks]);

  const toggleSaved = useCallback(
    async (track: Track) => {
      const wasSaved = savedIds.has(track.id);
      const previous = tracks;
      setTracks(wasSaved ? tracks.filter((item) => item.id !== track.id) : [track, ...tracks]);

      try {
        if (wasSaved) {
          await catalogue.removeFromLibrary(track.id);
        } else {
          await catalogue.saveToLibrary(track.id);
        }
      } catch (cause) {
        setTracks(previous);
        setError(cause instanceof Error ? cause.message : 'Could not update your library');
      }
    },
    [catalogue, savedIds, tracks]
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      tracks,
      savedIds,
      isLoading,
      error,
      isSaved: (trackId: string) => savedIds.has(trackId),
      toggleSaved,
      refresh
    }),
    [tracks, savedIds, isLoading, error, toggleSaved, refresh]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used inside a <LibraryProvider>');
  }
  return context;
}
