import { NextResponse, type NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/auth/next-path';
import { createClient } from '@/lib/supabase/server';

/**
 * Where emailed links land (sign-up confirmation, sign-in link, password reset): swap the
 * one-time code for a session, join the account to its customer record, then continue.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { error: claimError } = await supabase.rpc('claim_customer');
      if (claimError) console.error('claim_customer failed', claimError);
      return NextResponse.redirect(new URL(next, origin));
    }
  }
  return NextResponse.redirect(new URL('/account/login?error=link', origin));
}
