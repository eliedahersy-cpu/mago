# Accounts — manual checklist

Automated tests cover everything a signed-out visitor can do. These steps need a real
mailbox and a real account, so they are checked by hand on the live site
(https://mago-rose.vercel.app) or locally (`npm run dev`, http://localhost:3000).

Use an email you can open. Supabase's built-in email service only sends a few emails per
hour; if a message does not arrive, wait a few minutes before asking for another.

## 1. Register and confirm
- [ ] Open **/account/register**, fill in name, email and a password of 8+ characters, tick or
      untick the offers box, press **Create account**.
- [ ] The page says to check your inbox. The email arrives from Supabase.
- [ ] The link in the email opens the site signed in, on **/account**, greeting you by first name.
- [ ] Registering again with the same email shows the same "check your inbox" message (it never
      says whether an email already has an account).

## 2. Sign out and back in
- [ ] **Sign out** (account menu) returns to the home page; **/account** now asks you to sign in.
- [ ] Sign in with the wrong password: "That email and password do not match…".
- [ ] Sign in with the right password: you land on **/account**.
- [ ] Open **/account/orders** while signed out: after signing in you land on **/account/orders**.

## 3. Emailed sign-in link
- [ ] On **/account/login**, enter your email and press **Email me a sign-in link**.
- [ ] The link signs you in. Opening the same link a second time shows "That link has expired…".

## 4. Forgot password
- [ ] **Forgot your password?** → enter your email → **Send reset link**.
- [ ] The link opens **Choose a new password**; save a new password (repeat it exactly).
- [ ] Sign out and sign in with the new password.

## 5. Guest orders join the account
- [ ] Signed out, place an order with a *new* email address (use a test product).
- [ ] Register with that same email and confirm it.
- [ ] **/account/orders** lists the guest order; opening it shows the items, totals and address.

## 6. Details and addresses
- [ ] On **/account**, change your name and phone, press **Save details**: "Your details are saved."
- [ ] **/account/addresses**: add an address (the first one becomes the default), add a second,
      **Make default** on the second, **Edit** one, **Delete** one.
- [ ] Mistakes (empty street, bad phone) show a message next to the field.

## 7. Wishlist
- [ ] Signed out, tap the heart on two cups in **/shop**.
- [ ] Sign in: **/account/wishlist** shows those two cups.
- [ ] Remove one from the product page heart; refresh **/account/wishlist**: it is gone.
- [ ] Sign out: the hearts on **/shop** are cleared.

## 8. Signed-in checkout
- [ ] Signed in with a default address, add a cup and open **/checkout**: name, phone and address
      are filled in; the email is your account email and cannot be changed.
- [ ] With no saved address, tick **Save this address to my account**, place the order, then check
      **/account/addresses** shows it.
- [ ] The new order appears in **/account/orders**.

## 9. Privacy
- [ ] Signed in as a second account, **/account/orders** shows none of the first account's orders,
      and **/account/orders/&lt;their order number&gt;** says the page cannot be found.

## After testing
Test orders are real orders. Delete them from the Supabase SQL editor (adjust the email):

```sql
-- Restores stock, then removes the orders placed with this email.
update public.products p set stock = p.stock + m.qty
from (select im.product_id, -sum(im.delta)::int as qty
      from public.inventory_movements im join public.orders o on o.id = im.order_id
      where o.email = 'you@example.com' group by im.product_id) m
where p.id = m.product_id;
delete from public.inventory_movements im using public.orders o
 where o.id = im.order_id and o.email = 'you@example.com';
delete from public.orders where email = 'you@example.com';
```
