import type { Metadata } from 'next';
import { MixBoxBuilder } from '@/components/mix/MixBoxBuilder';
import { getActiveProducts } from '@/lib/data/catalog';

export const metadata: Metadata = {
  title: 'Build Your MAGO Mix Box',
  description: 'Choose five of your favourite MAGO pasta cups and build your personal mix.',
};

export default async function MixBoxPage() {
  const cups = (await getActiveProducts()).filter((p) => p.type === 'cup');
  return <MixBoxBuilder cups={cups}/>;
}
