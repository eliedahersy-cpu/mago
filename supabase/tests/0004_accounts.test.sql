-- supabase/tests/0004_accounts.test.sql
-- claim_customer joins a signed-in account to its customer record (and so to the
-- guest orders placed with that email) only when the email is verified. Checks
-- what each person can read afterwards. Everything is rolled back.
-- Success = a single row: "accounts: all passed".

begin;

-- Three people; handle_new_user creates their profiles.
insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'verified@test.local', now(), '{"full_name":"Vera Fied","accepts_marketing":true}', now(), now()),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'unverified@test.local', null, '{}', now(), now()),
  ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'newcomer@test.local', now(), '{"full_name":"New Comer"}', now(), now());

-- Guest orders placed earlier with two of those emails.
insert into public.customers (id, email) values
  ('00000000-0000-4000-8000-0000000000c1', 'Verified@Test.local'),
  ('00000000-0000-4000-8000-0000000000c2', 'unverified@test.local');
insert into public.orders (id, customer_id, email, phone, subtotal, total, shipping_address) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000c1', 'verified@test.local', '+96170000000', 4.50, 7.50, '{}'),
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-4000-8000-0000000000c2', 'unverified@test.local', '+96170000000', 4.50, 7.50, '{}');

-- A verified account claims its guest record and sees its order.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e1","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  first uuid;
  again uuid;
  n int;
begin
  first := public.claim_customer();
  if first is distinct from '00000000-0000-4000-8000-0000000000c1'::uuid then
    raise exception 'FAIL verified account did not claim its guest record: %', first;
  end if;
  again := public.claim_customer();
  if again is distinct from first then
    raise exception 'FAIL claim_customer is not idempotent';
  end if;
  select count(*) into n from public.orders;
  if n <> 1 then
    raise exception 'FAIL verified account should see its 1 order, saw %', n;
  end if;
  if not (select accepts_marketing from public.customers where id = first) then
    raise exception 'FAIL the marketing choice made at sign-up was not kept';
  end if;
end $$;
reset role;

-- An unverified account claims nothing and sees nothing.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e2","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  n int;
begin
  if public.claim_customer() is not null then
    raise exception 'FAIL unverified account claimed a customer record';
  end if;
  select count(*) into n from public.orders;
  if n <> 0 then
    raise exception 'FAIL unverified account sees % orders', n;
  end if;
end $$;
reset role;

-- A verified newcomer gets a fresh record, sees no one else's orders and cannot promote itself.
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000e3","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  cid uuid;
  n int;
begin
  cid := public.claim_customer();
  if cid is null then
    raise exception 'FAIL verified newcomer got no customer record';
  end if;
  select count(*) into n from public.orders;
  if n <> 0 then
    raise exception 'FAIL newcomer sees % orders', n;
  end if;
  select count(*) into n from public.customers;
  if n <> 1 then
    raise exception 'FAIL newcomer sees % customer records', n;
  end if;
  begin
    update public.profiles set role = 'owner' where id = '00000000-0000-4000-8000-0000000000e3';
    raise exception 'FAIL a customer promoted themselves';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

-- Visitors who are not signed in cannot call it.
set local role anon;
do $$
begin
  begin
    perform public.claim_customer();
    raise exception 'FAIL anon executed claim_customer';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

rollback;

select 'accounts: all passed' as result;
