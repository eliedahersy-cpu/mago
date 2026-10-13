import { Gift, Heart, Leaf, Soup } from 'lucide-react';
import Image from 'next/image';
import { ArchDecor, LeafSprig, SunMark } from '@/components/brand/Decor';
import { cn } from '@/lib/cn';

const perks = [
  { Icon: Leaf, label: ['Personalised', 'Recommendations'] },
  { Icon: Soup, label: ['Discover', 'New Flavours'] },
  { Icon: Heart, label: ['Based on', 'Your Preferences'] },
  { Icon: Gift, label: ['Perfect for', 'Mix & Match'] },
];

/** "Find your MAGO match" banner. Once the quiz starts, phones drop the photo so the question sits higher. */
export function QuizHero({ started }: { started: boolean }) {
  return (
    <section className="relative isolate overflow-hidden bg-[radial-gradient(ellipse_at_25%_35%,#fff6e6_0%,#fbecd5_55%,#f6e0c2_100%)]">
      <LeafSprig className="pointer-events-none absolute -top-4 -left-6 -z-10 w-20 -rotate-[35deg] text-leaf/90 md:w-36" />
      <LeafSprig className="pointer-events-none absolute top-1/2 -left-8 -z-10 hidden w-28 rotate-[200deg] text-forest-light/80 md:block" />
      <ArchDecor tone="peach" className="pointer-events-none absolute -bottom-14 -left-6 -z-10 w-24 opacity-70 md:w-32" />
      <LeafSprig className="pointer-events-none absolute -top-3 -right-5 -z-10 w-20 rotate-[25deg] text-leaf/90 md:hidden" />

      <div className="grid items-center md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="relative px-5 pt-7 pb-6 text-center md:py-14 md:pr-4 md:pl-10 lg:pl-[max(4rem,calc((100vw-80rem)/2+4rem))]">
          <SunMark className="mx-auto w-16 md:w-24" />
          <h1 className="mt-1 font-display text-[clamp(2.6rem,5.4vw,4.75rem)] leading-[0.92] font-bold whitespace-nowrap text-forest uppercase">
            Find your
            <span className="block text-terracotta">MAGO match</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-[15px] leading-snug font-medium text-ink/85 sm:max-w-md md:mt-4 md:text-xl">
            Answer a few simple questions and we&rsquo;ll find your perfect pasta cups.
          </p>
          <ul className="mx-auto mt-5 grid max-w-lg grid-cols-4 gap-1 md:mt-8">
            {perks.map(({ Icon, label }) => (
              <li key={label[1]} className="flex flex-col items-center gap-1.5 text-center text-forest">
                <Icon className="size-7 md:size-9" strokeWidth={1.4} aria-hidden />
                <span className="text-[10px] leading-tight font-semibold md:text-[13px]">
                  {label[0]}
                  <br />
                  {label[1]}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className={cn('relative h-56 sm:h-72 md:h-full md:min-h-[440px]', started && 'max-md:hidden')}>
          <ArchDecor tone="terracotta" className="absolute -top-8 left-[4%] hidden w-44 md:block lg:w-56" />
          <Image
            src="/images/quiz-hero.webp"
            alt="MAGO pasta cups surrounded by fresh Mediterranean ingredients"
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(min-width: 768px) 55vw, 100vw"
            className="object-cover object-[60%_100%] [mask-image:linear-gradient(to_bottom,transparent,#000_18%)] md:[mask-image:linear-gradient(to_right,transparent,#000_22%)]"
          />
        </div>
      </div>
    </section>
  );
}
