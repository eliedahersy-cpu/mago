# MAGO Plan 5 — Polish & Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the live site findable, fast, accessible and safe to launch: sitemap/robots, social images, structured data, real 404s for recipes, order rate limits, an automated accessibility pass, and launch documentation.

**Architecture:** SEO through Next's file conventions (`app/sitemap.ts`, `app/robots.ts`, `opengraph-image`) and JSON-LD built by tested pure functions and rendered as escaped `<script type="application/ld+json">`. Recipe pages move to cached reads (tag `recipes`) with `generateStaticParams`, like product pages, so unknown slugs return 404. Order flooding is refused inside `place_order` (migration 0011). Accessibility is checked with axe-core in Playwright on every public page type.

**Tech Stack:** Next.js 16.4, Supabase, Vitest 5, Playwright 1.64, @axe-core/playwright.

**Spec:** `docs/superpowers/specs/2026-10-10-mago-ecommerce-design.md` §13 phase 6 (SEO: metadata, sitemap, OG images, Product JSON-LD; performance; accessibility pass; Playwright suite; README with setup + Vercel deploy), §9 (no fake ratings), §11 (rate-limit place_order carried from Plan 2).

## Global Constraints

- JSON-LD never invents data: `aggregateRating` only when there are approved reviews; prices and availability from the database.
- Private pages (`/admin`, `/account`, `/checkout`, `/cart`, `/order`, `/subscribe/build`, `/auth`) are disallowed in robots and never in the sitemap.
- Rate limits: at most 5 orders per email or phone in 10 minutes; at most 100 orders site-wide in 2 minutes. Messages are written for customers.
- No serious or critical axe violations (WCAG 2.1 A/AA) on public pages at desktop and phone width.

## Review Focus

1. A product name or recipe text containing `</script>` must not break out of the JSON-LD script.
2. A customer placing a 6th order within 10 minutes is refused, but the same idempotency key retried returns the original order (not a refusal).
3. An unknown recipe slug returns HTTP 404; editing a recipe in the admin still shows on its page at once.
4. Draft/archived products, unpublished recipes and inactive stores never appear in the sitemap.
5. Social cards (OG image) exist for the home page and use real product photos on product pages.

---

### Task 1: SEO — sitemap, robots, social image, JSON-LD, recipe 404
**Files:** `src/app/sitemap.ts`, `src/app/robots.ts`, `src/app/opengraph-image.png` (+ alt), `src/lib/seo/jsonld.ts` (+ test), `src/components/seo/JsonLd.tsx`, product/recipe/store/home pages, `src/lib/data/content.ts` + cached `getRecipe`.
- [ ] jsonld tests RED → GREEN (product with/without reviews, availability, recipe ISO durations and steps, `<` escaping).

### Task 2: Order rate limits (migration 0011) + test
**Files:** `supabase/migrations/0011_rate_limits.sql`, `supabase/tests/0008_rate_limits.test.sql`.
- [ ] Test RED → apply → GREEN; 0001–0007 still pass.

### Task 3: Accessibility pass
**Files:** `e2e/a11y.spec.ts`, fixes where axe reports problems.
- [ ] axe on home, shop, product, mix box, quiz, recipes, recipe, stores, subscribe, cart, sign-in — desktop and phone.

### Task 4: Performance
**Files:** `next.config.ts` (AVIF/WebP), image `sizes`/priority review.

### Task 5: Launch docs
**Files:** `docs/launch-checklist.md`, README (environment, email/SMTP, cron, backups, domain).
