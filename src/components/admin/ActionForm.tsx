'use client';

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import type { ActionResult } from '@/lib/admin/form-data';
import { cn } from '@/lib/cn';
import { adminButton } from './ui';

export type AdminAction = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

const Pending = createContext(false);

/** Submit button that shows it is working while its form is saving. */
export function SubmitButton({
  children,
  pendingLabel = 'Saving…',
  variant = 'primary',
  className,
  confirm,
  name,
  value,
  disabled,
}: {
  children: ReactNode;
  pendingLabel?: string;
  variant?: keyof typeof adminButton;
  className?: string;
  /** Ask before submitting (e.g. cancelling an order). */
  confirm?: string;
  name?: string;
  value?: string;
  disabled?: boolean;
}) {
  const pending = useContext(Pending);
  return (
    <button
      type="submit"
      name={name}
      value={value}
      disabled={pending || disabled}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
      className={cn(adminButton[variant], className)}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

/**
 * A form posting to an admin server action; shows the result (error or confirmation) under it.
 * It submits by hand rather than through `<form action>` so React does not clear what was typed
 * when the server refuses it. `children` may be a function of the last result (for field errors).
 */
export function ActionForm({
  action,
  children,
  className,
  resetOnSuccess = false,
  messageOnTop = false,
}: {
  action: AdminAction;
  children: ReactNode | ((state: ActionResult | null) => ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
  /** Long forms: show the result above the fields, where the first Save button is. */
  messageOnTop?: boolean;
}) {
  const [state, dispatch, pending] = useActionState(action, null);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (resetOnSuccess && state?.ok) form.current?.reset();
  }, [resetOnSuccess, state]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const fd = new FormData(e.currentTarget, submitter instanceof HTMLButtonElement ? submitter : null);
    startTransition(() => dispatch(fd));
  }

  return (
    <Pending.Provider value={pending}>
      <form ref={form} onSubmit={onSubmit} className={className}>
        {typeof children === 'function' ? children(state) : children}
        <p
          role="status"
          aria-live="polite"
          className={cn(
            'col-span-full text-sm',
            state ? (messageOnTop ? 'order-first rounded-xl bg-white px-3 py-2 ring-1 ring-forest/10' : 'mt-2') : 'sr-only',
            state?.ok ? 'text-emerald-700' : 'text-terracotta',
          )}
        >
          {state ? (state.ok ? (state.message ?? 'Saved.') : state.error) : ''}
        </p>
      </form>
    </Pending.Provider>
  );
}

/** Field error for a control inside an ActionForm. */
export function FieldError({ state, name }: { state: ActionResult | null; name: string }) {
  const message = state && !state.ok ? state.fieldErrors?.[name] : undefined;
  return message ? (
    <p id={`${name}-error`} className="mt-1 text-xs text-terracotta">
      {message}
    </p>
  ) : null;
}

/** aria-invalid / aria-describedby for a control whose error FieldError shows. */
export function errorAria(state: ActionResult | null, name: string) {
  const invalid = Boolean(state && !state.ok && state.fieldErrors?.[name]);
  return invalid ? { 'aria-invalid': true as const, 'aria-describedby': `${name}-error` } : {};
}
