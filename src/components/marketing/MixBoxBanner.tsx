import { ArrowRight, Gift, Layers, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { ArchDecor, LeafSprig } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';

const perks = [
  { icon: Layers, label: 'Mix your favourites' },
  { icon: Sparkles, label: 'More flavours to explore' },
  { icon: Gift, label: 'The perfect gift' },
];

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

  return (
    <section className="relative overflow-hidden bg-cream-dark/50">
      <ArchDecor tone="saffron" className="pointer-events-none absolute -bottom-10 -left-8 w-28 opacity-40" />
      <Container className="grid items-center gap-8 py-12 md:grid-cols-2 md:py-16">
        <div>
          <h2 className="font-display leading-none font-bold text-forest uppercase">
            <span className="block text-2xl md:text-3xl">Build your</span>
            <span className="block text-4xl md:text-6xl">MAGO Mix Box</span>
          </h2>
          <p className="mt-3 text-lg text-ink/80">Pick 5 cups. Your way.</p>
          <ul className="mt-6 flex flex-wrap gap-6">
            {perks.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm font-medium text-forest">
                <Icon size={22} aria-hidden /> {label}
              </li>
            ))}
          </ul>
          <ButtonLink href="/mix-box" className="mt-7">
            Start mixing <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>
        <div className="relative aspect-[4/3] w-full">
          <Image
            src="/products/mago-mix-box.webp"
            alt="The MAGO Mix Box: 5 cups, your mix"
            fill
            sizes="(min-width: 768px) 50vw, 100vw"
            className="object-contain drop-shadow-xl"
          />
        </div>
      </Container>
    </section>
  );
}
