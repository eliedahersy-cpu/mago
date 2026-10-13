import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/account/AuthForms';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="mt-3 text-center font-display text-3xl leading-none font-bold text-forest uppercase">Sign in</h1>
      <p className="mt-2 mb-6 text-center text-ink/75">Track your orders, keep your addresses and check out faster.</p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
