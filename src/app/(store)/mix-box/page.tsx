import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MixBoxBuilder } from '@/components/mix/MixBoxBuilder';
import { getActiveProducts } from '@/lib/data/catalog';

export const metadata: Metadata = {
  title: 'Build Your MAGO Mix Box',
  description: 'Choose five of your favourite MAGO pasta cups and build your personal mix.',
};

export default function MixBoxPage() {
  return <Suspense fallback={<div className="min-h-[70vh] bg-cream-light p-12 text-center font-display text-2xl text-forest">Preparing your mix box…</div>}><MixBoxContent /></Suspense>;
}

async function MixBoxContent() {
  const cups = (await getActiveProducts()).filter((p) => p.type === 'cup');
  return <MixBoxBuilder cups={cups}/>;
}
