import type { ReactNode } from 'react';

export const inputClass =
  'mt-1.5 w-full rounded-2xl border border-forest/15 bg-white px-4 py-3 text-sm text-ink focus:border-forest focus:outline-none aria-[invalid=true]:border-terracotta';

/** Label, control and error message, wired together by `id` (`<id>-error`). */
export function Field({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-forest">
        {label}
        {optional ? <span className="font-normal text-ink/60"> (optional)</span> : null}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-ink/60">{hint}</p> : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-terracotta">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** aria props for a control whose error (if any) is rendered by `Field`. */
export function fieldAria(id: string, error?: string) {
  return { 'aria-invalid': error ? true : undefined, 'aria-describedby': error ? `${id}-error` : undefined };
}
