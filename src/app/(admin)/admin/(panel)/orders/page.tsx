import { Download, Plus, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { AdminOrdersTable } from '@/components/admin/OrdersTable';
import { adminButton, adminInput, EmptyState, LoadingBlock, PageHeader, Pagination } from '@/components/admin/ui';
import {
  ORDER_SOURCES,
  ORDER_STATUSES,
  orderFiltersQuery,
  ORDERS_PAGE_SIZE,
  PAYMENT_LABEL,
  PAYMENT_STATUSES,
  parseOrderFilters,
  SOURCE_LABEL,
  STATUS_LABEL,
} from '@/lib/admin/orders';
import { requireStaff } from '@/lib/auth/dal';
import { listOrders } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Orders' };

export default function OrdersPage({ searchParams }: PageProps<'/admin/orders'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

const select = `${adminInput} w-auto pr-8`;

async function Orders({ searchParams }: { searchParams: PageProps<'/admin/orders'>['searchParams'] }) {
  await requireStaff('/admin/orders');
  const filters = parseOrderFilters(await searchParams);
  const { rows, total } = await listOrders(filters);
  const filtering = Boolean(filters.q || filters.status || filters.payment || filters.source || filters.from || filters.to);

  return (
    <>
      <PageHeader
        title="Orders"
        description={`${total} ${total === 1 ? 'order' : 'orders'}${filtering ? ' match these filters' : ''}`}
        actions={
          <>
            <a href={`/admin/orders/export${orderFiltersQuery(filters, {})}`} className={adminButton.secondary}>
              <Download size={16} aria-hidden /> Export CSV
            </a>
            <Link href="/admin/orders/new" className={adminButton.primary}>
              <Plus size={16} aria-hidden /> New order
            </Link>
          </>
        }
      />

      <form method="get" className="mb-4 grid gap-2 rounded-2xl bg-white p-3 ring-1 ring-forest/10 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
        <label className="relative block">
          <span className="sr-only">Search orders</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/40" aria-hidden />
          <input name="q" defaultValue={filters.q} placeholder="Order number, name, phone or email" className={`${adminInput} pl-9`} type="search" />
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <label className="text-xs text-ink/60">
            <span className="sr-only">Status</span>
            <select name="status" defaultValue={filters.status ?? ''} className={select} aria-label="Status">
              <option value="">Any status</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <select name="payment" defaultValue={filters.payment ?? ''} className={select} aria-label="Payment">
            <option value="">Any payment</option>
            {PAYMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {PAYMENT_LABEL[s]}
              </option>
            ))}
          </select>
          <select name="source" defaultValue={filters.source ?? ''} className={select} aria-label="Channel">
            <option value="">Any channel</option>
            {ORDER_SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_LABEL[s]}
              </option>
            ))}
          </select>
          <label className="flex flex-col text-xs text-ink/60">
            From
            <input type="date" name="from" defaultValue={filters.from ?? ''} className={`${adminInput} w-auto`} />
          </label>
          <label className="flex flex-col text-xs text-ink/60">
            To
            <input type="date" name="to" defaultValue={filters.to ?? ''} className={`${adminInput} w-auto`} />
          </label>
          <button type="submit" className={adminButton.primary}>
            Filter
          </button>
          {filtering ? (
            <Link href="/admin/orders" className={adminButton.secondary}>
              Clear
            </Link>
          ) : null}
        </div>
      </form>

      {rows.length ? (
        <AdminOrdersTable orders={rows} />
      ) : (
        <EmptyState title={filtering ? 'No orders match' : 'No orders yet'}>
          {filtering ? 'Try a different search or clear the filters.' : 'Orders from the website and the ones you add here will show up in this list.'}
        </EmptyState>
      )}
      <Pagination page={filters.page} pageSize={ORDERS_PAGE_SIZE} total={total} href={(page) => `/admin/orders${orderFiltersQuery(filters, { page })}`} />
    </>
  );
}
