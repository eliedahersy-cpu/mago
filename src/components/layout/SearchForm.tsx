import { Search } from 'lucide-react';
import { cn } from '@/lib/cn';

export function SearchForm({
  defaultValue,
  autoFocus,
  className,
}: {
  defaultValue?: string;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <form action="/search" method="get" role="search" className={cn('relative', className)}>
      <label htmlFor="site-search" className="sr-only">
        Search for flavours or ingredients
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Search for flavours, ingredients…"
        className="h-11 w-full rounded-full border border-forest/15 bg-white pr-12 pl-5 text-sm text-ink placeholder:text-ink/50 focus:border-forest focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Submit search"
        className="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-full bg-forest text-cream-light"
      >
        <Search size={16} aria-hidden />
      </button>
    </form>
  );
}
