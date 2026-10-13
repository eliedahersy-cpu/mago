'use server';

import { refresh, updateTag } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/dal';
import { dbErrorMessage } from '@/lib/admin/db-error';
import type { ActionResult } from '@/lib/admin/form-data';
import { ORDER_STATUSES, PAYMENT_STATUSES, STATUS_LABEL } from '@/lib/admin/orders';
import { itemsPayloadSchema, toOrderPayload, type ItemsPayload } from '@/lib/checkout/payload';
import { toQuote } from '@/lib/checkout/quote';
import { checkoutSchema, fieldErrors as checkoutFieldErrors, type CheckoutInput } from '@/lib/checkout/schema';
import { CACHE_TAGS } from '@/lib/data/cached';
import { createClient } from '@/lib/supabase/server';

const UUID = z.uuid();

function field(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Moves an order along (or cancels it). The SQL function enforces the flow and restocks on cancel. */
export async function changeOrderStatus(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/orders');
  const id = field(fd, 'orderId');
  const status = field(fd, 'status');
  const note = field(fd, 'note').slice(0, 500) || null;
  if (!UUID.safeParse(id).success || !(ORDER_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: 'Choose a valid status.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_order_status', { p_order: id, p_status: status, p_note: note });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  // Cancelling puts cups back in stock, which the shop shows.
  if (status === 'cancelled') updateTag(CACHE_TAGS.catalog);
  refresh();
  return { ok: true, message: `Marked as ${STATUS_LABEL[status as keyof typeof STATUS_LABEL].toLowerCase()}.` };
}

export async function changePaymentStatus(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/orders');
  const id = field(fd, 'orderId');
  const status = field(fd, 'payment');
  if (!UUID.safeParse(id).success || !(PAYMENT_STATUSES as readonly string[]).includes(status)) {
    return { ok: false, error: 'Choose a valid payment status.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc('set_order_payment', { p_order: id, p_status: status });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  refresh();
  return { ok: true, message: status === 'paid' ? 'Marked as paid.' : status === 'refunded' ? 'Marked as refunded.' : 'Marked as unpaid.' };
}

/** Adds a staff note to the order timeline. */
export async function addOrderNote(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const staff = await requireStaff('/admin/orders');
  const id = field(fd, 'orderId');
  const note = field(fd, 'note');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Order not found.' };
  if (!note) return { ok: false, error: 'Write a note first.', fieldErrors: { note: 'Write a note first.' } };
  if (note.length > 1000) return { ok: false, error: 'Keep notes under 1,000 characters.', fieldErrors: { note: 'Keep notes under 1,000 characters.' } };
  const supabase = await createClient();
  const { error } = await supabase.from('order_events').insert({ order_id: id, type: 'note', message: note, created_by: staff.id });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  refresh();
  return { ok: true, message: 'Note added.' };
}

export type ManualOrderResult = { ok: true; number: number } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * An order taken by phone or in person: priced by quote_cart, placed by place_order (stock and
 * discounts behave exactly as on the website), then marked as an admin order.
 */
export async function createManualOrder(input: { form: CheckoutInput; items: ItemsPayload; paid: boolean }): Promise<ManualOrderResult> {
  const staff = await requireStaff('/admin/orders/new');
  const form = checkoutSchema.safeParse(input.form);
  if (!form.success) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: checkoutFieldErrors(form.error) };
  const items = itemsPayloadSchema.safeParse(input.items);
  if (!items.success || items.data.length === 0) return { ok: false, error: 'Add at least one product.' };

  const supabase = await createClient();
  const { data: quoteJson, error: quoteError } = await supabase.rpc('quote_cart', { items: items.data, code: form.data.code || null });
  if (quoteError) return { ok: false, error: dbErrorMessage(quoteError, 'Could not price the order.') };
  const quote = toQuote(quoteJson);
  const problems = quote.errors;
  if (problems.length) return { ok: false, error: problems.map((p) => p.message).join(' ') };

  const { data, error } = await supabase.rpc('place_order', {
    payload: toOrderPayload(form.data, items.data, crypto.randomUUID(), quote.total),
  });
  if (error) return { ok: false, error: dbErrorMessage(error, 'Could not place the order.') };
  const number = Number((data as { number: number }).number);

  const { data: order } = await supabase.from('orders').update({ source: 'admin' }).eq('number', number).select('id').single();
  if (order) {
    await supabase.from('order_events').insert({
      order_id: order.id,
      type: 'note',
      message: `Created in the admin by ${staff.fullName || staff.email}.`,
      created_by: staff.id,
    });
    if (input.paid) await supabase.rpc('set_order_payment', { p_order: order.id, p_status: 'paid' });
  }
  updateTag(CACHE_TAGS.catalog);
  return { ok: true, number };
}
