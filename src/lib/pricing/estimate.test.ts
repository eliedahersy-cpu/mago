import { estimateTotals } from '@/lib/pricing/estimate';

const base = {
  otherSubtotal: 0,
  discount: { title: 'Mix & Match 10%', value: 10, minCupQuantity: 5 },
  shippingFlatFee: 3,
  freeShippingThreshold: 30,
};

test('five cups get 10% off and pay delivery', () => {
  expect(estimateTotals({ ...base, cupSubtotal: 22.5, cupCount: 5 })).toEqual({ subtotal: 22.5, discount: 2.25, shipping: 3, total: 23.25 });
});

test('four cups pay full price', () => {
  expect(estimateTotals({ ...base, cupSubtotal: 18, cupCount: 4 })).toEqual({ subtotal: 18, discount: 0, shipping: 3, total: 21 });
});

test('delivery is free once the discounted subtotal reaches the threshold', () => {
  expect(estimateTotals({ ...base, cupSubtotal: 36, cupCount: 8 })).toEqual({ subtotal: 36, discount: 3.6, shipping: 0, total: 32.4 });
});

test('no automatic discount means no discount', () => {
  expect(estimateTotals({ ...base, discount: null, cupSubtotal: 22.5, cupCount: 5 }).discount).toBe(0);
});

test('an empty cart costs nothing', () => {
  expect(estimateTotals({ ...base, cupSubtotal: 0, cupCount: 0 })).toEqual({ subtotal: 0, discount: 0, shipping: 0, total: 0 });
});

test('the discount applies to cups only, the threshold to everything', () => {
  expect(estimateTotals({ ...base, otherSubtotal: 10, cupSubtotal: 22.5, cupCount: 5 })).toEqual({
    subtotal: 32.5,
    discount: 2.25,
    shipping: 0,
    total: 30.25,
  });
});
