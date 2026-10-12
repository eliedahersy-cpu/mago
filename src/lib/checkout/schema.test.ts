import { checkoutSchema, fieldErrors } from '@/lib/checkout/schema';

const valid = {
  fullName: 'Lina Haddad',
  email: '  Lina@Example.com ',
  phone: '+961 70 123 456',
  governorate: 'Beirut',
  area: 'Hamra',
  street: 'Bliss Street',
  building: 'Blue Tower',
  floor: '3',
  addressNotes: '',
  instructions: 'Ring twice',
  isGift: false,
  giftNote: '',
  acceptsMarketing: true,
  code: '',
};

test('a complete form passes and is normalised', () => {
  const parsed = checkoutSchema.parse(valid);
  expect(parsed.email).toBe('lina@example.com');
  expect(parsed.fullName).toBe('Lina Haddad');
});

test('optional fields may be left out', () => {
  const { building, floor, addressNotes, instructions, giftNote, code, ...required } = valid;
  void [building, floor, addressNotes, instructions, giftNote, code];
  expect(checkoutSchema.safeParse(required).success).toBe(true);
});

test.each([
  ['email', 'not-an-email', 'Please enter a valid email address.'],
  ['phone', '12', 'Please enter a valid phone number.'],
  ['phone', 'call me', 'Please enter a valid phone number.'],
  ['street', '   ', 'Please enter your street.'],
  ['governorate', '', 'Please choose your governorate.'],
  ['fullName', 'L', 'Please enter your full name.'],
])('%s = %j is rejected with its own message', (field, value, message) => {
  const result = checkoutSchema.safeParse({ ...valid, [field]: value });
  expect(result.success).toBe(false);
  if (!result.success) expect(fieldErrors(result.error)[field]).toBe(message);
});

test('notes have length limits', () => {
  expect(checkoutSchema.safeParse({ ...valid, giftNote: 'x'.repeat(201) }).success).toBe(false);
  expect(checkoutSchema.safeParse({ ...valid, instructions: 'x'.repeat(501) }).success).toBe(false);
});
