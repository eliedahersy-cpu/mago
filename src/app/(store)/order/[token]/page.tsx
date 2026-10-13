import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SunMark } from '@/components/brand/Decor';
import { OrderDetails } from '@/components/checkout/OrderDetails';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { orderStatusLabel } from '@/lib/checkout/status';
import { getOrderByToken } from '@/lib/data/orders';
import { formatPrice } from '@/lib/format';

// Each order is personal and found by its token at request time.
export const instant = false;

export const metadata: Metadata = {
  title: 'Your order',
  robots: { index: false, follow: false },
};

export default async function OrderPage({ params }: PageProps<'/order/[token]'>) {
  const { token } = await params;
  const order = await getOrderByToken(token);
  if (!order) notFound();

  const firstName = order.fullName.split(' ')[0];
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
          <span className="ml-1 rounded-full bg-sun/30 px-3 py-0.5 text-sm font-semibold text-forest">{orderStatusLabel(order.status)}</span>
        </p>
        {!cancelled ? (
          <p className="mx-auto mt-2 max-w-xl text-ink/70">
            We&apos;ll call you on {order.phone} to arrange delivery. Pay {formatPrice(order.total)} in cash when your order arrives.
          </p>
        ) : null}
      </div>

      <div className="mt-10">
        <OrderDetails order={order} footnote={<p className="text-center text-xs text-ink/60">Keep this page&apos;s link to check on your order.</p>} />
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
