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

// ---------------------------------------------------------------------------- collections

const collectionSchema = z.object({
  title: z.string().min(1, 'Enter a title.').max(80),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes.').max(80),
  description: z.string().max(400).nullable(),
  sortOrder: z.number().int('Use a whole number.'),
  isVisible: z.boolean(),
  productIds: z.array(z.uuid()),
});

export async function saveCollection(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/collections');
  const id = text(fd, 'id');
  if (id && !UUID.safeParse(id).success) return { ok: false, error: 'Collection not found.' };
  const title = text(fd, 'title');
  const parsed = parseWith(collectionSchema, {
    title,
    slug: text(fd, 'slug') || slugify(title),
    description: optionalText(fd, 'description'),
    sortOrder: num(fd, 'sortOrder') ?? 0,
    isVisible: checkbox(fd, 'isVisible'),
    productIds: all(fd, 'productIds').filter((p) => UUID.safeParse(p).success),
  });
  if (!parsed.ok) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: parsed.fieldErrors };
  const c = parsed.data;
  const supabase = await createClient();
  const row = { title: c.title, slug: c.slug, description: c.description, sort_order: c.sortOrder, is_visible: c.isVisible };
  let collectionId = id;
  if (id) {
    const { error } = await supabase.from('collections').update(row).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error), fieldErrors: error.code === '23505' ? { slug: 'This URL is already used.' } : undefined };
  } else {
    const { data, error } = await supabase.from('collections').insert(row).select('id').single();
    if (error) return { ok: false, error: dbErrorMessage(error), fieldErrors: error.code === '23505' ? { slug: 'This URL is already used.' } : undefined };
    collectionId = String(data.id);
  }
  const { error: delError } = await supabase.from('collection_products').delete().eq('collection_id', collectionId);
  if (delError) return { ok: false, error: dbErrorMessage(delError) };
  if (c.productIds.length) {
    const { error } = await supabase
      .from('collection_products')
      .insert(c.productIds.map((product_id, position) => ({ collection_id: collectionId, product_id, position })));
    if (error) return { ok: false, error: dbErrorMessage(error) };
  }
  updateTag(CACHE_TAGS.catalog);
  if (!id) redirect(`/admin/collections/${collectionId}`);
  refresh();
  return { ok: true, message: 'Collection saved.' };
}

export async function deleteCollection(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/collections');
  const id = text(fd, 'id');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Collection not found.' };
  const supabase = await createClient();
  const { error } = await supabase.from('collections').delete().eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.catalog);
  redirect('/admin/collections');
}

// ---------------------------------------------------------------------------- inventory

/** Adds or removes stock with a reason; adjust_stock logs who did it and refuses to go below zero. */
export async function adjustStock(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/inventory');
  const id = text(fd, 'productId');
  const reason = text(fd, 'reason');
  const amount = num(fd, 'amount');
  const direction = text(fd, 'direction') === 'remove' ? -1 : 1;
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Product not found.' };
  if (!['restock', 'adjustment'].includes(reason)) return { ok: false, error: 'Choose a reason.' };
  if (amount === null || !Number.isInteger(amount) || amount <= 0 || amount > 100000) {
    return { ok: false, error: 'Enter a whole number of units.', fieldErrors: { amount: 'Enter a whole number of units.' } };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_product: id,
    p_delta: direction * amount,
    p_reason: reason,
    p_note: text(fd, 'note').slice(0, 300) || null,
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.catalog);
  refresh();
  return { ok: true, message: `Stock is now ${data}.` };
}

/** Low-stock level and whether a product sells when out of stock. */
export async function saveStockSettings(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/inventory');
  const id = text(fd, 'productId');
  const threshold = num(fd, 'lowStockThreshold');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Product not found.' };
  if (threshold === null || !Number.isInteger(threshold) || threshold < 0) return { ok: false, error: 'Enter a whole number for the low-stock level.' };
  const supabase = await createClient();
  const { error } = await supabase
    .from('products')
    .update({ low_stock_threshold: threshold, track_inventory: checkbox(fd, 'trackInventory'), allow_backorder: checkbox(fd, 'allowBackorder') })
    .eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.catalog);
  refresh();
  return { ok: true, message: 'Saved.' };
}

// ---------------------------------------------------------------------------- customers

export async function saveCustomerNotes(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/customers');
  const id = text(fd, 'customerId');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Customer not found.' };
  const notes = text(fd, 'notes');
  if (notes.length > 2000) return { ok: false, error: 'Keep notes under 2,000 characters.' };
  const tags = [
    ...new Set(
      text(fd, 'tags')
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 20);
  if (tags.some((t) => t.length > 30)) return { ok: false, error: 'Keep each tag under 30 characters.' };
  const supabase = await createClient();
  const { error } = await supabase.from('customers').update({ notes: notes || null, tags }).eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  refresh();
  return { ok: true, message: 'Customer saved.' };
}
