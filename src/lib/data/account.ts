import { cache } from 'react';
import { orderItemCount, toAccountOrder, type OrderRow } from '@/lib/account/orders';
import type { OrderConfirmation } from '@/lib/checkout/quote';
import { num } from '@/lib/data/mappers';
import { createClient } from '@/lib/supabase/server';

// Everything here reads through the signed-in session, so RLS decides what is visible.
// Pages call requireUser() first; never cache these results (personal data).

export interface Profile {
  fullName: string | null;
  phone: string | null;
}

export interface OrderSummary {
  number: number;
  status: string;
  createdAt: string;
  total: number;
  itemCount: number;
}

export interface Address {
  id: string;
  label: string | null;
  fullName: string | null;
  phone: string | null;
  governorate: string;
  area: string;
  street: string | null;
  building: string | null;
  floor: string | null;
  notes: string | null;
  isDefault: boolean;
}

const ORDER_SELECT =
  'number, status, created_at, email, phone, shipping_address, special_instructions, is_gift, gift_note, subtotal, discount_total, shipping_total, total, discount_code, payment_method, payment_status, order_items(id, parent_item_id, name, flavour, image, unit_price, quantity, line_total, created_at)';

/** Links the account to its customer record (claim_customer), once per request. */
export const ensureCustomer = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('claim_customer');
  if (error) throw new Error(`Failed to load your account: ${error.message}`);
  return (data as string | null) ?? null;
});

export async function getMyProfile(userId: string): Promise<Profile> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('full_name, phone').eq('id', userId).maybeSingle();
  if (error) throw new Error(`Failed to load your details: ${error.message}`);
  return { fullName: data?.full_name ?? null, phone: data?.phone ?? null };
}

export async function getMyOrders(limit = 50): Promise<OrderSummary[]> {
  await ensureCustomer();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('orders')
    .select('number, status, created_at, total, order_items(parent_item_id, quantity)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Failed to load your orders: ${error.message}`);
  return (data as unknown as (Pick<OrderRow, 'number' | 'status' | 'created_at' | 'total'> & { order_items: { parent_item_id: string | null; quantity: number }[] })[]).map(
    (o) => ({ number: o.number, status: o.status, createdAt: o.created_at, total: num(o.total) ?? 0, itemCount: orderItemCount(o.order_items) }),
  );
}

export async function getMyOrder(number: number): Promise<OrderConfirmation | null> {
  if (!Number.isInteger(number) || number <= 0) return null;
  await ensureCustomer();
  const supabase = await createClient();
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('number', number).maybeSingle();
  if (error) throw new Error(`Failed to load the order: ${error.message}`);
  return data ? toAccountOrder(data as unknown as OrderRow) : null;
}

export async function getMyAddresses(): Promise<Address[]> {
  const customerId = await ensureCustomer();
  if (!customerId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('addresses')
    .select('id, label, full_name, phone, governorate, area, street, building, floor, notes, is_default')
    .eq('customer_id', customerId)
    .order('is_default', { ascending: false })
    .order('created_at');
  if (error) throw new Error(`Failed to load your addresses: ${error.message}`);
  return (data ?? []).map((a) => ({
    id: a.id,
    label: a.label,
    fullName: a.full_name,
    phone: a.phone,
    governorate: a.governorate,
    area: a.area,
    street: a.street,
    building: a.building,
    floor: a.floor,
    notes: a.notes,
    isDefault: a.is_default,
  }));
}

/** Saves a checkout address to the signed-in customer's address book (skipping exact repeats). */
export async function addAddressFromCheckout(a: {
  fullName: string;
  phone: string;
  governorate: string;
  area: string;
  street: string;
  building: string;
  floor: string;
  addressNotes: string;
}): Promise<void> {
  const customerId = await ensureCustomer();
  if (!customerId) return;
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from('addresses')
    .select('governorate, area, street, building, floor')
    .eq('customer_id', customerId);
  const same = (existing ?? []).some(
    (e) =>
      e.governorate === a.governorate &&
      e.area === a.area &&
      e.street === a.street &&
      (e.building ?? '') === a.building &&
      (e.floor ?? '') === a.floor,
  );
  if (same) return;
  const { error } = await supabase.from('addresses').insert({
    customer_id: customerId,
    full_name: a.fullName,
    phone: a.phone,
    governorate: a.governorate,
    area: a.area,
    street: a.street,
    building: a.building || null,
    floor: a.floor || null,
    notes: a.addressNotes || null,
    is_default: (existing ?? []).length === 0,
  });
  if (error) console.error('addAddressFromCheckout failed', error);
}
