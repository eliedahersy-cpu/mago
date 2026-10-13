# MAGO Plan 4 — Engagement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reviews (write + moderate), recipes admin, store locator (shop + admin), and Subscribe & Save (flow, account management, admin, daily pg_cron job).

**Architecture:** Same patterns as Plans 2–3. Anything that prices, validates ownership or creates orders is a `security definer` SQL function (migration 0010); plain staff CRUD uses the session client under the `*_staff_all` RLS policies. Storefront pages read through cached functions tagged `recipes`, `reviews`, `catalog`, and a new `stores` / `plans` tag; admin writes call `updateTag()`. The map is Leaflet with OpenStreetMap tiles (no API key). The subscription flow keeps its draft in sessionStorage so signing in at the review step loses nothing.

**Tech Stack:** Next.js 16.4 (Cache Components), React 19.3, Supabase (RLS, Storage, SQL functions, pg_cron), Zod 4, Leaflet 1.9, Vitest 5, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-10-mago-ecommerce-design.md` §3 (`/subscribe`, `/stores`, `/stores/[slug]`, `/account/*` subscriptions), §4 (subscriptions, pg_cron, stores, reviews tables), §6 rule 6, §7 (Subscriptions, Recipes, Stores, Reviews modules; Home "active subscriptions"; Customers "subscriptions"), §9 (no fake reviews), §13 phase 5.

## Global Constraints

- A subscription box is exactly the Mix Box size (5) of active cups; extras are active `extra` products; plan must be active; address governorate must be one of `settings.delivery_areas`.
- Subscription pricing: plan `discount_percent` off cups (replaces Mix & Match); extras full price; delivery fee unless (subtotal − discount) ≥ free-delivery threshold.
- `process_due_subscriptions()` creates one COD order (source `subscription`) per active subscription due within 2 days (Beirut date), then advances `next_delivery_date` by the plan interval; never twice for the same delivery. Runs daily 06:00 Beirut via pg_cron; staff can run it from the admin.
- Customers manage only their own subscriptions (pause, resume, skip next, cancel, change cups/plan/address); cancelled is final.
- Reviews: signed-in customers only, one per product, always `pending`; "verified buyer" set by the database from the customer's own non-cancelled orders; only approved reviews are shown or counted.
- Ratings and counts come only from real approved reviews (no fake numbers).

## Review Focus

1. A customer calling `update_subscription` on someone else's subscription (or anon calling `process_due_subscriptions`) must be refused.
2. Running `process_due_subscriptions()` twice on the same day must not create a second order.
3. A subscription with a sold-out cup still produces an order, never negative stock, and the shortfall is visible to staff.
4. Leaving the subscribe flow to sign in and coming back must keep the plan, cups, extras and address.
5. A customer cannot mark their own review verified, review twice, or review a hidden product.

---

### Task 1: SQL — engagement functions (migration 0010) + tests
**Files:** `supabase/migrations/0010_engagement.sql`, `supabase/tests/0007_engagement.test.sql`.
- `submit_review(p_product uuid, p_rating int, p_title text, p_body text) returns void` — auth; links/creates the caller's customer; one per (product, customer) (unique index); verified = has a non-cancelled order containing the product (loose or in a box); status `pending`.
- `quote_subscription(p_plan uuid, p_items jsonb) returns jsonb` — {cups_subtotal, extras_subtotal, subtotal, discount, shipping, total, errors[]}; items `{cups:[{product_id,quantity}], extras:[…]}`.
- `create_subscription(payload jsonb) returns uuid` — auth; validates as above; `start_date` default Beirut today + 2 (must be within 1–60 days).
- `update_subscription(p_id uuid, p_action text, p_payload jsonb default '{}') returns jsonb` — owner or staff; actions `pause|resume|skip|cancel|update_items|update_address|change_plan`.
- `process_due_subscriptions() returns int` — staff or the cron superuser only.
- pg_cron job `mago-process-due-subscriptions` at `0 3 * * *` (UTC).
- [ ] Test RED (functions missing) → apply → GREEN; 0001–0006 still pass.

### Task 2: Reviews — write and moderate
**Files:** `src/lib/reviews/schema.ts` (+ test), `src/app/actions/reviews.ts`, `src/components/product/ReviewForm.tsx`, product page wiring; admin `…/reviews/page.tsx`, `src/app/actions/admin/reviews.ts`.
- [ ] Schema test RED → GREEN (rating 1–5, body 10–1000, title ≤ 80).

### Task 3: Recipes admin
**Files:** `src/lib/admin/recipe-form.ts` (+ test), `src/app/actions/admin/recipes.ts`, `src/components/admin/RecipeForm.tsx`, `src/components/admin/HeroImageField.tsx` (upload to `content-images`), pages `…/recipes`, `…/recipes/[id]`.
- [ ] Form test RED → GREEN (ingredients lines, steps "Title: body", slug, minutes > 0, tags from list).

### Task 4: Store locator
**Files:** `src/lib/stores/geo.ts` (+ test: `distanceKm`, `sortByDistance`, `directionsUrl`, `isOpenSummary`), `src/lib/data/stores.ts` (+ cached), `src/components/stores/{StoreMap,StoreLocator,StoreCard}.tsx`, pages `/stores`, `/stores/[slug]`; admin `…/stores`, `…/stores/[id]` with map picker and products checklist; header/footer links.
- [ ] Geo test RED → GREEN.

### Task 5: Subscribe & Save
**Files:** `src/lib/subscriptions/draft.ts` (+ test: steps, cup count, sanitize persisted draft), `src/lib/data/subscriptions.ts`, `src/app/actions/subscriptions.ts`, `src/components/subscribe/*`, pages `/subscribe`, `/account/subscriptions`; admin `…/subscriptions`, `…/subscriptions/[id]`, `…/subscriptions/plans`; dashboard KPI; customer detail list.
- [ ] Draft test RED → GREEN; e2e: landing → plan → 5 cups → delivery → review asks to sign in, and the draft survives a reload.

### Task 6: Checklist and docs
**Files:** `docs/qa/engagement-checklist.md`, README.
