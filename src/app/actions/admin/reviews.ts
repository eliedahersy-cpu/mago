'use server';

import { refresh, updateTag } from 'next/cache';
import { z } from 'zod';
import { requireStaff } from '@/lib/auth/dal';
import { dbErrorMessage } from '@/lib/admin/db-error';
import { type ActionResult, text } from '@/lib/admin/form-data';
import { CACHE_TAGS } from '@/lib/data/cached';
import { createClient } from '@/lib/supabase/server';

const UUID = z.uuid();

/** Approve, reject or delete a review. Ratings on products follow approved reviews (database trigger). */
export async function moderateReview(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireStaff('/admin/reviews');
  const id = text(fd, 'reviewId');
  const action = text(fd, 'action');
  if (!UUID.safeParse(id).success || !['approved', 'rejected', 'pending', 'delete'].includes(action)) {
    return { ok: false, error: 'Review not found.' };
  }
  const supabase = await createClient();
  const { error } =
    action === 'delete'
      ? await supabase.from('reviews').delete().eq('id', id)
      : await supabase.from('reviews').update({ status: action }).eq('id', id);
  if (error) return { ok: false, error: dbErrorMessage(error) };
  // Approved reviews and the product's stars show in the shop at once.
  updateTag(CACHE_TAGS.reviews);
  updateTag(CACHE_TAGS.catalog);
  refresh();
  const done: Record<string, string> = { approved: 'Published.', rejected: 'Rejected.', delete: 'Deleted.', pending: 'Moved back to waiting.' };
  return { ok: true, message: done[action] };
}
