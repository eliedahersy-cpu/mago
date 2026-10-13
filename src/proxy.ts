import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from '@/lib/supabase/env';

/** Account pages that a signed-out visitor may open. */
const PUBLIC_ACCOUNT_PAGES = new Set(['/account/login', '/account/register', '/account/forgot-password', '/account/reset-password']);

/** Where a signed-out visitor to a private page is sent (admin pages have their own sign-in). */
function signInPath(pathname: string): string | null {
  if (pathname.startsWith('/admin')) return pathname === '/admin/login' ? null : '/admin/login';
  if (pathname.startsWith('/account')) return PUBLIC_ACCOUNT_PAGES.has(pathname) ? null : '/account/login';
  return null;
}

/**
 * Keeps the Supabase session cookies fresh where the session is read, and sends signed-out
 * visitors from private account pages to sign in. This is an optimistic check only: every
 * account page and server action verifies the user again (src/lib/auth/dal.ts).
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, publishableKey } = getSupabaseEnv();
  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet, headers) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Refreshes an expired access token (rewriting the cookies above) and verifies the JWT.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const { pathname, search } = request.nextUrl;
  const loginPath = signInPath(pathname);
  if (loginPath && !signedIn) {
    const login = request.nextUrl.clone();
    login.pathname = loginPath;
    login.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/auth/:path*', '/checkout'],
};
