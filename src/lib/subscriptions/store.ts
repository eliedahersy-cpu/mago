'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeSessionStorage } from '@/lib/safe-storage';
import { DRAFT_KEY, EMPTY_DRAFT, sanitizeDraft, type SubscriptionDraft } from './draft';

interface DraftState {
  draft: SubscriptionDraft;
  hydrated: boolean;
  update: (patch: Partial<SubscriptionDraft>) => void;
  reset: () => void;
}

/** The subscribe flow in progress, in sessionStorage (it survives signing in, not closing the tab). */
export const useSubscriptionDraft = create<DraftState>()(
  persist(
    (set) => ({
      draft: EMPTY_DRAFT,
      hydrated: false,
      update: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      reset: () => set({ draft: EMPTY_DRAFT }),
    }),
    {
      name: DRAFT_KEY,
      version: 1,
      storage: createJSONStorage(safeSessionStorage),
      partialize: (s) => ({ draft: s.draft }),
      migrate: (persisted) => ({ draft: sanitizeDraft((persisted as { draft?: unknown } | null)?.draft) }),
      merge: (persisted, current) => ({ ...current, draft: sanitizeDraft((persisted as { draft?: unknown } | null)?.draft) }),
      skipHydration: true,
      onRehydrateStorage: () => () => useSubscriptionDraft.setState({ hydrated: true }),
    },
  ),
);

/** Reads the saved draft once on the client; returns whether it has been read yet. */
export function useHydratedDraft(): boolean {
  const hydrated = useSubscriptionDraft((s) => s.hydrated);
  useEffect(() => {
    if (!useSubscriptionDraft.persist.hasHydrated()) void useSubscriptionDraft.persist.rehydrate();
  }, []);
  return hydrated;
}
