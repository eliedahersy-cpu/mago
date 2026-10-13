import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { adminButton, EmptyState, LoadingBlock, PageHeader, Pill, TableWrap, td, th } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminStores } from '@/lib/data/admin';
import { STORE_TYPES } from '@/lib/stores/geo';

export const metadata: Metadata = { title: 'Stores' };

export default function StoresAdminPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Stores />
    </Suspense>
  );
}

async function Stores() {
  await requireStaff('/admin/stores');
  const stores = await listAdminStores();
  return (
    <>
      <PageHeader
        title="Stores"
        description="Shops that sell MAGO, shown on the Find MAGO near you page."
        actions={
          <Link href="/admin/stores/new" className={adminButton.primary}>
            <Plus size={16} aria-hidden /> Add store
          </Link>
        }
      />
      {stores.length ? (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Store</th>
              <th className={th}>Type</th>
              <th className={th}>Where</th>
              <th className={th}>Products</th>
              <th className={th}>Locator</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="hover:bg-cream-light/50">
                <td className={td}>
                  <Link href={`/admin/stores/${s.id}`} className="font-semibold text-forest hover:underline">
                    {s.name}
                  </Link>
                  {s.lat === null ? <span className="block text-xs text-terracotta">No map location</span> : null}
                </td>
                <td className={td}>{STORE_TYPES.find((t) => t.key === s.type)?.label ?? s.type}</td>
                <td className={`${td} text-ink/70`}>{[s.area, s.city].filter(Boolean).join(', ') || '—'}</td>
                <td className={td}>{s.productCount}</td>
                <td className={td}>{s.isActive ? <Pill tone="good">Shown</Pill> : <Pill>Hidden</Pill>}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="No stores yet" />
      )}
    </>
  );
}
