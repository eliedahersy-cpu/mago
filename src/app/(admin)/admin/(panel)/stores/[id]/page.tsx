import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { StoreForm, type StoreDefaults } from '@/components/admin/StoreForm';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { getAdminStore, listAdminProducts } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Store' };

export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NEW_STORE: StoreDefaults = {
  id: null,
  name: '',
  slug: '',
  chain: '',
  type: 'supermarket',
  address: '',
  area: '',
  city: '',
  lat: '',
  lng: '',
  hours: '',
  phone: '',
  website: '',
  image: '',
  isActive: true,
  productIds: [],
};

/** /admin/stores/new creates one; /admin/stores/<id> edits it. */
export default function StorePage({ params }: PageProps<'/admin/stores/[id]'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Store params={params} />
    </Suspense>
  );
}

async function Store({ params }: { params: PageProps<'/admin/stores/[id]'>['params'] }) {
  const { id } = await params;
  await requireStaff(`/admin/stores/${encodeURIComponent(id)}`);
  const isNew = id === 'new';
  if (!isNew && !UUID.test(id)) notFound();
  const [store, products] = await Promise.all([isNew ? null : getAdminStore(id), listAdminProducts({ status: 'active' })]);
  if (!isNew && !store) notFound();
  return (
    <>
      <PageHeader back={{ href: '/admin/stores', label: 'Stores' }} title={store?.name || 'Add store'} />
      <StoreForm
        defaults={store ?? NEW_STORE}
        products={products.filter((p) => p.type !== 'bundle').map((p) => ({ id: p.id, label: [p.name, p.flavour].filter(Boolean).join(' ') }))}
      />
    </>
  );
}
