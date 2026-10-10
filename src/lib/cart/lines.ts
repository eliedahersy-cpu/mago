import { z } from 'zod';
import type { Product } from '@/lib/types';

export interface CartLine {
  id: string;
  productId: string;
  slug: string;
  name: string;
  flavour: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
}

export type CartProduct = Omit<CartLine, 'id' | 'quantity'>;

export const MAX_LINE_QTY = 99;

export function clampQuantity(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(MAX_LINE_QTY, Math.floor(n));
}

const lineId = (productId: string) => `p:${productId}`;

export function addLine(lines: CartLine[], product: CartProduct, qty = 1): CartLine[] {
  const id = lineId(product.productId);
  const add = clampQuantity(qty);
  const existing = lines.find((l) => l.id === id);
  if (!existing) return [...lines, { ...product, id, quantity: add }];
  return lines.map((l) => (l.id === id ? { ...l, ...product, quantity: clampQuantity(l.quantity + add) } : l));
}

export function setLineQuantity(lines: CartLine[], id: string, qty: number): CartLine[] {
  if (!Number.isFinite(qty) || qty <= 0) return removeLine(lines, id);
  return lines.map((l) => (l.id === id ? { ...l, quantity: clampQuantity(qty) } : l));
}

export function removeLine(lines: CartLine[], id: string): CartLine[] {
  return lines.filter((l) => l.id !== id);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/** Indicative subtotal for the drawer; checkout totals always come from the server. */
export function cartSubtotal(lines: CartLine[]): number {
  const cents = lines.reduce((sum, l) => sum + Math.round(l.unitPrice * 100) * l.quantity, 0);
  return cents / 100;
}

const cartLineSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  flavour: z.string().nullable(),
  image: z.string().nullable(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1).max(MAX_LINE_QTY),
});

/** Validate whatever was stored in localStorage; drop anything malformed instead of crashing. */
export function sanitizePersistedCart(persisted: unknown): { lines: CartLine[] } {
  if (!persisted || typeof persisted !== 'object' || !Array.isArray((persisted as { lines?: unknown }).lines)) {
    return { lines: [] };
  }
  const lines = (persisted as { lines: unknown[] }).lines.flatMap((l) => {
    const parsed = cartLineSchema.safeParse(l);
    return parsed.success ? [parsed.data] : [];
  });
  return { lines };
}

export function toCartProduct(p: Product): CartProduct {
  const image = p.images.find((i) => i.kind === 'packshot') ?? p.images[0];
  return {
    productId: p.id,
    slug: p.slug,
    name: p.name,
    flavour: p.flavour,
    image: image?.url ?? null,
    unitPrice: p.price,
  };
}
