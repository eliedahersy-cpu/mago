'use client';

import { MapPin, Plus } from 'lucide-react';
import { useActionState, useEffect, useState } from 'react';
import { deleteAddress, saveAddress, setDefaultAddress, type FormState } from '@/app/actions/account';
import { Button } from '@/components/ui/Button';
import { Field, fieldAria, inputClass } from '@/components/ui/Field';
import type { Address } from '@/lib/data/account';

const idle: FormState = { status: 'idle', message: '' };

export function addressLines(a: Pick<Address, 'street' | 'building' | 'floor' | 'area' | 'governorate'>): string[] {
  return [
    [a.street, a.building && `Building ${a.building}`, a.floor && `Floor ${a.floor}`].filter(Boolean).join(', '),
    `${a.area}, ${a.governorate}`,
  ].filter(Boolean);
}

function AddressForm({ address, deliveryAreas, onDone }: { address?: Address; deliveryAreas: string[]; onDone: () => void }) {
  const [state, action, pending] = useActionState(saveAddress, idle);
  const errors = state.fieldErrors ?? {};
  const p = address?.id ?? 'new';

  useEffect(() => {
    if (state.status === 'saved') onDone();
  }, [state, onDone]);

  const input = (name: string, label: string, opts: { optional?: boolean; value?: string | null; autoComplete?: string; type?: string } = {}) => (
    <Field id={`${p}-${name}`} label={label} optional={opts.optional} error={errors[name]}>
      <input
        id={`${p}-${name}`}
        name={name}
        type={opts.type ?? 'text'}
        autoComplete={opts.autoComplete}
        defaultValue={opts.value ?? ''}
        className={inputClass}
        {...fieldAria(`${p}-${name}`, errors[name])}
      />
    </Field>
  );

  return (
    <form action={action} noValidate className="grid gap-4 rounded-3xl bg-white p-5 ring-1 ring-forest/10 sm:grid-cols-2">
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      {state.status === 'error' && state.message ? (
        <p role="alert" className="rounded-2xl bg-terracotta/10 px-4 py-3 text-sm text-terracotta sm:col-span-2">
          {state.message}
        </p>
      ) : null}
      {input('label', 'Label', { optional: true, value: address?.label })}
      {input('fullName', 'Full name', { value: address?.fullName, autoComplete: 'name' })}
      {input('phone', 'Phone', { value: address?.phone, autoComplete: 'tel', type: 'tel' })}
      <Field id={`${p}-governorate`} label="Governorate" error={errors.governorate}>
        <select
          id={`${p}-governorate`}
          name="governorate"
          defaultValue={address?.governorate ?? ''}
          className={inputClass}
          {...fieldAria(`${p}-governorate`, errors.governorate)}
        >
          <option value="" disabled>
            Choose…
          </option>
          {deliveryAreas.map((area) => (
            <option key={area} value={area}>
              {area}
            </option>
          ))}
        </select>
      </Field>
      {input('area', 'Area', { value: address?.area, autoComplete: 'address-level2' })}
      {input('street', 'Street', { value: address?.street, autoComplete: 'address-line1' })}
      {input('building', 'Building', { optional: true, value: address?.building })}
      {input('floor', 'Floor', { optional: true, value: address?.floor })}
      <div className="sm:col-span-2">{input('notes', 'Notes', { optional: true, value: address?.notes })}</div>
      <label className="flex items-center gap-2 text-sm text-ink/80 sm:col-span-2">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault ?? false} className="size-4 accent-forest" />
        Use as my default address
      </label>
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Saving…' : 'Save address'}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function AddressBook({ addresses, deliveryAreas }: { addresses: Address[]; deliveryAreas: string[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  const close = () => setEditing(null);

  return (
    <div className="space-y-4">
      {addresses.length === 0 && editing !== 'new' ? (
        <p className="rounded-3xl bg-cream-light p-6 text-center text-ink/70 ring-1 ring-forest/5">
          No saved addresses yet. Add one to check out faster.
        </p>
      ) : null}
      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) =>
          editing === a.id ? (
            <li key={a.id} className="md:col-span-2">
              <AddressForm address={a} deliveryAreas={deliveryAreas} onDone={close} />
            </li>
          ) : (
            <li key={a.id} className="flex flex-col rounded-3xl bg-cream-light p-5 shadow-sm ring-1 ring-forest/5">
              <p className="flex items-center gap-2 font-display font-semibold text-forest">
                <MapPin size={16} aria-hidden /> {a.label || 'Address'}
                {a.isDefault ? <span className="rounded-full bg-sun/30 px-2 py-0.5 font-sans text-xs font-semibold">Default</span> : null}
              </p>
              <div className="mt-2 text-sm text-ink/80">
                <p className="font-semibold text-forest">{a.fullName}</p>
                {addressLines(a).map((line) => (
                  <p key={line}>{line}</p>
                ))}
                {a.notes ? <p className="text-ink/60">{a.notes}</p> : null}
                <p className="mt-1">{a.phone}</p>
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                <Button size="sm" variant="outline" onClick={() => setEditing(a.id)}>
                  Edit
                </Button>
                {!a.isDefault ? (
                  <form action={setDefaultAddress.bind(null, a.id)}>
                    <Button type="submit" size="sm" variant="ghost">
                      Make default
                    </Button>
                  </form>
                ) : null}
                <form action={deleteAddress.bind(null, a.id)}>
                  <Button type="submit" size="sm" variant="ghost" className="text-terracotta" aria-label={`Delete ${a.label || 'address'}`}>
                    Delete
                  </Button>
                </form>
              </div>
            </li>
          ),
        )}
      </ul>
      {editing === 'new' ? (
        <AddressForm deliveryAreas={deliveryAreas} onDone={close} />
      ) : (
        <Button variant="outline" onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden /> Add an address
        </Button>
      )}
    </div>
  );
}
