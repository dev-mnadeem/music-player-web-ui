/**
 * Where "saved tracks" live for the fixture catalogue.
 *
 * The browser gets localStorage so a reload keeps your library. Server-side
 * rendering and the test runner get an in-memory map, which keeps the provider
 * usable outside a browser without every call needing a `typeof window` guard.
 */

export interface LibraryStore {
  read(): string[];
  write(ids: string[]): void;
}

export const LIBRARY_STORAGE_KEY = 'tonearm.library.v1';

export function createMemoryStore(initial: string[] = []): LibraryStore {
  let ids = [...initial];
  return {
    read: () => [...ids],
    write: (next) => {
      ids = [...next];
    }
  };
}

export function createLocalStorageStore(storage: Storage): LibraryStore {
  return {
    read: () => {
      try {
        const raw = storage.getItem(LIBRARY_STORAGE_KEY);
        if (!raw) {
          return [];
        }
        const parsed: unknown = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
      } catch {
        // A corrupt or quota-blocked store should not take the page down.
        return [];
      }
    },
    write: (ids) => {
      try {
        storage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(ids));
      } catch {
        /* storage full or disabled — the in-page state is still correct */
      }
    }
  };
}

/** Picks the right store for wherever this module happens to be running. */
export function defaultLibraryStore(): LibraryStore {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return createLocalStorageStore(window.localStorage);
  }
  return createMemoryStore();
}
