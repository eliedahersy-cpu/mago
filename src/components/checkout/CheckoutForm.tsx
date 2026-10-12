'use client';

import { ArrowRight, Banknote, Gift, Lock, ShoppingBag, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { placeOrder, quoteCart } from '@/app/actions/checkout';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useCart } from '@/lib/cart/store';
import { toItemsPayload } from '@/lib/checkout/payload';
import { blockingIssues, codeIssue, type Quote } from '@/lib/checkout/quote';
import { checkoutSchema, fieldErrors, type CheckoutInput } from '@/lib/checkout/schema';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { OrderLines, TotalsList } from './OrderLines';

const inputClass =
  'mt-1.5 w-full rounded-2xl border border-forest/15 bg-white px-4 py-3 text-sm text-ink focus:border-forest focus:outline-none aria-[invalid=true]:border-terracotta';

function Field({ id, label, optional, error, children }: { id: string; label: string; optional?: boolean; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-forest">
        {label}
        {optional ? <span className="font-normal text-ink/60"> (optional)</span> : null}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-terracotta">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
      <h2 className="font-display text-xl font-bold text-forest">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function CheckoutForm({ deliveryAreas }: { deliveryAreas: string[] }) {
  const router = useRouter();
  const hydrated = useCart((s) => s.hydrated);
  const lines = useCart((s) => s.lines);
  const orderNotes = useCart((s) => s.orderNotes);
  const openCart = useCart((s) => s.open);
  const items = useMemo(() => toItemsPayload(lines), [lines]);

  const [code, setCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [placing, startPlacing] = useTransition();
  // One key per visit, made on the first submit: a double click or a retry after a lost
  // response returns the same order.
  const idempotencyKey = useRef<string | null>(null);

  // Server-truth totals, refreshed whenever the cart or the applied code changes.
  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    let cancelled = false;
    quoteCart(items, code)
      .then((q) => {
        if (cancelled) return;
        const issue = code ? codeIssue(q) : null;
        if (issue) {
          // The code stopped applying (e.g. the cart changed): drop it and say why.
          setCode('');
          setCodeMessage(issue.message);
          return;
        }
        setQuote(q);
        setQuoteError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setQuoteError(e instanceof Error ? e.message : 'We could not price your cart.');
      });
    return () => {
      cancelled = true;
    };
  }, [hydrated, items, code]);

  if (!hydrated) return <p className="py-16 text-center text-ink/70">Loading your cart…</p>;
  if (placed) return <p className="py-16 text-center font-display text-xl text-forest">Placing your order…</p>;

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <ShoppingBag size={40} className="mx-auto text-forest/40" aria-hidden />
        <p className="mt-4 font-display text-2xl font-bold text-forest">Your cart is empty</p>
        <p className="mt-2 text-ink/70">Add some cups or build a Mix Box to check out.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/shop">Shop cups</ButtonLink>
          <ButtonLink href="/mix-box" variant="outline">
            Build a Mix Box
          </ButtonLink>
        </div>
      </div>
    );
  }

  const blocking = quote ? blockingIssues(quote) : [];
  const canPlace = quote !== null && blocking.length === 0 && !placing;

  async function applyCode() {
    const next = codeInput.trim();
    setCodeMessage(null);
    if (!next) return;
    try {
      const q = await quoteCart(items, next);
      const issue = codeIssue(q);
      if (issue) {
        setCodeMessage(issue.message);
        return;
      }
      setQuote(q);
      setCode(next);
      setCodeInput('');
    } catch (e) {
      setCodeMessage(e instanceof Error ? e.message : 'We could not check that code.');
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    const text = (name: string) => String(fd.get(name) ?? '');
    const form: CheckoutInput = {
      fullName: text('fullName'),
      email: text('email'),
      phone: text('phone'),
      governorate: text('governorate'),
      area: text('area'),
      street: text('street'),
      building: text('building'),
      floor: text('floor'),
      addressNotes: text('addressNotes'),
      instructions: text('instructions'),
      isGift: fd.get('isGift') === 'on',
      giftNote: text('giftNote'),
      acceptsMarketing: fd.get('acceptsMarketing') === 'on',
      code,
    };
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const found = fieldErrors(parsed.error);
      setErrors(found);
      setFormError('Please check the highlighted fields.');
      document.getElementById(Object.keys(found)[0] ?? '')?.focus();
      return;
    }
    setErrors({});
    setFormError(null);
    idempotencyKey.current ??= crypto.randomUUID();
    const key = idempotencyKey.current;
    startPlacing(async () => {
      const result = await placeOrder({ form, items, idempotencyKey: key });
      if (result.ok) {
        setPlaced(true);
        useCart.getState().clear();
        router.replace(`/order/${result.token}`);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      // Stock may have changed: show the latest availability.
      quoteCart(items, code).then(setQuote, () => undefined);
    });
  }

  const err = (name: string) => errors[name];
  const aria = (name: string) => ({ 'aria-invalid': err(name) ? true : undefined, 'aria-describedby': err(name) ? `${name}-error` : undefined });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
      <form id="checkout-form" noValidate onSubmit={onSubmit} className="space-y-6">
        <Section title="Contact">
          <Field id="fullName" label="Full name" error={err('fullName')}>
            <input id="fullName" name="fullName" autoComplete="name" required className={inputClass} {...aria('fullName')} />
          </Field>
          <Field id="phone" label="Phone" error={err('phone')}>
            <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+961 70 123 456" required className={inputClass} {...aria('phone')} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="email" label="Email" error={err('email')}>
              <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} {...aria('email')} />
            </Field>
          </div>
        </Section>

        <Section title="Delivery address">
          <Field id="governorate" label="Governorate" error={err('governorate')}>
            {deliveryAreas.length > 0 ? (
              <select id="governorate" name="governorate" defaultValue="" required className={inputClass} {...aria('governorate')}>
                <option value="" disabled>
                  Choose…
                </option>
                {deliveryAreas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
            ) : (
              <input id="governorate" name="governorate" required className={inputClass} {...aria('governorate')} />
            )}
          </Field>
          <Field id="area" label="Area" error={err('area')}>
            <input id="area" name="area" autoComplete="address-level2" placeholder="e.g. Hamra" required className={inputClass} {...aria('area')} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="street" label="Street" error={err('street')}>
              <input id="street" name="street" autoComplete="address-line1" required className={inputClass} {...aria('street')} />
            </Field>
          </div>
          <Field id="building" label="Building" optional error={err('building')}>
            <input id="building" name="building" className={inputClass} {...aria('building')} />
          </Field>
          <Field id="floor" label="Floor" optional error={err('floor')}>
            <input id="floor" name="floor" className={inputClass} {...aria('floor')} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="addressNotes" label="Address notes" optional error={err('addressNotes')}>
              <input id="addressNotes" name="addressNotes" placeholder="Landmark, entrance, etc." className={inputClass} {...aria('addressNotes')} />
            </Field>
          </div>
        </Section>

        <Section title="Notes">
          <div className="sm:col-span-2">
            <Field id="instructions" label="Delivery instructions" optional error={err('instructions')}>
              <textarea
                id="instructions"
                name="instructions"
                rows={2}
                maxLength={500}
                defaultValue={orderNotes.instructions}
                placeholder="e.g. leave at front door, ring bell, etc."
                className={cn(inputClass, 'resize-none')}
                {...aria('instructions')}
              />
            </Field>
          </div>
          <div className="rounded-2xl bg-leaf/10 p-4 ring-1 ring-leaf/20 sm:col-span-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-forest">
              <input type="checkbox" name="isGift" defaultChecked={orderNotes.isGift || orderNotes.giftNote !== ''} className="size-4 accent-forest" />
              <Gift size={16} aria-hidden /> This is a gift
            </label>
            <Field id="giftNote" label="Gift note" optional error={err('giftNote')}>
              <textarea
                id="giftNote"
                name="giftNote"
                rows={2}
                maxLength={200}
                defaultValue={orderNotes.giftNote}
                placeholder="Write a short note to include with your order…"
                className={cn(inputClass, 'resize-none')}
                {...aria('giftNote')}
              />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink/80 sm:col-span-2">
            <input type="checkbox" name="acceptsMarketing" className="size-4 accent-forest" />
            Send me new flavours, recipes and offers
          </label>
        </Section>

        <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
          <h2 className="font-display text-xl font-bold text-forest">Payment</h2>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-forest bg-white p-4">
            <Banknote size={26} className="text-forest" aria-hidden />
            <div>
              <p className="font-semibold text-forest">Cash on delivery</p>
              <p className="text-sm text-ink/70">Pay in cash when your order arrives. No card needed.</p>
            </div>
          </div>
        </section>
      </form>

      <aside data-testid="checkout-summary" className="space-y-4 rounded-3xl bg-cream-light p-5 shadow-md ring-1 ring-forest/5 md:p-6 lg:sticky lg:top-28">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl leading-none font-bold text-forest">Order summary</h2>
          <button type="button" onClick={openCart} className="text-sm font-semibold text-forest underline underline-offset-4">
            Edit cart
          </button>
        </div>

        {quote ? (
          <OrderLines
            lines={quote.lines.map((l, i) => ({
              key: `${l.productId}-${i}`,
              name: l.name,
              flavour: l.flavour,
              image: l.image,
              quantity: l.quantity,
              lineTotal: l.lineTotal,
              children: l.children,
            }))}
          />
        ) : (
          <p className="py-6 text-center text-sm text-ink/60" role="status">
            {quoteError ?? 'Calculating your total…'}
          </p>
        )}

        {blocking.length > 0 ? (
          <div role="alert" className="rounded-2xl bg-terracotta/10 p-4 text-sm text-terracotta">
            <p className="font-semibold">Please update your cart:</p>
            <ul className="mt-1 list-disc pl-5">
              {blocking.map((issue, i) => (
                <li key={i}>{issue.message}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div>
          <label htmlFor="discount-code" className="text-sm font-semibold text-forest">
            Discount code
          </label>
          {code ? (
            <p className="mt-1.5 flex items-center justify-between rounded-2xl bg-leaf/10 px-4 py-2 text-sm font-semibold text-leaf">
              {code.toUpperCase()} applied
              <button type="button" aria-label="Remove discount code" onClick={() => setCode('')} className="rounded-full p-1 hover:bg-leaf/20">
                <X size={16} aria-hidden />
              </button>
            </p>
          ) : (
            <div className="mt-1.5 flex gap-2">
              <input
                id="discount-code"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void applyCode();
                  }
                }}
                className="w-full rounded-full border border-forest/15 bg-white px-4 py-2 text-sm uppercase focus:border-forest focus:outline-none"
              />
              <Button variant="outline" size="sm" className="h-10" onClick={() => void applyCode()}>
                Apply
              </Button>
            </div>
          )}
          {codeMessage ? (
            <p className="mt-1 text-sm text-terracotta" role="status">
              {codeMessage}
            </p>
          ) : null}
        </div>

        {quote ? (
          <TotalsList
            subtotal={quote.subtotal}
            discounts={[
              ...(quote.automaticDiscount ? [{ label: quote.automaticDiscount.title, amount: quote.automaticDiscount.amount }] : []),
              ...(quote.codeDiscount && quote.codeDiscount.amount > 0
                ? [{ label: `${quote.codeDiscount.title} (${quote.codeDiscount.code})`, amount: quote.codeDiscount.amount }]
                : []),
            ]}
            shipping={quote.shippingTotal}
            total={quote.total}
            totalTestId="checkout-total"
          />
        ) : null}

        {formError ? (
          <p role="alert" className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
            {formError}
          </p>
        ) : null}

        <Button type="submit" form="checkout-form" size="lg" className="w-full" disabled={!canPlace}>
          {placing ? 'Placing order…' : 'Place order'} <ArrowRight size={18} aria-hidden />
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink/60">
          <Lock size={12} aria-hidden /> {quote ? `You'll pay ${formatPrice(quote.total)} in cash on delivery.` : 'Cash on delivery.'}
        </p>
      </aside>
    </div>
  );
}
