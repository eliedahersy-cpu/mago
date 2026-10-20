import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ArchDecor, LeafSprig, ScriptNote } from '@/components/brand/Decor';
import { StoreLocator } from '@/components/stores/StoreLocator';
import { getStores } from '@/lib/data/cached';

export const metadata: Metadata = {
  title: 'Find MAGO Near You',
  description: 'MAGO pasta cups are available online and at select supermarkets and shops across Lebanon. Find the one nearest to you.',
};

export default function StoresPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <LeafSprig className="pointer-events-none absolute -top-4 -left-6 -z-10 w-20 -rotate-[30deg] text-leaf md:w-32" />
        <ArchDecor tone="terracotta" className="pointer-events-none absolute -bottom-10 -left-8 -z-10 hidden w-32 opacity-80 md:block" />
        <LeafSprig className="pointer-events-none absolute -top-3 -right-4 -z-10 w-16 rotate-[30deg] text-forest-light md:w-28" />
        <ArchDecor tone="peach" className="pointer-events-none absolute -right-10 -bottom-12 -z-10 hidden w-32 opacity-80 md:block" />
        <div className="mx-auto max-w-4xl px-5 py-10 text-center md:py-14">
          <h1 className="font-display text-[2.6rem] leading-[0.92] font-bold text-forest uppercase md:text-7xl">
            Find MAGO
            <span className="block text-terracotta">near you</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-base text-ink/85 md:text-xl">Available online and at select retailers across Lebanon.</p>
          <ScriptNote arrow="down" className="mt-3 hidden -rotate-3 text-xl text-forest md:inline-flex">
            Good food, closer to you.
          </ScriptNote>
        </div>
      </section>
      <div className="pt-6">
        <Suspense fallback={<p className="py-16 text-center text-ink/70">Loading stores…</p>}>
          <Stores />
        </Suspense>
      </div>
    </>
  );
}

async function Stores() {
  return <StoreLocator stores={await getStores()} />;
}
