import { AlertTriangle, Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { KpiCard, RangePicker, SalesChart } from '@/components/admin/Charts';
import { AdminOrdersTable } from '@/components/admin/OrdersTable';
import { adminButton, Card, EmptyState, LoadingBlock, PageHeader } from '@/components/admin/ui';
import { percentChange, rangeFromParam } from '@/lib/admin/stats';
import { requireStaff } from '@/lib/auth/dal';
import { getAdminStats, getRecentOrders } from '@/lib/data/admin';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Home' };

export default function AdminHomePage({ searchParams }: PageProps<'/admin'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: PageProps<'/admin'>['searchParams'] }) {
  const staff = await requireStaff('/admin');
  const sp = await searchParams;
  const range = rangeFromParam(sp.range);
  const [stats, recent] = await Promise.all([getAdminStats(range.from, range.to), getRecentOrders(6)]);
  const first = (staff.fullName ?? '').split(' ')[0];

  return (
    <>
      <PageHeader
        title={first ? `Welcome back, ${first}` : 'Welcome back'}
        description={`${range.label} · Lebanon time`}
        actions={
          <>
            <RangePicker active={range.key} basePath="/admin" />
            <Link href="/admin/orders/new" className={adminButton.primary}>
              <Plus size={16} aria-hidden /> New order
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total sales" value={formatPrice(stats.sales)} change={percentChange(stats.sales, stats.previous.sales)} />
        <KpiCard label="Orders" value={String(stats.orders)} change={percentChange(stats.orders, stats.previous.orders)} />
        <KpiCard label="Average order" value={formatPrice(stats.aov)} change={percentChange(stats.aov, stats.previous.aov)} />
        <KpiCard label="New customers" value={String(stats.newCustomers)} change={percentChange(stats.newCustomers, stats.previous.newCustomers)} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <Card title="Sales" actions={<Link href={`/admin/analytics?range=${range.key}`} className="text-sm font-semibold text-forest hover:underline">Analytics</Link>}>
          <SalesChart daily={stats.daily} />
        </Card>
        <Card title="Top products">
          {stats.topProducts.length ? (
            <ol className="space-y-2">
              {stats.topProducts.map((p, i) => (
                <li key={`${p.name}-${p.flavour}`} className="flex items-center gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cream-dark text-xs font-bold text-forest">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-forest">{p.flavour ?? p.name}</span>
                    <span className="block text-xs text-ink/60">{p.name}</span>
                  </span>
                  <span className="text-right tabular-nums">
                    <span className="block font-semibold">{p.quantity} sold</span>
                    <span className="block text-xs text-ink/60">{formatPrice(p.sales)}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink/60">No sales in this period yet.</p>
          )}
        </Card>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-bold text-forest">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-forest hover:underline">
              All orders
            </Link>
          </div>
          {recent.length ? <AdminOrdersTable orders={recent} showSource={false} /> : <EmptyState title="No orders yet">New orders appear here as soon as they are placed.</EmptyState>}
        </section>
        <Card
          title={
            <span className="inline-flex items-center gap-2">
              <AlertTriangle size={16} className="text-saffron" aria-hidden /> Low stock
            </span>
          }
          actions={<Link href="/admin/inventory?low=1" className="text-sm font-semibold text-forest hover:underline">Inventory</Link>}
        >
          {stats.lowStock.length ? (
            <ul className="divide-y divide-forest/5">
              {stats.lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-forest">{p.flavour ?? p.name}</span>
                    <span className="block text-xs text-ink/60">{p.name}</span>
                  </span>
                  <span className={p.stock <= 0 ? 'font-semibold text-terracotta' : 'font-semibold text-[#7a4b00]'}>{p.stock} left</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/60">Everything is well stocked.</p>
          )}
        </Card>
      </div>
    </>
  );
}
