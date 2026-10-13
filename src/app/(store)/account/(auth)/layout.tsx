import type { ReactNode } from 'react';
import { ArchDecor, LeafSprig, SunMark } from '@/components/brand/Decor';
import { Container } from '@/components/ui/Container';

/** Centred card for sign-in, registration and password pages. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="relative overflow-hidden">
      <ArchDecor className="pointer-events-none absolute -bottom-6 -left-10 hidden w-28 opacity-40 md:block" />
      <LeafSprig className="pointer-events-none absolute top-10 right-10 hidden w-12 rotate-12 opacity-60 md:block" />
      <Container className="py-10 md:py-16">
        <div className="mx-auto max-w-md rounded-3xl bg-cream-light p-6 shadow-md ring-1 ring-forest/5 md:p-8">
          <SunMark className="mx-auto w-16" />
          {children}
        </div>
      </Container>
    </section>
  );
}
