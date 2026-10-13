const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatPrice(amount: number): string {
  return usd.format(amount);
}

const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Beirut' });

/** e.g. "13 Oct 2026", in Lebanon time. */
export function formatDate(iso: string): string {
  return shortDate.format(new Date(iso));
}
