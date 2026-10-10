import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { addLine, removeLine, sanitizePersistedCart, setLineQuantity, type CartLine, type CartProduct } from './lines';

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  /** True once localStorage has been read; render counts only after this to avoid hydration mismatches. */
  hydrated: boolean;
  add: (product: CartProduct, qty?: number) => void;
  setQuantity: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      hydrated: false,
      add: (product, qty = 1) => set((s) => ({ lines: addLine(s.lines, product, qty), isOpen: true })),
      setQuantity: (lineId, qty) => set((s) => ({ lines: setLineQuantity(s.lines, lineId, qty) })),
      remove: (lineId) => set((s) => ({ lines: removeLine(s.lines, lineId) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'mago-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
      migrate: (persisted) => sanitizePersistedCart(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitizePersistedCart(persisted) }),
      // Hydrate explicitly from CartDrawer's mount effect so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => () => useCart.setState({ hydrated: true }),
    },
  ),
);
