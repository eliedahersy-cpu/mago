'use server';

import { refresh, updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/dal';
import { dbErrorMessage } from '@/lib/admin/db-error';
import { type ActionResult, text } from '@/lib/admin/form-data';
import { parseRecipeForm, toRecipeRow } from '@/lib/admin/recipe-form';
import { CACHE_TAGS } from '@/lib/data/cached';
import { createClient } from '@/lib/supabase/server';

const UUID = z.uuid();

export async function saveRecipe(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/recipes');
  const id = text(fd, 'id');
  if (id && !UUID.safeParse(id).success) return { ok: false, error: 'Recipe not found.' };
  const parsed = parseRecipeForm(fd);
  if (!parsed.ok) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: parsed.fieldErrors };
  const supabase = await createClient();
  const row = toRecipeRow(parsed.data);
  const slugTaken = (error: { code?: string }) => (error.code === '23505' ? { slug: 'This URL is already used.' } : undefined);
  let recipeId = id;
  if (id) {
    const { error } = await supabase.from('recipes').update(row).eq('id', id);
    if (error) return { ok: false, error: dbErrorMessage(error), fieldErrors: slugTaken(error) };
  } else {
    const { data, error } = await supabase.from('recipes').insert(row).select('id').single();
    if (error) return { ok: false, error: dbErrorMessage(error), fieldErrors: slugTaken(error) };
    recipeId = String(data.id);
  }
  updateTag(CACHE_TAGS.recipes);
  if (!id) redirect(`/admin/recipes/${recipeId}`);
  refresh();
  return { ok: true, message: parsed.data.status === 'published' ? 'Saved and published.' : 'Saved as a draft.' };
}

export async function deleteRecipe(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/recipes');
  const id = text(fd, 'id');
  if (!UUID.safeParse(id).success) return { ok: false, error: 'Recipe not found.' };
  const supabase = await createClient();
  const { error } = await supabase.from('recipes').delete().eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  updateTag(CACHE_TAGS.recipes);
  redirect('/admin/recipes');
}
