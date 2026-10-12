import { z } from 'zod';
import type { CartLine } from '@/lib/cart/lines';
import type { CheckoutData } from './schema';

const id = z.string().min(1).max(64);

/** What quote_cart and place_order accept: ids and quantities only, never prices. */
export const itemsPayloadSchema = z
  .array(
    z.strictObject({
      product_id: id,
      quantity: z.number().int().min(1).max(99),
      children: z.array(id).max(20).optional(),
    }),
  )
  .max(50);

export type ItemsPayload = z.infer<typeof itemsPayloadSchema>;

export function toItemsPayload(lines: CartLine[]): ItemsPayload {
  return lines.map((line) =>
    line.kind === 'product'
      ? { product_id: line.productId, quantity: line.quantity }
      : {
          product_id: line.productId,
          quantity: line.quantity,
          children: line.cups.flatMap((cup) => Array.from({ length: cup.quantity }, () => cup.productId)),
        },
  );
}

/** The place_order payload (see supabase/migrations/0006_commerce_functions.sql). */
export function toOrderPayload(form: CheckoutData, items: ItemsPayload, idempotencyKey: string) {
  return {
    idempotency_key: idempotencyKey,
    items,
    code: form.code,
    accepts_marketing: form.acceptsMarketing,
    contact: { full_name: form.fullName, email: form.email, phone: form.phone },
    address: {
      governorate: form.governorate,
      area: form.area,
      street: form.street,
      building: form.building,
      floor: form.floor,
      notes: form.addressNotes,
    },
    special_instructions: form.instructions,
    is_gift: form.isGift,
    gift_note: form.giftNote,
  };
}
