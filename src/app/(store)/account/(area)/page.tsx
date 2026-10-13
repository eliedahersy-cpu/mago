import { ArrowRight, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { addressLines } from '@/components/account/AddressBook';
import { OrdersTable } from '@/components/account/OrdersTable';
import { ProfileForm } from '@/components/account/ProfileForm';
import { requireUser } from '@/lib/auth/dal';
import { getMyAddresses, getMyOrders, getMyProfile } from '@/lib/data/account';

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-ink/70">Loading your account…</p>}>
      <Overview />
    </Suspense>
  );
}

async function Overview() {
  const user = await requireUser('/account');
  const [profile, orders, addresses] = await Promise.all([getMyProfile(user.id), getMyOrders(3), getMyAddresses()]);
  const firstName = (profile.fullName ?? user.fullName ?? '').split(' ')[0];
  const address = addresses.find((a) => a.isDefault) ?? addresses[0];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-5xl">
          {firstName ? `Hi, ${firstName}!` : 'Your account'}
        </h1>
        <p className="mt-2 text-ink/70">{user.email}</p>
      </header>

      {!user.emailVerified ? (
        <p role="status" className="rounded-2xl bg-saffron/15 px-4 py-3 text-sm text-ink">
          Confirm your email to see orders you placed before you had an account.
        </p>
      ) : null}

      <section aria-labelledby="recent-orders">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-orders" className="font-display text-2xl font-bold text-forest">
            Recent orders
          </h2>
          {orders.length > 0 ? (
            <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
              All orders <ArrowRight size={16} aria-hidden />
            </Link>
          ) : null}
        </div>
        <div className="mt-3">
          <OrdersTable orders={orders} />
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section aria-labelledby="your-details" className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
          <h2 id="your-details" className="font-display text-2xl font-bold text-forest">
            Your details
          </h2>
          <div className="mt-4">
            <ProfileForm email={user.email} fullName={profile.fullName ?? user.fullName} phone={profile.phone} />
          </div>
        </section>
        <section aria-labelledby="default-address" className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
          <h2 id="default-address" className="font-display text-2xl font-bold text-forest">
            Default address
          </h2>
          {address ? (
            <div className="mt-4 text-sm text-ink/80">
              <p className="flex items-center gap-2 font-semibold text-forest">
                <MapPin size={16} aria-hidden /> {address.label || address.fullName}
              </p>
              {addressLines(address).map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p className="mt-1">{address.phone}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/70">No address saved yet.</p>
          )}
          <Link href="/account/addresses" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-forest underline-offset-4 hover:underline">
            Manage addresses <ArrowRight size={16} aria-hidden />
          </Link>
        </section>
      </div>
    </div>
  );
}
