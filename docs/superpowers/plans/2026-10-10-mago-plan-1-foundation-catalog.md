# MAGO Plan 1 — Foundation & Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A running Next.js storefront backed by Supabase where a visitor can browse the home page, the shop (filter/sort/paginate), every product page, search, info pages and Our Story, and add cups to a persisted cart drawer — all styled to match the Drive mockups.

**Architecture:** Single Next.js 16 App Router app. Catalog pages are Server Components that read Supabase through a cookie-less public client and revalidate every 5 minutes. The full database schema, RLS and catalog seed are created in this plan (SQL files in `supabase/`, applied through the Supabase dashboard SQL editor). The cart is a client-side Zustand store persisted to `localStorage`; server-side pricing arrives in Plan 2.

**Tech Stack:** Next.js 16.4, React 19, TypeScript (strict), Tailwind CSS 4.3, `@supabase/supabase-js` 2.117 + `@supabase/ssr` 0.12, Zustand 5, Zod 4, lucide-react, sharp (image script), Vitest 5, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-10-mago-ecommerce-design.md`

### Plan series (this is Plan 1 of 5)
| Plan | Scope (spec sections) |
|---|---|
| **1 Foundation & Catalog** (this) | Scaffold, Supabase, full schema + RLS + seed, assets, design system, layout, home, shop, product page, cart store + drawer, search, info pages, Our Story |
| 2 Checkout & Accounts | `quote_cart` / `place_order` / `get_order_by_token` (§5, §6), cart page with server totals + discount code, checkout, confirmation, Mix Box builder + review, auth (`proxy.ts`), account (orders, addresses, wishlist) |
| 3 Admin | §7 all modules, staff RPCs, Storage uploads, revalidation |
| 4 Engagement | Quiz (§8), recipes, store locator, reviews, subscriptions + pg_cron |
| 5 Polish & Launch | §13 phase 6: SEO, performance, accessibility, full Playwright suite, README + deploy |

Each later plan is written after the previous one lands, against the real code.

## Global Constraints

- Next.js **16.4** App Router, React 19, TypeScript `strict: true`. Route `params` and `searchParams` are **Promises** (await them). Lint with `eslint .` (Next 16 has no `next lint`). Session middleware file is `src/proxy.ts` (added in Plan 2, not here).
- Env vars (only these two in the app): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. **No service-role key anywhere in the repo.**
- RLS enabled on **every** table. Staff powers come only from `profiles.role in ('owner','staff')` via `public.is_staff()`.
- Money: `numeric(10,2)` USD in SQL; numbers in TS; display only through `formatPrice()` → `"$4.50"`.
- Cup price **$4.50**; shipping **$3.00** flat, free when ≥ **$30.00** (from `settings`); automatic discount **"Mix & Match 10%"** = 10% off cups at ≥ 5 cups.
- English only; delivery within Lebanon; payment = cash on delivery.
- **No fake data presented as real:** no seeded reviews; products with no approved reviews show "No reviews yet". Nutrition shows only known facts — **30 g protein per serving** and **100 g pasta inside** — plus "Full nutrition facts are printed on each cup."
- Design tokens (Tailwind `@theme`): `cream #FBF3E4`, `cream-dark #F4E6CF`, `forest #0F4D3A`, `forest-dark #0A3A2B`, `terracotta #C8432B`, `saffron #F3A41B`, `leaf #3E7A3A`, `ink #1F2A24`. Fonts: display **Fredoka 700** (verify vs mockup, fallback Baloo 2 800), body **DM Sans**, script **Caveat**.
- Visual source of truth: `design-assets/mockups/*.png` (git-ignored, local only). Page ↔ mockup: home → `home.png`; shop → `shop.png`; product → `product-3.png` (plus the "Buy any 5 cups and save 10%" strip and "Perfect for" block from `product-2.png`); Our Story → right half of `near-you-our-story.png`.
- Packshots have white backgrounds: render them on cream surfaces with `mix-blend-multiply`.

## Conventions (read once, used by every task)

- **Git:** the F: drive has no ownership info, so every git command is `git -c safe.directory=F:/DEV/Mago …`. Commit messages end with a blank line + `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Writing files:** if the Write tool is refused for a path inside `F:\DEV\Mago`, write the file into the session scratchpad and `cp` it into place with Bash. Avoid apostrophes inside Bash heredocs (they break the Bash tool here).
- **Apply SQL (migrations, seed, SQL tests):** preferred — Supabase MCP `apply_migration` / `execute_sql` if the connector is linked to the MAGO project. Otherwise in Claude-in-Chrome: open `https://supabase.com/dashboard/project/<REF>/sql/new`, set the editor text with `javascript_tool`: `monaco.editor.getModels()[0].setValue(<file text as JSON string>)`, press Run (Ctrl+Enter), read the result panel. Migrations expect "Success. No rows returned". SQL test files end with `select '<name>: all passed' as result;` and must show that row. If the editor shows a "destructive operation" confirmation, it is an in-page modal — confirm it. `<REF>` is stored in `.env.local` as part of the URL.
- **SQL test style:** `supabase/tests/*.test.sql` wrap fixtures in `begin; … rollback;`, switch identity with `set local role anon;` (or `authenticated` + `select set_config('request.jwt.claims', '{"sub":"<uuid>","role":"authenticated"}', true);`), and assert inside `do $$ … $$` blocks with `raise exception 'FAIL <reason>'`.
- **Dev server for visual checks:** `.claude/launch.json` entry `mago-dev` → `npm run dev` on port 3000; use the built-in browser (`preview_start` name `mago-dev`) at 1440×900 and 390×844, side by side with the mockup.
- **Data access:** pages never call Supabase directly; they call functions in `src/lib/data/*`. Raw rows are mapped to camelCase domain types in `src/lib/data/mappers.ts`.

## Review Focus

1. **Unknown collection in the URL** (`/shop?collection=nope`) → page shows all products with the "All" pill active, never an empty or crashed page. Pinned by Playwright test `shop ignores unknown collection` (Task 9).
2. **Draft / archived product slugs** (`/shop/fusilli-400g`) → branded 404 ("We couldn't find that page"), never product data. Pinned by Playwright test `draft product returns 404` (Task 10) and SQL test `anon cannot see draft products` (Task 3).
3. **Corrupt or old cart in localStorage** (other app version, hand-edited JSON) → cart silently resets to empty instead of throwing during hydration. Pinned by unit test `sanitizePersistedCart returns empty cart for unknown shapes` (Task 8).
4. **Quantity edge cases** (0, negative, NaN, > 99 from repeated clicks) → quantities clamp to 1–99 on add; setting 0 removes the line. Pinned by unit tests in `lines.test.ts` (Task 8).
5. **Search input with PostgREST control characters** (`,` `(` `)` `%` `_` `*`) → search still works and never 500s. Pinned by unit test `sanitizeSearchTerm strips filter syntax` (Task 7) and Playwright `search handles punctuation` (Task 12).

---

## File Structure

```
.claude/launch.json                     dev server config for visual checks
.env.example / .env.local               Supabase URL + publishable key
next.config.ts  vitest.config.ts  playwright.config.ts
scripts/optimize-images.mjs             design-assets/*.png → public/**/*.webp (manifest inside)
supabase/migrations/0001_schema.sql     all tables, triggers, is_staff()
supabase/migrations/0002_rls.sql        RLS policies for every table
supabase/migrations/0003_storage.sql    storage buckets + policies
supabase/migrations/0004_catalog_functions.sql  get_active_automatic_discount()
supabase/seed/0001_catalog.sql          settings, collections, products, images, plans, discount, recipes, stores
supabase/tests/0001_catalog_rls.test.sql
public/brand/  public/images/  public/products/   optimized assets (committed)
src/app/layout.tsx  globals.css  icon.png  apple-icon.png  not-found.tsx
src/app/actions/newsletter.ts
src/app/(store)/layout.tsx  page.tsx  error.tsx  not-found.tsx
src/app/(store)/shop/page.tsx  shop/[slug]/page.tsx  search/page.tsx  our-story/page.tsx  [page]/page.tsx
src/config/navigation.ts                header/footer/mobile nav items
src/content/info-pages.ts               copy for faq, shipping, returns, terms, privacy, contact, ingredients, sustainability
src/lib/format.ts  cn.ts  types.ts
src/lib/supabase/env.ts  server.ts  browser.ts  public.ts
src/lib/data/rows.ts  mappers.ts  catalog.ts  content.ts  search.ts
src/lib/catalog/shop-params.ts  rating.ts  stock.ts  search-term.ts
src/lib/cart/lines.ts  store.ts
src/lib/validation/newsletter.ts
src/components/ui/        Button, Container, SectionHeading, Badge, ProteinBadge, StarRating, Pill, Carousel
src/components/brand/     Logo, SunMark, ArchDecor, LeafSprig, ScriptNote
src/components/layout/    AnnouncementBar, Header, MobileNav, SearchForm, Footer, NewsletterForm
src/components/cart/      CartButton, CartDrawer
src/components/product/   ProductCard, ProductGrid, AddToCartButton, QuantityStepper, ProductGallery, ProductPurchase,
                          BenefitIcons, PerksRow, UpsellStrip, ProductTabs, ReviewList, CompleteTheExperience
src/components/shop/      ShopHero, CollectionPills, SortControls, Pagination
src/components/marketing/ MixBoxBanner, QuizBanner, FeatureStrip, OnTheGoBanner
src/components/home/      Hero, CupCollection
src/components/recipe/    RecipeCard, RecipesCarousel
e2e/{shop,product,home,search-info}.spec.ts
```

---

### Task 1: Scaffold the app, tooling and `formatPrice`

**Files:**
- Create: whole Next.js scaffold at repo root (merging the existing `.gitignore`, which must keep `design-assets/`), `vitest.config.ts`, `src/lib/format.ts`, `src/lib/cn.ts`
- Test: `src/lib/format.test.ts`

**Interfaces:**
- Produces: `formatPrice(amount: number): string`; `cn(...inputs: ClassValue[]): string`; npm scripts `dev`, `build`, `start`, `lint` (`eslint .`), `typecheck` (`tsc --noEmit`), `test` (`vitest run`), `e2e` (`playwright test`), `images` (`node scripts/optimize-images.mjs`).

- [ ] **Step 1: Scaffold in the scratchpad, then copy in** (the repo already has `.git`, `docs/`, `design-assets/`)

```bash
npx create-next-app@16.4.0 mago-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --turbopack --disable-git --skip-install --yes
```
Copy everything from `mago-app/` into `F:\DEV\Mago` except `.git`; append `design-assets/` to the generated `.gitignore`. Then `npm install` in the repo.

- [ ] **Step 2: Add dependencies**

```bash
npm i @supabase/supabase-js@2.117.3 @supabase/ssr@0.12.7 zustand@5.0.15 zod@4.6.5 lucide-react@1.55.0 clsx tailwind-merge
npm i -D vitest@5.0.3 vite-tsconfig-paths @playwright/test@1.64.0 sharp@0.35.5
```
Add the npm scripts listed under Interfaces. `vitest.config.ts`: `vite-tsconfig-paths` plugin, `environment: 'node'`, `include: ['src/**/*.test.ts', 'scripts/**/*.test.mjs']`.

- [ ] **Step 3: Write the failing test** `src/lib/format.test.ts`

```ts
import { formatPrice } from '@/lib/format';
test('formats USD with two decimals', () => {
  expect(formatPrice(4.5)).toBe('$4.50');
  expect(formatPrice(22.5)).toBe('$22.50');
  expect(formatPrice(0)).toBe('$0.00');
  expect(formatPrice(1234.5)).toBe('$1,234.50');
});
```

- [ ] **Step 4: Run it — expect FAIL** (`Cannot find module '@/lib/format'`): `npm test`

- [ ] **Step 5: Implement** `formatPrice` in `src/lib/format.ts` with a module-level `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })`; `cn` in `src/lib/cn.ts` = `twMerge(clsx(inputs))`.

- [ ] **Step 6: Verify everything is green:** `npm test` (1 passed), `npm run typecheck`, `npm run lint`, `npm run build` — all exit 0.

- [ ] **Step 7: Commit** — `chore: scaffold Next.js 16 app with tooling and formatPrice`

---

### Task 2: Supabase project, environment and clients

**Prerequisite (user):** signed in to supabase.com in Chrome. **Ask the user before creating a project.** If a MAGO project already exists, use it; otherwise create `mago` in region **eu-central-1 (Frankfurt)** after the user confirms (free tier).

**Files:**
- Create: `.env.local` (git-ignored), `.env.example`, `src/lib/supabase/env.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/browser.ts`, `src/lib/supabase/public.ts`
- Test: `src/lib/supabase/env.test.ts`

**Interfaces:**
- Produces:
  - `getSupabaseEnv(): { url: string; publishableKey: string }` — throws `Error` whose message names the missing variable.
  - `createClient(): Promise<SupabaseClient>` in `server.ts` (`createServerClient` from `@supabase/ssr` with `cookies()` `getAll`/`setAll`; `setAll` wrapped in try/catch for Server Components).
  - `createClient(): SupabaseClient` in `browser.ts` (`createBrowserClient`).
  - `createPublicClient(): SupabaseClient` in `public.ts` — `@supabase/supabase-js` `createClient` with `auth: { persistSession: false, autoRefreshToken: false }`; used by all catalog reads so pages can be statically cached.

- [ ] **Step 1: Collect project values** — in the dashboard: Project Settings → API Keys → copy the Project URL and the **publishable** key (`sb_publishable_…`; fall back to the legacy anon key only if no publishable key exists). Write both to `.env.local`; put the variable names with empty values in `.env.example`.

- [ ] **Step 2: Write the failing test** `src/lib/supabase/env.test.ts`

```ts
import { getSupabaseEnv } from '@/lib/supabase/env';
afterEach(() => vi.unstubAllEnvs());
test('throws naming the missing URL', () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'k');
  expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
});
test('throws naming the missing key', () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', '');
  expect(() => getSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
});
test('returns both values', () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_abc');
  expect(getSupabaseEnv()).toEqual({ url: 'https://x.supabase.co', publishableKey: 'sb_publishable_abc' });
});
```
(Enable `globals: true` in `vitest.config.ts` if not already, for `vi`/`afterEach`.)

- [ ] **Step 3: Run — expect FAIL** (module not found).

- [ ] **Step 4: Implement** `env.ts` (read `process.env.NEXT_PUBLIC_*` by literal name so Next inlines them) and the three client factories.

- [ ] **Step 5: Run — expect PASS**; `npm run typecheck` clean.

- [ ] **Step 6: Commit** — `feat: Supabase env validation and server/browser/public clients` (never stage `.env.local`; confirm with `git status`).

---

### Task 3: Database schema, RLS and storage

**Files:**
- Create: `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_storage.sql`, `0004_catalog_functions.sql`
- Test: `supabase/tests/0001_catalog_rls.test.sql`

**Interfaces:**
- Produces (SQL, all in `public`): every table and column in spec §5 **plus** `products.sauce text`; `orders.number` from sequence `order_number_seq start 1001`; `settings` singleton (`id boolean primary key default true check (id)`); unique index `customers_email_key on customers (lower(email))`; trigger fn `set_updated_at()` on every table with `updated_at`; trigger `on_auth_user_created` (`handle_new_user()` inserts `profiles(id, full_name)` with role `customer`); trigger `prevent_role_self_change` (non-staff cannot change `profiles.role`); trigger `refresh_product_rating` on `reviews` (recomputes `products.rating_avg` / `rating_count` from `status='approved'` rows); `is_staff() returns boolean` (`stable security definer set search_path = ''`); `get_active_automatic_discount() returns table(title text, value numeric, min_cup_quantity int)` (security definer, active + automatic + within date window, at most 1 row, highest value first); storage buckets `product-images`, `content-images` (public).
- Enum-like columns are `text` with `check (col in (…))` using exactly the values listed in spec §5.

- [ ] **Step 1: Write the failing SQL test** `supabase/tests/0001_catalog_rls.test.sql` — one `begin … rollback` with fixtures inserted as the owner role, then `set local role anon;` and a `do $$` block asserting:
  - `FAIL anon sees draft product` — a fixture `status='draft'` product is not visible.
  - `FAIL anon cannot see active product` — a fixture `status='active'` product is visible, with its `product_images` row.
  - `FAIL anon inserted product` — inserting into `products` raises `insufficient_privilege` (catch exactly that SQLSTATE; any other outcome fails).
  - `FAIL anon cannot subscribe` — insert into `newsletter_subscribers` succeeds.
  - `FAIL anon can read subscribers` — `select count(*) from newsletter_subscribers` = 0 right after that insert.
  - `FAIL anon can read orders` — a fixture order exists but anon count is 0; anon insert into `orders` raises `insufficient_privilege`.
  - `FAIL anon can read discounts` — fixture discount invisible to anon, yet `get_active_automatic_discount()` returns it.
  - `FAIL draft recipe visible` / `FAIL hidden collection visible` — same pattern for `recipes.status='draft'` and `collections.is_visible=false`.
  Ends with `select 'catalog rls: all passed' as result;`.

- [ ] **Step 2: Run it (Apply SQL convention) — expect FAIL** with `relation "products" does not exist`.

- [ ] **Step 3: Write `0001_schema.sql`** (tables in FK order: settings, profiles, collections, products, product_images, collection_products, inventory_movements, customers, addresses, wishlist_items, discounts, subscription_plans, subscriptions, orders, order_items, order_events, recipes, stores, store_products, reviews, newsletter_subscribers; FKs `on delete cascade` for child rows, `set null` for `orders.customer_id`, `order_items.product_id`, `recipes.product_id`). Add indexes on every FK column and on `products(status, type, sort_order)`.

- [ ] **Step 4: Write `0002_rls.sql`** — `alter table … enable row level security` for **every** table, then policies exactly as spec §5 "RLS summary": public read predicates (`status='active'`, `is_visible`, `status='published'`, `status='approved'`, `is_active`), child tables (`product_images`) readable when the parent product is readable, `settings` + `collection_products` + `store_products` readable by all, owner-scoped reads for customer tables via `customers.profile_id = (select auth.uid())`, `reviews` insert for `authenticated` with check `status='pending'`, `newsletter_subscribers` insert for `anon, authenticated`, and a `for all to authenticated using (is_staff()) with check (is_staff())` policy on every table. No insert policy on `orders` / `order_items` for non-staff.

- [ ] **Step 5: Write `0003_storage.sql`** (buckets upsert + `storage.objects` select policy for both buckets, insert/update/delete only when `public.is_staff()`) and **`0004_catalog_functions.sql`** (`get_active_automatic_discount`, `grant execute … to anon, authenticated`).

- [ ] **Step 6: Apply 0001 → 0004 in order** — each shows "Success. No rows returned".

- [ ] **Step 7: Re-run the SQL test — expect** `catalog rls: all passed`.

- [ ] **Step 8: Commit** — `feat(db): schema, RLS, storage buckets and catalog functions`

---

### Task 4: Image pipeline and catalog seed

**Files:**
- Create: `scripts/optimize-images.mjs`, `supabase/seed/0001_catalog.sql`, `public/**` (generated webp), `src/app/icon.png`, `src/app/apple-icon.png`
- Test: `scripts/seed-assets.test.mjs`

**Interfaces:**
- Produces: image URLs used by seed and components — `/brand/logo.webp`; `/images/hero-desktop.webp`, `/images/hero-mobile.webp`, `/images/cup-collection.webp`, `/images/lifestyle-<name>.webp` (movie-night, kids-game-night, kitchen-portrait, post-workout, rainy-day-soup, lemon-office, lasagna, pantry-shelf); `/products/<slug>.webp` for every seeded product with an image; `/products/mago-mix-box.webp`, `/products/mago-mix-box-open.webp`, `/products/conchigliette-in-brodo-2.webp`.
- Seeded slugs (used by Tasks 9–13 tests): the 12 cups below, `mago-mix-box`, `extra-parmesan`, `chili-flakes`, `mixed-herbs`, `garlic-crunch`, `recipe-booklet`, drafts `fusilli-400g`, `tagliolini-400g`, `conchiglie-400g`, `lasagna-400g`.

- [ ] **Step 1: Write the failing test** `scripts/seed-assets.test.mjs` — reads `supabase/seed/0001_catalog.sql`, extracts every `'/(brand|images|products)/[^']+\.webp'` literal, and asserts each exists under `public/`; also asserts at least 20 such references were found (guards against an empty seed).

- [ ] **Step 2: Run — expect FAIL** (seed file missing).

- [ ] **Step 3: Write `scripts/optimize-images.mjs`** — a manifest array `{ src, out, width, crop? }` (crop as fractions `{ left, top, width, height }` of the source), sharp → webp quality 82, skip when output is newer than source. Sources from `design-assets/images/` per this mapping:

| Output | Source | Width / crop |
|---|---|---|
| `brand/logo.webp` (+ `src/app/icon.png` 512, `apple-icon.png` 180 as PNG) | `logo.png` | 512 |
| `images/hero-desktop.webp` | `hero-landscape-1.png` (no baked button) | 1799 |
| `images/hero-mobile.webp` | `hero-portrait-1.png` (no baked button) | 941 |
| `products/<cup-slug>.webp` | `cup-*.png` per table below | 900 |
| `products/mago-mix-box.webp` / `-open.webp` | `mix-box-five-cup.png` | crop `{0,0,.5,.69}` / `{.505,0,.495,.69}`, 900 |
| `products/<retail-slug>.webp` | `box-<shape>-400g.png` | 900 |
| `images/cup-collection.webp`, `images/lifestyle-*.webp` | same-named PNGs | 1400 |

- [ ] **Step 4: Run `npm run images`**, confirm the files exist (`ls public/products | wc -l` ≥ 17).

- [ ] **Step 5: Write `supabase/seed/0001_catalog.sql`** — idempotent (`insert … on conflict (slug) do update`), containing:
  - `settings`: store_name `MAGO`, currency `USD`, shipping_flat_fee `3.00`, free_shipping_threshold `30.00`, delivery_areas `["Beirut","Mount Lebanon","North","Akkar","Beqaa","Baalbek-Hermel","South","Nabatieh"]`, social_links `{}`, announcement_bar `Free delivery on orders over $30`.
  - `collections` (slug, title, sort, visible): fusilli 1, rishta 2, pastina 3, tagliolini 4, conchiglie 5, specialities "Specialities" 6, best-sellers 7 **hidden**, pasta-boxes "Pasta Boxes 400g" 8.
  - **12 cups** — all `type='cup'`, `status='active'`, price `4.50`, stock `200`, `protein_g 30`, `prep_minutes 4`, nutrition `[{"label":"Protein","value":"30 g per serving"},{"label":"Pasta","value":"100 g per cup"}]`, preparation `[{"title":"Add water","body":"Pour hot water up to the fill line."},{"title":"Add sauce","body":"Stir in the sauce sachet."},{"title":"Mix & enjoy","body":"Wait 3–4 minutes, stir and enjoy."}]`, ingredients = key ingredients taken from the sauce line (Spicy Muhammara uses the mockup list: Roasted Red Peppers, Walnuts, Tomatoes, Chickpeas, Olive Oil, Garlic, Mediterranean Spices). `sauce` = the descriptor printed on the packshot (read it from the PNG for rows marked "packshot"). Write `short_description`, `description` and `story` in the brand voice (warm, short sentences, Mediterranean); never claim certifications or health benefits beyond the protein figure.

| # | slug | name | flavour | sauce | collection | tagline | spice | flavour_profiles | textures | occasions | style | featured sort | image |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | fusilli-spicy-muhammara | Fusilli Cup | Spicy Muhammara | Smoky pepper, walnut & chili sauce | fusilli + best-sellers | Bold. Smoky. Unforgettable. | 3 | spicy | twirly | quick-lunch, on-the-go, post-workout | lebanese | 2 (best seller) | cup-fusilli-spicy-muhammara |
| 2 | fusilli-al-pesto-genovese | Fusilli Cup | Al Pesto Genovese | Basil, parmesan & pine nut sauce | fusilli | Fresh basil. Real flavour. Always a good idea. | 0 | herby | twirly | quick-lunch, at-home | italian | 4 | cup-fusilli-pesto-genovese |
| 3 | rishta-lentil-pasta-soup | Rishta Cup | Lentil & Pasta Soup | Lentils, caramelised onion, garlic, cumin & coriander | rishta | Hearty, wholesome and full of flavour. | 1 | soupy, comforting | brothy | at-home, quick-lunch | lebanese | 3 | cup-rishta-lentil-soup |
| 4 | pastina-sweet-cinnamon | Pastina Cup | Sweet Cinnamon Milk Pasta | packshot | pastina | A comforting classic with a joyful twist. | 0 | sweet, comforting | soft | at-home | fusion | 1 | cup-pastina-sweet-cinnamon |
| 5 | tagliolini-al-tartufo-bianco | Tagliolini Cup | Al Tartufo Bianco | packshot | tagliolini | Creamy. Earthy. Pure indulgence. | 0 | creamy | twirly, creamy | at-home | italian | 5 | cup-tagliolini-tartufo-bianco |
| 6 | conchiglie-mac-and-cheese | Conchiglie Cup | Mac & Cheese | packshot | conchiglie | Rich. Creamy. Totally satisfying. | 0 | creamy, comforting | creamy | at-home, on-the-go | fusion | — | cup-conchiglie-mac-cheese |
| 7 | tagliolini-creamy-mushroom | Tagliolini Cup | Creamy Mushroom | packshot | tagliolini | Silky. Savoury. Soothing. | 0 | creamy, comforting | twirly, creamy | post-workout, at-home | italian | — | cup-tagliolini-mushroom |
| 8 | tagliolini-al-limone | Tagliolini Cup | Al Limone | packshot | tagliolini | Bright. Zesty. Refreshing. | 0 | herby | twirly | quick-lunch, on-the-go | italian | — | cup-tagliolini-al-limone |
| 9 | tagliolini-tarator-pine-nuts | Tagliolini Cup | Tarator & Pine Nuts | Creamy tahini, garlic & lemon sauce | tagliolini | Nutty, zesty and proudly Lebanese. | 0 | creamy, herby | twirly, creamy | quick-lunch, post-workout | lebanese | — | cup-tagliolini-mockup |
| 10 | macaroon-bil-toum | Macaroon Bil Toum | Lebanese Garlic Pasta | Zesty garlic & lemon sauce with dried mint | specialities | Garlicky, zesty and full of home. | 1 | spicy, herby | soft | on-the-go, quick-lunch | lebanese | — | cup-macaroon-bil-toum |
| 11 | conchigliette-in-brodo | Conchigliette Cup | In Brodo | Classic Italian-style broth with herbs & olive oil | specialities | Light, golden and soul-warming. | 0 | soupy | brothy | quick-lunch, at-home | italian | — | cup-conchigliette-golden-broth (+ `-2` from cup-conchigliette) |
| 12 | lasagna-melanzane-ricotta | Lasagna Cup | Melanzane & Ricotta | Creamy eggplant & ricotta sauce | specialities | Layers of comfort in every bite. | 0 | creamy, comforting | creamy | at-home | italian | — | cup-lasagna (+ lifestyle-lasagna as `kind='lifestyle'`) |

  Rows with a featured sort get `is_featured = true` and that `sort_order`; the rest get `sort_order` 6–12 in table order.
  - Other products: `mago-mix-box` "The MAGO Mix Box" (type bundle, price 0, bundle_size 5, track_inventory false, tagline `5 cups. Your mix. Five meals. Endless possibilities.`, images mix-box + mix-box-open); extras `extra-parmesan` 2.50, `chili-flakes` 1.50, `mixed-herbs` 1.50, `garlic-crunch` 1.50 (type extra, tagline `5 sachets`, no image); `recipe-booklet` "Recipe Booklet" 5.00 (type merch, tagline `10 easy recipes`, no image); drafts `fusilli-400g`, `tagliolini-400g`, `conchiglie-400g`, `lasagna-400g` (type retail, status draft, price 0, collection pasta-boxes, image from box-*-400g).
  - `product_images`: one `packshot` row per imaged product at position 0, extra rows as listed.
  - `subscription_plans`: Every 2 weeks (2, 15, popular, sort 1), Every 4 weeks (4, 10, sort 2), Every 6 weeks (6, 10, sort 3).
  - `discounts`: one row — title `Mix & Match 10%`, kind percentage, value 10, applies_to cups, min_cup_quantity 5, is_automatic true, is_active true, code null.
  - `recipes` (8, `status='published'`; write intro/ingredients/steps/tip in brand voice; `steps` 3–4 items):

| slug | title | product | minutes | tags | veg | hero_image |
|---|---|---|---|---|---|---|
| spicy-muhammara-fusilli-roasted-veggies | Spicy Muhammara Fusilli with Roasted Veggies | fusilli-spicy-muhammara | 10 | quick-meals, vegetarian | yes | /images/lifestyle-movie-night.webp |
| pesto-fusilli-grilled-chicken | Pesto Fusilli with Grilled Chicken | fusilli-al-pesto-genovese | 12 | extra-protein | no | /images/lifestyle-kitchen-portrait.webp |
| creamy-truffle-tagliolini-mushrooms | Creamy Truffle Tagliolini with Mushrooms | tagliolini-al-tartufo-bianco | 15 | mediterranean-twists, vegetarian | yes | /images/lifestyle-post-workout.webp |
| mac-and-cheese-conchiglie-crispy-breadcrumbs | Mac & Cheese Conchiglie with Crispy Breadcrumbs | conchiglie-mac-and-cheese | 10 | comfort-food, vegetarian | yes | /images/lifestyle-kids-game-night.webp |
| rishta-soup-lemon-herbs | Rishta Soup with Lemon & Herbs | rishta-lentil-pasta-soup | 12 | soups, vegetarian | yes | /images/lifestyle-rainy-day-soup.webp |
| sweet-cinnamon-pastina-caramelized-bananas | Sweet Cinnamon Pastina with Caramelized Bananas | pastina-sweet-cinnamon | 8 | comfort-food, vegetarian | yes | /products/pastina-sweet-cinnamon.webp |
| lemon-tagliolini-fresh-herbs | Lemon Tagliolini with Fresh Herbs | tagliolini-al-limone | 10 | quick-meals, vegetarian | yes | /images/lifestyle-lemon-office.webp |
| garlic-macaroon-crispy-chickpeas | Garlic Macaroon with Crispy Chickpeas | macaroon-bil-toum | 12 | extra-protein, mediterranean-twists, vegetarian | yes | /products/macaroon-bil-toum.webp |

  All recipes: difficulty `Easy`, servings `1–2`, cups_used 1.
  - `stores` (supermarket type unless noted; hours text from the mockup) + `store_products` linking each store to the 6 original cups (rows 1–6): Spinneys Hamra — Hamra, Beirut (33.8966, 35.4823) "Open until 10:00 PM"; Carrefour City Centre — Dbayeh (33.9380, 35.5880) "Open until 10:00 PM"; Fahed Supermarket — Achrafieh, Beirut (33.8880, 35.5200) "Open until 9:00 PM"; Metro Market — Hazmieh (33.8570, 35.5380) "Open until 10:00 PM"; Azzi Supermarket — Jal el Dib (33.9100, 35.5780) "Open until 9:00 PM".

- [ ] **Step 6: Run the asset test — expect PASS** (`npm test`).

- [ ] **Step 7: Apply the seed**, then verify with SQL: `select type, status, count(*) from products group by 1,2 order by 1,2;` → bundle/active 1, cup/active 12, extra/active 4, merch/active 1, retail/draft 4. Re-run `0001_catalog_rls.test.sql` → still passes. Apply the seed a second time → no errors (idempotent).

- [ ] **Step 8: Commit** — `feat: optimized brand imagery and catalog seed (12 cups, recipes, stores, plans)`

---

### Task 5: Design tokens, fonts and UI primitives

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `.claude/launch.json`, `src/lib/catalog/rating.ts`, `src/components/ui/{Button,Container,SectionHeading,Badge,ProteinBadge,StarRating,Pill,Carousel}.tsx`, `src/components/brand/{Logo,SunMark,ArchDecor,LeafSprig,ScriptNote}.tsx`
- Test: `src/lib/catalog/rating.test.ts`

**Interfaces:**
- Produces:
  - `ratingStars(avg: number | null): Array<'full' | 'half' | 'empty'>` — always length 5, `avg` rounded to the nearest 0.5 and clamped to 0–5.
  - `buttonVariants({ variant?: 'primary' | 'outline' | 'light' | 'ghost'; size?: 'sm' | 'md' | 'lg' }): string`; `Button` (button props + variant/size); `ButtonLink` (`next/link` props + variant/size). Primary = forest pill, cream text, uppercase display font; trailing arrows are `<ArrowRight aria-hidden />` so accessible names stay e.g. "Explore our cups".
  - `Container({ children, className? })` — `max-w-[1400px] mx-auto px-4 md:px-8`.
  - `SectionHeading({ title: ReactNode; subtitle?: string; align?: 'left' | 'center'; as?: 'h1' | 'h2' })` — uppercase display font, forest; subtitle in body font.
  - `Badge({ tone: 'terracotta' | 'saffron' | 'forest'; children })`; `ProteinBadge({ grams?: number /* 30 */; className? })` — white circle, "30G / PROTEIN / PER CUP".
  - `StarRating({ avg: number | null; count: number; size?: 'sm' | 'md' })` — saffron stars from `ratingStars`; `count === 0` renders "No reviews yet"; otherwise "4.8 (12 reviews)".
  - `Pill({ href: string; active: boolean; children })` — sets `aria-current="page"` when active.
  - `Carousel({ children: ReactNode[]; ariaLabel: string; itemClassName?: string })` (client) — scroll-snap track, previous/next buttons (`aria-label="Previous"` / `"Next"`), dots on < md.
  - Brand: `Logo({ variant?: 'dark' | 'light'; className?; priority? })` → `/brand/logo.webp` or `/brand/logo-light.webp` with alt "MAGO — Made to nourish"; `SunMark`, `ArchDecor({ tone: 'terracotta' | 'forest' | 'saffron' })`, `LeafSprig`, `ScriptNote({ children; arrow?: 'left' | 'right' | 'down' })` — inline SVG decor, `aria-hidden`.
- Tailwind `@theme`: the colour tokens from Global Constraints plus `--font-display`, `--font-sans`, `--font-script` wired to `next/font/google` CSS variables; body = cream background, ink text, `font-sans`.

- [ ] **Step 1: Write the failing test** `src/lib/catalog/rating.test.ts`

```ts
import { ratingStars } from '@/lib/catalog/rating';
const F = 'full', H = 'half', E = 'empty';
test('rounds to nearest half', () => {
  expect(ratingStars(4.8)).toEqual([F, F, F, F, F]);
  expect(ratingStars(4.3)).toEqual([F, F, F, F, H]);
  expect(ratingStars(4.2)).toEqual([F, F, F, F, E]);
});
test('handles null and out of range', () => {
  expect(ratingStars(null)).toEqual([E, E, E, E, E]);
  expect(ratingStars(7)).toEqual([F, F, F, F, F]);
  expect(ratingStars(-1)).toEqual([E, E, E, E, E]);
});
```

- [ ] **Step 2: Run — expect FAIL**; **Step 3: implement `ratingStars`**; **Step 4: run — expect PASS.**

- [ ] **Step 5: Add `logo-light.webp` to the image script** — recolour pixels whose R, G and B are all < 110 to `#FBF3E4`, and if the source background is opaque, first make pixels with all channels > 235 transparent. Run `npm run images`.

- [ ] **Step 6: Tokens, fonts, components** — implement the files above. Root metadata: `title: { default: 'MAGO — Good food, brighter days.', template: '%s | MAGO' }`, description "Nourishing pasta cups inspired by Mediterranean flavours. Real ingredients. Big taste. Ready in minutes."

- [ ] **Step 7: Font and colour check** — create `.claude/launch.json` (`mago-dev`, `npm run dev`, port 3000). On a temporary page render "GOOD FOOD, BRIGHTER DAYS." in Fredoka 700 and Baloo 2 800 next to a crop of `mockups/home.png`; keep the closer face (note the choice in a `globals.css` comment) and delete the temporary page. Sample the button fill, footer background and terracotta heading in `mockups/home.png` with sharp; adjust any token off by more than 10 in a channel.

- [ ] **Step 8:** `npm test`, `npm run typecheck`, `npm run lint` clean. **Commit** — `feat(ui): design tokens, fonts, brand marks and UI primitives`

---

### Task 6: Store layout — header, mobile nav, footer, newsletter, 404/error

**Files:**
- Create: `src/lib/types.ts` (start with `StoreSettings`), `src/lib/data/rows.ts`, `src/lib/data/mappers.ts`, `src/lib/data/content.ts`, `src/config/navigation.ts`, `src/lib/validation/newsletter.ts`, `src/app/actions/newsletter.ts`, `src/components/layout/{AnnouncementBar,Header,MobileNav,SearchForm,Footer,NewsletterForm}.tsx`, `src/app/(store)/layout.tsx`, `src/app/(store)/page.tsx` (temporary placeholder until Task 11), `src/app/(store)/not-found.tsx`, `src/app/(store)/error.tsx`, `src/app/not-found.tsx`
- Delete: the scaffold's `src/app/page.tsx`
- Test: `src/lib/validation/newsletter.test.ts`, `src/lib/data/mappers.test.ts`

**Interfaces:**
- Produces:
  - `type NavItem = { label: string; href: string }`; `mainNav: NavItem[]` = Our Cups `/shop`, Mix & Match `/mix-box`, Find Your Match `/find-your-match`, Recipes `/recipes`, Our Story `/our-story`; `footerNav: { title: string; items: NavItem[] }[]` = **Shop** (All Cups `/shop`, Mix & Match `/mix-box`, Gifts `/mix-box`, Subscriptions `/subscribe`), **About** (Our Story `/our-story`, Our Ingredients `/ingredients`, Sustainability `/sustainability`, Contact Us `/contact`), **Help** (FAQ `/faq`, Shipping & Delivery `/shipping`, Returns `/returns`, Terms & Conditions `/terms`).
  - `interface StoreSettings { storeName: string; contactEmail: string | null; contactPhone: string | null; currency: string; shippingFlatFee: number; freeShippingThreshold: number; deliveryAreas: string[]; socialLinks: Partial<Record<'instagram' | 'tiktok' | 'facebook' | 'youtube', string>>; announcementBar: string | null }`
  - `toSettings(row: SettingsRow): StoreSettings`; `getSettings(): Promise<StoreSettings>` (public client; throws if the row is missing).
  - `newsletterSchema = z.object({ email: z.email('Enter a valid email') })`; `type NewsletterState = { status: 'idle' | 'success' | 'error'; message: string }`; server action `subscribeToNewsletter(prev: NewsletterState, formData: FormData): Promise<NewsletterState>` — success "You're in! Watch your inbox for recipes and offers."; Postgres `23505` → success "You're already on the list."; other errors → error "Something went wrong. Please try again." (log server-side, never return the DB message).
  - Header leaves a slot for the cart button (filled in Task 8). `SearchForm` is a GET form to `/search` with input `name="q"`, placeholder "Search for flavours, ingredients…".

- [ ] **Step 1: Write failing tests**

```ts
// newsletter.test.ts
test('accepts a valid email', () => expect(newsletterSchema.safeParse({ email: 'a@b.co' }).success).toBe(true));
test('rejects junk with the friendly message', () => {
  const r = newsletterSchema.safeParse({ email: 'nope' });
  expect(r.success).toBe(false);
  expect(r.error!.issues[0].message).toBe('Enter a valid email');
});
// mappers.test.ts
test('toSettings converts numerics and defaults', () => {
  const s = toSettings({ store_name: 'MAGO', contact_email: null, contact_phone: null, currency: 'USD',
    shipping_flat_fee: '3.00', free_shipping_threshold: '30.00', delivery_areas: ['Beirut'],
    social_links: null, announcement_bar: 'Free delivery on orders over $30' });
  expect(s.shippingFlatFee).toBe(3);
  expect(s.freeShippingThreshold).toBe(30);
  expect(s.socialLinks).toEqual({});
});
```

- [ ] **Step 2: Run — expect FAIL**; **Step 3: implement** schema, mapper, `getSettings`, action; **Step 4: run — expect PASS.**

- [ ] **Step 5: Build the layout components** to match `mockups/home.png`:
  - Desktop (≥ 1024px): sticky rounded cream header bar — `Logo` left, `mainNav` (uppercase, small display font), right: search icon button (`aria-label="Search"`) toggling `SearchForm`, account icon → `/account`, cart slot, `ButtonLink` "Order now" → `/shop`. Active nav item gets a terracotta underline.
  - Mobile: hamburger → `MobileNav` (native `<dialog>` sheet with `SearchForm`, `mainNav`, account link), centred logo, cart slot right.
  - `AnnouncementBar` shows `settings.announcementBar` when set (forest background, cream text, centred, small).
  - `Footer`: forest background, `Logo variant="light"` + "Made to nourish", the three `footerNav` columns, "Join the MAGO community" + "Get exclusive recipes, offers and new flavours." + `NewsletterForm` (email input + arrow submit, `aria-live` status), social icons only for links present in `settings.socialLinks`.
  - `(store)/layout.tsx` = AnnouncementBar + Header + `<main>` + Footer.
  - 404 pages (both): heading "We couldn't find that page", text "The page you're looking for has moved or never existed.", `ButtonLink` "Explore our cups" → `/shop`. The root one wraps the same content with Logo (no store chrome). `error.tsx`: "Something went wrong" / "Please try again in a moment." + reset button.

- [ ] **Step 6: Visual check** at 1440 and 390 against the header and footer of `mockups/home.png`; fix spacing and type until they match.

- [ ] **Step 7:** tests, typecheck, lint, build clean. **Commit** — `feat(store): header, mobile nav, footer with newsletter, 404 and error pages`

---

### Task 7: Catalog data layer

**Files:**
- Modify: `src/lib/types.ts`, `src/lib/data/rows.ts`, `src/lib/data/mappers.ts`, `src/lib/data/content.ts`
- Create: `src/lib/data/catalog.ts`, `src/lib/data/search.ts`, `src/lib/catalog/shop-params.ts`, `src/lib/catalog/stock.ts`, `src/lib/catalog/search-term.ts`, `vitest.int.config.ts`
- Test: `src/lib/catalog/shop-params.test.ts`, `stock.test.ts`, `search-term.test.ts`, extend `src/lib/data/mappers.test.ts`, integration `src/lib/data/catalog.int.test.ts`

**Interfaces:**
- Produces (types):
  - `ProductType = 'cup' | 'bundle' | 'extra' | 'retail' | 'merch'`; `ProductStatus = 'draft' | 'active' | 'archived'`
  - `ProductImage { url: string; alt: string; kind: 'packshot' | 'lifestyle' | 'video'; position: number }`
  - `Product { id; slug; name; flavour: string | null; type: ProductType; status: ProductStatus; tagline: string | null; sauce: string | null; shortDescription: string | null; description: string | null; story: string | null; price: number; compareAtPrice: number | null; stock: number; trackInventory: boolean; allowBackorder: boolean; proteinG: number | null; prepMinutes: number | null; isBestSeller: boolean; isFeatured: boolean; sortOrder: number; badges: string[]; ingredients: { name: string }[]; nutrition: { label: string; value: string }[]; preparation: { title: string; body: string }[]; flavourProfiles: string[]; spiceLevel: number; textures: string[]; occasions: string[]; style: 'lebanese' | 'italian' | 'fusion' | null; bundleSize: number | null; ratingAvg: number | null; ratingCount: number; images: ProductImage[]; collections: { slug: string; title: string }[]; seoTitle: string | null; seoDescription: string | null }`
  - `Collection { id; slug; title; description: string | null; image: string | null; sortOrder: number; productCount: number }`
  - `RecipeSummary { slug; title; subtitle: string | null; heroImage: string | null; minutes: number; tags: string[]; productName: string | null }` (productName = `"<name> <flavour>"` of the linked product)
  - `Review { id; authorName: string; rating: number; title: string | null; body: string; createdAt: string; isVerifiedBuyer: boolean }`
  - `AutomaticDiscount { title: string; value: number; minCupQuantity: number }`
- Produces (functions):
  - `type ShopSort = 'featured' | 'price-asc' | 'price-desc' | 'rating' | 'newest'`; `SHOP_SORTS: { value: ShopSort; label: string }[]` (Featured, Price: low to high, Price: high to low, Top rated, Newest); `type ShopQuery = { collection: string | null; sort: ShopSort; page: number; perPage: 12 | 24 | 48 }`
  - `parseShopParams(sp: Record<string, string | string[] | undefined>): ShopQuery` (keys `collection`, `sort`, `page`, `per`)
  - `toShopSearchParams(current: ShopQuery, patch: Partial<ShopQuery>): string` — omits defaults; any patch that changes `collection`, `sort` or `perPage` resets `page` to 1; returns `''` or `'?…'`.
  - `isPurchasable(p: Pick<Product, 'status' | 'stock' | 'trackInventory' | 'allowBackorder'>): boolean`
  - `sanitizeSearchTerm(raw: string): string` — keep Unicode letters, digits, spaces, `&`, `'`, `-`; collapse spaces; trim; max 60 chars.
  - `toProduct(row: ProductRow): Product`, `toCollection`, `toRecipeSummary`, `toReview`
  - `catalog.ts`: `getShopProducts(q: ShopQuery): Promise<{ products: Product[]; total: number; activeCollection: Collection | null }>` (active `cup` + `retail` only; an unknown collection slug behaves as `null`); `getVisibleCollections(): Promise<Collection[]>` (visible and with ≥ 1 active cup/retail product, ordered by `sort_order`); `getProductBySlug(slug: string): Promise<Product | null>`; `getRelatedProducts(product: Product, limit?: number /* 5 */): Promise<Product[]>` (active cups except itself, same-collection first, then featured order); `getFeaturedProducts(limit?: number /* 5 */): Promise<Product[]>`; `getProductsBySlugs(slugs: string[]): Promise<Product[]>`; `getApprovedReviews(productId: string, limit?: number /* 6 */): Promise<Review[]>`; `getActiveAutomaticDiscount(): Promise<AutomaticDiscount | null>` (RPC `get_active_automatic_discount`).
  - `content.ts`: `getRecipeCards(limit?: number /* 8 */): Promise<RecipeSummary[]>`
  - `search.ts`: `searchCatalog(raw: string): Promise<{ term: string; products: Product[]; recipes: RecipeSummary[] }>` — empty sanitized term returns empty lists without querying.
  - Sort mapping: featured → `is_featured desc, sort_order asc`; price-asc/desc → `price`, then `sort_order`; rating → `rating_avg desc nulls last, rating_count desc`; newest → `created_at desc`.
  - All reads use `createPublicClient()`. One shared `PRODUCT_SELECT` string with `product_images(url, alt, kind, position)` and `collection_products(collections(slug, title))`.

- [ ] **Step 1: Write failing unit tests**

```ts
// shop-params.test.ts
const D = { collection: null, sort: 'featured', page: 1, perPage: 12 };
test('defaults', () => expect(parseShopParams({})).toEqual(D));
test('reads valid values', () =>
  expect(parseShopParams({ collection: 'fusilli', sort: 'price-asc', page: '2', per: '24' }))
    .toEqual({ collection: 'fusilli', sort: 'price-asc', page: 2, perPage: 24 }));
test('rejects junk', () =>
  expect(parseShopParams({ collection: 'Fus illi!', sort: 'bogus', page: '0', per: '7' })).toEqual(D));
test('takes the first array value and lowercases', () =>
  expect(parseShopParams({ collection: ['RISHTA', 'x'], page: 'abc' }).collection).toBe('rishta'));
test('builds links without defaults and resets page', () => {
  expect(toShopSearchParams(D as ShopQuery, {})).toBe('');
  expect(toShopSearchParams({ ...D, collection: 'fusilli', page: 3 } as ShopQuery, { collection: 'rishta' }))
    .toBe('?collection=rishta');
  expect(toShopSearchParams({ ...D, page: 1 } as ShopQuery, { page: 2 })).toBe('?page=2');
});
// stock.test.ts
const base = { status: 'active', stock: 0, trackInventory: true, allowBackorder: false } as const;
test('out of stock is not purchasable', () => expect(isPurchasable(base)).toBe(false));
test('backorder or untracked is purchasable', () => {
  expect(isPurchasable({ ...base, allowBackorder: true })).toBe(true);
  expect(isPurchasable({ ...base, trackInventory: false })).toBe(true);
});
test('draft never purchasable', () => expect(isPurchasable({ ...base, status: 'draft', stock: 5 })).toBe(false));
// search-term.test.ts
test('sanitizeSearchTerm strips filter syntax', () => {
  expect(sanitizeSearchTerm('pesto, (truffle)%_*')).toBe('pesto truffle');
  expect(sanitizeSearchTerm('  Mac   &  Cheese ')).toBe('Mac & Cheese');
  expect(sanitizeSearchTerm('*')).toBe('');
  expect(sanitizeSearchTerm('a'.repeat(100))).toHaveLength(60);
});
```
Extend `mappers.test.ts` with `toProduct maps a raw row`: fixture row with `price: '4.50'`, `rating_avg: '4.67'`, `badges: null`, `ingredients: null`, `product_images` at positions `[1, 0]`, `collection_products: [{ collections: { slug: 'fusilli', title: 'Fusilli' } }]` → expect `price 4.5`, `ratingAvg 4.67`, `badges []`, `ingredients []`, images ordered `[0, 1]`, `collections [{ slug: 'fusilli', title: 'Fusilli' }]`.

- [ ] **Step 2: Run — expect FAIL.** **Step 3: Implement** types, pure helpers and mappers. **Step 4: Run — expect PASS.**

- [ ] **Step 5: Write the integration test** `src/lib/data/catalog.int.test.ts` (run with `npm run test:int` = `vitest run --config vitest.int.config.ts`; that config loads `.env.local` via Vite `loadEnv` and includes only `*.int.test.ts`):
  - `getFeaturedProducts()` slugs equal `['pastina-sweet-cinnamon','fusilli-spicy-muhammara','rishta-lentil-pasta-soup','fusilli-al-pesto-genovese','tagliolini-al-tartufo-bianco']`
  - `getShopProducts(defaults)` → `total` 12; `{ collection: 'fusilli' }` → total 2; `{ collection: 'nope' }` → total 12 and `activeCollection` null
  - `getProductBySlug('fusilli-400g')` → null; `getProductBySlug('fusilli-spicy-muhammara')` → price 4.5, `isBestSeller` true, first image `/products/fusilli-spicy-muhammara.webp`
  - `getVisibleCollections()` slugs equal `['fusilli','rishta','pastina','tagliolini','conchiglie','specialities']`
  - `searchCatalog('Pesto, (genovese)%')` → includes `fusilli-al-pesto-genovese`; `searchCatalog('')` → empty lists
  - `getActiveAutomaticDiscount()` → `{ title: 'Mix & Match 10%', value: 10, minCupQuantity: 5 }`

- [ ] **Step 6: Run — expect FAIL** (functions not implemented). **Step 7: Implement** `catalog.ts`, `search.ts`, `getRecipeCards`. **Step 8: Run `npm run test:int` — expect PASS**; `npm test` still green.

- [ ] **Step 9: Commit** — `feat(data): typed catalog data layer with shop params, search and stock helpers`

---

### Task 8: Cart store and drawer

**Files:**
- Create: `src/lib/cart/lines.ts`, `src/lib/cart/store.ts`, `src/components/cart/CartButton.tsx`, `src/components/cart/CartDrawer.tsx`, `src/components/product/AddToCartButton.tsx`, `src/components/product/QuantityStepper.tsx`
- Modify: `src/components/layout/Header.tsx` (cart slot → `CartButton`), `src/app/(store)/layout.tsx` (mount `CartDrawer`)
- Test: `src/lib/cart/lines.test.ts`

**Interfaces:**
- Consumes: `Product`, `formatPrice`, `Button`/`ButtonLink`.
- Produces:
  - `interface CartLine { id: string; productId: string; slug: string; name: string; flavour: string | null; image: string | null; unitPrice: number; quantity: number }`; `type CartProduct = Omit<CartLine, 'id' | 'quantity'>`; `MAX_LINE_QTY = 99`
  - `clampQuantity(n: number): number` (NaN/< 1 → 1, > 99 → 99, floors decimals)
  - `addLine(lines: CartLine[], product: CartProduct, qty?: number): CartLine[]` (id `p:<productId>`, merges and clamps the merged total)
  - `setLineQuantity(lines: CartLine[], lineId: string, qty: number): CartLine[]` (qty ≤ 0 removes)
  - `removeLine(lines: CartLine[], lineId: string): CartLine[]`
  - `cartCount(lines: CartLine[]): number`; `cartSubtotal(lines: CartLine[]): number` (rounded to cents)
  - `sanitizePersistedCart(persisted: unknown): { lines: CartLine[] }` — Zod-validates each line; invalid lines dropped; non-matching shapes → `{ lines: [] }`
  - `toCartProduct(p: Product): CartProduct` (image = first packshot URL or null)
  - `useCart` Zustand store, `persist` with `name: 'mago-cart'`, `version: 1`, `partialize` → `{ lines }`, `migrate` and `merge` both go through `sanitizePersistedCart`; state `{ lines; isOpen; hydrated }`; actions `add(product: CartProduct, qty?: number)` (adds and opens the drawer), `setQuantity(lineId, qty)`, `remove(lineId)`, `clear()`, `open()`, `close()`.
  - `QuantityStepper({ value: number; onChange(n: number): void; min?: number; max?: number; label: string })` with buttons labelled "Decrease quantity" / "Increase quantity"; `AddToCartButton({ product: CartProduct; quantity?: number; disabled?: boolean; label?: string; size?; className? })` — disabled label "Sold out".

- [ ] **Step 1: Write failing tests** `src/lib/cart/lines.test.ts`

```ts
const cup = { productId: 'a', slug: 'fusilli-spicy-muhammara', name: 'Fusilli Cup', flavour: 'Spicy Muhammara', image: '/products/fusilli-spicy-muhammara.webp', unitPrice: 4.5 };
const extra = { ...cup, productId: 'b', slug: 'chili-flakes', name: 'Chili Flakes', flavour: null, unitPrice: 1.5 };
test('adds a new line', () => expect(addLine([], cup)).toEqual([{ ...cup, id: 'p:a', quantity: 1 }]));
test('merges the same product', () => {
  const lines = addLine(addLine([], cup, 2), cup, 3);
  expect(lines).toHaveLength(1);
  expect(lines[0].quantity).toBe(5);
});
test('clamps quantities', () => {
  expect(addLine([], cup, 150)[0].quantity).toBe(99);
  expect(addLine([], cup, -4)[0].quantity).toBe(1);
  expect(addLine([], cup, Number.NaN)[0].quantity).toBe(1);
  expect(setLineQuantity(addLine([], cup), 'p:a', 120)[0].quantity).toBe(99);
});
test('setting zero removes the line', () => expect(setLineQuantity(addLine([], cup), 'p:a', 0)).toEqual([]));
test('count and subtotal', () => {
  const lines = addLine(addLine([], cup, 3), extra, 1);
  expect(cartCount(lines)).toBe(4);
  expect(cartSubtotal(lines)).toBe(15);
  expect(cartSubtotal(addLine([], { ...cup, unitPrice: 0.1 }, 3))).toBe(0.3);
});
test('sanitizePersistedCart returns empty cart for unknown shapes', () => {
  expect(sanitizePersistedCart(null)).toEqual({ lines: [] });
  expect(sanitizePersistedCart({ lines: 'oops' })).toEqual({ lines: [] });
  expect(sanitizePersistedCart({ lines: [{ id: 'p:a' }] })).toEqual({ lines: [] });
  const good = addLine([], cup);
  expect(sanitizePersistedCart({ lines: good })).toEqual({ lines: good });
});
```

- [ ] **Step 2: Run — expect FAIL.** **Step 3: Implement `lines.ts` and `store.ts`.** **Step 4: Run — expect PASS.**

- [ ] **Step 5: Build the UI** — `CartDrawer` is a native `<dialog>` (gives focus trap + Esc) sliding in from the right (full-screen < md): title "Your cart (n)", each line with packshot (`mix-blend-multiply` on cream), name + flavour, `QuantityStepper`, line total, remove button `aria-label="Remove <name> <flavour>"`; footer "Subtotal" + `formatPrice(cartSubtotal)`, note "Delivery and discounts are calculated at checkout.", `ButtonLink` "Checkout" → `/checkout`, text button "Continue shopping" (closes). Empty state: "Your cart is empty" + `ButtonLink` "Explore our cups" → `/shop`. `CartButton` shows the count badge only once `hydrated` (no SSR mismatch) with `aria-label="Open cart, <n> items"`.

- [ ] **Step 6:** tests, typecheck, lint clean (the drawer is exercised end-to-end in Task 10). **Commit** — `feat(cart): persisted cart store with drawer and add-to-cart button`

---

### Task 9: Product card and Shop page

**Files:**
- Create: `playwright.config.ts`, `e2e/shop.spec.ts`, `src/components/product/{ProductCard,ProductGrid,BenefitIcons}.tsx`, `src/components/shop/{ShopHero,CollectionPills,SortControls,Pagination}.tsx`, `src/components/marketing/MixBoxBanner.tsx`, `src/app/(store)/shop/page.tsx`

**Interfaces:**
- Consumes: Task 7 data functions + `parseShopParams`/`toShopSearchParams`/`isPurchasable`; Task 8 `AddToCartButton`, `toCartProduct`; Task 5 UI.
- Produces:
  - `ProductCard({ product: Product; variant?: 'shop' | 'compact' | 'showcase' })` with `data-testid="product-card"`. `shop`: packshot on `cream-dark` tile with `ProteinBadge` corner, name / flavour, `StarRating`, tagline, price, `AddToCartButton` (disabled when `!isPurchasable`). `compact`: smaller version for carousels. `showcase`: large packshot, uppercase name + flavour, `ButtonLink` "View details". Image and title link to `/shop/<slug>`.
  - `ProductGrid({ products: Product[]; variant? })` — 2 cols, md 3, lg 4, xl 5.
  - `BenefitIcons({ variant: 'hero' | 'product' })` — High protein (30g per cup), Real ingredients, Ready in minutes, No artificial colours, Made in Lebanon (lucide icons).
  - `MixBoxBanner({ variant: 'home' | 'shop' })` — home copy: "BUILD YOUR MAGO MIX BOX" / "Pick 5 cups. Your way." + three mini features (Mix your favourites, More flavours to explore, The perfect gift) + "Start mixing →"; shop copy: "BUILD YOUR OWN MAGO BOX" / "Choose any 5 flavours, mix and match, and make it yours." + saffron "5 CUPS YOUR WAY" badge + "Start building →". Both link `/mix-box`, image `/products/mago-mix-box.webp`.
- Playwright: single project `chromium-desktop` (1440×900), `webServer: { command: 'npm run dev', port: 3000, reuseExistingServer: true }`, `baseURL: 'http://localhost:3000'`. Install with `npx playwright install chromium`.

- [ ] **Step 1: Write failing e2e** `e2e/shop.spec.ts`
  - `lists the 12 active cups and hides drafts` — `/shop` shows 12 `product-card`s; page has no text "400g".
  - `filters by collection` — click pill "Fusilli" → URL contains `collection=fusilli`, 2 cards, that pill has `aria-current="page"`.
  - `shop ignores unknown collection` — `/shop?collection=nope` → 12 cards and pill "All" has `aria-current="page"`.
  - `sort control updates the URL` — choose "Top rated" → URL contains `sort=rating`, still 12 cards.

- [ ] **Step 2: Run `npm run e2e -- shop` — expect FAIL** (404 at `/shop`).

- [ ] **Step 3: Implement** the components and page (`export const revalidate = 300`; metadata title "Our Pasta Cups"). Hero: "OUR PASTA CUPS" / "Mediterranean flavours. Real ingredients. Big protein per cup." + `BenefitIcons variant="hero"` + Spicy Muhammara packshot with arch/leaf decor (the mockup's "Five flavours" line is replaced because there are 12). Controls row: `CollectionPills` (All + `getVisibleCollections()`), `SortControls` (sort select + per-page select, client, `router.push(toShopSearchParams(...))`). Grid, `Pagination` when `total > perPage`, empty state for a valid collection with no products ("No cups here yet" + link to all), `MixBoxBanner variant="shop"`.

- [ ] **Step 4: Run the e2e — expect PASS.**

- [ ] **Step 5: Visual check** vs `mockups/shop.png` at 1440 and 390 (mobile: 2-column grid, horizontally scrollable pills, sort as full-width select). Fix until matching.

- [ ] **Step 6: Commit** — `feat(shop): product cards, filters, sorting, pagination and shop page`

---

### Task 10: Product page

**Files:**
- Create: `src/app/(store)/shop/[slug]/page.tsx`, `src/components/product/{ProductGallery,ProductPurchase,PerksRow,UpsellStrip,ProductTabs,ReviewList,CompleteTheExperience}.tsx`, `e2e/product.spec.ts`

**Interfaces:**
- Consumes: `getProductBySlug`, `getRelatedProducts`, `getApprovedReviews`, `getActiveAutomaticDiscount`, `getProductsBySlugs(['mago-mix-box','recipe-booklet'])`, `getSettings`; `ProductCard`, `Carousel`, `AddToCartButton`, `QuantityStepper`, `BenefitIcons`.
- Produces:
  - `ProductGallery({ images: ProductImage[]; name: string })` (client) — main image + thumbnails (vertical ≥ lg, horizontal below), keyboard-selectable.
  - `ProductPurchase({ product: CartProduct; purchasable: boolean })` (client) — `QuantityStepper` (label "Quantity") + `AddToCartButton` with the chosen quantity.
  - `PerksRow({ freeShippingThreshold: number })` — "Free delivery on orders over $30" (formatted from settings) · "Refrigerator safe after preparation" · "Cash on delivery".
  - `UpsellStrip({ discount: AutomaticDiscount })` — "Buy any 5 cups and save 10%" (values from the discount) / "Mix and match your favourite flavours." / link "Build your box →" `/mix-box`.
  - `ProductTabs({ tabs: { id: string; label: string; content: ReactNode }[] })` (client) — tabs ≥ md, accordion (`<details>`) < md.
  - `ReviewList({ reviews: Review[] })` — empty: "No reviews yet. Be the first to try it."
  - `CompleteTheExperience({ mixBox: Product | null; booklet: Product | null })`.
- Page behaviour: `notFound()` when the product is missing (drafts are hidden by RLS); a `bundle` product redirects to `/mix-box`; `generateStaticParams` returns active slugs; `generateMetadata` → title `"<name> <flavour>"`, description `shortDescription`, OG image = first image; `revalidate = 300`.

- [ ] **Step 1: Write failing e2e** `e2e/product.spec.ts`
  - `shows product details` — `/shop/fusilli-spicy-muhammara`: h1 contains "Fusilli Cup" and "Spicy Muhammara"; "$4.50" visible; "Best seller" visible; "No reviews yet" visible; open tab "Nutritional facts" → "30 g per serving" visible.
  - `draft product returns 404` — response status 404 for `/shop/fusilli-400g` and text "We couldn't find that page".
  - `adds to cart and persists` — click the "Increase quantity" button once (qty 2), click "Add to cart" → dialog shows "Spicy Muhammara", quantity 2 and "$9.00"; reload → cart button label contains "2 items"; no console message containing "Hydration".

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** to match `mockups/product-3.png` (+ `product-2.png` strip and "Perfect for"): breadcrumb (Home / Our Cups / primary collection / flavour); gallery left, info right: "Best seller" `Badge` when `isBestSeller`, h1 with `name` on a small line and `flavour` large, `StarRating`, `description`, `BenefitIcons variant="product"`, price, `ProductPurchase`, `PerksRow`, `UpsellStrip` (cups only, when a discount exists). Tabs: **Ingredients** ("REAL INGREDIENTS. BOLD FLAVOURS." + `sauce` + ingredient chips), **Nutritional facts** (rows + "Full nutrition facts are printed on each cup."), **How to prepare** (numbered `preparation` steps + "Ready in <prepMinutes> minutes" + lifestyle image when the product has one), **Our story behind this flavour** (`story` + "Perfect for" icons mapped from `occasions`: quick-lunch "A quick lunch", on-the-go "On-the-go days", at-home "At home", post-workout "Post-workout fuel"), **Reviews (n)**. Then "You may also like" (`Carousel` of `compact` cards) and `CompleteTheExperience`.

- [ ] **Step 4: Run — expect PASS.** **Step 5: Visual check** vs the mockups at 1440 and 390.

- [ ] **Step 6: Commit** — `feat(product): product page with gallery, purchase, tabs and related products`

---

### Task 11: Home page

**Files:**
- Modify: `src/app/(store)/page.tsx` (replace placeholder)
- Create: `src/components/home/{Hero,CupCollection}.tsx`, `src/components/marketing/{QuizBanner,FeatureStrip,OnTheGoBanner}.tsx`, `src/components/recipe/{RecipeCard,RecipesCarousel}.tsx`, `e2e/home.spec.ts`

**Interfaces:**
- Consumes: `getFeaturedProducts`, `getRecipeCards`; `ProductCard variant="showcase"`, `MixBoxBanner variant="home"`, `Carousel`, `ScriptNote`.
- Produces: `RecipeCard({ recipe: RecipeSummary })` (image 4:3, title, productName, clock + "<minutes> min"; links `/recipes/<slug>`), reused by Plan 4.

- [ ] **Step 1: Write failing e2e** `e2e/home.spec.ts`
  - `hero links to shop` — a level-1 heading named "Good food, brighter days."; click link "Explore our cups" → URL `/shop`.
  - `shows the cup collection in featured order` — first showcase card contains "Pastina Cup"; 5 showcase cards.
  - `lists recipes` — "Rishta Soup with Lemon & Herbs" visible; link "View all recipes" has href `/recipes`.
  - `newsletter validates email` — submit "nope" in the footer form → "Enter a valid email" (no success-path submit, to keep test data out of the live DB).

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** in mockup order (`mockups/home.png`):
  1. **Hero** — full-bleed `<picture>` via Next `getImageProps` (desktop `/images/hero-desktop.webp` ≥ 768px, mobile `/images/hero-mobile.webp`), `priority`, image `alt=""` because the artwork contains the headline; visually hidden `<h1>Good food, brighter days.</h1>` and `<p>` with the subtitle. Live `ButtonLink` "Explore our cups →" absolutely centred where the mockup button sits: desktop centre at **x 50%, y 41.6%**, width ≈ **17.7%** of the hero; mobile centre **x 50%, y 40.9%**, width ≈ **48%**. Size text with `clamp()` and check visually.
  2. **CupCollection** — "THE MAGO CUP COLLECTION" / "Five moods. Endless possibilities."; 5 featured `showcase` cards (5 across on desktop, `Carousel` on mobile).
  3. `MixBoxBanner variant="home"`.
  4. **QuizBanner** — "FIND YOUR" (terracotta) "MATCH" (forest), "Not sure where to start? Answer a few quick questions and we'll find your perfect MAGO flavours.", "Take the quiz →" `/find-your-match`, Spicy Muhammara packshot + `ScriptNote` "Same pasta. More possibilities."
  5. **FeatureStrip** — Real ingredients / You can trust · Mediterranean / inspired flavours · Ready / in minutes · No artificial / colours or flavours · A brighter / way to eat.
  6. **RecipesCarousel** — "RECIPES & INSPIRATION" / "Simple ideas. Big flavours." / outline "View all recipes →" `/recipes`, `Carousel` of `RecipeCard` (`getRecipeCards(8)`).
  7. **OnTheGoBanner** — `/images/lifestyle-lemon-office.webp` with a forest-to-transparent overlay, "GOOD FOOD ON THE GO" / "At home, at work, anywhere. MAGO fits your day." / "Shop now →" `/shop`.
  `revalidate = 300`.

- [ ] **Step 4: Run — expect PASS.** **Step 5: Visual check** vs `mockups/home.png` at 1440 and 390, including the CTA position over the hero at 1024, 1440 and 1920 widths.

- [ ] **Step 6: Commit** — `feat(home): hero, cup collection, banners, feature strip and recipes carousel`

---

### Task 12: Search, info pages and Our Story

**Files:**
- Create: `src/app/(store)/search/page.tsx`, `src/content/info-pages.ts`, `src/app/(store)/[page]/page.tsx`, `src/app/(store)/our-story/page.tsx`, `docs/content-to-confirm.md`, `e2e/search-info.spec.ts`

**Interfaces:**
- Consumes: `searchCatalog`, `ProductGrid`, `RecipeCard`, `SectionHeading`.
- Produces: `type InfoSlug = 'faq' | 'shipping' | 'returns' | 'terms' | 'privacy' | 'contact' | 'ingredients' | 'sustainability'`; `infoPages: Record<InfoSlug, { title: string; intro: string; sections: { heading: string; body: string }[] }>`. The `[page]` route uses `generateStaticParams` over `infoPages` keys and `dynamicParams = false`.

- [ ] **Step 1: Write failing e2e** `e2e/search-info.spec.ts`
  - `search finds pesto` — click the header "Search" button, type "Pesto" and submit → URL `/search?q=Pesto`, a product card containing "Al Pesto Genovese".
  - `search handles punctuation` — `/search?q=pesto%2C%20(genovese)%25` → status 200 and "Al Pesto Genovese" visible.
  - `search with no results` — `/search?q=zzzz` → text `No matches for "zzzz"`.
  - `info pages render` — `/faq`, `/shipping`, `/terms` each show an h1; `/not-a-real-page` → status 404.
  - `our story renders` — `/our-story` h1 "A modern take on a timeless heritage".

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement.**
  - **Search**: heading `Search results for "<term>"`; products via `ProductGrid`, then recipes via `RecipeCard`; empty query shows the search form; no results: `No matches for "<term>". Try "pesto" or "soup".`; `robots: { index: false }`.
  - **Info copy**: state only facts from the spec (cash on delivery; $3 delivery, free over $30; Lebanon-wide; 30 g protein per serving; 100 g pasta per cup; made in Lebanon; ready in 3–4 minutes; 5-cup Mix Box; 10% off 5+ cups). Anything the business has not given us (delivery days, return window, phone, email, legal entity, privacy specifics, sustainability claims) is worded without inventing numbers or commitments (e.g. "Our team will call you to confirm your delivery time") and listed in `docs/content-to-confirm.md` for the client.
  - **Our Story** (right half of `mockups/near-you-our-story.png`): hero "A MODERN TAKE ON A TIMELESS HERITAGE" + "Inspired by our Mediterranean roots, MAGO brings together tradition, bold flavours and modern nutrition — for a brighter, healthier tomorrow." with `/images/lifestyle-pantry-shelf.webp`; values row (Rooted in the Mediterranean · High protein for today · Real ingredients always · Made in Lebanon); "OUR STORY" block with the mockup paragraph ("Mago was born from a simple belief: good food can make everyday life brighter…") and `/images/lifestyle-kitchen-portrait.webp`; "GOOD FOOD, A BRIGHTER TOMORROW" with Recyclable packaging · Responsibly sourced ingredients · Supporting local farmers (also listed in content-to-confirm); CTA "Explore our cups".

- [ ] **Step 4: Run — expect PASS.** **Step 5: Visual check** of Our Story vs mockup at 1440 and 390.

- [ ] **Step 6: Commit** — `feat: search, info pages and Our Story`

---

### Task 13: Plan-1 verification and README

**Files:**
- Create: `README.md` (replace scaffold README)

- [ ] **Step 1: Full suite** — `npm test`, `npm run test:int`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run e2e` — all green; paste the summary lines into the task report.

- [ ] **Step 2: Re-run `supabase/tests/0001_catalog_rls.test.sql`** → `catalog rls: all passed`.

- [ ] **Step 3: Visual sweep** — home, shop, a product page (cup with lifestyle image, e.g. `lasagna-melanzane-ricotta`), search, an info page, Our Story at 1440×900 and 390×844; also the cart drawer open on mobile. Fix any remaining drift from the mockups.

- [ ] **Step 4: README** — what MAGO is; prerequisites (Node 24, npm); setup (`npm i`, `.env.local` from `.env.example`, `npm run images` needs `design-assets/`); applying SQL (migrations in order, then seed, then tests — the "Apply SQL" procedure); scripts table; promoting the first owner: `update public.profiles set role = 'owner' where id = (select id from auth.users where email = '<owner email>');`.

- [ ] **Step 5: Commit** — `docs: README for setup, database and scripts`
