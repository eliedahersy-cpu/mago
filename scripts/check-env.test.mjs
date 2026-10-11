import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { envFileSources, missingEnv, REQUIRED_ENV } from './check-env.mjs';

const script = path.join(process.cwd(), 'scripts/check-env.mjs');
const [URL_VAR, KEY_VAR] = REQUIRED_ENV;

function tempDir(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mago-env-'));
  for (const [name, body] of Object.entries(files)) fs.writeFileSync(path.join(dir, name), body);
  return dir;
}

test('requires the Supabase URL and publishable key', () => {
  expect(REQUIRED_ENV).toEqual(['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY']);
});

test('names every required variable that no source sets', () => {
  expect(missingEnv([{}])).toEqual([URL_VAR, KEY_VAR]);
});

test('treats blank values as missing', () => {
  expect(missingEnv([{ [URL_VAR]: '  ', [KEY_VAR]: 'sb_publishable_abc' }])).toEqual([URL_VAR]);
});

test('accepts a variable set in any source', () => {
  expect(missingEnv([{ [URL_VAR]: 'https://x.supabase.co' }, { [KEY_VAR]: 'sb_publishable_abc' }])).toEqual([]);
});

test('reads the env files next build loads, but not .env.example', () => {
  const dir = tempDir({
    '.env.local': `${URL_VAR}=https://x.supabase.co\n`,
    '.env.example': `${KEY_VAR}=from-example\n`,
  });
  const sources = envFileSources(dir);
  expect(missingEnv(sources)).toEqual([KEY_VAR]);
});

test('the script fails the build with both names and where to set them', () => {
  const run = spawnSync(process.execPath, [script], {
    cwd: tempDir(),
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot },
    encoding: 'utf8',
  });
  expect(run.status).toBe(1);
  expect(run.stderr).toContain(URL_VAR);
  expect(run.stderr).toContain(KEY_VAR);
  expect(run.stderr).toContain('Vercel');
});

test('the script passes when the variables are in the environment', () => {
  const run = spawnSync(process.execPath, [script], {
    cwd: tempDir(),
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, [URL_VAR]: 'https://x.supabase.co', [KEY_VAR]: 'k' },
    encoding: 'utf8',
  });
  expect(run.status).toBe(0);
});
