import type {
  Collection,
  Product,
  ProductImage,
  ProductStatus,
  ProductType,
  RecipeSummary,
  Review,
  StoreSettings,
} from '@/lib/types';
import type { CollectionRow, ProductRow, RecipeSummaryRow, ReviewRow, SettingsRow } from './rows';

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

export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    flavour: row.flavour,
    type: row.type as ProductType,
    status: row.status as ProductStatus,
    tagline: row.tagline,
    sauce: row.sauce,
    shortDescription: row.short_description,
    description: row.description,
    story: row.story,
    price: num(row.price) ?? 0,
    compareAtPrice: num(row.compare_at_price),
    stock: row.stock,
    trackInventory: row.track_inventory,
    allowBackorder: row.allow_backorder,
    proteinG: row.protein_g,
    prepMinutes: row.prep_minutes,
    isBestSeller: row.is_best_seller,
    isFeatured: row.is_featured,
    sortOrder: row.sort_order,
    badges: row.badges ?? [],
    ingredients: row.ingredients ?? [],
    nutrition: row.nutrition ?? [],
    preparation: row.preparation ?? [],
    flavourProfiles: row.flavour_profiles ?? [],
    spiceLevel: row.spice_level,
    textures: row.textures ?? [],
    occasions: row.occasions ?? [],
    style: row.style as Product['style'],
    bundleSize: row.bundle_size,
    ratingAvg: num(row.rating_avg),
    ratingCount: row.rating_count,
    images: [...(row.product_images ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({ url: i.url, alt: i.alt, kind: i.kind as ProductImage['kind'], position: i.position })),
    collections: (row.collection_products ?? []).flatMap((cp) =>
      cp.collections ? [{ slug: cp.collections.slug, title: cp.collections.title }] : [],
    ),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
  };
}

/** Product types listed in the shop (and counted on collection pills). */
export const LISTED_TYPES: readonly ProductType[] = ['cup', 'retail'];

export function toCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    image: row.image,
    sortOrder: row.sort_order,
    productCount: (row.collection_products ?? []).filter(
      (cp) =>
        cp.products && cp.products.status === 'active' && LISTED_TYPES.includes(cp.products.type as ProductType),
    ).length,
  };
}

export function toRecipeSummary(row: RecipeSummaryRow): RecipeSummary {
  return {
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    heroImage: row.hero_image,
    minutes: row.minutes,
    tags: row.tags ?? [],
    productName: row.products ? [row.products.name, row.products.flavour].filter(Boolean).join(' ') : null,
  };
}

export function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    authorName: row.author_name,
    rating: row.rating,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    isVerifiedBuyer: row.is_verified_buyer,
  };
}
