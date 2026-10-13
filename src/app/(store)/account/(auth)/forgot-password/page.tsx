import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/account/AuthForms';

export const metadata: Metadata = {
  title: 'Forgot your password',
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="mt-3 text-center font-display text-3xl leading-none font-bold text-forest uppercase">Forgot your password?</h1>
      <p className="mt-2 mb-6 text-center text-ink/75">Enter your email and we will send you a link to choose a new one.</p>
      <Suspense>
        <ForgotPasswordForm />
      </Suspense>
    </>
  );
}
