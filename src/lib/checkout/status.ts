const LABELS: Record<string, string> = {
  pending: 'Order received',
  confirmed: 'Confirmed',
  preparing: 'Being prepared',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/** How an order status reads to a customer. */
export function orderStatusLabel(status: string): string {
  return LABELS[status] ?? status;
}
