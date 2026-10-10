'use client';

import { Menu, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { Logo } from '@/components/brand/Logo';
import { mainNav } from '@/config/navigation';
import { cn } from '@/lib/cn';
import { isActivePath } from './NavLinks';
import { SearchForm } from './SearchForm';

export function MobileNav() {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Close the sheet after navigating.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        aria-label="Open menu"
        onClick={() => dialog.current?.showModal()}
        className="flex size-10 items-center justify-center rounded-full text-forest hover:bg-forest/10 lg:hidden"
      >
        <Menu size={24} aria-hidden />
      </button>
      <dialog
        ref={dialog}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-[min(22rem,88vw)] bg-cream-light p-0 backdrop:bg-forest/40 open:flex open:flex-col"
        onClick={(e) => e.target === dialog.current && dialog.current?.close()}
      >
        <div className="flex items-center justify-between px-5 pt-5">
          <Logo className="w-24" />
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => dialog.current?.close()}
            className="flex size-10 items-center justify-center rounded-full text-forest hover:bg-forest/10"
          >
            <X size={22} aria-hidden />
          </button>
        </div>
        <div className="px-5 pt-5">
          <SearchForm />
        </div>
        <nav aria-label="Mobile" className="flex-1 px-5 pt-4">
          <ul className="divide-y divide-forest/10">
            {mainNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
                  className={cn(
                    'block py-4 font-display text-lg font-semibold text-forest uppercase',
                    isActivePath(pathname, item.href) && 'text-terracotta',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/account" className="flex items-center gap-2 border-t border-forest/10 px-5 py-5 font-medium text-forest">
          <User size={20} aria-hidden /> My account
        </Link>
      </dialog>
    </>
  );
}
