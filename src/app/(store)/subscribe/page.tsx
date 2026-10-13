import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SubscribePreview } from '@/components/subscription/SubscribePreview';
import { getActiveProducts } from '@/lib/data/catalog';

export const metadata: Metadata = {
  title: 'Subscribe & Save',
  description: 'Explore recurring MAGO Mix Box deliveries and create your favourite five-cup selection.',
};

export default function SubscribePage() {
  return <Suspense fallback={<div className="min-h-[70vh] bg-cream-light p-12 text-center font-display text-2xl text-forest">Preparing subscriptions…</div>}><SubscribeContent /></Suspense>;
}

async function SubscribeContent() {
  const cups = (await getActiveProducts()).filter((p)=>p.type==='cup');
  return <SubscribePreview cups={cups}/>;
}
