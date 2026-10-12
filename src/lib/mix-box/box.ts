import type { BoxCup } from '@/lib/cart/lines';

/** Fallback when the bundle product has no `bundle_size`. */
export const DEFAULT_BOX_SIZE = 5;

export function boxCount(cups: BoxCup[]): number {
  return cups.reduce((n, c) => n + c.quantity, 0);
}

export function remainingSlots(cups: BoxCup[], size: number): number {
  return Math.max(0, size - boxCount(cups));
}

/** Adds one of `cup`; a full box is returned unchanged. */
export function addCupToBox(cups: BoxCup[], cup: Omit<BoxCup, 'quantity'>, size: number): BoxCup[] {
  if (remainingSlots(cups, size) === 0) return cups;
  const existing = cups.find((c) => c.productId === cup.productId);
  if (!existing) return [...cups, { ...cup, quantity: 1 }];
  return cups.map((c) => (c.productId === cup.productId ? { ...c, quantity: c.quantity + 1 } : c));
}

/** Sets one cup's quantity, never letting the box exceed `size`; below one removes it. */
export function setCupQuantityInBox(cups: BoxCup[], productId: string, qty: number, size: number): BoxCup[] {
  if (!Number.isFinite(qty) || qty < 1) return cups.filter((c) => c.productId !== productId);
  const others = boxCount(cups.filter((c) => c.productId !== productId));
  const quantity = Math.min(Math.floor(qty), Math.max(0, size - others));
  if (quantity < 1) return cups.filter((c) => c.productId !== productId);
  return cups.map((c) => (c.productId === productId ? { ...c, quantity } : c));
}

export function boxSubtotal(cups: BoxCup[]): number {
  return cups.reduce((sum, c) => sum + Math.round(c.unitPrice * 100) * c.quantity, 0) / 100;
}
