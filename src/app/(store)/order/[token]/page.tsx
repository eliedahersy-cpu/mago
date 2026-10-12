import { ArrowRight, Banknote, Gift, MapPin, NotebookPen } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { SunMark } from '@/components/brand/Decor';
import { OrderLines, TotalsList } from '@/components/checkout/OrderLines';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { getOrderByToken } from '@/lib/data/orders';
import { formatPrice } from '@/lib/format';

// Each order is personal and found by its token at request time.
export const instant = false;

export const metadata: Metadata = {
  title: 'Your order',
  robots: { index: false, follow: false },
};

const STATUS: Record<string, string> = {
  pending: 'Order received',
  confirmed: 'Confirmed',
  preparing: 'Being prepared',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-forest">
        {icon} {title}
      </h2>
      <div className="mt-2 text-sm text-ink/80">{children}</div>
    </section>
  );
}

export default async function OrderPage({ params }: PageProps<'/order/[token]'>) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const firstName = order.fullName.split(' ')[0];
  const a = order.address;
  const cancelled = order.status === 'cancelled';

  return (
    <Container className="py-10 md:py-14">
      <div className="text-center">
        <SunMark className="mx-auto w-20" />
        <h1 className="mt-2 font-display text-4xl leading-none font-bold text-forest uppercase md:text-6xl">
          {cancelled ? 'Order cancelled' : `Thank you${firstName ? `, ${firstName}` : ''}!`}
        </h1>
        <p className="mt-3 text-lg text-ink/80">
          Order <strong className="text-forest">#MAGO-{order.number}</strong>{' '}
          <span className="ml-1 rounded-full bg-sun/30 px-3 py-0.5 text-sm font-semibold text-forest">{STATUS[order.status] ?? order.status}</span>
        </p>
        {!cancelled ? (
          <p className="mx-auto mt-2 max-w-xl text-ink/70">
            We&apos;ll call you on {order.phone} to arrange delivery. Pay {formatPrice(order.total)} in cash when your order arrives.
          </p>
        ) : null}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
        <section data-testid="order-lines" className="rounded-3xl bg-cream-light p-5 shadow-md ring-1 ring-forest/5 md:p-6">
          <h2 className="font-display text-2xl leading-none font-bold text-forest">Your order</h2>
          <div className="mt-3">
            <OrderLines
              lines={order.items.map((item, i) => ({
                key: String(i),
                name: item.name,
                flavour: item.flavour,
                image: item.image,
                quantity: item.quantity,
                lineTotal: item.lineTotal,
                children: item.children,
              }))}
            />
          </div>
          <div className="mt-3 border-t border-forest/10 pt-3">
            <TotalsList
              subtotal={order.subtotal}
              discounts={
                order.discountTotal > 0
                  ? [{ label: order.discountCode ? `Discounts (${order.discountCode})` : 'Discounts', amount: order.discountTotal }]
                  : []
              }
              shipping={order.shippingTotal}
              total={order.total}
              totalTestId="order-total"
            />
          </div>
        </section>

        <div className="space-y-4">
          <Card icon={<MapPin size={18} aria-hidden />} title="Delivery">
            <p className="font-semibold text-forest">{order.fullName}</p>
            <p>
              {[a.street, a.building && `Building ${a.building}`, a.floor && `Floor ${a.floor}`].filter(Boolean).join(', ')}
            </p>
            <p>
              {a.area}, {a.governorate}
            </p>
            {a.notes ? <p className="mt-1 text-ink/65">{a.notes}</p> : null}
            <p className="mt-2">{order.phone}</p>
            <p>{order.email}</p>
          </Card>
          {order.instructions ? (
            <Card icon={<NotebookPen size={18} aria-hidden />} title="Delivery instructions">
              <p>{order.instructions}</p>
            </Card>
          ) : null}
          {order.isGift || order.giftNote ? (
            <Card icon={<Gift size={18} aria-hidden />} title="Gift note">
              <p>{order.giftNote ?? 'Packed as a gift.'}</p>
            </Card>
          ) : null}
          <Card icon={<Banknote size={18} aria-hidden />} title="Payment">
            <p>Cash on delivery{order.paymentStatus === 'paid' ? ' (paid)' : ''}</p>
          </Card>
          <p className="text-center text-xs text-ink/60">Keep this page&apos;s link to check on your order.</p>
        </div>
      </div>

      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/shop">
          Continue shopping <ArrowRight size={18} aria-hidden />
        </ButtonLink>
        <ButtonLink href="/mix-box" variant="outline">
          Build another box
        </ButtonLink>
      </div>
    </Container>
  );
}
