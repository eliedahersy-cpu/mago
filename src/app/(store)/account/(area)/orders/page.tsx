import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrdersTable } from '@/components/account/OrdersTable';
import { requireUser } from '@/lib/auth/dal';
import { getMyOrders } from '@/lib/data/account';

export const metadata: Metadata = {
  title: 'Your orders',
  robots: { index: false },
};

export default function OrdersPage() {
  return (
    <>
      <h1 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-5xl">Your orders</h1>
      <div className="mt-6">
        <Suspense fallback={<p className="py-10 text-center text-ink/70">Loading your orders…</p>}>
          <Orders />
        </Suspense>
      </div>
    </>
  );
}

async function Orders() {
  await requireUser('/account/orders');
  return <OrdersTable orders={await getMyOrders()} />;
}
