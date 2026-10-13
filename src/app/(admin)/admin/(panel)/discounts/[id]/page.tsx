import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { DiscountForm } from '@/components/admin/DiscountForm';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { getDiscount } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Discount' };

export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** /admin/discounts/new creates one; /admin/discounts/<id> edits it. */
export default function DiscountPage({ params }: PageProps<'/admin/discounts/[id]'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Discount params={params} />
    </Suspense>
  );
}

async function Discount({ params }: { params: PageProps<'/admin/discounts/[id]'>['params'] }) {
  const { id } = await params;
  await requireStaff(`/admin/discounts/${encodeURIComponent(id)}`);
  const isNew = id === 'new';
  if (!isNew && !UUID.test(id)) notFound();
  const discount = isNew ? null : await getDiscount(id);
  if (!isNew && !discount) notFound();
  return (
    <>
      <PageHeader back={{ href: '/admin/discounts', label: 'Discounts' }} title={discount ? (discount.code ?? discount.title) : 'Add discount'} />
      <DiscountForm discount={discount} />
    </>
  );
}
