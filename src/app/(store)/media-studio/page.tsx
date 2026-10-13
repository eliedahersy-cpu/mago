import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getRecipeCards } from '@/lib/data/cached';
import { MediaStudio } from '@/components/media/MediaStudio';

export const metadata:Metadata = {
  title: 'MAGO Visual Studio — Staging',
  robots:{index:false,follow:false},
};

export default function MediaStudioPage() {
  return <Suspense fallback={<div className="min-h-[60vh] bg-cream-light p-12 text-center text-forest">Loading media editor…</div>}><StudioContent /></Suspense>;
}

async function StudioContent() {
  const recipes=await getRecipeCards(80);
  return <MediaStudio recipes={recipes}/>;
}
