import { ArrowRight } from 'lucide-react';
import { getImageProps } from 'next/image';
import { ButtonLink } from '@/components/ui/Button';

/**
 * The hero artwork already contains the headline and subtitle, exactly as in the
 * mockup, so the image is decorative and the real heading is visually hidden.
 * The CTA is a live button placed where the mockup's button sits
 * (desktop centre 50% / 41.6%, mobile 50% / 40.9%).
 */
export function Hero() {
  const common = { alt: '', sizes: '100vw', loading: 'eager' as const, fetchPriority: 'high' as const };
  const {
    props: { srcSet: desktop },
  } = getImageProps({ ...common, src: '/images/hero-desktop.webp', width: 1799, height: 874 });
  const {
    props: { srcSet: mobile, ...rest },
  } = getImageProps({ ...common, src: '/images/hero-mobile.webp', width: 941, height: 1672 });

  return (
    <section className="relative pt-2 md:pt-3">
      <h1 className="sr-only">Good food, brighter days.</h1>
      <p className="sr-only">
        Nourishing pasta cups inspired by Mediterranean flavours. Real ingredients. Big taste. Ready in minutes.
      </p>
      <div className="relative mx-auto max-w-[1920px]">
        <picture>
          <source media="(min-width: 768px)" srcSet={desktop} />
          <source media="(max-width: 767px)" srcSet={mobile} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- alt="" comes from getImageProps */}
          <img {...rest} className="block h-auto w-full" />
        </picture>
        <div className="absolute top-[40.9%] left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-[41.6%]">
          <ButtonLink
            href="/shop"
            className="h-[9.5vw] w-[48vw] px-0 text-[3.6vw] shadow-lg md:h-[clamp(34px,2.9vw,58px)] md:w-[min(17.7vw,340px)] md:text-[clamp(11px,1.05vw,20px)]"
          >
            Shop now <ArrowRight className="size-[1.2em]" aria-hidden />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
