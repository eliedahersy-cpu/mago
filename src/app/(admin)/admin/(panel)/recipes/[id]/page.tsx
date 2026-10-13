import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { RecipeForm } from '@/components/admin/RecipeForm';
import { adminButton, LoadingBlock, PageHeader } from '@/components/admin/ui';
import { NEW_RECIPE, recipeDefaults } from '@/lib/admin/recipe-form';
import { requireStaff } from '@/lib/auth/dal';
import { getAdminRecipe, listAdminProducts } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Recipe' };

export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** /admin/recipes/new creates one; /admin/recipes/<id> edits it. */
export default function RecipePage({ params }: PageProps<'/admin/recipes/[id]'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Recipe params={params} />
    </Suspense>
  );
}

async function Recipe({ params }: { params: PageProps<'/admin/recipes/[id]'>['params'] }) {
  const { id } = await params;
  await requireStaff(`/admin/recipes/${encodeURIComponent(id)}`);
  const isNew = id === 'new';
  if (!isNew && !UUID.test(id)) notFound();
  const [row, products] = await Promise.all([isNew ? null : getAdminRecipe(id), listAdminProducts({ type: 'cup' })]);
  if (!isNew && !row) notFound();
  const defaults = row ? recipeDefaults(row) : NEW_RECIPE;
  return (
    <>
      <PageHeader
        back={{ href: '/admin/recipes', label: 'Recipes' }}
        title={defaults.title || 'Add recipe'}
        actions={
          row && row.status === 'published' ? (
            <Link href={`/recipes/${String(row.slug)}`} target="_blank" className={adminButton.secondary}>
              View on the site <ExternalLink size={14} aria-hidden />
            </Link>
          ) : null
        }
      />
      <RecipeForm defaults={defaults} products={products.map((p) => ({ id: p.id, label: [p.name, p.flavour].filter(Boolean).join(' ') }))} />
    </>
  );
}
