import { z } from 'zod';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { boxCupSchema, type BoxCup } from '@/lib/cart/lines';
import { addCupToBox, setCupQuantityInBox } from '@/lib/mix-box/box';
import { safeStorage } from '@/lib/safe-storage';

interface MixBoxState {
  cups: BoxCup[];
  /** True once the saved box has been read; render counts only after this. */
  hydrated: boolean;
  add: (cup: Omit<BoxCup, 'quantity'>, size: number) => void;
  setQuantity: (productId: string, qty: number, size: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
}

const persistedSchema = z.object({ cups: z.array(boxCupSchema) });

function sanitize(persisted: unknown): { cups: BoxCup[] } {
  const parsed = persistedSchema.safeParse(persisted);
  return parsed.success ? parsed.data : { cups: [] };
}

/** The box being built on /mix-box and reviewed on /mix-box/review, before it goes into the cart. */
export const useMixBox = create<MixBoxState>()(
  persist(
    (set) => ({
      cups: [],
      hydrated: false,
      add: (cup, size) => set((s) => ({ cups: addCupToBox(s.cups, cup, size) })),
      setQuantity: (productId, qty, size) => set((s) => ({ cups: setCupQuantityInBox(s.cups, productId, qty, size) })),
      remove: (productId) => set((s) => ({ cups: s.cups.filter((c) => c.productId !== productId) })),
      clear: () => set({ cups: [] }),
    }),
    {
      name: 'mago-mix-box',
      version: 1,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ cups: s.cups }),
      migrate: (persisted) => sanitize(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
      // Hydrated from the builder and review pages on mount so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => () => useMixBox.setState({ hydrated: true }),
    },
  ),
);
