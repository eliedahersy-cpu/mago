import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { adminButton, EmptyState, LoadingBlock, PageHeader, Pill, TableWrap, td, th } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminRecipes } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Recipes' };

export default function RecipesAdminPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Recipes />
    </Suspense>
  );
}

async function Recipes() {
  await requireStaff('/admin/recipes');
  const recipes = await listAdminRecipes();
  return (
    <>
      <PageHeader
        title="Recipes"
        description="Ideas that start with a MAGO cup. Published recipes show on /recipes and the home page."
        actions={
          <Link href="/admin/recipes/new" className={adminButton.primary}>
            <Plus size={16} aria-hidden /> Add recipe
          </Link>
        }
      />
      {recipes.length ? (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Recipe</th>
              <th className={th}>Status</th>
              <th className={th}>Cup</th>
              <th className={th}>Time</th>
              <th className={th}>Order</th>
            </tr>
          </thead>
          <tbody>
            {recipes.map((r) => (
              <tr key={r.id} className="hover:bg-cream-light/50">
                <td className={td}>
                  <Link href={`/admin/recipes/${r.id}`} className="flex items-center gap-3">
                    <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-light">
                      {r.heroImage ? <Image src={r.heroImage} alt="" fill sizes="56px" className="object-cover" /> : null}
                    </span>
                    <span className="font-semibold text-forest">{r.title}</span>
                  </Link>
                </td>
                <td className={td}>{r.status === 'published' ? <Pill tone="good">Published</Pill> : <Pill tone="warn">Draft</Pill>}</td>
                <td className={`${td} text-ink/70`}>{r.product ?? '—'}</td>
                <td className={td}>{r.minutes} min</td>
                <td className={td}>{r.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="No recipes yet" />
      )}
    </>
  );
}
