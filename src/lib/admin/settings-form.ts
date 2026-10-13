import { z } from 'zod';
import type { SocialNetwork } from '@/lib/types';
import { type FormResult, num, optionalText, parseWith, text } from './form-data';
import { parseLines } from './product-form';

export const SOCIAL_NETWORKS: SocialNetwork[] = ['instagram', 'tiktok', 'facebook', 'youtube'];

const httpsUrl = z
  .string()
  .max(300)
  .refine((v) => {
    try {
      return new URL(v).protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Use a full link starting with https://')
  .nullable();

const settingsSchema = z.object({
  storeName: z.string().min(1, 'Enter the store name.').max(80),
  contactEmail: z.email('Enter a valid email.').nullable(),
  contactPhone: z.string().max(40).nullable(),
  shippingFlatFee: z.number({ error: 'Enter the delivery fee.' }).finite('Enter the delivery fee.').min(0, 'The fee cannot be negative.'),
  freeShippingThreshold: z.number({ error: 'Enter an amount.' }).finite('Enter an amount.').min(0, 'Cannot be negative.'),
  deliveryAreas: z.array(z.string().max(60)).max(60),
  announcementBar: z.string().max(200).nullable(),
  instagram: httpsUrl,
  tiktok: httpsUrl,
  facebook: httpsUrl,
  youtube: httpsUrl,
});

export interface SettingsInput {
  storeName: string;
  contactEmail: string | null;
  contactPhone: string | null;
  shippingFlatFee: number;
  freeShippingThreshold: number;
  deliveryAreas: string[];
  announcementBar: string | null;
  socialLinks: Partial<Record<SocialNetwork, string>>;
}

export function parseSettingsForm(fd: FormData): FormResult<SettingsInput> {
  const r = parseWith(settingsSchema, {
    storeName: text(fd, 'storeName'),
    contactEmail: optionalText(fd, 'contactEmail'),
    contactPhone: optionalText(fd, 'contactPhone'),
    shippingFlatFee: num(fd, 'shippingFlatFee') ?? Number.NaN,
    freeShippingThreshold: num(fd, 'freeShippingThreshold') ?? Number.NaN,
    deliveryAreas: parseLines(text(fd, 'deliveryAreas')),
    announcementBar: optionalText(fd, 'announcementBar'),
    instagram: optionalText(fd, 'instagram'),
    tiktok: optionalText(fd, 'tiktok'),
    facebook: optionalText(fd, 'facebook'),
    youtube: optionalText(fd, 'youtube'),
  });
  if (!r.ok) return r;
  const { instagram, tiktok, facebook, youtube, ...rest } = r.data;
  const links = { instagram, tiktok, facebook, youtube };
  const socialLinks = Object.fromEntries(Object.entries(links).filter(([, v]) => v)) as Partial<Record<SocialNetwork, string>>;
  return { ok: true, data: { ...rest, socialLinks } };
}
