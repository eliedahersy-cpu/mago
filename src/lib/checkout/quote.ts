import { num } from '@/lib/data/mappers';

/** One cup inside a box line, grouped (two of the same cup = quantity 2 per box). */
export interface QuoteChild {
  productId: string;
  name: string;
  flavour: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
}

export interface QuoteLine {
  productId: string;
  slug: string;
  name: string;
  flavour: string | null;
  type: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  children: QuoteChild[];
}

export interface QuoteIssue {
  code: string;
  productId: string | null;
  message: string;
}

/** Server-truth money for a cart, from quote_cart. */
export interface Quote {
  lines: QuoteLine[];
  cupQuantity: number;
  subtotal: number;
  automaticDiscount: { title: string; amount: number } | null;
  codeDiscount: { code: string; title: string; amount: number; freeShipping: boolean } | null;
  discountTotal: number;
  shippingTotal: number;
  freeShippingThreshold: number;
  total: number;
  errors: QuoteIssue[];
}

type Json = Record<string, unknown>;
const obj = (v: unknown): Json => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Json) : {});
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const str = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const strOrNull = (v: unknown): string | null => (typeof v === 'string' && v !== '' ? v : null);
const money = (v: unknown): number => num(v as string | number | null) ?? 0;

function groupChildren(children: unknown[]): QuoteChild[] {
  const grouped = new Map<string, QuoteChild>();
  for (const raw of children) {
    const c = obj(raw);
    const productId = str(c.product_id);
    const existing = grouped.get(productId);
    if (existing) existing.quantity += 1;
    else
      grouped.set(productId, {
        productId,
        name: str(c.name),
        flavour: strOrNull(c.flavour),
        image: strOrNull(c.image),
        unitPrice: money(c.unit_price),
        quantity: 1,
      });
  }
  return [...grouped.values()];
}

export function toQuote(json: unknown): Quote {
  const q = obj(json);
  const auto = q.automatic_discount ? obj(q.automatic_discount) : null;
  const code = q.code_discount ? obj(q.code_discount) : null;
  return {
    lines: arr(q.lines).map((raw) => {
      const l = obj(raw);
      return {
        productId: str(l.product_id),
        slug: str(l.slug),
        name: str(l.name),
        flavour: strOrNull(l.flavour),
        type: str(l.type),
        image: strOrNull(l.image),
        unitPrice: money(l.unit_price),
        quantity: Number(l.quantity) || 0,
        lineTotal: money(l.line_total),
        children: groupChildren(arr(l.children)),
      };
    }),
    cupQuantity: Number(q.cup_quantity) || 0,
    subtotal: money(q.subtotal),
    automaticDiscount: auto ? { title: str(auto.title), amount: money(auto.amount) } : null,
    codeDiscount: code
      ? { code: str(code.code), title: str(code.title), amount: money(code.amount), freeShipping: code.free_shipping === true }
      : null,
    discountTotal: money(q.discount_total),
    shippingTotal: money(q.shipping_total),
    freeShippingThreshold: money(q.free_shipping_threshold),
    total: money(q.total),
    errors: arr(q.errors).map((raw) => {
      const e = obj(raw);
      return { code: str(e.code), productId: strOrNull(e.product_id), message: str(e.message) };
    }),
  };
}

/** A problem with the discount code only: the order can still go ahead without it. */
export function codeIssue(quote: Quote): QuoteIssue | null {
  return quote.errors.find((e) => e.code.startsWith('discount_')) ?? null;
}

/** Problems that stop the order (unavailable, out of stock, incomplete box). */
export function blockingIssues(quote: Quote): QuoteIssue[] {
  return quote.errors.filter((e) => !e.code.startsWith('discount_'));
}

export interface OrderItem {
  name: string;
  flavour: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  children: { name: string; flavour: string | null; image: string | null; unitPrice: number; quantity: number }[];
}

/** What the guest confirmation page shows, from get_order_by_token. */
export interface OrderConfirmation {
  number: number;
  status: string;
  createdAt: string;
  email: string;
  phone: string;
  fullName: string;
  address: { governorate: string; area: string; street: string; building: string | null; floor: string | null; notes: string | null };
  instructions: string | null;
  isGift: boolean;
  giftNote: string | null;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  total: number;
  discountCode: string | null;
  paymentMethod: string;
  paymentStatus: string;
  items: OrderItem[];
}

export function toOrderConfirmation(json: unknown): OrderConfirmation | null {
  if (!json || typeof json !== 'object') return null;
  const o = obj(json);
  const a = obj(o.shipping_address);
  return {
    number: Number(o.number) || 0,
    status: str(o.status),
    createdAt: str(o.created_at),
    email: str(o.email),
    phone: str(o.phone),
    fullName: str(o.full_name),
    address: {
      governorate: str(a.governorate),
      area: str(a.area),
      street: str(a.street),
      building: strOrNull(a.building),
      floor: strOrNull(a.floor),
      notes: strOrNull(a.notes),
    },
    instructions: strOrNull(o.special_instructions),
    isGift: o.is_gift === true,
    giftNote: strOrNull(o.gift_note),
    subtotal: money(o.subtotal),
    discountTotal: money(o.discount_total),
    shippingTotal: money(o.shipping_total),
    total: money(o.total),
    discountCode: strOrNull(o.discount_code),
    paymentMethod: str(o.payment_method),
    paymentStatus: str(o.payment_status),
    items: arr(o.items).map((raw) => {
      const i = obj(raw);
      return {
        name: str(i.name),
        flavour: strOrNull(i.flavour),
        image: strOrNull(i.image),
        unitPrice: money(i.unit_price),
        quantity: Number(i.quantity) || 0,
        lineTotal: money(i.line_total),
        children: arr(i.children).map((rawChild) => {
          const c = obj(rawChild);
          return { name: str(c.name), flavour: strOrNull(c.flavour), image: strOrNull(c.image), unitPrice: money(c.unit_price), quantity: Number(c.quantity) || 0 };
        }),
      };
    }),
  };
}
