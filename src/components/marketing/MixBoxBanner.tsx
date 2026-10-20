import { ArrowRight } from 'lucide-react';
import { getImageProps } from 'next/image';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { cn } from '@/lib/cn';

export function MixBoxBanner({ variant }: { variant: 'home' | 'shop' }) {
  if (variant === 'shop') return <ShopMixBoxBanner />;

  return <HomeMixBoxBanner />;
}

const BANNER_ALT =
  'Build your MAGO Mix Box. Pick 5 cups. Your way. Mix your favourites, more flavours to explore, the perfect gift. An open MAGO Mix Box with five pasta cups.';

/**
 * The approved Mix Box artwork (tall for phones, wide from 768px). The whole banner links to the builder,
 * and a real "Start mixing" button sits exactly over the one drawn in the artwork.
 */
function HomeMixBoxBanner() {
  const common = { alt: BANNER_ALT, sizes: '100vw' };
  const {
    props: { srcSet: wide },
  } = getImageProps({ ...common, width: 1600, height: 900, src: '/images/mix-box-banner-wide.webp' });
  const {
    props: { srcSet: tall, ...img },
  } = getImageProps({ ...common, width: 900, height: 1600, src: '/images/mix-box-banner-tall.webp' });

  return (
    <section aria-label="Build your MAGO Mix Box" className="bg-[#f4e3c8]">
      <Link href="/mix-box" className="group relative mx-auto block max-w-[2560px] focus-visible:outline-none">
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

const SHOP_ALT = 'Build your MAGO Mix Box. Pick 5 cups. Your way. Start mixing.';

/** The Mix Box banner on the shop page: the approved artwork (4:5 on phones, a wide strip from 768px) links to the builder. */
function ShopMixBoxBanner() {
  const {
    props: { srcSet: wide },
  } = getImageProps({ alt: SHOP_ALT, sizes: '(min-width: 1280px) 1280px, 100vw', width: 1600, height: 499, src: '/images/mix-box-shop-wide.webp' });
  const {
    props: { srcSet: tall, ...img },
  } = getImageProps({ alt: SHOP_ALT, sizes: '100vw', width: 1122, height: 1402, src: '/images/mix-box-shop-tall.webp' });

  return (
    <Container className="py-10">
      <Link
        href="/mix-box"
        aria-label="Build your MAGO Mix Box: pick 5 cups, your way. Start mixing"
        className="block overflow-hidden rounded-3xl shadow-sm ring-1 ring-forest/10 transition hover:shadow-md focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-saffron"
      >
        <picture>
          <source media="(min-width: 768px)" srcSet={wide} width={1600} height={499} />
          <img {...img} srcSet={tall} alt="" loading="lazy" className="block h-auto w-full" />
        </picture>
      </Link>
    </Container>
  );
}
