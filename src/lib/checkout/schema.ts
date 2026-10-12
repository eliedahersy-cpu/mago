import { z } from 'zod';

/** Same rule as place_order: starts with + or a digit, 6–20 characters of digits, spaces and dashes. */
export const PHONE_PATTERN = /^[+0-9][0-9 -]{5,19}$/;

const optionalText = (max: number) => z.string().trim().max(max).default('');

export const checkoutSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(100, 'Please shorten your name.'),
  email: z.string().trim().toLowerCase().pipe(z.email('Please enter a valid email address.')),
  phone: z.string().trim().regex(PHONE_PATTERN, 'Please enter a valid phone number.'),
  governorate: z.string().trim().min(1, 'Please choose your governorate.'),
  area: z.string().trim().min(1, 'Please enter your area.').max(100),
  street: z.string().trim().min(1, 'Please enter your street.').max(200),
  building: optionalText(100),
  floor: optionalText(50),
  addressNotes: optionalText(200),
  instructions: optionalText(500),
  isGift: z.boolean().default(false),
  giftNote: optionalText(200),
  acceptsMarketing: z.boolean().default(false),
  code: optionalText(40),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

/** First message per field, keyed by field name, for showing next to each input. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}
