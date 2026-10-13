'use client';

import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ProductGrid } from '@/components/product/ProductCard';
import { ButtonLink } from '@/components/ui/Button';
import type { Product } from '@/lib/types';
import { useWishlist } from '@/lib/wishlist/store';
import { syncWithAccount, useHydratedWishlist } from '@/lib/wishlist/use-wishlist';

/** The account wishlist: syncs this browser's hearts with the account, then lists the products. */
export function WishlistView({ products, userId }: { products: Product[]; userId: string }) {
  const hydrated = useHydratedWishlist();
  const ids = useWishlist((s) => s.ids);
  const [merged, setMerged] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void syncWithAccount(userId)
      .catch(() => false)
      .finally(() => {
        if (!cancelled) setMerged(true);
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, userId]);

  if (!hydrated || !merged) return <p className="py-10 text-center text-ink/70">Loading your wishlist…</p>;

  const saved = products.filter((p) => ids.includes(p.id));
  if (saved.length === 0) {
    return (
      <div className="rounded-3xl bg-cream-light p-6 text-center ring-1 ring-forest/5">
        <Heart size={32} className="mx-auto text-terracotta/60" aria-hidden />
        <p className="mt-2 font-display text-lg font-semibold text-forest">Your wishlist is empty</p>
        <p className="mt-1 text-sm text-ink/70">Tap the heart on any cup to save it here.</p>
        <ButtonLink href="/shop" size="sm" className="mt-4">
          Shop cups
        </ButtonLink>
      </div>
    );
  }
  return <ProductGrid products={saved} />;
}
