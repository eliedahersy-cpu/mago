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

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  flavour: string | null;
  sauce: string | null;
  type: string;
  status: string;
  tagline: string | null;
  short_description: string | null;
  description: string | null;
  story: string | null;
  price: Numeric;
  compare_at_price: Numeric | null;
  stock: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  protein_g: number | null;
  prep_minutes: number | null;
  is_best_seller: boolean;
  is_featured: boolean;
  sort_order: number;
  badges: string[] | null;
  ingredients: { name: string }[] | null;
  nutrition: { label: string; value: string }[] | null;
  preparation: { title: string; body: string }[] | null;
  flavour_profiles: string[] | null;
  spice_level: number;
  textures: string[] | null;
  occasions: string[] | null;
  style: string | null;
  bundle_size: number | null;
  seo_title: string | null;
  seo_description: string | null;
  rating_avg: Numeric | null;
  rating_count: number;
  created_at: string;
  product_images?: { url: string; alt: string; kind: string; position: number }[] | null;
  collection_products?: { collections: { slug: string; title: string } | null }[] | null;
}

export interface CollectionRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image: string | null;
  sort_order: number;
  collection_products?: { products: { status: string; type: string } | null }[] | null;
}

export interface RecipeSummaryRow {
  slug: string;
  title: string;
  subtitle: string | null;
  hero_image: string | null;
  minutes: number;
  tags: string[] | null;
  products?: { name: string; flavour: string | null } | null;
}

export interface ReviewRow {
  id: string;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
  is_verified_buyer: boolean;
}
