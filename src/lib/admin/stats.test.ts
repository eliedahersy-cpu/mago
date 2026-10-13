import { beirutLocalToIso, isoToBeirutLocal, percentChange, rangeFromParam, toCsv } from '@/lib/admin/stats';

const now = new Date('2026-10-13T09:00:00Z'); // 12:00 in Beirut (UTC+3)

test('percent change against the previous period', () => {
  expect(percentChange(150, 100)).toBe(50);
  expect(percentChange(50, 200)).toBe(-75);
  expect(percentChange(1, 3)).toBe(-66.7);
  expect(percentChange(10, 0)).toBeNull();
  expect(percentChange(0, 0)).toBeNull();
});

test('ranges are whole days in Beirut time, ending tonight', () => {
  const week = rangeFromParam('7d', now);
  expect(week.key).toBe('7d');
  expect(week.from.toISOString()).toBe('2026-10-06T21:00:00.000Z');
  expect(week.to.toISOString()).toBe('2026-10-13T21:00:00.000Z');
  expect(rangeFromParam('today', now).from.toISOString()).toBe('2026-10-12T21:00:00.000Z');
  expect(rangeFromParam('90d', now).from.toISOString()).toBe('2026-07-15T21:00:00.000Z');
});

test('year to date starts on 1 January in winter time', () => {
  expect(rangeFromParam('ytd', now).from.toISOString()).toBe('2025-12-31T22:00:00.000Z');
});

test('unknown or repeated range params fall back to 30 days', () => {
  const r = rangeFromParam('forever', now);
  expect(r.key).toBe('30d');
  expect(r.from.toISOString()).toBe('2026-09-13T21:00:00.000Z');
  expect(rangeFromParam(['7d', '90d'], now).key).toBe('7d');
  expect(rangeFromParam(undefined, now).label).toBe('Last 30 days');
});

test('CSV quotes what needs quoting and defuses spreadsheet formulas', () => {
  expect(toCsv([['Number', 'Customer', 'Total'], [1001, 'Smith, Jo', 12.5]])).toBe('Number,Customer,Total\r\n1001,"Smith, Jo",12.5');
  expect(toCsv([['He said "hi"', 'two\nlines', null]])).toBe('"He said ""hi""","two\nlines",');
  expect(toCsv([['=SUM(A1)', '+961 70', '@x', -5]])).toBe("'=SUM(A1),'+961 70,'@x,-5");
});

test('datetime-local values are Lebanon time', () => {
  expect(beirutLocalToIso('2026-10-20T10:00')).toBe('2026-10-20T07:00:00.000Z');
  expect(beirutLocalToIso('2026-12-01T10:00')).toBe('2026-12-01T08:00:00.000Z');
  expect(beirutLocalToIso('20/10/2026')).toBeNull();
  expect(isoToBeirutLocal('2026-10-20T07:00:00.000Z')).toBe('2026-10-20T10:00');
  expect(isoToBeirutLocal(null)).toBe('');
});
