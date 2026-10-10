'use client';

import { Button } from '@/components/ui/Button';

export default function StoreError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="font-display text-4xl font-bold text-forest uppercase">Something went wrong</h1>
      <p className="mt-3 text-ink/80">Please try again in a moment.</p>
      <Button className="mt-8" onClick={() => retry()}>
        Try again
      </Button>
    </section>
  );
}
