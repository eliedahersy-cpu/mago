import { ArchDecor, LeafSprig } from '@/components/brand/Decor';
import { ProductCard } from '@/components/product/ProductCard';
import { Carousel } from '@/components/ui/Carousel';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import type { Product } from '@/lib/types';

export function CupCollection({ products }: { products: Product[] }) {
  return (
    <section className="relative overflow-hidden py-12 md:py-16">
      <ArchDecor tone="forest" className="pointer-events-none absolute top-8 -right-10 hidden w-24 opacity-40 md:block" />
      <LeafSprig className="pointer-events-none absolute top-6 left-4 hidden w-12 -rotate-12 opacity-60 md:block" />
      <Container>
        <SectionHeading title="The MAGO cup collection" subtitle="Five moods. Endless possibilities." />
        <Carousel
          ariaLabel="The MAGO cup collection"
          className="mt-8"
          itemClassName="w-[70%] sm:w-[40%] md:w-[30%] lg:w-[calc(20%-0.8rem)]"
        >
          {products.map((p) => (
            <ProductCard key={p.id} product={p} variant="showcase" />
          ))}
        </Carousel>
      </Container>
    </section>
  );
}
