'use client';

import { ArrowRight, Banknote, Gift, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition, type FormEvent, type ReactNode } from 'react';
import { placeOrder, type PlaceOrderResult } from '@/app/actions/checkout';
import { Button } from '@/components/ui/Button';
import { Field, inputClass } from '@/components/ui/Field';
import { useCart } from '@/lib/cart/store';
import { checkoutDefaults, type CheckoutAccount } from '@/lib/checkout/account';
import { forgetOrderKey, orderKeyFor } from '@/lib/checkout/order-key';
import { blockingIssues } from '@/lib/checkout/quote';
import { checkoutSchema, fieldErrors, type CheckoutInput } from '@/lib/checkout/schema';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { safeSessionStorage } from '@/lib/safe-storage';
import { OrderLines } from './OrderLines';
import { DiscountCodeField, EmptyCart, QuoteError, QuoteIssues, QuoteTotals } from './QuoteParts';
import { useCartQuote } from './use-cart-quote';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
      <h2 className="font-display text-xl font-bold text-forest">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function CheckoutForm({ deliveryAreas, account = null }: { deliveryAreas: string[]; account?: CheckoutAccount | null }) {
  const router = useRouter();
  const defaults = checkoutDefaults(account);
  const { hydrated, lines, items, quote, quoteError, code, codeMessage, applyCode, removeCode, refresh } = useCartQuote();
  const orderNotes = useCart((s) => s.orderNotes);
  const openCart = useCart((s) => s.open);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);
  const [placing, startPlacing] = useTransition();

  if (!hydrated) return <p className="py-16 text-center text-ink/70">Loading your cart…</p>;
  if (placed) return <p className="py-16 text-center font-display text-xl text-forest">Placing your order…</p>;

  if (lines.length === 0) return <EmptyCart />;

  const blocking = quote ? blockingIssues(quote) : [];
  const canPlace = quote !== null && blocking.length === 0 && !placing;

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
    if (!quote) return;
    // The same cart keeps its key across retries and reloads, so a lost response never
    // becomes a second order.
    const storage = safeSessionStorage();
    const key = orderKeyFor(JSON.stringify(items), storage, () => crypto.randomUUID());
    const expectedTotal = quote.total;
    const saveAddress = fd.get('saveAddress') === 'on';
    startPlacing(async () => {
      let result: PlaceOrderResult;
      try {
        result = await placeOrder({ form, items, idempotencyKey: key, expectedTotal, saveAddress });
      } catch {
        setFormError("We couldn't confirm your order. Please check your connection and try again. Trying again won't create a second order.");
        return;
      }
      if (result.ok) {
        forgetOrderKey(storage);
        setPlaced(true);
        useCart.getState().clear();
        router.replace(`/order/${result.token}`);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      // Stock may have changed: show the latest availability.
      refresh();
    });
  }

  const err = (name: string) => errors[name];
  const aria = (name: string) => ({ 'aria-invalid': err(name) ? true : undefined, 'aria-describedby': err(name) ? `${name}-error` : undefined });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
      <form id="checkout-form" noValidate onSubmit={onSubmit} className="space-y-6">
        <Section title="Contact">
          {account ? null : (
            <p className="text-sm text-ink/75 sm:col-span-2">
              Have an account?{' '}
              <Link href="/account/login?next=%2Fcheckout" className="font-semibold text-forest underline underline-offset-4">
                Sign in
              </Link>{' '}
              to use your saved details.
            </p>
          )}
          <Field id="fullName" label="Full name" error={err('fullName')}>
            <input id="fullName" name="fullName" autoComplete="name" defaultValue={defaults.fullName} required className={inputClass} {...aria('fullName')} />
          </Field>
          <Field id="phone" label="Phone" error={err('phone')}>
            <input id="phone" name="phone" type="tel" autoComplete="tel" placeholder="+961 70 123 456" defaultValue={defaults.phone} required className={inputClass} {...aria('phone')} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="email" label="Email" error={err('email')} hint={account ? 'Signed in: this order will appear in your account.' : undefined}>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={defaults.email}
                readOnly={account !== null}
                required
                className={cn(inputClass, account && 'bg-cream text-ink/70')}
                {...aria('email')}
              />
            </Field>
          </div>
        </Section>

        <Section title="Delivery address">
          <Field id="governorate" label="Governorate" error={err('governorate')}>
            {deliveryAreas.length > 0 ? (
              <select id="governorate" name="governorate" defaultValue={deliveryAreas.includes(defaults.governorate) ? defaults.governorate : ''} required className={inputClass} {...aria('governorate')}>
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
              <input id="governorate" name="governorate" defaultValue={defaults.governorate} required className={inputClass} {...aria('governorate')} />
            )}
          </Field>
          <Field id="area" label="Area" error={err('area')}>
            <input id="area" name="area" autoComplete="address-level2" placeholder="e.g. Hamra" defaultValue={defaults.area} required className={inputClass} {...aria('area')} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="street" label="Street" error={err('street')}>
              <input id="street" name="street" autoComplete="address-line1" defaultValue={defaults.street} required className={inputClass} {...aria('street')} />
            </Field>
          </div>
          <Field id="building" label="Building" optional error={err('building')}>
            <input id="building" name="building" defaultValue={defaults.building} className={inputClass} {...aria('building')} />
          </Field>
          <Field id="floor" label="Floor" optional error={err('floor')}>
            <input id="floor" name="floor" defaultValue={defaults.floor} className={inputClass} {...aria('floor')} />
          </Field>
          <div className="sm:col-span-2">
            <Field id="addressNotes" label="Address notes" optional error={err('addressNotes')}>
              <input id="addressNotes" name="addressNotes" placeholder="Landmark, entrance, etc." defaultValue={defaults.addressNotes} className={inputClass} {...aria('addressNotes')} />
            </Field>
          </div>
          {account ? (
            <label className="flex items-center gap-2 text-sm text-ink/80 sm:col-span-2">
              <input type="checkbox" name="saveAddress" defaultChecked={account.address === null} className="size-4 accent-forest" />
              Save this address to my account
            </label>
          ) : null}
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
            {quoteError ? '' : 'Calculating your total…'}
          </p>
        )}

        {quoteError ? <QuoteError message={quoteError} onRetry={refresh} /> : null}
        <QuoteIssues issues={blocking} />

        <DiscountCodeField code={code} message={codeMessage} onApply={applyCode} onRemove={removeCode} />

        {quote ? <QuoteTotals quote={quote} totalTestId="checkout-total" /> : null}

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
