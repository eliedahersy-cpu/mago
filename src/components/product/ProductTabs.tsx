'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Product information: tabs from 768px, an accordion on phones (as in the mockups).
 * Each section's content is rendered once; the two controls only decide when it shows.
 */
export function ProductTabs({ tabs }: { tabs: { id: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const [open, setOpen] = useState<string[]>([]);
  const base = useId();

  const onKeyDown = (e: React.KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    setActive(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  };
  const toggle = (id: string) => setOpen((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));

  return (
    <div className="overflow-hidden rounded-3xl bg-cream-light ring-1 ring-forest/5">
      <div
        role="tablist"
        aria-label="Product information"
        className="scrollbar-none hidden gap-6 overflow-x-auto border-b border-forest/10 px-3 md:flex md:justify-center"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.id}
            id={`${base}-tab-${tab.id}`}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            aria-controls={`${base}-panel-${tab.id}`}
            tabIndex={active === tab.id ? 0 : -1}
            onClick={() => setActive(tab.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={cn(
              'relative shrink-0 px-3 py-4 font-display text-sm font-semibold whitespace-nowrap uppercase transition-colors',
              active === tab.id
                ? 'text-forest after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-terracotta'
                : 'text-ink/75 hover:text-forest',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab) => {
        const expanded = open.includes(tab.id);
        return (
          <section key={tab.id} className="border-b border-forest/10 last:border-b-0 md:border-b-0">
            <h3 className="md:hidden">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={`${base}-panel-${tab.id}`}
                onClick={() => toggle(tab.id)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-display text-base font-semibold text-forest"
              >
                {tab.label}
                <ChevronDown size={20} aria-hidden className={cn('shrink-0 transition-transform', expanded && 'rotate-180')} />
              </button>
            </h3>
            <div
              id={`${base}-panel-${tab.id}`}
              role="tabpanel"
              aria-labelledby={`${base}-tab-${tab.id}`}
              className={cn(
                'px-5 pb-5 md:p-8',
                expanded ? 'block' : 'hidden',
                active === tab.id ? 'md:block' : 'md:hidden',
              )}
            >
              {tab.content}
            </div>
          </section>
        );
      })}
    </div>
  );
}
