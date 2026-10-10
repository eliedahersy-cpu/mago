const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatPrice(amount: number): string {
  return usd.format(amount);
}
