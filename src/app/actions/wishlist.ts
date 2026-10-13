'use server';

import { z } from 'zod';
import { getUser } from '@/lib/auth/dal';
import { MAX_WISHLIST } from '@/lib/wishlist/ids';
import { createClient } from '@/lib/supabase/server';

const idSchema = z.uuid();
const idsSchema = z.array(idSchema).max(MAX_WISHLIST);

/** Saves or removes one product for the signed-in customer. Guests keep theirs in the browser only. */
export async function setWishlisted(productId: string, saved: boolean): Promise<{ ok: boolean }> {
  const user = await getUser();
  const id = idSchema.safeParse(productId);
  if (!user || !id.success) return { ok: false };
  const supabase = await createClient();
  const { error } = saved
    ? await supabase.from('wishlist_items').upsert({ profile_id: user.id, product_id: id.data }, { ignoreDuplicates: true })
    : await supabase.from('wishlist_items').delete().eq('profile_id', user.id).eq('product_id', id.data);
  if (error) console.error('setWishlisted failed', error);
  return { ok: !error };
}

/**
 * Adds the browser's saved products to the account and returns the account's full list,
 * so a guest wishlist is kept after signing in. Returns null when nobody is signed in.
 */
export async function syncWishlist(localIds: string[]): Promise<string[] | null> {
  const user = await getUser();
  if (!user) return null;
  const parsed = idsSchema.safeParse(localIds);
  const supabase = await createClient();
  if (parsed.success && parsed.data.length > 0) {
    // Ids of products that no longer exist fail the foreign key; add them one by one.
    const { error } = await supabase
      .from('wishlist_items')
      .upsert(parsed.data.map((product_id) => ({ profile_id: user.id, product_id })), { ignoreDuplicates: true });
    if (error) {
      for (const product_id of parsed.data) {
        await supabase.from('wishlist_items').upsert({ profile_id: user.id, product_id }, { ignoreDuplicates: true });
      }
    }
  }
  const { data, error } = await supabase.from('wishlist_items').select('product_id').eq('profile_id', user.id).order('created_at');
  if (error) {
    console.error('syncWishlist failed', error);
    return null;
  }
  return (data ?? []).map((r) => r.product_id as string);
}
