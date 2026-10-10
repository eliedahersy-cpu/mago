# MAGO E-commerce — Design Spec

**Date:** 2026-10-10
**Status:** Approved in conversation (Option A); awaiting written-spec review
**Source material:** Google Drive folder "Mago Website" (15 page mockups, 52 product/lifestyle images)

---

## 1. Goal

Build the MAGO website shown in the Drive mockups as a working online store, plus a Shopify-style admin dashboard to run it, so MAGO can sell its pasta cups online in Lebanon with cash on delivery.

**Success looks like:**
- Every mockup page exists as a responsive page (desktop + mobile) that visually matches the mockups.
- A customer can browse, build a 5-cup Mix Box, take the quiz, subscribe, and place a COD order as a guest or logged-in customer.
- Staff can log into `/admin` and manage products, images, inventory, orders (through delivery), customers, discounts, subscriptions, recipes, store locations and reviews, and see sales on a dashboard.

### Decisions already made (from the user)
| Topic | Decision |
|---|---|
| Architecture | Single Next.js app; storefront + `/admin` route group; Supabase for DB, Auth, Storage |
| Payments | Cash on delivery only for v1; checkout structured so a gateway can be added later |
| Database | Supabase project in the user's account, accessed through the Supabase dashboard in Chrome |
| Assets | Drive images downloaded into `design-assets/` (originals) and optimized into `public/` |

### Assumptions (confirm or correct during spec review)
- English only, prices in USD, delivery within Lebanon only.
- Retail 400g pasta boxes are seeded as **draft** products (prices unknown), not visible until staff set a price and publish.
- Retailer list (Spinneys Hamra, Carrefour, Fahed, Metro Market, Azzi) is mockup sample data, seeded as editable store records.
- Transactional emails are out of scope for v1 (no email provider chosen); order confirmation is shown on-screen and in the account area.

---

## 2. Architecture

```
Browser --> Next.js (App Router, Server Components + Server Actions)
              |- app/(store)/...     public storefront
              |- app/(account)/...   customer account (auth required)
              |- app/admin/...       admin dashboard (staff role required)
              '- lib/supabase/*      server + browser clients via @supabase/ssr
                         |
                         v
               Supabase: Postgres (RLS on every table) . Auth . Storage . pg_cron
```

- **Reads:** Server Components query Supabase with the user's session (RLS decides what they see).
- **Writes:** Server Actions. Anything money-related goes through Postgres functions (`security definer`) so prices, discounts and stock are computed server-side, never trusted from the browser.
- **Cart:** Zustand store persisted to `localStorage` (guest-friendly). The cart holds only product ids + quantities (+ box contents); prices are re-read from the DB at checkout.
- **No service-role key in the app.** Staff powers come from `profiles.role` + RLS, so the app only needs the public URL + anon/publishable key.

### Tech stack
| Concern | Choice |
|---|---|
| Framework | Next.js (latest stable), React, TypeScript strict |
| Styling | Tailwind CSS v4 with design tokens from the mockups; shadcn/ui components in admin |
| Data | `@supabase/supabase-js` + `@supabase/ssr`; generated DB types |
| State | Zustand (cart, box builder, quiz, wishlist) |
| Forms/validation | React Hook Form + Zod (shared schemas client/server) |
| Charts | Recharts (admin dashboard) |
| Map | Leaflet + OpenStreetMap tiles (no API key) |
| Images | `next/image`; marketing/product seed images as WebP in `public/`; admin uploads to Supabase Storage |
| Tests | Vitest (pure logic), Playwright (smoke flows) |

---

## 3. Design system (from mockups)

- **Colours (tokens):** `cream` page background (~#FBF3E4), `cream-dark` card tint (~#F4E6CF), `forest` primary (~#0F4D3A, buttons, footer), `forest-dark` (~#0A3A2B), `terracotta` accent (~#C8432B, "BRIGHTER DAYS.", "MAGO MATCH", badges), `saffron` sun (~#F3A41B), `leaf` green (~#3E7A3A), `ink` text (~#1F2A24). Exact values tuned against the downloaded mockups during build.
- **Typography:** chunky rounded display face for headings (candidate: Fredoka 700, compared against mockups during build), clean sans for body (candidate: DM Sans), handwritten script for annotations like *"Same pasta. More possibilities."* (candidate: Caveat). All via `next/font/google`.
- **Shapes & motifs:** rounded-2xl cards, pill buttons and filter chips, Mediterranean arch shapes, leaf sprigs, sun logo, circular "30G PROTEIN PER CUP" badge, star ratings, heart wishlist icon.
- **Reusable components:** Header (logo, nav: Our Cups / Mix & Match / Find Your Match / Recipes / Our Story; search, account, cart badge, ORDER NOW), Footer (Shop/About/Help columns, newsletter, socials), ProductCard, ProductGrid, FeatureStrip (icon row), PromoBanner (Mix Box / Quiz / On the Go), Stepper, QuantityStepper, Accordion/Tabs, RecipeCard, StoreCard, SectionHeading, Badge, Carousel.

---

## 4. Storefront pages

| Route | Page | Key content (from mockups) |
|---|---|---|
| `/` | Home | Hero "Good food, brighter days."; cup collection carousel; Build Your Mix Box banner; Find Your Match banner; feature strip (Real ingredients, Mediterranean inspired, Ready in minutes, No artificial colours, A brighter way to eat); Recipes carousel; Good Food On The Go banner |
| `/shop` | Our Pasta Cups | Hero + benefit icons (30g protein, real ingredients, ready in minutes, no artificial colours, made in Lebanon); collection pills; sort (featured, price, rating, newest); per-page; product grid with rating, short line, price, Add to cart, wishlist; Build Your Own Box banner |
| `/shop/[slug]` | Product | Gallery with thumbnails; Best Seller badge; title, rating, price, description; qty + Add to cart; wishlist; benefit icons; "Buy any 5 cups and save 10%" upsell to box builder; perks (free delivery over $30, fridge-safe, secure COD); tabs: About / Ingredients (ingredient images) / Nutrition / How to prepare (3 steps) / Reviews; You may also like; Complete the experience (Mix Box, Recipe Booklet) |
| `/mix-box` | Build Your Mix Box | Hero with 1–5 stepper; pick 5 cups grid (+/−); progress tray; How it works (Pick 5, Build your mix, We pack & ship) |
| `/mix-box/review` | Your Mix Box | Box contents with qty edit/remove, "Why this mix works", special instructions, gift note, order summary → add box to cart / checkout |
| `/find-your-match` | Quiz | Intro + 6 steps: Favourite flavours (≤3), Spice level, Texture, Eating occasion, Purchase priority, Mediterranean style → results: top match, alternatives, suggested 5-cup mix; Add all to cart; Retake |
| `/recipes` | Recipes | Hero + search; filter chips (All, Quick Meals, Extra Protein, Mediterranean Twists, Comfort Food, Soups, Vegetarian); recipe cards (time, title, cup used, tag); Share your creations (#MagoMoments) |
| `/recipes/[slug]` | Recipe | Hero image, title, "Made with" cup + Shop this cup, meta (time, difficulty, cups, vegetarian), ingredients checklist, numbered instructions, MAGO tip, You may also like |
| `/subscribe` | Subscribe & Save | Hero + perks; How it works (4 steps); plan cards (every 2 / 4 / 6 weeks with % saving); flow: Plan → Pick 5 cups → Delivery & extras (+ gift) → Review → Subscribe (login required at Review) |
| `/stores` | Find MAGO Near You | Map of Lebanon with pins; search by city/area; type chips (All, Supermarkets, Minimarkets, Online, Cafés & Restaurants); list with distance (optional browser geolocation) + Directions (Google Maps link) |
| `/stores/[slug]` | Store detail | Photo, address, distance, hours, Directions, available MAGO products, more nearby |
| `/our-story` | Our Story | "A modern take on a timeless heritage", values (Rooted in the Mediterranean, High protein for today, Real ingredients always, Made in Lebanon), story text, "Good food, a brighter tomorrow" sustainability (recyclable packaging, responsibly sourced, supporting local farmers) |
| `/cart` (drawer + page) | Cart | Line items incl. Mix Box with its 5 cups, qty, discount code field, totals, checkout |
| `/checkout` | Checkout | Contact (name, email, phone), delivery address (governorate, area, street/building, floor, notes), gift note, payment = Cash on delivery, order summary → Place order |
| `/order/[token]` | Confirmation | Order number, items, totals, delivery info, status |
| `/account/*` | Account | Login/register (email+password, magic link), orders, order detail, subscriptions (pause/skip/cancel/edit cups), addresses, wishlist |
| `/faq`, `/shipping`, `/returns`, `/terms`, `/privacy`, `/contact`, `/ingredients`, `/sustainability` | Info pages | Simple content pages linked from footer |
| `/search` | Search | Product + recipe search by name/ingredient |

Header search box searches products and recipes. Newsletter form writes to `newsletter_subscribers`.

---

## 5. Data model (Supabase Postgres)

All tables have RLS enabled. `id uuid default gen_random_uuid()`, `created_at`, `updated_at` timestamps unless noted. Money stored as `numeric(10,2)` USD.

### Catalog
- **products** — `slug` (unique), `name` (e.g. "Fusilli Cup"), `flavour` (e.g. "Spicy Muhammara"), `sauce` (packaging descriptor, e.g. "Smoky pepper, walnut & chili sauce"), `type` (`cup` | `bundle` | `extra` | `retail` | `merch`), `tagline`, `short_description`, `description`, `story` (About tab), `price`, `compare_at_price`, `status` (`draft` | `active` | `archived`), `sku`, `stock`, `track_inventory`, `allow_backorder`, `low_stock_threshold`, `protein_g`, `prep_minutes`, `is_best_seller`, `is_featured`, `sort_order`, `badges text[]`, `ingredients jsonb` ([{name, image}]), `nutrition jsonb` ([{label, value}]), `preparation jsonb` (steps), `flavour_profiles text[]`, `spice_level int 0–4`, `textures text[]`, `occasions text[]`, `style` (`lebanese` | `italian` | `fusion`), `bundle_size int` (5 for Mix Box), `seo_title`, `seo_description`, `rating_avg`, `rating_count` (maintained by trigger from approved reviews)
- **product_images** — `product_id`, `url` (Storage URL or `/public` path), `alt`, `position`, `kind` (`packshot` | `lifestyle` | `video`)
- **collections** — `slug`, `title`, `description`, `image`, `sort_order`, `is_visible`; **collection_products** (`collection_id`, `product_id`, `position`)
- **inventory_movements** — `product_id`, `delta`, `reason` (`order` | `cancel` | `adjustment` | `restock` | `subscription`), `order_id`, `note`, `created_by`

### Customers
- **profiles** — `id` = `auth.users.id`, `role` (`owner` | `staff` | `customer`), `full_name`, `phone`; created by trigger on signup
- **customers** — `profile_id` (nullable for guests), `email`, `phone`, `full_name`, `accepts_marketing`, `notes`, `tags text[]`; unique on lower(email); orders link here (guest + registered unified)
- **addresses** — `customer_id`, `label`, `full_name`, `phone`, `governorate`, `area`, `street`, `building`, `floor`, `notes`, `is_default`
- **wishlist_items** — `profile_id`, `product_id` (guests use localStorage)

### Orders
- **orders** — `number` (sequence, displayed `#MAGO-1001`), `access_token uuid` (guest confirmation URL), `customer_id`, `email`, `phone`, `status` (`pending` | `confirmed` | `preparing` | `out_for_delivery` | `delivered` | `cancelled`), `payment_method` (`cod`), `payment_status` (`unpaid` | `paid` | `refunded`), `subtotal`, `discount_total`, `shipping_total`, `total`, `discount_code`, `shipping_address jsonb`, `special_instructions`, `gift_note`, `is_gift`, `source` (`web` | `subscription` | `admin`), `subscription_id`, `idempotency_key` (unique), `cancelled_at`, `delivered_at`
- **order_items** — `order_id`, `product_id`, `parent_item_id` (Mix Box cups point to the box line), `name`, `flavour`, `image`, `unit_price`, `quantity`, `line_total` (snapshots so later product edits don't change history)
- **order_events** — `order_id`, `type` (`created` | `status_changed` | `payment` | `note` | `cancelled` | `edited`), `message`, `data jsonb`, `created_by`

### Promotions
- **discounts** — `code` (nullable for automatic), `title`, `kind` (`percentage` | `fixed_amount` | `free_shipping`), `value`, `applies_to` (`order` | `cups`), `min_subtotal`, `min_cup_quantity`, `starts_at`, `ends_at`, `usage_limit`, `usage_count`, `once_per_customer`, `is_automatic`, `is_active`
- Seeded rule: automatic **"Mix & Match 10%"** = 10% off cups when the cart contains ≥5 cups (counted across Mix Box + loose cups), matching "Buy any 5 cups and save 10%". Editable / can be disabled in admin.

### Subscriptions
- **subscription_plans** — `name`, `interval_weeks` (2, 4, 6), `discount_percent` (15, 10, 10), `is_popular`, `is_active`, `sort_order`
- **subscriptions** — `customer_id`, `plan_id`, `status` (`active` | `paused` | `cancelled`), `items jsonb` (5 cups + extras), `address jsonb`, `next_delivery_date`, `is_gift`, `gift_note`, `last_order_id`
- **pg_cron** job (daily 06:00 Asia/Beirut): `process_due_subscriptions()` creates a COD order (source `subscription`) for each active subscription due within 2 days, then advances `next_delivery_date` by `interval_weeks`. Admin has a "Run now" button.

### Content
- **recipes** — `slug`, `title`, `subtitle`, `hero_image`, `minutes`, `difficulty`, `servings`, `cups_used`, `is_vegetarian`, `tags text[]`, `product_id` (Made with), `intro`, `ingredients jsonb`, `steps jsonb` ([{title, body}]), `tip`, `status` (`draft` | `published`), `sort_order`
- **stores** — `slug`, `name`, `chain`, `type` (`supermarket` | `minimarket` | `online` | `cafe_restaurant`), `address`, `area`, `city`, `lat`, `lng`, `hours jsonb`, `phone`, `image`, `website`, `is_active`; **store_products** (`store_id`, `product_id`)
- **reviews** — `product_id`, `customer_id` (nullable), `author_name`, `rating 1–5`, `title`, `body`, `status` (`pending` | `approved` | `rejected`), `is_verified_buyer`
- **newsletter_subscribers** — `email` unique, `source`
- **settings** — single row: `store_name`, `contact_email`, `contact_phone`, `currency` ('USD'), `shipping_flat_fee` (3.00), `free_shipping_threshold` (30.00), `delivery_areas jsonb` (Lebanese governorates), `social_links jsonb`, `announcement_bar`

### Postgres functions (RPC)
| Function | Caller | Purpose |
|---|---|---|
| `is_staff()` | RLS | true when `profiles.role in ('owner','staff')` for `auth.uid()` |
| `quote_cart(items jsonb, code text)` | anon/auth | Returns line prices, discounts, shipping, total — used by cart & checkout to display server-truth totals |
| `place_order(payload jsonb)` | anon/auth | Validates items/stock, recomputes all prices via the same logic as `quote_cart`, upserts customer, inserts order/items/event, decrements stock + logs movements, increments discount usage; idempotent on `idempotency_key`; returns `{number, access_token}` |
| `get_order_by_token(token uuid)` | anon/auth | Confirmation page data for guests |
| `update_order_status(order_id, status, note)` | staff | Validated status transitions + timeline event; cancelling restocks |
| `adjust_inventory(product_id, delta, reason, note)` | staff | Stock change + movement log |
| `create_subscription(payload)` / `update_subscription(...)` | auth | Validates 5 cups, plan, address |
| `process_due_subscriptions()` | cron/staff | See Subscriptions |
| `dashboard_stats(from, to)` | staff | Sales, orders, AOV, customers, sales-by-day, top products |

### RLS summary
- **Public (anon) read:** active products + their images, visible collections, published recipes, approved reviews, active stores, subscription plans, public settings.
- **Customer:** read own profile/customer/orders/items/subscriptions/addresses/wishlist; write own addresses/wishlist; insert reviews (forced `pending`); manage own subscriptions via RPC.
- **Anon insert:** newsletter_subscribers only. Orders only via `place_order`.
- **Staff:** full read/write on all tables via `is_staff()`.
- **Storage:** bucket `product-images` and bucket `content-images` (recipes/stores): public read, staff write.

---

## 6. Pricing rules (single source of truth: SQL `quote_cart`)

1. Cup price comes from `products.price` (seed: $4.50).
2. Mix Box line = sum of its 5 cups' prices (the bundle product itself has price 0; box contents are its child lines).
3. Automatic "Mix & Match 10%": if total cups in cart (loose + in boxes) ≥ 5 → 10% off all cup prices.
4. Discount code (one per order): applied after automatic discounts; `free_shipping` kind zeroes shipping. Codes do not stack with each other.
5. Shipping: $3.00 flat; free when (subtotal − discounts) ≥ $30.00. Values come from `settings`.
6. Subscriptions: the plan's `discount_percent` replaces rule 3 for subscription orders; rule 5 still applies.
7. Amounts are rounded to 2 decimals per line, then summed.

The mockups' sample totals (e.g. box review $22.50 + $3.00 = $25.50, plan prices $21.50 / $22.50) are illustrative; the live site shows numbers computed by these rules.

---

## 7. Admin dashboard (`/admin`)

Layout: left sidebar (Home, Orders, Products, Collections, Inventory, Customers, Discounts, Subscriptions, Content → Recipes / Stores / Reviews, Analytics, Settings), top bar with search + user menu. Desktop-first, usable on tablet/mobile. Access: middleware redirects non-staff to `/admin/login`.

| Module | Capabilities |
|---|---|
| Home | KPI cards (sales, orders, AOV, new customers, with % change vs previous period); 30-day sales chart; recent orders; top products; low-stock alerts; active subscriptions count; date-range picker |
| Orders | Table with search (number, name, phone, email), filters (status, payment, source, date), pagination; detail page: items (box contents nested), customer + address, totals, status actions (Confirm → Preparing → Out for delivery → Delivered; Cancel with restock), Mark as paid, internal notes, timeline; printable packing slip; create manual order (source `admin`) |
| Products | List with image, status, stock, price, collections, filters; create/edit form: details, pricing, inventory, images (drag & drop upload to Storage, reorder, alt text), collections, quiz attributes (flavour profiles, spice, textures, occasions, style), ingredients/nutrition/preparation editors, SEO; duplicate; archive |
| Collections | CRUD + ordered product assignment |
| Inventory | Stock table with inline adjust (+/− with reason), movement history, low-stock filter |
| Customers | List (orders count, total spent, last order); detail: profile, addresses, orders, subscriptions, notes, tags |
| Discounts | CRUD for codes and automatic rules; usage stats |
| Subscriptions | List + filters; detail (cups, plan, next delivery, status changes, generated orders); plans editor; "Run due subscriptions now" |
| Recipes | CRUD with image upload, ingredients/steps editors, publish toggle |
| Stores | CRUD with lat/lng picker on a map, products available |
| Reviews | Moderation queue (approve/reject) |
| Analytics | Sales by day/week, by product, by collection, by source; CSV export of orders |
| Settings | Store info, shipping fee & threshold, delivery areas, announcement bar, social links, staff list (promote/demote existing users) |

---

## 8. Find Your Match — scoring

Config lives in code (`lib/quiz/config.ts`): 6 questions, each option maps to weights on product attributes.

| Step | Options → attribute |
|---|---|
| 1 Favourite flavours (≤3) | Spicy & Bold → `spicy`, Creamy & Rich → `creamy`, Fresh & Herby → `herby`, Comforting & Classic → `comforting`, Soupy & Light → `soupy`, Sweet & Unique → `sweet` (matches `flavour_profiles`) |
| 2 Spice level | No Heat 0 · Mild Warmth 1 · Medium Kick 2 · Spicy 3 · Extra Hot 4 (closeness to `spice_level`) |
| 3 Texture | Twirly & saucy · Brothy & tender · Creamy & cheesy · Soft & comforting (matches `textures`) |
| 4 Eating occasion | Quick lunch · On-the-go days · At home · Post-workout fuel (matches `occasions`) |
| 5 Purchase priority | Highest protein · Bold new flavours · Classic comfort · Best value (boosts protein / novelty / comfort; "Best value" highlights the Mix Box) |
| 6 Mediterranean style | Lebanese classics · Italian classics · A bit of both (matches `style`) |

Score = weighted sum per active cup product. Results = top match, next 2 alternatives, and a suggested 5-cup mix (top-scored cups, at most 2 of any one product). Pure function, unit-tested. Results have "Add all to cart" (adds the 5-cup mix as a Mix Box) and "Retake quiz".

---

## 9. Seed data

- **Cups (12, $4.50, 30g protein, active):** Fusilli Spicy Muhammara (best seller), Fusilli Al Pesto Genovese, Rishta Lentil & Pasta Soup, Pastina Sweet Cinnamon Milk Pasta, Tagliolini Al Tartufo Bianco, Conchiglie Mac & Cheese, Tagliolini Creamy Mushroom, Tagliolini Al Limone, Tagliolini Tarator & Pine Nuts, Macaroon bil Toum (Lebanese Garlic Pasta), Conchigliette in Brodo, Lasagna Melanzane & Ricotta. Each gets its Drive packshot, tagline/description from the mockups (written where missing), quiz attributes, ingredients, nutrition and preparation.
- **Bundle:** The MAGO Mix Box (`bundle_size` 5). **Extras:** Extra Parmesan $2.50, Chili Flakes $1.50, Mixed Herbs $1.50, Garlic Crunch $1.50. **Merch:** Recipe Booklet $5.00.
- **Retail (draft):** Fusilli 400g, Tagliolini 400g, Conchiglie 400g, Lasagna 400g.
- **Collections:** Fusilli, Rishta, Pastina, Tagliolini, Conchiglie, Specialities (Macaroon, Conchigliette, Lasagna), Best Sellers, Pasta Boxes.
- **Recipes (8):** from the recipes mockup (Spicy Muhammara Fusilli with Roasted Veggies, Pesto Fusilli with Grilled Chicken, Creamy Truffle Tagliolini with Mushrooms, Mac & Cheese Conchiglie with Crispy Breadcrumbs, Rishta Soup with Lemon & Herbs, Sweet Cinnamon Pastina with Caramelized Bananas, Lemon Tagliolini with Herbs, Garlic Macaroon with Crispy Chickpeas).
- **Stores (5):** from the locator mockup, with approximate coordinates.
- **Plans:** every 2 weeks 15% (most popular), every 4 weeks 10%, every 6 weeks 10%.
- **Reviews:** none faked. Ratings and counts render only from real approved reviews; products without reviews show "No reviews yet". (The mockup counts like "(128)" are not copied as fake data.)

---

## 10. Assets pipeline

1. Originals → `design-assets/mockups/*.png` and `design-assets/images/*.png` (git-ignored; kept locally as reference).
2. Script `scripts/optimize-images.mjs` (sharp): product packshots → `public/products/<slug>.webp` (~1200px), lifestyle/hero → `public/images/<name>.webp` (1600–2400px), logo → `public/brand/`.
3. Decorative arches/leaves/sun recreated as inline SVG components (crisp, recolourable) rather than cropped from mockups.

---

## 11. Error handling & edge cases

- **Out of stock:** cart flags unavailable lines; `place_order` rejects with a clear message listing them; product page shows "Sold out" and disables Add.
- **Price changed since added:** totals always come from `quote_cart`; checkout shows a notice if totals changed.
- **Invalid/expired code:** inline error from `quote_cart`; order can still be placed without it.
- **Double submit:** checkout button disabled while pending; `place_order` is idempotent on a client-generated key.
- **Admin status transitions** validated in `update_order_status` (e.g. cannot deliver a cancelled order).
- **Expired admin session** → redirect to login with `next` preserved.
- **Server action failures** return typed `{ ok: false, error }` shown as toasts; raw SQL errors never reach customers.
- Branded `not-found.tsx` and `error.tsx` per route group.

---

## 12. Testing & verification

- **Vitest:** quiz scoring, cart store, formatters, Zod schemas, client price-display helpers.
- **SQL checks** (run in the Supabase SQL editor after migrations): `quote_cart` cases (single cup, 5 cups → 10%, code handling, free-shipping threshold), `place_order` stock decrement + rejection + idempotency, cancel restock, RLS (anon cannot read orders; customer sees only own).
- **Playwright smoke:** home → product → add to cart → guest COD checkout → confirmation; build box → checkout; admin login → move an order to Delivered; create product with image.
- **Visual check:** each page side-by-side with its mockup at 1440px and 390px widths.
- `npm run build`, `npm run lint`, `tsc --noEmit` clean before each phase is called done.

---

## 13. Delivery phases

1. **Foundation:** scaffold, tooling, design tokens/fonts, layout (header/footer), Supabase clients, full schema migration + RLS + functions, seed, asset pipeline.
2. **Catalog:** home, shop, product page, collections, search, info pages.
3. **Commerce:** cart drawer/page, Mix Box builder + review, checkout, `place_order`, confirmation, customer auth + account (orders, addresses, wishlist).
4. **Admin core:** layout + auth guard, dashboard, orders, products (+ image upload), collections, inventory, customers, discounts, settings.
5. **Engagement:** quiz, recipes (store + admin), store locator (store + admin), reviews (store + admin), subscriptions (flow, account management, admin, pg_cron).
6. **Polish & launch:** SEO (metadata, sitemap, OG images, Product JSON-LD), performance (image sizes, caching/revalidation), accessibility pass, Playwright suite, README with setup + Vercel deploy instructions.

**First admin:** the owner signs up on the site; their account is promoted to `owner` with one SQL statement (documented in README).

---

## 14. Out of scope (v1)

Online card payments, transactional emails/SMS, Arabic/RTL, multi-currency, product variants, multi-warehouse inventory, tax calculation, gift cards, abandoned-cart recovery, review replies. The schema leaves room for payments (`payment_method`, `payment_status`) and notifications (order events) later.
