import type { Metadata } from 'next';
import { Suspense } from 'react';
import { WishlistView } from '@/components/account/WishlistView';
import { requireUser } from '@/lib/auth/dal';
import { getAllActiveProducts } from '@/lib/data/cached';

export const metadata: Metadata = {
  title: 'Your wishlist',
  robots: { index: false },
};

export default function WishlistPage() {
  return (
    <>
      <h1 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-5xl">Your wishlist</h1>
      <div className="mt-6">
        <Suspense fallback={<p className="py-10 text-center text-ink/70">Loading your wishlist…</p>}>
          <Wishlist />
        </Suspense>
      </div>
    </>
  );
}

async function Wishlist() {
  const user = await requireUser('/account/wishlist');
  return <WishlistView products={await getAllActiveProducts()} userId={user.id} />;
}
