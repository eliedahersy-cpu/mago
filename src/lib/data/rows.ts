/** Raw row shapes as returned by PostgREST (snake_case; numeric columns arrive as strings). */
type Numeric = string | number;

export interface SettingsRow {
  store_name: string;
  contact_email: string | null;
  contact_phone: string | null;
  currency: string;
  shipping_flat_fee: Numeric;
  free_shipping_threshold: Numeric;
  delivery_areas: string[] | null;
  social_links: Record<string, string> | null;
  announcement_bar: string | null;
}
