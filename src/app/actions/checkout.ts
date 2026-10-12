'use server';

import { z } from 'zod';
import { itemsPayloadSchema, toOrderPayload, type ItemsPayload } from '@/lib/checkout/payload';
import { toQuote, type Quote } from '@/lib/checkout/quote';
import { checkoutSchema, fieldErrors, type CheckoutInput } from '@/lib/checkout/schema';
import { createPublicClient } from '@/lib/supabase/public';

const codeSchema = z.string().trim().max(40);

// Results are returned, never thrown: production builds replace thrown messages with a
// generic one, and these are shown to customers.
export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string };

/** Server-truth totals for the cart (quote_cart). Prices are never taken from the browser. */
export async function quoteCart(items: ItemsPayload, code?: string): Promise<QuoteResult> {
  const parsedItems = itemsPayloadSchema.safeParse(items);
  const parsedCode = codeSchema.safeParse(code ?? '');
  if (!parsedItems.success || !parsedCode.success) {
    return { ok: false, error: 'Your cart could not be read. Please refresh the page.' };
  }

  const { data, error } = await createPublicClient().rpc('quote_cart', {
    items: parsedItems.data,
    code: parsedCode.data || null,
  });
  if (error) {
    console.error('quote_cart failed', error);
    return { ok: false, error: 'We could not price your cart. Please try again.' };
  }
  return { ok: true, quote: toQuote(data) };
}

export type PlaceOrderResult =
  | { ok: true; token: string; number: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const keySchema = z.uuid();
const totalSchema = z.number().nonnegative().finite();

export async function placeOrder(input: {
  form: CheckoutInput;
  items: ItemsPayload;
  idempotencyKey: string;
  /** The total shown to the customer; the order is refused if the real total differs. */
  expectedTotal: number;
}): Promise<PlaceOrderResult> {
  const form = checkoutSchema.safeParse(input.form);
  if (!form.success) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: fieldErrors(form.error) };
  const items = itemsPayloadSchema.safeParse(input.items);
  const key = keySchema.safeParse(input.idempotencyKey);
  const expectedTotal = totalSchema.safeParse(input.expectedTotal);
  if (!items.success || !key.success || !expectedTotal.success || items.data.length === 0) {
    return { ok: false, error: 'Your cart could not be read. Please refresh the page and try again.' };
  }

  const { data, error } = await createPublicClient().rpc('place_order', {
    payload: toOrderPayload(form.data, items.data, key.data, expectedTotal.data),
  });
  if (error) {
    // P0001 messages are written for customers in place_order; anything else is ours to log.
    if (error.code === 'P0001') return { ok: false, error: error.message };
    console.error('place_order failed', error);
    return { ok: false, error: 'We could not place your order. Please try again in a moment.' };
  }
  const result = data as { number: number; access_token: string };
  return { ok: true, token: result.access_token, number: result.number };
}
