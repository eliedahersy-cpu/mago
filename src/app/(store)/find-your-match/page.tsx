import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QuizExperience } from '@/components/quiz/QuizExperience';
import { getMixBoxCups, getProductBySlug } from '@/lib/data/cached';
import { DEFAULT_BOX_SIZE } from '@/lib/mix-box/box';

export const metadata: Metadata = {
  title: 'Find Your MAGO Match',
  description: 'Answer a few simple questions and find the MAGO pasta cups that suit your taste, mood and lifestyle.',
};

export default function MatchPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] bg-cream-light p-12 text-center font-display text-2xl text-forest">Finding your MAGO match…</div>}>
      <MatchContent />
    </Suspense>
  );
}

async function MatchContent() {
  const [cups, bundle] = await Promise.all([getMixBoxCups(), getProductBySlug('mago-mix-box')]);
  const bundleImage = bundle?.images.find((i) => i.kind === 'packshot') ?? bundle?.images[0];
  return (
    <QuizExperience
      cups={cups}
      boxSize={bundle?.bundleSize ?? DEFAULT_BOX_SIZE}
      bundle={bundle ? { productId: bundle.id, slug: bundle.slug, name: bundle.name, image: bundleImage?.url ?? null } : null}
    />
  );
}
