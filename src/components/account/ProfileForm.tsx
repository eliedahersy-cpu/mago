'use client';

import { useActionState } from 'react';
import { updateProfile, type FormState } from '@/app/actions/account';
import { Button } from '@/components/ui/Button';
import { Field, fieldAria, inputClass } from '@/components/ui/Field';

const idle: FormState = { status: 'idle', message: '' };

export function ProfileForm({ email, fullName, phone }: { email: string; fullName: string | null; phone: string | null }) {
  const [state, action, pending] = useActionState(updateProfile, idle);
  const errors = state.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="space-y-4">
      <Field id="profile-email" label="Email">
        <input id="profile-email" value={email} readOnly className={`${inputClass} bg-cream text-ink/70`} />
      </Field>
      <Field id="fullName" label="Full name" error={errors.fullName}>
        <input id="fullName" name="fullName" autoComplete="name" defaultValue={fullName ?? ''} className={inputClass} {...fieldAria('fullName', errors.fullName)} />
      </Field>
      <Field id="phone" label="Phone" optional error={errors.phone}>
        <input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={phone ?? ''} placeholder="+961 70 123 456" className={inputClass} {...fieldAria('phone', errors.phone)} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save details'}
        </Button>
        {state.message ? (
          <p role={state.status === 'error' ? 'alert' : 'status'} className={state.status === 'error' ? 'text-sm text-terracotta' : 'text-sm text-leaf'}>
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
