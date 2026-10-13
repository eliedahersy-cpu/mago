# MAGO — storefront & admin

Online store for **MAGO** Mediterranean pasta cups (Lebanon, cash on delivery), built with
Next.js 16 (App Router, Cache Components), Tailwind CSS 4 and Supabase (Postgres + Auth + Storage).

- Design spec: [`docs/superpowers/specs/2026-10-10-mago-ecommerce-design.md`](docs/superpowers/specs/2026-10-10-mago-ecommerce-design.md)
- Build plans: [`docs/superpowers/plans/`](docs/superpowers/plans/)
- Copy and data still to confirm with MAGO: [`docs/content-to-confirm.md`](docs/content-to-confirm.md)

## Status

Plan 1 (foundation & catalog) is complete: home, shop, product pages, search, info pages,
Our Story, persisted cart drawer, full database schema with row-level security, and catalog seed.
Checkout, accounts, the admin dashboard, quiz, recipes, store locator and subscriptions follow
in Plans 2–5.

## Prerequisites

- Node.js 24 and npm
- A Supabase project (this one runs in `eu-central-1`)
- For regenerating images only: the original Drive artwork in `design-assets/` (git-ignored)

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the values below
npm run dev                   # http://localhost:3000
```

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard → Project Settings → API Keys (Project URL) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Same page, the `sb_publishable_…` key (safe to expose; RLS protects data) |
| `NEXT_PUBLIC_SITE_URL` | The public site origin, e.g. `https://mago.example` (used for social-share URLs) |

The app never needs the service-role / secret key. Staff permissions come from
`profiles.role` and row-level security.

## Database

SQL lives in `supabase/`:

1. `migrations/0001_schema.sql` → `0007_accounts.sql` — apply in order. 0006 adds the checkout
   functions `quote_cart`, `place_order` and `get_order_by_token`; 0007 adds `claim_customer`, which
   links a verified account to its customer record (and its earlier guest orders).
2. `seed/0001_catalog.sql` — **bootstrap data for a new project** (catalog, recipes, stores, plans,
   settings). It can be re-run during development, but it resets settings (delivery fee, free-delivery
   threshold, announcement), collection visibility, product copy, featured/best-seller flags and
   sort order, product images, subscription plan discounts and recipe status back to the seed values.
   Only product prices, product status and stock are left alone. **Do not re-run it on a live store.**
3. `tests/*.test.sql` — run after migrations/seed; each ends with a single `… all passed` row and
   raises `FAIL <reason>` otherwise. Fixtures are rolled back.
4. `cleanup/e2e-orders.sql` — removes orders placed by the Playwright checkout tests (emails
   `e2e-…@example.com`), restores their stock and drops those test customers. Run it after `npm run e2e`.

Apply them in the Supabase **SQL editor** (paste and Run) or with the Supabase CLI/MCP.
The project has "automatically expose new tables" **off**, so every new table needs explicit
`grant`s (see the end of `0002_rls.sql`).

### Promote the first owner

Sign up on the site with the owner's email, then run in the SQL editor:

```sql
update public.profiles
set role = 'owner'
where id = (select id from auth.users where email = 'owner@example.com');
```

## Deploy (Vercel)

`.env.local` is git-ignored, so a deploy only sees the variables set on the host. In the Vercel
project open **Settings → Environment Variables**, add the three variables from the table above for
the Production (and Preview) environments, then **redeploy**. Set `NEXT_PUBLIC_SITE_URL` to the
deployed origin, e.g. `https://mago.vercel.app`.

Pages prerender from Supabase during the build, so `npm run build` first runs
`scripts/check-env.mjs` and stops with a clear message if the Supabase variables are missing.
Without it, the build failed later with a masked `Failed to collect page data for /shop/[slug]`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (webpack — see note below) |
| `npm run build` / `npm start` | Checks the Supabase env vars, then production build (Turbopack) and server |
| `npm test` | Unit tests (Vitest) |
| `npm run test:int` | Integration tests against the Supabase project in `.env.local` |
| `npm run e2e` | Playwright end-to-end tests (starts the dev server if needed) |
| `npm run typecheck` | Regenerates route types, then `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run images` | Rebuilds `public/` images from `design-assets/` (sharp) |

Install the Playwright browser once with `npx playwright install chromium`.

## Notes for developers

- **Dev server uses webpack.** On this Windows setup, Turbopack's dev server did not pick up new
  Tailwind classes added to existing files, so `npm run dev` runs `next dev --webpack`.
  Production builds use Turbopack.
- **Caching.** Pages read data through `src/lib/data/cached.ts` (`'use cache'` + `cacheLife('minutes')`
  + tags `catalog`, `settings`, `recipes`, `reviews`, `discounts`). The plain query functions next to it
  are what the tests call.
- **Git on the F: drive** needs `git -c safe.directory=F:/DEV/Mago …` because the drive has no
  ownership information.
