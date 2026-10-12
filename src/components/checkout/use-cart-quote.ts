'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { quoteCart } from '@/app/actions/checkout';
import { useCart } from '@/lib/cart/store';
import { toItemsPayload } from '@/lib/checkout/payload';
import { codeIssue, type Quote } from '@/lib/checkout/quote';

/**
 * Server-truth totals for the current cart (quote_cart), shared by the cart page and checkout.
 * Re-quotes shortly after the cart or the applied code changes; a code that stops applying is
 * dropped with its reason.
 */
export function useCartQuote() {
  const hydrated = useCart((s) => s.hydrated);
  const lines = useCart((s) => s.lines);
  const code = useCart((s) => s.discountCode);
  const setCode = useCart((s) => s.setDiscountCode);
  const items = useMemo(() => toItemsPayload(lines), [lines]);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [codeMessage, setCodeMessage] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (!hydrated || items.length === 0) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      quoteCart(items, code)
        .then((q) => {
          if (cancelled) return;
          const issue = code ? codeIssue(q) : null;
          if (issue) {
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
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [hydrated, items, code, setCode, version]);

  const applyCode = useCallback(
    async (input: string) => {
      const next = input.trim();
      setCodeMessage(null);
      if (!next) return false;
      try {
        const q = await quoteCart(items, next);
        const issue = codeIssue(q);
        if (issue) {
          setCodeMessage(issue.message);
          return false;
        }
        setQuote(q);
        setCode(next);
        return true;
      } catch (e) {
        setCodeMessage(e instanceof Error ? e.message : 'We could not check that code.');
        return false;
      }
    },
    [items, setCode],
  );

  const removeCode = useCallback(() => {
    setCode('');
    setCodeMessage(null);
  }, [setCode]);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  return { hydrated, lines, items, quote: items.length > 0 ? quote : null, quoteError, code, codeMessage, applyCode, removeCode, refresh };
}
