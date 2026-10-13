import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { CustomerNotesForm } from '@/components/admin/CustomerNotesForm';
import { AdminOrdersTable } from '@/components/admin/OrdersTable';
import { Card, EmptyState, LoadingBlock, PageHeader, Pill } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { getAdminCustomer, listCustomerSubscriptions } from '@/lib/data/admin';
import { formatDate, formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Customer' };

export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function CustomerPage({ params }: PageProps<'/admin/customers/[id]'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Customer params={params} />
    </Suspense>
  );
}

async function Customer({ params }: { params: PageProps<'/admin/customers/[id]'>['params'] }) {
  const { id } = await params;
  await requireStaff(`/admin/customers/${encodeURIComponent(id)}`);
  if (!UUID.test(id)) notFound();
  const [c, subs] = await Promise.all([getAdminCustomer(id), listCustomerSubscriptions(id)]);
  if (!c) notFound();
  const live = c.orders.filter((o) => o.status !== 'cancelled');
  const spent = live.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <PageHeader
        back={{ href: '/admin/customers', label: 'Customers' }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {c.fullName || c.email} {c.hasAccount ? <Pill tone="good">Account</Pill> : <Pill>Guest</Pill>}
          </span>
        }
        description={`Customer since ${formatDate(c.createdAt)}`}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Orders', String(live.length)],
              ['Total spent', formatPrice(spent)],
              ['Average order', formatPrice(live.length ? spent / live.length : 0)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white p-3 ring-1 ring-forest/10">
                <p className="text-xs text-ink/60">{label}</p>
                <p className="font-display text-xl font-bold text-forest tabular-nums">{value}</p>
              </div>
            ))}
          </div>
          {subs.length ? (
            <Card title="Subscriptions">
              <ul className="divide-y divide-forest/5 text-sm">
                {subs.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                    <Link href={`/admin/subscriptions/${s.id}`} className="font-medium text-forest hover:underline">
                      {s.plan}
                    </Link>
                    <span className="text-ink/70">{s.status === 'active' ? `Next box ${formatDate(`${s.nextDeliveryDate}T12:00:00Z`)}` : s.status}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <section>
            <h2 className="mb-2 font-display text-base font-bold text-forest">Orders</h2>
            {c.orders.length ? <AdminOrdersTable orders={c.orders} /> : <EmptyState title="No orders yet" />}
          </section>
        </div>
        <div className="space-y-4">
          <Card title="Contact">
            <p className="text-sm">
              <a href={`mailto:${c.email}`} className="text-forest hover:underline">
                {c.email}
              </a>
            </p>
            {c.phone ? (
              <p className="text-sm">
                <a href={`tel:${c.phone.replace(/\s/g, '')}`} className="text-forest hover:underline">
                  {c.phone}
                </a>
              </p>
            ) : null}
            <p className="mt-2 text-xs text-ink/60">{c.acceptsMarketing ? 'Agreed to marketing emails.' : 'Has not agreed to marketing emails.'}</p>
          </Card>
          <Card title="Addresses">
            {c.addresses.length ? (
              <ul className="space-y-3 text-sm">
                {c.addresses.map((a, i) => (
                  <li key={i}>
                    {[a.street, a.building && `Bldg ${a.building}`, a.floor && `Floor ${a.floor}`].filter(Boolean).join(', ')}
                    <br />
                    {[a.area, a.governorate].filter(Boolean).join(', ')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink/60">No saved addresses. Each order keeps its own delivery address.</p>
            )}
          </Card>
          <Card title="Notes & tags">
            <CustomerNotesForm customerId={c.id} notes={c.notes ?? ''} tags={c.tags.join(', ')} />
          </Card>
        </div>
      </div>
    </>
  );
}
