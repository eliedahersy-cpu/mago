import { Banknote, Gift, MapPin, NotebookPen } from 'lucide-react';
import type { ReactNode } from 'react';
import type { OrderConfirmation } from '@/lib/checkout/quote';
import { OrderLines, TotalsList } from './OrderLines';

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

/** What was ordered, the totals, and where and how it is delivered and paid. */
export function OrderDetails({ order, footnote }: { order: OrderConfirmation; footnote?: ReactNode }) {
  const a = order.address;
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] lg:items-start">
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
          <p>{[a.street, a.building && `Building ${a.building}`, a.floor && `Floor ${a.floor}`].filter(Boolean).join(', ')}</p>
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
        {footnote}
      </div>
    </div>
  );
}
