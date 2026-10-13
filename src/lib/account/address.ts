import { z } from 'zod';
import { PHONE_PATTERN } from '@/lib/checkout/schema';

const optionalText = (max: number) => z.string().trim().max(max).default('');

/** A saved delivery address (same rules as the checkout address). */
export const addressSchema = z.object({
  label: optionalText(40),
  fullName: z.string().trim().min(2, 'Please enter the full name.').max(100),
  phone: z.string().trim().regex(PHONE_PATTERN, 'Please enter a valid phone number.'),
  governorate: z.string().trim().min(1, 'Please choose the governorate.'),
  area: z.string().trim().min(1, 'Please enter the area.').max(100),
  street: z.string().trim().min(1, 'Please enter the street.').max(200),
  building: optionalText(100),
  floor: optionalText(50),
  notes: optionalText(200),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.output<typeof addressSchema>;

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Please enter your full name.').max(100),
  phone: z.union([z.literal(''), z.string().trim().regex(PHONE_PATTERN, 'Please enter a valid phone number.')]).default(''),
});
