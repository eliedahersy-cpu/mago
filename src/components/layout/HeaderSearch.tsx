'use client';

import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { SearchForm } from './SearchForm';

export function HeaderSearch({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panel.current && !panel.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <div ref={panel} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={open ? 'Close search' : 'Search'}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex size-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/10"
      >
        {open ? <X size={21} aria-hidden /> : <Search size={21} aria-hidden />}
      </button>
      {open ? (
        <div className="absolute top-12 right-0 w-80 rounded-2xl bg-cream-light p-3 shadow-xl ring-1 ring-forest/10">
          <SearchForm autoFocus />
        </div>
      ) : null}
    </div>
  );
}
