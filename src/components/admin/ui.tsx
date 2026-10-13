import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { PAYMENT_LABEL, type PaymentStatus, SOURCE_LABEL, type OrderSource, STATUS_LABEL, type OrderStatus } from '@/lib/admin/orders';
import { cn } from '@/lib/cn';

/** Shared admin building blocks (server-safe). */

export const adminInput =
  'w-full rounded-xl border border-forest/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-forest focus:outline-none aria-[invalid=true]:border-terracotta';

export const adminLabel = 'text-sm font-semibold text-forest';

export const adminButton = {
  primary:
    'inline-flex items-center justify-center gap-2 rounded-xl bg-forest px-4 py-2 text-sm font-semibold text-cream-light transition-colors hover:bg-forest-light disabled:pointer-events-none disabled:opacity-50',
  secondary:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-forest/20 bg-white px-4 py-2 text-sm font-semibold text-forest transition-colors hover:bg-cream-light disabled:pointer-events-none disabled:opacity-50',
  danger:
    'inline-flex items-center justify-center gap-2 rounded-xl border border-terracotta/30 bg-white px-4 py-2 text-sm font-semibold text-terracotta transition-colors hover:bg-terracotta/5 disabled:pointer-events-none disabled:opacity-50',
};

export function PageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: ReactNode;
  description?: ReactNode;
  back?: { href: string; label: string };
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back ? (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-forest/80 hover:text-forest">
            <ChevronLeft size={16} aria-hidden /> {back.label}
          </Link>
        ) : null}
        <h1 className="font-display text-2xl leading-tight font-bold text-forest md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink/70">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function Card({ title, actions, children, className }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(2,48,37,0.06)] ring-1 ring-forest/10 md:p-5', className)}>
      {title || actions ? (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title ? <h2 className="font-display text-base font-bold text-forest">{title}</h2> : <span />}
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}

const statusTone: Record<OrderStatus, string> = {
  pending: 'bg-sun/25 text-[#7a4b00]',
  confirmed: 'bg-sky-100 text-sky-800',
  preparing: 'bg-violet-100 text-violet-800',
  out_for_delivery: 'bg-blue-100 text-blue-800',
  delivered: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-ink/10 text-ink/70',
};

const paymentTone: Record<PaymentStatus, string> = {
  unpaid: 'bg-terracotta/10 text-terracotta',
  paid: 'bg-emerald-100 text-emerald-800',
  refunded: 'bg-ink/10 text-ink/70',
};

const pill = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

export function StatusBadge({ status }: { status: string }) {
  const s = status as OrderStatus;
  return <span className={cn(pill, statusTone[s] ?? 'bg-ink/10 text-ink')}>{STATUS_LABEL[s] ?? status}</span>;
}

export function PaymentBadge({ status }: { status: string }) {
  const s = status as PaymentStatus;
  return <span className={cn(pill, paymentTone[s] ?? 'bg-ink/10 text-ink')}>{PAYMENT_LABEL[s] ?? status}</span>;
}

export function SourceBadge({ source }: { source: string }) {
  return <span className={cn(pill, 'bg-cream-dark/70 text-forest')}>{SOURCE_LABEL[source as OrderSource] ?? source}</span>;
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' }) {
  const tones = {
    neutral: 'bg-cream-dark/70 text-forest',
    good: 'bg-emerald-100 text-emerald-800',
    warn: 'bg-sun/25 text-[#7a4b00]',
    bad: 'bg-terracotta/10 text-terracotta',
  };
  return <span className={cn(pill, tones[tone])}>{children}</span>;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-forest/20 bg-white/60 px-6 py-12 text-center">
      <p className="font-display text-lg font-bold text-forest">{title}</p>
      {children ? <div className="mt-2 text-sm text-ink/70">{children}</div> : null}
    </div>
  );
}

/** Wraps a table so it scrolls sideways on narrow screens instead of breaking the page. */
export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_1px_2px_rgba(2,48,37,0.06)] ring-1 ring-forest/10">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export const th = 'border-b border-forest/10 bg-cream-light/60 px-4 py-2.5 text-xs font-semibold tracking-wide text-ink/60 uppercase';
export const td = 'border-b border-forest/5 px-4 py-3 align-middle';

export function Pagination({ page, pageSize, total, href }: { page: number; pageSize: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between gap-3 text-sm text-ink/70">
      <span>
        {from}–{to} of {total}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={adminButton.secondary}>
            <ChevronLeft size={16} aria-hidden /> Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className={adminButton.secondary}>
            Next <ChevronRight size={16} aria-hidden />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="animate-pulse space-y-4">
      <div className="h-8 w-48 rounded-lg bg-forest/10" />
      <div className="h-40 rounded-2xl bg-forest/5" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
