# Content to confirm with MAGO

The site only states facts that were confirmed in the design spec. The items below are either
missing (shown as placeholders or neutral wording) or come from the mockups and should be
checked before launch. Update copy in `src/content/info-pages.ts`, store details in the
admin (Plan 3) or the `settings` table, and products/stores in the database.

## Missing business details
- **Contact email and phone** — `settings.contact_email` / `contact_phone` are empty; the Contact page says details "will be published here soon".
- **Social media links** — `settings.social_links` is empty, so the footer shows no social icons. Add Instagram / TikTok / Facebook / YouTube URLs.
- **Delivery coverage** — copy says "We deliver across Lebanon". Confirm the areas you actually serve (`settings.delivery_areas` lists all eight governorates).
- **Delivery time** — copy says the team calls to confirm a delivery time; no day count is promised.
- **Returns policy** — no return window or refund method is stated.
- **Terms & conditions / Privacy policy** — plain-language drafts; need legal review and the legal company name/address.
- **Retail 400g boxes** — prices unknown; the four products are seeded as drafts and hidden until priced and published.

## Claims taken from the mockups (please verify)
- "No artificial colours or flavours" (feature strip, product benefit icons).
- "Recyclable packaging", "Responsibly sourced ingredients", "Supporting local farmers" (Our Story, Sustainability).
- "Refrigerator safe after preparation" (product perks row).
- "Made in Lebanon".
- Store locator retailers (Spinneys Hamra, Carrefour City Centre, Fahed Supermarket, Metro Market, Azzi Supermarket), their areas, opening hours and coordinates — sample data from the mockup.

## Product data
- Product descriptions, stories and key-ingredient chips were written from the packaging text; please proofread.
- Nutrition shows only "30 g protein per serving" and "100 g pasta per cup"; add full nutrition facts if you want them online.
- Recipes use lifestyle photos or packshots until dedicated recipe photography exists.
