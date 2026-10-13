'use client';

import { Heart, LayoutDashboard, LogOut, MapPin, Package, Repeat } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/actions/auth';
import { cn } from '@/lib/cn';
import { forgetAccountData } from '@/lib/wishlist/use-wishlist';

const links = [
  { href: '/account', label: 'Overview', icon: LayoutDashboard },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/subscriptions', label: 'Subscriptions', icon: Repeat },
  { href: '/account/addresses', label: 'Addresses', icon: MapPin },
  { href: '/account/wishlist', label: 'Wishlist', icon: Heart },
];

/** The current page is URL data, so the highlighted menu sits behind Suspense; this is its fallback. */
export function AccountNavFallback() {
  return <NavList pathname={null} />;
}

export function AccountNav() {
  return <NavList pathname={usePathname()} />;
}

function NavList({ pathname }: { pathname: string | null }) {
  const isActive = (href: string) => pathname !== null && (href === '/account' ? pathname === href : pathname.startsWith(href));
  return (
    <nav aria-label="Your account" className="rounded-3xl bg-cream-light p-3 shadow-sm ring-1 ring-forest/5 lg:sticky lg:top-28">
      <ul className="scrollbar-none flex gap-1 overflow-x-auto lg:flex-col">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href} className="shrink-0">
            <Link
              href={href}
              aria-current={isActive(href) ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-forest transition-colors hover:bg-forest/10',
                isActive(href) && 'bg-forest text-cream-light hover:bg-forest',
              )}
            >
              <Icon size={18} aria-hidden /> {label}
            </Link>
          </li>
        ))}
        <li className="shrink-0 lg:mt-2 lg:border-t lg:border-forest/10 lg:pt-2">
          <form action={signOut} onSubmit={forgetAccountData}>
            <button type="submit" className="flex w-full items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink/70 hover:bg-forest/10 hover:text-forest">
              <LogOut size={18} aria-hidden /> Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
