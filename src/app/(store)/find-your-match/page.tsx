import type { Metadata } from 'next';
import { QuizExperience } from '@/components/quiz/QuizExperience';
import { getActiveProducts } from '@/lib/data/catalog';

export const metadata: Metadata = {
  title: 'Find Your MAGO Match',
  description: 'Discover the MAGO pasta cups that best fit your favourite flavours, mood and lifestyle.',
};

export default async function MatchPage() {
  const cups = (await getActiveProducts()).filter((product) => product.type === 'cup');
  return <QuizExperience cups={cups} />;
}
