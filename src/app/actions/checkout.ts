'use server';

import { z } from 'zod';
import { itemsPayloadSchema, toOrderPayload, type ItemsPayload } from '@/lib/checkout/payload';
import { toQuote, type Quote } from '@/lib/checkout/quote';
import { checkoutSchema, fieldErrors, type CheckoutInput } from '@/lib/checkout/schema';
import { createPublicClient } from '@/lib/supabase/public';

const codeSchema = z.string().trim().max(40);

/** Server-truth totals for the cart (quote_cart). Prices are never taken from the browser. */
export async function quoteCart(items: ItemsPayload, code?: string): Promise<Quote> {
  const parsedItems = itemsPayloadSchema.safeParse(items);
  const parsedCode = codeSchema.safeParse(code ?? '');
  if (!parsedItems.success || !parsedCode.success) throw new Error('Your cart could not be read. Please refresh the page.');

  const { data, error } = await createPublicClient().rpc('quote_cart', {
    items: parsedItems.data,
    code: parsedCode.data || null,
  });
  if (error) {
    console.error('quote_cart failed', error);
    throw new Error('We could not price your cart. Please try again.');
  }
  return toQuote(data);
}

export type PlaceOrderResult =
  | { ok: true; token: string; number: number }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const keySchema = z.uuid();

export async function placeOrder(input: { form: CheckoutInput; items: ItemsPayload; idempotencyKey: string }): Promise<PlaceOrderResult> {
  const form = checkoutSchema.safeParse(input.form);
  if (!form.success) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: fieldErrors(form.error) };
  const items = itemsPayloadSchema.safeParse(input.items);
  const key = keySchema.safeParse(input.idempotencyKey);
  if (!items.success || !key.success || items.data.length === 0) {
    return { ok: false, error: 'Your cart could not be read. Please refresh the page and try again.' };
  }

  const { data, error } = await createPublicClient().rpc('place_order', {
    payload: toOrderPayload(form.data, items.data, key.data),
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
