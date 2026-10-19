import { getSettings } from '@/lib/data/cached';
import { siteUrl } from '@/lib/seo/jsonld';
import { createPublicClient } from '@/lib/supabase/public';
import { orderConfirmation, orderStatusUpdate, staffNewOrder, type MailBrand, type MailOrder } from './templates';

// Transactional email through Resend's HTTP API, with every attempt written to email_log (see /admin).
// Without RESEND_API_KEY and EMAIL_FROM nothing is sent and the attempt is logged as "skipped", so the shop
// keeps working while email is being set up. Email never blocks or fails an order.

type Template = 'order_confirmation' | 'order_notification' | 'order_status';

interface Mail {
  to: string | string[];
  subject: string;
  html: string;
  template: Template;
  orderNumber: number;
  replyTo?: string | null;
}

async function log(entry: { to: string; subject: string; template: Template; order_number: number; status: 'sent' | 'skipped' | 'failed'; provider_id?: string; error?: string }) {
  try {
    await createPublicClient().rpc('log_email', { p: entry });
  } catch (error) {
    console.error('email log failed', error);
  }
}

async function send(mail: Mail): Promise<boolean> {
  const to = (Array.isArray(mail.to) ? mail.to : [mail.to]).filter(Boolean);
  if (to.length === 0) return false;
  const entry = { to: to.join(', '), subject: mail.subject, template: mail.template, order_number: mail.orderNumber };
  const key = process.env.RESEND_API_KEY ?? '';
  const from = process.env.EMAIL_FROM ?? '';
  if (!key || !from) {
    await log({ ...entry, status: 'skipped', error: !key ? 'RESEND_API_KEY is not set' : 'EMAIL_FROM is not set' });
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject: mail.subject, html: mail.html, ...(mail.replyTo ? { reply_to: mail.replyTo } : {}) }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      await log({ ...entry, status: 'failed', error: body.message ?? `HTTP ${res.status}` });
      return false;
    }
    await log({ ...entry, status: 'sent', provider_id: body.id });
    return true;
  } catch (error) {
    await log({ ...entry, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    return false;
  }
}

async function brand(): Promise<MailBrand> {
  const s = await getSettings();
  return { storeName: s.storeName, siteUrl: siteUrl(), contactEmail: s.contactEmail };
}

async function loadOrder(token: string): Promise<MailOrder | null> {
  const { data } = await createPublicClient().rpc('get_order_by_token', { token });
  return (data as MailOrder | null) ?? null;
}

/** The customer's confirmation and the shop's new-order alert. Never throws. */
export async function sendOrderPlacedEmails(token: string): Promise<void> {
  try {
    const order = await loadOrder(token);
    if (!order) return;
    const b = await brand();
    const confirmation = orderConfirmation(order, b, `${b.siteUrl}/order/${token}`);
    await send({ to: order.email, ...confirmation, template: 'order_confirmation', orderNumber: order.number, replyTo: b.contactEmail });
    const staffTo = process.env.NOTIFY_EMAIL || b.contactEmail;
    if (staffTo) {
      const alert = staffNewOrder(order, b, `${b.siteUrl}/admin/orders/${order.number}`);
      await send({ to: staffTo, ...alert, template: 'order_notification', orderNumber: order.number });
    }
  } catch (error) {
    console.error('order emails failed', error);
  }
}

/** Tells the customer their order moved on (confirmed, on its way, delivered, cancelled). Never throws. */
export async function sendOrderStatusEmail(token: string, status: string): Promise<void> {
  try {
    const order = await loadOrder(token);
    if (!order) return;
    const b = await brand();
    const mail = orderStatusUpdate(order, status, b, `${b.siteUrl}/order/${token}`);
    if (!mail) return;
    await send({ to: order.email, ...mail, template: 'order_status', orderNumber: order.number, replyTo: b.contactEmail });
  } catch (error) {
    console.error('status email failed', error);
  }
}
