'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/dal';
import { dbErrorMessage } from '@/lib/admin/db-error';
import { all, checkbox, type ActionResult, num, optionalText, parseWith, text } from '@/lib/admin/form-data';
import { slugify } from '@/lib/admin/product-form';
import { CACHE_TAGS } from '@/lib/data/cached';
import { createClient } from '@/lib/supabase/server';

const UUID = z.uuid();

const link = (msg: string) =>
  z
    .string()
    .max(500)
    .refine((v) => {
      if (/^\/[A-Za-z0-9/_.-]+$/.test(v) && !v.includes('..')) return true;
      try {
        return new URL(v).protocol === 'https:';
      } catch {
        return false;
      }
    }, msg)
    .nullable();

const storeSchema = z
  .object({
    name: z.string().min(1, 'Enter the store name.').max(100),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes.').max(100),
    chain: z.string().max(60).nullable(),
    type: z.enum(['supermarket', 'minimarket', 'online', 'cafe_restaurant']),
    address: z.string().max(200).nullable(),
    area: z.string().max(80).nullable(),
    city: z.string().max(80).nullable(),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
    hours: z.string().max(120).nullable(),
    phone: z.string().max(40).nullable(),
    website: link('Use a full link starting with https://'),
    image: link('Use an uploaded photo, a site path or an https link.'),
    isActive: z.boolean(),
    productIds: z.array(z.uuid()),
  })
  .refine((s) => (s.lat === null) === (s.lng === null), { path: ['lng'], message: 'Enter both latitude and longitude, or neither.' });

export async function saveStore(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/stores');
  const id = text(fd, 'id');
  if (id && !UUID.safeParse(id).success) return { ok: false, error: 'Store not found.' };
  const name = text(fd, 'name');
  const parsed = parseWith(storeSchema, {
    name,
    slug: text(fd, 'slug') || (name ? slugify(name) : 'untitled'),
    chain: optionalText(fd, 'chain'),
    type: text(fd, 'type') || 'supermarket',
    address: optionalText(fd, 'address'),
    area: optionalText(fd, 'area'),
    city: optionalText(fd, 'city'),
    lat: num(fd, 'lat'),
    lng: num(fd, 'lng'),
    hours: optionalText(fd, 'hours'),
    phone: optionalText(fd, 'phone'),
    website: optionalText(fd, 'website'),
    image: optionalText(fd, 'image'),
    isActive: checkbox(fd, 'isActive'),
    productIds: all(fd, 'productIds').filter((p) => UUID.safeParse(p).success),
  });
  if (!parsed.ok) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: parsed.fieldErrors };
  const s = parsed.data;
  const row = {
    name: s.name,
    slug: s.slug,
    chain: s.chain,
    type: s.type,
    address: s.address,
    area: s.area,
    city: s.city,
    lat: s.lat,
    lng: s.lng,
    hours: s.hours ? { summary: s.hours } : {},
    phone: s.phone,
    website: s.website,
    image: s.image,
    is_active: s.isActive,
  };
  const supabase = await createClient();
  const slugTaken = (error: { code?: string }) => (error.code === '23505' ? { slug: 'This URL is already used.' } : undefined);
  let storeId = id;
  if (id) {
    const { error } = await supabase.from('stores').update(row).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error), fieldErrors: slugTaken(error) };
  } else {
    const { data, error } = await supabase.from('stores').insert(row).select('id').single();
    if (error) return { ok: false, error: dbErrorMessage(error), fieldErrors: slugTaken(error) };
    storeId = String(data.id);
  }
  const { error: delError } = await supabase.from('store_products').delete().eq('store_id', storeId);
  if (delError) return { ok: false, error: dbErrorMessage(delError) };
  if (s.productIds.length) {
    const { error } = await supabase.from('store_products').insert(s.productIds.map((product_id) => ({ store_id: storeId, product_id })));
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }
  updateTag(CACHE_TAGS.stores);
  if (!id) redirect(`/admin/stores/${storeId}`);
  refresh();
  return { ok: true, message: 'Store saved.' };
}

export async function deleteStore(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/stores');
  const id = text(fd, 'id');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Store not found.' };
  const supabase = await createClient();
  const { error } = await supabase.from('stores').delete().eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.stores);
  redirect('/admin/stores');
}
