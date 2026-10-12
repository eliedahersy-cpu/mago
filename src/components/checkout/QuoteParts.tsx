'use client';

import { ShoppingBag, X } from 'lucide-react';
import { useState } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import type { Quote, QuoteIssue } from '@/lib/checkout/quote';
import { TotalsList } from './OrderLines';

export function DiscountCodeField({
  code,
  message,
  onApply,
  onRemove,
}: {
  code: string;
  message: string | null;
  onApply: (code: string) => Promise<boolean>;
  onRemove: () => void;
}) {
  const [input, setInput] = useState('');
  const apply = async () => {
    if (await onApply(input)) setInput('');
  };
  return (
    <div>
      <label htmlFor="discount-code" className="text-sm font-semibold text-forest">
        Discount code
      </label>
      {code ? (
        <p className="mt-1.5 flex items-center justify-between rounded-2xl bg-leaf/10 px-4 py-2 text-sm font-semibold text-leaf">
          {code.toUpperCase()} applied
          <button type="button" aria-label="Remove discount code" onClick={onRemove} className="rounded-full p-1 hover:bg-leaf/20">
            <X size={16} aria-hidden />
          </button>
        </p>
      ) : (
        <div className="mt-1.5 flex gap-2">
          <input
            id="discount-code"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void apply();
              }
            }}
            className="w-full rounded-full border border-forest/15 bg-white px-4 py-2 text-sm uppercase focus:border-forest focus:outline-none"
          />
          <Button variant="outline" size="sm" className="h-10" onClick={() => void apply()}>
            Apply
          </Button>
        </div>
      )}
      {message ? (
        <p className="mt-1 text-sm text-terracotta" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

export function QuoteTotals({ quote, totalTestId }: { quote: Quote; totalTestId: string }) {
  return (
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
      totalTestId={totalTestId}
    />
  );
}

export function QuoteIssues({ issues }: { issues: QuoteIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <div role="alert" className="rounded-2xl bg-terracotta/10 p-4 text-sm text-terracotta">
      <p className="font-semibold">Please update your cart:</p>
      <ul className="mt-1 list-disc pl-5">
        {issues.map((issue, i) => (
          <li key={i}>{issue.message}</li>
        ))}
      </ul>
    </div>
  );
}

export function QuoteError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl bg-terracotta/10 p-4 text-sm text-terracotta">
      <p>{message}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function EmptyCart() {
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
