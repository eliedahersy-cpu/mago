'use client';

import {
  BarChart3,
  BookOpen,
  Boxes,
  FolderTree,
  Home,
  MapPin,
  Menu,
  Package,
  Repeat,
  Settings,
  ShoppingBag,
  Star,
  Tag,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ADMIN_NAV, type AdminNavItem, isActiveNav } from '@/lib/admin/nav';
import { cn } from '@/lib/cn';

const ICONS: Record<AdminNavItem['icon'], LucideIcon> = {
  home: Home,
  orders: ShoppingBag,
  products: Package,
  collections: FolderTree,
  inventory: Boxes,
  customers: Users,
  discounts: Tag,
  subscriptions: Repeat,
  recipes: BookOpen,
  stores: MapPin,
  reviews: Star,
  analytics: BarChart3,
  settings: Settings,
};

function Links({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <ul className="space-y-0.5">
      {ADMIN_NAV.map((item) => {
        const Icon = ICONS[item.icon];
        const active = pathname !== null && isActiveNav(pathname, item.href);
        return (
          <li key={item.href}>
            {item.group ? <p className="mt-4 mb-1 px-3 text-[11px] font-semibold tracking-wide text-cream-light/50 uppercase">{item.group}</p> : null}
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                active ? 'bg-cream-light text-forest' : 'text-cream-light/85 hover:bg-white/10 hover:text-cream-light',
              )}
            >
              <Icon size={18} aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Sidebar links; reads the current path, so it renders inside a Suspense boundary. */
export function AdminNav() {
  const pathname = usePathname();
  return <Links pathname={pathname} />;
}

/** The same links before the path is known. */
export function AdminNavFallback() {
  return <Links pathname={null} />;
}

/** Phones and tablets: a menu button that opens the links in a panel. */
export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        className="grid size-10 place-items-center rounded-xl text-forest hover:bg-forest/10"
      >
        <Menu size={22} aria-hidden />
        <span className="sr-only">Open menu</span>
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-forest-dark/50" onClick={() => setOpen(false)} />
          <nav id="admin-mobile-nav" aria-label="Admin" className="relative z-10 flex w-72 max-w-[85vw] flex-col gap-4 bg-forest p-4">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-cream-light">MAGO admin</span>
              <button type="button" onClick={() => setOpen(false)} className="grid size-9 place-items-center rounded-lg text-cream-light hover:bg-white/10">
                <X size={20} aria-hidden />
                <span className="sr-only">Close menu</span>
              </button>
            </div>
            <Links pathname={pathname} onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      ) : null}
    </div>
  );
}
