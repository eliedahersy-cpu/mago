import { ArrowRight, Dumbbell, Landmark, Leaf, Recycle, Sprout, TreePine, Wheat } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import { ArchDecor, LeafSprig, SunMark } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Our Story',
  description:
    'Inspired by our Mediterranean roots, MAGO brings together tradition, bold flavours and modern nutrition.',
};

const values = [
  { icon: Landmark, label: 'Rooted in the Mediterranean' },
  { icon: Dumbbell, label: 'High protein for today' },
  { icon: Leaf, label: 'Real ingredients always' },
  { icon: TreePine, label: 'Made in Lebanon' },
];

const commitments = [
  { icon: Recycle, label: 'Recyclable packaging' },
  { icon: Sprout, label: 'Responsibly sourced ingredients' },
  { icon: Wheat, label: 'Supporting local farmers' },
];

export default function OurStoryPage() {
  return (
    <>
      {/* Phones: the designed layout, built from real text over the pattern, with the shelf photo below. */}
      <section aria-label="A modern take on a timeless heritage" className="relative isolate overflow-hidden bg-[#faecd3] md:hidden">
        <div aria-hidden className="absolute top-0 left-0 -z-10 h-[330px] w-[16%] bg-[url('/images/decor/side-left.webp')] bg-[length:100%_auto] bg-repeat-y" />
        <div aria-hidden className="absolute top-0 right-0 -z-10 h-[330px] w-[16%] bg-[url('/images/decor/side-right.webp')] bg-[length:100%_auto] bg-right bg-repeat-y" />
        <div className="px-9 pt-8 pb-10 text-center">
          <SunMark className="mx-auto w-20" />
          <h1 className="mt-3 font-display text-[2rem] leading-[1.02] font-bold text-forest uppercase">A modern take on a timeless heritage</h1>
          <p className="mx-auto mt-4 max-w-xs text-base leading-relaxed text-ink/85">
            Inspired by our Mediterranean roots, MAGO brings together tradition, bold flavours and modern nutrition — for a brighter, healthier tomorrow.
          </p>
        </div>
        <Image src="/images/story-shelf-mobile.webp" alt="MAGO pasta boxes on a pantry shelf" width={1122} height={862} loading="eager" fetchPriority="high" sizes="100vw" className="block h-auto w-full" />
      </section>

      <section className="relative hidden overflow-hidden md:block">
        <LeafSprig className="pointer-events-none absolute top-6 left-4 hidden w-14 -rotate-12 opacity-70 md:block" />
        <Container className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
          <div className="text-center md:text-left">
            <SunMark className="mx-auto w-20 md:mx-0" />
            <h1 className="mt-3 font-display text-4xl leading-none font-bold text-forest uppercase md:text-6xl">
              A modern take on a timeless heritage
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-ink/85">
              Inspired by our Mediterranean roots, MAGO brings together tradition, bold flavours and modern
              nutrition — for a brighter, healthier tomorrow.
            </p>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image
              src="/images/lifestyle-pantry-shelf.webp"
              alt="MAGO pasta boxes on a pantry shelf"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      </section>

      <section className="bg-cream-dark/50">
        <Container className="py-8">
          <ul className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {values.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2 text-center">
                <span className="flex size-14 items-center justify-center rounded-full border-2 border-forest text-forest">
                  <Icon size={26} aria-hidden />
                </span>
                <span className="font-display text-sm font-bold text-forest uppercase">{label}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="relative overflow-hidden">
        <ArchDecor tone="terracotta" className="pointer-events-none absolute -right-8 bottom-0 hidden w-28 opacity-40 md:block" />
        <Container className="grid items-center gap-8 py-14 md:grid-cols-[1fr_1.1fr]">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl md:order-2">
            <Image
              src="/images/lifestyle-kitchen-portrait.webp"
              alt="Enjoying a MAGO cup in the kitchen"
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold text-forest uppercase md:text-4xl">Our story</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/85">
              Mago was born from a simple belief: good food can make everyday life brighter. Inspired by the rich
              culinary heritage of the Mediterranean and the vibrancy of modern living, we create natural,
              convenient and delicious pasta meals that fit your day — and fuel your next adventure.
            </p>
          </div>
        </Container>
      </section>

      <section className="bg-forest text-cream-light">
        <Container className="py-14 text-center">
          <h2 className="font-display text-3xl leading-none font-bold uppercase md:text-5xl">
            Good food,
            <br />a brighter tomorrow
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-cream-light/85">
            We believe in nourishing people and the planet. From responsibly sourced ingredients to recyclable
            packaging, we&apos;re committed to a healthier, brighter future.
          </p>
          <ul className="mx-auto mt-8 grid max-w-3xl gap-6 sm:grid-cols-3">
            {commitments.map(({ icon: Icon, label }) => (
              <li key={label} className="flex flex-col items-center gap-2">
                <span className="flex size-14 items-center justify-center rounded-full border-2 border-cream-light/70">
                  <Icon size={26} aria-hidden />
                </span>
                <span className="font-display text-sm font-semibold uppercase">{label}</span>
              </li>
            ))}
          </ul>
          <ButtonLink href="/shop" variant="light" className="mt-10">
            Explore our cups <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </Container>
      </section>
    </>
  );
}
