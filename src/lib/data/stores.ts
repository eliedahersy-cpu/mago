import type { StoreType } from '@/lib/stores/geo';
import { createPublicClient } from '@/lib/supabase/public';

export interface StoreProduct {
  id: string;
  slug: string;
  name: string;
  flavour: string | null;
  image: string | null;
}

export interface Store {
  id: string;
  slug: string;
  name: string;
  chain: string | null;
  type: StoreType;
  address: string | null;
  area: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  hours: string | null;
  phone: string | null;
  image: string | null;
  website: string | null;
  products: StoreProduct[];
}

type Raw = Record<string, unknown>;

const STORE_SELECT =
  'id, slug, name, chain, type, address, area, city, lat, lng, hours, phone, image, website, store_products (product:products (id, slug, name, flavour, status, sort_order, product_images (url, position, kind)))';

function toStore(s: Raw): Store {
  const products = ((s.store_products as Raw[]) ?? [])
    .map((sp) => sp.product as Raw | null)
    .filter((p): p is Raw => Boolean(p) && p!.status === 'active')
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((p) => {
      const images = ((p.product_images as Raw[]) ?? []).sort((a, b) => Number(a.position) - Number(b.position));
      const shot = images.find((i) => i.kind === 'packshot') ?? images[0];
      return { id: String(p.id), slug: String(p.slug), name: String(p.name), flavour: (p.flavour as string | null) ?? null, image: shot ? String(shot.url) : null };
    });
  const hours = s.hours as Raw | null;
  return {
    id: String(s.id),
    slug: String(s.slug),
    name: String(s.name),
    chain: (s.chain as string | null) ?? null,
    type: s.type as StoreType,
    address: (s.address as string | null) ?? null,
    area: (s.area as string | null) ?? null,
    city: (s.city as string | null) ?? null,
    lat: s.lat === null || s.lat === undefined ? null : Number(s.lat),
    lng: s.lng === null || s.lng === undefined ? null : Number(s.lng),
    hours: typeof hours?.summary === 'string' && hours.summary ? hours.summary : null,
    phone: (s.phone as string | null) ?? null,
    image: (s.image as string | null) ?? null,
    website: (s.website as string | null) ?? null,
    products,
  };
}

/** Every active store with the MAGO products it carries (RLS hides inactive stores from the public). */
export async function getActiveStores(): Promise<Store[]> {
  const { data, error } = await createPublicClient().from('stores').select(STORE_SELECT).eq('is_active', true).order('name');
  if (error) throw new Error(`Failed to load stores: ${error.message}`);
  return (data as Raw[]).map(toStore);
}
