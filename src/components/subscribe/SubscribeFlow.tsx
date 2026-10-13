'use client';

import { ArrowLeft, ArrowRight, Check, Gift, Minus, Pencil, Plus, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { createSubscription, quoteSubscription, type SubscriptionQuote } from '@/app/actions/subscriptions';
import { SunMark } from '@/components/brand/Decor';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { canContinue, cupCount, type DraftAddress, setQty, STEPS, toItems } from '@/lib/subscriptions/draft';
import { useHydratedDraft, useSubscriptionDraft } from '@/lib/subscriptions/store';
import { useAuthStatus } from '@/lib/wishlist/use-wishlist';

export interface FlowProduct {
  id: string;
  name: string;
  flavour: string | null;
  image: string | null;
  price: number;
  description: string | null;
}

export interface FlowPlan {
  id: string;
  name: string;
  intervalWeeks: number;
  discountPercent: number;
  isPopular: boolean;
}

const TITLES = ['Choose your plan', 'Pick your cups', 'Delivery details', 'Review your box'];

function Stepper({ step, done, onGo }: { step: number; done: (s: number) => boolean; onGo: (s: number) => void }) {
  return (
    <ol className="mx-auto mt-5 flex max-w-md items-start" aria-label="Steps">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const reachable = n === 1 || done(n - 1);
        const current = n === step;
        const complete = n < step && done(n);
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center">
            {i > 0 ? <span aria-hidden className={cn('absolute top-[17px] right-1/2 h-0.5 w-full', done(n - 1) ? 'bg-forest/70' : 'bg-saffron/60')} /> : null}
            <button
              type="button"
              disabled={!reachable || current}
              onClick={() => onGo(n)}
              aria-current={current ? 'step' : undefined}
              className={cn(
                'relative grid size-9 place-items-center rounded-full border-2 font-display text-sm font-bold transition',
                current || complete ? 'border-forest bg-forest text-cream-light' : 'border-saffron/80 bg-cream-light text-forest',
                current && 'ring-4 ring-forest/15',
              )}
            >
              {complete ? <Check size={16} strokeWidth={3} aria-hidden /> : n}
              <span className="sr-only">: {label}</span>
            </button>
            <span className="mt-1.5 text-xs font-medium text-forest">{label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function Stepper2({ value, onChange, max, label }: { value: number; onChange: (n: number) => void; max: boolean; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onChange(value - 1)} disabled={value === 0} aria-label={`One less ${label}`} className="grid size-8 place-items-center rounded-full ring-1 ring-forest/20 disabled:opacity-40">
        <Minus size={14} aria-hidden />
      </button>
      <output aria-label={`${label} quantity`} className="w-6 text-center font-semibold tabular-nums">
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={max} aria-label={`One more ${label}`} className="grid size-8 place-items-center rounded-full bg-forest text-cream-light disabled:opacity-40">
        <Plus size={14} aria-hidden />
      </button>
    </div>
  );
}

const beirutToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Beirut' }).format(new Date());
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const longDate = (iso: string) => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

export function SubscribeFlow({
  plans,
  cups,
  extras,
  boxSize,
  governorates,
  initialPlanId,
}: {
  plans: FlowPlan[];
  cups: FlowProduct[];
  extras: FlowProduct[];
  boxSize: number;
  governorates: string[];
  initialPlanId: string | null;
}) {
  const hydrated = useHydratedDraft();
  const draft = useSubscriptionDraft((s) => s.draft);
  const update = useSubscriptionDraft((s) => s.update);
  const reset = useSubscriptionDraft((s) => s.reset);
  const signedIn = useAuthStatus((s) => s.signedIn);
  const [quote, setQuote] = useState<SubscriptionQuote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // A plan chosen on /subscribe arrives in the URL.
  useEffect(() => {
    if (hydrated && initialPlanId && plans.some((p) => p.id === initialPlanId) && !useSubscriptionDraft.getState().draft.planId) {
      useSubscriptionDraft.getState().update({ planId: initialPlanId });
    }
  }, [hydrated, initialPlanId, plans]);

  // Plans or products that went away since the draft was saved drop out.
  const live = useMemo(() => {
    const ok = (ids: string[], list: FlowProduct[]) => ids.filter((id) => list.some((p) => p.id === id));
    return {
      planId: draft.planId && plans.some((p) => p.id === draft.planId) ? draft.planId : null,
      cups: Object.fromEntries(ok(Object.keys(draft.cups), cups).map((id) => [id, draft.cups[id]])),
      extras: Object.fromEntries(ok(Object.keys(draft.extras), extras).map((id) => [id, draft.extras[id]])),
    };
  }, [draft, plans, cups, extras]);
  const d = { ...draft, ...live };
  const plan = plans.find((p) => p.id === d.planId) ?? null;
  const count = cupCount(d);
  const step = Math.min(d.step, ([1, 2, 3, 4] as const).find((s) => s === 4 || !canContinue(d, s, boxSize)) ?? 1);
  const itemsKey = JSON.stringify(toItems({ cups: live.cups, extras: live.extras }));
  const items = useMemo(() => JSON.parse(itemsKey) as ReturnType<typeof toItems>, [itemsKey]);

  // Server prices whenever the box is complete.
  useEffect(() => {
    if (!live.planId || count !== boxSize) return;
    let stale = false;
    void quoteSubscription(live.planId, items).then((r) => {
      if (stale) return;
      setQuote(r.ok ? r.quote : null);
    });
    return () => {
      stale = true;
    };
  }, [live.planId, items, count, boxSize]);

  const go = (s: number) => {
    update({ step: s as 1 | 2 | 3 | 4 });
    window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };
  const setAddress = (patch: Partial<DraftAddress>) => update({ address: { ...d.address, ...patch } });

  function subscribe() {
    if (!d.planId) return;
    setError(null);
    startTransition(async () => {
      const r = await createSubscription({
        planId: d.planId!,
        items,
        address: d.address,
        isGift: d.isGift,
        giftNote: d.isGift ? d.giftNote : '',
        startDate: d.startDate,
      });
      if (r.ok) {
        setCreated(d.startDate || addDays(beirutToday(), 2));
        reset();
      } else setError(r.error);
    });
  }

  if (!hydrated) return <p className="py-20 text-center text-ink/70">Loading your box…</p>;
  // The clock is read only in the browser, after the saved draft has loaded.
  const today = beirutToday();
  const firstDate = d.startDate || addDays(today, 2);

  if (created) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <SunMark className="mx-auto w-20" />
        <h1 className="mt-2 font-display text-4xl font-bold text-forest uppercase">You&rsquo;re subscribed!</h1>
        <p className="mt-3 text-ink/80">Your first box is planned for {longDate(created)}. You pay cash on delivery, every time.</p>
        <p className="mt-1 text-sm text-ink/65">Pause, skip or change your cups whenever you like from your account.</p>
        <Link href="/account/subscriptions" className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-forest px-7 font-display text-sm font-semibold tracking-wide text-cream-light uppercase hover:bg-forest-light">
          Manage my subscription <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 pb-28 md:px-6">
      <div className="text-center">
        <h1 className="font-display text-[2.2rem] leading-none font-bold text-forest uppercase md:text-5xl">{step === 2 ? `Pick your ${boxSize} cups` : TITLES[step - 1]}</h1>
        <p className="mt-2 text-ink/75">
          {step === 1 ? 'Same great flavours. More savings.' : step === 2 ? 'Choose the flavours you love. Same or different.' : step === 3 ? 'Where and when should we bring your box?' : 'Almost there! Here’s your subscription.'}
        </p>
        <Stepper step={step} done={(s) => canContinue(d, s, boxSize)} onGo={go} />
      </div>

      {step === 1 ? (
        <fieldset className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
          <legend className="sr-only">Delivery plan</legend>
          {plans.map((p) => {
            const on = d.planId === p.id;
            return (
              <label
                key={p.id}
                className={cn(
                  'relative flex cursor-pointer flex-col items-center rounded-3xl bg-cream-light p-5 text-center shadow-sm ring-2 transition',
                  on ? 'ring-forest' : 'ring-transparent hover:ring-forest/30',
                  p.isPopular && 'pt-8',
                )}
              >
                {p.isPopular ? <span className="absolute -top-3 rounded-full bg-sun px-3 py-1 font-display text-xs font-bold text-forest uppercase">Most popular</span> : null}
                <input type="radio" name="plan" value={p.id} checked={on} onChange={() => update({ planId: p.id })} className="sr-only" />
                <span className="font-display text-xl font-bold text-forest">{p.name}</span>
                <span className="mt-1 text-sm text-ink/70">{boxSize} cups per box</span>
                <span className="mt-3 rounded-full bg-leaf/15 px-3 py-1 text-sm font-semibold text-leaf">Save {p.discountPercent}% on cups</span>
                <span className={cn('mt-4 grid size-6 place-items-center rounded-full border-2', on ? 'border-forest bg-forest text-cream-light' : 'border-forest/30')}>
                  {on ? <Check size={14} strokeWidth={3} aria-hidden /> : null}
                </span>
              </label>
            );
          })}
        </fieldset>
      ) : null}

      {step === 2 ? (
        <div className="mt-8">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cups.map((c) => {
              const q = d.cups[c.id] ?? 0;
              const label = [c.name, c.flavour].filter(Boolean).join(' ');
              return (
                <li key={c.id} className={cn('flex flex-col rounded-2xl bg-cream-light p-3 ring-1', q ? 'ring-2 ring-forest' : 'ring-forest/10')}>
                  <span className="relative aspect-[4/5] w-full">
                    {c.image ? <Image src={c.image} alt="" fill sizes="(min-width: 1024px) 220px, 45vw" className="object-contain mix-blend-multiply" /> : null}
                  </span>
                  <span className="mt-2 font-display text-sm leading-tight font-bold text-forest">
                    {c.name}
                    <span className="block font-sans text-xs font-medium text-ink/75">{c.flavour}</span>
                  </span>
                  <span className="mt-auto flex items-center justify-between gap-2 pt-3">
                    <span className="text-sm font-semibold">{formatPrice(c.price)}</span>
                    <Stepper2 value={q} label={label} max={count >= boxSize} onChange={(n) => update({ cups: setQty(d.cups, c.id, n, boxSize) })} />
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {step === 3 ? (
        <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6" aria-labelledby="deliver-to">
            <h2 id="deliver-to" className="font-display text-xl font-bold text-forest">
              Deliver to
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field id="sub-name" label="Full name">
                <input id="sub-name" autoComplete="name" value={d.address.fullName} onChange={(e) => setAddress({ fullName: e.target.value })} className={inputClass} />
              </Field>
              <Field id="sub-phone" label="Phone" hint="We call before we deliver.">
                <input id="sub-phone" type="tel" autoComplete="tel" placeholder="+961 70 123 456" value={d.address.phone} onChange={(e) => setAddress({ phone: e.target.value })} className={inputClass} />
              </Field>
              <Field id="sub-gov" label="Governorate">
                <select id="sub-gov" value={d.address.governorate} onChange={(e) => setAddress({ governorate: e.target.value })} className={inputClass}>
                  <option value="">Choose…</option>
                  {governorates.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </Field>
              <Field id="sub-area" label="Area">
                <input id="sub-area" value={d.address.area} onChange={(e) => setAddress({ area: e.target.value })} className={inputClass} />
              </Field>
              <Field id="sub-street" label="Street">
                <input id="sub-street" autoComplete="address-line1" value={d.address.street} onChange={(e) => setAddress({ street: e.target.value })} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field id="sub-building" label="Building" optional>
                  <input id="sub-building" value={d.address.building} onChange={(e) => setAddress({ building: e.target.value })} className={inputClass} />
                </Field>
                <Field id="sub-floor" label="Floor" optional>
                  <input id="sub-floor" value={d.address.floor} onChange={(e) => setAddress({ floor: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field id="sub-notes" label="Directions for the driver" optional>
                  <input id="sub-notes" value={d.address.notes} onChange={(e) => setAddress({ notes: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <Field id="sub-date" label="First delivery" hint="Then every time your plan comes round.">
                <input id="sub-date" type="date" min={addDays(today, 1)} max={addDays(today, 60)} value={firstDate} onChange={(e) => update({ startDate: e.target.value })} className={inputClass} />
              </Field>
            </div>
          </section>
          <div className="space-y-6">
            {extras.length ? (
              <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6" aria-labelledby="extras-title">
                <h2 id="extras-title" className="font-display text-xl font-bold text-forest">
                  Add extras <span className="font-sans text-sm font-normal text-ink/60">(optional)</span>
                </h2>
                <ul className="mt-3 divide-y divide-forest/5">
                  {extras.map((x) => (
                    <li key={x.id} className="flex items-center gap-3 py-2">
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-cream">
                        {x.image ? <Image src={x.image} alt="" fill sizes="48px" className="object-contain mix-blend-multiply" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block font-semibold text-forest">{x.name}</span>
                        <span className="text-ink/65">
                          {x.description ? `${x.description} · ` : ''}
                          {formatPrice(x.price)}
                        </span>
                      </span>
                      <Stepper2 value={d.extras[x.id] ?? 0} label={x.name} max={(d.extras[x.id] ?? 0) >= 10} onChange={(n) => update({ extras: setQty(d.extras, x.id, Math.min(n, 10), null) })} />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section className="rounded-3xl bg-[radial-gradient(ellipse_at_80%_50%,#f8d9ae_0%,#f6e3c6_70%)] p-5 md:p-6">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={d.isGift} onChange={(e) => update({ isGift: e.target.checked })} className="mt-1 size-5 accent-forest" />
                <span>
                  <span className="flex items-center gap-2 font-display text-xl font-bold text-forest">
                    <Gift size={20} aria-hidden /> Make it a gift?
                  </span>
                  <span className="text-sm text-ink/75">Send a subscription to someone special. Put their name and address on the left.</span>
                </span>
              </label>
              {d.isGift ? (
                <div className="mt-3">
                  <Field id="sub-gift" label="Gift note" optional>
                    <textarea id="sub-gift" rows={2} maxLength={200} value={d.giftNote} onChange={(e) => update({ giftNote: e.target.value })} className={inputClass} />
                  </Field>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : null}

      {step === 4 && plan ? (
        <div className="mx-auto mt-8 grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6" aria-labelledby="your-cups">
            <div className="flex items-center justify-between">
              <h2 id="your-cups" className="font-display text-xl font-bold text-forest">
                Your cups ({count})
              </h2>
              <button type="button" onClick={() => go(2)} className="inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
                <Pencil size={14} aria-hidden /> Edit
              </button>
            </div>
            <ul className="mt-3 divide-y divide-forest/5">
              {cups
                .filter((c) => d.cups[c.id])
                .map((c) => (
                  <li key={c.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="relative size-12 shrink-0">{c.image ? <Image src={c.image} alt="" fill sizes="48px" className="object-contain mix-blend-multiply" /> : null}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-forest">{c.name}</span>
                      <span className="text-ink/70">{c.flavour}</span>
                    </span>
                    <span className="font-semibold">× {d.cups[c.id]}</span>
                  </li>
                ))}
              {extras
                .filter((x) => d.extras[x.id])
                .map((x) => (
                  <li key={x.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="relative size-12 shrink-0">{x.image ? <Image src={x.image} alt="" fill sizes="48px" className="object-contain mix-blend-multiply" /> : null}</span>
                    <span className="min-w-0 flex-1 font-semibold text-forest">{x.name}</span>
                    <span className="font-semibold">× {d.extras[x.id]}</span>
                  </li>
                ))}
            </ul>
          </section>
          <div className="space-y-4">
            <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-bold text-forest">Delivery</h2>
                <button type="button" onClick={() => go(3)} className="inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
                  <Pencil size={14} aria-hidden /> Edit
                </button>
              </div>
              <p className="mt-2 font-semibold text-forest">
                {plan.name} <span className="ml-1 rounded-full bg-leaf/15 px-2 py-0.5 text-xs text-leaf">Save {plan.discountPercent}%</span>
              </p>
              <p className="mt-1 text-sm text-ink/80">First box: {longDate(firstDate)}</p>
              <p className="mt-1 text-sm text-ink/80">
                {d.address.fullName}, {d.address.phone}
                <br />
                {[d.address.street, d.address.building && `Bldg ${d.address.building}`, d.address.floor && `Floor ${d.address.floor}`].filter(Boolean).join(', ')}, {d.address.area},{' '}
                {d.address.governorate}
              </p>
              {d.isGift ? <p className="mt-1 text-sm text-ink/80">Gift{d.giftNote ? `: “${d.giftNote}”` : ''}</p> : null}
            </section>
            <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6" aria-live="polite">
              <h2 className="font-display text-xl font-bold text-forest">Each box</h2>
              {quote ? (
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-ink/70">Subtotal</dt>
                    <dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between text-leaf">
                    <dt>Subscription discount ({quote.discountPercent}%)</dt>
                    <dd className="tabular-nums">−{formatPrice(quote.discount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/70">Delivery</dt>
                    <dd className="tabular-nums">{quote.shipping ? formatPrice(quote.shipping) : 'Free'}</dd>
                  </div>
                  <div className="flex justify-between border-t border-forest/10 pt-2 text-base font-bold text-forest">
                    <dt>Total, cash on delivery</dt>
                    <dd className="tabular-nums" data-testid="subscription-total">
                      {formatPrice(quote.total)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="mt-2 text-sm text-ink/60">Working out your price…</p>
              )}
              {error ? (
                <p role="alert" className="mt-3 rounded-xl bg-terracotta/10 px-3 py-2 text-sm text-terracotta">
                  {error}
                </p>
              ) : null}
              {signedIn ? (
                <Button size="lg" className="mt-4 w-full" onClick={subscribe} disabled={pending || !quote || quote.errors.length > 0}>
                  {pending ? 'Subscribing…' : 'Subscribe now'} <ArrowRight size={18} aria-hidden />
                </Button>
              ) : (
                <div className="mt-4 space-y-2 text-center">
                  <Link
                    href={`/account/login?next=${encodeURIComponent('/subscribe/build')}`}
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-full bg-forest font-display font-semibold tracking-wide text-cream-light uppercase hover:bg-forest-light"
                  >
                    Sign in to subscribe <ArrowRight size={18} aria-hidden />
                  </Link>
                  <p className="text-sm text-ink/70">
                    New here?{' '}
                    <Link href={`/account/register?next=${encodeURIComponent('/subscribe/build')}`} className="font-semibold text-forest underline underline-offset-4">
                      Create an account
                    </Link>
                    . Your box is saved while you do.
                  </p>
                </div>
              )}
              <p className="mt-3 flex items-start gap-2 text-xs text-ink/60">
                <ShieldCheck size={15} className="shrink-0" aria-hidden /> No payment now. Pause, skip or cancel anytime from your account.
              </p>
            </section>
          </div>
        </div>
      ) : null}

      {step < 4 ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-forest/10 bg-cream-light/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-3">
            {step > 1 ? (
              <button type="button" onClick={() => go(step - 1)} className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-forest hover:bg-forest/10">
                <ArrowLeft size={16} aria-hidden /> Back
              </button>
            ) : null}
            {step === 2 ? (
              <p className="text-sm text-ink/80" aria-live="polite">
                <span className="font-display text-lg font-bold text-forest" data-testid="sub-cup-count">
                  {count}/{boxSize}
                </span>{' '}
                cups selected
              </p>
            ) : null}
            <Button className="ml-auto" onClick={() => go(step + 1)} disabled={!canContinue(d, step, boxSize)}>
              {step === 1 ? 'Continue' : step === 2 ? 'Next: delivery' : 'Next: review'} <ArrowRight size={18} aria-hidden />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
