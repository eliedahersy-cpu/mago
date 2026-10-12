import { z } from 'zod';
import type { Product } from '@/lib/types';

export interface ProductLine {
  kind: 'product';
  id: string;
  productId: string;
  slug: string;
  name: string;
  flavour: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
}

/** One cup inside a Mix Box; `quantity` is how many of it the box holds. */
export interface BoxCup {
  productId: string;
  slug: string;
  name: string;
  flavour: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
}

/** A Mix Box: the bundle product (priced 0) carrying its cups. `quantity` counts identical boxes. */
export interface BoxLine {
  kind: 'box';
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  cups: BoxCup[];
  quantity: number;
}

export type CartLine = ProductLine | BoxLine;
export type CartProduct = Omit<ProductLine, 'kind' | 'id' | 'quantity'>;
export type NewBox = Omit<BoxLine, 'kind' | 'id' | 'quantity'>;

/** Order-level notes collected before checkout (Mix Box review) and prefilled into the checkout form. */
export interface OrderNotes {
  instructions: string;
  isGift: boolean;
  giftNote: string;
}

export const EMPTY_ORDER_NOTES: OrderNotes = { instructions: '', isGift: false, giftNote: '' };

export const MAX_LINE_QTY = 99;

export function clampQuantity(n: number): number {
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.min(MAX_LINE_QTY, Math.floor(n));
}

const lineId = (productId: string) => `p:${productId}`;
const cents = (amount: number) => Math.round(amount * 100);

export function addLine(lines: CartLine[], product: CartProduct, qty = 1): CartLine[] {
  const id = lineId(product.productId);
  const add = clampQuantity(qty);
  const existing = lines.find((l) => l.id === id);
  if (!existing) return [...lines, { ...product, kind: 'product', id, quantity: add }];
  return lines.map((l) => (l.id === id && l.kind === 'product' ? { ...l, ...product, quantity: clampQuantity(l.quantity + add) } : l));
}

/** Order-insensitive identity of a box's contents. */
function boxSignature(cups: BoxCup[]): string {
  return cups
    .map((c) => `${c.productId}x${c.quantity}`)
    .sort()
    .join('|');
}

/** Adds a box; the same contents as an existing box line bump that line's quantity instead. */
export function addBox(lines: CartLine[], box: NewBox, id: string): CartLine[] {
  const signature = boxSignature(box.cups);
  const existing = lines.find((l) => l.kind === 'box' && l.productId === box.productId && boxSignature(l.cups) === signature);
  if (!existing) return [...lines, { ...box, kind: 'box', id: `b:${id}`, quantity: 1 }];
  return lines.map((l) => (l.id === existing.id ? { ...l, quantity: clampQuantity(l.quantity + 1) } : l));
}

export function setLineQuantity(lines: CartLine[], id: string, qty: number): CartLine[] {
  if (!Number.isFinite(qty) || qty <= 0) return removeLine(lines, id);
  return lines.map((l) => (l.id === id ? { ...l, quantity: clampQuantity(qty) } : l));
}

export function removeLine(lines: CartLine[], id: string): CartLine[] {
  return lines.filter((l) => l.id !== id);
}

/** Price of one unit of the line: a box is worth the cups inside it. */
export function lineUnitPrice(line: CartLine): number {
  if (line.kind === 'product') return line.unitPrice;
  return line.cups.reduce((sum, c) => sum + cents(c.unitPrice) * c.quantity, 0) / 100;
}

/** Items for the cart badge: a box counts once per box. */
export function cartCount(lines: CartLine[]): number {
  return lines.reduce((n, l) => n + l.quantity, 0);
}

/** Indicative subtotal for the drawer; checkout totals always come from the server. */
export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + cents(lineUnitPrice(l)) * l.quantity, 0) / 100;
}

const quantity = z.number().int().min(1).max(MAX_LINE_QTY);
const item = {
  productId: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  image: z.string().nullable(),
};

export const boxCupSchema = z.object({ ...item, flavour: z.string().nullable(), unitPrice: z.number().nonnegative(), quantity });

const productLineSchema = z.object({
  ...item,
  kind: z.literal('product'),
  id: z.string().min(1),
  flavour: z.string().nullable(),
  unitPrice: z.number().nonnegative(),
  quantity,
});

const boxLineSchema = z.object({
  ...item,
  kind: z.literal('box'),
  id: z.string().min(1),
  cups: z.array(boxCupSchema).min(1),
  quantity,
});

const cartLineSchema = z.discriminatedUnion('kind', [productLineSchema, boxLineSchema]);

const orderNotesSchema = z.object({
  instructions: z.string().max(500),
  isGift: z.boolean(),
  giftNote: z.string().max(200),
});

/** v1 carts (Plan 1) stored product lines without a `kind`. */
function upgradeLine(line: unknown): unknown {
  if (line && typeof line === 'object' && !('kind' in line)) return { ...line, kind: 'product' };
  return line;
}

/** Validate whatever was stored in localStorage; drop anything malformed instead of crashing. */
export function sanitizePersistedCart(persisted: unknown): { lines: CartLine[]; orderNotes: OrderNotes } {
  const state = persisted && typeof persisted === 'object' ? (persisted as { lines?: unknown; orderNotes?: unknown }) : {};
  const rawLines = Array.isArray(state.lines) ? state.lines : [];
  const lines = rawLines.flatMap((l) => {
    const parsed = cartLineSchema.safeParse(upgradeLine(l));
    return parsed.success ? [parsed.data] : [];
  });
  const notes = orderNotesSchema.safeParse(state.orderNotes);
  return { lines, orderNotes: notes.success ? notes.data : EMPTY_ORDER_NOTES };
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
