import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address.'));
// Supabase hashes with bcrypt, which only reads the first 72 bytes.
const newPassword = z.string().min(8, 'Use at least 8 characters.').max(72, 'Use at most 72 characters.');

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Please enter your password.'),
});

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(100, 'Please shorten your name.'),
  email,
  password: newPassword,
  acceptsMarketing: z.boolean().default(false),
});

export const emailOnlySchema = z.object({ email });

export const newPasswordSchema = z
  .object({ password: newPassword, confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: 'The passwords do not match.', path: ['confirm'] });
