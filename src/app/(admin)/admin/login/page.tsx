import type { Metadata } from 'next';
import { Suspense } from 'react';
import { LoginForm } from '@/components/account/AuthForms';
import { Logo } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-cream px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-cream-light p-6 shadow-md ring-1 ring-forest/5 md:p-8">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-4 text-center font-display text-3xl leading-none font-bold text-forest uppercase">MAGO admin</h1>
        <p className="mt-2 mb-6 text-center text-ink/75">Sign in with an owner or staff account.</p>
        <Suspense>
          <LoginForm defaultNext="/admin" showRegister={false} />
        </Suspense>
      </div>
    </main>
  );
}
