'use client';

import { CalendarClock, Minus, Pencil, Plus } from 'lucide-react';
import Image from 'next/image';
import { startTransition, useActionState, useState, useTransition, type FormEvent } from 'react';
import { manageSubscription, updateSubscriptionItems } from '@/app/actions/subscriptions';
import { Button } from '@/components/ui/Button';
import { inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import type { MySubscription } from '@/lib/data/subscriptions';
import { setQty } from '@/lib/subscriptions/draft';

export interface CardProduct {
  id: string;
  name: string;
  flavour: string | null;
  image: string | null;
}

const longDate = (iso: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

const STATUS: Record<MySubscription['status'], { label: string; tone: string }> = {
  active: { label: 'Active', tone: 'bg-leaf/15 text-leaf' },
  paused: { label: 'Paused', tone: 'bg-sun/30 text-[#7a4b00]' },
  cancelled: { label: 'Cancelled', tone: 'bg-ink/10 text-ink/70' },
};

function CupEditor({ sub, cups, boxSize, onDone }: { sub: MySubscription; cups: CardProduct[]; boxSize: number; onDone: () => void }) {
  const [box, setBox] = useState<Record<string, number>>(() => Object.fromEntries(sub.items.cups.map((c) => [c.product_id, c.quantity])));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const count = Object.values(box).reduce((n, q) => n + q, 0);

  function save() {
    start(async () => {
      const r = await updateSubscriptionItems(sub.id, {
        cups: Object.entries(box).map(([product_id, quantity]) => ({ product_id, quantity })),
        extras: sub.items.extras,
      });
      if (r.ok) onDone();
      else setMessage(r.error);
    });
  }

  return (
    <div className="mt-4 rounded-2xl bg-cream p-3">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cups.map((c) => {
          const q = box[c.id] ?? 0;
          const label = [c.name, c.flavour].filter(Boolean).join(' ');
          return (
            <li key={c.id} className={cn('flex items-center gap-2 rounded-xl bg-cream-light p-2 ring-1', q ? 'ring-forest' : 'ring-forest/10')}>
              <span className="relative size-10 shrink-0">{c.image ? <Image src={c.image} alt="" fill sizes="40px" className="object-contain mix-blend-multiply" /> : null}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-semibold text-forest">{c.flavour ?? c.name}</span>
              <span className="flex items-center gap-1">
                <button type="button" aria-label={`One less ${label}`} disabled={!q} onClick={() => setBox((b) => setQty(b, c.id, q - 1, boxSize))} className="grid size-6 place-items-center rounded-full ring-1 ring-forest/20 disabled:opacity-40">
                  <Minus size={12} aria-hidden />
                </button>
                <output className="w-4 text-center text-xs font-semibold">{q}</output>
                <button type="button" aria-label={`One more ${label}`} disabled={count >= boxSize} onClick={() => setBox((b) => setQty(b, c.id, q + 1, boxSize))} className="grid size-6 place-items-center rounded-full bg-forest text-cream-light disabled:opacity-40">
                  <Plus size={12} aria-hidden />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="text-sm text-ink/75" aria-live="polite">
          {count}/{boxSize} cups
        </span>
        <Button size="sm" onClick={save} disabled={pending || count !== boxSize}>
          {pending ? 'Saving…' : 'Save cups'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Close
        </Button>
        {message ? (
          <p role="alert" className="text-sm text-terracotta">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function SubscriptionCard({
  sub,
  products,
  cupChoices,
  plans,
  boxSize,
}: {
  sub: MySubscription;
  /** Every cup and extra, for names and pictures. */
  products: Record<string, CardProduct>;
  /** Cups that can go in the box. */
  cupChoices: CardProduct[];
  plans: { id: string; name: string; discountPercent: number }[];
  boxSize: number;
}) {
  const [state, dispatch, pending] = useActionState(manageSubscription, null);
  const [editing, setEditing] = useState(false);
  const status = STATUS[sub.status];
  const live = sub.status !== 'cancelled';

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.value === 'cancel' && !window.confirm('Cancel this subscription? This cannot be undone.')) return;
    const fd = new FormData(e.currentTarget, submitter instanceof HTMLButtonElement ? submitter : null);
    startTransition(() => dispatch(fd));
  }

  return (
    <article className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-forest">{sub.planName}</h2>
          <p className="text-sm text-ink/70">
            {boxSize} cups · save {sub.discountPercent}% · cash on delivery
          </p>
        </div>
        <span className={cn('rounded-full px-3 py-1 text-sm font-semibold', status.tone)}>{status.label}</span>
      </div>
      {sub.status === 'active' ? (
        <p className="mt-3 flex items-center gap-2 font-semibold text-forest">
          <CalendarClock size={18} aria-hidden /> Next box: {longDate(sub.nextDeliveryDate)}
        </p>
      ) : null}

      <ul className="mt-4 flex flex-wrap gap-2">
        {sub.items.cups.map((c) => {
          const p = products[c.product_id];
          return (
            <li key={c.product_id} className="flex items-center gap-2 rounded-xl bg-cream px-2 py-1.5 text-sm">
              <span className="relative size-9 shrink-0">{p?.image ? <Image src={p.image} alt="" fill sizes="36px" className="object-contain mix-blend-multiply" /> : null}</span>
              <span>
                {c.quantity} × {p ? (p.flavour ?? p.name) : 'No longer available'}
              </span>
            </li>
          );
        })}
      </ul>
      {sub.items.extras.length ? <p className="mt-2 text-sm text-ink/70">Extras: {sub.items.extras.map((x) => `${x.quantity} × ${products[x.product_id]?.name ?? 'item'}`).join(', ')}</p> : null}
      <p className="mt-2 text-sm text-ink/70">
        To {sub.address.full_name}, {[sub.address.street, sub.address.area, sub.address.governorate].filter(Boolean).join(', ')}
      </p>

      {live ? (
        <>
          {editing ? (
            <CupEditor sub={sub} cups={cupChoices} boxSize={boxSize} onDone={() => setEditing(false)} />
          ) : (
            <button type="button" onClick={() => setEditing(true)} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
              <Pencil size={14} aria-hidden /> Change cups
            </button>
          )}
          <form onSubmit={onSubmit} className="mt-4 flex flex-wrap items-center gap-2 border-t border-forest/10 pt-4">
            <input type="hidden" name="subscriptionId" value={sub.id} />
            {sub.status === 'active' ? (
              <>
                <Button type="submit" name="action" value="skip" size="sm" variant="outline" disabled={pending}>
                  Skip next box
                </Button>
                <Button type="submit" name="action" value="pause" size="sm" variant="outline" disabled={pending}>
                  Pause
                </Button>
              </>
            ) : (
              <Button type="submit" name="action" value="resume" size="sm" disabled={pending}>
                Resume
              </Button>
            )}
            <label className="flex items-center gap-2 text-sm">
              <span className="sr-only">Delivery plan</span>
              <select name="planId" defaultValue={sub.planId} className={`${inputClass} mt-0 py-1.5`}>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (save {p.discountPercent}%)
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" name="action" value="change_plan" size="sm" variant="ghost" disabled={pending}>
              Change plan
            </Button>
            <Button type="submit" name="action" value="cancel" size="sm" variant="ghost" className="ml-auto text-terracotta" disabled={pending}>
              Cancel subscription
            </Button>
          </form>
          {state ? (
            <p role="status" className={cn('mt-2 text-sm', state.ok ? 'text-leaf' : 'text-terracotta')}>
              {state.ok ? state.message : state.error}
            </p>
          ) : null}
        </>
      ) : null}
    </article>
  );
}
