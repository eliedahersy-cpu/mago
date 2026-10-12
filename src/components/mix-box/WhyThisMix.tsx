import { LeafSprig } from '@/components/brand/Decor';
import Image from 'next/image';
import type { MixHighlight } from '@/lib/mix-box/highlights';

export function WhyThisMix({ highlights }: { highlights: MixHighlight[] }) {
  if (highlights.length === 0) return null;
  return (
    <section aria-labelledby="why-mix" className="rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5 md:p-6">
      <div className="flex items-center gap-2">
        <LeafSprig className="w-6 -rotate-45" />
        <h2 id="why-mix" className="font-display text-2xl leading-none font-bold text-forest">
          Why this mix works
        </h2>
      </div>
      <p className="mt-1 text-sm text-ink/70">A perfect balance of flavours for every mood.</p>
      <ul className="mt-4 space-y-4">
        {highlights.map((h) => (
          <li key={h.key} className="flex items-center gap-3">
            <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-cream-dark/60 ring-2 ring-cream-dark">
              {h.image ? <Image src={h.image} alt="" fill sizes="56px" className="object-contain p-1 mix-blend-multiply" /> : null}
            </span>
            <div>
              <p className="font-display font-semibold text-forest">{h.title}</p>
              <p className="text-sm text-ink/75">{h.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
