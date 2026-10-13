import type { Metadata } from 'next';
import { CheckoutPreview } from '@/components/checkout/CheckoutPreview';
import { getSettings } from '@/lib/data/cached';

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Review your MAGO cups and delivery details.',
};

export default async function CheckoutPage() {
  const settings = await getSettings();
  return <CheckoutPreview shippingFlatFee={settings.shippingFlatFee} freeShippingThreshold={settings.freeShippingThreshold} />;
}
