import type { AutomaticDiscount } from '@/lib/types';

export interface EstimateInput {
  /** Cups only (loose and boxed) — the automatic discount applies to these. */
  cupSubtotal: number;
  cupCount: number;
  /** Everything that is not a cup (extras, merch). */
  otherSubtotal: number;
  discount: AutomaticDiscount | null;
  shippingFlatFee: number;
  freeShippingThreshold: number;
}

export interface Totals {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
}

const toCents = (n: number) => Math.round(n * 100);

/**
 * Display estimate of spec section 6 (rules 3, 5 and 7) for pages that show a total before
 * checkout. The checkout page shows `quote_cart` instead, which is the source of truth.
 */
export function estimateTotals(input: EstimateInput): Totals {
  const cupCents = toCents(input.cupSubtotal);
  const subtotal = cupCents + toCents(input.otherSubtotal);
  const rate = input.discount && input.cupCount >= input.discount.minCupQuantity ? input.discount.value : 0;
  const discount = Math.round((cupCents * rate) / 100);
  const afterDiscount = subtotal - discount;
  const freeDelivery = subtotal === 0 || afterDiscount >= toCents(input.freeShippingThreshold);
  const shipping = freeDelivery ? 0 : toCents(input.shippingFlatFee);
  return { subtotal: subtotal / 100, discount: discount / 100, shipping: shipping / 100, total: (afterDiscount + shipping) / 100 };
}
