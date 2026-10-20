import { ArrowRight, CalendarClock, CirclePause, Percent, Sparkles, Truck } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { ArchDecor, LeafSprig, ScriptNote, SunMark } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { getProductBySlug, getSubscriptionPlans } from '@/lib/data/cached';
import { DEFAULT_BOX_SIZE } from '@/lib/mix-box/box';

export const metadata: Metadata = {
  title: 'Subscribe & Save',
  description: 'Your favourite MAGO cups, always on hand. Save up to 15%, choose how often, pause or cancel anytime. Cash on delivery.',
};

const steps = [
  { icon: Sparkles, title: 'Choose your cups', text: 'Pick 5 cups, your way. Same or different flavours.' },
  { icon: CalendarClock, title: 'Set your schedule', text: 'Every 2, 4 or 6 weeks: choose what suits you.' },
  { icon: Percent, title: 'Enjoy the savings', text: 'Save on every box, delivered to your door.' },
  { icon: CirclePause, title: 'Manage anytime', text: 'Pause, skip or cancel whenever you like.' },
];

export default function SubscribePage() {
  return (
    <>
      <section className="relative isolate overflow-hidden">
        <LeafSprig className="pointer-events-none absolute -top-4 -left-6 -z-10 w-20 -rotate-[30deg] text-leaf md:w-32" />
        <LeafSprig className="pointer-events-none absolute -top-3 -right-4 -z-10 w-16 rotate-[30deg] text-forest-light md:w-28" />
        <ArchDecor tone="terracotta" className="pointer-events-none absolute -bottom-10 -left-8 -z-10 hidden w-32 opacity-80 md:block" />
        <div className="mx-auto grid max-w-7xl items-center md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="px-5 pt-9 pb-6 text-center md:py-14 md:pl-10 md:text-left lg:pl-16">
            <SunMark className="mx-auto w-16 md:mx-0 md:w-20" />
            <h1 className="mt-1 font-display text-[2.6rem] leading-[0.92] font-bold text-forest uppercase md:text-7xl">
              Subscribe
              <span className="block">&amp; save</span>
            </h1>
            <p className="mt-3 text-lg text-ink/85 md:text-xl">Your favourite MAGO cups, always on hand.</p>
            <Suspense fallback={<Perks best={15} />}>
              <BestSaving />
            </Suspense>
            <ButtonLink href="/subscribe/build" size="lg" className="mt-7">
              Start your subscription <ArrowRight size={18} aria-hidden />
            </ButtonLink>
          </div>
          <div className="relative aspect-[900/880] md:aspect-auto md:h-full md:min-h-[460px]">
            <Image
              src="/images/mix-box-hero.webp"
              alt="An open MAGO Mix Box holding five pasta cups"
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover [mask-image:radial-gradient(ellipse_at_center,#000_60%,transparent_75%)]"
            />
            <ScriptNote arrow="down" className="absolute top-6 right-6 hidden -rotate-6 text-2xl text-forest lg:inline-flex">
              Same pasta.
              <br />
              More possibilities.
            </ScriptNote>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16" aria-labelledby="how-title">
        <div className="mx-auto max-w-6xl text-center">
          <h2 id="how-title" className="font-display text-4xl font-bold text-forest uppercase md:text-5xl">
            How it works
          </h2>
          <p className="mt-2 text-ink/75">Good food, on repeat. It&rsquo;s simple.</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="rounded-3xl bg-cream-light p-5 text-center shadow-sm ring-1 ring-forest/5">
                <span className="mx-auto grid size-10 place-items-center rounded-full bg-forest font-display text-lg font-bold text-cream-light">{i + 1}</span>
                <Icon size={40} strokeWidth={1.4} className="mx-auto mt-4 text-terracotta" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-bold text-forest">{title}</h3>
                <p className="mt-1 text-sm text-ink/75">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16" aria-labelledby="plans-title">
        <div className="mx-auto max-w-5xl text-center">
          <h2 id="plans-title" className="font-display text-4xl font-bold text-forest uppercase md:text-5xl">
            Choose your plan
          </h2>
          <p className="mt-2 text-ink/75">Same great flavours. More savings.</p>
          <Suspense fallback={<p className="mt-8 text-ink/60">Loading plans…</p>}>
            <Plans />
          </Suspense>
          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-ink/70">
            <Truck size={16} aria-hidden /> Cash on delivery. Change, skip or cancel anytime.
          </p>
        </div>
      </section>

      <section className="relative isolate overflow-hidden px-4 py-14 text-center">
        <ArchDecor tone="peach" className="pointer-events-none absolute -right-8 -bottom-12 -z-10 w-28 opacity-70 md:w-36" />
        <h2 className="font-display text-4xl leading-none font-bold text-forest uppercase md:text-6xl">
          Good food
          <span className="block text-terracotta">comes back.</span>
        </h2>
        <p className="mt-3 text-ink/75">Less thinking. More delicious moments.</p>
        <ButtonLink href="/subscribe/build" size="lg" className="mt-6">
          Start your subscription <ArrowRight size={18} aria-hidden />
        </ButtonLink>
      </section>
    </>
  );
}

function Perks({ best }: { best: number }) {
  const perks = [`Save up to ${best}%`, 'Flexible delivery', 'Pause or cancel anytime', 'Cash on delivery'];
  return (
    <ul className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2 text-left text-sm font-semibold text-forest md:mx-0">
      {perks.map((p) => (
        <li key={p} className="flex items-center gap-2 rounded-xl bg-cream-light/80 px-3 py-2 ring-1 ring-forest/10">
          <span aria-hidden className="size-2 rounded-full bg-saffron" /> {p}
        </li>
      ))}
    </ul>
  );
}

async function BestSaving() {
  const plans = await getSubscriptionPlans();
  return <Perks best={Math.max(0, ...plans.map((p) => p.discountPercent))} />;
}

async function Plans() {
  const [plans, bundle] = await Promise.all([getSubscriptionPlans(), getProductBySlug('mago-mix-box')]);
  const size = bundle?.bundleSize ?? DEFAULT_BOX_SIZE;
  if (!plans.length) return <p className="mt-8 text-ink/70">Subscriptions open again soon.</p>;
  return (
    <ul className="mt-8 grid gap-4 sm:grid-cols-3">
      {plans.map((p) => (
        <li key={p.id} className={`relative flex flex-col items-center rounded-3xl bg-cream-light p-6 shadow-sm ring-2 ${p.isPopular ? 'ring-saffron' : 'ring-transparent'}`}>
          {p.isPopular ? <span className="absolute -top-3 rounded-full bg-sun px-3 py-1 font-display text-xs font-bold text-forest uppercase">Most popular</span> : null}
          <h3 className="font-display text-2xl font-bold text-forest">{p.name}</h3>
          <p className="mt-1 text-sm text-ink/70">{size} cups per box</p>
          <p className="mt-3 rounded-full bg-leaf/15 px-3 py-1 text-sm font-semibold text-forest">Save {p.discountPercent}% on cups</p>
          <Link
            href={`/subscribe/build?plan=${p.id}`}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-forest px-6 font-display text-sm font-semibold tracking-wide text-cream-light uppercase hover:bg-forest-light"
          >
            Select <ArrowRight size={16} aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
