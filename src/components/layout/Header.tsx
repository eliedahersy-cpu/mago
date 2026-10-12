import { Search, User } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/Logo';
import { HeaderSearch } from './HeaderSearch';
import { MobileNav } from './MobileNav';
import { NavLinks } from './NavLinks';

const iconButton =
  'flex size-10 items-center justify-center rounded-full text-forest transition-colors hover:bg-forest/10';

export function Header({ cart }: { cart?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 px-2 pt-2 md:px-4 md:pt-3">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 rounded-2xl bg-cream-light/95 px-3 shadow-[0_6px_24px_-12px_rgba(2,48,37,0.35)] ring-1 ring-forest/5 backdrop-blur md:h-[4.5rem] md:px-6">
        <div className="flex flex-1 items-center lg:flex-none">
          <MobileNav />
          <Link href="/" aria-label="MAGO home" className="hidden lg:block">
            <Logo priority className="w-28" />
          </Link>
        </div>

        <Link href="/" aria-label="MAGO home" className="lg:hidden">
          <Logo priority className="w-24" />
        </Link>

        <NavLinks />

        <div className="flex flex-1 items-center justify-end gap-1 lg:flex-none">
          <HeaderSearch className="hidden lg:block" />
          <Link href="/search" aria-label="Search" className={`${iconButton} lg:hidden`}><Search size={21} aria-hidden /></Link>
          <Link href="/account" aria-label="Account" className={iconButton}>
            <User size={21} aria-hidden />
          </Link>
          {cart}
        </div>
      </div>
    </header>
  );
}
