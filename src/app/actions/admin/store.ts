'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/dal';
import { dbErrorMessage } from '@/lib/admin/db-error';
import { parseDiscountForm } from '@/lib/admin/discount-form';
import { type ActionResult, text } from '@/lib/admin/form-data';
import { parseSettingsForm } from '@/lib/admin/settings-form';
import { CACHE_TAGS } from '@/lib/data/cached';
import { createClient } from '@/lib/supabase/server';

const UUID = z.uuid();

// ---------------------------------------------------------------------------- discounts

export async function saveDiscount(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/discounts');
  const id = text(fd, 'id');
  if (id && !UUID.safeParse(id).success) return { ok: false, error: 'Discount not found.' };
  const parsed = parseDiscountForm(fd);
  if (!parsed.ok) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: parsed.fieldErrors };
  const d = parsed.data;
  const row = {
    code: d.code,
    title: d.title,
    kind: d.kind,
    value: d.kind === 'free_shipping' ? 0 : d.value,
    applies_to: d.appliesTo,
    min_subtotal: d.minSubtotal,
    min_cup_quantity: d.minCupQuantity,
    starts_at: d.startsAt,
    ends_at: d.endsAt,
    usage_limit: d.usageLimit,
    once_per_customer: d.oncePerCustomer,
    is_automatic: d.isAutomatic,
    is_active: d.isActive,
  };
  const supabase = await createClient();
  if (d.code) {
    // Codes are matched without case at checkout, so two codes may not differ only by case.
    let clash = supabase.from('discounts').select('id').ilike('code', d.code.replace(/[\\%_]/g, (c) => `\\${c}`));
    if (id) clash = clash.neq('id', id);
    const { data: other } = await clash.limit(1);
    if (other?.length) return { ok: false, error: 'That code is already used.', fieldErrors: { code: 'That code is already used.' } };
  }
  let discountId = id;
  if (id) {
    const { error } = await supabase.from('discounts').update(row).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error) };
  } else {
    const { data, error } = await supabase.from('discounts').insert(row).select('id').single();
    if (error) return { ok: false, error: dbErrorMessage(error) };
    discountId = String(data.id);
  }
  updateTag(CACHE_TAGS.discounts);
  if (!id) redirect(`/admin/discounts/${discountId}`);
  refresh();
  return { ok: true, message: 'Discount saved.' };
}

export async function deleteDiscount(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/discounts');
  const id = text(fd, 'id');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Discount not found.' };
  const supabase = await createClient();
  const { error } = await supabase.from('discounts').delete().eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.discounts);
  redirect('/admin/discounts');
}

// ---------------------------------------------------------------------------- settings & staff

export async function saveSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/settings');
  const parsed = parseSettingsForm(fd);
  if (!parsed.ok) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: parsed.fieldErrors };
  const s = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from('settings')
    .update({
      store_name: s.storeName,
      contact_email: s.contactEmail,
      contact_phone: s.contactPhone,
      shipping_flat_fee: s.shippingFlatFee,
      free_shipping_threshold: s.freeShippingThreshold,
      delivery_areas: s.deliveryAreas,
      announcement_bar: s.announcementBar,
      social_links: s.socialLinks,
    })
    .eq('id', true);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.settings);
  refresh();
  return { ok: true, message: 'Settings saved.' };
}

/** Owner only (admin_set_role checks): gives an existing account a role. */
export async function setStaffRole(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const me = await requireStaff('/admin/settings');
  if (me.role !== 'owner') return { ok: false, error: 'Only the owner can change who has admin access.' };
  const email = text(fd, 'email').toLowerCase();
  const role = text(fd, 'role');
  if (!z.email().safeParse(email).success) return { ok: false, error: 'Enter the email of an existing account.', fieldErrors: { email: 'Enter a valid email.' } };
  if (!['owner', 'staff', 'customer'].includes(role)) return { ok: false, error: 'Choose a role.' };
  const supabase = await createClient();
  const { error } = await supabase.rpc('admin_set_role', { p_email: email, p_role: role });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  refresh();
  return { ok: true, message: role === 'customer' ? `${email} no longer has admin access.` : `${email} is now ${role}.` };
}
