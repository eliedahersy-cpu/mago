import { ArrowRight, Ban, Leaf, Salad, Sunrise, Timer } from 'lucide-react';
import Image from 'next/image';
import { ArchDecor, LeafSprig, ScriptNote } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

/** Home band inviting people to the quiz: copy on the left, a close-up of a full cup cropped by the band. */
export function QuizBanner() {
  return (
    <section className="relative isolate overflow-hidden bg-[linear-gradient(100deg,#fbefdc_0%,#f6e3c6_55%,#f1dcc0_100%)]">
      <div className="mx-auto grid h-[250px] max-w-7xl grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] sm:h-[300px] md:h-[340px] md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
        <div className="relative z-10 flex flex-col justify-center py-6 pl-5 md:pl-10 lg:pl-16">
          <h2 className="font-display leading-[0.9] font-bold uppercase">
            <span className="block text-2xl text-terracotta sm:text-3xl md:text-4xl">Find your</span>
            <span className="block text-[2.6rem] text-forest sm:text-5xl md:text-7xl">Match</span>
          </h2>
          <p className="mt-2 max-w-md text-[13px] leading-snug text-ink/85 sm:text-base md:mt-3 md:text-lg">
            Not sure where to start? Answer a few quick questions and we&apos;ll find your perfect MAGO flavours.
          </p>
          <ButtonLink href="/find-your-match" size="sm" className="mt-4 w-fit md:mt-6 md:h-11 md:px-6 md:text-sm">
            Take the quiz <ArrowRight size={16} aria-hidden />
          </ButtonLink>
        </div>
        <div className="relative">
          <ArchDecor tone="terracotta" className="absolute bottom-0 left-[2%] hidden w-28 md:block lg:w-36" />
          <LeafSprig className="absolute bottom-0 left-[14%] hidden w-24 -rotate-[20deg] text-leaf md:block lg:w-28" />
          <LeafSprig className="absolute -top-4 right-2 w-12 rotate-[200deg] text-leaf/90 md:w-20" />
          <div className="absolute -top-[22%] -right-[45%] aspect-[4/5] h-[118%] sm:-right-[28%] sm:h-[150%] md:right-auto md:left-[4%] lg:left-[8%]">
            <Image
              src="/products/cutouts/fusilli-spicy-muhammara.webp"
              alt="A MAGO Fusilli Cup Spicy Muhammara, full of pasta"
              fill
              sizes="(min-width: 768px) 420px, 55vw"
              className="object-contain drop-shadow-[0_18px_20px_rgba(55,39,23,0.18)]"
            />
          </div>
          <ScriptNote arrow="left" className="absolute top-[30%] right-0 hidden -rotate-6 text-2xl lg:inline-flex">
            Same pasta.
            <br />
            More possibilities.
          </ScriptNote>
        </div>
      </div>
    </section>
  );
}

const features = [
  { icon: Leaf, title: 'Real ingredients', detail: 'You can trust' },
  { icon: Salad, title: 'Mediterranean', detail: 'Inspired flavours' },
  { icon: Timer, title: 'Ready', detail: 'In minutes' },
  { icon: Ban, title: 'No artificial', detail: 'Colours or flavours' },
  { icon: Sunrise, title: 'A brighter', detail: 'Way to eat' },
];

export function FeatureStrip() {
  return (
    <section className="relative overflow-hidden bg-cream-dark/50">
      <LeafSprig className="pointer-events-none absolute -bottom-6 -left-2 hidden w-16 opacity-70 md:block" />
      <LeafSprig className="pointer-events-none absolute -top-6 -right-2 hidden w-16 rotate-180 opacity-70 md:block" />
      <Container className="py-8">
        <ul className="scrollbar-none -mx-4 flex snap-x gap-6 overflow-x-auto px-4 md:mx-0 md:grid md:grid-cols-5 md:px-0">
          {features.map(({ icon: Icon, title, detail }) => (
            <li key={title} className="flex min-w-36 shrink-0 snap-start flex-col items-center text-center">
              <Icon size={34} strokeWidth={1.5} className="text-forest" aria-hidden />
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
