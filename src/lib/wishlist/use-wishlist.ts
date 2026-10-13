'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { syncWishlist } from '@/app/actions/wishlist';
import { createClient } from '@/lib/supabase/browser';
import { idsToUpload } from './ids';
import { useWishlist } from './store';

/** Who is signed in, from the session cookie. For UI only: the server re-checks. */
export const useAuthStatus = create<{ signedIn: boolean; userId: string | null }>(() => ({ signedIn: false, userId: null }));

export const WISHLIST_SYNCED_KEY = 'mago-wishlist-synced';

/** Reads the saved wishlist once on the client; returns whether it has been read yet. */
export function useHydratedWishlist(): boolean {
  const hydrated = useWishlist((s) => s.hydrated);
  useEffect(() => {
    if (!useWishlist.persist.hasHydrated()) void useWishlist.persist.rehydrate();
  }, []);
  return hydrated;
}

/**
 * Brings this browser's wishlist in line with the account: a guest's list is added to the
 * account once; after that the account's list (from the server) replaces the local copy.
 */
export async function syncWithAccount(userId: string): Promise<boolean> {
  const { owner, ids } = useWishlist.getState();
  const serverIds = await syncWishlist(idsToUpload(owner, userId, ids));
  if (!serverIds) return false;
  useWishlist.getState().adopt(userId, serverIds);
  return true;
}

/** Signing out leaves no trace of the account's wishlist or sign-in state in this browser. */
export function forgetAccountData(): void {
  useWishlist.getState().forget();
  useAuthStatus.setState({ signedIn: false, userId: null });
  try {
    window.sessionStorage.removeItem(WISHLIST_SYNCED_KEY);
  } catch {
    // ignore
  }
}

/**
 * Mounted once in the store layout: tracks who is signed in and syncs the wishlist with the
 * account once per browser session (and whenever the stored list belongs to someone else).
 */
export function useWishlistSync(): void {
  const hydrated = useHydratedWishlist();
  const userId = useAuthStatus((s) => s.userId);
  const owner = useWishlist((s) => s.owner);

  useEffect(() => {
    const supabase = createClient();
    const apply = (id: string | null) => useAuthStatus.setState({ signedIn: id !== null, userId: id });
    void supabase.auth.getSession().then(({ data }) => apply(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => apply(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated || !userId) return;
    let synced = false;
    try {
      synced = window.sessionStorage.getItem(WISHLIST_SYNCED_KEY) === userId;
    } catch {
      // Storage blocked: sync on every page load instead.
    }
    if (synced && owner === userId) return;
    void syncWithAccount(userId)
      .then((ok) => {
        if (!ok) return;
        try {
          window.sessionStorage.setItem(WISHLIST_SYNCED_KEY, userId);
        } catch {
          // ignore
        }
      })
      .catch(() => undefined);
  }, [hydrated, userId, owner]);
}
