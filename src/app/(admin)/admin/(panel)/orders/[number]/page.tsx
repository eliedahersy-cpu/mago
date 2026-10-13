import { Gift, Printer } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { OrderNoteForm, OrderStatusActions, PaymentActions } from '@/components/admin/OrderActions';
import { adminButton, Card, LoadingBlock, PageHeader, PaymentBadge, SourceBadge, StatusBadge } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { type AdminOrderItem, getAdminOrder } from '@/lib/data/admin';
import { formatDate, formatPrice } from '@/lib/format';

export async function generateMetadata({ params }: PageProps<'/admin/orders/[number]'>): Promise<Metadata> {
  const { number } = await params;
  return { title: `Order #${number}` };
}

// An unknown order number is a real 404, so this page may block instead of streaming a shell.
export const instant = false;

export default function OrderPage({ params }: PageProps<'/admin/orders/[number]'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Order params={params} />
    </Suspense>
  );
}

const time = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Beirut' });

function ItemRow({ item, child = false }: { item: AdminOrderItem; child?: boolean }) {
  return (
    <li className={child ? 'flex items-center gap-3 py-1.5 pl-12 text-sm' : 'py-3'}>
      <div className={child ? 'contents' : 'flex items-center gap-3'}>
        {!child ? (
          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream-light ring-1 ring-forest/10">
            {item.image ? <Image src={item.image} alt="" fill sizes="48px" className="object-contain p-0.5 mix-blend-multiply" /> : null}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className={child ? 'text-ink/80' : 'block font-medium text-forest'}>
            {child ? `${item.quantity} × ` : ''}
            {item.name} {item.flavour}
          </span>
          {!child ? (
            <span className="block text-xs text-ink/60">
              {formatPrice(item.unitPrice)} × {item.quantity}
            </span>
          ) : null}
        </span>
        {!child ? <span className="font-semibold tabular-nums">{formatPrice(item.lineTotal)}</span> : null}
      </div>
      {item.children.length ? (
        <ul className="mt-1">
          {item.children.map((c) => (
            <ItemRow key={c.id} item={c} child />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

async function Order({ params }: { params: PageProps<'/admin/orders/[number]'>['params'] }) {
  const { number: raw } = await params;
  await requireStaff(`/admin/orders/${encodeURIComponent(raw)}`);
  if (!/^\d{1,12}$/.test(raw)) notFound();
  const order = await getAdminOrder(Number(raw));
  if (!order) notFound();
  const a = order.address;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/orders', label: 'Orders' }}
        title={
          <span className="flex flex-wrap items-center gap-2">
            Order #{order.number} <StatusBadge status={order.status} /> <PaymentBadge status={order.paymentStatus} /> <SourceBadge source={order.source} />
          </span>
        }
        description={`Placed ${time.format(new Date(order.createdAt))} · Cash on delivery`}
        actions={
          <Link href={`/admin/orders/${order.number}/packing-slip`} className={adminButton.secondary}>
            <Printer size={16} aria-hidden /> Packing slip
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card title="Items">
            <ul className="divide-y divide-forest/5">
              {order.items.map((i) => (
                <ItemRow key={i.id} item={i} />
              ))}
            </ul>
            <dl className="mt-3 space-y-1 border-t border-forest/10 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink/70">Subtotal</dt>
                <dd className="tabular-nums">{formatPrice(order.subtotal)}</dd>
              </div>
              {order.discountTotal > 0 ? (
                <div className="flex justify-between text-emerald-700">
                  <dt>Discounts{order.discountCode ? ` (${order.discountCode})` : ''}</dt>
                  <dd className="tabular-nums">−{formatPrice(order.discountTotal)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-ink/70">Delivery</dt>
                <dd className="tabular-nums">{order.shippingTotal ? formatPrice(order.shippingTotal) : 'Free'}</dd>
              </div>
              <div className="flex justify-between border-t border-forest/10 pt-2 text-base font-bold text-forest">
                <dt>Total to collect</dt>
                <dd className="tabular-nums">{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Update status">
            <OrderStatusActions orderId={order.id} status={order.status} />
          </Card>

          <Card title="Timeline">
            <OrderNoteForm orderId={order.id} />
            <ol className="mt-4 space-y-3 border-l-2 border-forest/10 pl-4">
              {order.events.map((e) => (
                <li key={e.id} className="relative text-sm">
                  <span aria-hidden className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-forest" />
                  <p className="text-ink/90">{e.message}</p>
                  <p className="text-xs text-ink/55">
                    {time.format(new Date(e.createdAt))}
                    {e.by ? ` · ${e.by}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Customer">
            <p className="font-medium text-forest">{a.full_name || order.name}</p>
            <p className="text-sm">
              <a href={`mailto:${order.email}`} className="text-forest underline-offset-4 hover:underline">
                {order.email}
              </a>
            </p>
            <p className="text-sm">
              <a href={`tel:${order.phone.replace(/\s/g, '')}`} className="text-forest underline-offset-4 hover:underline">
                {order.phone}
              </a>
            </p>
            {order.customerId ? (
              <Link href={`/admin/customers/${order.customerId}`} className="mt-2 inline-block text-sm font-semibold text-forest hover:underline">
                View customer
              </Link>
            ) : null}
          </Card>
          <Card title="Delivery address">
            <address className="text-sm leading-relaxed not-italic">
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
          </Card>
          {order.specialInstructions || order.isGift ? (
            <Card title="Notes from the customer">
              {order.specialInstructions ? <p className="text-sm">{order.specialInstructions}</p> : null}
              {order.isGift ? (
                <p className="mt-2 flex items-start gap-2 text-sm">
                  <Gift size={16} className="mt-0.5 shrink-0 text-terracotta" aria-hidden />
                  <span>
                    Gift{order.giftNote ? `: “${order.giftNote}”` : ''}
                  </span>
                </p>
              ) : null}
            </Card>
          ) : null}
          <Card title="Payment">
            <p className="mb-3 text-sm text-ink/70">
              Collect <strong className="text-forest">{formatPrice(order.total)}</strong> in cash on delivery.
            </p>
            <PaymentActions orderId={order.id} payment={order.paymentStatus} />
          </Card>
          <p className="text-xs text-ink/55">Order created {formatDate(order.createdAt)}.</p>
        </div>
      </div>
    </>
  );
}
