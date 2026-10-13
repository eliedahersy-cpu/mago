'use server';

import { refresh } from 'next/cache';
import { z } from 'zod';
import { dbErrorMessage } from '@/lib/admin/db-error';
import { type ActionResult, text } from '@/lib/admin/form-data';
import { getUser } from '@/lib/auth/dal';
import { createPublicClient } from '@/lib/supabase/public';
import { createClient } from '@/lib/supabase/server';

const UUID = z.uuid();
const itemsSchema = z.object({
  cups: z.array(z.object({ product_id: z.uuid(), quantity: z.number().int().min(1).max(99) })).max(20),
  extras: z.array(z.object({ product_id: z.uuid(), quantity: z.number().int().min(1).max(99) })).max(20),
});
export type BoxItems = z.infer<typeof itemsSchema>;

export interface SubscriptionQuote {
  cupsSubtotal: number;
  extrasSubtotal: number;
  subtotal: number;
  discountPercent: number;
  discount: number;
  shipping: number;
  total: number;
  errors: string[];
}

/** Server prices for a box on a plan (quote_subscription). */
export async function quoteSubscription(planId: string, items: BoxItems): Promise<{ ok: true; quote: SubscriptionQuote } | { ok: false; error: string }> {
  const plan = UUID.safeParse(planId);
  const parsed = itemsSchema.safeParse(items);
  if (!plan.success || !parsed.success) return { ok: false, error: 'Your box could not be read. Please refresh the page.' };
  const { data, error } = await createPublicClient().rpc('quote_subscription', { p_plan: plan.data, p_items: parsed.data });
  if (error) {
    console.error('quote_subscription failed', error);
    return { ok: false, error: 'We could not price your box. Please try again.' };
  }
  const q = data as Record<string, unknown>;
  const n = (k: string) => Number(q[k] ?? 0);
  return {
    ok: true,
    quote: {
      cupsSubtotal: n('cups_subtotal'),
      extrasSubtotal: n('extras_subtotal'),
      subtotal: n('subtotal'),
      discountPercent: n('discount_percent'),
      discount: n('discount'),
      shipping: n('shipping'),
      total: n('total'),
      errors: ((q.errors as { message: string }[] | null) ?? []).map((e) => e.message),
    },
  };
}

const addressSchema = z.object({
  fullName: z.string().max(100),
  phone: z.string().max(20),
  governorate: z.string().max(60),
  area: z.string().max(100),
  street: z.string().max(200),
  building: z.string().max(100),
  floor: z.string().max(50),
  notes: z.string().max(200),
});

const createSchema = z.object({
  planId: z.uuid(),
  items: itemsSchema,
  address: addressSchema,
  isGift: z.boolean(),
  giftNote: z.string().max(200),
  startDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
});

/** Starts a subscription for the signed-in customer (create_subscription checks everything again). */
export async function createSubscription(input: z.input<typeof createSchema>): Promise<{ ok: true; id: string } | { ok: false; error: string; signIn?: boolean }> {
  if (!(await getUser())) return { ok: false, error: 'Sign in to subscribe.', signIn: true };
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Please check your box and delivery details.' };
  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('create_subscription', {
    payload: {
      plan_id: d.planId,
      items: d.items,
      address: {
        full_name: d.address.fullName,
        phone: d.address.phone,
        governorate: d.address.governorate,
        area: d.address.area,
        street: d.address.street,
        building: d.address.building,
        floor: d.address.floor,
        notes: d.address.notes,
      },
      is_gift: d.isGift,
      gift_note: d.giftNote,
      ...(d.startDate ? { start_date: d.startDate } : {}),
    },
  });
  if (error) return { ok: false, error: dbErrorMessage(error, 'We could not start your subscription. Please try again.') };
  return { ok: true, id: String(data) };
}

const ACTIONS = ['pause', 'resume', 'skip', 'cancel', 'change_plan'] as const;
const DONE: Record<(typeof ACTIONS)[number], string> = {
  pause: 'Paused. Nothing will be sent until you resume.',
  resume: 'Resumed.',
  skip: 'Skipped: your next box moves to the following delivery.',
  cancel: 'Cancelled.',
  change_plan: 'Delivery plan changed.',
};

/** Pause, resume, skip, cancel or change plan on one of the customer's own subscriptions. */
export async function manageSubscription(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await getUser())) return { ok: false, error: 'Sign in again to manage your subscription.' };
  const id = text(fd, 'subscriptionId');
  const action = text(fd, 'action');
  if (!UUID.safeParse(id).success || !(ACTIONS as readonly string[]).includes(action)) return { ok: false, error: 'Subscription not found.' };
  const planId = text(fd, 'planId');
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_subscription', {
    p_id: id,
    p_action: action,
    p_payload: action === 'change_plan' ? { plan_id: planId } : {},
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  refresh();
  return { ok: true, message: DONE[action as (typeof ACTIONS)[number]] };
}

/** New cups (and extras) for an existing subscription. */
export async function updateSubscriptionItems(id: string, items: BoxItems): Promise<ActionResult> {
  if (!(await getUser())) return { ok: false, error: 'Sign in again to manage your subscription.' };
  const parsed = itemsSchema.safeParse(items);
  if (!UUID.safeParse(id).success || !parsed.success) return { ok: false, error: 'Your box could not be read.' };
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_subscription', { p_id: id, p_action: 'update_items', p_payload: { items: parsed.data } });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  refresh();
  return { ok: true, message: 'Your box is updated.' };
}
