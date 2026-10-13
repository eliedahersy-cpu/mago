import type { z } from 'zod';

/** Shared bits for reading admin forms. */

export type FormResult<T> = { ok: true; data: T } | { ok: false; fieldErrors: Record<string, string> };

export function text(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

/** Empty string -> null, otherwise the trimmed text. */
export function optionalText(fd: FormData, key: string): string | null {
  return text(fd, key) || null;
}

export function checkbox(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === 'on' || v === 'true' || v === '1';
}

export function all(fd: FormData, key: string): string[] {
  return fd.getAll(key).filter((v): v is string => typeof v === 'string');
}

/** Number from a text field; empty -> null; anything unparseable -> NaN (so the schema reports it). */
export function num(fd: FormData, key: string): number | null {
  const v = text(fd, key);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : Number.NaN;
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '');
    if (key && !(key in out)) out[key] = issue.message;
  }
  return out;
}

export function parseWith<T>(schema: z.ZodType<T>, input: unknown): FormResult<T> {
  const r = schema.safeParse(input);
  return r.success ? { ok: true, data: r.data } : { ok: false, fieldErrors: fieldErrors(r.error) };
}

/** Admin server actions answer with this. */
export type ActionResult = { ok: true; message?: string; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };
