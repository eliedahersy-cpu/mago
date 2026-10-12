import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BoxTray } from '@/components/mix-box/BoxTray';
import { CupPicker, type PickerCup } from '@/components/mix-box/CupPicker';
import { CravingsBanner, HowItWorks, MixBoxHero, MixBoxPerks } from '@/components/mix-box/MixBoxSections';
import { Container } from '@/components/ui/Container';
import { toCartProduct } from '@/lib/cart/lines';
import { isPurchasable } from '@/lib/catalog/stock';
import { getMixBoxCups, getProductBySlug } from '@/lib/data/cached';
import { DEFAULT_BOX_SIZE } from '@/lib/mix-box/box';

export const metadata: Metadata = {
  title: 'Build your Mix Box',
  description: 'Pick any 5 MAGO pasta cups, mix your favourite Mediterranean flavours and save 10% on the box.',
};

export default async function MixBoxPage() {
  const [cups, bundle] = await Promise.all([getMixBoxCups(), getProductBySlug('mago-mix-box')]);
  const size = bundle?.bundleSize ?? DEFAULT_BOX_SIZE;
  const pickerCups: PickerCup[] = cups.map((p) => ({
    ...toCartProduct(p),
    description: p.shortDescription,
    purchasable: isPurchasable(p),
  }));

  return (
    <>
      <MixBoxHero size={size} />
      <MixBoxPerks />
      <section id="cups" className="scroll-mt-24 pt-10">
        <Container>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-3xl leading-none font-bold text-forest uppercase md:text-4xl">Explore our cups</h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
              View all flavours <ArrowRight size={16} aria-hidden />
            </Link>
          </div>
          <div className="mt-6">
            <CupPicker cups={pickerCups} size={size} />
            <BoxTray size={size} className="mt-8" />
          </div>
        </Container>
      </section>
      <HowItWorks size={size} />
      <CravingsBanner />
    </>
  );
}
