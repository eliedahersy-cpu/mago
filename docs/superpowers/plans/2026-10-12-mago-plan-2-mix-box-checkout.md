# MAGO Plan 2 — Mix Box & Checkout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A customer can build a 5-cup Mix Box, review it, put it in the cart next to loose items, and place a cash-on-delivery order as a guest, landing on a confirmation page.

**Architecture:** The cart becomes a union of product lines and box lines (persisted v2, migrated from v1). Builder state lives in its own small Zustand store; pure functions own the box rules, the display estimate and the "Why this mix works" grouping. Server-truth money comes from new SQL functions `quote_cart` / `place_order` / `get_order_by_token` (migration 0006), called from a server action at checkout. Customer accounts (auth, order history, addresses, wishlist) move to Plan 2b.

**Tech Stack:** Next.js 16.4 App Router (Cache Components), React 19.3, TypeScript strict, Tailwind 4.3, Zustand 5, Zod 4, Supabase (Postgres + RLS), Vitest 5, Playwright 1.64.

**Spec:** `docs/superpowers/specs/2026-10-10-mago-ecommerce-design.md` (§4 `/mix-box`, `/mix-box/review`, `/cart`, `/checkout`, `/order/[token]`; §5 orders/order_items/RPCs; §6 pricing rules; §9 edge cases).

## Global Constraints

- Box size comes from the bundle product's `bundle_size` (seed: 5); the Mix Box bundle product has price 0 and its line price is the sum of its cups (§6.2).
- Automatic "Mix & Match": when cups in the cart (loose + in boxes) ≥ `min_cup_quantity`, `value`% off all cup prices (§6.3). One discount code per order, applied after automatic discounts; `free_shipping` zeroes shipping (§6.4).
- Shipping: `settings.shipping_flat_fee` ($3.00), free when subtotal − discounts ≥ `settings.free_shipping_threshold` ($30.00) (§6.5). Amounts rounded to 2 decimals per line, then summed (§6.7).
- Payment: cash on delivery only. No card fields anywhere.
- Prices shown before checkout are estimates; the checkout page shows `quote_cart` totals; `place_order` recomputes everything server-side and is idempotent on a client-generated key.
- Anonymous clients never read `orders` directly; confirmation reads through `get_order_by_token`.
- New SQL: `security definer`, `set search_path = ''`, explicit `grant execute ... to anon, authenticated` (auto-expose is off).
- Copy: English, USD, Lebanon. Brand tokens and fonts from Plan 1 (`globals.css`).

## Review Focus

1. A persisted cart from Plan 1 (v1 lines without `kind`) must survive the upgrade — lines kept, nothing crashes.
2. Builder at the limit: adding a 6th cup, raising one cup's quantity past the remaining slots, or a sold-out cup must be impossible, not silently accepted.
3. Leaving the review page under 5 cups (after decreasing a quantity) must block checkout and say why.
4. `place_order` with a tampered payload (wrong box size, inactive/draft product, quantity 0, price fields supplied by the client) must reject or ignore the tampering — totals always from the DB.
5. Double-clicking "Place order" must create one order (same idempotency key ⇒ same order number).

---

## Part A — Mix Box

### Task 1: Cart v2 — box lines, order notes, v1 migration

**Files:**
- Modify: `src/lib/cart/lines.ts`, `src/lib/cart/lines.test.ts`, `src/lib/cart/store.ts`
- Modify (type fallout only): `src/components/cart/CartDrawer.tsx`, `src/components/product/AddToCartButton.tsx` (and any other `CartLine` consumer)

**Interfaces:**
- Produces (`src/lib/cart/lines.ts`):
  - `interface ProductLine { kind: 'product'; id: string /* 'p:<productId>' */; productId; slug; name; flavour: string | null; image: string | null; unitPrice: number; quantity: number }`
  - `interface BoxCup { productId: string; slug: string; name: string; flavour: string | null; image: string | null; unitPrice: number; quantity: number }`
  - `interface BoxLine { kind: 'box'; id: string /* 'b:<id>' */; productId: string /* bundle */; slug: string; name: string; image: string | null; cups: BoxCup[]; quantity: number }`
  - `type CartLine = ProductLine | BoxLine`; `type CartProduct = Omit<ProductLine, 'kind' | 'id' | 'quantity'>`; `type NewBox = Omit<BoxLine, 'kind' | 'id' | 'quantity'>`
  - `addBox(lines: CartLine[], box: NewBox, id: string): CartLine[]` — appends `{ kind: 'box', id: 'b:' + id, quantity: 1 }`; if a box with the same cups (same productId → quantity set, order-insensitive) exists, increments that line instead.
  - `lineUnitPrice(line: CartLine): number` — product: `unitPrice`; box: Σ cup `unitPrice × quantity` (cent-safe).
  - `cartCount` (Σ quantity; a box counts 1 per box), `cartSubtotal` (Σ `lineUnitPrice × quantity`, cent-safe) keep their names.
  - `sanitizePersistedCart(persisted: unknown): { lines: CartLine[]; orderNotes: OrderNotes }` — accepts v1 product lines (no `kind`) and upgrades them; drops malformed lines; box lines need ≥1 cup, cup quantities int 1–99.
  - `interface OrderNotes { instructions: string; isGift: boolean; giftNote: string }`, `EMPTY_ORDER_NOTES`.
- Produces (`src/lib/cart/store.ts`): `useCart` gains `orderNotes`, `addBox(box: NewBox)` (id from `crypto.randomUUID()`, opens drawer), `setOrderNotes(patch: Partial<OrderNotes>)`; `clear()` also resets notes. Persist `version: 2`; `partialize` keeps `lines` + `orderNotes`; `migrate`/`merge` go through `sanitizePersistedCart`.

- [ ] **Step 1: Write the failing tests** in `lines.test.ts` (update existing product-line expectations to include `kind: 'product'`):
  - `adds a box line with a b: id` → `addBox([], box, 'x')[0]` has `kind: 'box'`, `id: 'b:x'`, `quantity: 1`.
  - `an identical box increments instead of duplicating` → two `addBox` with cups in different order → 1 line, quantity 2.
  - `box unit price is the sum of its cups` → 5 × 4.50 cups ⇒ `lineUnitPrice` 22.5.
  - `count treats a box as one item; subtotal includes boxes` → box + 2 loose cups ⇒ count 3, subtotal 31.5.
  - `upgrades v1 product lines` → `sanitizePersistedCart({ lines: [{ id:'p:a', productId:'a', ..., quantity: 2 }] })` ⇒ line has `kind: 'product'`; orderNotes = `EMPTY_ORDER_NOTES`.
  - `drops malformed boxes` → box with `cups: []` or a cup quantity 0 is dropped.
- [ ] **Step 2:** Run `npx vitest run src/lib/cart` — Expected: FAIL (`addBox` not exported).
- [ ] **Step 3:** Implement the interfaces above; zod discriminated union for v2 lines, plus a pre-step that adds `kind: 'product'` to objects without `kind`. Update the drawer/button for the union type (drawer keeps rendering product lines; box rendering is Task 5).
- [ ] **Step 4:** Run `npx vitest run src/lib/cart` and `npm run typecheck` — Expected: PASS, no type errors.
- [ ] **Step 5:** Commit `feat(cart): v2 cart with Mix Box lines and order notes`.

### Task 2: Box rules, display estimate, "Why this mix works", builder store

**Files:**
- Create: `src/lib/mix-box/box.ts`, `src/lib/mix-box/box.test.ts`, `src/lib/mix-box/highlights.ts`, `src/lib/mix-box/highlights.test.ts`, `src/lib/mix-box/store.ts`, `src/lib/pricing/estimate.ts`, `src/lib/pricing/estimate.test.ts`

**Interfaces:**
- Consumes: `BoxCup` (Task 1), `AutomaticDiscount`, `StoreSettings` (`src/lib/types.ts`).
- Produces (`box.ts`): `DEFAULT_BOX_SIZE = 5`; `boxCount(cups: BoxCup[]): number`; `remainingSlots(cups, size): number`; `addCupToBox(cups, cup: Omit<BoxCup, 'quantity'>, size): BoxCup[]` (no-op when full; increments existing); `setCupQuantityInBox(cups, productId, qty, size): BoxCup[]` (≤0 removes; clamps so the box never exceeds `size`); `boxSubtotal(cups): number` (cent-safe).
- Produces (`estimate.ts`): `interface EstimateInput { cupSubtotal: number; cupCount: number; otherSubtotal: number; discount: AutomaticDiscount | null; shippingFlatFee: number; freeShippingThreshold: number }`, `interface Totals { subtotal: number; discount: number; shipping: number; total: number }`, `estimateTotals(input): Totals` implementing §6 rules 3, 5, 7 (no shipping on an empty cart).
- Produces (`highlights.ts`): `type HighlightKey = 'bold' | 'fresh' | 'comforting' | 'sweet' | 'indulgent'`; `interface MixHighlight { key; title: string; text: string; image: string | null }`; `mixHighlights(cups: { name: string; flavour: string | null; image: string | null; flavourProfiles: string[] }[]): MixHighlight[]`.
  - Each cup's category = first match in: `spicy→bold`, `sweet→sweet`, `soupy→comforting`, `herby→fresh`, `creamy→indulgent`, `comforting→comforting`; cups with none are skipped; duplicates (same name+flavour) once.
  - Output order bold, fresh, comforting, sweet, indulgent. Titles: "Bold & Spicy", "Fresh & Herby", "Comforting", "Sweet", "Indulgent". Text = `<Name Flavour>[ and <Name Flavour>…] <verb phrase>` with singular/plural phrases: bold "brings/bring vibrant, smoky flavours.", fresh "adds/add a fresh, aromatic touch.", comforting "is/are warm, wholesome and satisfying.", sweet "is/are a cosy, feel-good treat.", indulgent "brings/bring a luxurious, gourmet finish."
- Produces (`store.ts`): `useMixBox` (persist `mago-mix-box`, version 1, `skipHydration`, safe storage like the cart) with `{ cups: BoxCup[]; hydrated: boolean; add(cup, size); setQuantity(productId, qty, size); remove(productId); clear() }`; sanitizes persisted cups with the Task 1 cup schema.

- [ ] **Step 1: Write the failing tests:**
  - box: `stops at the box size` (5 adds of distinct cups then a 6th ⇒ count 5, 6th absent); `increments an existing cup`; `setCupQuantityInBox clamps to remaining slots` (cups a:3, b:1, set b→4 ⇒ b:2); `zero removes`; `boxSubtotal` 5×4.50 ⇒ 22.5.
  - estimate (discount 10%, min 5, fee 3, threshold 30): 5 cups 22.50 ⇒ `{22.5, 2.25, 3, 23.25}`; 4 cups 18 ⇒ `{18, 0, 3, 21}`; 8 cups 36 ⇒ `{36, 3.6, 0, 32.4}`; null discount 5 cups ⇒ discount 0; empty ⇒ all 0; `otherSubtotal` 10 with 5 cups ⇒ discount only on cups (2.25) and threshold uses the full 32.50 − 2.25 = 30.25 ⇒ shipping 0.
  - highlights: the mockup box (Spicy Muhammara {spicy}, Al Pesto Genovese {herby}, Rishta {soupy,comforting}, Pastina {sweet,comforting}, Al Tartufo Bianco {creamy}) ⇒ keys `['bold','fresh','comforting','sweet','indulgent']` and bold text `"Fusilli Cup Spicy Muhammara brings vibrant, smoky flavours."`; two creamy cups ⇒ one indulgent highlight with "… and … bring a luxurious, gourmet finish."; duplicates once; `[]` ⇒ `[]`.
- [ ] **Step 2:** `npx vitest run src/lib/mix-box src/lib/pricing` — Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Same command — Expected: PASS. `npm run typecheck` clean.
- [ ] **Step 5:** Commit `feat(mix-box): box rules, price estimate, mix highlights, builder store`.

### Task 3: `/mix-box` builder page

**Files:**
- Create: `src/app/(store)/mix-box/page.tsx`, `src/components/mix-box/MixBoxBuilder.tsx` (client), `src/components/mix-box/BoxStepper.tsx`, `src/components/mix-box/CupPickerCard.tsx`, `src/components/mix-box/BoxTray.tsx`, `src/components/mix-box/MixBoxSections.tsx` (perks strip, How it works, cravings banner — server components), `e2e/mix-box.spec.ts`
- Modify: `src/lib/data/catalog.ts` + `src/lib/data/cached.ts` (add `getMixBoxCups(): Promise<Product[]>` = active `cup` products by `sort_order`)

**Interfaces:**
- Consumes: `useMixBox`, `addCupToBox`/`remainingSlots` (Task 2), `toCartProduct`-style mapping, `isPurchasable` (`src/lib/catalog/stock.ts`), `getProductBySlug('mago-mix-box')` (bundle; `bundleSize ?? DEFAULT_BOX_SIZE`).
- Produces: route `/mix-box`; `MixBoxBuilder({ cups: Product[]; boxSize: number; boxImage: string })`; test ids `box-tray`, `box-count` (text `N/5`), `cup-card-<slug>`.

Layout (mockup `build-box-1.png`): hero — "Build your MAGO Mix Box", "Pick 5 cups. Your way. More flavours. More fun.", `BoxStepper` (circles 1…size, filled up to the current count, label "Choose 5 cups" → "N of 5 chosen"), START MIXING scrolls to `#cups`, open-box image right; perks strip (Mix your favourites / More flavours to explore / The perfect gift / Made for every mood); "Explore our cups" grid (image on cream with `mix-blend-multiply`, name, flavour, short description, price, ADD → becomes a quantity stepper whose max is current + remaining; sold-out shows "Sold out", disabled; when the box is full ADD reads "Box full", disabled); "View all flavours" → `/shop`; How it works (Pick 5 cups / Build your mix / We pack and ship); banner "Create a box that fits your cravings." with START MIXING. `BoxTray`: sticky bottom bar with 5 slot thumbnails, "Your box N/5", remaining hint ("Add 2 more cups"), "Review my box" button → `/mix-box/review`, disabled until full; "Clear" link when non-empty. Page metadata title "Build your Mix Box".

- [ ] **Step 1: Write the failing e2e** `e2e/mix-box.spec.ts` → `builds a full box and reaches review`: go `/mix-box`; `box-count` shows `0/5`; click ADD on 4 distinct cups and the + of the first once; `box-count` `5/5`; every remaining ADD button reads "Box full" and is disabled; "Review my box" enabled; click → URL `/mix-box/review`.
- [ ] **Step 2:** `npx playwright test e2e/mix-box.spec.ts` — Expected: FAIL (404).
- [ ] **Step 3:** Implement the data function and components.
- [ ] **Step 4:** Re-run — Expected: PASS (review page may still 404 → assert URL only). `npm run typecheck`, `npm run lint` clean.
- [ ] **Step 5:** Commit `feat(mix-box): builder page`.

### Task 4: `/mix-box/review` page

**Files:**
- Create: `src/app/(store)/mix-box/review/page.tsx`, `src/components/mix-box/MixBoxReview.tsx` (client), `src/components/mix-box/WhyThisMix.tsx`
- Modify: `e2e/mix-box.spec.ts`

**Interfaces:**
- Consumes: `useMixBox`, `setCupQuantityInBox`, `boxCount`, `boxSubtotal` (Task 2), `estimateTotals`, `mixHighlights`, `useCart.addBox` / `setOrderNotes` (Task 1), cached `getSettings`, `getActiveAutomaticDiscount`, `getMixBoxCups` (ratings + flavour profiles by productId), bundle product.
- Produces: route `/mix-box/review`.

Layout (mockup `build-box-2.png`): hero "Your MAGO Mix Box" / "Review your personalised 5-cup selection before checkout." + box image; "What's in your box" list (image, name + flavour, stars + count, price, stepper with max = qty + remaining, trash) with "Edit my box" → `/mix-box`; special instructions textarea ("e.g. leave at front door, ring bell, etc."); gift card: "This is a gift" checkbox + note textarea (max 200 chars); Order Summary card: "N cups selected · Edit", Subtotal, "Mix & Match −10%" row when applicable (label from the discount title), Delivery (or "Free"), Total, PROCEED TO CHECKOUT, secondary "Add to cart & keep shopping", perks row (Pay on delivery / Refrigerator safe / Delivery across Lebanon), note "Final total confirmed at checkout."; "Why this mix works" card list from `mixHighlights`. Under-filled box: summary shows "Add N more cups to complete your box" with a link to the builder and both buttons disabled. Empty box: friendly empty state + START MIXING.
Proceed: `addBox({ productId: bundle.id, slug, name, image, cups })`, `setOrderNotes(...)`, `useMixBox.clear()`, `router.push('/checkout')`. Keep shopping: same, then `router.push('/shop')`.

- [ ] **Step 1: Extend the e2e:** after reaching review — 5 rows listed; "Why this mix works" visible; decreasing a cup ⇒ "Add 1 more cup" and PROCEED disabled; increase back; tick gift, type a note; click "Add to cart & keep shopping" ⇒ URL `/shop`, header cart badge `1`; open the cart drawer ⇒ "The MAGO Mix Box" listed (Task 5 makes the contents visible).
- [ ] **Step 2:** Run — Expected: FAIL (review route missing).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run the e2e (drawer assertion limited to the box name until Task 5) — Expected: PASS. Typecheck/lint clean.
- [ ] **Step 5:** Commit `feat(mix-box): review page with summary, notes and mix highlights`.

### Task 5: Cart drawer shows boxes

**Files:** Modify `src/components/cart/CartDrawer.tsx`, `e2e/mix-box.spec.ts`

- Box rows: box image, "The MAGO Mix Box", "5 cups" + bullet list `2 × Fusilli Cup Spicy Muhammara`, box quantity stepper, line total `lineUnitPrice × quantity`, remove; links to `/mix-box`. Subtotal uses `cartSubtotal`. Gift note set ⇒ small "Gift" tag at the bottom.
- [ ] **Step 1:** Extend the e2e: drawer box row lists each chosen cup name; subtotal reads `$22.50`.
- [ ] **Step 2:** Run — Expected: FAIL (cups not listed).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run full `npx playwright test` — Expected: all pass.
- [ ] **Step 5:** Commit `feat(cart): show Mix Box contents in the drawer`.

---

## Part B — Checkout

### Task 6: SQL — `quote_cart`, `place_order`, `get_order_by_token` (migration 0006)

**Files:**
- Create: `supabase/migrations/0006_checkout.sql`, `supabase/tests/0003_checkout.test.sql`, `supabase/cleanup/e2e-orders.sql`
- Modify: `README.md` (migration list 0001→0006, cleanup script)

**Interfaces (all `security definer`, `search_path = ''`, execute granted to `anon, authenticated`):**
- Item payload (shared): `[{ "type": "product", "product_id": uuid, "quantity": int } | { "type": "box", "product_id": uuid, "quantity": int, "cups": [{ "product_id": uuid, "quantity": int }] }]`.
- `quote_cart(items jsonb, code text default null) returns jsonb` →
  `{ lines: [{ type, product_id, name, flavour, image, unit_price, quantity, line_total, available, cups?: [{ product_id, name, flavour, image, unit_price, quantity }] }], cup_count, subtotal, automatic_discount: { title, amount } | null, code: { code, title, amount, free_shipping } | null, code_error: text | null, discount_total, shipping_total, total, unavailable: text[] }`.
  - Products must be `active`; unknown/inactive ⇒ line `available=false`, excluded from totals, name added to `unavailable`. Stock: `track_inventory and not allow_backorder and stock < needed` ⇒ unavailable (needed sums loose + in-box use of the same cup).
  - Box: bundle must be `type='bundle'`; Σ cup quantities must equal `bundle_size` and cups must be `type='cup'`, else the box is unavailable ("Mix Box must contain exactly 5 cups"). Box unit price = Σ cup price × qty.
  - Quantities: int 1–99, otherwise the line is unavailable.
  - Automatic discount = strongest active automatic discount (`applies_to='cups'`, `min_cup_quantity`): `round(cup_subtotal × value / 100, 2)` when cup_count ≥ min.
  - Code: case-insensitive match on active, in-window, non-automatic discount with usage below limit, `min_subtotal`/`min_cup_quantity` met; `percentage` on `applies_to` base after the automatic discount, `fixed_amount` capped at the remaining base, `free_shipping` ⇒ shipping 0. Unknown/ineligible ⇒ `code=null`, `code_error` "This code isn't valid." / "This code needs …".
  - Shipping per §6.5 from `settings`; empty cart ⇒ 0. All amounts `numeric(10,2)` rounded per line.
- `place_order(payload jsonb) returns jsonb` with payload `{ idempotency_key uuid, items, code, contact: { full_name, email, phone }, address: { governorate, area, street, building, floor, notes }, special_instructions, is_gift, gift_note, accepts_marketing }` →
  - Existing order with that key ⇒ return its `{ number, access_token }` unchanged.
  - Validate contact (name 2–100, email shape, phone 6–20 chars of digits/space/+/-), address (governorate in `settings.delivery_areas` when that list is non-empty, area + street required), note lengths (≤ 500 / gift ≤ 200). Error ⇒ `raise exception using errcode = 'P0001', message = <customer-facing text>`.
  - Quote via `quote_cart`; any `unavailable` ⇒ raise "Some items are no longer available: …". Empty ⇒ raise "Your cart is empty."
  - Lock product rows (`for update`), re-check stock, upsert customer by `lower(email)` (update name/phone, `accepts_marketing` only upgrades), insert order (`source='web'`, `payment_method='cod'`), items (box line with `parent_item_id` null and its cups as children with `unit_price` = cup price, `quantity` = cup qty × box qty), `order_events` 'created', decrement tracked stock + `inventory_movements` (reason 'order'), increment code `usage_count`. Returns `{ number, access_token }`.
- `get_order_by_token(token uuid) returns jsonb` → `{ number, status, created_at, email, phone, full_name, shipping_address, special_instructions, is_gift, gift_note, subtotal, discount_total, shipping_total, total, discount_code, payment_method, items: [{ name, flavour, image, unit_price, quantity, line_total, children: [...] }] }` or null.

- [ ] **Step 1: Write the failing SQL test** `0003_checkout.test.sql` (begin … rollback, `set local role anon`, fixtures with fixed uuids, ends with `select 'checkout: all passed'`): single cup 4.50 ⇒ shipping 3, total 7.50; 5 loose cups ⇒ discount 2.25, total 23.25; a box of 5 + 3 loose cups (36.00) ⇒ discount 3.60, shipping 0, total 32.40; box with 4 cups ⇒ unavailable; draft product ⇒ unavailable; tampered `unit_price` in payload ignored; code `FREESHIP` (fixture) ⇒ shipping 0; bad code ⇒ `code_error`; `place_order` decrements stock and logs movements; second call same key ⇒ same number, stock decremented once; stock shortfall ⇒ raises "no longer available"; anon `select * from orders` ⇒ permission denied/0 rows; `get_order_by_token` returns items with box children.
- [ ] **Step 2:** Run the test in the Supabase SQL editor (project `mago`) — Expected: error (functions missing).
- [ ] **Step 3:** Write `0006_checkout.sql`; syntax-check with the scratchpad `pgcheck` (libpg-query); apply in the SQL editor.
- [ ] **Step 4:** Re-run the test — Expected: single row `checkout: all passed`. Re-run `0001`/`0002` tests — still pass.
- [ ] **Step 5:** Write `supabase/cleanup/e2e-orders.sql` (deletes orders/customers whose email matches `e2e-%@example.com`, restoring stock from their `inventory_movements`); README update; commit `feat(db): quote_cart, place_order, get_order_by_token`.

### Task 7: `/checkout` and `/order/[token]`

**Files:**
- Create: `src/lib/checkout/schema.ts` (+ `schema.test.ts`), `src/lib/checkout/payload.ts` (+ `payload.test.ts`), `src/app/actions/checkout.ts` (`quoteCart`, `placeOrder` server actions), `src/app/(store)/checkout/page.tsx`, `src/components/checkout/CheckoutForm.tsx` (client), `src/components/checkout/OrderSummary.tsx`, `src/app/(store)/order/[token]/page.tsx`, `e2e/checkout.spec.ts`
- Modify: `src/lib/types.ts` (`Quote`, `OrderConfirmation`), `src/lib/data/` (mapper for quote/order JSON)

**Interfaces:**
- `toItemsPayload(lines: CartLine[]): ItemsPayload` (ids + quantities only — never prices).
- `checkoutSchema` (zod): `fullName` 2–100, `email` (`z.email()`), `phone` regex `^[+\d][\d\s-]{5,19}$`, `governorate` (string, required), `area`, `street` required, `building`, `floor`, `addressNotes` optional ≤ 200, `instructions` ≤ 500, `isGift` boolean, `giftNote` ≤ 200, `acceptsMarketing` boolean, `code` optional.
- `quoteCart(items, code?): Promise<Quote>`; `placeOrder(input): Promise<{ ok: true; token: string } | { ok: false; error: string; fieldErrors?: Record<string, string> }>` — validates with `checkoutSchema`, calls `place_order` via `createPublicClient()` (anon), maps `P0001` messages to `error`.
- Checkout page (spec §4): contact, delivery address (governorate `<select>` from `settings.deliveryAreas`, fallback free text when empty), instructions + gift (prefilled from `useCart.orderNotes`), payment = "Cash on delivery" (static, selected), discount code field (Apply ⇒ re-quote), order summary from `quoteCart` (box lines with nested cups, discount rows, shipping, total, unavailable warnings), PLACE ORDER (disabled while pending or while any line unavailable). Idempotency key generated once per mount (`crypto.randomUUID()`). Success ⇒ `useCart.clear()` then `router.replace('/order/' + token)`. Empty cart ⇒ empty state with links.
- `/order/[token]`: `get_order_by_token`; not found ⇒ `notFound()`; shows "Thank you!", `#MAGO-<number>`, status, items (box with cups), totals, delivery address, payment "Cash on delivery — pay when your order arrives", continue shopping. `export const instant = false` (dynamic per token); metadata `robots: { index: false }`.

- [ ] **Step 1: Write the failing tests:** `schema.test.ts` (valid input passes; bad email/phone/missing street each produce that field's error), `payload.test.ts` (box line ⇒ `{ type: 'box', product_id, quantity, cups:[…] }`, no price keys anywhere); `e2e/checkout.spec.ts`: (a) single cup → `/checkout` → fill with `e2e-<timestamp>@example.com` → Place order → `/order/…` shows `#MAGO-` and the cup; (b) Mix Box flow from `/mix-box` → review → proceed → checkout summary shows the box with 5 cups and "Mix & Match" discount → place → confirmation lists the box.
- [ ] **Step 2:** `npx vitest run src/lib/checkout` + `npx playwright test e2e/checkout.spec.ts` — Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Re-run both — Expected: PASS. Full `npm test`, `npx playwright test`, typecheck, lint, `npm run build` — all clean.
- [ ] **Step 5:** Run `supabase/cleanup/e2e-orders.sql` in the SQL editor; commit `feat(checkout): COD checkout and order confirmation`.

### Task 8: `/cart` page

**Files:** Create `src/app/(store)/cart/page.tsx`, `src/components/cart/CartPage.tsx` (client); modify `CartDrawer.tsx` (add "View cart" link), `e2e/checkout.spec.ts`

- Full-width cart: product + box rows (same rendering as the drawer, larger), discount code field, server `quoteCart` totals (debounced on change), unavailable warnings, CHECKOUT button → `/checkout` (code carried in `?code=`; checkout pre-applies it).
- [ ] **Step 1:** e2e `cart page shows server totals`: add 5 cups → `/cart` shows "Mix & Match" discount row and total `$23.25`; enter `NOPE` ⇒ "This code isn't valid."
- [ ] **Step 2:** Run — FAIL (404).
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run full e2e — PASS.
- [ ] **Step 5:** Commit `feat(cart): cart page with server totals and discount codes`.
