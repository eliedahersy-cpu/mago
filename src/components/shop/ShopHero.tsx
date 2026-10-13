import Image from 'next/image';
import { ArchDecor, LeafSprig } from '@/components/brand/Decor';
import { BenefitIcons } from '@/components/product/BenefitIcons';

/** "Our pasta cups" banner: copy and benefits on the left, a cup-and-ingredients photo on the right (wide screens). */
export function ShopHero() {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_20%_30%,#fff5e4_0%,#f9e7cc_60%,#f4dcbc_100%)]">
      <LeafSprig className="pointer-events-none absolute -top-3 -left-5 -z-10 w-16 -rotate-[35deg] text-leaf md:w-28" />
      <LeafSprig className="pointer-events-none absolute bottom-2 -left-6 -z-10 hidden w-24 rotate-[210deg] text-forest-light md:block" />
      <LeafSprig className="pointer-events-none absolute -top-2 -right-4 -z-10 w-16 rotate-[30deg] text-forest-light md:hidden" />
      <ArchDecor tone="peach" className="pointer-events-none absolute top-[40%] -left-12 -z-10 w-24 opacity-70 md:hidden" />
      <ArchDecor tone="terracotta" className="pointer-events-none absolute top-[38%] -right-12 -z-10 w-24 opacity-50 md:hidden" />

      <div className="grid items-stretch md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="px-5 pt-8 pb-7 text-center md:py-12 md:pr-4 md:pl-10 md:text-left lg:pl-[max(4rem,calc((100vw-80rem)/2+4rem))]">
          <h1 className="font-display text-[clamp(2.25rem,9.6vw,2.9rem)] leading-none font-bold whitespace-nowrap text-forest uppercase md:text-[clamp(2.6rem,5vw,4.75rem)]">
            Our pasta cups
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-base text-ink/85 sm:max-w-md md:mx-0 md:text-xl">
            Mediterranean flavours. Real ingredients. Big protein per cup.
          </p>
          <div className="mx-auto mt-6 max-w-xl rounded-2xl bg-cream-light/90 p-3 shadow-sm ring-1 ring-forest/10 md:mx-0 md:bg-transparent md:p-0 md:shadow-none md:ring-0">
            <BenefitIcons variant="hero" />
          </div>
        </div>
        <div className="relative hidden min-h-[340px] md:block">
          <ArchDecor tone="terracotta" className="absolute -top-10 left-[6%] w-40 lg:w-52" />
          <Image
            src="/images/shop-hero.webp"
            alt="A MAGO Fusilli Cup Spicy Muhammara with roasted peppers, walnuts and fresh ingredients"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="50vw"
            className="object-cover object-[35%_100%] [mask-image:linear-gradient(to_right,transparent,#000_20%)]"
          />
        </div>
      </div>
    </section>
  );
}
