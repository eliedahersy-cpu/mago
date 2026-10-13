# MAGO Plan 2b — Customer Accounts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Customers can register, sign in (password or emailed link), reset a password, see their orders, keep addresses and a wishlist, and check out faster when signed in; guest orders placed with a verified email join the account.

**Architecture:** Supabase Auth through `@supabase/ssr` cookies. `src/proxy.ts` refreshes the session and does the optimistic redirect for `/account/*`; a small data-access layer (`src/lib/auth/dal.ts`) re-verifies the user in every page and server action. Account pages read through the session-aware client so RLS decides what is visible; session reads sit behind `<Suspense>` (Cache Components). A security-definer `claim_customer()` links the signed-in, email-verified user to their `customers` row (creating it if needed). The wishlist is local for guests and synced to `wishlist_items` when signed in.

**Tech Stack:** Next.js 16.4 (Cache Components, `proxy.ts`), React 19.3, `@supabase/ssr` 0.12.7, `@supabase/supabase-js` 2.117, Zustand 5, Zod 4, Vitest 5, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-10-mago-ecommerce-design.md` (§4 `/account/*`, §5 profiles/customers/addresses/wishlist_items + RLS, §2 "orders link here (guest + registered unified)").

## Global Constraints

- No service-role key; every account read/write goes through the user's session and RLS, or a `security definer` function that checks `auth.uid()`.
- Guest orders join an account only when the account's email is verified (`auth.users.email_confirmed_at is not null`) and matches case-insensitively (Plan 2 review ruling).
- `next` redirect targets must be same-site relative paths (no open redirects).
- Session reads only inside `<Suspense>` or in segments with `export const instant = false`; personal data is never put in `use cache`.
- Signed-in checkout uses the account email (server-enforced); everything else as Plan 2.
- I (the agent) never create accounts or sign in to Supabase Auth; flows that need a real account are verified by the owner from the checklist in Task 7.

## Review Focus

1. A signed-out visitor opening any `/account/*` page lands on sign-in and returns to that page afterwards — never to an external `next`.
2. A user whose email is not verified must not see guest orders placed with that email.
3. A signed-in customer can only read/edit their own profile, addresses, wishlist and orders (RLS), and cannot change their role.
4. A guest's local wishlist is not lost when they sign in (merged into the account).
5. Signed-in checkout cannot be used to attach an order to someone else's email.

---

### Task 1: Session plumbing — proxy, data-access layer, callback, Supabase URL config

**Files:** Create `src/proxy.ts`, `src/lib/auth/next-path.ts` (+ test), `src/lib/auth/dal.ts`, `src/app/auth/callback/route.ts`, `e2e/account.spec.ts`.

**Interfaces:**
- `safeNextPath(raw: string | null | undefined, fallback = '/account'): string` — only `/…` paths, not `//…`, not `/\…`, no scheme; otherwise `fallback`.
- `getUser(): Promise<AccountUser | null>` with `AccountUser { id: string; email: string; emailVerified: boolean; fullName: string | null }` (server client `auth.getUser()`); `requireUser(nextPath: string): Promise<AccountUser>` redirects to `/account/login?next=…`.
- `proxy` refreshes Supabase cookies on `/account/:path*`, `/auth/:path*`, `/checkout`; on `/account/*` (except `login`, `register`, `forgot-password`, `reset-password`) with no Supabase auth cookie → redirect to `/account/login?next=<path>`.
- `GET /auth/callback?code=…&next=…` → `exchangeCodeForSession`, then `claim_customer`, redirect to `safeNextPath(next)`; failure → `/account/login?error=link`.
- Supabase dashboard (owner approved "go"): Auth → URL Configuration: Site URL `https://mago-rose.vercel.app`; Redirect URLs `https://mago-rose.vercel.app/**`, `http://localhost:3000/**`.

- [ ] Step 1: tests — `safeNextPath` (`/account/orders` kept; `//evil.com`, `https://evil.com`, `/\evil.com`, `''`, `null` → fallback); e2e `signed-out visitors are sent to sign in` (`/account/orders` → URL `/account/login?next=%2Faccount%2Forders`).
- [ ] Step 2: run — FAIL.
- [ ] Step 3: implement; set the URL configuration in the dashboard.
- [ ] Step 4: run — PASS; typecheck/lint.
- [ ] Step 5: commit `feat(auth): session proxy, data-access layer and auth callback`.

### Task 2: Sign in, register, emailed link, password reset, sign out

**Files:** Create `src/lib/auth/schemas.ts` (+ test), `src/app/actions/auth.ts`, `src/app/(store)/account/(auth)/layout.tsx`, `…/login/page.tsx`, `…/register/page.tsx`, `…/forgot-password/page.tsx`, `…/reset-password/page.tsx`, `src/components/account/AuthForms.tsx` (client, `useActionState`).

**Interfaces:**
- Schemas: `loginSchema {email, password(min 1)}`, `registerSchema {fullName 2–100, email, password min 8, acceptsMarketing}`, `emailOnlySchema {email}`, `newPasswordSchema {password min 8, confirm}` (must match).
- Actions (all return `{ status: 'idle'|'error'|'sent'; message: string; fieldErrors?: Record<string,string> }` or redirect): `signIn` (password → `claim_customer` → redirect `next`), `sendSignInLink` (`signInWithOtp`, `shouldCreateUser: false`, `emailRedirectTo` `/auth/callback?next=`), `register` (`signUp` with `full_name` metadata + `emailRedirectTo`; "Check your email to confirm"), `requestPasswordReset` (`resetPasswordForEmail` → `/auth/callback?next=/account/reset-password`; always the same neutral message), `updatePassword` (requires session), `signOut`.
- Messages never reveal whether an email has an account.

- [ ] Step 1: tests — schema unit tests; e2e: login page shows both options; empty submit shows field errors; register with a short password shows "at least 8 characters"; forgot-password with a bad email shows its error.
- [ ] Step 2–4: RED → implement → GREEN.
- [ ] Step 5: commit `feat(auth): sign-in, registration, email links and password reset`.

### Task 3: SQL — `claim_customer()` (migration 0007)

**Files:** Create `supabase/migrations/0007_accounts.sql`, `supabase/tests/0004_accounts.test.sql`; README migration list.

**Interface:** `claim_customer() returns uuid` (`security definer`, `search_path=''`, execute to `authenticated` only): requires `auth.uid()`; reads the user's email and `email_confirmed_at`; returns the customer already linked to the profile; else, if verified, links an unlinked customer with the same lower(email) or inserts one (email, full_name, phone from profile); unverified → creates/links nothing and returns null.

- [ ] Step 1: test (begin/rollback; fixtures insert two `auth.users` rows — verified and unverified — and a guest customer with an order): verified user claims the guest row and then reads its order through RLS; second call returns the same id; unverified user gets null and reads no orders; a user cannot read another customer's orders; anon cannot execute.
- [ ] Step 2: run in SQL editor — RED (function missing). Step 3: write + apply. Step 4: GREEN; 0001–0003 still pass.
- [ ] Step 5: commit `feat(db): claim_customer links verified accounts to their orders`.

### Task 4: Account area — overview, profile, orders, order detail, addresses

**Files:** Create `src/lib/data/account.ts`, `src/lib/account/address.ts` (+ test), `src/app/actions/account.ts`, `src/app/(store)/account/(area)/layout.tsx` (nav: Overview, Orders, Addresses, Wishlist, Sign out), `…/page.tsx`, `…/orders/page.tsx`, `…/orders/[number]/page.tsx`, `…/addresses/page.tsx`, `src/components/account/*`.

**Interfaces:** `getMyAccount()`, `getMyOrders()`, `getMyOrder(number: number)`, `getMyAddresses()` (session client, RLS; each calls `claim_customer` once per request via `ensureCustomer()`); actions `updateProfile`, `saveAddress` (insert/update, `is_default` exclusive), `deleteAddress`, `setDefaultAddress`, each re-verifying the user. `addressSchema` mirrors checkout address rules + `label`.

- [ ] Step 1: tests — `addressSchema` unit tests; e2e: each area URL redirects to sign-in when signed out.
- [ ] Steps 2–4; Step 5 commit `feat(account): overview, orders, order detail and addresses`.

### Task 5: Wishlist

**Files:** Create `src/lib/wishlist/store.ts` (+ logic test), `src/components/product/WishlistButton.tsx`, `src/app/actions/wishlist.ts`, `src/app/(store)/account/(area)/wishlist/page.tsx`; modify `ProductCard.tsx`, product page purchase area.

**Interfaces:** `useWishlist` (persisted ids, `toggle(id)`, `has(id)`); `toggleWishlist(productId, on)` and `syncWishlist(ids)` actions (signed-in only; insert/delete via RLS); WishlistButton: heart, `aria-pressed`, label "Save to wishlist"/"Remove from wishlist"; signed-in users' toggles also call the action; the wishlist page merges local ids into the account (`syncWishlist`) then lists products.

- [ ] Step 1: tests — store toggle unit test; e2e: a guest saves a cup on /shop, the heart stays pressed after reload.
- [ ] Steps 2–4; Step 5 commit `feat(wishlist): hearts for guests and accounts`.

### Task 6: Signed-in checkout

**Files:** Modify `src/app/(store)/checkout/page.tsx` (Suspense + account prefill), `CheckoutForm.tsx` (`account?: { email, fullName, phone, addresses }` prop: email locked, default address prefilled, "Save this address to my account"), `src/app/actions/checkout.ts` (`placeOrder` uses the session client when signed in, forces the account email, saves the address when asked).

- [ ] Step 1: tests — unit for `withAccountEmail(form, user)`; e2e guest checkout still passes (signed-in path is manual, Task 7).
- [ ] Steps 2–4; Step 5 commit `feat(checkout): faster checkout for signed-in customers`.

### Task 7: Owner checklist and docs

**Files:** Create `docs/qa/accounts-checklist.md`; modify `README.md` (auth URL configuration, built-in email limits, owner promotion now happens after the owner registers).

- [ ] Checklist covers: register → confirm email → land on /account; sign out/in with password; emailed sign-in link; forgot password → reset; guest order with the same email appears after confirming; address add/edit/default/delete; wishlist merge after sign-in; signed-in checkout prefill + saved address; another account cannot see these orders.
- [ ] Commit `docs: accounts checklist and auth setup`.
