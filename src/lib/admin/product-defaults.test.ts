import { parseProductForm } from '@/lib/admin/product-form';
import { productDefaults } from '@/lib/admin/product-defaults';

test('a saved product round-trips through the editor unchanged', () => {
  const row = {
    id: 'p1', name: 'Fusilli Cup', flavour: 'Al Pesto Genovese', slug: 'fusilli-al-pesto-genovese', type: 'cup', status: 'active',
    sauce: null, tagline: 'Fresh basil.', short_description: null, description: null, story: null, price: 4.5, compare_at_price: null,
    sku: 'MAGO-CUP-02', stock: 200, track_inventory: true, allow_backorder: false, low_stock_threshold: 10, protein_g: 30, prep_minutes: 4,
    is_best_seller: false, is_featured: true, sort_order: 4, badges: [], ingredients: [{ name: 'Basil' }, { name: 'Parmesan' }],
    nutrition: [{ label: 'Protein', value: '30 g per serving' }], preparation: [{ title: 'Add water', body: 'Fill to the line.' }],
    flavour_profiles: ['herby'], spice_level: 0, textures: ['twirly'], occasions: ['quick-lunch', 'at-home'], style: 'italian',
    bundle_size: null, seo_title: null, seo_description: null,
  };
  const d = productDefaults(row, ['00000000-0000-4000-8000-000000000001']);
  const fd = new FormData();
  for (const [k, v] of Object.entries(d)) {
    if (k === 'id' || v === null) continue;
    if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
    else if (typeof v === 'boolean') { if (v) fd.append(k, 'on'); }
    else fd.append(k, v);
  }
  const r = parseProductForm(fd);
  expect(r.ok).toBe(true);
  if (!r.ok) return;
  expect(r.data).toMatchObject({
    slug: 'fusilli-al-pesto-genovese', price: 4.5, isFeatured: true, sku: 'MAGO-CUP-02',
    ingredients: row.ingredients, nutrition: row.nutrition, preparation: row.preparation,
    flavourProfiles: ['herby'], occasions: ['quick-lunch', 'at-home'], style: 'italian', proteinG: 30,
    collectionIds: ['00000000-0000-4000-8000-000000000001'],
  });
});
