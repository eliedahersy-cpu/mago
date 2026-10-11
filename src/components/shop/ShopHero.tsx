import Image from 'next/image';
import { ArchDecor, LeafSprig, ScriptNote } from '@/components/brand/Decor';
import { BenefitIcons } from '@/components/product/BenefitIcons';
import { Container } from '@/components/ui/Container';

export function ShopHero() {
  return (
    <section className="relative overflow-hidden">
      <ArchDecor className="pointer-events-none absolute top-6 -left-10 hidden w-24 opacity-60 md:block" />
      <LeafSprig className="pointer-events-none absolute top-8 right-8 hidden w-14 rotate-12 opacity-70 lg:block" />
      <Container className="grid items-center gap-6 py-8 md:grid-cols-[1.2fr_1fr] md:py-12">
        <div className="text-center md:text-left">
          <h1 className="font-display text-5xl leading-none font-bold text-forest uppercase md:text-7xl">Our pasta cups</h1>
          <p className="mt-3 text-lg text-ink/80 md:text-xl">Mediterranean flavours. Real ingredients. Big protein per cup.</p>
          <BenefitIcons variant="hero" className="mx-auto mt-6 md:mx-0" />
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-sm">
          <ArchDecor tone="terracotta" className="absolute inset-x-8 bottom-0 opacity-30" />
          <Image
            src="/products/fusilli-spicy-muhammara.webp"
            alt="MAGO Fusilli Cup Spicy Muhammara"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) 380px, 80vw"
            className="object-contain mix-blend-multiply"
          />
          <ScriptNote arrow="left" className="absolute -bottom-2 left-0 hidden -rotate-6 md:inline-flex">
            Same pasta. More possibilities.
          </ScriptNote>
        </div>
      </Container>
    </section>
  );
}
