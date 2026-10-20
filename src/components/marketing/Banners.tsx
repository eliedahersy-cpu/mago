import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

/** Home band inviting people to the quiz: real text and button over the approved scene (phone: scene under the text; wide: scene on the right). */
export function QuizBanner() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="mx-auto grid max-w-[2560px] md:min-h-[clamp(380px,34vw,820px)] md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="relative z-10 px-6 pt-10 pb-2 text-center md:flex md:flex-col md:items-start md:justify-center md:py-12 md:pr-0 md:pl-[max(2.5rem,9vw)] md:text-left">
          <h2 className="font-display leading-[0.95] font-bold uppercase">
            <span className="block text-[2.4rem] text-terracotta md:text-[clamp(2.6rem,4.4vw,5.8rem)]">Find your</span>
            <span className="block text-[3.6rem] text-forest md:text-[clamp(4rem,7.2vw,9.4rem)]">Match</span>
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-base font-medium text-ink/85 md:mx-0 md:max-w-[34rem] md:text-[clamp(1rem,1.5vw,2rem)]">
            Not sure where to start? Answer a few quick questions and we&apos;ll find your perfect MAGO flavours.
          </p>
          <ButtonLink href="/find-your-match" size="lg" className="mt-5 md:mt-6">
            Take the quiz <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>
        <div className="relative">
          <picture>
            <source media="(min-width: 768px)" srcSet="/images/fym-scene-wide-2.webp" width={900} height={900} />
            <img
              src="/images/fym-scene-tall.webp"
              width={900}
              height={880}
              alt="A MAGO Fusilli Cup Spicy Muhammara with basil, walnuts and roasted pepper"
              loading="lazy"
              className="block h-auto w-full [mask-image:linear-gradient(to_bottom,transparent,#000_14%)] md:absolute md:inset-0 md:h-full md:object-cover md:object-left md:[mask-image:linear-gradient(to_right,transparent,#000_10%)]"
            />
          </picture>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: '/images/features/ingredients.webp', title: 'Real ingredients', detail: 'You can trust' },
  { icon: '/images/features/mediterranean.webp', title: 'Mediterranean', detail: 'Inspired flavours' },
  { icon: '/images/features/ready.webp', title: 'Ready', detail: 'In minutes' },
  { icon: '/images/features/natural.webp', title: 'No artificial', detail: 'Colours or flavours' },
  { icon: '/images/features/brighter.webp', title: 'A brighter', detail: 'Way to eat' },
];

export function FeatureStrip() {
  return (
    <section className="relative overflow-hidden">
      <Container className="py-8 md:py-10">
        <ul
          tabIndex={0}
          aria-label="Why MAGO"
          className="scrollbar-none -mx-4 flex snap-x gap-6 overflow-x-auto px-4 focus-visible:outline-offset-4 md:mx-0 md:grid md:grid-cols-5 md:px-0"
        >
          {features.map(({ icon, title, detail }) => (
            <li key={title} className="flex min-w-36 shrink-0 snap-start flex-col items-center text-center">
              <Image src={icon} alt="" width={120} height={100} className="h-20 w-auto object-contain md:h-24" />
              <p className="mt-2 font-display text-sm leading-tight font-bold text-forest uppercase">{title}</p>
              <p className="text-xs font-medium text-forest/80 uppercase">{detail}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

export function OnTheGoBanner() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="/images/lifestyle-lemon-office.webp"
        alt="Enjoying a MAGO cup at work"
        fill
        sizes="100vw"
        className="-z-10 object-cover object-[60%_35%]"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-forest/90 via-forest/60 to-transparent" />
      <Container className="py-20 md:py-28">
        <h2 className="max-w-md font-display text-4xl leading-none font-bold text-cream-light uppercase md:text-6xl">
          Good food on the go
        </h2>
        <p className="mt-4 max-w-sm text-lg text-cream-light/90">At home, at work, anywhere. MAGO fits your day.</p>
        <ButtonLink href="/shop" variant="light" className="mt-7">
          Shop now <ArrowRight size={18} aria-hidden />
        </ButtonLink>
      </Container>
    </section>
  );
}
