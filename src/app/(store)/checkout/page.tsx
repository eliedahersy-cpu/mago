import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { Container } from '@/components/ui/Container';
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
        <CheckoutForm deliveryAreas={settings.deliveryAreas} />
      </div>
    </Container>
  );
}
