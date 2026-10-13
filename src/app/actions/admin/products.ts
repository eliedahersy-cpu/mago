'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/dal';
import { dbErrorMessage } from '@/lib/admin/db-error';
import type { ActionResult } from '@/lib/admin/form-data';
import { parseProductForm, PRODUCT_STATUSES, toProductRow } from '@/lib/admin/product-form';
import { CACHE_TAGS } from '@/lib/data/cached';
import { createClient } from '@/lib/supabase/server';

const UUID = z.uuid();
const BUCKET = 'product-images';

function field(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Product edits show in the shop (and on recipe cards that name the cup) straight away. */
function catalogChanged() {
  updateTag(CACHE_TAGS.catalog);
  updateTag(CACHE_TAGS.recipes);
}

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function setCollections(supabase: Supabase, productId: string, collectionIds: string[]) {
  const { error: delError } = await supabase.from('collection_products').delete().eq('product_id', productId);
  if (delError) return delError;
  if (!collectionIds.length) return null;
  const { error } = await supabase
    .from('collection_products')
    .insert(collectionIds.map((collection_id, position) => ({ collection_id, product_id: productId, position: 100 + position })));
  return error;
}

/** Creates (no id) or updates a product from the editor form. */
export async function saveProduct(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/products');
  const id = field(fd, 'id');
  if (id && !UUID.safeParse(id).success) return { ok: false, error: 'Product not found.' };
  const parsed = parseProductForm(fd);
  if (!parsed.ok) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: parsed.fieldErrors };
  const p = parsed.data;
  const supabase = await createClient();

  const row = toProductRow(p);
  let productId = id;
  if (id) {
    const { error } = await supabase.from('products').update(row).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error), fieldErrors: error.code === '23505' ? { slug: 'This URL or SKU is already used.' } : undefined };
  } else {
    // New products start with the stock typed in; later changes go through Inventory so they are logged.
    const { data, error } = await supabase.from('products').insert({ ...row, stock: p.stock }).select('id').single();
    if (error) return { ok: false, error: dbErrorMessage(error), fieldErrors: error.code === '23505' ? { slug: 'This URL or SKU is already used.' } : undefined };
    productId = String(data.id);
  }

  const collectionsError = await setCollections(supabase, productId, p.collectionIds);
  if (collectionsError) return { ok: false, error: dbErrorMessage(collectionsError, 'Saved, but the collections could not be updated.') };

  catalogChanged();
  if (!id) redirect(`/admin/products/${productId}?created=1`);
  refresh();
  return { ok: true, message: 'Product saved.' };
}

export async function setProductStatus(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/products');
  const id = field(fd, 'id');
  const status = field(fd, 'status');
  if (!UUID.safeParse(id).success || !(PRODUCT_STATUSES as readonly string[]).includes(status)) return { ok: false, error: 'Choose a valid status.' };
  const supabase = await createClient();
  const { error } = await supabase.from('products').update({ status }).eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  catalogChanged();
  refresh();
  return { ok: true, message: status === 'archived' ? 'Archived: it no longer shows in the shop.' : status === 'draft' ? 'Moved to draft: hidden from the shop.' : 'Active: it shows in the shop.' };
}

/** Copies a product (as a draft, without stock or images) and opens the copy. */
export async function duplicateProduct(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/products');
  const id = field(fd, 'id');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Product not found.' };
  const supabase = await createClient();
  const { data: source, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error || !source) return { ok: false, error: dbErrorMessage(error, 'Product not found.') };
  const stamp = Date.now().toString(36);
  const copy = { ...source } as Record<string, unknown>;
  for (const key of ['id', 'created_at', 'updated_at', 'rating_avg', 'rating_count']) delete copy[key];
  copy.name = `${source.name} (copy)`;
  copy.slug = `${source.slug}-copy-${stamp}`;
  copy.sku = source.sku ? `${source.sku}-COPY-${stamp}`.toUpperCase() : null;
  copy.status = 'draft';
  copy.stock = 0;
  const { data, error: insertError } = await supabase.from('products').insert(copy).select('id').single();
  if (insertError) return { ok: false, error: dbErrorMessage(insertError) };
  const { data: links } = await supabase.from('collection_products').select('collection_id, position').eq('product_id', id);
  if (links?.length) await supabase.from('collection_products').insert(links.map((l) => ({ ...l, product_id: data.id })));
  catalogChanged();
  redirect(`/admin/products/${data.id}?created=1`);
}

// ---------------------------------------------------------------------------- images

/** Storage path inside the bucket for a public URL we created, or null for any other URL. */
function storagePath(url: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const at = url.indexOf(marker);
  return at < 0 ? null : decodeURIComponent(url.slice(at + marker.length));
}

/** Records an image the browser has just uploaded to the product-images bucket. */
export async function addProductImage(input: { productId: string; path: string; alt: string }): Promise<ActionResult> {
  await requireStaff('/admin/products');
  if (!UUID.safeParse(input.productId).success || !input.path.startsWith(`${input.productId}/`) || input.path.includes('..')) {
    return { ok: false, error: 'That upload does not belong to this product.' };
  }
  const supabase = await createClient();
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(input.path);
  const { data: last } = await supabase
    .from('product_images')
    .select('position')
    .eq('product_id', input.productId)
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await supabase.from('product_images').insert({
    product_id: input.productId,
    url: pub.publicUrl,
    alt: input.alt.slice(0, 200),
    position: (last?.position ?? -1) + 1,
    kind: 'packshot',
  });
  if (error) return { ok: false, error: dbErrorMessage(error) };
  catalogChanged();
  refresh();
  return { ok: true, message: 'Image added.' };
}

export async function updateProductImage(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/products');
  const id = field(fd, 'imageId');
  const kind = field(fd, 'kind');
  if (!UUID.safeParse(id).success || !['packshot', 'lifestyle', 'video'].includes(kind)) return { ok: false, error: 'Image not found.' };
  const supabase = await createClient();
  const { error } = await supabase.from('product_images').update({ alt: field(fd, 'alt').slice(0, 200), kind }).eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  catalogChanged();
  refresh();
  return { ok: true, message: 'Image updated.' };
}

/** Moves an image one place earlier or later. */
export async function moveProductImage(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/products');
  const productId = field(fd, 'productId');
  const id = field(fd, 'imageId');
  const dir = field(fd, 'dir') === 'up' ? -1 : 1;
  if (!UUID.safeParse(productId).success || !UUID.safeParse(id).success) return { ok: false, error: 'Image not found.' };
  const supabase = await createClient();
  const { data: images, error } = await supabase.from('product_images').select('id, position').eq('product_id', productId).order('position');
  if (error) return { ok: false, error: dbErrorMessage(error) };
  const order = (images ?? []).map((i) => String(i.id));
  const at = order.indexOf(id);
  const to = at + dir;
  if (at < 0 || to < 0 || to >= order.length) return { ok: true };
  [order[at], order[to]] = [order[to], order[at]];
  for (const [position, imageId] of order.entries()) {
    const { error: updateError } = await supabase.from('product_images').update({ position }).eq('id', imageId);
    if (updateError) return { ok: false, error: dbErrorMessage(updateError) };
  }
  catalogChanged();
  refresh();
  return { ok: true };
}

export async function deleteProductImage(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/products');
  const id = field(fd, 'imageId');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Image not found.' };
  const supabase = await createClient();
  const { data: image, error } = await supabase.from('product_images').delete().eq('id', id).select('url').maybeSingle();
  if (error) return { ok: false, error: dbErrorMessage(error) };
  const path = image ? storagePath(String(image.url)) : null;
  if (path) await supabase.storage.from(BUCKET).remove([path]);
  catalogChanged();
  refresh();
  return { ok: true, message: 'Image removed.' };
}
