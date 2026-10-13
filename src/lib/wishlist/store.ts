import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/safe-storage';
import { sanitizeIds, toggleId } from './ids';

interface WishlistState {
  ids: string[];
  hydrated: boolean;
  toggle: (productId: string) => void;
  replace: (ids: string[]) => void;
  clear: () => void;
}

/** Saved products in this browser; merged into the account by WishlistSync when signed in. */
export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      hydrated: false,
      toggle: (productId) => set((s) => ({ ids: toggleId(s.ids, productId) })),
      replace: (ids) => set({ ids }),
      clear: () => set({ ids: [] }),
    }),
    {
      name: 'mago-wishlist',
      version: 1,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ ids: s.ids }),
      migrate: (persisted) => ({ ids: sanitizeIds(persisted) }),
      merge: (persisted, current) => ({ ...current, ids: sanitizeIds(persisted) }),
      skipHydration: true,
      onRehydrateStorage: () => () => useWishlist.setState({ hydrated: true }),
    },
  ),
);
