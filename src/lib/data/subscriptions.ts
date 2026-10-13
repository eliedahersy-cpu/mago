import { createPublicClient } from '@/lib/supabase/public';
import { createClient } from '@/lib/supabase/server';
import { ensureCustomer } from './account';

export interface SubscriptionPlan {
  id: string;
  name: string;
  intervalWeeks: number;
  discountPercent: number;
  isPopular: boolean;
}

type Raw = Record<string, unknown>;

/** Active plans in display order (public). */
export async function getActivePlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await createPublicClient()
    .from('subscription_plans')
    .select('id, name, interval_weeks, discount_percent, is_popular')
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw new Error(`Failed to load subscription plans: ${error.message}`);
  return (data as Raw[]).map((p) => ({
    id: String(p.id),
    name: String(p.name),
    intervalWeeks: Number(p.interval_weeks),
    discountPercent: Number(p.discount_percent),
    isPopular: Boolean(p.is_popular),
  }));
}

export interface SubscriptionItems {
  cups: { product_id: string; quantity: number }[];
  extras: { product_id: string; quantity: number }[];
}

export interface MySubscription {
  id: string;
  status: 'active' | 'paused' | 'cancelled';
  planId: string;
  planName: string;
  intervalWeeks: number;
  discountPercent: number;
  items: SubscriptionItems;
  address: Record<string, string>;
  nextDeliveryDate: string;
  isGift: boolean;
  giftNote: string | null;
  createdAt: string;
}

export function toItems(v: unknown): SubscriptionItems {
  const o = (v && typeof v === 'object' ? v : {}) as Raw;
  const list = (x: unknown) =>
    (Array.isArray(x) ? (x as Raw[]) : []).map((i) => ({ product_id: String(i.product_id), quantity: Number(i.quantity) })).filter((i) => i.quantity > 0);
  return { cups: list(o.cups), extras: list(o.extras) };
}

/** The signed-in customer's own subscriptions, newest first (filtered by their customer id: staff RLS sees all). */
export async function getMySubscriptions(): Promise<MySubscription[]> {
  const customerId = await ensureCustomer();
  if (!customerId) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('subscriptions')
    .select('id, status, plan_id, items, address, next_delivery_date, is_gift, gift_note, created_at, plan:subscription_plans (name, interval_weeks, discount_percent)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`Failed to load your subscriptions: ${error.message}`);
  return (data as Raw[]).map((s) => {
    const plan = (s.plan as Raw | null) ?? {};
    return {
      id: String(s.id),
      status: s.status as MySubscription['status'],
      planId: String(s.plan_id),
      planName: String(plan.name ?? ''),
      intervalWeeks: Number(plan.interval_weeks ?? 0),
      discountPercent: Number(plan.discount_percent ?? 0),
      items: toItems(s.items),
      address: (s.address as Record<string, string>) ?? {},
      nextDeliveryDate: String(s.next_delivery_date),
      isGift: Boolean(s.is_gift),
      giftNote: (s.gift_note as string | null) ?? null,
      createdAt: String(s.created_at),
    };
  });
}
