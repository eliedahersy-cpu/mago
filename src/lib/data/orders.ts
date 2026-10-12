import { toOrderConfirmation, type OrderConfirmation } from '@/lib/checkout/quote';
import { createPublicClient } from '@/lib/supabase/public';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** A guest's order, found only by its unguessable access token. Never cached: it is personal data. */
export async function getOrderByToken(token: string): Promise<OrderConfirmation | null> {
  if (!UUID.test(token)) return null;
  const { data, error } = await createPublicClient().rpc('get_order_by_token', { token });
  if (error) throw new Error(`Failed to load order: ${error.message}`);
  return toOrderConfirmation(data);
}
