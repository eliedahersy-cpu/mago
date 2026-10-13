import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProductForm } from '@/components/admin/ProductForm';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { NEW_PRODUCT } from '@/lib/admin/product-defaults';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminCollections } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Add product' };

export default function NewProductPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <NewProduct />
    </Suspense>
  );
}

async function NewProduct() {
  await requireStaff('/admin/products/new');
  const collections = await listAdminCollections();
  return (
    <>
      <PageHeader back={{ href: '/admin/products', label: 'Products' }} title="Add product" description="New products start as drafts; add photos after saving." />
      <ProductForm defaults={NEW_PRODUCT} collections={collections.map((c) => ({ id: c.id, title: c.title }))} />
    </>
  );
}
