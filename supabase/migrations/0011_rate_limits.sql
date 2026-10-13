-- 0011_rate_limits.sql — place_order refuses floods: at most 5 orders per email or phone in
-- 10 minutes, and 100 orders site-wide in 2 minutes (staff are exempt). Retried submissions with
-- the same idempotency key still return their first order.

create index if not exists orders_email_recent on public.orders (lower(email), created_at desc);
create index if not exists orders_phone_recent on public.orders (phone, created_at desc);
create index if not exists orders_created_at on public.orders (created_at desc);

create or replace function public.place_order(payload jsonb)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  uuid_re      constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  s            record;
  key          uuid;
  existing     record;
  contact      jsonb := coalesce(payload -> 'contact', '{}'::jsonb);
  addr         jsonb := coalesce(payload -> 'address', '{}'::jsonb);
  v_name       text := nullif(btrim(contact ->> 'full_name'), '');
  v_email      text := lower(nullif(btrim(contact ->> 'email'), ''));
  v_phone      text := nullif(btrim(contact ->> 'phone'), '');
  v_gov        text := nullif(btrim(addr ->> 'governorate'), '');
  v_area       text := nullif(btrim(addr ->> 'area'), '');
  v_street     text := nullif(btrim(addr ->> 'street'), '');
  v_building   text := nullif(btrim(addr ->> 'building'), '');
  v_floor      text := nullif(btrim(addr ->> 'floor'), '');
  v_addr_notes text := nullif(btrim(addr ->> 'notes'), '');
  v_instr      text := nullif(btrim(payload ->> 'special_instructions'), '');
  v_gift_note  text := nullif(btrim(payload ->> 'gift_note'), '');
  v_is_gift    boolean := coalesce(payload ->> 'is_gift', '') = 'true';
  v_marketing  boolean := coalesce(payload ->> 'accepts_marketing', '') = 'true';
  v_code       text := nullif(btrim(payload ->> 'code'), '');
  q            jsonb;
  msg          text;
  cust_id      uuid;
  ord          record;
  line         jsonb;
  parent_id    uuid;
  need         record;
  d            record;
begin
  key := case when (payload ->> 'idempotency_key') ~ uuid_re then (payload ->> 'idempotency_key')::uuid end;
  if key is null then
    raise exception using errcode = 'P0001', message = 'Something went wrong. Please refresh the page and try again.';
  end if;

  -- The same submission twice (double click, retry) returns the first order.
  select o.number, o.access_token into existing from public.orders o where o.idempotency_key = key;
  if found then
    return jsonb_build_object('number', existing.number, 'access_token', existing.access_token);
  end if;

  select delivery_areas into s from public.settings where id;

  if v_name is null or length(v_name) < 2 or length(v_name) > 100 then
    raise exception using errcode = 'P0001', message = 'Please enter your full name.';
  end if;
  if v_email is null or length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception using errcode = 'P0001', message = 'Please enter a valid email address.';
  end if;
  if v_phone is null or v_phone !~ '^[+0-9][0-9 -]{5,19}$' then
    raise exception using errcode = 'P0001', message = 'Please enter a valid phone number.';
  end if;

  -- Flood protection (staff taking phone orders are exempt). A retried submission never gets
  -- here: it returned its first order above.
  if not public.is_staff() then
    if (select count(*) from public.orders o
         where o.created_at > now() - interval '10 minutes'
           and (lower(o.email) = v_email or o.phone = v_phone)) >= 5 then
      raise exception using errcode = 'P0001',
        message = 'You have placed several orders in the last few minutes. Please wait a little, or call us to add to your order.';
    end if;
    if (select count(*) from public.orders o where o.created_at > now() - interval '2 minutes') >= 100 then
      raise exception using errcode = 'P0001',
        message = 'We are receiving a lot of orders right now. Please try again in a couple of minutes.';
    end if;
  end if;
  if v_gov is null
     or (jsonb_array_length(s.delivery_areas) > 0 and not (s.delivery_areas ? v_gov)) then
    raise exception using errcode = 'P0001', message = 'Please choose a delivery area we serve.';
  end if;
  if v_area is null or v_street is null then
    raise exception using errcode = 'P0001', message = 'Please enter your area and street.';
  end if;
  if length(coalesce(v_area, '')) > 100 or length(coalesce(v_street, '')) > 200
     or length(coalesce(v_building, '')) > 100 or length(coalesce(v_floor, '')) > 50
     or length(coalesce(v_addr_notes, '')) > 200 then
    raise exception using errcode = 'P0001', message = 'Some address details are too long.';
  end if;
  if length(coalesce(v_instr, '')) > 500 or length(coalesce(v_gift_note, '')) > 200 then
    raise exception using errcode = 'P0001', message = 'Your notes are too long.';
  end if;

  q := public.quote_cart(payload -> 'items', v_code);

  if jsonb_array_length(q -> 'lines') = 0 and jsonb_array_length(q -> 'errors') = 0 then
    raise exception using errcode = 'P0001', message = 'Your cart is empty.';
  end if;

  select string_agg(e ->> 'message', ' ') into msg from jsonb_array_elements(q -> 'errors') e;
  if msg is not null then
    raise exception using errcode = 'P0001', message = msg;
  end if;

  -- The customer confirmed the total on screen. If a price or discount moved since, say so
  -- rather than take an order at a total they never saw (spec section 11).
  if (payload ->> 'expected_total') ~ '^[0-9]{1,8}([.][0-9]+)?$'
     and round((payload ->> 'expected_total')::numeric, 2) <> (q ->> 'total')::numeric then
    raise exception using errcode = 'P0001',
      message = 'Your total has changed to $' || to_char((q ->> 'total')::numeric, 'FM9999990.00')
                || '. Please check your order and place it again.';
  end if;

  -- Guest and registered customers share one row per email. A guest checkout
  -- fills in missing details but never overwrites what the customer already has.
  insert into public.customers (email, phone, full_name, accepts_marketing)
  values (v_email, v_phone, v_name, v_marketing)
  on conflict ((lower(email))) do update
     set phone = coalesce(public.customers.phone, excluded.phone),
         full_name = coalesce(public.customers.full_name, excluded.full_name),
         accepts_marketing = public.customers.accepts_marketing or excluded.accepts_marketing
  returning id into cust_id;

  if q -> 'code_discount' is not null and jsonb_typeof(q -> 'code_discount') = 'object' then
    select dd.* into d from public.discounts dd where upper(dd.code) = upper(v_code);
    if d.once_per_customer and exists (
         select 1 from public.orders o
          where o.customer_id = cust_id and upper(o.discount_code) = upper(v_code) and o.status <> 'cancelled') then
      raise exception using errcode = 'P0001', message = 'You have already used this code.';
    end if;
  end if;

  insert into public.orders (
    customer_id, email, phone, subtotal, discount_total, shipping_total, total, discount_code,
    shipping_address, special_instructions, gift_note, is_gift, source, idempotency_key)
  values (
    cust_id, v_email, v_phone,
    (q ->> 'subtotal')::numeric, (q ->> 'discount_total')::numeric,
    (q ->> 'shipping_total')::numeric, (q ->> 'total')::numeric,
    q #>> '{code_discount,code}',
    jsonb_build_object('full_name', v_name, 'phone', v_phone, 'governorate', v_gov, 'area', v_area,
                       'street', v_street, 'building', v_building, 'floor', v_floor, 'notes', v_addr_notes),
    v_instr, v_gift_note, v_is_gift or v_gift_note is not null, 'web', key)
  on conflict (idempotency_key) do nothing
  returning id, number, access_token into ord;

  -- A concurrent request with the same key won the race: answer with its order.
  if ord.id is null then
    select o.number, o.access_token into existing from public.orders o where o.idempotency_key = key;
    return jsonb_build_object('number', existing.number, 'access_token', existing.access_token);
  end if;

  -- Items keep cart order (clock_timestamp); box cups become child lines, one per flavour.
  for line in select * from jsonb_array_elements(q -> 'lines') loop
    insert into public.order_items (order_id, product_id, name, flavour, image, unit_price, quantity, line_total, created_at)
    values (ord.id, (line ->> 'product_id')::uuid, line ->> 'name', line ->> 'flavour', line ->> 'image',
            (line ->> 'unit_price')::numeric, (line ->> 'quantity')::int, (line ->> 'line_total')::numeric,
            clock_timestamp())
    returning id into parent_id;

    insert into public.order_items (order_id, product_id, parent_item_id, name, flavour, image, unit_price, quantity, line_total, created_at)
    select ord.id, (c ->> 'product_id')::uuid, parent_id, c ->> 'name', c ->> 'flavour', c ->> 'image',
           (c ->> 'unit_price')::numeric,
           count(*)::int * (line ->> 'quantity')::int,
           round((c ->> 'unit_price')::numeric * count(*) * (line ->> 'quantity')::int, 2),
           clock_timestamp()
      from jsonb_array_elements(line -> 'children') c
     group by c ->> 'product_id', c ->> 'name', c ->> 'flavour', c ->> 'image', c ->> 'unit_price';
  end loop;

  -- Take stock under row locks; the conditional update is the real check, so
  -- two simultaneous orders cannot both take the last cup.
  for need in
    select x.product_id, sum(x.qty)::int as qty
      from (
        select (l ->> 'product_id')::uuid as product_id, (l ->> 'quantity')::int as qty
          from jsonb_array_elements(q -> 'lines') l
        union all
        select (c ->> 'product_id')::uuid, (l ->> 'quantity')::int
          from jsonb_array_elements(q -> 'lines') l, jsonb_array_elements(l -> 'children') c
      ) x
     group by x.product_id
     -- Lock products in one fixed order so two orders for the same cups never deadlock.
     order by x.product_id
  loop
    update public.products pr
       set stock = pr.stock - need.qty
     where pr.id = need.product_id
       and pr.track_inventory
       and (pr.allow_backorder or pr.stock >= need.qty);

    if found then
      insert into public.inventory_movements (product_id, delta, reason, order_id)
      values (need.product_id, -need.qty, 'order', ord.id);
    elsif exists (select 1 from public.products pr
                   where pr.id = need.product_id and pr.track_inventory and not pr.allow_backorder) then
      select pr.name || coalesce(' ' || pr.flavour, '') into msg from public.products pr where pr.id = need.product_id;
      raise exception using errcode = 'P0001', message = msg || ' just sold out. Please update your cart.';
    end if;
  end loop;

  if ord.id is not null and q #>> '{code_discount,code}' is not null then
    update public.discounts dd
       set usage_count = dd.usage_count + 1
     where upper(dd.code) = upper(v_code)
       and (dd.usage_limit is null or dd.usage_count < dd.usage_limit);
    if not found then
      raise exception using errcode = 'P0001', message = 'That code has just reached its limit.';
    end if;
  end if;

  insert into public.order_events (order_id, type, message, data)
  values (ord.id, 'created', 'Order placed on the website',
          jsonb_build_object('total', q -> 'total', 'payment_method', 'cod'));

  return jsonb_build_object('number', ord.number, 'access_token', ord.access_token);
end;
$fn$;
