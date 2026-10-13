'use server';

import { dbErrorMessage } from '@/lib/admin/db-error';
import type { ActionResult } from '@/lib/admin/form-data';
import { getUser } from '@/lib/auth/dal';
import { parseReviewForm } from '@/lib/reviews/schema';
import { createClient } from '@/lib/supabase/server';

/** A signed-in customer's review. submit_review decides "verified buyer"; staff approve it before it shows. */
export async function submitReview(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  if (!(await getUser())) return { ok: false, error: 'Sign in to write a review.' };
  const parsed = parseReviewForm(fd);
  if (!parsed.ok) return { ok: false, error: 'Please check the highlighted fields.', fieldErrors: parsed.fieldErrors };
  const r = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc('submit_review', { p_product: r.productId, p_rating: r.rating, p_title: r.title, p_body: r.body });
  if (error) return { ok: false, error: dbErrorMessage(error, 'We could not save your review. Please try again.') };
  return { ok: true, message: 'Thank you! Your review will appear once our team has read it.' };
}
