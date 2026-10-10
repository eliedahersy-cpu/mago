import { ArrowRight } from 'lucide-react';
import { ArchDecor, SunMark } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';

export function NotFoundContent() {
  return (
    <section className="relative mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <ArchDecor className="absolute top-10 -left-24 hidden w-28 opacity-70 md:block" />
      <SunMark className="w-24" />
      <h1 className="mt-4 font-display text-4xl font-bold text-forest uppercase">We couldn&apos;t find that page</h1>
      <p className="mt-3 text-ink/80">The page you&apos;re looking for has moved or never existed.</p>
      <ButtonLink href="/shop" className="mt-8">
        Explore our cups <ArrowRight size={18} aria-hidden />
      </ButtonLink>
    </section>
  );
}
