import { Plus, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { adminButton, adminInput, EmptyState, LoadingBlock, PageHeader, Pill, TableWrap, td, th } from '@/components/admin/ui';
import { PRODUCT_STATUSES, PRODUCT_TYPES } from '@/lib/admin/product-form';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminProducts } from '@/lib/data/admin';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Products' };

export default function ProductsPage({ searchParams }: PageProps<'/admin/products'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Products searchParams={searchParams} />
    </Suspense>
  );
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

async function Products({ searchParams }: { searchParams: PageProps<'/admin/products'>['searchParams'] }) {
  await requireStaff('/admin/products');
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100);
  const status = (PRODUCT_STATUSES as readonly string[]).includes(one(sp.status)) ? one(sp.status) : null;
  const type = (PRODUCT_TYPES as readonly string[]).includes(one(sp.type)) ? one(sp.type) : null;
  const products = await listAdminProducts({ q, status, type });

  return (
    <>
      <PageHeader
        title="Products"
        description={`${products.length} ${products.length === 1 ? 'product' : 'products'}`}
        actions={
          <Link href="/admin/products/new" className={adminButton.primary}>
            <Plus size={16} aria-hidden /> Add product
          </Link>
        }
      />
      <form method="get" className="mb-4 flex flex-wrap gap-2 rounded-2xl bg-white p-3 ring-1 ring-forest/10">
        <label className="relative min-w-56 flex-1">
          <span className="sr-only">Search products</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/40" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="Name, flavour or SKU" className={`${adminInput} pl-9`} />
        </label>
        <select name="status" defaultValue={status ?? ''} className={`${adminInput} w-auto`} aria-label="Status">
          <option value="">Any status</option>
          {PRODUCT_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={type ?? ''} className={`${adminInput} w-auto`} aria-label="Type">
          <option value="">Any type</option>
          {PRODUCT_TYPES.map((t) => (
            <option key={t} value={t}>
              {t[0].toUpperCase() + t.slice(1)}
            </option>
          ))}
        </select>
        <button type="submit" className={adminButton.primary}>
          Filter
        </button>
      </form>

      {products.length ? (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Product</th>
              <th className={th}>Status</th>
              <th className={th}>Stock</th>
              <th className={th}>Type</th>
              <th className={th}>Collections</th>
              <th className={`${th} text-right`}>Price</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-cream-light/50">
                <td className={td}>
                  <Link href={`/admin/products/${p.id}`} className="flex items-center gap-3">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-cream-light ring-1 ring-forest/10">
                      {p.image ? <Image src={p.image} alt="" fill sizes="44px" className="object-contain p-0.5 mix-blend-multiply" /> : null}
                    </span>
                    <span>
                      <span className="block font-semibold text-forest">{p.name}</span>
                      <span className="block text-xs text-ink/60">{p.flavour}</span>
                    </span>
                  </Link>
                </td>
                <td className={td}>
                  <Pill tone={p.status === 'active' ? 'good' : p.status === 'draft' ? 'warn' : 'neutral'}>{p.status[0].toUpperCase() + p.status.slice(1)}</Pill>
                </td>
                <td className={`${td} tabular-nums`}>
                  {p.trackInventory ? (
                    <span className={p.stock <= 0 ? 'font-semibold text-terracotta' : p.stock <= p.lowStockThreshold ? 'font-semibold text-[#7a4b00]' : ''}>
                      {p.stock} in stock
                    </span>
                  ) : (
                    <span className="text-ink/55">Not tracked</span>
                  )}
                </td>
                <td className={`${td} capitalize`}>{p.type}</td>
                <td className={`${td} text-xs text-ink/70`}>{p.collections.join(', ') || '—'}</td>
                <td className={`${td} text-right tabular-nums`}>{formatPrice(p.price)}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="No products found">Try another search, or add a product.</EmptyState>
      )}
    </>
  );
}
