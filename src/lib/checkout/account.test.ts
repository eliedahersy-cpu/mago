import { checkoutDefaults, withAccountEmail } from '@/lib/checkout/account';

test('a signed-in order always uses the account email, whatever was typed', () => {
  const form = { email: 'someone-else@example.com', fullName: 'Lina' };
  expect(withAccountEmail(form, 'lina@example.com').email).toBe('lina@example.com');
  expect(withAccountEmail(form, null).email).toBe('someone-else@example.com');
});

test('checkout starts from the account details and default address', () => {
  const defaults = checkoutDefaults({
    email: 'lina@example.com',
    fullName: 'Lina Haddad',
    phone: null,
    address: {
      id: 'a1',
      label: 'Home',
      fullName: 'Lina H.',
      phone: '+961 70 123 456',
      governorate: 'Beirut',
      area: 'Hamra',
      street: 'Bliss Street',
      building: 'Blue Tower',
      floor: '3',
      notes: 'Ring twice',
      isDefault: true,
    },
  });
  expect(defaults).toEqual({
    fullName: 'Lina H.',
    email: 'lina@example.com',
    phone: '+961 70 123 456',
    governorate: 'Beirut',
    area: 'Hamra',
    street: 'Bliss Street',
    building: 'Blue Tower',
    floor: '3',
    addressNotes: 'Ring twice',
  });
});

test('guests start with an empty form', () => {
  expect(checkoutDefaults(null)).toEqual({
    fullName: '',
    email: '',
    phone: '',
    governorate: '',
    area: '',
    street: '',
    building: '',
    floor: '',
    addressNotes: '',
  });
});
