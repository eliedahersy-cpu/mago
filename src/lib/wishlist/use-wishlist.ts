'use client';

import { useEffect } from 'react';
import { create } from 'zustand';
import { syncWishlist } from '@/app/actions/wishlist';
import { createClient } from '@/lib/supabase/browser';
import { useWishlist } from './store';

/** Whether someone is signed in, from the session cookie. For UI only: the server re-checks. */
export const useAuthStatus = create<{ signedIn: boolean }>(() => ({ signedIn: false }));

export const WISHLIST_SYNCED_KEY = 'mago-wishlist-synced';

/** Reads the saved wishlist once on the client; returns whether it has been read yet. */
export function useHydratedWishlist(): boolean {
  const hydrated = useWishlist((s) => s.hydrated);
  useEffect(() => {
    if (!useWishlist.persist.hasHydrated()) void useWishlist.persist.rehydrate();
  }, []);
  return hydrated;
}

/** Merges this browser's wishlist into the account and keeps the merged list locally. */
export async function mergeWishlistIntoAccount(): Promise<boolean> {
  const ids = await syncWishlist(useWishlist.getState().ids);
  if (!ids) return false;
  useWishlist.getState().replace(ids);
  return true;
}

/**
 * Mounted once in the store layout: tracks the sign-in state and, once per browser session
 * after signing in, merges the guest wishlist into the account.
 */
export function useWishlistSync(): void {
  const hydrated = useHydratedWishlist();
  const signedIn = useAuthStatus((s) => s.signedIn);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getSession().then(({ data }) => useAuthStatus.setState({ signedIn: Boolean(data.session) }));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => useAuthStatus.setState({ signedIn: Boolean(session) }));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hydrated || !signedIn) return;
    try {
      if (window.sessionStorage.getItem(WISHLIST_SYNCED_KEY)) return;
    } catch {
      // Storage blocked: merge on every page load instead.
    }
    void mergeWishlistIntoAccount()
      .then((ok) => {
        if (!ok) return;
        try {
          window.sessionStorage.setItem(WISHLIST_SYNCED_KEY, '1');
        } catch {
          // ignore
        }
      })
      .catch(() => undefined);
  }, [hydrated, signedIn]);
}
