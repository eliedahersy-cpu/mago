import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PlanRow } from '@/components/admin/SubscriptionAdmin';
import { LoadingBlock, PageHeader } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminPlans } from '@/lib/data/admin';

export const metadata: Metadata = { title: 'Subscription plans' };

export default function PlansPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Plans />
    </Suspense>
  );
}

async function Plans() {
  await requireStaff('/admin/subscriptions/plans');
  const plans = await listAdminPlans();
  return (
    <>
      <PageHeader
        back={{ href: '/admin/subscriptions', label: 'Subscriptions' }}
        title="Subscription plans"
        description="How often boxes go out and the saving on cups. Plans that are not offered stay with existing subscribers."
      />
      <div className="space-y-2">
        {plans.map((p) => (
          <div key={p.id}>
            <PlanRow plan={p} />
            <p className="mt-1 ml-3 text-xs text-ink/55">
              {p.subscribers} {p.subscribers === 1 ? 'subscriber' : 'subscribers'}
            </p>
          </div>
        ))}
        <h2 className="pt-4 font-display text-base font-bold text-forest">Add a plan</h2>
        <PlanRow plan={null} />
      </div>
    </>
  );
}
