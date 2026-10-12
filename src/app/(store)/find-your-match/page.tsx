import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QuizExperience } from '@/components/quiz/QuizExperience';
import { getActiveProducts } from '@/lib/data/catalog';

export const metadata: Metadata = {
  title: 'Find Your MAGO Match',
  description: 'Discover the MAGO pasta cups that best fit your favourite flavours, mood and lifestyle.',
};

export default function MatchPage() {
  return <Suspense fallback={<div className="min-h-[70vh] bg-cream-light p-12 text-center font-display text-2xl text-forest">Finding your MAGO match…</div>}><MatchContent /></Suspense>;
}

async function MatchContent() {
  const cups = (await getActiveProducts()).filter((product) => product.type === 'cup');
  return <QuizExperience cups={cups} />;
}
