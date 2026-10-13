/** Order list filters and the status flow, mirroring update_order_status in SQL (migration 0008). */

export const ORDER_FLOW = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'] as const;
export const ORDER_STATUSES = [...ORDER_FLOW, 'cancelled'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const ORDER_SOURCES = ['web', 'admin', 'subscription'] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const ORDERS_PAGE_SIZE = 25;

/** Statuses an order may move to: any later step, or cancelled until it is delivered. Delivered and cancelled are final. */
export function nextStatuses(status: string): OrderStatus[] {
  const at = ORDER_FLOW.indexOf(status as (typeof ORDER_FLOW)[number]);
  if (at < 0 || status === 'delivered') return [];
  return [...ORDER_FLOW.slice(at + 1), 'cancelled'];
}

export interface OrderFilters {
  q: string;
  status: OrderStatus | null;
  payment: PaymentStatus | null;
  source: OrderSource | null;
  from: string | null;
  to: string | null;
  page: number;
}

type Params = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function oneOf<T extends string>(list: readonly T[], value: string | undefined): T | null {
  return value && (list as readonly string[]).includes(value) ? (value as T) : null;
}

/** A real calendar date written YYYY-MM-DD, else null. */
function isoDay(value: string | undefined): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().startsWith(value) ? value : null;
}

export function parseOrderFilters(sp: Params): OrderFilters {
  const page = Number.parseInt(first(sp.page) ?? '', 10);
  return {
    q: (first(sp.q) ?? '').trim().slice(0, 100),
    status: oneOf(ORDER_STATUSES, first(sp.status)),
    payment: oneOf(PAYMENT_STATUSES, first(sp.payment)),
    source: oneOf(ORDER_SOURCES, first(sp.source)),
    from: isoDay(first(sp.from)),
    to: isoDay(first(sp.to)),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Query string for the order list with some filters changed (page resets unless given). */
export function orderFiltersQuery(current: OrderFilters, patch: Partial<OrderFilters>): string {
  const next = { ...current, page: 1, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.status) params.set('status', next.status);
  if (next.payment) params.set('payment', next.payment);
  if (next.source) params.set('source', next.source);
  if (next.from) params.set('from', next.from);
  if (next.to) params.set('to', next.to);
  if (next.page > 1) params.set('page', String(next.page));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = { unpaid: 'Unpaid', paid: 'Paid', refunded: 'Refunded' };
export const SOURCE_LABEL: Record<OrderSource, string> = { web: 'Website', admin: 'Admin', subscription: 'Subscription' };
