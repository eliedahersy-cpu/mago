import { parseDiscountForm } from '@/lib/admin/discount-form';
import { parseSettingsForm } from '@/lib/admin/settings-form';

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

test('a discount code is upper-cased and its window must run forwards', () => {
  const r = parseDiscountForm(form({ code: ' welcome10 ', title: 'Welcome', kind: 'percentage', value: '10', appliesTo: 'order', isActive: 'on' }));
  expect(r).toMatchObject({ ok: true, data: { code: 'WELCOME10', value: 10, isAutomatic: false, isActive: true, usageLimit: null } });

  const bad = parseDiscountForm(
    form({ code: 'no spaces!', title: '', kind: 'percentage', value: '120', appliesTo: 'order', startsAt: '2026-10-20T10:00', endsAt: '2026-10-10T10:00' }),
  );
  expect(bad.ok).toBe(false);
  if (!bad.ok) expect(Object.keys(bad.fieldErrors).sort()).toEqual(['code', 'endsAt', 'title', 'value']);
});

test('automatic rules need no code but must be a percentage off cups', () => {
  expect(parseDiscountForm(form({ title: 'Mix & Match', kind: 'percentage', value: '10', appliesTo: 'cups', isAutomatic: 'on', minCupQuantity: '5' }))).toMatchObject({
    ok: true,
    data: { code: null, isAutomatic: true, minCupQuantity: 5 },
  });
  const r = parseDiscountForm(form({ title: 'Wrong', kind: 'fixed_amount', value: '5', appliesTo: 'order', isAutomatic: 'on' }));
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.fieldErrors.kind).toBe('Automatic discounts must be a percentage off cups.');
  const noCode = parseDiscountForm(form({ title: 'Code needed', kind: 'free_shipping', value: '0', appliesTo: 'order' }));
  expect(noCode.ok).toBe(false);
});

test('settings keep delivery areas one per line and only https social links', () => {
  const r = parseSettingsForm(
    form({
      storeName: 'MAGO',
      contactEmail: 'hello@mago.example',
      shippingFlatFee: '3',
      freeShippingThreshold: '30',
      deliveryAreas: 'Beirut\n\nMount Lebanon ',
      announcementBar: 'Free delivery over $30',
      instagram: 'https://instagram.com/mago',
      tiktok: '',
    }),
  );
  expect(r).toMatchObject({
    ok: true,
    data: { deliveryAreas: ['Beirut', 'Mount Lebanon'], socialLinks: { instagram: 'https://instagram.com/mago' }, contactPhone: null },
  });
  const bad = parseSettingsForm(form({ storeName: '', contactEmail: 'nope', shippingFlatFee: '-1', freeShippingThreshold: 'x', facebook: 'javascript:alert(1)' }));
  expect(bad.ok).toBe(false);
  if (!bad.ok) expect(Object.keys(bad.fieldErrors).sort()).toEqual(['contactEmail', 'facebook', 'freeShippingThreshold', 'shippingFlatFee', 'storeName']);
});
