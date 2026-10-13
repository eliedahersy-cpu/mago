import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { adminButton, EmptyState, LoadingBlock, PageHeader, Pill, TableWrap, td, th } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminCollections } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Collections' };

export default function CollectionsPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Collections />
    </Suspense>
  );
}

async function Collections() {
  await requireStaff('/admin/collections');
  const collections = await listAdminCollections();
  return (
    <>
      <PageHeader
        title="Collections"
        description="Groups of products used for the shop filters (Fusilli, Best Sellers…)."
        actions={
          <Link href="/admin/collections/new" className={adminButton.primary}>
            <Plus size={16} aria-hidden /> Add collection
          </Link>
        }
      />
      {collections.length ? (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Collection</th>
              <th className={th}>Products</th>
              <th className={th}>Shop</th>
              <th className={th}>Order</th>
            </tr>
          </thead>
          <tbody>
            {collections.map((c) => (
              <tr key={c.id} className="hover:bg-cream-light/50">
                <td className={td}>
                  <Link href={`/admin/collections/${c.id}`} className="font-semibold text-forest hover:underline">
                    {c.title}
                  </Link>
                  <span className="block text-xs text-ink/55">/shop?collection={c.slug}</span>
                </td>
                <td className={td}>{c.productIds.length}</td>
                <td className={td}>{c.isVisible ? <Pill tone="good">Visible</Pill> : <Pill>Hidden</Pill>}</td>
                <td className={td}>{c.sortOrder}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="No collections yet" />
      )}
    </>
  );
}
