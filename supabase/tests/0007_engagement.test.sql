-- supabase/tests/0007_engagement.test.sql
-- Reviews and Subscribe & Save: who may do what, prices, the daily job (twice in a day, sold-out
-- cups), pause/skip/cancel. Everything is rolled back. Success = a single row: "engagement: all passed".

begin;

insert into auth.users (id, instance_id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cara@test.local', now(), '{"full_name":"Cara Client"}', now(), now()),
  ('00000000-0000-4000-8000-0000000000f2', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bob@test.local', now(), '{"full_name":"Bob"}', now(), now()),
  ('00000000-0000-4000-8000-0000000000f3', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'unverified@test.local', null, '{}', now(), now()),
  ('00000000-0000-4000-8000-0000000000f4', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'staffer@test.local', now(), '{"full_name":"Sam Staff"}', now(), now());
update public.profiles set role = 'staff' where id = '00000000-0000-4000-8000-0000000000f4';

update public.settings set shipping_flat_fee = 3.00, free_shipping_threshold = 30.00, delivery_areas = '["Beirut","Mount Lebanon"]'::jsonb;

insert into public.products (id, slug, name, flavour, type, status, price, stock, track_inventory) values
  ('00000000-0000-4000-8000-0000000000e1', 'eng-alpha', 'Test Cup', 'Alpha', 'cup', 'active', 4.00, 10, true),
  ('00000000-0000-4000-8000-0000000000e2', 'eng-beta', 'Test Cup', 'Beta', 'cup', 'active', 4.00, 1, true),
  ('00000000-0000-4000-8000-0000000000e3', 'eng-gamma', 'Test Cup', 'Gamma', 'cup', 'active', 4.00, 0, false),
  ('00000000-0000-4000-8000-0000000000e4', 'eng-draft', 'Test Cup', 'Draft', 'cup', 'draft', 4.00, 10, true),
  ('00000000-0000-4000-8000-0000000000e5', 'eng-extra', 'Test Extra', null, 'extra', 'active', 2.50, 5, true);

insert into public.subscription_plans (id, name, interval_weeks, discount_percent, is_active) values
  ('00000000-0000-4000-8000-0000000000d1', 'Test every 2 weeks', 2, 20, true),
  ('00000000-0000-4000-8000-0000000000d2', 'Test retired plan', 4, 50, false);

select set_config('test.items_ok', '{"cups":[{"product_id":"00000000-0000-4000-8000-0000000000e1","quantity":3},{"product_id":"00000000-0000-4000-8000-0000000000e3","quantity":2}],"extras":[{"product_id":"00000000-0000-4000-8000-0000000000e5","quantity":1}]}', true);
select set_config('test.address', '{"full_name":"Cara Client","phone":"+961 70 000 000","governorate":"Beirut","area":"Hamra","street":"Bliss"}', true);

-- Anonymous visitors: prices yes, everything else no -----------------------------------------
select set_config('request.jwt.claims', '', true);
set local role anon;
do $$
declare
  q jsonb := public.quote_subscription('00000000-0000-4000-8000-0000000000d1', current_setting('test.items_ok')::jsonb);
begin
  if (q ->> 'cups_subtotal')::numeric <> 20 or (q ->> 'discount')::numeric <> 4 or (q ->> 'extras_subtotal')::numeric <> 2.5
     or (q ->> 'shipping')::numeric <> 3 or (q ->> 'total')::numeric <> 21.5 or jsonb_array_length(q -> 'errors') <> 0 then
    raise exception 'FAIL subscription quote: %', q;
  end if;
  begin
    perform public.create_subscription('{}'::jsonb);
    raise exception 'FAIL anon created a subscription';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.process_due_subscriptions();
    raise exception 'FAIL anon ran subscriptions';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.submit_review('00000000-0000-4000-8000-0000000000e1', 5, null, 'Lovely cup indeed');
    raise exception 'FAIL anon reviewed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- An account whose email is not confirmed ------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f3","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  perform public.create_subscription(jsonb_build_object('plan_id', '00000000-0000-4000-8000-0000000000d1',
    'items', current_setting('test.items_ok')::jsonb, 'address', current_setting('test.address')::jsonb));
  raise exception 'FAIL unverified account subscribed';
exception when sqlstate 'P0001' then
  if sqlerrm not like 'Confirm your email%' then raise exception 'FAIL wrong message: %', sqlerrm; end if;
end $$;
reset role;

-- Cara subscribes ---------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f1","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  ok   jsonb := current_setting('test.items_ok')::jsonb;
  addr jsonb := current_setting('test.address')::jsonb;
  bad  record;
  sid  uuid;
  s    record;
  today date := (now() at time zone 'Asia/Beirut')::date;
begin
  for bad in
    select * from (values
      ('{"cups":[{"product_id":"00000000-0000-4000-8000-0000000000e1","quantity":4}]}'::jsonb, '00000000-0000-4000-8000-0000000000d1', addr, 'Choose exactly 5 cups%'),
      ('{"cups":[{"product_id":"00000000-0000-4000-8000-0000000000e4","quantity":5}]}'::jsonb, '00000000-0000-4000-8000-0000000000d1', addr, '%no longer available%'),
      (ok, '00000000-0000-4000-8000-0000000000d2', addr, 'Choose a delivery plan%'),
      (ok, '00000000-0000-4000-8000-0000000000d1', addr || '{"governorate":"Mars"}', '%governorate we deliver to%')
    ) as t(items, plan, address, msg)
  loop
    begin
      perform public.create_subscription(jsonb_build_object('plan_id', bad.plan, 'items', bad.items, 'address', bad.address));
      raise exception 'FAIL accepted a bad subscription (%)', bad.msg;
    exception when sqlstate 'P0001' then
      if sqlerrm not like bad.msg then raise exception 'FAIL expected %, got %', bad.msg, sqlerrm; end if;
    end;
  end loop;

  sid := public.create_subscription(jsonb_build_object('plan_id', '00000000-0000-4000-8000-0000000000d1', 'items', ok, 'address', addr,
                                                       'is_gift', true, 'gift_note', 'Enjoy!'));
  select * into s from public.subscriptions where id = sid;
  if s.status <> 'active' or s.next_delivery_date <> today + 2 or s.gift_note <> 'Enjoy!'
     or jsonb_array_length(s.items -> 'cups') <> 2 or s.address ->> 'governorate' <> 'Beirut' then
    raise exception 'FAIL created subscription: %', row_to_json(s);
  end if;
  perform set_config('test.sid', sid::text, true);

  perform public.update_subscription(sid, 'pause');
  if (select status from public.subscriptions where id = sid) <> 'paused' then raise exception 'FAIL pause'; end if;
  perform public.update_subscription(sid, 'resume');
  perform public.update_subscription(sid, 'skip');
  if (select next_delivery_date from public.subscriptions where id = sid) <> today + 16 then raise exception 'FAIL skip'; end if;
  begin
    perform public.update_subscription(sid, 'update_items', '{"items":{"cups":[{"product_id":"00000000-0000-4000-8000-0000000000e1","quantity":6}]}}');
    raise exception 'FAIL six cups accepted';
  exception when sqlstate 'P0001' then null;
  end;

  -- A second box that asks for 5 Beta cups when only 1 is in stock.
  perform set_config('test.sid2', public.create_subscription(jsonb_build_object('plan_id', '00000000-0000-4000-8000-0000000000d1',
    'items', '{"cups":[{"product_id":"00000000-0000-4000-8000-0000000000e2","quantity":5}]}'::jsonb, 'address', addr))::text, true);

  begin
    perform public.process_due_subscriptions();
    raise exception 'FAIL a customer ran subscriptions';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Bob cannot touch Cara's subscription -----------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f2","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  if exists (select 1 from public.subscriptions where id = current_setting('test.sid')::uuid) then
    raise exception 'FAIL Bob can read Cara''s subscription';
  end if;
  begin
    perform public.update_subscription(current_setting('test.sid')::uuid, 'cancel');
    raise exception 'FAIL Bob cancelled Cara''s subscription';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Both subscriptions are due today.
update public.subscriptions set next_delivery_date = (now() at time zone 'Asia/Beirut')::date
 where id in (current_setting('test.sid')::uuid, current_setting('test.sid2')::uuid);

-- Staff run the job twice ------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f4","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  sid  uuid := current_setting('test.sid')::uuid;
  sid2 uuid := current_setting('test.sid2')::uuid;
  o    record;
  today date := (now() at time zone 'Asia/Beirut')::date;
begin
  perform public.process_due_subscriptions();
  select * into o from public.orders where subscription_id = sid;
  if o.source <> 'subscription' or o.status <> 'pending' or o.subtotal <> 22.5 or o.discount_total <> 4
     or o.shipping_total <> 3 or o.total <> 21.5 or not o.is_gift then
    raise exception 'FAIL subscription order: %', row_to_json(o);
  end if;
  if (select count(*) from public.order_items where order_id = o.id and parent_item_id is not null) <> 2 then
    raise exception 'FAIL box cups should be child lines';
  end if;
  if (select stock from public.products where id = '00000000-0000-4000-8000-0000000000e1') <> 7 then
    raise exception 'FAIL Alpha stock should be 7';
  end if;
  if not exists (select 1 from public.inventory_movements where order_id = o.id and reason = 'subscription' and delta = -3) then
    raise exception 'FAIL movement not logged';
  end if;
  if (select next_delivery_date from public.subscriptions where id = sid) <= today + 2 then
    raise exception 'FAIL next delivery not moved on';
  end if;

  -- Sold out: an order anyway, stock at zero (not below), and a note for staff.
  select * into o from public.orders where subscription_id = sid2;
  if o.id is null then raise exception 'FAIL no order for the short box'; end if;
  if (select stock from public.products where id = '00000000-0000-4000-8000-0000000000e2') <> 0 then
    raise exception 'FAIL Beta stock should stop at 0';
  end if;
  if not exists (select 1 from public.order_events where order_id = o.id and message like 'Not enough stock for: Test Cup Beta (short by 4)%') then
    raise exception 'FAIL shortfall note missing';
  end if;
  if (select last_run_note from public.subscriptions where id = sid2) is null then
    raise exception 'FAIL shortfall not noted on the subscription';
  end if;

  -- Again the same day: nothing new.
  perform public.process_due_subscriptions();
  if (select count(*) from public.orders where subscription_id in (sid, sid2)) <> 2 then
    raise exception 'FAIL second run created more orders';
  end if;

  -- Staff can manage any subscription.
  perform public.update_subscription(sid2, 'cancel');
end $$;
reset role;

-- Reviews ---------------------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f1","role":"authenticated"}', true);
set local role authenticated;
do $$
declare
  r record;
begin
  perform public.submit_review('00000000-0000-4000-8000-0000000000e1', 5, 'Great', 'Really tasty cup, will buy again.');
  select * into r from public.reviews where product_id = '00000000-0000-4000-8000-0000000000e1';
  if r.status <> 'pending' or not r.is_verified_buyer or r.author_name <> 'Cara C.' then
    raise exception 'FAIL review: %', row_to_json(r);
  end if;
  begin
    perform public.submit_review('00000000-0000-4000-8000-0000000000e1', 4, null, 'Second thoughts on this.');
    raise exception 'FAIL reviewed twice';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.submit_review('00000000-0000-4000-8000-0000000000e4', 4, null, 'A draft product review.');
    raise exception 'FAIL reviewed a hidden product';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.submit_review('00000000-0000-4000-8000-0000000000e3', 6, null, 'Six stars please now.');
    raise exception 'FAIL six stars';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.submit_review('00000000-0000-4000-8000-0000000000e3', 4, null, 'short');
    raise exception 'FAIL too short';
  exception when sqlstate 'P0001' then null;
  end;
  begin
    perform public.update_subscription(current_setting('test.sid2')::uuid, 'pause');
    raise exception 'FAIL paused a cancelled subscription';
  exception when sqlstate 'P0001' then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000f2","role":"authenticated"}', true);
set local role authenticated;
do $$
begin
  perform public.submit_review('00000000-0000-4000-8000-0000000000e1', 3, null, 'Fine but a bit salty.');
  if (select is_verified_buyer from public.reviews r join public.customers c on c.id = r.customer_id
       where r.product_id = '00000000-0000-4000-8000-0000000000e1' and c.email = 'bob@test.local') then
    raise exception 'FAIL Bob never bought it but is verified';
  end if;
end $$;
reset role;

-- Only approved reviews count.
update public.reviews set status = 'approved'
 where product_id = '00000000-0000-4000-8000-0000000000e1' and author_name = 'Cara C.';
do $$
begin
  if (select rating_count from public.products where id = '00000000-0000-4000-8000-0000000000e1') <> 1
     or (select rating_avg from public.products where id = '00000000-0000-4000-8000-0000000000e1') <> 5 then
    raise exception 'FAIL rating not refreshed from approved reviews';
  end if;
end $$;

rollback;

select 'engagement: all passed' as result;
