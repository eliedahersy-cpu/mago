import Link from 'next/link';
import type { AdminOrderRow } from '@/lib/data/admin';
import { formatDate, formatPrice } from '@/lib/format';
import { PaymentBadge, SourceBadge, StatusBadge, TableWrap, td, th } from './ui';

export function AdminOrdersTable({ orders, showSource = true }: { orders: AdminOrderRow[]; showSource?: boolean }) {
  return (
    <TableWrap>
      <thead>
        <tr>
          <th className={th}>Order</th>
          <th className={th}>Date</th>
          <th className={th}>Customer</th>
          <th className={th}>Status</th>
          <th className={th}>Payment</th>
          {showSource ? <th className={th}>Channel</th> : null}
          <th className={`${th} text-right`}>Total</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((o) => (
          <tr key={o.id} className="hover:bg-cream-light/50">
            <td className={td}>
              <Link href={`/admin/orders/${o.number}`} className="font-semibold text-forest underline-offset-4 hover:underline">
                #{o.number}
              </Link>
            </td>
            <td className={`${td} whitespace-nowrap text-ink/70`}>{formatDate(o.createdAt)}</td>
            <td className={td}>
              <span className="block font-medium">{o.name || o.email}</span>
              <span className="block text-xs text-ink/60">{o.area || o.phone}</span>
            </td>
            <td className={td}>
              <StatusBadge status={o.status} />
            </td>
            <td className={td}>
              <PaymentBadge status={o.paymentStatus} />
            </td>
            {showSource ? (
              <td className={td}>
                <SourceBadge source={o.source} />
              </td>
            ) : null}
            <td className={`${td} text-right font-semibold tabular-nums`}>{formatPrice(o.total)}</td>
          </tr>
        ))}
      </tbody>
    </TableWrap>
  );
}
