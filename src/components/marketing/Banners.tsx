import { ArrowRight, Ban, Leaf, Salad, Sunrise, Timer } from 'lucide-react';
import Image from 'next/image';
import { ArchDecor, LeafSprig, ScriptNote } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export function QuizBanner() {
  return (
    <section className="relative overflow-hidden bg-cream-light">
      <ArchDecor tone="terracotta" className="pointer-events-none absolute -bottom-12 left-1/2 hidden w-40 opacity-25 md:block" />
      <Container className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
        <div>
          <h2 className="font-display leading-none font-bold uppercase">
            <span className="block text-3xl text-terracotta md:text-4xl">Find your</span>
            <span className="block text-5xl text-forest md:text-7xl">Match</span>
          </h2>
          <p className="mt-4 max-w-md text-lg text-ink/80">
            Not sure where to start? Answer a few quick questions and we&apos;ll find your perfect MAGO flavours.
          </p>
          <ButtonLink href="/find-your-match" className="mt-7">
            Take the quiz <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <Image
            src="/products/fusilli-spicy-muhammara.webp"
            alt="MAGO Fusilli Cup Spicy Muhammara"
            fill
            sizes="(min-width: 768px) 420px, 80vw"
            className="object-contain mix-blend-multiply"
          />
          <ScriptNote arrow="left" className="absolute top-6 -right-2 rotate-6 md:-right-10">
            Same pasta.
            <br />
            More possibilities.
          </ScriptNote>
        </div>
      </Container>
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
