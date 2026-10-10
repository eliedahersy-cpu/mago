'use client';

import { ArrowRight } from 'lucide-react';
import { useActionState } from 'react';
import { subscribeToNewsletter, type NewsletterState } from '@/app/actions/newsletter';
import { cn } from '@/lib/cn';

const initial: NewsletterState = { status: 'idle', message: '' };

export function NewsletterForm() {
  const [state, action, pending] = useActionState(subscribeToNewsletter, initial);
  return (
    <form action={action} noValidate className="max-w-sm">
      <label htmlFor="newsletter-email" className="sr-only">
        Your email
      </label>
      <div className="relative">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Your email"
          aria-invalid={state.status === 'error'}
          aria-describedby="newsletter-status"
          className="h-12 w-full rounded-full bg-cream-light pr-14 pl-5 text-sm text-ink placeholder:text-ink/50 focus:outline-none"
        />
        <button
          type="submit"
          disabled={pending}
          aria-label="Subscribe"
          className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-forest text-cream-light ring-1 ring-cream-light/30 disabled:opacity-60"
        >
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
      <p
        id="newsletter-status"
        aria-live="polite"
        className={cn('mt-2 min-h-5 text-sm', state.status === 'error' ? 'text-sun' : 'text-cream-light/90')}
      >
        {state.message}
      </p>
    </form>
  );
}
