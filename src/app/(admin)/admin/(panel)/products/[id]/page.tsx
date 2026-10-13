import { Copy, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { duplicateProduct, setProductStatus } from '@/app/actions/admin/products';
import { ActionForm, SubmitButton } from '@/components/admin/ActionForm';
import { ImageManager } from '@/components/admin/ImageManager';
import { ProductForm } from '@/components/admin/ProductForm';
import { adminButton, Card, LoadingBlock, PageHeader, Pill } from '@/components/admin/ui';
import { productDefaults } from '@/lib/admin/product-defaults';
import { requireStaff } from '@/lib/auth/dal';
import { getAdminProduct, listAdminCollections, listMovements } from '@/lib/data/admin';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Edit product' };

export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function EditProductPage({ params, searchParams }: PageProps<'/admin/products/[id]'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <EditProduct params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EditProduct({ params, searchParams }: Pick<PageProps<'/admin/products/[id]'>, 'params' | 'searchParams'>) {
  const { id } = await params;
  await requireStaff(`/admin/products/${encodeURIComponent(id)}`);
  if (!UUID.test(id)) notFound();
  const [product, collections, movements, sp] = await Promise.all([
    getAdminProduct(id),
    listAdminCollections(),
    listMovements({ productId: id, limit: 8 }),
    searchParams,
  ]);
  if (!product) notFound();
  const row = product.row;
  const name = [row.name, row.flavour].filter(Boolean).join(' ');
  const status = String(row.status);

  return (
    <>
      <PageHeader
        back={{ href: '/admin/products', label: 'Products' }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {name} <Pill tone={status === 'active' ? 'good' : status === 'draft' ? 'warn' : 'neutral'}>{status[0].toUpperCase() + status.slice(1)}</Pill>
          </span>
        }
        description={sp.created ? 'Created. Add photos below, then set it to Active to show it in the shop.' : undefined}
        actions={
          <>
            {status === 'active' ? (
              <Link href={`/shop/${String(row.slug)}`} target="_blank" className={adminButton.secondary}>
                View in shop <ExternalLink size={14} aria-hidden />
              </Link>
            ) : null}
            <ActionForm action={duplicateProduct}>
              <input type="hidden" name="id" value={id} />
              <SubmitButton variant="secondary" pendingLabel="Copying…">
                <Copy size={14} aria-hidden /> Duplicate
              </SubmitButton>
            </ActionForm>
            <ActionForm action={setProductStatus}>
              <input type="hidden" name="id" value={id} />
              {status === 'archived' ? (
                <SubmitButton name="status" value="draft" variant="secondary" pendingLabel="Restoring…">
                  Restore as draft
                </SubmitButton>
              ) : (
                <SubmitButton name="status" value="archived" variant="danger" pendingLabel="Archiving…" confirm="Archive this product? It leaves the shop but past orders keep it.">
                  Archive
                </SubmitButton>
              )}
            </ActionForm>
          </>
        }
      />
      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Photos">
          <ImageManager productId={id} images={product.images} defaultAlt={name} />
        </Card>
        <Card title="Stock" actions={<Link href={`/admin/inventory?q=${encodeURIComponent(String(row.flavour ?? row.name))}`} className="text-sm font-semibold text-forest hover:underline">Adjust</Link>}>
          <p className="font-display text-3xl font-bold text-forest tabular-nums">{String(row.stock)}</p>
          <p className="text-xs text-ink/60">{row.track_inventory ? `Alert at ${String(row.low_stock_threshold)} or fewer` : 'Stock not tracked'}</p>
          {movements.length ? (
            <ul className="mt-3 space-y-1 text-xs text-ink/70">
              {movements.map((m) => (
                <li key={m.id} className="flex justify-between gap-2">
                  <span>
                    {formatDate(m.createdAt)} · {m.reason}
                    {m.orderNumber ? ` #${m.orderNumber}` : ''}
                  </span>
                  <span className={m.delta < 0 ? 'text-terracotta' : 'text-emerald-700'}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      </div>
      <ProductForm defaults={productDefaults(row, product.collectionIds)} collections={collections.map((c) => ({ id: c.id, title: c.title }))} />
    </>
  );
}
