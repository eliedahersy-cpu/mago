import { getImageProps } from 'next/image';
import { Gift, Leaf, Smile, Soup } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { ScrollLink } from '@/components/ui/ScrollLink';
import { cn } from '@/lib/cn';

/** One artwork per width (phone / from 768px). The pictures carry the design; real, focusable links sit over their drawn buttons. */
function ArtBanner({
  wide,
  tall,
  alt,
  priority = false,
  className,
  children,
}: {
  wide: { src: string; width: number; height: number };
  tall: { src: string; width: number; height: number };
  alt: string;
  priority?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const common = { alt, sizes: '100vw' };
  const {
    props: { srcSet: wideSet },
  } = getImageProps({ ...common, ...wide });
  const {
    props: { srcSet: tallSet, ...img },
  } = getImageProps({ ...common, ...tall });
  return (
    <div className={cn('relative mx-auto w-full max-w-[2560px]', className)}>
      <picture>
        <source media="(min-width: 768px)" srcSet={wideSet} width={wide.width} height={wide.height} />
        <img {...img} srcSet={tallSet} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : undefined} className="block h-auto w-full" />
      </picture>
      {children}
    </div>
  );
}

const hit = 'absolute rounded-full focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-saffron';

export function MixBoxHero({ size }: { size: number }) {
  return (
    <section aria-label="Build your MAGO Mix Box" className="bg-[#f6e6cc]">
      <ArtBanner
        priority
        wide={{ src: '/images/mixbox-hero-wide-2.webp', width: 1600, height: 533 }}
        tall={{ src: '/images/mixbox-hero-square.webp', width: 1254, height: 1254 }}
        alt={`Build your MAGO Mix Box. Pick ${size} cups. Your way. More flavours. More fun. An open Mix Box with five pasta cups.`}
      >
        <ScrollLink bare href="#cups" aria-label="Start mixing" className={cn(hit, 'top-[39.8%] left-[34.3%] h-[5.9%] w-[31.4%] md:top-[84.2%] md:left-[14%] md:h-[10.8%] md:w-[19.6%]')}>
          <span className="sr-only">Start mixing</span>
        </ScrollLink>
      </ArtBanner>
    </section>
  );
}

const perks = [
  { icon: Leaf, title: 'Mix your favourites', text: "Create a box that's uniquely yours." },
  { icon: Soup, title: 'More flavours to explore', text: 'Classic, bold and new favourites.' },
  { icon: Gift, title: 'The perfect gift', text: 'A delicious surprise for any occasion.' },
  { icon: Smile, title: 'Made for every mood', text: 'Comforting, energising and always satisfying.' },
];

export function MixBoxPerks() {
  return (
    <Container>
      <ul className="grid grid-cols-4 divide-x divide-forest/10 rounded-3xl bg-cream-light py-4 shadow-sm ring-1 ring-forest/5 md:py-5">
        {perks.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col items-center gap-2 px-2 text-center md:flex-row md:items-start md:gap-3 md:px-5 md:text-left">
            <Icon size={30} className="shrink-0 text-forest" aria-hidden />
            <div>
              <p className="font-display text-xs leading-tight font-semibold text-forest md:text-base">{title}</p>
              <p className="mt-0.5 hidden text-sm text-ink/70 md:block">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}

export function HowItWorks({ size }: { size: number }) {
  return (
    <section aria-label="How your Mix Box works" className="bg-[#f6e6cc] pt-4">
      <ArtBanner
        wide={{ src: '/images/mixbox-works-wide.webp', width: 1600, height: 499 }}
        tall={{ src: '/images/mixbox-works-tall.webp', width: 1006, height: 1564 }}
        alt={`How your Mix Box works. 1: Pick ${size} cups, choose any flavours from our collection. 2: Build your mix, add your favourites to create your box. 3: We pack and ship, we carefully pack your MAGO Mix Box and deliver it to your door.`}
      />
    </section>
  );
}

export function CravingsBanner() {
  return (
    <section aria-label="Create a box that fits your cravings" className="bg-[#f6e6cc]">
      <ArtBanner
        wide={{ src: '/images/mixbox-cravings-wide.webp', width: 1600, height: 900 }}
        tall={{ src: '/images/mixbox-cravings-tall.webp', width: 1006, height: 1564 }}
        alt="Create a box that fits your cravings. From vibrant Mediterranean flavours to comforting classics, your MAGO Mix Box is all about more of what you love. Same pasta. More possibilities."
      >
        <ScrollLink bare href="#cups" aria-label="Start mixing" className={cn(hit, 'top-[41.5%] left-[18%] h-[4.5%] w-[64%] md:top-[63.5%] md:left-[47.5%] md:h-[8.5%] md:w-[19%]')}>
          <span className="sr-only">Start mixing</span>
        </ScrollLink>
      </ArtBanner>
    </section>
  );
}
