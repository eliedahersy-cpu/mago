// Admin reads. Every caller has already passed requireStaff(); staff see every row through the
// *_staff_all RLS policies, and the security-definer functions in 0008_admin.sql check again.
import { type OrderFilters, ORDERS_PAGE_SIZE } from '@/lib/admin/orders';
import { beirutLocalToIso } from '@/lib/admin/stats';
import { createClient } from '@/lib/supabase/server';

function fail(what: string, error: { message: string }): never {
  throw new Error(`Failed to load ${what}: ${error.message}`);
}

const toNum = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));

// ---------------------------------------------------------------------------- dashboard

export interface StatsTotals {
  sales: number;
  orders: number;
  aov: number;
  newCustomers: number;
}

export interface AdminStats extends StatsTotals {
  previous: StatsTotals;
  daily: { day: string; sales: number; orders: number }[];
  topProducts: { name: string; flavour: string | null; quantity: number; sales: number }[];
  byCollection: { title: string; quantity: number; sales: number }[];
  bySource: { source: string; orders: number; sales: number }[];
  byStatus: { status: string; orders: number }[];
  lowStock: { id: string; name: string; flavour: string | null; stock: number; threshold: number }[];
}

type Raw = Record<string, unknown>;
const totals = (r: Raw): StatsTotals => ({
  sales: toNum(r.sales),
  orders: toNum(r.orders),
  aov: toNum(r.aov),
  newCustomers: toNum(r.new_customers),
});

export async function getAdminStats(from: Date, to: Date): Promise<AdminStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_stats', { p_from: from.toISOString(), p_to: to.toISOString() });
  if (error) fail('dashboard', error);
  const r = data as Raw;
  const list = (k: string) => (r[k] as Raw[] | null) ?? [];
  return {
    ...totals(r),
    previous: totals((r.previous as Raw) ?? {}),
    daily: list('daily').map((d) => ({ day: String(d.day), sales: toNum(d.sales), orders: toNum(d.orders) })),
    topProducts: list('top_products').map((t) => ({
      name: String(t.name),
      flavour: (t.flavour as string | null) ?? null,
      quantity: toNum(t.quantity),
      sales: toNum(t.sales),
    })),
    byCollection: list('by_collection').map((t) => ({ title: String(t.title), quantity: toNum(t.quantity), sales: toNum(t.sales) })),
    bySource: list('by_source').map((t) => ({ source: String(t.source), orders: toNum(t.orders), sales: toNum(t.sales) })),
    byStatus: list('by_status').map((t) => ({ status: String(t.status), orders: toNum(t.orders) })),
    lowStock: list('low_stock').map((t) => ({
      id: String(t.id),
      name: String(t.name),
      flavour: (t.flavour as string | null) ?? null,
      stock: toNum(t.stock),
      threshold: toNum(t.threshold),
    })),
  };
}

// ---------------------------------------------------------------------------- orders

export interface Address {
  full_name?: string | null;
  phone?: string | null;
  governorate?: string | null;
  area?: string | null;
  street?: string | null;
  building?: string | null;
  floor?: string | null;
  notes?: string | null;
}

export interface AdminOrderRow {
  id: string;
  number: number;
  createdAt: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  paymentStatus: string;
  source: string;
  total: number;
  area: string;
}

const ORDER_LIST_SELECT = 'id, number, created_at, email, phone, status, payment_status, source, total, shipping_address';

function toOrderRow(o: Raw): AdminOrderRow {
  const address = (o.shipping_address as Address) ?? {};
  return {
    id: String(o.id),
    number: toNum(o.number),
    createdAt: String(o.created_at),
    name: address.full_name ?? '',
    email: String(o.email),
    phone: String(o.phone),
    status: String(o.status),
    paymentStatus: String(o.payment_status),
    source: String(o.source),
    total: toNum(o.total),
    area: [address.area, address.governorate].filter(Boolean).join(', '),
  };
}

/** Characters that would break a PostgREST or() filter or act as wildcards. */
function searchTerm(q: string): string {
  return q.replace(/[,()*%\\:"']/g, ' ').trim();
}

const DAY = 86_400_000;

interface Filterable {
  or(filters: string): Filterable;
  eq(column: string, value: string): Filterable;
  gte(column: string, value: string): Filterable;
  lt(column: string, value: string): Filterable;
}

/** Applies the list filters to an orders query (search, status, payment, source, Lebanon-time days). */
function filtered<T>(query: T, f: OrderFilters): T {
  let q = query as unknown as Filterable;
  const term = searchTerm(f.q);
  if (term) {
    const digits = term.replace(/^#/, '');
    const parts = [`email.ilike.*${term}*`, `phone.ilike.*${term}*`, `shipping_address->>full_name.ilike.*${term}*`];
    if (/^\d{1,12}$/.test(digits)) parts.unshift(`number.eq.${digits}`);
    q = q.or(parts.join(','));
  }
  if (f.status) q = q.eq('status', f.status);
  if (f.payment) q = q.eq('payment_status', f.payment);
  if (f.source) q = q.eq('source', f.source);
  const from = f.from ? beirutLocalToIso(`${f.from}T00:00`) : null;
  const to = f.to ? beirutLocalToIso(`${f.to}T00:00`) : null;
  if (from) q = q.gte('created_at', from);
  if (to) q = q.lt('created_at', new Date(new Date(to).getTime() + DAY).toISOString());
  return q as unknown as T;
}

export async function listOrders(f: OrderFilters): Promise<{ rows: AdminOrderRow[]; total: number }> {
  const supabase = await createClient();
  const start = (f.page - 1) * ORDERS_PAGE_SIZE;
  const { data, error, count } = await filtered(supabase.from('orders').select(ORDER_LIST_SELECT, { count: 'exact' }), f)
    .order('created_at', { ascending: false })
    .range(start, start + ORDERS_PAGE_SIZE - 1);
  if (error) fail('orders', error);
  return { rows: (data as Raw[]).map(toOrderRow), total: count ?? 0 };
}

export interface CsvOrder extends AdminOrderRow {
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  discountCode: string | null;
  address: Address;
}

/** Up to 5,000 orders matching the filters, newest first, for the CSV export. */
export async function listOrdersForExport(f: OrderFilters): Promise<CsvOrder[]> {
  const supabase = await createClient();
  const { data, error } = await filtered(
    supabase.from('orders').select(`${ORDER_LIST_SELECT}, subtotal, discount_total, shipping_total, discount_code`),
    f,
  )
    .order('created_at', { ascending: false })
    .limit(5000);
  if (error) fail('orders', error);
  return (data as Raw[]).map((o) => ({
    ...toOrderRow(o),
    subtotal: toNum(o.subtotal),
    discountTotal: toNum(o.discount_total),
    shippingTotal: toNum(o.shipping_total),
    discountCode: (o.discount_code as string | null) ?? null,
    address: (o.shipping_address as Address) ?? {},
  }));
}

export interface AdminOrderItem {
  id: string;
  productId: string | null;
  name: string;
  flavour: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  children: AdminOrderItem[];
}

export interface AdminOrderEvent {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  by: string | null;
}

export interface AdminOrder extends AdminOrderRow {
  accessToken: string;
  customerId: string | null;
  subtotal: number;
  discountTotal: number;
  shippingTotal: number;
  discountCode: string | null;
  address: Address;
  specialInstructions: string | null;
  isGift: boolean;
  giftNote: string | null;
  items: AdminOrderItem[];
  events: AdminOrderEvent[];
}

export async function getAdminOrder(number: number): Promise<AdminOrder | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select(
      `${ORDER_LIST_SELECT}, access_token, customer_id, subtotal, discount_total, shipping_total, discount_code,
       special_instructions, is_gift, gift_note,
       order_items (id, product_id, parent_item_id, name, flavour, image, unit_price, quantity, line_total, created_at),
       order_events (id, type, message, created_at, author:profiles (full_name))`,
    )
    .eq('number', number)
    .maybeSingle();
  if (error) fail('order', error);
  if (!data) return null;
  const o = data as Raw;
  const raw = ((o.order_items as Raw[]) ?? []).map((i) => ({
    parent: (i.parent_item_id as string | null) ?? null,
    createdAt: String(i.created_at),
    item: {
      id: String(i.id),
      productId: (i.product_id as string | null) ?? null,
      name: String(i.name),
      flavour: (i.flavour as string | null) ?? null,
      image: (i.image as string | null) ?? null,
      unitPrice: toNum(i.unit_price),
      quantity: toNum(i.quantity),
      lineTotal: toNum(i.line_total),
      children: [] as AdminOrderItem[],
    },
  }));
  raw.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const byId = new Map(raw.map((r) => [r.item.id, r.item]));
  const items: AdminOrderItem[] = [];
  for (const r of raw) {
    const parent = r.parent ? byId.get(r.parent) : undefined;
    if (parent) parent.children.push(r.item);
    else items.push(r.item);
  }
  const events = ((o.order_events as Raw[]) ?? [])
    .map((e) => ({
      id: String(e.id),
      type: String(e.type),
      message: String(e.message),
      createdAt: String(e.created_at),
      by: ((e.author as Raw | null)?.full_name as string | null) ?? null,
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    ...toOrderRow(o),
    accessToken: String(o.access_token),
    customerId: (o.customer_id as string | null) ?? null,
    subtotal: toNum(o.subtotal),
    discountTotal: toNum(o.discount_total),
    shippingTotal: toNum(o.shipping_total),
    discountCode: (o.discount_code as string | null) ?? null,
    address: (o.shipping_address as Address) ?? {},
    specialInstructions: (o.special_instructions as string | null) ?? null,
    isGift: Boolean(o.is_gift),
    giftNote: (o.gift_note as string | null) ?? null,
    items,
    events,
  };
}

export async function getRecentOrders(limit = 6): Promise<AdminOrderRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('orders').select(ORDER_LIST_SELECT).order('created_at', { ascending: false }).limit(limit);
  if (error) fail('orders', error);
  return (data as Raw[]).map(toOrderRow);
}

// ---------------------------------------------------------------------------- products & collections

export interface AdminProductRow {
  id: string;
  slug: string;
  name: string;
  flavour: string | null;
  type: string;
  status: string;
  price: number;
  stock: number;
  trackInventory: boolean;
  allowBackorder: boolean;
  lowStockThreshold: number;
  image: string | null;
  collections: string[];
  sortOrder: number;
}

const PRODUCT_LIST_SELECT =
  'id, slug, name, flavour, type, status, price, stock, track_inventory, allow_backorder, low_stock_threshold, sort_order, product_images (url, position, kind), collection_products (collections (title))';

function toProductRow(p: Raw): AdminProductRow {
  const images = ((p.product_images as Raw[]) ?? []).sort((a, b) => toNum(a.position) - toNum(b.position));
  const packshot = images.find((i) => i.kind === 'packshot') ?? images[0];
  return {
    id: String(p.id),
    slug: String(p.slug),
    name: String(p.name),
    flavour: (p.flavour as string | null) ?? null,
    type: String(p.type),
    status: String(p.status),
    price: toNum(p.price),
    stock: toNum(p.stock),
    trackInventory: Boolean(p.track_inventory),
    allowBackorder: Boolean(p.allow_backorder),
    lowStockThreshold: toNum(p.low_stock_threshold),
    image: packshot ? String(packshot.url) : null,
    collections: ((p.collection_products as Raw[]) ?? []).map((cp) => String((cp.collections as Raw | null)?.title ?? '')).filter(Boolean),
    sortOrder: toNum(p.sort_order),
  };
}

export async function listAdminProducts(opts: { q?: string; status?: string | null; type?: string | null } = {}): Promise<AdminProductRow[]> {
  const supabase = await createClient();
  let query = supabase.from('products').select(PRODUCT_LIST_SELECT).order('type').order('sort_order').order('name');
  const term = searchTerm(opts.q ?? '');
  if (term) query = query.or(`name.ilike.*${term}*,flavour.ilike.*${term}*,sku.ilike.*${term}*,slug.ilike.*${term}*`);
  if (opts.status) query = query.eq('status', opts.status);
  if (opts.type) query = query.eq('type', opts.type);
  const { data, error } = await query;
  if (error) fail('products', error);
  return (data as Raw[]).map(toProductRow);
}

export interface AdminImage {
  id: string;
  url: string;
  alt: string;
  position: number;
  kind: 'packshot' | 'lifestyle' | 'video';
}

export interface AdminProduct {
  row: Raw;
  images: AdminImage[];
  collectionIds: string[];
}

export async function getAdminProduct(id: string): Promise<AdminProduct | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images (id, url, alt, position, kind), collection_products (collection_id)')
    .eq('id', id)
    .maybeSingle();
  if (error) fail('product', error);
  if (!data) return null;
  const r = data as Raw;
  return {
    row: r,
    images: ((r.product_images as Raw[]) ?? [])
      .map((i) => ({ id: String(i.id), url: String(i.url), alt: String(i.alt ?? ''), position: toNum(i.position), kind: i.kind as AdminImage['kind'] }))
      .sort((a, b) => a.position - b.position),
    collectionIds: ((r.collection_products as Raw[]) ?? []).map((c) => String(c.collection_id)),
  };
}

export interface AdminCollection {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  sortOrder: number;
  isVisible: boolean;
  productIds: string[];
}

export async function listAdminCollections(): Promise<AdminCollection[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('collections')
    .select('id, slug, title, description, sort_order, is_visible, collection_products (product_id, position)')
    .order('sort_order')
    .order('title');
  if (error) fail('collections', error);
  return (data as Raw[]).map((c) => ({
    id: String(c.id),
    slug: String(c.slug),
    title: String(c.title),
    description: (c.description as string | null) ?? null,
    sortOrder: toNum(c.sort_order),
    isVisible: Boolean(c.is_visible),
    productIds: ((c.collection_products as Raw[]) ?? [])
      .sort((a, b) => toNum(a.position) - toNum(b.position))
      .map((cp) => String(cp.product_id)),
  }));
}

// ---------------------------------------------------------------------------- inventory

export interface Movement {
  id: string;
  productId: string;
  product: string;
  delta: number;
  reason: string;
  note: string | null;
  orderNumber: number | null;
  by: string | null;
  createdAt: string;
}

export async function listMovements(opts: { productId?: string; limit?: number } = {}): Promise<Movement[]> {
  const supabase = await createClient();
  let query = supabase
    .from('inventory_movements')
    .select('id, product_id, delta, reason, note, order_id, created_at, product:products (name, flavour), author:profiles (full_name)')
    .order('created_at', { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.productId) query = query.eq('product_id', opts.productId);
  const { data, error } = await query;
  if (error) fail('stock history', error);
  const rows = data as Raw[];
  // order_id has no foreign key (orders can be deleted), so look the numbers up separately.
  const orderIds = [...new Set(rows.map((m) => m.order_id).filter(Boolean) as string[])];
  const numbers = new Map<string, number>();
  if (orderIds.length) {
    const { data: orders } = await supabase.from('orders').select('id, number').in('id', orderIds);
    for (const o of (orders as Raw[] | null) ?? []) numbers.set(String(o.id), toNum(o.number));
  }
  return rows.map((m) => {
    const p = (m.product as Raw | null) ?? {};
    return {
      id: String(m.id),
      productId: String(m.product_id),
      product: [p.name, p.flavour].filter(Boolean).join(' '),
      delta: toNum(m.delta),
      reason: String(m.reason),
      note: (m.note as string | null) ?? null,
      orderNumber: m.order_id ? (numbers.get(String(m.order_id)) ?? null) : null,
      by: ((m.author as Raw | null)?.full_name as string | null) ?? null,
      createdAt: String(m.created_at),
    };
  });
}

// ---------------------------------------------------------------------------- customers

export interface AdminCustomerRow {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  orders: number;
  totalSpent: number;
  lastOrderAt: string | null;
  tags: string[];
  hasAccount: boolean;
}

export const CUSTOMERS_PAGE_SIZE = 25;

export async function listCustomers(q: string, page: number): Promise<{ rows: AdminCustomerRow[]; total: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_customers', {
    p_search: q || null,
    p_limit: CUSTOMERS_PAGE_SIZE,
    p_offset: (page - 1) * CUSTOMERS_PAGE_SIZE,
  });
  if (error) fail('customers', error);
  const r = data as Raw;
  return {
    total: toNum(r.total),
    rows: ((r.rows as Raw[]) ?? []).map((c) => ({
      id: String(c.id),
      email: String(c.email),
      fullName: (c.full_name as string | null) ?? null,
      phone: (c.phone as string | null) ?? null,
      orders: toNum(c.orders),
      totalSpent: toNum(c.total_spent),
      lastOrderAt: (c.last_order_at as string | null) ?? null,
      tags: (c.tags as string[] | null) ?? [],
      hasAccount: Boolean(c.has_account),
    })),
  };
}

export interface AdminCustomer {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  notes: string | null;
  tags: string[];
  acceptsMarketing: boolean;
  hasAccount: boolean;
  createdAt: string;
  addresses: Address[];
  orders: AdminOrderRow[];
}

export async function getAdminCustomer(id: string): Promise<AdminCustomer | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('customers')
    .select('id, email, full_name, phone, notes, tags, accepts_marketing, profile_id, created_at, addresses (*)')
    .eq('id', id)
    .maybeSingle();
  if (error) fail('customer', error);
  if (!data) return null;
  const c = data as Raw;
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(ORDER_LIST_SELECT)
    .eq('customer_id', id)
    .order('created_at', { ascending: false })
    .limit(50);
  if (ordersError) fail('customer orders', ordersError);
  return {
    id: String(c.id),
    email: String(c.email),
    fullName: (c.full_name as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
    notes: (c.notes as string | null) ?? null,
    tags: (c.tags as string[] | null) ?? [],
    acceptsMarketing: Boolean(c.accepts_marketing),
    hasAccount: c.profile_id !== null,
    createdAt: String(c.created_at),
    addresses: (c.addresses as Address[]) ?? [],
    orders: (orders as Raw[]).map(toOrderRow),
  };
}

// ---------------------------------------------------------------------------- discounts

export interface AdminDiscount {
  id: string;
  code: string | null;
  title: string;
  kind: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  appliesTo: 'order' | 'cups';
  minSubtotal: number | null;
  minCupQuantity: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  oncePerCustomer: boolean;
  isAutomatic: boolean;
  isActive: boolean;
}

function toDiscount(d: Raw): AdminDiscount {
  return {
    id: String(d.id),
    code: (d.code as string | null) ?? null,
    title: String(d.title),
    kind: d.kind as AdminDiscount['kind'],
    value: toNum(d.value),
    appliesTo: d.applies_to as AdminDiscount['appliesTo'],
    minSubtotal: d.min_subtotal === null ? null : toNum(d.min_subtotal),
    minCupQuantity: d.min_cup_quantity === null ? null : toNum(d.min_cup_quantity),
    startsAt: (d.starts_at as string | null) ?? null,
    endsAt: (d.ends_at as string | null) ?? null,
    usageLimit: d.usage_limit === null ? null : toNum(d.usage_limit),
    usageCount: toNum(d.usage_count),
    oncePerCustomer: Boolean(d.once_per_customer),
    isAutomatic: Boolean(d.is_automatic),
    isActive: Boolean(d.is_active),
  };
}

export async function listDiscounts(): Promise<AdminDiscount[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('discounts').select('*').order('is_automatic', { ascending: false }).order('created_at', { ascending: false });
  if (error) fail('discounts', error);
  return (data as Raw[]).map(toDiscount);
}

export async function getDiscount(id: string): Promise<AdminDiscount | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('discounts').select('*').eq('id', id).maybeSingle();
  if (error) fail('discount', error);
  return data ? toDiscount(data as Raw) : null;
}

// ---------------------------------------------------------------------------- settings & staff

export interface StaffMember {
  id: string;
  email: string;
  fullName: string | null;
  role: 'owner' | 'staff';
}

export async function listStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_staff');
  if (error) fail('staff', error);
  return ((data as Raw[] | null) ?? []).map((s) => ({
    id: String(s.id),
    email: String(s.email ?? ''),
    fullName: (s.full_name as string | null) ?? null,
    role: s.role as StaffMember['role'],
  }));
}

// ---------------------------------------------------------------------------- reviews

export interface AdminReview {
  id: string;
  productId: string;
  product: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: string;
  isVerifiedBuyer: boolean;
  createdAt: string;
}

/** Waiting reviews oldest first (a queue); published and rejected newest first. */
export async function listReviews(status: string): Promise<AdminReview[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('id, product_id, author_name, rating, title, body, status, is_verified_buyer, created_at, product:products (name, flavour)')
    .eq('status', status)
    .order('created_at', { ascending: status === 'pending' })
    .limit(100);
  if (error) fail('reviews', error);
  return (data as Raw[]).map((r) => {
    const p = (r.product as Raw | null) ?? {};
    return {
      id: String(r.id),
      productId: String(r.product_id),
      product: [p.name, p.flavour].filter(Boolean).join(' '),
      authorName: String(r.author_name),
      rating: toNum(r.rating),
      title: (r.title as string | null) ?? null,
      body: String(r.body),
      status: String(r.status),
      isVerifiedBuyer: Boolean(r.is_verified_buyer),
      createdAt: String(r.created_at),
    };
  });
}

export async function countPendingReviews(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase.from('reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending');
  return count ?? 0;
}
