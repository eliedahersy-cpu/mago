import type { Product } from '@/lib/types';
import { LISTED_TYPES } from '@/lib/data/mappers';
import type { ShopQuery, ShopSort } from './shop-params';

type Compare = (a: Product, b: Product) => number;

const bySortOrder: Compare = (a, b) => a.sortOrder - b.sortOrder;

const comparators: Record<ShopSort, Compare> = {
  featured: (a, b) => Number(b.isFeatured) - Number(a.isFeatured) || bySortOrder(a, b),
  'price-asc': (a, b) => a.price - b.price || bySortOrder(a, b),
  'price-desc': (a, b) => b.price - a.price || bySortOrder(a, b),
  rating: (a, b) => (b.ratingAvg ?? -1) - (a.ratingAvg ?? -1) || b.ratingCount - a.ratingCount || bySortOrder(a, b),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || bySortOrder(a, b),
};

/** Filter, sort and paginate the shop grid. `collectionSlug` must already be validated (null = all). */
export function applyShopQuery(
  products: Product[],
  q: ShopQuery,
  collectionSlug: string | null,
): { products: Product[]; total: number } {
  const listed = products
    .filter((p) => p.status === 'active' && LISTED_TYPES.includes(p.type))
    .filter((p) => !collectionSlug || p.collections.some((c) => c.slug === collectionSlug))
    .sort(comparators[q.sort]);
  const start = (q.page - 1) * q.perPage;
  return { products: listed.slice(start, start + q.perPage), total: listed.length };
}

/** Other active cups: same collection first, then featured order. */
export function relatedProducts(all: Product[], product: Product, limit: number): Product[] {
  const mine = new Set(product.collections.map((c) => c.slug));
  const shares = (p: Product) => p.collections.some((c) => mine.has(c.slug));
  return all
    .filter((p) => p.id !== product.id && p.type === 'cup' && p.status === 'active')
    .sort((a, b) => Number(shares(b)) - Number(shares(a)) || comparators.featured(a, b))
    .slice(0, limit);
}

/** True when every word of the (already sanitised) term appears in the product's searchable text. */
export function matchesSearch(product: Product, term: string): boolean {
  const words = term.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;
  const haystack = [
    product.name,
    product.flavour,
    product.tagline,
    product.sauce,
    product.shortDescription,
    ...product.ingredients.map((i) => i.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return words.every((w) => haystack.includes(w));
}
