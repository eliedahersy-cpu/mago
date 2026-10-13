import { redirect } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

export interface AccountUser {
  id: string;
  email: string;
  emailVerified: boolean;
  fullName: string | null;
}

/**
 * The signed-in user, verified with the Supabase Auth server (not just read from the cookie).
 * Cached per request, so pages and actions can call it freely.
 */
export const getUser = cache(async (): Promise<AccountUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const user = data.user;
  const fullName = typeof user.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : null;
  return { id: user.id, email: user.email ?? '', emailVerified: Boolean(user.email_confirmed_at), fullName };
});

/** The signed-in user, or a redirect to sign in that comes back to `nextPath`. */
export async function requireUser(nextPath: string): Promise<AccountUser> {
  const user = await getUser();
  if (!user) redirect(`/account/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export interface StaffUser extends AccountUser {
  role: 'owner' | 'staff';
}

/** The signed-in owner or staff member, or null (customers are not staff). */
export const getStaff = cache(async (): Promise<StaffUser | null> => {
  const user = await getUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  const role = data?.role;
  return role === 'owner' || role === 'staff' ? { ...user, role } : null;
});

/** Every admin page and action calls this: signed out -> admin sign-in; not staff -> told so. */
export async function requireStaff(nextPath: string): Promise<StaffUser> {
  const staff = await getStaff();
  if (staff) return staff;
  if (!(await getUser())) redirect(`/admin/login?next=${encodeURIComponent(nextPath)}`);
  redirect('/admin/login?error=staff');
}
