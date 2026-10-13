import { toOrderConfirmation, type OrderConfirmation } from '@/lib/checkout/quote';

export interface OrderItemRow {
  id: string;
  parent_item_id: string | null;
  name: string;
  flavour: string | null;
  image: string | null;
  unit_price: number | string;
  quantity: number;
  line_total: number | string;
  created_at: string;
}

export interface OrderRow {
  number: number;
  status: string;
  created_at: string;
  email: string;
  phone: string;
  shipping_address: Record<string, unknown> | null;
  special_instructions: string | null;
  is_gift: boolean;
  gift_note: string | null;
  subtotal: number | string;
  discount_total: number | string;
  shipping_total: number | string;
  total: number | string;
  discount_code: string | null;
  payment_method: string;
  payment_status: string;
  order_items: OrderItemRow[];
}

const byCreated = (a: OrderItemRow, b: OrderItemRow) => a.created_at.localeCompare(b.created_at) || a.name.localeCompare(b.name);

/** An order read from the tables (through RLS) in the same shape as the guest confirmation. */
export function toAccountOrder(row: OrderRow): OrderConfirmation {
  const items = [...row.order_items].sort(byCreated);
  const json = {
    ...row,
    full_name: row.shipping_address?.full_name ?? '',
    items: items
      .filter((i) => i.parent_item_id === null)
      .map((parent) => ({
        ...parent,
        children: items.filter((c) => c.parent_item_id === parent.id).sort((a, b) => a.name.localeCompare(b.name)),
      })),
  };
  // Every row comes from an order, so the mapper always returns a value here.
  return toOrderConfirmation(json)!;
}

/** Lines the customer ordered (a box counts once; its cups are not separate items). */
export function orderItemCount(items: Pick<OrderItemRow, 'parent_item_id' | 'quantity'>[]): number {
  return items.filter((i) => i.parent_item_id === null).reduce((n, i) => n + i.quantity, 0);
}
