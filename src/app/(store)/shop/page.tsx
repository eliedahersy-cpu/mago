import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MixBoxBanner } from '@/components/marketing/MixBoxBanner';
import { ShopHero } from '@/components/shop/ShopHero';
import { ShopResults, ShopResultsSkeleton } from '@/components/shop/ShopResults';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Our Pasta Cups',
  description: 'Mediterranean pasta cups with 30g of protein, real ingredients and big taste. Ready in minutes.',
};

export default function ShopPage({ searchParams }: PageProps<'/shop'>) {
  return (
    <>
      <ShopHero />
      <Container className="pb-4">
        <Suspense fallback={<ShopResultsSkeleton />}>
          <ShopResults searchParams={searchParams} />
        </Suspense>
      </Container>
      <MixBoxBanner variant="shop" />
    </>
  );
}
