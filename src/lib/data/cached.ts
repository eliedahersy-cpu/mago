// Cached entry points used by pages and layouts (Cache Components). The plain
// query functions they wrap live next to this file so they stay testable
// outside the Next.js runtime. Plan 3 (admin) invalidates via these tags.
import { cacheLife, cacheTag } from 'next/cache';
import type { ShopQuery } from '@/lib/catalog/shop-params';
import type { Product } from '@/lib/types';
import * as catalog from './catalog';
import * as content from './content';
import * as search from './search';

export const CACHE_TAGS = {
  settings: 'settings',
  catalog: 'catalog',
  recipes: 'recipes',
  reviews: 'reviews',
  discounts: 'discounts',
} as const;

function tagged(...tags: string[]) {
  cacheLife('minutes');
  cacheTag(...tags);
}

export async function getSettings() {
  'use cache';
  tagged(CACHE_TAGS.settings);
  return content.getSettings();
}

export async function getRecipeCards(limit?: number) {
  'use cache';
  tagged(CACHE_TAGS.recipes);
  return content.getRecipeCards(limit);
}

export async function getVisibleCollections() {
  'use cache';
  tagged(CACHE_TAGS.catalog);
  return catalog.getVisibleCollections();
}

export async function getShopProducts(q: ShopQuery) {
  'use cache';
  tagged(CACHE_TAGS.catalog);
  return catalog.getShopProducts(q);
}

export async function getProductBySlug(slug: string) {
  'use cache';
  tagged(CACHE_TAGS.catalog);
  return catalog.getProductBySlug(slug);
}

export async function getActiveProductSlugs(): Promise<string[]> {
  'use cache';
  tagged(CACHE_TAGS.catalog);
  return (await catalog.getActiveProducts()).map((p) => p.slug);
}

export async function getRelatedProducts(product: Product, limit?: number) {
  'use cache';
  tagged(CACHE_TAGS.catalog);
  return catalog.getRelatedProducts(product, limit);
}

export async function getMixBoxCups() {
  'use cache';
  tagged(CACHE_TAGS.catalog);
  return catalog.getMixBoxCups();
}

export async function getFeaturedProducts(limit?: number) {
  'use cache';
  tagged(CACHE_TAGS.catalog);
  return catalog.getFeaturedProducts(limit);
}

export async function getProductsBySlugs(slugs: string[]) {
  'use cache';
  tagged(CACHE_TAGS.catalog);
  return catalog.getProductsBySlugs(slugs);
}

export async function getApprovedReviews(productId: string, limit?: number) {
  'use cache';
  tagged(CACHE_TAGS.reviews);
  return catalog.getApprovedReviews(productId, limit);
}

export async function getActiveAutomaticDiscount() {
  'use cache';
  tagged(CACHE_TAGS.discounts);
  return catalog.getActiveAutomaticDiscount();
}

export async function searchCatalog(raw: string) {
  'use cache';
  tagged(CACHE_TAGS.catalog, CACHE_TAGS.recipes);
  return search.searchCatalog(raw);
}
