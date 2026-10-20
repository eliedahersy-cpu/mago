import { getImageProps } from 'next/image';
import { Gift, Leaf, Smile, Soup } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { SunMark } from '@/components/brand/Decor';
import { Container } from '@/components/ui/Container';
import { BoxStepper } from './BoxStepper';
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
    <section
      aria-label="Build your MAGO Mix Box"
      className="relative isolate overflow-hidden"
    >
      <div className="mx-auto grid max-w-[2560px] md:min-h-[clamp(380px,32vw,760px)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="relative z-10 px-5 pt-8 pb-4 text-center md:flex md:flex-col md:items-start md:justify-center md:py-10 md:pr-0 md:pl-[max(2.5rem,12vw)] md:text-left">
          <SunMark className="mx-auto w-20 md:mx-0 md:w-[clamp(5rem,7vw,9rem)]" />
          <h1 className="mt-1 font-display leading-[0.92] font-bold uppercase">
            <span className="block text-[2.3rem] text-forest sm:text-5xl md:text-[clamp(2.6rem,4.6vw,6.2rem)]">Build your</span>
            <span className="block text-[2.3rem] whitespace-nowrap text-terracotta sm:text-5xl md:text-[clamp(2.6rem,4.6vw,6.2rem)]">MAGO Mix Box</span>
          </h1>
          <p className="mt-3 text-base font-medium text-ink/85 md:text-[clamp(1rem,1.5vw,2rem)]">
            Pick {size} cups. Your way. More flavours. More fun.
          </p>
          <BoxStepper size={size} className="mt-4 md:mt-5" />
          <ScrollLink href="#cups" size="lg" className="mt-5 md:mt-6">
            Start mixing <ArrowRight size={18} aria-hidden />
          </ScrollLink>
        </div>
        <div className="relative md:min-h-0">
          <picture>
            <source media="(min-width: 768px)" srcSet="/images/mixbox-box-wide.webp" width={910} height={533} />
            <img
              src="/images/mixbox-box-square.webp"
              width={1254}
              height={664}
              alt="An open MAGO Mix Box with five pasta cups"
              loading="eager"
              fetchPriority="high"
              className="block h-auto w-full md:absolute md:inset-0 md:h-full md:object-cover md:object-left [mask-image:linear-gradient(to_bottom,transparent,#000_14%)] md:[mask-image:linear-gradient(to_right,transparent,#000_16%)]"
            />
          </picture>
        </div>
      </div>
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
