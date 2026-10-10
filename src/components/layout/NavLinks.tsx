'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNav } from '@/config/navigation';
import { cn } from '@/lib/cn';

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
      <ul className="flex items-center gap-7">
        {mainNav.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative py-2 font-display text-[0.8rem] font-semibold tracking-wide text-forest uppercase transition-colors hover:text-terracotta',
                  active && 'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-terracotta',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
