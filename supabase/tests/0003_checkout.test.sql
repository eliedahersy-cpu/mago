-- supabase/tests/0003_checkout.test.sql
-- quote_cart, place_order and get_order_by_token against fixed fixtures:
-- pricing rules (spec section 6), box rules, tampering, stock, idempotency,
-- validation and what an anonymous visitor can read. Everything is rolled back.
-- Success = a single row: "checkout: all passed".

begin;

-- Known settings and discounts for the duration of the test.
update public.settings
   set shipping_flat_fee = 3.00, free_shipping_threshold = 30.00,
       delivery_areas = '["Beirut","Mount Lebanon"]'::jsonb;
update public.discounts set is_active = false;
insert into public.discounts (code, title, kind, value, applies_to, min_cup_quantity, is_automatic)
values (null, 'Test Mix & Match 10%', 'percentage', 10, 'cups', 5, true),
       ('FREESHIP', 'Free delivery', 'free_shipping', 0, 'order', null, false);

insert into public.products (id, slug, name, flavour, type, status, price, stock, track_inventory, bundle_size)
values ('00000000-0000-4000-8000-00000000a001', 'test-cup-a', 'Test Cup', 'Alpha', 'cup', 'active', 4.50, 10, true, null),
       ('00000000-0000-4000-8000-00000000a002', 'test-cup-b', 'Test Cup', 'Beta', 'cup', 'active', 4.50, 2, true, null),
       ('00000000-0000-4000-8000-00000000a003', 'test-extra', 'Test Extra', null, 'extra', 'active', 2.50, 0, false, null),
       ('00000000-0000-4000-8000-00000000a004', 'test-draft', 'Test Draft', null, 'cup', 'draft', 4.50, 10, true, null),
       ('00000000-0000-4000-8000-00000000a005', 'test-box', 'Test Box', null, 'bundle', 'active', 0, 0, false, 5);

set local role anon;

do $$
declare
  a  constant text := '00000000-0000-4000-8000-00000000a001';
  b  constant text := '00000000-0000-4000-8000-00000000a002';
  x  constant text := '00000000-0000-4000-8000-00000000a003';
  dr constant text := '00000000-0000-4000-8000-00000000a004';
  bx constant text := '00000000-0000-4000-8000-00000000a005';
  q jsonb;
  codes text;
begin
  -- One cup pays delivery.
  q := public.quote_cart(jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 1)));
  if (q ->> 'total')::numeric <> 7.50 or (q ->> 'shipping_total')::numeric <> 3.00 then
    raise exception 'FAIL single cup: %', q;
  end if;

  -- Five loose cups: 10% off the cups.
  q := public.quote_cart(jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 5)));
  if (q ->> 'discount_total')::numeric <> 2.25 or (q ->> 'total')::numeric <> 23.25 then
    raise exception 'FAIL five cups: %', q;
  end if;

  -- A box of five plus three loose cups: discount on all eight, free delivery.
  q := public.quote_cart(jsonb_build_array(
    jsonb_build_object('product_id', bx, 'quantity', 1, 'children', jsonb_build_array(a, a, a, b, b)),
    jsonb_build_object('product_id', a, 'quantity', 3)));
  if (q ->> 'subtotal')::numeric <> 36.00 or (q ->> 'discount_total')::numeric <> 3.60
     or (q ->> 'shipping_total')::numeric <> 0 or (q ->> 'total')::numeric <> 32.40
     or (q ->> 'cup_quantity')::int <> 8 or jsonb_array_length(q -> 'errors') <> 0 then
    raise exception 'FAIL box plus loose cups: %', q;
  end if;

  -- A box needs exactly its bundle size.
  q := public.quote_cart(jsonb_build_array(
    jsonb_build_object('product_id', bx, 'quantity', 1, 'children', jsonb_build_array(a, a, a, a))));
  if not (q -> 'errors') @> '[{"code":"bundle_size"}]' then
    raise exception 'FAIL short box accepted: %', q;
  end if;

  -- Only cups go in a box.
  q := public.quote_cart(jsonb_build_array(
    jsonb_build_object('product_id', bx, 'quantity', 1, 'children', jsonb_build_array(a, a, a, a, x))));
  if not (q -> 'errors') @> '[{"code":"bundle_contents"}]' then
    raise exception 'FAIL extra inside a box accepted: %', q;
  end if;

  -- Draft products are unavailable and left out of the money.
  q := public.quote_cart(jsonb_build_array(
    jsonb_build_object('product_id', dr, 'quantity', 1),
    jsonb_build_object('product_id', a, 'quantity', 1)));
  if not (q -> 'errors') @> '[{"code":"unavailable"}]' or (q ->> 'subtotal')::numeric <> 4.50 then
    raise exception 'FAIL draft product: %', q;
  end if;

  -- Malformed ids and quantities are reported, not fatal.
  q := public.quote_cart(jsonb_build_array(
    jsonb_build_object('product_id', 'nope', 'quantity', 1),
    jsonb_build_object('product_id', a, 'quantity', 'lots')));
  if not (q -> 'errors') @> '[{"code":"unavailable"}]' or (q ->> 'subtotal')::numeric <> 4.50 then
    raise exception 'FAIL malformed input: %', q;
  end if;

  -- Client-supplied prices are ignored.
  q := public.quote_cart(jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 1, 'unit_price', 0.01, 'line_total', 0.01)));
  if (q ->> 'total')::numeric <> 7.50 then
    raise exception 'FAIL tampered price honoured: %', q;
  end if;

  -- Free-shipping code.
  q := public.quote_cart(jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 1)), 'freeship');
  if (q ->> 'shipping_total')::numeric <> 0 or (q ->> 'total')::numeric <> 4.50 then
    raise exception 'FAIL free shipping code: %', q;
  end if;

  -- Unknown code.
  q := public.quote_cart(jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 1)), 'NOPE');
  if not (q -> 'errors') @> '[{"code":"discount_invalid"}]' or (q ->> 'total')::numeric <> 7.50 then
    raise exception 'FAIL unknown code: %', q;
  end if;

  -- Stock counts loose and boxed use of the same cup together (B has 2).
  q := public.quote_cart(jsonb_build_array(
    jsonb_build_object('product_id', b, 'quantity', 2),
    jsonb_build_object('product_id', bx, 'quantity', 1, 'children', jsonb_build_array(a, a, a, a, b))));
  select string_agg(e ->> 'code', ',') into codes from jsonb_array_elements(q -> 'errors') e;
  if codes is distinct from 'out_of_stock' then
    raise exception 'FAIL combined stock: %', q;
  end if;
end $$;

-- place_order -----------------------------------------------------------------

do $$
declare
  a constant text := '00000000-0000-4000-8000-00000000a001';
  b constant text := '00000000-0000-4000-8000-00000000a002';
  bx constant text := '00000000-0000-4000-8000-00000000a005';
  base jsonb := jsonb_build_object(
    'contact', jsonb_build_object('full_name', 'Test Buyer', 'email', 'Test-Buyer@Example.com', 'phone', '+961 70 123 456'),
    'address', jsonb_build_object('governorate', 'Beirut', 'area', 'Hamra', 'street', 'Bliss St', 'building', 'Blue', 'floor', '3'),
    'special_instructions', 'Ring twice', 'is_gift', true, 'gift_note', 'Enjoy!');
  r1 jsonb;
  r2 jsonb;
  r3 jsonb;
begin
  r1 := public.place_order(base || jsonb_build_object(
    'idempotency_key', '00000000-0000-4000-8000-0000000000f1',
    'items', jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 2))));
  r2 := public.place_order(base || jsonb_build_object(
    'idempotency_key', '00000000-0000-4000-8000-0000000000f1',
    'items', jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 2))));
  if r1 ->> 'number' is null or r1 ->> 'access_token' is null or r1 <> r2 then
    raise exception 'FAIL idempotent place_order: % vs %', r1, r2;
  end if;
  perform set_config('test.token1', r1 ->> 'access_token', true);

  r3 := public.place_order(base || jsonb_build_object(
    'idempotency_key', '00000000-0000-4000-8000-0000000000f2',
    'items', jsonb_build_array(jsonb_build_object('product_id', bx, 'quantity', 1, 'children', jsonb_build_array(a, a, a, b, b)))));
  perform set_config('test.token2', r3 ->> 'access_token', true);

  -- B is now sold out.
  begin
    perform public.place_order(base || jsonb_build_object(
      'idempotency_key', '00000000-0000-4000-8000-0000000000f3',
      'items', jsonb_build_array(jsonb_build_object('product_id', b, 'quantity', 1))));
    raise exception 'FAIL order beyond stock accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%Beta%' then raise exception 'FAIL stock message: %', sqlerrm; end if;
  end;

  begin
    perform public.place_order(jsonb_set(base, '{contact,email}', '"not-an-email"') || jsonb_build_object(
      'idempotency_key', '00000000-0000-4000-8000-0000000000f4',
      'items', jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 1))));
    raise exception 'FAIL bad email accepted';
  exception when sqlstate 'P0001' then
    if sqlerrm not like '%email%' then raise exception 'FAIL email message: %', sqlerrm; end if;
  end;

  begin
    perform public.place_order(jsonb_set(base, '{address,governorate}', '"Atlantis"') || jsonb_build_object(
      'idempotency_key', '00000000-0000-4000-8000-0000000000f5',
      'items', jsonb_build_array(jsonb_build_object('product_id', a, 'quantity', 1))));
    raise exception 'FAIL undeliverable area accepted';
  exception when sqlstate 'P0001' then
    null;
  end;

  begin
    perform public.place_order(base || jsonb_build_object(
      'idempotency_key', '00000000-0000-4000-8000-0000000000f6', 'items', '[]'::jsonb));
    raise exception 'FAIL empty order accepted';
  exception when sqlstate 'P0001' then
    null;
  end;

  -- Anonymous visitors cannot read orders directly.
  begin
    if exists (select 1 from public.orders) then
      raise exception 'FAIL anon can read orders';
    end if;
  exception when insufficient_privilege then
    null;
  end;
end $$;

-- What the confirmation page sees ---------------------------------------------

do $$
declare
  o1 jsonb := public.get_order_by_token(current_setting('test.token1')::uuid);
  o2 jsonb := public.get_order_by_token(current_setting('test.token2')::uuid);
begin
  if (o1 ->> 'total')::numeric <> 12.00 or jsonb_array_length(o1 -> 'items') <> 1
     or o1 ->> 'email' <> 'test-buyer@example.com' or (o1 ->> 'is_gift')::boolean is not true then
    raise exception 'FAIL confirmation of a cup order: %', o1;
  end if;
  if jsonb_array_length(o2 -> 'items') <> 1
     or jsonb_array_length(o2 -> 'items' -> 0 -> 'children') <> 2
     or (o2 ->> 'discount_total')::numeric <> 2.25 then
    raise exception 'FAIL confirmation of a box order: %', o2;
  end if;
  if public.get_order_by_token(gen_random_uuid()) is not null then
    raise exception 'FAIL unknown token returned an order';
  end if;
end $$;

reset role;

-- Stock and history, as staff would see them.
do $$
begin
  if (select stock from public.products where id = '00000000-0000-4000-8000-00000000a001') <> 5 then
    raise exception 'FAIL cup A stock should be 10 - 2 - 3 = 5';
  end if;
  if (select stock from public.products where id = '00000000-0000-4000-8000-00000000a002') <> 0 then
    raise exception 'FAIL cup B stock should be 0';
  end if;
  if (select count(*) from public.inventory_movements m join public.orders o on o.id = m.order_id
       where o.idempotency_key in ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000f2')) <> 3 then
    raise exception 'FAIL inventory movements not logged once per product per order';
  end if;
  if (select count(*) from public.order_events e join public.orders o on o.id = e.order_id
       where o.idempotency_key = '00000000-0000-4000-8000-0000000000f1' and e.type = 'created') <> 1 then
    raise exception 'FAIL created event missing';
  end if;
end $$;

rollback;

select 'checkout: all passed' as result;
