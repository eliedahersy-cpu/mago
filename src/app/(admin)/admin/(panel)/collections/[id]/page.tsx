import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CollectionForm } from '@/components/admin/CollectionForm';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminCollections, listAdminProducts } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Collection' };

export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** /admin/collections/new creates one; /admin/collections/<id> edits it. */
export default function CollectionPage({ params }: PageProps<'/admin/collections/[id]'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Collection params={params} />
    </Suspense>
  );
}

async function Collection({ params }: { params: PageProps<'/admin/collections/[id]'>['params'] }) {
  const { id } = await params;
  await requireStaff(`/admin/collections/${encodeURIComponent(id)}`);
  const isNew = id === 'new';
  if (!isNew && !UUID.test(id)) notFound();
  const [collections, products] = await Promise.all([listAdminCollections(), listAdminProducts()]);
  const collection = isNew ? null : (collections.find((c) => c.id === id) ?? null);
  if (!isNew && !collection) notFound();
  return (
    <>
      <PageHeader back={{ href: '/admin/collections', label: 'Collections' }} title={collection?.title ?? 'Add collection'} />
      <CollectionForm
        collection={collection}
        products={products.map((p) => ({ id: p.id, label: [p.name, p.flavour].filter(Boolean).join(' '), status: p.status }))}
      />
    </>
  );
}
