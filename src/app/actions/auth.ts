'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/dal';
import { safeNextPath } from '@/lib/auth/next-path';
import { emailOnlySchema, loginSchema, newPasswordSchema, registerSchema } from '@/lib/auth/schemas';
import { fieldErrors } from '@/lib/checkout/schema';
import { createClient } from '@/lib/supabase/server';

export type AuthState = {
  status: 'idle' | 'error' | 'sent' | 'signed-in';
  /** Where to go after signing in (already checked by safeNextPath). */
  next?: string;
  message: string;
  fieldErrors?: Record<string, string>;
  /** Typed values to put back after a mistake (never passwords). */
  values?: Record<string, string>;
};

const text = (form: FormData, name: string) => String(form.get(name) ?? '');

/** Where emailed links should send people back to (this site). */
async function siteOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const h = await headers();
  return h.get('origin') ?? `https://${h.get('host')}`;
}

async function callbackUrl(next: string): Promise<string> {
  return `${await siteOrigin()}/auth/callback?next=${encodeURIComponent(safeNextPath(next))}`;
}

export async function signIn(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { email: text(form, 'email') };
  const parsed = loginSchema.safeParse({ email: values.email, password: text(form, 'password') });
  if (!parsed.success) return { status: 'error', message: '', fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === 'email_not_confirmed') {
      return { status: 'error', message: 'Please confirm your email first. The link is in the email we sent when you registered.', values };
    }
    return { status: 'error', message: 'That email and password do not match. Try again or use an emailed sign-in link.', values };
  }
  const { error: claimError } = await supabase.rpc('claim_customer');
  if (claimError) console.error('claim_customer failed', claimError);
  // The form does a full page load to this path, so every part of the page sees the new session.
  return { status: 'signed-in', message: '', next: safeNextPath(text(form, 'next')) };
}

export async function sendSignInLink(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { email: text(form, 'email') };
  const parsed = emailOnlySchema.safeParse(values);
  if (!parsed.success) return { status: 'error', message: '', fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: await callbackUrl(text(form, 'next')) },
  });
  if (error && error.status === 429) {
    return { status: 'error', message: 'Too many emails were requested. Please wait a few minutes and try again.', values };
  }
  // The same answer whether or not the email has an account.
  return { status: 'sent', message: 'If that email has a MAGO account, a sign-in link is on its way. It works once, in this browser.' };
}

export async function register(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { fullName: text(form, 'fullName'), email: text(form, 'email') };
  const parsed = registerSchema.safeParse({
    ...values,
    password: text(form, 'password'),
    acceptsMarketing: form.get('acceptsMarketing') === 'on',
  });
  if (!parsed.success) return { status: 'error', message: '', fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, accepts_marketing: parsed.data.acceptsMarketing },
      emailRedirectTo: await callbackUrl(text(form, 'next') || '/account'),
    },
  });
  if (error) {
    if (error.status === 429) return { status: 'error', message: 'Too many attempts. Please wait a few minutes and try again.', values };
    if (error.code === 'weak_password') return { status: 'error', message: '', fieldErrors: { password: 'Please choose a stronger password.' }, values };
    console.error('signUp failed', error);
    return { status: 'error', message: 'We could not create your account. Please try again.', values };
  }
  if (data.session) {
    // Email confirmation is off: already signed in.
    await supabase.rpc('claim_customer');
    return { status: 'signed-in', message: '', next: safeNextPath(text(form, 'next')) };
  }
  return { status: 'sent', message: `Check ${parsed.data.email} for a link to confirm your account. It signs you in.` };
}

export async function requestPasswordReset(_prev: AuthState, form: FormData): Promise<AuthState> {
  const values = { email: text(form, 'email') };
  const parsed = emailOnlySchema.safeParse(values);
  if (!parsed.success) return { status: 'error', message: '', fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: await callbackUrl('/account/reset-password'),
  });
  if (error && error.status === 429) {
    return { status: 'error', message: 'Too many emails were requested. Please wait a few minutes and try again.', values };
  }
  return { status: 'sent', message: 'If that email has a MAGO account, a link to choose a new password is on its way.' };
}

export async function updatePassword(_prev: AuthState, form: FormData): Promise<AuthState> {
  const parsed = newPasswordSchema.safeParse({ password: text(form, 'password'), confirm: text(form, 'confirm') });
  if (!parsed.success) return { status: 'error', message: '', fieldErrors: fieldErrors(parsed.error) };
  if (!(await getUser())) {
    return { status: 'error', message: 'Your reset link has expired. Please request a new one.' };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === 'same_password') return { status: 'error', message: '', fieldErrors: { password: 'Choose a password you have not used here before.' } };
    return { status: 'error', message: 'We could not update your password. Please try again.' };
  }
  redirect('/account');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}
