import Link from 'next/link';
import { RANGES, type RangeKey } from '@/lib/admin/stats';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';

/** Links to switch the dashboard period (kept in the URL so it can be shared and bookmarked). */
export function RangePicker({ active, basePath }: { active: RangeKey; basePath: string }) {
  return (
    <nav aria-label="Period" className="flex flex-wrap gap-1 rounded-xl bg-white p-1 ring-1 ring-forest/10">
      {RANGES.map((r) => (
        <Link
          key={r.key}
          href={`${basePath}?range=${r.key}`}
          aria-current={r.key === active ? 'page' : undefined}
          className={cn(
            'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
            r.key === active ? 'bg-forest text-cream-light' : 'text-forest hover:bg-cream-light',
          )}
        >
          {r.label}
        </Link>
      ))}
    </nav>
  );
}

export function KpiCard({ label, value, change }: { label: string; value: string; change: number | null }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(2,48,37,0.06)] ring-1 ring-forest/10">
      <p className="text-sm text-ink/65">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-forest tabular-nums">{value}</p>
      <p className={cn('mt-1 text-xs font-semibold', change === null ? 'text-ink/50' : change >= 0 ? 'text-emerald-700' : 'text-terracotta')}>
        {change === null ? 'No earlier sales to compare' : `${change >= 0 ? '▲' : '▼'} ${Math.abs(change)}% vs previous period`}
      </p>
    </div>
  );
}

const shortDay = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/** Daily sales as bars (plain SVG, no chart library). Days are Beirut calendar days (YYYY-MM-DD). */
export function SalesChart({ daily }: { daily: { day: string; sales: number; orders: number }[] }) {
  const W = 720;
  const H = 220;
  const pad = { top: 12, right: 8, bottom: 28, left: 48 };
  const max = Math.max(1, ...daily.map((d) => d.sales));
  const nice = niceCeil(max);
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const step = innerW / Math.max(1, daily.length);
  const bar = Math.max(1, Math.min(28, step * 0.7));
  const ticks = [0, 0.5, 1].map((f) => f * nice);
  const labelEvery = Math.max(1, Math.ceil(daily.length / 8));
  const total = daily.reduce((s, d) => s + d.sales, 0);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Daily sales, ${formatPrice(total)} in total`}>
        {ticks.map((t) => {
          const y = pad.top + innerH - (t / nice) * innerH;
          return (
            <g key={t}>
              <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke="#023025" strokeOpacity={0.08} />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize={11} fill="#13261f" fillOpacity={0.55}>
                ${Math.round(t)}
              </text>
            </g>
          );
        })}
        {daily.map((d, i) => {
          const h = (d.sales / nice) * innerH;
          const x = pad.left + i * step + (step - bar) / 2;
          return (
            <g key={d.day}>
              <rect x={x} y={pad.top + innerH - h} width={bar} height={Math.max(h, d.sales > 0 ? 1 : 0)} rx={Math.min(4, bar / 2)} fill="#023025">
                <title>{`${shortDay.format(new Date(`${d.day}T00:00:00Z`))}: ${formatPrice(d.sales)} · ${d.orders} ${d.orders === 1 ? 'order' : 'orders'}`}</title>
              </rect>
              {i % labelEvery === 0 ? (
                <text x={x + bar / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="#13261f" fillOpacity={0.55}>
                  {shortDay.format(new Date(`${d.day}T00:00:00Z`))}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
    </figure>
  );
}

function niceCeil(value: number): number {
  const exp = 10 ** Math.floor(Math.log10(value));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * exp >= value) return m * exp;
  return 10 * exp;
}

/** Horizontal bars for a breakdown (collections, sources, statuses). */
export function BarList({ rows, format = (n) => String(n) }: { rows: { label: string; value: number; hint?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <p className="text-sm text-ink/60">Nothing in this period yet.</p>;
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate font-medium text-forest">{r.label}</span>
            <span className="shrink-0 text-ink/70 tabular-nums">
              {format(r.value)}
              {r.hint ? <span className="ml-1 text-xs text-ink/50">{r.hint}</span> : null}
            </span>
          </div>
          <div className="mt-1 h-2 rounded-full bg-forest/10">
            <div className="h-2 rounded-full bg-saffron" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}
