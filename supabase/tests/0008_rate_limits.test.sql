-- supabase/tests/0008_rate_limits.test.sql
-- place_order refuses a 6th order from the same email or phone within 10 minutes and a site-wide
-- flood, but a retried submission (same idempotency key) still returns its first order.
-- Everything is rolled back. Success = a single row: "rate limits: all passed".

begin;

update public.settings set delivery_areas = '["Beirut","Mount Lebanon"]'::jsonb;
insert into public.products (id, slug, name, flavour, type, status, price, stock, track_inventory)
values ('00000000-0000-4000-8000-0000000000c9', 'rate-cup', 'Rate Cup', 'Test', 'cup', 'active', 4.50, 500, true);

-- Everything an order needs except the contact and the idempotency key.
select set_config('test.base', jsonb_build_object(
  'items', jsonb_build_array(jsonb_build_object('product_id', '00000000-0000-4000-8000-0000000000c9', 'quantity', 1)),
  'address', jsonb_build_object('governorate', 'Beirut', 'area', 'Hamra', 'street', 'Bliss'))::text, true);

select set_config('request.jwt.claims', '', true);
set local role anon;
do $$
declare
  first_key uuid := gen_random_uuid();
  first     jsonb;
  again     jsonb;
  i         int;
begin
  first := public.place_order(current_setting('test.base')::jsonb || jsonb_build_object('idempotency_key', first_key, 'contact', jsonb_build_object('full_name', 'Rate Tester', 'email', 'rate@test.local', 'phone', '+961 70 111 111')));
  for i in 2..5 loop
    perform public.place_order(current_setting('test.base')::jsonb || jsonb_build_object('idempotency_key', gen_random_uuid(), 'contact', jsonb_build_object('full_name', 'Rate Tester', 'email', 'rate@test.local', 'phone', '+961 70 111 111')));
  end loop;

  -- A 6th order from the same email is refused…
  begin
    perform public.place_order(current_setting('test.base')::jsonb || jsonb_build_object('idempotency_key', gen_random_uuid(), 'contact', jsonb_build_object('full_name', 'Rate Tester', 'email', 'RATE@test.local', 'phone', '+961 70 999 999')));
    raise exception 'FAIL a 6th order from the same email was accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'You have placed several orders%' then raise exception 'FAIL wrong message: %', sqlerrm; end if;
  end;
  -- …and from the same phone with another email.
  begin
    perform public.place_order(current_setting('test.base')::jsonb || jsonb_build_object('idempotency_key', gen_random_uuid(), 'contact', jsonb_build_object('full_name', 'Rate Tester', 'email', 'other@test.local', 'phone', '+961 70 111 111')));
    raise exception 'FAIL a 6th order from the same phone was accepted';
  exception when sqlstate 'P0001' then null;
  end;

  -- Retrying the first submission still answers with the first order.
  again := public.place_order(current_setting('test.base')::jsonb || jsonb_build_object('idempotency_key', first_key, 'contact', jsonb_build_object('full_name', 'Rate Tester', 'email', 'rate@test.local', 'phone', '+961 70 111 111')));
  if again ->> 'number' <> first ->> 'number' then
    raise exception 'FAIL a retried submission was refused or duplicated: % vs %', again, first;
  end if;

  -- Someone else is not affected.
  perform public.place_order(current_setting('test.base')::jsonb || jsonb_build_object('idempotency_key', gen_random_uuid(), 'contact', jsonb_build_object('full_name', 'Rate Tester', 'email', 'fresh@test.local', 'phone', '+961 70 222 222')));
end $$;
reset role;

-- A site-wide flood: 100 orders in the last 2 minutes.
insert into public.orders (email, phone, subtotal, total, shipping_address)
select 'flood' || g || '@test.local', '+961 71 ' || lpad(g::text, 6, '0'), 1, 1, '{}'
  from generate_series(1, 100) g;

select set_config('request.jwt.claims', '', true);
set local role anon;
do $$
begin
  perform public.place_order(current_setting('test.base')::jsonb || jsonb_build_object('idempotency_key', gen_random_uuid(), 'contact', jsonb_build_object('full_name', 'Rate Tester', 'email', 'calm@test.local', 'phone', '+961 70 333 333')));
  raise exception 'FAIL an order went through during a flood';
exception when sqlstate 'P0001' then
  if sqlerrm not like 'We are receiving a lot of orders%' then raise exception 'FAIL wrong message: %', sqlerrm; end if;
end $$;
reset role;

rollback;

select 'rate limits: all passed' as result;
