import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { AdminOrdersTable } from '@/components/admin/OrdersTable';
import { SubscriptionStaffActions } from '@/components/admin/SubscriptionAdmin';
import { Card, EmptyState, LoadingBlock, PageHeader, Pill } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { getAdminSubscription, listAdminProducts } from '@/lib/data/admin';
import { formatDate } from '@/lib/format';

export const metadata: Metadata = { title: 'Subscription' };

export const instant = false;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const longDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });

export default function SubscriptionAdminPage({ params }: PageProps<'/admin/subscriptions/[id]'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Subscription params={params} />
    </Suspense>
  );
}

async function Subscription({ params }: { params: PageProps<'/admin/subscriptions/[id]'>['params'] }) {
  const { id } = await params;
  await requireStaff(`/admin/subscriptions/${encodeURIComponent(id)}`);
  if (!UUID.test(id)) notFound();
  const [s, products] = await Promise.all([getAdminSubscription(id), listAdminProducts()]);
  if (!s) notFound();
  const byId = new Map(products.map((p) => [p.id, p]));
  const a = s.address;
  const line = (productId: string, quantity: number) => {
    const p = byId.get(productId);
    return (
      <li key={productId} className="flex items-center gap-3 py-1.5 text-sm">
        <span className="relative size-10 shrink-0 rounded-lg bg-cream-light">{p?.image ? <Image src={p.image} alt="" fill sizes="40px" className="object-contain p-0.5 mix-blend-multiply" /> : null}</span>
        <span className="min-w-0 flex-1">
          {p ? (
            <>
              <span className="font-medium text-forest">{p.name}</span> {p.flavour}
              {p.status !== 'active' ? <span className="ml-1 text-xs text-terracotta">({p.status})</span> : null}
            </>
          ) : (
            <span className="text-terracotta">Removed product</span>
          )}
        </span>
        <span className="font-semibold">× {quantity}</span>
      </li>
    );
  };

  return (
    <>
      <PageHeader
        back={{ href: '/admin/subscriptions', label: 'Subscriptions' }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            {s.customer.fullName || s.customer.email} <Pill tone={s.status === 'active' ? 'good' : s.status === 'paused' ? 'warn' : 'neutral'}>{s.status[0].toUpperCase() + s.status.slice(1)}</Pill>
          </span>
        }
        description={`${s.plan.name} · save ${s.plan.discountPercent}% · since ${formatDate(s.createdAt)}`}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card title="Box">
            <ul className="divide-y divide-forest/5">{s.items.cups.map((c) => line(c.productId, c.quantity))}</ul>
            {s.items.extras.length ? (
              <>
                <p className="mt-3 text-xs font-semibold tracking-wide text-ink/60 uppercase">Extras</p>
                <ul className="divide-y divide-forest/5">{s.items.extras.map((x) => line(x.productId, x.quantity))}</ul>
              </>
            ) : null}
          </Card>
          <Card title="Manage">
            {s.status === 'active' ? <p className="mb-3 text-sm">Next box: <strong className="text-forest">{longDate.format(new Date(`${s.nextDeliveryDate}T00:00:00Z`))}</strong></p> : null}
            {s.lastRunNote ? <p className="mb-3 rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta">{s.lastRunNote}</p> : null}
            <SubscriptionStaffActions id={s.id} status={s.status} />
          </Card>
          <section>
            <h2 className="mb-2 font-display text-base font-bold text-forest">Orders from this subscription</h2>
            {s.orders.length ? <AdminOrdersTable orders={s.orders} showSource={false} /> : <EmptyState title="No orders yet">The first order is created 2 days before the first delivery.</EmptyState>}
          </section>
        </div>
        <div className="space-y-4">
          <Card title="Customer">
            <p className="font-medium text-forest">{s.customer.fullName ?? '—'}</p>
            <p className="text-sm">{s.customer.email}</p>
            {s.customer.phone ? <p className="text-sm">{s.customer.phone}</p> : null}
            <Link href={`/admin/customers/${s.customerId}`} className="mt-2 inline-block text-sm font-semibold text-forest hover:underline">
              View customer
            </Link>
          </Card>
          <Card title="Deliver to">
            <address className="text-sm leading-relaxed not-italic">
              {a.full_name} · {a.phone}
              <br />
              {[a.street, a.building && `Bldg ${a.building}`, a.floor && `Floor ${a.floor}`].filter(Boolean).join(', ')}
              <br />
              {[a.area, a.governorate].filter(Boolean).join(', ')}
              {a.notes ? (
                <>
                  <br />
                  <span className="text-ink/70">{a.notes}</span>
                </>
              ) : null}
            </address>
            {s.isGift ? <p className="mt-2 text-sm">Gift{s.giftNote ? `: “${s.giftNote}”` : ''}</p> : null}
          </Card>
        </div>
      </div>
    </>
  );
}
