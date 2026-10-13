'use client';

import { Play } from 'lucide-react';
import { runDueSubscriptions, savePlan, staffSubscriptionAction } from '@/app/actions/admin/subscriptions';
import type { AdminPlan } from '@/lib/data/admin';
import { ActionForm, SubmitButton } from './ActionForm';
import { adminInput } from './ui';

export function RunDueButton() {
  return (
    <ActionForm action={() => runDueSubscriptions()} className="flex flex-col items-end">
      <SubmitButton variant="secondary" pendingLabel="Running…" confirm="Create orders now for subscriptions due in the next 2 days?">
        <Play size={14} aria-hidden /> Run due subscriptions now
      </SubmitButton>
    </ActionForm>
  );
}

export function SubscriptionStaffActions({ id, status }: { id: string; status: string }) {
  if (status === 'cancelled') return <p className="text-sm text-ink/65">Cancelled subscriptions are final.</p>;
  return (
    <ActionForm action={staffSubscriptionAction} className="flex flex-wrap gap-2">
      <input type="hidden" name="subscriptionId" value={id} />
      {status === 'active' ? (
        <>
          <SubmitButton name="action" value="skip" variant="secondary" pendingLabel="…">
            Skip next delivery
          </SubmitButton>
          <SubmitButton name="action" value="pause" variant="secondary" pendingLabel="…">
            Pause
          </SubmitButton>
        </>
      ) : (
        <SubmitButton name="action" value="resume" pendingLabel="…">
          Resume
        </SubmitButton>
      )}
      <SubmitButton name="action" value="cancel" variant="danger" pendingLabel="…" confirm="Cancel this subscription? The customer will get no more boxes.">
        Cancel subscription
      </SubmitButton>
    </ActionForm>
  );
}

/** One plan row, edited in place (or a blank row to add one). */
export function PlanRow({ plan }: { plan: AdminPlan | null }) {
  const p = plan;
  return (
    <ActionForm action={savePlan} resetOnSuccess={!p} className="grid grid-cols-2 items-end gap-2 rounded-2xl bg-white p-3 ring-1 ring-forest/10 sm:grid-cols-[2fr_1fr_1fr_auto_auto_1fr_auto]">
      {p ? <input type="hidden" name="id" value={p.id} /> : null}
      <label className="col-span-2 text-xs text-ink/60 sm:col-span-1">
        Name
        <input name="name" defaultValue={p?.name ?? ''} required placeholder="Every 3 weeks" className={`${adminInput} mt-0.5`} />
      </label>
      <label className="text-xs text-ink/60">
        Every (weeks)
        <input name="intervalWeeks" inputMode="numeric" defaultValue={p?.intervalWeeks ?? ''} required className={`${adminInput} mt-0.5`} />
      </label>
      <label className="text-xs text-ink/60">
        Discount %
        <input name="discountPercent" inputMode="decimal" defaultValue={p?.discountPercent ?? ''} required className={`${adminInput} mt-0.5`} />
      </label>
      <label className="flex items-center gap-1.5 pb-2 text-sm">
        <input type="checkbox" name="isPopular" defaultChecked={p?.isPopular ?? false} className="size-4 accent-forest" /> Popular
      </label>
      <label className="flex items-center gap-1.5 pb-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} className="size-4 accent-forest" /> Offered
      </label>
      <label className="text-xs text-ink/60">
        Order
        <input name="sortOrder" inputMode="numeric" defaultValue={p?.sortOrder ?? 0} className={`${adminInput} mt-0.5`} />
      </label>
      <SubmitButton pendingLabel="…">{p ? 'Save' : 'Add plan'}</SubmitButton>
    </ActionForm>
  );
}
