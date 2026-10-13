# MAGO Plan 3 — Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Shopify-style `/admin` for owner and staff: dashboard, analytics, orders (status flow, notes, packing slip, manual orders), products (with image uploads), collections, inventory, customers, discounts and settings (including staff roles).

**Architecture:** Separate `(admin)` route group with its own layout (sidebar + top bar), guarded by `proxy.ts` (optimistic) and `requireStaff()` (profiles.role via the session) on every page and action. Staff already have full table access through the `*_staff_all` RLS policies, so CRUD uses the session client directly; operations that must be atomic or need `auth.users` (status changes with restock, stock adjustments, stats, customer stats, staff roles) are `security definer` SQL functions that check `is_staff()` / owner. Admin writes call `updateTag()` on the storefront cache tags (`catalog`, `settings`, `discounts`) so the shop reflects them at once. Product images upload from the browser to the `product-images` bucket (staff-only write policy).

**Tech Stack:** Next.js 16.4 (Cache Components, `updateTag`), React 19.3, Supabase (RLS, Storage, SQL functions), Zod 4, Vitest 5, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-10-mago-ecommerce-design.md` §7 (modules), §11 (status transitions validated in SQL, expired admin session keeps `next`, typed action results), §13 phase 4.

## Global Constraints

- Only `owner`/`staff` reach `/admin/*` (except `/admin/login`); every admin page and action calls `requireStaff()`; only `owner` changes roles.
- Status flow: `pending → confirmed → preparing → out_for_delivery → delivered`; `cancelled` from any state before `delivered`; cancelling restocks tracked products (`inventory_movements` reason `cancel`); `delivered`/`cancelled` are final.
- Every admin mutation records what it did (order events / inventory movements) and refreshes the affected storefront cache tags.
- Server actions return `{ ok: true } | { ok: false, error }`; raw database errors are logged, not shown.
- Desktop-first, usable at 390px.

## Review Focus

1. A signed-in customer (not staff) opening `/admin` must never see admin data or run admin actions (pages and actions both check).
2. An invalid status change (e.g. delivered → preparing, cancel a delivered order) must be refused with a clear message; cancelling twice must not restock twice.
3. Editing or archiving a product must change the storefront immediately (cache tags), and an archived/draft product must leave the shop.
4. Uploading an image that is not an image or is very large must be refused before upload.
5. Stock adjustments must log a movement with the staff member and reason, and never go below zero unless backorders are allowed.

---

### Task 1: SQL — admin functions (migration 0008) + tests
**Files:** `supabase/migrations/0008_admin.sql`, `supabase/tests/0005_admin.test.sql`, README.
**Functions** (all `security definer`, `search_path=''`, execute to `authenticated`, raise `42501` unless `is_staff()`):
- `update_order_status(p_order uuid, p_status text, p_note text default null) returns jsonb` — enforces the flow above; sets `delivered_at`/`cancelled_at`; on cancel restocks via the order's `inventory_movements` (reason `cancel`, once); inserts an `order_events` row (`status_changed`/`cancelled`, `created_by = auth.uid()`).
- `set_order_payment(p_order uuid, p_status text) returns void` — `unpaid|paid|refunded` + event `payment`.
- `adjust_stock(p_product uuid, p_delta int, p_reason text, p_note text default null) returns int` — reasons `adjustment|restock`; refuses a result below 0 when the product does not allow backorders; logs the movement with `created_by`.
- `admin_stats(p_from timestamptz, p_to timestamptz) returns jsonb` — non-cancelled orders: `sales`, `orders`, `aov`, `new_customers`, the same for the previous equal-length period, `daily` [{day, sales, orders}], `top_products` [{name, flavour, quantity, sales}] (child cup lines count, box lines don't), `low_stock` [{id, name, flavour, stock, threshold}], `by_status`, `by_source`, `by_collection`.
- `admin_customers(p_search text, p_limit int, p_offset int) returns jsonb` — rows {id, email, full_name, phone, orders, total_spent, last_order_at, tags, has_account} + total.
- `admin_staff() returns jsonb` — {id, email, full_name, role} for owner/staff; `admin_set_role(p_email text, p_role text) returns void` — owner only; target must be a registered user; cannot demote the last owner.
- [ ] Test (begin/rollback, fixtures: owner, staff, customer users; products; orders): transitions allowed/refused; cancel restocks once; non-staff denied (42501) for each function; adjust_stock floor; stats totals equal fixture sums; staff cannot set roles; last owner cannot be demoted. RED (missing) → apply → GREEN; earlier tests still pass.

### Task 2: Admin shell, guard and sign-in
**Files:** `src/proxy.ts` (matcher + `/admin` redirect), `src/lib/auth/dal.ts` (`getStaff()`, `requireStaff(next)`), `src/app/(admin)/admin/layout.tsx`, `src/app/(admin)/admin/login/page.tsx`, `src/components/admin/{AdminShell,AdminNav,AdminTopBar}.tsx`, `src/lib/admin/nav.ts`, `e2e/admin.spec.ts`.
- `requireStaff(next)` → signed out: `/admin/login?next=…`; signed in but not staff: `/admin/login?error=staff`.
- Login reuses the password form (`next` defaults to `/admin`); "This account does not have admin access" for `error=staff`.
- [ ] e2e: `/admin`, `/admin/orders` → `/admin/login?next=…`; login page renders the form and the staff message.

### Task 3: Dashboard and analytics
**Files:** `src/lib/admin/stats.ts` (+ test: `percentChange`, `rangeFromParam('7d'|'30d'|'90d'|'ytd')`, `toCsv`), `src/lib/data/admin.ts`, `src/app/(admin)/admin/page.tsx`, `…/analytics/page.tsx`, `src/app/(admin)/admin/orders/export/route.ts` (CSV, staff-checked), `src/components/admin/{KpiCard,SalesChart,RangePicker}.tsx`.
- [ ] Unit tests RED → implement → GREEN.

### Task 4: Orders
**Files:** `src/lib/admin/orders.ts` (+ test: `nextStatuses(status)`, `parseOrderFilters(searchParams)`), `src/app/actions/admin/orders.ts` (status, payment, note, manual order), pages `…/orders/page.tsx`, `…/orders/[number]/page.tsx`, `…/orders/[number]/packing-slip/page.tsx`, `…/orders/new/page.tsx`.
- List: search (number, name, phone, email), filters (status, payment, source, from/to), pagination (25). Detail: items with box cups nested, customer + address, totals, action buttons for allowed next statuses, cancel (confirm), mark paid/refunded, notes, timeline. Packing slip: print layout. Manual order: product picker + contact/address → `place_order` then `source = 'admin'`.
- [ ] Unit tests RED → GREEN.

### Task 5: Products and collections
**Files:** `src/lib/admin/product-form.ts` (+ test: `productSchema`, `slugify`, `parseLines`), `src/app/actions/admin/products.ts`, `src/app/actions/admin/collections.ts`, pages `…/products/page.tsx`, `…/products/new/page.tsx`, `…/products/[id]/page.tsx`, `…/collections/page.tsx`, `…/collections/[id]/page.tsx`, `src/components/admin/{ProductForm,ImageManager,CollectionForm}.tsx`.
- Image manager: drag & drop or pick; only `image/jpeg|png|webp|avif`, ≤ 5 MB (checked before upload); uploads to `product-images/<product id>/<uuid>.<ext>`; reorder, alt text, kind, delete.
- Save/duplicate/archive call `updateTag('catalog')`.
- [ ] Unit tests RED → GREEN.

### Task 6: Inventory, customers, discounts
**Files:** `src/lib/admin/discount-form.ts` (+ test), `src/app/actions/admin/{inventory,customers,discounts}.ts`, pages `…/inventory/page.tsx`, `…/customers/page.tsx`, `…/customers/[id]/page.tsx`, `…/discounts/page.tsx`, `…/discounts/[id]/page.tsx`.
- Inventory: table (stock, threshold, low-stock filter), inline adjust (+/−, reason, note) via `adjust_stock`, movement history. Customers: list from `admin_customers`, detail with addresses, orders, notes and tags (editable). Discounts: list with usage, create/edit codes and automatic rules (`updateTag('discounts')`).
- [ ] Unit tests RED → GREEN.

### Task 7: Settings and staff
**Files:** `src/lib/admin/settings-form.ts` (+ test), `src/app/actions/admin/settings.ts`, `…/settings/page.tsx`.
- Store name, contact email/phone, shipping fee, free-delivery threshold, delivery areas (one per line), announcement bar, social links; staff list with promote/demote by email (owner only). `updateTag('settings')`.
- [ ] Unit tests RED → GREEN; commit; owner checklist `docs/qa/admin-checklist.md`.
