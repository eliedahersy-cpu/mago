import type { SettingsRow } from './rows';
import type { StoreSettings } from '@/lib/types';

export const num = (v: string | number | null | undefined): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v);

export function toSettings(row: SettingsRow): StoreSettings {
  return {
    storeName: row.store_name,
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone,
    currency: row.currency,
    shippingFlatFee: num(row.shipping_flat_fee) ?? 0,
    freeShippingThreshold: num(row.free_shipping_threshold) ?? 0,
    deliveryAreas: row.delivery_areas ?? [],
    socialLinks: row.social_links ?? {},
    announcementBar: row.announcement_bar,
  };
}
