import { ArrowRight } from 'lucide-react';
import Image, { getImageProps } from 'next/image';
import Link from 'next/link';
import { LeafSprig } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/cn';

export function MixBoxBanner({ variant }: { variant: 'home' | 'shop' }) {
  if (variant === 'shop') {
    return (
      <Container className="py-10">
        <section className="relative grid items-center gap-6 overflow-hidden rounded-3xl bg-cream-dark/60 p-6 md:grid-cols-[1fr_1.4fr_auto] md:p-8">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-xs">
            <Image src="/products/mago-mix-box.webp" alt="The MAGO Mix Box" fill sizes="320px" className="object-contain" />
          </div>
          <div className="text-center md:text-left">
            <h2 className="font-display text-3xl leading-none font-bold text-forest uppercase md:text-4xl">Build your own MAGO box</h2>
            <p className="mt-2 text-ink/80">Choose any 5 flavours, mix and match, and make it yours.</p>
            <ButtonLink href="/mix-box" className="mt-5">
              Start building <ArrowRight size={18} aria-hidden />
            </ButtonLink>
          </div>
          <div className="mx-auto flex size-28 flex-col items-center justify-center rounded-full bg-sun text-center font-display leading-none font-bold text-forest uppercase shadow-md">
            <span className="text-4xl">5</span>
            <span className="text-sm">cups</span>
            <span className="text-[11px]">your way</span>
          </div>
          <LeafSprig className="pointer-events-none absolute -top-6 -right-4 hidden w-16 rotate-45 opacity-70 md:block" />
        </section>
      </Container>
    );
  }

  return <HomeMixBoxBanner />;
}

const BANNER_ALT =
  'Build your MAGO Mix Box. Pick 5 cups. Your way. Mix your favourites, more flavours to explore, the perfect gift. An open MAGO Mix Box with five pasta cups.';

/**
 * The approved Mix Box artwork (tall for phones, wide from 768px). The whole banner links to the builder,
 * and a real "Start mixing" button sits exactly over the one drawn in the artwork.
 */
function HomeMixBoxBanner() {
  const common = { alt: BANNER_ALT, sizes: '(min-width: 1600px) 1600px, 100vw' };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, width: 1600, height: 900, src: '/images/mix-box-banner-wide.webp' });
  const {
    props: { srcSet: tall, ...img },
  } = getImageProps({ ...common, width: 900, height: 1600, src: '/images/mix-box-banner-tall.webp' });

  return (
    <section aria-label="Build your MAGO Mix Box" className="bg-[#f4e3c8]">
      <Link href="/mix-box" className="group relative mx-auto block max-w-[1600px] focus-visible:outline-none">
        <picture>
          <source media="(min-width: 768px)" srcSet={wide} width={1600} height={900} />
          <img {...img} srcSet={tall} alt={BANNER_ALT} loading="lazy" className="block h-auto w-full" />
        </picture>
        <span
          className={cn(
            'absolute flex items-center justify-center gap-2 rounded-full bg-[#013226] font-display font-semibold tracking-wide text-cream-light uppercase transition',
            'group-hover:bg-forest-light group-focus-visible:outline-3 group-focus-visible:outline-offset-2 group-focus-visible:outline-saffron',
            'top-[88.7%] left-[20.2%] h-[6%] w-[60.1%] text-[clamp(0.85rem,4.6vw,1.6rem)]',
            'md:top-[60.1%] md:left-[4.5%] md:h-[7.6%] md:w-[22.3%] md:text-[clamp(0.8rem,1.55vw,1.6rem)]',
          )}
        >
          Start mixing <ArrowRight className="size-[1.1em]" aria-hidden />
        </span>
      </Link>
    </section>
  );
}
