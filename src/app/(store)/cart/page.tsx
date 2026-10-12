import type { Metadata } from 'next';
import { CartPage } from '@/components/cart/CartPage';
import { Container } from '@/components/ui/Container';

export const metadata: Metadata = {
  title: 'Your cart',
  robots: { index: false },
};

export default function CartRoute() {
  return (
    <Container className="py-8 md:py-12">
      <h1 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-5xl">Your cart</h1>
      <div className="mt-8">
        <CartPage />
      </div>
    </Container>
  );
}
