-- supabase/tests/0005_admin.test.sql
-- Admin functions: who may call them, the order status flow (with restock on cancel),
-- payments, stock adjustments, dashboard numbers, customer stats and staff roles.
-- Everything is rolled back. Success = a single row: "admin: all passed".

begin;

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner@test.local', now(), '{"full_name":"Olive Owner"}', now(), now()),
  ('00000000-0000-4000-8000-0000000000a2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staff@test.local', now(), '{"full_name":"Sam Staff"}', now(), now()),
  ('00000000-0000-4000-8000-0000000000a3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'customer@test.local', now(), '{"full_name":"Cara Customer"}', now(), now());
update public.profiles set role = 'owner' where id = '00000000-0000-4000-8000-0000000000a1';
update public.profiles set role = 'staff' where id = '00000000-0000-4000-8000-0000000000a2';

insert into public.products (id, slug, name, flavour, type, status, price, stock, track_inventory, low_stock_threshold)
values ('00000000-0000-4000-8000-0000000000b1', 'adm-cup-a', 'Admin Cup', 'Alpha', 'cup', 'active', 4.50, 8, true, 10),
       ('00000000-0000-4000-8000-0000000000b2', 'adm-cup-b', 'Admin Cup', 'Beta', 'cup', 'active', 4.50, 0, false, 10);

insert into public.customers (id, email, full_name) values
  ('00000000-0000-4000-8000-0000000000c1', 'buyer@test.local', 'Bea Buyer');

-- An order that took 2 of cup A (stock 10 -> 8), still pending.
insert into public.orders (id, customer_id, email, phone, status, subtotal, total, shipping_address)
values ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000c1', 'buyer@test.local', '+96170000000', 'pending', 9, 12, '{}'),
       ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000c1', 'buyer@test.local', '+96170000000', 'delivered', 20, 20, '{}');
insert into public.inventory_movements (product_id, delta, reason, order_id)
values ('00000000-0000-4000-8000-0000000000b1', -2, 'order', '00000000-0000-4000-8000-0000000000d1');

-- Stats fixtures in January 2020, a window no real order can fall in.
insert into public.orders (id, customer_id, email, phone, status, source, subtotal, total, shipping_address, created_at)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000c1', 'buyer@test.local', '+96170000000', 'confirmed', 'web', 12, 12, '{}', '2020-01-02 10:00+00'),
       ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000c1', 'buyer@test.local', '+96170000000', 'delivered', 'admin', 8, 8, '{}', '2020-01-03 10:00+00'),
       ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-0000000000c1', 'buyer@test.local', '+96170000000', 'cancelled', 'web', 100, 100, '{}', '2020-01-03 11:00+00');
insert into public.order_items (order_id, product_id, name, flavour, unit_price, quantity, line_total)
values ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000b1', 'Admin Cup', 'Alpha', 4.50, 2, 9.00),
       ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000b2', 'Admin Cup', 'Beta', 4.50, 1, 4.50),
       ('00000000-0000-4000-8000-0000000000e3', '00000000-0000-4000-8000-0000000000b2', 'Admin Cup', 'Beta', 4.50, 20, 90.00);

-- Customers are refused everywhere ---------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  calls text[] := array[
    $c$select public.update_order_status('00000000-0000-4000-8000-0000000000d1', 'confirmed')$c$,
    $c$select public.set_order_payment('00000000-0000-4000-8000-0000000000d1', 'paid')$c$,
    $c$select public.adjust_stock('00000000-0000-4000-8000-0000000000b1', 1, 'restock')$c$,
    $c$select public.admin_stats('2020-01-01', '2020-01-08')$c$,
    $c$select public.admin_customers(null, 10, 0)$c$,
    $c$select public.admin_staff()$c$,
    $c$select public.admin_set_role('customer@test.local', 'staff')$c$
  ];
  c text;
begin
  foreach c in array calls loop
    begin
      execute c;
      raise exception 'FAIL a customer ran: %', c;
    exception when insufficient_privilege then
      null;
    end;
  end loop;
end $$;
reset role;

-- Staff ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  s jsonb;
  n int;
begin
  -- Forward moves (skipping is allowed), never backwards.
  perform public.update_order_status('00000000-0000-4000-8000-0000000000d1', 'confirmed');
  perform public.update_order_status('00000000-0000-4000-8000-0000000000d1', 'out_for_delivery', 'Driver Ziad');
  begin
    perform public.update_order_status('00000000-0000-4000-8000-0000000000d1', 'preparing');
    raise exception 'FAIL moved an order backwards';
  exception when sqlstate 'P0001' then
    null;
  end;
  select count(*) into n from public.order_events
   where order_id = '00000000-0000-4000-8000-0000000000d1' and type = 'status_changed'
     and created_by = '00000000-0000-4000-8000-0000000000a2';
  if n <> 2 then
    raise exception 'FAIL expected 2 status events by staff, got %', n;
  end if;

  -- Cancelling restocks once; a cancelled order is final.
  perform public.update_order_status('00000000-0000-4000-8000-0000000000d1', 'cancelled', 'Customer asked');
  if (select stock from public.products where id = '00000000-0000-4000-8000-0000000000b1') <> 10 then
    raise exception 'FAIL cancel did not restock';
  end if;
  begin
    perform public.update_order_status('00000000-0000-4000-8000-0000000000d1', 'cancelled');
    raise exception 'FAIL cancelled twice';
  exception when sqlstate 'P0001' then
    null;
  end;
  if (select stock from public.products where id = '00000000-0000-4000-8000-0000000000b1') <> 10 then
    raise exception 'FAIL restocked twice';
  end if;

  -- Delivered is final too.
  begin
    perform public.update_order_status('00000000-0000-4000-8000-0000000000d2', 'cancelled');
    raise exception 'FAIL cancelled a delivered order';
  exception when sqlstate 'P0001' then
    null;
  end;

  perform public.set_order_payment('00000000-0000-4000-8000-0000000000d2', 'paid');
  if (select payment_status from public.orders where id = '00000000-0000-4000-8000-0000000000d2') <> 'paid' then
    raise exception 'FAIL payment not recorded';
  end if;

  -- Stock never goes below zero for products without backorders.
  begin
    perform public.adjust_stock('00000000-0000-4000-8000-0000000000b1', -50, 'adjustment');
    raise exception 'FAIL stock went below zero';
  exception when sqlstate 'P0001' then
    null;
  end;
  if public.adjust_stock('00000000-0000-4000-8000-0000000000b1', 5, 'restock', 'Weekly delivery') <> 15 then
    raise exception 'FAIL restock result';
  end if;
  if not exists (select 1 from public.inventory_movements
                  where product_id = '00000000-0000-4000-8000-0000000000b1' and delta = 5 and reason = 'restock'
                    and created_by = '00000000-0000-4000-8000-0000000000a2') then
    raise exception 'FAIL restock not logged with its author';
  end if;

  -- Dashboard numbers for the January 2020 fixtures (cancelled orders excluded).
  s := public.admin_stats('2020-01-01 00:00+02', '2020-01-08 00:00+02');
  if (s ->> 'sales')::numeric <> 20 or (s ->> 'orders')::int <> 2 or (s ->> 'aov')::numeric <> 10 then
    raise exception 'FAIL stats totals: %', s;
  end if;
  if (s -> 'previous' ->> 'orders')::int <> 0 then
    raise exception 'FAIL previous period should be empty: %', s -> 'previous';
  end if;
  if jsonb_array_length(s -> 'daily') <> 7 then
    raise exception 'FAIL expected 7 days, got %', jsonb_array_length(s -> 'daily');
  end if;
  if s -> 'top_products' -> 0 ->> 'flavour' <> 'Alpha' or (s -> 'top_products' -> 0 ->> 'quantity')::int <> 2 then
    raise exception 'FAIL top products: %', s -> 'top_products';
  end if;
  if not (s -> 'by_source') @> '[{"source":"admin","orders":1}]' then
    raise exception 'FAIL by source: %', s -> 'by_source';
  end if;

  s := public.admin_customers('buyer', 10, 0);
  if (s ->> 'total')::int <> 1 or (s -> 'rows' -> 0 ->> 'orders')::int < 3 then
    raise exception 'FAIL customers: %', s;
  end if;

  if jsonb_array_length(public.admin_staff()) < 2 then
    raise exception 'FAIL staff list';
  end if;

  -- Staff cannot change roles.
  begin
    perform public.admin_set_role('customer@test.local', 'staff');
    raise exception 'FAIL staff changed a role';
  exception when insufficient_privilege then
    null;
  end;
end $$;
reset role;

-- Owner -----------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  perform public.admin_set_role('Customer@Test.local', 'staff');
  if (select role from public.profiles where id = '00000000-0000-4000-8000-0000000000a3') <> 'staff' then
    raise exception 'FAIL owner could not promote';
  end if;
  begin
    perform public.admin_set_role('nobody@test.local', 'staff');
    raise exception 'FAIL promoted an email with no account';
  exception when sqlstate 'P0001' then
    null;
  end;
  begin
    perform public.admin_set_role('owner@test.local', 'customer');
    raise exception 'FAIL demoted the last owner';
  exception when sqlstate 'P0001' then
    null;
  end;
end $$;
reset role;

rollback;

select 'admin: all passed' as result;
