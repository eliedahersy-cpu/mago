import { ArrowRight } from 'lucide-react';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { type CardProduct, SubscriptionCard } from '@/components/account/SubscriptionCard';
import { ButtonLink } from '@/components/ui/Button';
import { requireUser } from '@/lib/auth/dal';
import { getAllActiveProducts, getProductBySlug, getSubscriptionPlans } from '@/lib/data/cached';
import { getMySubscriptions } from '@/lib/data/subscriptions';
import { DEFAULT_BOX_SIZE } from '@/lib/mix-box/box';

export const metadata: Metadata = {
  title: 'Your subscriptions',
  robots: { index: false },
};

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-ink/70">Loading your subscriptions…</p>}>
      <Subscriptions />
    </Suspense>
  );
}

async function Subscriptions() {
  await requireUser('/account/subscriptions');
  const [subs, products, plans, bundle] = await Promise.all([getMySubscriptions(), getAllActiveProducts(), getSubscriptionPlans(), getProductBySlug('mago-mix-box')]);
  const byId: Record<string, CardProduct> = Object.fromEntries(
    products
      .filter((p) => p.type === 'cup' || p.type === 'extra')
      .map((p) => [p.id, { id: p.id, name: p.name, flavour: p.flavour, image: (p.images.find((i) => i.kind === 'packshot') ?? p.images[0])?.url ?? null }]),
  );
  const cupChoices = products.filter((p) => p.type === 'cup').map((p) => byId[p.id]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-5xl">Subscriptions</h1>
        <p className="mt-2 text-ink/70">Your boxes on repeat. Skip, pause or change cups anytime.</p>
      </header>
      {subs.length ? (
        subs.map((s) => (
          <SubscriptionCard
            key={s.id}
            sub={s}
            products={byId}
            cupChoices={cupChoices}
            plans={plans.map((p) => ({ id: p.id, name: p.name, discountPercent: p.discountPercent }))}
            boxSize={bundle?.bundleSize ?? DEFAULT_BOX_SIZE}
          />
        ))
      ) : (
        <div className="rounded-3xl bg-cream-light p-8 text-center shadow-sm ring-1 ring-forest/5">
          <p className="font-display text-2xl font-bold text-forest">No subscriptions yet</p>
          <p className="mt-2 text-ink/70">Get 5 cups delivered every 2, 4 or 6 weeks and save on every box.</p>
          <ButtonLink href="/subscribe" className="mt-5">
            Subscribe &amp; save <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>
      )}
    </div>
  );
}
