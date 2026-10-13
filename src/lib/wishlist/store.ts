import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/safe-storage';
import { GUEST, sanitizeIds, sanitizeOwner, toggleId } from './ids';

interface WishlistState {
  ids: string[];
  /** Whose list this is: GUEST, or the id of the account it came from. */
  owner: string;
  hydrated: boolean;
  toggle: (productId: string) => void;
  /** After syncing: the account's list now lives in this browser. */
  adopt: (userId: string, ids: string[]) => void;
  /** On signing out: nothing of the account stays behind. */
  forget: () => void;
}

/** Saved products in this browser; merged into the account by WishlistSync when signed in. */
export const useWishlist = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      owner: GUEST,
      hydrated: false,
      toggle: (productId) => set((s) => ({ ids: toggleId(s.ids, productId) })),
      adopt: (userId, ids) => set({ owner: userId, ids }),
      forget: () => set({ owner: GUEST, ids: [] }),
    }),
    {
      name: 'mago-wishlist',
      // v2 records whose list is stored, so an account's list is never re-merged.
      version: 2,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ ids: s.ids, owner: s.owner }),
      migrate: (persisted) => ({ ids: sanitizeIds(persisted), owner: sanitizeOwner(persisted) }),
      merge: (persisted, current) => ({ ...current, ids: sanitizeIds(persisted), owner: sanitizeOwner(persisted) }),
      skipHydration: true,
      onRehydrateStorage: () => () => useWishlist.setState({ hydrated: true }),
    },
  ),
);
