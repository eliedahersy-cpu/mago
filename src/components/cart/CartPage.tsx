'use client';

import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { DiscountCodeField, EmptyCart, QuoteError, QuoteIssues, QuoteTotals } from '@/components/checkout/QuoteParts';
import { useCartQuote } from '@/components/checkout/use-cart-quote';
import { Button, ButtonLink } from '@/components/ui/Button';
import { useCart } from '@/lib/cart/store';
import { blockingIssues } from '@/lib/checkout/quote';
import { CartLineRow } from './CartLineRow';

export function CartPage() {
  const { hydrated, lines, quote, quoteError, code, codeMessage, applyCode, removeCode, refresh } = useCartQuote();
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);

  if (!hydrated) return <p className="py-16 text-center text-ink/70">Loading your cart…</p>;
  if (lines.length === 0) return <EmptyCart />;

  const blocking = quote ? blockingIssues(quote) : [];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:items-start">
      <section aria-label="Items in your cart" className="rounded-3xl bg-cream-light px-5 py-2 shadow-sm ring-1 ring-forest/5 md:px-6">
        <ul className="divide-y divide-forest/10">
          {lines.map((line) => (
            <CartLineRow key={line.id} line={line} onQuantity={(n) => setQuantity(line.id, n)} onRemove={() => remove(line.id)} />
          ))}
        </ul>
        <div className="border-t border-forest/10 py-4">
          <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
            <ArrowLeft size={16} aria-hidden /> Continue shopping
          </Link>
        </div>
      </section>

      <aside data-testid="cart-summary" className="space-y-4 rounded-3xl bg-cream-light p-5 shadow-md ring-1 ring-forest/5 md:p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-2xl leading-none font-bold text-forest">Order summary</h2>
        <QuoteIssues issues={blocking} />
        <DiscountCodeField code={code} message={codeMessage} onApply={applyCode} onRemove={removeCode} />
        {quoteError ? <QuoteError message={quoteError} onRetry={refresh} /> : null}
        {quote ? (
          <QuoteTotals quote={quote} totalTestId="cart-total" />
        ) : quoteError ? null : (
          <p className="py-4 text-center text-sm text-ink/60" role="status">
            Calculating your total…
          </p>
        )}
        {blocking.length > 0 ? (
          <Button size="lg" className="w-full" disabled>
            Checkout <ArrowRight size={18} aria-hidden />
          </Button>
        ) : (
          <ButtonLink href="/checkout" size="lg" className="w-full">
            Checkout <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        )}
        <p className="text-center text-xs text-ink/60">Cash on delivery. Totals are confirmed at checkout.</p>
      </aside>
    </div>
  );
}
