import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { safeStorage } from '@/lib/safe-storage';
import {
  addBox,
  addLine,
  EMPTY_ORDER_NOTES,
  removeLine,
  sanitizePersistedCart,
  setLineQuantity,
  type CartLine,
  type CartProduct,
  type NewBox,
  type OrderNotes,
} from './lines';

interface CartState {
  lines: CartLine[];
  orderNotes: OrderNotes;
  /** The discount code accepted on the cart or checkout page, carried between them. */
  discountCode: string;
  isOpen: boolean;
  /** True once localStorage has been read; render counts only after this to avoid hydration mismatches. */
  hydrated: boolean;
  add: (product: CartProduct, qty?: number) => void;
  /** Adds a Mix Box; opens the drawer unless `open` is false (e.g. when heading straight to checkout). */
  addBox: (box: NewBox, options?: { open?: boolean }) => void;
  setQuantity: (lineId: string, qty: number) => void;
  remove: (lineId: string) => void;
  setOrderNotes: (patch: Partial<OrderNotes>) => void;
  setDiscountCode: (code: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      orderNotes: EMPTY_ORDER_NOTES,
      discountCode: '',
      isOpen: false,
      hydrated: false,
      add: (product, qty = 1) => set((s) => ({ lines: addLine(s.lines, product, qty), isOpen: true })),
      addBox: (box, { open = true } = {}) =>
        set((s) => ({ lines: addBox(s.lines, box, crypto.randomUUID()), isOpen: open || s.isOpen })),
      setQuantity: (lineId, qty) => set((s) => ({ lines: setLineQuantity(s.lines, lineId, qty) })),
      remove: (lineId) => set((s) => ({ lines: removeLine(s.lines, lineId) })),
      setOrderNotes: (patch) => set((s) => ({ orderNotes: { ...s.orderNotes, ...patch } })),
      setDiscountCode: (discountCode) => set({ discountCode }),
      clear: () => set({ lines: [], orderNotes: EMPTY_ORDER_NOTES, discountCode: '' }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: 'mago-cart',
      // v2 adds Mix Box lines and order notes; v1 product lines are upgraded on read.
      version: 2,
      storage: createJSONStorage(safeStorage),
      partialize: (s) => ({ lines: s.lines, orderNotes: s.orderNotes, discountCode: s.discountCode }),
      migrate: (persisted) => sanitizePersistedCart(persisted),
      merge: (persisted, current) => ({ ...current, ...sanitizePersistedCart(persisted) }),
      // Hydrate explicitly from CartDrawer's mount effect so server and first client render match.
      skipHydration: true,
      onRehydrateStorage: () => () => useCart.setState({ hydrated: true }),
    },
  ),
);
