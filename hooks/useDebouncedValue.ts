'use client';

import { useEffect, useState } from 'react';

/**
 * Returns `value` once it has stopped changing for `delayMs`.
 *
 * The timer is cleared from the effect's own cleanup, which is the part that
 * makes it a debounce rather than a delay: without it every keystroke still
 * fires its own request, just a second late.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
