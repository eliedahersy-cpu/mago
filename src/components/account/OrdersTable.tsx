import { ChevronRight, Package } from 'lucide-react';
import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { orderStatusLabel } from '@/lib/checkout/status';
import type { OrderSummary } from '@/lib/data/account';
import { formatDate, formatPrice } from '@/lib/format';

export function OrdersTable({ orders }: { orders: OrderSummary[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-3xl bg-cream-light p-6 text-center ring-1 ring-forest/5">
        <Package size={32} className="mx-auto text-forest/40" aria-hidden />
        <p className="mt-2 font-display text-lg font-semibold text-forest">No orders yet</p>
        <p className="mt-1 text-sm text-ink/70">Your orders will appear here once you place one.</p>
        <ButtonLink href="/shop" size="sm" className="mt-4">
          Shop cups
        </ButtonLink>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-forest/10 rounded-3xl bg-cream-light px-5 shadow-sm ring-1 ring-forest/5">
      {orders.map((o) => (
        <li key={o.number}>
          <Link href={`/account/orders/${o.number}`} className="flex items-center gap-4 py-4 hover:text-terracotta">
            <div className="min-w-0 flex-1">
              <p className="font-display font-semibold text-forest">#MAGO-{o.number}</p>
              <p className="text-sm text-ink/70">
                {formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
            <span className="hidden rounded-full bg-sun/30 px-3 py-0.5 text-xs font-semibold text-forest sm:inline">{orderStatusLabel(o.status)}</span>
            <span className="font-semibold text-forest tabular-nums">{formatPrice(o.total)}</span>
            <ChevronRight size={18} className="text-ink/40" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
