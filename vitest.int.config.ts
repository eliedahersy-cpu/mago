import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// Integration tests hit the real Supabase project configured in .env.local.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.int.test.ts'],
    env: loadEnv('development', process.cwd(), ''),
    testTimeout: 20_000,
  },
});
