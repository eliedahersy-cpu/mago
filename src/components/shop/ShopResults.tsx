import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ProductGrid } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { parseShopParams, toShopSearchParams, type ShopQuery } from '@/lib/catalog/shop-params';
import { cn } from '@/lib/cn';
import { getShopProducts, getVisibleCollections } from '@/lib/data/cached';
import { SortControls } from './ShopControls';

type SearchParams = Record<string, string | string[] | undefined>;

export async function ShopResults({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const parsed = parseShopParams(await searchParams);
  const [{ products, total, activeCollection }, collections] = await Promise.all([
    getShopProducts(parsed),
    getVisibleCollections(),
  ]);
  // An unknown collection slug behaves like "All".
  const query: ShopQuery = { ...parsed, collection: activeCollection?.slug ?? null };

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <nav aria-label="Collections" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
          <Pill href={`/shop${toShopSearchParams(query, { collection: null })}`} active={!query.collection}>
            All
          </Pill>
          {collections.map((c) => (
            <Pill key={c.slug} href={`/shop${toShopSearchParams(query, { collection: c.slug })}`} active={query.collection === c.slug}>
              {c.title}
            </Pill>
          ))}
        </nav>
        <SortControls query={query} />
      </div>

      <p className="mt-6 mb-4 text-sm text-ink/70" aria-live="polite">
        {total} {total === 1 ? 'cup' : 'cups'}
        {activeCollection ? ` in ${activeCollection.title}` : ''}
      </p>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="rounded-3xl bg-cream-light p-10 text-center">
          <p className="font-display text-xl font-semibold text-forest">No cups here yet</p>
          <ButtonLink href="/shop" variant="outline" className="mt-4">
            See all cups
          </ButtonLink>
        </div>
      )}

      <Pagination query={query} total={total} />
    </>
  );
}

function Pagination({ query, total }: { query: ShopQuery; total: number }) {
  const pages = Math.ceil(total / query.perPage);
  if (pages <= 1) return null;
  const link = (page: number) => `/shop${toShopSearchParams(query, { page })}`;
  const arrow = 'flex size-10 items-center justify-center rounded-full text-forest hover:bg-forest/10';
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-1">
      {query.page > 1 ? (
        <Link href={link(query.page - 1)} aria-label="Previous page" className={arrow}>
          <ChevronLeft size={20} aria-hidden />
        </Link>
      ) : null}
      {Array.from({ length: pages }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={link(page)}
          aria-current={page === query.page ? 'page' : undefined}
          className={cn(
            'flex size-10 items-center justify-center rounded-full text-sm font-semibold',
            page === query.page ? 'bg-forest text-cream-light' : 'text-forest hover:bg-forest/10',
          )}
        >
          {page}
        </Link>
      ))}
      {query.page < pages ? (
        <Link href={link(query.page + 1)} aria-label="Next page" className={arrow}>
          <ChevronRight size={20} aria-hidden />
        </Link>
      ) : null}
    </nav>
  );
}

export function ShopResultsSkeleton() {
  return (
    <div aria-hidden className="animate-pulse">
      <div className="flex gap-2">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="h-9 w-24 rounded-full bg-cream-dark/70" />
        ))}
      </div>
      <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="aspect-[3/5] rounded-2xl bg-cream-dark/50" />
        ))}
      </div>
    </div>
  );
}
