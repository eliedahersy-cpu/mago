import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ManualOrderForm, type PickerProduct } from '@/components/admin/ManualOrderForm';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminProducts } from '@/lib/data/admin';
import { getSettings } from '@/lib/data/cached';

export const metadata: Metadata = { title: 'New order' };

export default function NewOrderPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <NewOrder />
    </Suspense>
  );
}

async function NewOrder() {
  await requireStaff('/admin/orders/new');
  const [products, settings] = await Promise.all([listAdminProducts({ status: 'active' }), getSettings()]);
  // Mix Boxes are built on the website; here staff add loose products.
  const picker: PickerProduct[] = products
    .filter((p) => p.type !== 'bundle')
    .map((p) => ({
      id: p.id,
      name: p.name,
      flavour: p.flavour,
      price: p.price,
      image: p.image,
      stock: p.trackInventory && !p.allowBackorder ? p.stock : null,
    }));
  return (
    <>
      <PageHeader back={{ href: '/admin/orders', label: 'Orders' }} title="New order" description="For orders taken by phone, WhatsApp or in person. Paid cash on delivery." />
      <ManualOrderForm products={picker} governorates={settings.deliveryAreas} />
    </>
  );
}
