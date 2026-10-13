import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { adminButton, EmptyState, LoadingBlock, PageHeader, Pill, TableWrap, td, th } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { type AdminDiscount, listDiscounts } from '@/lib/data/admin';
import { formatDate, formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Discounts' };

export default function DiscountsPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Discounts />
    </Suspense>
  );
}

function describe(d: AdminDiscount): string {
  const amount = d.kind === 'percentage' ? `${d.value}% off` : d.kind === 'fixed_amount' ? `${formatPrice(d.value)} off` : 'Free delivery';
  const target = d.kind === 'free_shipping' ? '' : d.appliesTo === 'cups' ? ' cups' : ' the order';
  const when = d.minCupQuantity ? ` with ${d.minCupQuantity}+ cups` : d.minSubtotal ? ` over ${formatPrice(d.minSubtotal)}` : '';
  return `${amount}${target}${when}`;
}

function state(d: AdminDiscount): { label: string; tone: 'good' | 'warn' | 'neutral' } {
  const now = Date.now();
  if (!d.isActive) return { label: 'Off', tone: 'neutral' };
  if (d.endsAt && new Date(d.endsAt).getTime() <= now) return { label: 'Ended', tone: 'neutral' };
  if (d.startsAt && new Date(d.startsAt).getTime() > now) return { label: 'Scheduled', tone: 'warn' };
  if (d.usageLimit !== null && d.usageCount >= d.usageLimit) return { label: 'Used up', tone: 'neutral' };
  return { label: 'Active', tone: 'good' };
}

async function Discounts() {
  await requireStaff('/admin/discounts');
  const discounts = await listDiscounts();
  return (
    <>
      <PageHeader
        title="Discounts"
        description="Codes customers type at checkout, and automatic cup deals."
        actions={
          <Link href="/admin/discounts/new" className={adminButton.primary}>
            <Plus size={16} aria-hidden /> Add discount
          </Link>
        }
      />
      {discounts.length ? (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Discount</th>
              <th className={th}>What it does</th>
              <th className={th}>Status</th>
              <th className={th}>Used</th>
              <th className={th}>Ends</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map((d) => {
              const s = state(d);
              return (
                <tr key={d.id} className="hover:bg-cream-light/50">
                  <td className={td}>
                    <Link href={`/admin/discounts/${d.id}`} className="font-semibold text-forest hover:underline">
                      {d.code ?? d.title}
                    </Link>
                    <span className="block text-xs text-ink/60">{d.code ? d.title : 'Automatic'}</span>
                  </td>
                  <td className={td}>{describe(d)}</td>
                  <td className={td}>
                    <Pill tone={s.tone}>{s.label}</Pill>
                  </td>
                  <td className={`${td} tabular-nums`}>
                    {d.usageCount}
                    {d.usageLimit !== null ? ` / ${d.usageLimit}` : ''}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{d.endsAt ? formatDate(d.endsAt) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="No discounts yet" />
      )}
    </>
  );
}
