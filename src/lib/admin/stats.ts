/** Dashboard helpers: date ranges in Lebanon time, period-over-period change, CSV export. */

export type RangeKey = 'today' | '7d' | '30d' | '90d' | 'ytd';

export const RANGES: { key: RangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '90d', label: 'Last 90 days' },
  { key: 'ytd', label: 'Year to date' },
];

const TZ = 'Asia/Beirut';
const DAY = 86_400_000;

/** UTC offset (hours) of Beirut at a given instant, e.g. 3 in summer, 2 in winter. */
function beirutOffset(at: Date): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: TZ, timeZoneName: 'shortOffset' })
    .formatToParts(at)
    .find((p) => p.type === 'timeZoneName')?.value;
  const match = /GMT([+-]\d+)(?::(\d+))?/.exec(name ?? '');
  return match ? Number(match[1]) + Math.sign(Number(match[1])) * (Number(match[2] ?? 0) / 60) : 0;
}

/** The instant Beirut's clocks read 00:00 on the given calendar day. */
function beirutMidnight(year: number, month: number, day: number): Date {
  const guess = Date.UTC(year, month - 1, day);
  return new Date(guess - beirutOffset(new Date(guess)) * 3_600_000);
}

function beirutToday(now: Date): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

/** A range of whole Beirut days ending at the end of today. Unknown values mean the last 30 days. */
export function rangeFromParam(param: string | string[] | undefined, now: Date = new Date()): { key: RangeKey; label: string; from: Date; to: Date } {
  const raw = Array.isArray(param) ? param[0] : param;
  const range = RANGES.find((r) => r.key === raw) ?? RANGES.find((r) => r.key === '30d')!;
  const { y, m, d } = beirutToday(now);
  const to = beirutMidnight(y, m, d + 1);
  const days = { today: 1, '7d': 7, '30d': 30, '90d': 90 } as const;
  const from = range.key === 'ytd' ? beirutMidnight(y, 1, 1) : beirutMidnight(y, m, d + 1 - days[range.key]);
  return { key: range.key, label: range.label, from, to };
}

/** Change from `previous` to `current` in percent (one decimal); null when there is nothing to compare with. */
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** Number of whole days in a range (for charts). */
export function rangeDays(from: Date, to: Date): number {
  return Math.max(1, Math.round((to.getTime() - from.getTime()) / DAY));
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return String(value);
  // A leading = + - @ would run as a formula when the file is opened in a spreadsheet.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** Rows to CSV text (RFC 4180, CRLF between rows). */
export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

/** A datetime-local value typed in Lebanon time ("2026-10-20T10:00") as an ISO instant, or null if malformed. */
export function beirutLocalToIso(value: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const at = new Date(guess - beirutOffset(new Date(guess)) * 3_600_000);
  return Number.isNaN(at.getTime()) ? null : at.toISOString();
}

/** An ISO instant as a datetime-local value in Lebanon time (for form defaults). */
export function isoToBeirutLocal(iso: string | null): string {
  if (!iso) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}
