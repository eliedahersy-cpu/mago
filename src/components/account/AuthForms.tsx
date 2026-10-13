'use client';

import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useActionState } from 'react';
import { register, requestPasswordReset, sendSignInLink, signIn, updatePassword, type AuthState } from '@/app/actions/auth';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Field, fieldAria, inputClass } from '@/components/ui/Field';
import { safeNextPath } from '@/lib/auth/next-path';

const idle: AuthState = { status: 'idle', message: '' };

function Alert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
      {children}
    </p>
  );
}

function Sent({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div role="status" className="rounded-2xl bg-leaf/10 p-5 text-center ring-1 ring-leaf/20">
      <MailCheck size={32} className="mx-auto text-leaf" aria-hidden />
      <p className="mt-2 font-display text-lg font-semibold text-forest">Check your inbox</p>
      <p className="mt-1 text-sm text-ink/80">{message}</p>
      {children}
    </div>
  );
}

const linkClass = 'font-semibold text-forest underline underline-offset-4 hover:text-terracotta';

export function LoginForm() {
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [state, passwordAction, signingIn] = useActionState(signIn, idle);
  const [linkState, linkAction, sendingLink] = useActionState(sendSignInLink, idle);
  const busy = signingIn || sendingLink;
  const emailError = state.fieldErrors?.email ?? linkState.fieldErrors?.email;
  const passwordError = state.fieldErrors?.password;

  return (
    <form action={passwordAction} noValidate className="space-y-4">
      {params.get('error') === 'link' ? (
        <Alert>That link has expired or was opened in a different browser. Sign in with your password, or send yourself a new link.</Alert>
      ) : null}
      {state.status === 'error' && state.message ? <Alert>{state.message}</Alert> : null}
      {linkState.status === 'error' && linkState.message ? <Alert>{linkState.message}</Alert> : null}
      {linkState.status === 'sent' ? <Sent message={linkState.message} /> : null}
      <input type="hidden" name="next" value={next} />
      <Field id="email" label="Email" error={emailError}>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email ?? linkState.values?.email} className={inputClass} {...fieldAria('email', emailError)} />
      </Field>
      <div>
        <Field id="password" label="Password" error={passwordError}>
          <input id="password" name="password" type="password" autoComplete="current-password" className={inputClass} {...fieldAria('password', passwordError)} />
        </Field>
        <Link href="/account/forgot-password" className={`mt-2 inline-block text-sm ${linkClass}`}>
          Forgot your password?
        </Link>
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {signingIn ? 'Signing in…' : 'Sign in'}
      </Button>
      <div className="flex items-center gap-3 text-xs text-ink/50 uppercase" aria-hidden>
        <span className="h-px flex-1 bg-forest/15" /> or <span className="h-px flex-1 bg-forest/15" />
      </div>
      <Button type="submit" formAction={linkAction} variant="outline" className="w-full" disabled={busy}>
        {sendingLink ? 'Sending…' : 'Email me a sign-in link'}
      </Button>
      <p className="pt-2 text-center text-sm text-ink/75">
        New to MAGO?{' '}
        <Link href={`/account/register?next=${encodeURIComponent(next)}`} className={linkClass}>
          Create an account
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const params = useSearchParams();
  const next = safeNextPath(params.get('next'));
  const [state, action, pending] = useActionState(register, idle);
  const errors = state.fieldErrors ?? {};

  if (state.status === 'sent') {
    return (
      <Sent message={state.message}>
        <ButtonLink href="/shop" variant="outline" size="sm" className="mt-4">
          Keep shopping
        </ButtonLink>
      </Sent>
    );
  }

  return (
    <form action={action} noValidate className="space-y-4">
      {state.status === 'error' && state.message ? <Alert>{state.message}</Alert> : null}
      <input type="hidden" name="next" value={next} />
      <Field id="fullName" label="Full name" error={errors.fullName}>
        <input id="fullName" name="fullName" autoComplete="name" defaultValue={state.values?.fullName} className={inputClass} {...fieldAria('fullName', errors.fullName)} />
      </Field>
      <Field id="email" label="Email" error={errors.email}>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} className={inputClass} {...fieldAria('email', errors.email)} />
      </Field>
      <Field id="password" label="Password" hint="At least 8 characters." error={errors.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} {...fieldAria('password', errors.password)} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input type="checkbox" name="acceptsMarketing" className="size-4 accent-forest" />
        Send me new flavours, recipes and offers
      </label>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Creating your account…' : 'Create account'}
      </Button>
      <p className="pt-2 text-center text-sm text-ink/75">
        Already have an account?{' '}
        <Link href={`/account/login?next=${encodeURIComponent(next)}`} className={linkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, idle);
  const emailError = state.fieldErrors?.email;
  if (state.status === 'sent') return <Sent message={state.message} />;
  return (
    <form action={action} noValidate className="space-y-4">
      {state.status === 'error' && state.message ? <Alert>{state.message}</Alert> : null}
      <Field id="email" label="Email" error={emailError}>
        <input id="email" name="email" type="email" autoComplete="email" defaultValue={state.values?.email} className={inputClass} {...fieldAria('email', emailError)} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
      <p className="pt-2 text-center text-sm text-ink/75">
        Remembered it?{' '}
        <Link href="/account/login" className={linkClass}>
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, idle);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      {state.status === 'error' && state.message ? (
        <Alert>
          {state.message}{' '}
          <Link href="/account/forgot-password" className={linkClass}>
            Request a new link
          </Link>
        </Alert>
      ) : null}
      <Field id="password" label="New password" hint="At least 8 characters." error={errors.password}>
        <input id="password" name="password" type="password" autoComplete="new-password" className={inputClass} {...fieldAria('password', errors.password)} />
      </Field>
      <Field id="confirm" label="Repeat new password" error={errors.confirm}>
        <input id="confirm" name="confirm" type="password" autoComplete="new-password" className={inputClass} {...fieldAria('confirm', errors.confirm)} />
      </Field>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? 'Saving…' : 'Save new password'}
      </Button>
    </form>
  );
}
