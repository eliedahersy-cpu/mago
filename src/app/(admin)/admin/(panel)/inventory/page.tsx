import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { AdjustStockForm, StockSettingsForm } from '@/components/admin/StockForms';
import { adminButton, adminInput, Card, EmptyState, LoadingBlock, PageHeader } from '@/components/admin/ui';
import { requireStaff } from '@/lib/auth/dal';
import { listAdminProducts, listMovements } from '@/lib/data/admin';
import { cn } from '@/lib/cn';

export const metadata: Metadata = { title: 'Inventory' };

export default function InventoryPage({ searchParams }: PageProps<'/admin/inventory'>) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Inventory searchParams={searchParams} />
    </Suspense>
  );
}

const time = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Beirut' });
const REASON: Record<string, string> = { order: 'Order', cancel: 'Cancelled order', adjustment: 'Correction', restock: 'Restock', subscription: 'Subscription' };

async function Inventory({ searchParams }: { searchParams: PageProps<'/admin/inventory'>['searchParams'] }) {
  await requireStaff('/admin/inventory');
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
  const q = one(sp.q).trim().slice(0, 100);
  const low = one(sp.low) === '1';
  const [all, movements] = await Promise.all([listAdminProducts({ q }), listMovements({ limit: 30 })]);
  const products = all.filter((p) => p.type !== 'bundle' && p.status !== 'archived' && (!low || (p.trackInventory && p.stock <= p.lowStockThreshold)));

  return (
    <>
      <PageHeader title="Inventory" description="Every change is recorded with who made it and why." />
      <form method="get" className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl bg-white p-3 ring-1 ring-forest/10">
        <input name="q" type="search" defaultValue={q} placeholder="Search products" aria-label="Search products" className={`${adminInput} max-w-xs`} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="low" value="1" defaultChecked={low} className="size-4 accent-forest" /> Low stock only
        </label>
        <button type="submit" className={adminButton.primary}>
          Filter
        </button>
      </form>

      {products.length ? (
        <ul className="space-y-2">
          {products.map((p) => {
            const label = [p.name, p.flavour].filter(Boolean).join(' ');
            const lowNow = p.trackInventory && p.stock <= p.lowStockThreshold;
            return (
              <li key={p.id} className="rounded-2xl bg-white p-3 ring-1 ring-forest/10">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-cream-light">
                    {p.image ? <Image src={p.image} alt="" fill sizes="48px" className="object-contain p-0.5 mix-blend-multiply" /> : null}
                  </span>
                  <Link href={`/admin/products/${p.id}`} className="min-w-40 flex-1">
                    <span className="block font-semibold text-forest">{p.flavour ?? p.name}</span>
                    <span className="block text-xs text-ink/60">{p.name}</span>
                  </Link>
                  <span className={cn('w-24 text-right font-display text-xl font-bold tabular-nums', !p.trackInventory ? 'text-ink/40' : p.stock <= 0 ? 'text-terracotta' : lowNow ? 'text-[#7a4b00]' : 'text-forest')}>
                    {p.trackInventory ? p.stock : '—'}
                    <span className="block font-sans text-[11px] font-medium text-ink/55">{p.trackInventory ? (lowNow ? 'low' : 'in stock') : 'not tracked'}</span>
                  </span>
                </div>
                <div className="mt-2 flex flex-col gap-2 border-t border-forest/5 pt-2 xl:flex-row xl:items-center xl:justify-between">
                  {p.trackInventory ? <AdjustStockForm productId={p.id} label={label} /> : <span className="text-sm text-ink/55">Turn on tracking to count stock.</span>}
                  <StockSettingsForm productId={p.id} threshold={p.lowStockThreshold} track={p.trackInventory} backorder={p.allowBackorder} />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState title={low ? 'Nothing is low on stock' : 'No products found'} />
      )}

      <Card title="Recent stock changes" className="mt-6">
        {movements.length ? (
          <ul className="divide-y divide-forest/5 text-sm">
            {movements.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 py-2">
                <span className={cn('w-12 font-semibold tabular-nums', m.delta < 0 ? 'text-terracotta' : 'text-emerald-700')}>{m.delta > 0 ? `+${m.delta}` : m.delta}</span>
                <span className="min-w-40 flex-1 font-medium text-forest">{m.product}</span>
                <span className="text-ink/70">
                  {REASON[m.reason] ?? m.reason}
                  {m.orderNumber ? (
                    <>
                      {' '}
                      <Link href={`/admin/orders/${m.orderNumber}`} className="text-forest underline-offset-4 hover:underline">
                        #{m.orderNumber}
                      </Link>
                    </>
                  ) : null}
                  {m.note ? ` · ${m.note}` : ''}
                </span>
                <span className="w-full text-xs text-ink/55 sm:w-auto">
                  {time.format(new Date(m.createdAt))}
                  {m.by ? ` · ${m.by}` : ''}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink/60">No stock changes yet.</p>
        )}
      </Card>
    </>
  );
}
