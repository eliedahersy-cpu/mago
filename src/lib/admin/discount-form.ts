import { z } from 'zod';
import { checkbox, type FormResult, num, parseWith, text } from './form-data';
import { beirutLocalToIso } from './stats';

export const DISCOUNT_KINDS = ['percentage', 'fixed_amount', 'free_shipping'] as const;
export const DISCOUNT_TARGETS = ['order', 'cups'] as const;

export const KIND_LABEL: Record<(typeof DISCOUNT_KINDS)[number], string> = {
  percentage: 'Percentage off',
  fixed_amount: 'Fixed amount off',
  free_shipping: 'Free delivery',
};

const when = z
  .string()
  .nullable()
  .refine((v) => v === null || !Number.isNaN(new Date(v).getTime()), 'Enter a valid date and time.');

const discountSchema = z
  .object({
    code: z
      .string()
      .regex(/^[A-Z0-9_-]{3,32}$/, 'Use 3–32 letters, numbers, dashes or underscores.')
      .nullable(),
    title: z.string().min(1, 'Enter a title.').max(80),
    kind: z.enum(DISCOUNT_KINDS),
    value: z.number({ error: 'Enter a value.' }).finite('Enter a value.').min(0, 'The value cannot be negative.'),
    appliesTo: z.enum(DISCOUNT_TARGETS),
    minSubtotal: z.number().min(0, 'Cannot be negative.').nullable(),
    minCupQuantity: z.number().int('Use a whole number.').min(1, 'At least 1 cup.').nullable(),
    startsAt: when,
    endsAt: when,
    usageLimit: z.number().int('Use a whole number.').min(1, 'At least 1 use.').nullable(),
    oncePerCustomer: z.boolean(),
    isAutomatic: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((d, ctx) => {
    if (d.kind === 'percentage' && d.value > 100) ctx.addIssue({ code: 'custom', path: ['value'], message: 'A percentage cannot be over 100.' });
    if (!d.isAutomatic && !d.code) ctx.addIssue({ code: 'custom', path: ['code'], message: 'Enter a code customers will type.' });
    if (d.isAutomatic && (d.kind !== 'percentage' || d.appliesTo !== 'cups')) {
      ctx.addIssue({ code: 'custom', path: ['kind'], message: 'Automatic discounts must be a percentage off cups.' });
    }
    if (d.startsAt && d.endsAt && new Date(d.endsAt) <= new Date(d.startsAt)) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'The end must be after the start.' });
    }
  });

export type DiscountInput = z.infer<typeof discountSchema>;

/** Datetime-local value (staff type Lebanon time) -> ISO instant; empty -> null; malformed -> kept so validation fails. */
function localDateTime(fd: FormData, key: string): string | null {
  const v = text(fd, key);
  if (!v) return null;
  return beirutLocalToIso(v) ?? 'invalid';
}

export function parseDiscountForm(fd: FormData): FormResult<DiscountInput> {
  const isAutomatic = checkbox(fd, 'isAutomatic');
  const code = text(fd, 'code').toUpperCase();
  return parseWith(discountSchema, {
    code: isAutomatic ? null : code || null,
    title: text(fd, 'title'),
    kind: text(fd, 'kind'),
    value: num(fd, 'value') ?? 0,
    appliesTo: text(fd, 'appliesTo') || 'order',
    minSubtotal: num(fd, 'minSubtotal'),
    minCupQuantity: num(fd, 'minCupQuantity'),
    startsAt: localDateTime(fd, 'startsAt'),
    endsAt: localDateTime(fd, 'endsAt'),
    usageLimit: num(fd, 'usageLimit'),
    oncePerCustomer: checkbox(fd, 'oncePerCustomer'),
    isAutomatic,
    isActive: checkbox(fd, 'isActive'),
  });
}

