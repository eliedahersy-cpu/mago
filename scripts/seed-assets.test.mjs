import fs from 'node:fs';
import path from 'node:path';

const seedFile = path.join(process.cwd(), 'supabase/seed/0001_catalog.sql');

test('every image referenced by the catalog seed exists in public/', () => {
  const sql = fs.readFileSync(seedFile, 'utf8');
  const refs = [...new Set([...sql.matchAll(/'(\/(?:brand|images|products)\/[^']+\.webp)'/g)].map((m) => m[1]))];
  expect(refs.length).toBeGreaterThanOrEqual(20);
  const missing = refs.filter((ref) => !fs.existsSync(path.join(process.cwd(), 'public', ref)));
  expect(missing).toEqual([]);
});
