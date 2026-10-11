'use client';

import { useRouter } from 'next/navigation';
import { PER_PAGE_OPTIONS, SHOP_SORTS, toShopSearchParams, type ShopQuery, type ShopSort } from '@/lib/catalog/shop-params';

const select =
  'h-10 rounded-full border border-forest/15 bg-white pr-9 pl-4 text-sm text-ink focus:border-forest focus:outline-none';

export function SortControls({ query }: { query: ShopQuery }) {
  const router = useRouter();
  const go = (patch: Partial<ShopQuery>) => router.push(`/shop${toShopSearchParams(query, patch)}`, { scroll: false });

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <span className="hidden sm:inline">Sort by</span>
        <span className="sr-only sm:hidden">Sort by</span>
        <select aria-label="Sort by" className={select} value={query.sort} onChange={(e) => go({ sort: e.target.value as ShopSort })}>
          {SHOP_SORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
      <label className="hidden items-center gap-2 text-sm text-ink/80 md:flex">
        <select
          aria-label="Per page"
          className={select}
          value={query.perPage}
          onChange={(e) => go({ perPage: Number(e.target.value) as ShopQuery['perPage'] })}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n} per page
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
