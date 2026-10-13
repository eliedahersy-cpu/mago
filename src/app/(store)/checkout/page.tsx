import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Container } from '@/components/ui/Container';
import { getUser } from '@/lib/auth/dal';
import type { CheckoutAccount } from '@/lib/checkout/account';
import { getMyAddresses, getMyProfile } from '@/lib/data/account';
import { getSettings } from '@/lib/data/cached';

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false },
};

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <Container className="py-8 md:py-12">
      <h1 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-5xl">Checkout</h1>
      <p className="mt-2 text-ink/75">Cash on delivery across Lebanon. Free delivery on orders over ${settings.freeShippingThreshold}.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="py-16 text-center text-ink/70">Loading checkout…</p>}>
          <CheckoutForAccount deliveryAreas={settings.deliveryAreas} />
        </Suspense>
      </div>
    </Container>
  );
}

/** Reads the session (request data, so behind Suspense) to pre-fill signed-in customers. */
async function CheckoutForAccount({ deliveryAreas }: { deliveryAreas: string[] }) {
  const user = await getUser();
  let account: CheckoutAccount | null = null;
  if (user) {
    const [profile, addresses] = await Promise.all([getMyProfile(user.id), getMyAddresses()]);
    account = {
      email: user.email,
      fullName: profile.fullName ?? user.fullName,
      phone: profile.phone,
      address: addresses.find((a) => a.isDefault) ?? addresses[0] ?? null,
    };
  }
  return <CheckoutForm deliveryAreas={deliveryAreas} account={account} />;
}
