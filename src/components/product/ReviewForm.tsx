'use client';

import { Star } from 'lucide-react';
import Link from 'next/link';
import { startTransition, useActionState, useState, type FormEvent } from 'react';
import { submitReview } from '@/app/actions/reviews';
import { Button } from '@/components/ui/Button';
import { Field, fieldAria, inputClass } from '@/components/ui/Field';
import { cn } from '@/lib/cn';
import { useAuthStatus } from '@/lib/wishlist/use-wishlist';

const LABELS = ['Not for me', 'Could be better', 'Good', 'Really good', 'Love it'];

/** Signed-in customers rate and review a product; guests are asked to sign in first. */
export function ReviewForm({ productId, productName, returnTo }: { productId: string; productName: string; returnTo: string }) {
  const signedIn = useAuthStatus((s) => s.signedIn);
  const [state, dispatch, pending] = useActionState(submitReview, null);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  if (!signedIn) {
    return (
      <p className="rounded-2xl bg-cream p-4 text-sm text-ink/80">
        Tried it?{' '}
        <Link href={`/account/login?next=${encodeURIComponent(returnTo)}`} className="font-semibold text-forest underline underline-offset-4">
          Sign in
        </Link>{' '}
        to write a review.
      </p>
    );
  }

  if (state?.ok) {
    return (
      <p role="status" className="rounded-2xl bg-leaf/10 p-4 text-sm font-medium text-forest">
        {state.message}
      </p>
    );
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    // Submitted by hand so a refused review keeps what was written.
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  }

  const shown = hover || rating;
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-2xl bg-cream p-4 md:p-5">
      <h3 className="font-display text-lg font-bold text-forest">Review {productName}</h3>
      <input type="hidden" name="productId" value={productId} />
      <fieldset>
        <legend className="text-sm font-semibold text-forest">Your rating</legend>
        <div className="mt-1.5 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="peer sr-only" />
              <span className="sr-only">
                {n} {n === 1 ? 'star' : 'stars'}: {LABELS[n - 1]}
              </span>
              <Star
                size={28}
                aria-hidden
                strokeWidth={1.5}
                className={cn('rounded-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-saffron', n <= shown ? 'fill-saffron text-saffron' : 'text-forest/30')}
              />
            </label>
          ))}
          <span className="ml-2 text-sm text-ink/70">{shown ? LABELS[shown - 1] : ''}</span>
        </div>
        {errors.rating ? (
          <p id="rating-error" className="mt-1 text-sm text-terracotta">
            {errors.rating}
          </p>
        ) : null}
      </fieldset>
      <Field id="review-title" label="Title" optional error={errors.title}>
        <input id="review-title" name="title" maxLength={80} className={inputClass} {...fieldAria('review-title', errors.title)} />
      </Field>
      <Field id="review-body" label="Your review" error={errors.body}>
        <textarea id="review-body" name="body" rows={4} maxLength={1000} required placeholder="What did you like? How did you enjoy it?" className={inputClass} {...fieldAria('review-body', errors.body)} />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Sending…' : 'Submit review'}
        </Button>
        {state && !state.ok ? (
          <p role="alert" className="text-sm text-terracotta">
            {state.error}
          </p>
        ) : (
          <p className="text-xs text-ink/60">Reviews are read by our team before they appear. Your name shows as first name and initial.</p>
        )}
      </div>
    </form>
  );
}
