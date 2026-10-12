import type { Metadata } from 'next';
import Image from 'next/image';
import { ArchDecor, LeafSprig, SunMark } from '@/components/brand/Decor';
import { MixBoxReview, type ReviewCupInfo } from '@/components/mix-box/MixBoxReview';
import { Container } from '@/components/ui/Container';
import { getActiveAutomaticDiscount, getMixBoxCups, getProductBySlug, getSettings } from '@/lib/data/cached';
import { DEFAULT_BOX_SIZE } from '@/lib/mix-box/box';

export const metadata: Metadata = {
  title: 'Your Mix Box',
  description: 'Review your personalised MAGO Mix Box before checkout.',
  robots: { index: false },
};

export default async function MixBoxReviewPage() {
  const [bundle, cups, discount, settings] = await Promise.all([
    getProductBySlug('mago-mix-box'),
    getMixBoxCups(),
    getActiveAutomaticDiscount(),
    getSettings(),
  ]);
  const size = bundle?.bundleSize ?? DEFAULT_BOX_SIZE;
  const bundleImage = bundle?.images.find((i) => i.kind === 'packshot') ?? bundle?.images[0];
  const cupInfo: Record<string, ReviewCupInfo> = Object.fromEntries(
    cups.map((c) => [c.id, { ratingAvg: c.ratingAvg, ratingCount: c.ratingCount, flavourProfiles: c.flavourProfiles }]),
  );

  return (
    <>
      <section className="relative overflow-hidden">
        <ArchDecor className="pointer-events-none absolute top-24 -left-10 hidden w-28 opacity-50 md:block" />
        <ArchDecor tone="saffron" className="pointer-events-none absolute top-10 -right-8 hidden w-24 opacity-40 lg:block" />
        <LeafSprig className="pointer-events-none absolute top-6 right-24 hidden w-12 rotate-12 opacity-60 md:block" />
        <Container className="pt-8 text-center md:pt-10">
          <SunMark className="mx-auto w-20" />
          <h1 className="mt-2 font-display text-4xl leading-none font-bold text-forest uppercase md:text-6xl">Your MAGO Mix Box</h1>
          <p className="mt-2 text-lg text-ink/80">Review your personalised {size}-cup selection before checkout.</p>
          <div className="relative mx-auto mt-6 aspect-[760/707] w-full max-w-md">
            <Image
              src="/products/mago-mix-box-open.webp"
              alt="An open MAGO Mix Box holding five pasta cups"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 768px) 448px, 90vw"
              className="rounded-3xl object-contain shadow-xl"
            />
          </div>
        </Container>
      </section>
      <Container className="py-8 md:py-10">
        <MixBoxReview
          size={size}
          bundle={bundle ? { productId: bundle.id, slug: bundle.slug, name: bundle.name, image: bundleImage?.url ?? null } : null}
          cupInfo={cupInfo}
          discount={discount}
          shippingFlatFee={settings.shippingFlatFee}
          freeShippingThreshold={settings.freeShippingThreshold}
        />
      </Container>
    </>
  );
}
