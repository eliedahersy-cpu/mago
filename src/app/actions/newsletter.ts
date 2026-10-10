'use server';

import { createPublicClient } from '@/lib/supabase/public';
import { newsletterSchema } from '@/lib/validation/newsletter';

export type NewsletterState = { status: 'idle' | 'success' | 'error'; message: string };

export async function subscribeToNewsletter(_prev: NewsletterState, formData: FormData): Promise<NewsletterState> {
  const parsed = newsletterSchema.safeParse({ email: String(formData.get('email') ?? '').trim() });
  if (!parsed.success) return { status: 'error', message: parsed.error.issues[0].message };

  const { error } = await createPublicClient()
    .from('newsletter_subscribers')
    .insert({ email: parsed.data.email, source: 'footer' });

  if (!error) return { status: 'success', message: "You're in! Watch your inbox for recipes and offers." };
  if (error.code === '23505') return { status: 'success', message: "You're already on the list." };
  console.error('newsletter subscribe failed', error);
  return { status: 'error', message: 'Something went wrong. Please try again.' };
}
