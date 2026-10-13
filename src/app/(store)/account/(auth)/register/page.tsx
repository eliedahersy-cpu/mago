import type { Metadata } from 'next';
import { Suspense } from 'react';
import { RegisterForm } from '@/components/account/AuthForms';

export const metadata: Metadata = {
  title: 'Create an account',
  robots: { index: false },
};

export default function Page() {
  return (
    <>
      <h1 className="mt-3 text-center font-display text-3xl leading-none font-bold text-forest uppercase">Create an account</h1>
      <p className="mt-2 mb-6 text-center text-ink/75">Save your details, see your orders and keep a wishlist.</p>
      <Suspense>
        <RegisterForm />
      </Suspense>
    </>
  );
}
