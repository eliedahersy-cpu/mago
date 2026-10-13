'use server';

import { refresh, updateTag } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/dal';
import { dbErrorMessage } from '@/lib/admin/db-error';
import { checkbox, type ActionResult, num, parseWith, text } from '@/lib/admin/form-data';
import { CACHE_TAGS } from '@/lib/data/cached';
import { createClient } from '@/lib/supabase/server';

const UUID = z.uuid();
const ACTIONS = ['pause', 'resume', 'skip', 'cancel'] as const;

/** Pause, resume, skip or cancel any subscription (update_subscription lets staff act on all). */
export async function staffSubscriptionAction(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/subscriptions');
  const id = text(fd, 'subscriptionId');
  const action = text(fd, 'action');
  if (!UUID.safeParse(id).success || !(ACTIONS as readonly string[]).includes(action)) return { ok: false, error: 'Subscription not found.' };
  const supabase = await createClient();
  const { error } = await supabase.rpc('update_subscription', { p_id: id, p_action: action, p_payload: {} });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  refresh();
  const done: Record<string, string> = { pause: 'Paused.', resume: 'Resumed.', skip: 'Next delivery skipped.', cancel: 'Cancelled.' };
  return { ok: true, message: done[action] };
}

/** Creates the orders for subscriptions due in the next 2 days now (the same job runs daily at 06:00). */
export async function runDueSubscriptions(): Promise<ActionResult> {
  await requireStaff('/admin/subscriptions');
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('process_due_subscriptions');
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.catalog);
  refresh();
  const n = Number(data ?? 0);
  return { ok: true, message: n === 0 ? 'Nothing was due: no new orders.' : `${n} ${n === 1 ? 'order' : 'orders'} created.` };
}

const planSchema = z.object({
  name: z.string().min(1, 'Enter a name.').max(60),
  intervalWeeks: z.number({ error: 'Enter the weeks.' }).int('Use whole weeks.').min(1, 'At least 1 week.').max(26, 'At most 26 weeks.'),
  discountPercent: z.number({ error: 'Enter the discount.' }).min(0, 'Cannot be negative.').max(50, 'At most 50%.'),
  isPopular: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

export async function savePlan(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/subscriptions/plans');
  const id = text(fd, 'id');
  if (id && !UUID.safeParse(id).success) return { ok: false, error: 'Plan not found.' };
  const parsed = parseWith(planSchema, {
    name: text(fd, 'name'),
    intervalWeeks: num(fd, 'intervalWeeks') ?? Number.NaN,
    discountPercent: num(fd, 'discountPercent') ?? Number.NaN,
    isPopular: checkbox(fd, 'isPopular'),
    isActive: checkbox(fd, 'isActive'),
    sortOrder: num(fd, 'sortOrder') ?? 0,
  });
  if (!parsed.ok) return { ok: false, error: Object.values(parsed.fieldErrors)[0] ?? 'Please check the plan.', fieldErrors: parsed.fieldErrors };
  const p = parsed.data;
  const row = {
    name: p.name,
    interval_weeks: p.intervalWeeks,
    discount_percent: p.discountPercent,
    is_popular: p.isPopular,
    is_active: p.isActive,
    sort_order: p.sortOrder,
  };
  const supabase = await createClient();
  const { error } = id ? await supabase.from('subscription_plans').update(row).eq('id', id) : await supabase.from('subscription_plans').insert(row);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.plans);
  refresh();
  return { ok: true, message: id ? 'Plan saved.' : 'Plan added.' };
}
