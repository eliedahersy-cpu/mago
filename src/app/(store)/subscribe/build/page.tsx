import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SubscribeFlow, type FlowProduct } from '@/components/subscribe/SubscribeFlow';
import { getAllActiveProducts, getProductBySlug, getSettings, getSubscriptionPlans } from '@/lib/data/cached';
import { DEFAULT_BOX_SIZE } from '@/lib/mix-box/box';
import type { Product } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Build your subscription',
  description: 'Choose a plan, pick 5 MAGO cups and tell us where to deliver. Pay cash on delivery.',
  robots: { index: false },
};

const toFlow = (p: Product): FlowProduct => ({
  id: p.id,
  name: p.name,
  flavour: p.flavour,
  image: (p.images.find((i) => i.kind === 'packshot') ?? p.images[0])?.url ?? null,
  price: p.price,
  description: p.tagline,
});

export default function BuildSubscriptionPage({ searchParams }: PageProps<'/subscribe/build'>) {
  return (
    <Suspense fallback={<p className="py-20 text-center text-ink/70">Loading…</p>}>
      <Build searchParams={searchParams} />
    </Suspense>
  );
}

async function Build({ searchParams }: { searchParams: PageProps<'/subscribe/build'>['searchParams'] }) {
  const [sp, plans, products, bundle, settings] = await Promise.all([
    searchParams,
    getSubscriptionPlans(),
    getAllActiveProducts(),
    getProductBySlug('mago-mix-box'),
    getSettings(),
  ]);
  const plan = Array.isArray(sp.plan) ? sp.plan[0] : sp.plan;
  return (
    <SubscribeFlow
      plans={plans}
      cups={products.filter((p) => p.type === 'cup').map(toFlow)}
      extras={products.filter((p) => p.type === 'extra').map(toFlow)}
      boxSize={bundle?.bundleSize ?? DEFAULT_BOX_SIZE}
      governorates={settings.deliveryAreas}
      initialPlanId={plan ?? null}
    />
  );
}
