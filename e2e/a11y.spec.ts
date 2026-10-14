import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// WCAG 2.1 A and AA rules on every public page type, at desktop and phone width.
const pages = [
  '/',
  '/shop',
  '/shop/fusilli-spicy-muhammara',
  '/mix-box',
  '/find-your-match',
  '/recipes',
  '/recipes/rishta-soup-lemon-herbs',
  '/stores',
  '/stores/spinneys-hamra',
  '/subscribe',
  '/our-story',
  '/faq',
  '/cart',
  '/account/login',
  '/admin/login',
];

async function audit(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // The map tiles and their attribution come from OpenStreetMap; they are not our markup.
    .exclude('.leaflet-container')
    .analyze();
  return results.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id} (${v.impact}): ${v.nodes.length} × ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

for (const [label, viewport] of [
  ['desktop', { width: 1440, height: 900 }],
  ['phone', { width: 390, height: 844 }],
] as const) {
  test.describe(label, () => {
    test.use({ viewport });
    for (const path of pages) {
      test(`${path} has no serious accessibility problems`, async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        expect(await audit(page)).toEqual([]);
      });
    }
  });
}
