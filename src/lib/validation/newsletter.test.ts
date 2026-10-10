import { newsletterSchema } from '@/lib/validation/newsletter';

test('accepts a valid email', () => {
  expect(newsletterSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
});

test('rejects junk with the friendly message', () => {
  const r = newsletterSchema.safeParse({ email: 'nope' });
  expect(r.success).toBe(false);
  expect(r.error!.issues[0].message).toBe('Enter a valid email');
});
