import { canContinue, cupCount, EMPTY_DRAFT, sanitizeDraft, setQty, toItems, type SubscriptionDraft } from '@/lib/subscriptions/draft';

const PLAN = '00000000-0000-4000-8000-0000000000d1';
const A = '00000000-0000-4000-8000-0000000000a1';
const B = '00000000-0000-4000-8000-0000000000b1';
const X = '00000000-0000-4000-8000-0000000000e1';

const address = { fullName: 'Cara Client', phone: '+961 70 000 000', governorate: 'Beirut', area: 'Hamra', street: 'Bliss', building: '', floor: '', notes: '' };

test('cups never go over the box size; zero removes a cup', () => {
  let cups = setQty({}, A, 3, 5);
  cups = setQty(cups, B, 4, 5);
  expect(cups).toEqual({ [A]: 3, [B]: 2 });
  expect(cupCount({ ...EMPTY_DRAFT, cups })).toBe(5);
  expect(setQty(cups, A, 0, 5)).toEqual({ [B]: 2 });
  expect(setQty({}, X, 7, null)).toEqual({ [X]: 7 });
});

test('each step opens only when the one before is complete', () => {
  const d: SubscriptionDraft = { ...EMPTY_DRAFT };
  expect(canContinue(d, 1, 5)).toBe(false);
  const withPlan = { ...d, planId: PLAN };
  expect(canContinue(withPlan, 1, 5)).toBe(true);
  expect(canContinue(withPlan, 2, 5)).toBe(false);
  const withCups = { ...withPlan, cups: { [A]: 5 } };
  expect(canContinue(withCups, 2, 5)).toBe(true);
  expect(canContinue(withCups, 3, 5)).toBe(false);
  expect(canContinue({ ...withCups, address }, 3, 5)).toBe(true);
  expect(canContinue({ ...withCups, address: { ...address, phone: 'call me' } }, 3, 5)).toBe(false);
});

test('the box goes to the server as ids and quantities', () => {
  expect(toItems({ ...EMPTY_DRAFT, cups: { [A]: 2, [B]: 3 }, extras: { [X]: 1 } })).toEqual({
    cups: [
      { product_id: A, quantity: 2 },
      { product_id: B, quantity: 3 },
    ],
    extras: [{ product_id: X, quantity: 1 }],
  });
});

test('a saved draft is read back safely', () => {
  const saved = { step: 3, planId: PLAN, cups: { [A]: 5, junk: 2, [B]: -1 }, extras: { [X]: 200 }, address, isGift: true, giftNote: 'Hi', startDate: '2026-10-20' };
  expect(sanitizeDraft(saved)).toEqual({ ...saved, cups: { [A]: 5 }, extras: { [X]: 99 } });
  expect(sanitizeDraft('nonsense')).toEqual(EMPTY_DRAFT);
  expect(sanitizeDraft({ step: 9, planId: 'x', startDate: 'soon' })).toMatchObject({ step: 1, planId: null, startDate: '' });
});
