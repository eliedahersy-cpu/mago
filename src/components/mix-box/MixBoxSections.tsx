import { ArrowRight, Gift, Leaf, Smile, Soup, Truck } from 'lucide-react';
import Image from 'next/image';
import { ArchDecor, LeafSprig, ScriptNote, SunMark } from '@/components/brand/Decor';
import { ButtonLink } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { BoxStepper } from './BoxStepper';

export function MixBoxHero({ size }: { size: number }) {
  return (
    <section className="relative overflow-hidden">
      <ArchDecor className="pointer-events-none absolute -bottom-6 -left-10 hidden w-28 opacity-50 md:block" />
      <ArchDecor tone="saffron" className="pointer-events-none absolute top-10 -right-8 hidden w-24 opacity-40 lg:block" />
      <LeafSprig className="pointer-events-none absolute top-6 left-4 hidden w-12 -rotate-12 opacity-60 md:block" />
      <Container className="grid items-center gap-8 py-8 md:grid-cols-[1fr_1.1fr] md:py-12">
        <div className="text-center md:text-left">
          <h1 className="font-display leading-[0.9] font-bold text-forest uppercase">
            <span className="block text-4xl md:text-6xl">Build your</span>
            <span className="block text-5xl md:text-7xl">MAGO Mix Box</span>
          </h1>
          <p className="mt-3 text-lg text-ink/80 md:text-xl">Pick {size} cups. Your way. More flavours. More fun.</p>
          <BoxStepper size={size} className="mt-6" />
          <ButtonLink href="#cups" size="lg" className="mt-6">
            Start mixing <ArrowRight size={18} aria-hidden />
          </ButtonLink>
        </div>
        <div className="relative mx-auto aspect-[760/707] w-full max-w-xl">
          <SunMark className="absolute -top-8 right-6 z-10 w-20 md:-top-10 md:w-28" />
          <Image
            src="/products/mago-mix-box-open.webp"
            alt="An open MAGO Mix Box holding five pasta cups"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) 50vw, 100vw"
            className="rounded-3xl object-contain shadow-xl"
          />
        </div>
      </Container>
    </section>
  );
}

const perks = [
  { icon: Leaf, title: 'Mix your favourites', text: "Create a box that's uniquely yours." },
  { icon: Soup, title: 'More flavours to explore', text: 'Classic, bold and new favourites.' },
  { icon: Gift, title: 'The perfect gift', text: 'A delicious surprise for any occasion.' },
  { icon: Smile, title: 'Made for every mood', text: 'Comforting, energising and always satisfying.' },
];

export function MixBoxPerks() {
  return (
    <Container>
      <ul className="grid grid-cols-4 divide-x divide-forest/10 rounded-3xl bg-cream-light py-4 shadow-sm ring-1 ring-forest/5 md:py-5">
        {perks.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex flex-col items-center gap-2 px-2 text-center md:flex-row md:items-start md:gap-3 md:px-5 md:text-left">
            <Icon size={30} className="shrink-0 text-forest" aria-hidden />
            <div>
              <p className="font-display text-xs leading-tight font-semibold text-forest md:text-base">{title}</p>
              <p className="mt-0.5 hidden text-sm text-ink/70 md:block">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}

export function HowItWorks({ size }: { size: number }) {
  const steps = [
    { title: `Pick ${size} cups`, text: 'Choose any flavours from our collection.', image: '/images/cup-collection.webp' },
    { title: 'Build your mix', text: 'Add your favourites to create your box.', image: '/products/mago-mix-box.webp' },
    { title: 'We pack and ship', text: 'We carefully pack your MAGO Mix Box and deliver it to your door.', image: null },
  ];
  return (
    <Container className="py-10">
      <section className="grid items-center gap-6 rounded-3xl bg-cream-light p-6 shadow-sm ring-1 ring-forest/5 md:grid-cols-[auto_1fr] md:p-8">
        <h2 className="font-display text-3xl leading-none font-bold text-forest uppercase md:text-4xl">
          How your <span className="block">Mix Box works</span>
        </h2>
        <ol className="grid gap-5 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="flex items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-forest font-display text-lg font-bold text-cream-light">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display font-semibold text-forest">{step.title}</p>
                <p className="text-sm text-ink/70">{step.text}</p>
              </div>
              <div className="relative hidden size-20 shrink-0 lg:block">
                {step.image ? (
                  <Image src={step.image} alt="" fill sizes="80px" className="object-contain mix-blend-multiply" />
                ) : (
                  <Truck size={56} className="absolute inset-0 m-auto text-terracotta" aria-hidden />
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
    </Container>
  );
}

export function CravingsBanner() {
  return (
    <section className="relative overflow-hidden bg-cream-dark/60">
      <ArchDecor tone="terracotta" className="pointer-events-none absolute -right-6 -bottom-8 hidden w-32 opacity-40 md:block" />
      <Container className="grid items-center gap-8 py-10 md:grid-cols-[0.8fr_1.2fr] md:py-14">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-xs overflow-hidden rounded-3xl md:max-w-sm">
          <Image
            src="/images/lifestyle-lemon-office.webp"
            alt="Enjoying a MAGO pasta cup at lunch"
            fill
            sizes="(min-width: 768px) 30vw, 80vw"
            className="object-cover"
          />
        </div>
        <div className="text-center md:text-left">
          <h2 className="font-display text-4xl leading-none font-bold text-forest md:text-5xl">Create a box that fits your cravings.</h2>
          <p className="mt-3 max-w-lg text-lg text-ink/80 md:mx-0">
            From vibrant Mediterranean flavours to comforting classics, your MAGO Mix Box is all about more of what you love.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 md:flex-row">
            <ButtonLink href="#cups" size="lg">
              Start mixing <ArrowRight size={18} aria-hidden />
            </ButtonLink>
            <ScriptNote arrow="left" className="-rotate-6">
              Same pasta. More possibilities.
            </ScriptNote>
          </div>
        </div>
      </Container>
    </section>
  );
}
