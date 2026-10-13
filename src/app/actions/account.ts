'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { addressSchema, profileSchema } from '@/lib/account/address';
import { getUser } from '@/lib/auth/dal';
import { fieldErrors } from '@/lib/checkout/schema';
import { createClient } from '@/lib/supabase/server';

export type FormState = { status: 'idle' | 'saved' | 'error'; message: string; fieldErrors?: Record<string, string> };

const text = (form: FormData, name: string) => String(form.get(name) ?? '');
const idSchema = z.uuid();

/** Every action re-checks the session; the browser is never trusted to say who is signed in. */
async function signedIn() {
  const user = await getUser();
  if (!user) redirect('/account/login');
  return user;
}

async function customerId(): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('claim_customer');
  if (error) throw new Error(`Failed to load your account: ${error.message}`);
  return (data as string | null) ?? null;
}

export async function updateProfile(_prev: FormState, form: FormData): Promise<FormState> {
  const user = await signedIn();
  const parsed = profileSchema.safeParse({ fullName: text(form, 'fullName'), phone: text(form, 'phone') });
  if (!parsed.success) return { status: 'error', message: '', fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: parsed.data.fullName, phone: parsed.data.phone || null })
    .eq('id', user.id);
  if (error) {
    console.error('updateProfile failed', error);
    return { status: 'error', message: 'We could not save your details. Please try again.' };
  }
  revalidatePath('/account');
  return { status: 'saved', message: 'Your details are saved.' };
}

export async function saveAddress(_prev: FormState, form: FormData): Promise<FormState> {
  await signedIn();
  const parsed = addressSchema.safeParse({
    label: text(form, 'label'),
    fullName: text(form, 'fullName'),
    phone: text(form, 'phone'),
    governorate: text(form, 'governorate'),
    area: text(form, 'area'),
    street: text(form, 'street'),
    building: text(form, 'building'),
    floor: text(form, 'floor'),
    notes: text(form, 'notes'),
    isDefault: form.get('isDefault') === 'on',
  });
  if (!parsed.success) return { status: 'error', message: '', fieldErrors: fieldErrors(parsed.error) };
  const rawId = text(form, 'id');
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return { status: 'error', message: 'That address could not be found.' };

  const cid = await customerId();
  if (!cid) return { status: 'error', message: 'Please confirm your email before saving addresses.' };

  const supabase = await createClient();
  const d = parsed.data;
  const row = {
    customer_id: cid,
    label: d.label || null,
    full_name: d.fullName,
    phone: d.phone,
    governorate: d.governorate,
    area: d.area,
    street: d.street,
    building: d.building || null,
    floor: d.floor || null,
    notes: d.notes || null,
    is_default: d.isDefault,
  };
  if (!id) {
    // The first address becomes the default.
    const { count } = await supabase.from('addresses').select('id', { count: 'exact', head: true }).eq('customer_id', cid);
    if ((count ?? 0) === 0) row.is_default = true;
  }
  if (row.is_default) await supabase.from('addresses').update({ is_default: false }).eq('customer_id', cid);

  const { error } = id
    ? await supabase.from('addresses').update(row).eq('id', id.data)
    : await supabase.from('addresses').insert(row);
  if (error) {
    console.error('saveAddress failed', error);
    return { status: 'error', message: 'We could not save that address. Please try again.' };
  }
  revalidatePath('/account/addresses');
  revalidatePath('/account');
  return { status: 'saved', message: 'Address saved.' };
}

export async function deleteAddress(id: string): Promise<void> {
  await signedIn();
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return;
  const supabase = await createClient();
  const { error } = await supabase.from('addresses').delete().eq('id', parsed.data);
  if (error) console.error('deleteAddress failed', error);
  revalidatePath('/account/addresses');
  revalidatePath('/account');
}

export async function setDefaultAddress(id: string): Promise<void> {
  await signedIn();
  const parsed = idSchema.safeParse(id);
  const cid = await customerId();
  if (!parsed.success || !cid) return;
  const supabase = await createClient();
  await supabase.from('addresses').update({ is_default: false }).eq('customer_id', cid);
  const { error } = await supabase.from('addresses').update({ is_default: true }).eq('id', parsed.data);
  if (error) console.error('setDefaultAddress failed', error);
  revalidatePath('/account/addresses');
  revalidatePath('/account');
}
