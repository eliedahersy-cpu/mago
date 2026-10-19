/** Email templates in the style of Shopify's default notifications, in MAGO colours. Pure functions: no I/O. */

export interface MailOrder {
  number: number;
  status: string;
  created_at: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  shipping_address: Record<string, string | null | undefined> | null;
  special_instructions: string | null;
  is_gift: boolean;
  gift_note: string | null;
  subtotal: number | string;
  discount_total: number | string;
  shipping_total: number | string;
  total: number | string;
  discount_code: string | null;
  payment_method: string;
  items: {
    name: string;
    flavour: string | null;
    unit_price: number | string;
    quantity: number;
    line_total: number | string;
    children?: { name: string; flavour: string | null; quantity: number }[];
  }[];
}

export interface MailBrand {
  storeName: string;
  siteUrl: string;
  contactEmail: string | null;
}

const FOREST = '#023025';

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const money = (v: number | string) => `$${Number(v).toFixed(2)}`;
const itemName = (i: { name: string; flavour: string | null }) => [i.name, i.flavour].filter(Boolean).join(' ');

function layout(brand: MailBrand, title: string, body: string): string {
  const contact = brand.contactEmail
    ? `reply to this email or write to <a href="mailto:${esc(brand.contactEmail)}" style="color:${FOREST};">${esc(brand.contactEmail)}</a>`
    : 'reply to this email';
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>${esc(title)}</title></head>
<body style="margin:0;background:#f9e9d1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fdf6ec;border-radius:16px;">
<tr><td style="padding:28px 28px 8px;"><a href="${esc(brand.siteUrl)}" style="text-decoration:none;color:${FOREST};font-size:30px;font-weight:800;letter-spacing:1px;">${esc(brand.storeName)}</a></td></tr>
${body}
<tr><td style="padding:24px 28px 28px;border-top:1px solid #ecdcc0;color:#8a7a62;font-size:13px;line-height:1.5;">Questions? ${contact}.</td></tr>
</table></td></tr></table></body></html>`;
}

const heading = (title: string, text: string) =>
  `<tr><td style="padding:12px 28px 20px;"><h2 style="margin:0 0 8px;font-size:24px;color:${FOREST};">${esc(title)}</h2><p style="margin:0;font-size:16px;line-height:1.5;color:#5c5242;">${text}</p></td></tr>`;

const button = (href: string, label: string) =>
  `<tr><td style="padding:0 28px 24px;"><a href="${esc(href)}" style="display:inline-block;background:${FOREST};color:#fdf6ec;text-decoration:none;font-size:15px;font-weight:700;padding:14px 26px;border-radius:999px;">${esc(label)}</a></td></tr>`;

const section = (title: string, inner: string) =>
  `<tr><td style="padding:20px 28px;border-top:1px solid #ecdcc0;"><h3 style="margin:0 0 12px;font-size:17px;color:${FOREST};">${esc(title)}</h3>${inner}</td></tr>`;

function summary(o: MailOrder): string {
  const rows = o.items
    .map((i) => {
      const kids = (i.children ?? []).map((c) => `<div style="color:#8a7a62;font-size:13px;">${c.quantity} × ${esc(itemName(c))}</div>`).join('');
      return `<tr><td style="padding:8px 0;font-size:15px;color:#333;">${esc(itemName(i))} × ${i.quantity}${kids}</td><td align="right" style="padding:8px 0;font-size:15px;font-weight:600;white-space:nowrap;">${money(i.line_total)}</td></tr>`;
    })
    .join('');
  const row = (label: string, value: string, strong = false) =>
    `<tr><td style="padding:3px 0;font-size:${strong ? 16 : 14}px;color:#5c5242;">${esc(label)}</td><td align="right" style="padding:3px 0;font-size:${strong ? 19 : 14}px;font-weight:${strong ? 700 : 500};">${value}</td></tr>`;
  const discount = Number(o.discount_total) > 0 ? row(`Discount${o.discount_code ? ` (${o.discount_code})` : ''}`, `-${money(o.discount_total)}`) : '';
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;border-top:1px solid #ecdcc0;padding-top:10px;">
${row('Subtotal', money(o.subtotal))}${discount}${row('Delivery', Number(o.shipping_total) === 0 ? 'Free' : money(o.shipping_total))}${row('Total', money(o.total), true)}</table>
<p style="margin:10px 0 0;font-size:13px;color:#8a7a62;">Payment: Cash on delivery. Please have the amount ready.</p>`;
}

function customerBlock(o: MailOrder): string {
  const a = o.shipping_address ?? {};
  const lines = [o.full_name ?? a.full_name, a.street, [a.building, a.floor].filter(Boolean).join(', '), [a.area, a.governorate].filter(Boolean).join(', '), o.phone]
    .filter((x): x is string => Boolean(x && String(x).trim()))
    .map(esc)
    .join('<br>');
  const notes = [o.special_instructions ? `<p style="margin:10px 0 0;font-size:14px;color:#5c5242;"><strong>Instructions:</strong> ${esc(o.special_instructions)}</p>` : '', o.is_gift && o.gift_note ? `<p style="margin:10px 0 0;font-size:14px;color:#5c5242;"><strong>Gift note:</strong> ${esc(o.gift_note)}</p>` : '']
    .join('');
  return `<p style="margin:0;font-size:14px;line-height:1.6;color:#333;">${lines}</p>${notes}`;
}

export function orderConfirmation(o: MailOrder, brand: MailBrand, trackUrl: string): { subject: string; html: string } {
  const body =
    heading('Thank you for your order!', `We've received order <strong>#${o.number}</strong> and we're getting it ready. You'll pay in cash when it arrives.`) +
    button(trackUrl, 'View your order') +
    section('Order summary', summary(o)) +
    section('Delivery details', customerBlock(o));
  return { subject: `Order #${o.number} confirmed`, html: layout(brand, `Order #${o.number} confirmed`, body) };
}

export function staffNewOrder(o: MailOrder, brand: MailBrand, adminUrl: string): { subject: string; html: string } {
  const body =
    heading(`New order #${o.number}`, `${esc(o.full_name ?? o.email)} just placed an order for <strong>${money(o.total)}</strong> (cash on delivery).`) +
    button(adminUrl, 'Open in admin') +
    section('Order summary', summary(o)) +
    section('Customer', `${customerBlock(o)}<p style="margin:10px 0 0;font-size:14px;">${esc(o.email)}</p>`);
  return { subject: `[${brand.storeName}] New order #${o.number} · ${money(o.total)}`, html: layout(brand, `New order #${o.number}`, body) };
}

const STATUS_COPY: Record<string, { subject: string; title: string; text: string } | undefined> = {
  confirmed: { subject: 'is confirmed', title: 'Your order is confirmed', text: 'We have confirmed your order and will start preparing it shortly.' },
  preparing: { subject: 'is being prepared', title: 'We are preparing your order', text: 'Your cups are being packed with care.' },
  out_for_delivery: { subject: 'is on its way', title: 'Your order is on its way', text: 'Our driver is heading to you now. Please keep your phone close and have the cash ready.' },
  delivered: { subject: 'was delivered', title: 'Your order was delivered', text: 'Enjoy your MAGO cups! If anything is not right, just reply to this email.' },
  cancelled: { subject: 'was cancelled', title: 'Your order was cancelled', text: 'Your order has been cancelled and nothing will be charged. If this is a surprise, reply to this email and we will help.' },
};

/** Null for statuses customers are not emailed about (for example "pending"). */
export function orderStatusUpdate(o: MailOrder, status: string, brand: MailBrand, trackUrl: string): { subject: string; html: string } | null {
  const c = STATUS_COPY[status];
  if (!c) return null;
  const body = heading(c.title, `${c.text} Order <strong>#${o.number}</strong>.`) + button(trackUrl, 'View your order') + section('Order summary', summary(o));
  return { subject: `Order #${o.number} ${c.subject}`, html: layout(brand, c.title, body) };
}
