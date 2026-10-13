import { Settings2 } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { RunDueButton } from '@/components/admin/SubscriptionAdmin';
import { adminButton, EmptyState, LoadingBlock, PageHeader, Pill, TableWrap, td, th } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminSubscriptions } from '@/lib/data/admin';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Subscriptions' };

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
] as const;

const date = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });

export default function SubscriptionsAdminPage({ searchParams }: PageProps<'/admin/subscriptions'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Subscriptions searchParams={searchParams} />
    </Suspense>
  );
}

async function Subscriptions({ searchParams }: { searchParams: PageProps<'/admin/subscriptions'>['searchParams'] }) {
  await requireStaff('/admin/subscriptions');
  const raw = (await searchParams).status;
  const status = TABS.find((t) => t.key === (Array.isArray(raw) ? raw[0] : raw))?.key ?? 'active';
  const rows = await listAdminSubscriptions(status === 'all' ? null : status);

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Boxes on repeat. Each morning at 06:00 an order is created for every box due in the next 2 days."
        actions={
          <>
            <Link href="/admin/subscriptions/plans" className={adminButton.secondary}>
              <Settings2 size={16} aria-hidden /> Plans
            </Link>
            <RunDueButton />
          </>
        }
      />
      <nav aria-label="Subscription status" className="mb-4 flex gap-1 rounded-xl bg-white p-1 ring-1 ring-forest/10 sm:w-fit">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/subscriptions?status=${t.key}`}
            aria-current={t.key === status ? 'page' : undefined}
            className={cn('flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium', t.key === status ? 'bg-forest text-cream-light' : 'text-forest hover:bg-cream-light')}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      {rows.length ? (
        <TableWrap>
          <thead>
            <tr>
              <th className={th}>Customer</th>
              <th className={th}>Plan</th>
              <th className={th}>Next box</th>
              <th className={th}>Status</th>
              <th className={th}>Note</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => (
              <tr key={s.id} className="hover:bg-cream-light/50">
                <td className={td}>
                  <Link href={`/admin/subscriptions/${s.id}`} className="font-semibold text-forest hover:underline">
                    {s.customer || s.email}
                  </Link>
                  <span className="block text-xs text-ink/60">{s.email}</span>
                </td>
                <td className={td}>{s.plan}</td>
                <td className={`${td} whitespace-nowrap`}>{s.status === 'active' ? date.format(new Date(`${s.nextDeliveryDate}T00:00:00Z`)) : '—'}</td>
                <td className={td}>
                  <Pill tone={s.status === 'active' ? 'good' : s.status === 'paused' ? 'warn' : 'neutral'}>{s.status[0].toUpperCase() + s.status.slice(1)}</Pill>
                </td>
                <td className={`${td} text-xs text-terracotta`}>{s.lastRunNote ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      ) : (
        <EmptyState title="No subscriptions here">Customers subscribe from the Subscribe &amp; Save page.</EmptyState>
      )}
    </>
  );
}
