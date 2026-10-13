import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/account/AuthForms';

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="mt-3 text-center font-display text-3xl leading-none font-bold text-forest uppercase">Choose a new password</h1>
      <p className="mt-2 mb-6 text-center text-ink/75">Pick a new password for your MAGO account.</p>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </>
  );
}
