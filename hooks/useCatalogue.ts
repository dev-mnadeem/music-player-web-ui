'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { CatalogueProvider } from '@/lib/catalogue/provider';
import { getCatalogue } from '@/lib/catalogue/registry';

export function useCatalogueProvider(): CatalogueProvider {
  return useMemo(() => getCatalogue(), []);
}

export interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

interface Settled<T> {
  key: string;
  data: T | null;
  error: string | null;
}

/**
 * Runs `load` whenever `key` changes and keeps the last settled result.
 *
 * Loading is derived — the state carries the key it settled for, so a result
 * that has not arrived yet is simply one whose key does not match — which
 * avoids a synchronous `setState` in the effect body and the extra render it
 * would cost. A sequence counter drops responses from superseded calls, so a
 * slow search for "a" cannot overwrite results for "ambient" typed after it.
 */
export function useAsync<T>(key: string, load: () => Promise<T>): AsyncState<T> {
  const [settled, setSettled] = useState<Settled<T>>({ key: '', data: null, error: null });
  const sequence = useRef(0);

  useEffect(() => {
    const ticket = ++sequence.current;

    // `load` is intentionally not a dependency: `key` is the caller's
    // statement of what the request depends on, and an effect that re-runs
    // always closes over the render it re-ran in, so `load` is never stale.
    load()
      .then((data) => {
        if (ticket === sequence.current) {
          setSettled({ key, data, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (ticket === sequence.current) {
          setSettled({
            key,
            data: null,
            error: cause instanceof Error ? cause.message : 'Something went wrong'
          });
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data: settled.data, error: settled.error, isLoading: settled.key !== key };
}
