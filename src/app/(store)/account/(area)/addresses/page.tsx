import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AddressBook } from '@/components/account/AddressBook';
import { requireUser } from '@/lib/auth/dal';
import { getMyAddresses } from '@/lib/data/account';
import { getSettings } from '@/lib/data/cached';

export const metadata: Metadata = {
  title: 'Your addresses',
  robots: { index: false },
};

export default function AddressesPage() {
  return (
    <>
      <h1 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-5xl">Your addresses</h1>
      <p className="mt-2 text-ink/70">Your default address is filled in for you at checkout.</p>
      <div className="mt-6">
        <Suspense fallback={<p className="py-10 text-center text-ink/70">Loading your addresses…</p>}>
          <Addresses />
        </Suspense>
      </div>
    </>
  );
}

async function Addresses() {
  const user = await requireUser('/account/addresses');
  const [addresses, settings] = await Promise.all([getMyAddresses(), getSettings()]);
  if (!user.emailVerified) {
    return <p className="rounded-2xl bg-saffron/15 px-4 py-3 text-sm text-ink">Confirm your email to save addresses.</p>;
  }
  return <AddressBook addresses={addresses} deliveryAreas={settings.deliveryAreas} />;
}
