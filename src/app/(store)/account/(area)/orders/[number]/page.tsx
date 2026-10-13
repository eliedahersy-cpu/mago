import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { OrderDetails } from '@/components/checkout/OrderDetails';
import { requireUser } from '@/lib/auth/dal';
import { orderStatusLabel } from '@/lib/checkout/status';
import { getMyOrder } from '@/lib/data/account';
import { formatDate } from '@/lib/format';

// The order number is URL data (like /order/[token]); this page may wait for it on the server.
export const instant = false;

export const metadata: Metadata = {
  title: 'Order details',
  robots: { index: false },
};

export default function AccountOrderPage({ params }: PageProps<'/account/orders/[number]'>) {
  return (
    <>
      <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
        <ArrowLeft size={16} aria-hidden /> All orders
      </Link>
      <Suspense fallback={<p className="py-16 text-center text-ink/70">Loading the order…</p>}>
        <Order params={params} />
      </Suspense>
    </>
  );
}

async function Order({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params;
  await requireUser(`/account/orders/${encodeURIComponent(number)}`);
  // RLS returns only this customer's orders, so someone else's number is simply not found.
  const order = /^\d{1,9}$/.test(number) ? await getMyOrder(Number(number)) : null;
  if (!order) notFound();

  return (
    <>
      <header className="mt-4 mb-6">
        <h1 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-5xl">Order #MAGO-{order.number}</h1>
        <p className="mt-2 text-ink/70">
          Placed {formatDate(order.createdAt)}{' '}
          <span className="ml-1 rounded-full bg-sun/30 px-3 py-0.5 text-sm font-semibold text-forest">{orderStatusLabel(order.status)}</span>
        </p>
      </header>
      <OrderDetails order={order} />
    </>
  );
}
