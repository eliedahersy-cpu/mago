import { fieldErrors } from '@/lib/checkout/schema';
import { emailOnlySchema, loginSchema, newPasswordSchema, registerSchema } from '@/lib/auth/schemas';

const errorsOf = (result: { success: boolean; error?: unknown }) =>
  result.success ? {} : fieldErrors(result.error as Parameters<typeof fieldErrors>[0]);

test('sign-in needs an email and a password', () => {
  expect(loginSchema.parse({ email: ' Lina@Example.com ', password: 'x' }).email).toBe('lina@example.com');
  expect(errorsOf(loginSchema.safeParse({ email: '', password: '' }))).toEqual({
    email: 'Please enter a valid email address.',
    password: 'Please enter your password.',
  });
});

test('registration asks for a name and a password of at least 8 characters', () => {
  const ok = registerSchema.safeParse({ fullName: 'Lina Haddad', email: 'lina@example.com', password: 'longenough', acceptsMarketing: true });
  expect(ok.success).toBe(true);
  expect(errorsOf(registerSchema.safeParse({ fullName: 'L', email: 'lina@example.com', password: 'short' }))).toEqual({
    fullName: 'Please enter your full name.',
    password: 'Use at least 8 characters.',
  });
});

test('a new password must be repeated exactly', () => {
  expect(newPasswordSchema.safeParse({ password: 'longenough', confirm: 'longenough' }).success).toBe(true);
  expect(errorsOf(newPasswordSchema.safeParse({ password: 'longenough', confirm: 'different' }))).toEqual({
    confirm: 'The passwords do not match.',
  });
});

test('an emailed link needs a valid email', () => {
  expect(errorsOf(emailOnlySchema.safeParse({ email: 'nope' }))).toEqual({ email: 'Please enter a valid email address.' });
});
