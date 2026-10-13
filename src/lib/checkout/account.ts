import type { Address } from '@/lib/data/account';

/** What checkout knows about a signed-in customer. */
export interface CheckoutAccount {
  email: string;
  fullName: string | null;
  phone: string | null;
  address: Address | null;
}

/** Signed-in orders always belong to the account email, so they show up in the account. */
export function withAccountEmail<T extends { email: string }>(form: T, accountEmail: string | null): T {
  return accountEmail ? { ...form, email: accountEmail } : form;
}

/** Starting values for the checkout form: the account details and default address, or blanks. */
export function checkoutDefaults(account: CheckoutAccount | null) {
  const a = account?.address ?? null;
  return {
    fullName: a?.fullName ?? account?.fullName ?? '',
    email: account?.email ?? '',
    phone: a?.phone ?? account?.phone ?? '',
    governorate: a?.governorate ?? '',
    area: a?.area ?? '',
    street: a?.street ?? '',
    building: a?.building ?? '',
    floor: a?.floor ?? '',
    addressNotes: a?.notes ?? '',
  };
}
