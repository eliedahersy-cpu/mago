import { Download } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BarList, KpiCard, RangePicker, SalesChart } from '@/components/admin/Charts';
import { adminButton, Card, LoadingBlock, PageHeader, TableWrap, td, th } from '@/components/admin/ui';
import { SOURCE_LABEL, STATUS_LABEL, type OrderSource, type OrderStatus } from '@/lib/admin/orders';
import { percentChange, rangeFromParam } from '@/lib/admin/stats';
import { requireStaff } from '@/lib/auth/dal';
import { getAdminStats } from '@/lib/data/admin';
import { formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Analytics' };

const beirutDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut', year: 'numeric', month: '2-digit', day: '2-digit' });

export default function AnalyticsPage({ searchParams }: PageProps<'/admin/analytics'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Analytics searchParams={searchParams} />
    </Suspense>
  );
}

async function Analytics({ searchParams }: { searchParams: PageProps<'/admin/analytics'>['searchParams'] }) {
  await requireStaff('/admin/analytics');
  const range = rangeFromParam((await searchParams).range);
  const stats = await getAdminStats(range.from, range.to);
  // The export takes calendar days; `to` is exclusive, so the last day is the one before it.
  const exportHref = `/admin/orders/export?from=${beirutDay.format(range.from)}&to=${beirutDay.format(new Date(range.to.getTime() - 1))}`;
  const cupsSold = stats.topProducts.reduce((n, p) => n + p.quantity, 0);

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`${range.label} · cancelled orders are left out`}
        actions={
          <>
            <RangePicker active={range.key} basePath="/admin/analytics" />
            <a href={exportHref} className={adminButton.secondary}>
              <Download size={16} aria-hidden /> Export orders
            </a>
          </>
        }
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Total sales" value={formatPrice(stats.sales)} change={percentChange(stats.sales, stats.previous.sales)} />
        <KpiCard label="Orders" value={String(stats.orders)} change={percentChange(stats.orders, stats.previous.orders)} />
        <KpiCard label="Average order" value={formatPrice(stats.aov)} change={percentChange(stats.aov, stats.previous.aov)} />
        <KpiCard label="New customers" value={String(stats.newCustomers)} change={percentChange(stats.newCustomers, stats.previous.newCustomers)} />
      </div>

      <Card title="Sales by day" className="mt-4">
        <SalesChart daily={stats.daily} />
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card title="By collection">
          <BarList rows={stats.byCollection.map((c) => ({ label: c.title, value: c.sales, hint: `${c.quantity} sold` }))} format={formatPrice} />
        </Card>
        <Card title="By channel">
          <BarList
            rows={stats.bySource.map((s) => ({ label: SOURCE_LABEL[s.source as OrderSource] ?? s.source, value: s.sales, hint: `${s.orders} orders` }))}
            format={formatPrice}
          />
        </Card>
        <Card title="Orders by status">
          <BarList rows={stats.byStatus.map((s) => ({ label: STATUS_LABEL[s.status as OrderStatus] ?? s.status, value: s.orders }))} />
        </Card>
      </div>

      <section className="mt-4">
        <h2 className="mb-2 font-display text-base font-bold text-forest">Best sellers {cupsSold ? <span className="font-sans text-sm font-normal text-ink/60">(cups in Mix Boxes count too)</span> : null}</h2>
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Product</th>
              <th className={`${th} text-right`}>Units</th>
              <th className={`${th} text-right`}>Sales</th>
            </tr>
          </thead>
          <tbody>
            {stats.topProducts.length ? (
              stats.topProducts.map((p) => (
                <tr key={`${p.name}-${p.flavour}`}>
                  <td className={td}>
                    <span className="font-medium text-forest">{p.name}</span> <span className="text-ink/70">{p.flavour}</span>
                  </td>
                  <td className={`${td} text-right tabular-nums`}>{p.quantity}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatPrice(p.sales)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td className={td} colSpan={3}>
                  No sales in this period yet.
                </td>
              </tr>
            )}
          </tbody>
        </TableWrap>
      </section>
    </>
  );
}
