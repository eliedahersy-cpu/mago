import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { adminButton, adminInput, EmptyState, LoadingBlock, PageHeader, Pagination, Pill, TableWrap, td, th } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { CUSTOMERS_PAGE_SIZE, listCustomers } from '@/lib/data/admin';
import { formatDate, formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Customers' };

export default function CustomersPage({ searchParams }: PageProps<'/admin/customers'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Customers searchParams={searchParams} />
    </Suspense>
  );
}

async function Customers({ searchParams }: { searchParams: PageProps<'/admin/customers'>['searchParams'] }) {
  await requireStaff('/admin/customers');
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  const q = one(sp.q).trim().slice(0, 100);
  const pageNum = Number.parseInt(one(sp.page), 10);
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
  const { rows, total } = await listCustomers(q, page);
  const href = (p: number) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), ...(p > 1 ? { page: String(p) } : {}) })}`;

  return (
    <>
      <PageHeader title="Customers" description={`${total} ${total === 1 ? 'customer' : 'customers'}`} />
      <form method="get" className="mb-4 flex gap-2 rounded-2xl bg-white p-3 ring-1 ring-forest/10">
        <label className="relative flex-1">
          <span className="sr-only">Search customers</span>
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink/40" aria-hidden />
          <input name="q" type="search" defaultValue={q} placeholder="Name, email or phone" className={`${adminInput} pl-9`} />
        </label>
        <button type="submit" className={adminButton.primary}>
          Search
        </button>
      </form>
      {rows.length ? (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Customer</th>
              <th className={th}>Phone</th>
              <th className={th}>Orders</th>
              <th className={th}>Spent</th>
              <th className={th}>Last order</th>
              <th className={th}>Tags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-cream-light/50">
                <td className={td}>
                  <Link href={`/admin/customers/${c.id}`} className="font-semibold text-forest hover:underline">
                    {c.fullName || c.email}
                  </Link>
                  <span className="block text-xs text-ink/60">
                    {c.email} {c.hasAccount ? '· has an account' : ''}
                  </span>
                </td>
                <td className={td}>{c.phone ?? '—'}</td>
                <td className={`${td} tabular-nums`}>{c.orders}</td>
                <td className={`${td} tabular-nums`}>{formatPrice(c.totalSpent)}</td>
                <td className={`${td} whitespace-nowrap`}>{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                <td className={td}>
                  <span className="flex flex-wrap gap-1">
                    {c.tags.map((t) => (
                      <Pill key={t}>{t}</Pill>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title={q ? 'No customers match' : 'No customers yet'}>Customers are added automatically when they place an order.</EmptyState>
      )}
      <Pagination page={page} pageSize={CUSTOMERS_PAGE_SIZE} total={total} href={href} />
    </>
  );
}
