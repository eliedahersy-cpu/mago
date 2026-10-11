// Runs before `npm run build` (the `prebuild` script). Pages prerender from Supabase at build
// time, so without these variables the build dies much later with a masked
// "Failed to collect page data for /shop/[slug]" error. Stop early with the real reason instead.
import fs from 'node:fs';
import path from 'node:path';
import { parseEnv } from 'node:util';

export const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];

// The files `next build` loads; .env.example is documentation only.
const ENV_FILES = ['.env.production.local', '.env.local', '.env.production', '.env'];

/** Required names that have no non-blank value in any of the sources. */
export function missingEnv(sources, required = REQUIRED_ENV) {
  return required.filter((name) => !sources.some((env) => env[name]?.trim()));
}

/** Parsed contents of each env file present in `dir`. */
export function envFileSources(dir) {
  return ENV_FILES.map((file) => path.join(dir, file))
    .filter((file) => fs.existsSync(file))
    .map((file) => parseEnv(fs.readFileSync(file, 'utf8')));
}

if (process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename) {
  const missing = missingEnv([process.env, ...envFileSources(process.cwd())]);
  if (missing.length > 0) {
    console.error(
      [
        `Missing environment variables: ${missing.join(', ')}`,
        '',
        'The storefront prerenders its pages from Supabase during the build, so these must be set:',
        '  - Locally: copy .env.example to .env.local and fill it in.',
        '  - On Vercel: Project > Settings > Environment Variables, then redeploy.',
      ].join('\n'),
    );
    process.exit(1);
  }
}
