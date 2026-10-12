'use client';

import { useEffect } from 'react';
import { useMixBox } from './store';

/** Reads the saved box once on the client; returns whether it has been read yet. */
export function useHydratedMixBox(): boolean {
  const hydrated = useMixBox((s) => s.hydrated);
  useEffect(() => {
    if (!useMixBox.persist.hasHydrated()) void useMixBox.persist.rehydrate();
  }, []);
  return hydrated;
}
