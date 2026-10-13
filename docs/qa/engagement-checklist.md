# Reviews, stores, recipes and subscriptions — manual checklist

Automated tests cover what a signed-out visitor can do (store locator, the subscribe flow up to
the review step) and the database rules (0007_engagement.test.sql). These steps need real
accounts, so they are checked by hand on the live site (https://mago-rose.vercel.app) or locally.

Use a customer account with a confirmed email, and an owner/staff account for /admin.

## 1. Reviews
- [ ] Signed out, a product's **Reviews** tab says "Sign in to write a review".
- [ ] Signed in, write a review (stars, title, at least 10 characters). It says it will appear
      once read; it does not show on the product yet.
- [ ] Writing a second review of the same product is refused.
- [ ] **/admin/reviews** lists it under *Waiting* with "Bought it" if you ordered that cup.
      **Approve**: it shows on the product page and the stars/count appear on the shop card.
- [ ] **Reject** or **Delete** another one: it never shows.

## 2. Store locator
- [ ] **/stores** shows the map with 5 pins and the list. Search "Beirut" or "Dbayeh".
- [ ] **Use my location** (allow it): stores show "… km away", nearest first. Block it: a message
      explains, and search still works.
- [ ] **Directions** opens Google Maps at the store. A store's page shows its products and
      "More nearby".
- [ ] **/admin/stores → Add store**: click the map to set the location, tick products, save. It
      appears on /stores straight away. Untick *Show on the store locator*: it disappears.

## 3. Recipes
- [ ] **/admin/recipes → Add recipe**: title, ingredients (one per line), steps
      ("Title: what to do"), a photo upload, a category, the cup it uses. Save as *Draft*: not on
      /recipes. Set *Published*: on /recipes and the home carousel.
- [ ] Publishing with no steps is refused.

## 4. Subscribe & Save
- [ ] **/subscribe** shows the 3 plans; **Select** one → choose 5 cups (a 6th is not possible) →
      delivery details (+ an extra, + gift note) → **Review** shows the subscription discount,
      delivery and total.
- [ ] Signed out at review: **Sign in to subscribe**, sign in, and you come back to the same box.
- [ ] **Subscribe now** → "You're subscribed!" with the first delivery date.
- [ ] **/account/subscriptions**: Skip next box (date moves by the plan's weeks), Pause, Resume,
      Change plan, Change cups (must total 5), Cancel (asks first; final).
- [ ] **/admin/subscriptions** lists it. In the SQL editor set its `next_delivery_date` to today,
      then **Run due subscriptions now**: one order appears (channel *Subscription*, discount on
      cups, cups inside a Mix Box line). Running again the same day creates nothing.
- [ ] Set a cup's stock to 0 in Inventory, make the subscription due, run again: the order is
      created, stock stays at 0, and the order and subscription both say what was short.
- [ ] **Plans**: change a discount; /subscribe shows the new saving. Untick *Offered* to stop
      new sign-ups on that plan (existing subscribers keep it).
- [ ] The daily job runs at 06:00 Beirut (03:00 UTC) — check *Database → Cron Jobs* in Supabase
      shows `mago-process-due-subscriptions`.
