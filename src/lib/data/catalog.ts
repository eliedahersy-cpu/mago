import type { ShopQuery } from '@/lib/catalog/shop-params';
import { applyShopQuery, relatedProducts } from '@/lib/catalog/shop-query';
import { createPublicClient } from '@/lib/supabase/public';
import type { AutomaticDiscount, Collection, Product, Review } from '@/lib/types';
import { num, toCollection, toProduct, toReview } from './mappers';
import type { CollectionRow, ProductRow, ReviewRow } from './rows';

export const PRODUCT_SELECT = '*, product_images(url, alt, kind, position), collection_products(collections(slug, title))';

function fail(what: string, error: { message: string }): never {
  throw new Error(`Failed to load ${what}: ${error.message}`);
}

/** Every active product with images and collections (RLS hides drafts and archived rows). */
export async function getActiveProducts(): Promise<Product[]> {
  const { data, error } = await createPublicClient()
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('status', 'active')
    .order('sort_order');
  if (error) fail('products', error);
  return (data as unknown as ProductRow[]).map(toProduct);
}

/** Visible collections that contain at least one active cup or retail product. */
export async function getVisibleCollections(): Promise<Collection[]> {
  const { data, error } = await createPublicClient()
    .from('collections')
    .select('id, slug, title, description, image, sort_order, collection_products(products(status, type))')
    .eq('is_visible', true)
    .order('sort_order');
  if (error) fail('collections', error);
  return (data as unknown as CollectionRow[]).map(toCollection).filter((c) => c.productCount > 0);
}

export async function getShopProducts(
  q: ShopQuery,
): Promise<{ products: Product[]; total: number; activeCollection: Collection | null }> {
  const [products, collections] = await Promise.all([getActiveProducts(), getVisibleCollections()]);
  const activeCollection = q.collection ? (collections.find((c) => c.slug === q.collection) ?? null) : null;
  return { ...applyShopQuery(products, q, activeCollection?.slug ?? null), activeCollection };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return (await getActiveProducts()).find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(product: Product, limit = 5): Promise<Product[]> {
  return relatedProducts(await getActiveProducts(), product, limit);
}

/** Active cups for the Mix Box builder, in shop order. */
export async function getMixBoxCups(): Promise<Product[]> {
  return (await getActiveProducts()).filter((p) => p.type === 'cup');
}

export async function getFeaturedProducts(limit = 5): Promise<Product[]> {
  return (await getActiveProducts())
    .filter((p) => p.type === 'cup' && p.isFeatured)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, limit);
}

export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const bySlug = new Map((await getActiveProducts()).map((p) => [p.slug, p]));
  return slugs.flatMap((s) => (bySlug.has(s) ? [bySlug.get(s)!] : []));
}

export async function getApprovedReviews(productId: string, limit = 6): Promise<Review[]> {
  const { data, error } = await createPublicClient()
    .from('reviews')
    .select('id, author_name, rating, title, body, created_at, is_verified_buyer')
    .eq('product_id', productId)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) fail('reviews', error);
  return (data as ReviewRow[]).map(toReview);
}

export async function getActiveAutomaticDiscount(): Promise<AutomaticDiscount | null> {
  const { data, error } = await createPublicClient().rpc('get_active_automatic_discount');
  if (error) fail('automatic discount', error);
  const row = (data as { title: string; value: string | number; min_cup_quantity: number | null }[])[0];
  return row ? { title: row.title, value: num(row.value) ?? 0, minCupQuantity: row.min_cup_quantity ?? 0 } : null;
}
