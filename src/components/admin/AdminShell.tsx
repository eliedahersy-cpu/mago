import { ExternalLink, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { signOutToAdminLogin } from '@/app/actions/admin/session';
import { Logo } from '@/components/brand/Logo';
import { getStaff } from '@/lib/auth/dal';
import { AdminMobileNav, AdminNav, AdminNavFallback } from './AdminNav';

async function StaffBadge() {
  const staff = await getStaff();
  if (!staff) return null;
  const name = staff.fullName || staff.email;
  return (
    <div className="flex items-center gap-3">
      <div className="hidden text-right sm:block">
        <p className="max-w-48 truncate text-sm font-semibold text-forest">{name}</p>
        <p className="text-xs text-ink/60 capitalize">{staff.role}</p>
      </div>
      <span aria-hidden className="grid size-9 place-items-center rounded-full bg-forest font-display text-sm font-bold text-cream-light uppercase">
        {name.slice(0, 1)}
      </span>
      <form action={signOutToAdminLogin}>
        <button type="submit" className="grid size-9 place-items-center rounded-xl text-forest hover:bg-forest/10" title="Sign out">
          <LogOut size={18} aria-hidden />
          <span className="sr-only">Sign out</span>
        </button>
      </form>
    </div>
  );
}

/** Admin frame: dark sidebar on wide screens, a top bar with the menu, store link and who is signed in. */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#f6f1e7] text-ink lg:grid lg:grid-cols-[232px_1fr] print:block print:bg-white">
      <aside className="sticky top-0 hidden h-dvh flex-col print:!hidden gap-6 overflow-y-auto bg-forest px-3 py-5 lg:flex">
        <Link href="/admin" className="flex items-center gap-2 px-3">
          <Logo variant="light" className="w-24" />
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-cream-light uppercase">Admin</span>
        </Link>
        <nav aria-label="Admin">
          <Suspense fallback={<AdminNavFallback />}>
            <AdminNav />
          </Suspense>
        </nav>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center print:!hidden gap-3 border-b border-forest/10 bg-[#fbf7ef]/95 px-4 backdrop-blur md:px-6">
          <Suspense fallback={<div className="size-10 lg:hidden" />}>
            <AdminMobileNav />
          </Suspense>
          <Link href="/admin" className="lg:hidden">
            <Logo className="w-20" />
          </Link>
          <Link
            href="/"
            target="_blank"
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-forest hover:bg-forest/10"
          >
            View store <ExternalLink size={15} aria-hidden />
          </Link>
          <Suspense fallback={<div className="size-9 rounded-full bg-forest/10" />}>
            <StaffBadge />
          </Suspense>
        </header>
        <main id="main" className="flex-1 px-4 py-6 md:px-6 md:py-8 print:p-0">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
