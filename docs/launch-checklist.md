# Launch checklist

Everything below the line "Built and checked" is done and running on https://mago-rose.vercel.app.
The items before it need the owner (accounts, money, domain), so they are left to you.

## Before launch: needs the owner

- [ ] **Email that reaches people.** Supabase's built-in email sends only a few messages per hour,
      which is fine for testing but not for customers. Create an account with an email provider
      (for example Resend, Postmark or Brevo), verify the sending domain, then in Supabase open
      **Authentication → Emails → SMTP Settings** and enter the host, port, user, password and a
      sender such as `hello@your-domain`. Send yourself a sign-in link to check.
- [ ] **Your own domain.** In Vercel: **Settings → Domains → Add** (e.g. `mago.com.lb`), follow
      the DNS steps. Then update, in this order:
  - Vercel environment variable `NEXT_PUBLIC_SITE_URL` → `https://your-domain` (Production), and
    redeploy (sitemap, social cards and structured data use it);
  - Supabase **Authentication → URL Configuration**: Site URL → `https://your-domain`, and add
    `https://your-domain/**` to the Redirect URLs (keep the vercel.app one until the switch is done).
- [ ] **Promote the owner account** (README → *Promote the first owner*) and add staff from
      **/admin/settings**.
- [ ] **Store details** in **/admin/settings**: contact email and phone, social links, delivery
      areas, delivery fee and free-delivery amount, announcement bar.
- [ ] **Real stock** for every cup in **/admin/inventory** (the seed set 200 each).
- [ ] **Remove test data** if any was created: run `supabase/cleanup/e2e-orders.sql` in the SQL
      editor after automated checkout tests.
- [ ] **Search engines:** add the site in Google Search Console and submit
      `https://your-domain/sitemap.xml`.
- [ ] **Backups:** the Supabase project is on the Pro plan, which keeps daily backups for 7 days
      (*Database → Backups*). Turn on Point-in-Time Recovery there if you want restores to the minute.
- [ ] Walk through the manual checklists once with real accounts:
      [accounts](qa/accounts-checklist.md), [admin](qa/admin-checklist.md),
      [reviews, stores, recipes, subscriptions](qa/engagement-checklist.md).

## Built and checked

- **Shop, Mix Box, quiz, recipes, store locator, Subscribe & Save, accounts, wishlist, cash-on-delivery
  checkout** — matched to the Drive mockups at desktop and phone width.
- **Admin** at /admin — orders, products and photos, collections, inventory, customers, discounts,
  subscriptions, recipes, stores, reviews, analytics, settings and staff.
- **Download app** — the shop installs as an app (footer button, and a floating button where the
  browser supports it; Add to Home Screen steps on iPhone).
- **Search engines** — `/sitemap.xml`, `/robots.txt` (admin, account and checkout pages kept out),
  social cards, and Product / Recipe / Store / Organization structured data. Ratings appear only from
  real approved reviews.
- **Safety** — every admin page and action checks the role on the server and in the database; orders
  are limited to 5 per email or phone in 10 minutes and 100 site-wide in 2 minutes; a double-clicked
  "Place order" never creates two orders; stock never goes below zero for cups that do not allow it.
- **Daily subscriptions job** — pg_cron runs `process_due_subscriptions()` at 03:00 UTC (06:00 Beirut
  in summer).
- **Accessibility** — no serious or critical WCAG 2.1 A/AA problems (axe) on any public page at
  desktop and phone width.
- **Tests** — unit tests (`npm test`), end-to-end tests (`npm run e2e`) and SQL tests
  (`supabase/tests/*.test.sql`) all pass.
