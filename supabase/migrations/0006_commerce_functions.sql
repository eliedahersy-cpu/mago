-- Commerce: cart pricing, order placement and the guest confirmation page.
--
-- quote_cart is the single source of truth for money (spec section 6).
-- place_order calls it rather than repeating the arithmetic, so a browser can
-- never talk the server into a price the cart page did not also show.
--
-- Shape of `items` (prices are never read from it):
--   [{ "product_id": uuid, "quantity": int, "children": [uuid, ...] }]
-- `children` are the cups inside a bundle line, one entry per cup (repeat an id
-- for two of the same cup); the bundle product itself is priced at 0 and its
-- children carry the money.

create or replace function public.quote_cart(items jsonb, code text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  uuid_re          constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  s                record;
  item             jsonb;
  child_raw        text;
  p                record;
  cup              record;
  need             record;
  children         jsonb;
  lines            jsonb := '[]'::jsonb;
  errors           jsonb := '[]'::jsonb;
  -- product id -> units wanted across the whole cart (loose and boxed together)
  needs            jsonb := '{}'::jsonb;
  qty              int;
  child_count      int;
  unit             numeric(10,2);
  child_unit       numeric(10,2);
  cup_quantity     int := 0;
  cup_subtotal     numeric(10,2) := 0;
  subtotal         numeric(10,2) := 0;
  auto             record;
  auto_amount      numeric(10,2) := 0;
  auto_title       text;
  code_amount      numeric(10,2) := 0;
  code_title       text;
  code_free_ship   boolean := false;
  d                record;
  discount_total   numeric(10,2) := 0;
  shipping         numeric(10,2) := 0;
  after_discounts  numeric(10,2) := 0;
begin
  select shipping_flat_fee, free_shipping_threshold, currency
    into s from public.settings where id;

  if items is null or jsonb_typeof(items) <> 'array' then
    items := '[]'::jsonb;
  end if;

  for item in select * from jsonb_array_elements(items) loop
    if jsonb_typeof(item) <> 'object' then
      continue;
    end if;

    -- Quantities outside 1..99 are clamped; anything that is not a number counts as 1.
    qty := case when (item ->> 'quantity') ~ '^[0-9]{1,6}$'
                then least(99, greatest(1, (item ->> 'quantity')::int)) else 1 end;

    select pr.id, pr.slug, pr.name, pr.flavour, pr.type, pr.price, pr.status, pr.bundle_size,
           (select pi.url from public.product_images pi
             where pi.product_id = pr.id order by pi.position limit 1) as image
      into p
      from public.products pr
     where pr.id = case when (item ->> 'product_id') ~ uuid_re then (item ->> 'product_id')::uuid end;

    if p.id is null or p.status <> 'active' then
      errors := errors || jsonb_build_object(
        'code', 'unavailable',
        'product_id', item ->> 'product_id',
        'message', coalesce(p.name, 'An item') || ' is no longer available.');
      continue;
    end if;

    children := '[]'::jsonb;
    unit := p.price;
    needs := jsonb_set(needs, array[p.id::text], to_jsonb(coalesce((needs ->> p.id::text)::int, 0) + qty));

    if p.type = 'bundle' then
      -- A box is worth the cups inside it; the bundle row is priced 0.
      child_unit := 0;
      child_count := 0;

      for child_raw in
        select value #>> '{}'
          from jsonb_array_elements(case when jsonb_typeof(item -> 'children') = 'array'
                                         then item -> 'children' else '[]'::jsonb end)
      loop
        child_count := child_count + 1;

        select pr.id, pr.name, pr.flavour, pr.price, pr.status, pr.type,
               (select pi.url from public.product_images pi
                 where pi.product_id = pr.id order by pi.position limit 1) as image
          into cup
          from public.products pr
         where pr.id = case when child_raw ~ uuid_re then child_raw::uuid end;

        if cup.id is null or cup.status <> 'active' then
          errors := errors || jsonb_build_object(
            'code', 'unavailable',
            'product_id', child_raw,
            'message', coalesce(cup.name || coalesce(' ' || cup.flavour, ''), 'A cup in your box')
                       || ' is no longer available.');
          continue;
        end if;

        if cup.type <> 'cup' then
          errors := errors || jsonb_build_object(
            'code', 'bundle_contents',
            'product_id', cup.id,
            'message', 'Only cups can go in ' || p.name || '.');
          continue;
        end if;

        child_unit := child_unit + cup.price;
        children := children || jsonb_build_object(
          'product_id', cup.id, 'name', cup.name, 'flavour', cup.flavour,
          'image', cup.image, 'unit_price', cup.price);
        needs := jsonb_set(needs, array[cup.id::text], to_jsonb(coalesce((needs ->> cup.id::text)::int, 0) + qty));
        cup_quantity := cup_quantity + qty;
        cup_subtotal := cup_subtotal + round(cup.price * qty, 2);
      end loop;

      if p.bundle_size is not null and child_count <> p.bundle_size then
        errors := errors || jsonb_build_object(
          'code', 'bundle_size',
          'product_id', p.id,
          'message', p.name || ' needs exactly ' || p.bundle_size || ' cups.');
      end if;

      unit := child_unit;

    elsif p.type = 'cup' then
      cup_quantity := cup_quantity + qty;
      cup_subtotal := cup_subtotal + round(p.price * qty, 2);
    end if;

    lines := lines || jsonb_build_object(
      'product_id', p.id, 'slug', p.slug, 'name', p.name, 'flavour', p.flavour,
      'type', p.type, 'image', p.image, 'unit_price', unit, 'quantity', qty,
      'line_total', round(unit * qty, 2), 'children', children);

    subtotal := subtotal + round(unit * qty, 2);
  end loop;

  -- Stock is checked per product across the whole cart, so a cup that is both
  -- loose and inside a box cannot oversell.
  for need in
    select pr.id, pr.name, pr.flavour, pr.stock
      from jsonb_each_text(needs) n
      join public.products pr on pr.id = n.key::uuid
     where pr.track_inventory and not pr.allow_backorder and pr.stock < n.value::int
  loop
    errors := errors || jsonb_build_object(
      'code', 'out_of_stock',
      'product_id', need.id,
      'available', greatest(need.stock, 0),
      'message', case when need.stock <= 0
                      then need.name || coalesce(' ' || need.flavour, '') || ' is sold out.'
                      else 'Only ' || need.stock || ' of ' || need.name || coalesce(' ' || need.flavour, '')
                           || ' left.' end);
  end loop;

  -- Rule 3: five cups or more, anywhere in the cart, takes 10% off the cups.
  select title, value, min_cup_quantity into auto
    from public.get_active_automatic_discount();

  if auto.value is not null
     and cup_quantity >= coalesce(auto.min_cup_quantity, 5) then
    auto_amount := round(cup_subtotal * auto.value / 100.0, 2);
    auto_title := auto.title;
  end if;

  -- Rule 4: one code, applied after the automatic discount, never stacking.
  if code is not null and length(trim(code)) > 0 then
    select dd.* into d from public.discounts dd
     where upper(dd.code) = upper(trim(quote_cart.code))
       and dd.is_active
       and not dd.is_automatic
       and (dd.starts_at is null or dd.starts_at <= now())
       and (dd.ends_at is null or dd.ends_at > now())
       and (dd.usage_limit is null or dd.usage_count < dd.usage_limit);

    if d.id is null then
      errors := errors || jsonb_build_object(
        'code', 'discount_invalid', 'message', 'That code is not valid.');
    elsif d.min_subtotal is not null
          and subtotal - auto_amount < d.min_subtotal then
      errors := errors || jsonb_build_object(
        'code', 'discount_min_subtotal',
        'message', 'This code needs a subtotal of at least $' || d.min_subtotal || '.');
    elsif d.min_cup_quantity is not null
          and cup_quantity < d.min_cup_quantity then
      errors := errors || jsonb_build_object(
        'code', 'discount_min_cups',
        'message', 'This code needs at least ' || d.min_cup_quantity || ' cups.');
    else
      code_title := d.title;
      if d.kind = 'free_shipping' then
        code_free_ship := true;
      elsif d.kind = 'percentage' then
        code_amount := round(
          (case when d.applies_to = 'cups' then cup_subtotal - auto_amount
                else subtotal - auto_amount end) * d.value / 100.0, 2);
      else
        code_amount := least(d.value, subtotal - auto_amount);
      end if;
    end if;
  end if;

  discount_total := round(auto_amount + code_amount, 2);
  after_discounts := round(subtotal - discount_total, 2);

  -- Rule 5: flat fee, waived above the threshold or by a free-shipping code.
  if jsonb_array_length(lines) = 0 then
    shipping := 0;
  elsif code_free_ship or after_discounts >= s.free_shipping_threshold then
    shipping := 0;
  else
    shipping := s.shipping_flat_fee;
  end if;

  return jsonb_build_object(
    'currency', s.currency,
    'lines', lines,
    'cup_quantity', cup_quantity,
    'subtotal', subtotal,
    'automatic_discount',
      case when auto_amount > 0
        then jsonb_build_object('title', auto_title, 'amount', auto_amount) end,
    'code_discount',
      case
        when code_free_ship
          then jsonb_build_object('code', upper(trim(code)), 'title', code_title,
                                  'amount', 0, 'free_shipping', true)
        when code_title is not null and code_amount > 0
          then jsonb_build_object('code', upper(trim(code)), 'title', code_title,
                                  'amount', code_amount)
      end,
    'discount_total', discount_total,
    'shipping_total', shipping,
    'free_shipping_threshold', s.free_shipping_threshold,
    'total', round(after_discounts + shipping, 2),
    'errors', errors);
end;
$fn$;

revoke all on function public.quote_cart(jsonb, text) from public;
grant execute on function public.quote_cart(jsonb, text) to anon, authenticated;


-- place_order ---------------------------------------------------------------
-- payload: { idempotency_key, items, code, accepts_marketing,
--            contact: { full_name, email, phone },
--            address: { governorate, area, street, building, floor, notes },
--            special_instructions, is_gift, gift_note }
-- Customer-facing problems raise SQLSTATE P0001 with a message the checkout
-- page shows as is. Returns { number, access_token }.

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

revoke all on function public.place_order(jsonb) from public;
grant execute on function public.place_order(jsonb) to anon, authenticated;


-- get_order_by_token --------------------------------------------------------
-- The guest confirmation page: everything about one order, found only by its
-- unguessable access token. Returns null for an unknown token.

create or replace function public.get_order_by_token(token uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $fn$
  select jsonb_build_object(
    'number', o.number,
    'status', o.status,
    'created_at', o.created_at,
    'email', o.email,
    'phone', o.phone,
    'full_name', o.shipping_address ->> 'full_name',
    'shipping_address', o.shipping_address,
    'special_instructions', o.special_instructions,
    'is_gift', o.is_gift,
    'gift_note', o.gift_note,
    'subtotal', o.subtotal,
    'discount_total', o.discount_total,
    'shipping_total', o.shipping_total,
    'total', o.total,
    'discount_code', o.discount_code,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
               'name', i.name, 'flavour', i.flavour, 'image', i.image,
               'unit_price', i.unit_price, 'quantity', i.quantity, 'line_total', i.line_total,
               'children', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'name', c.name, 'flavour', c.flavour, 'image', c.image,
                          'unit_price', c.unit_price, 'quantity', c.quantity)
                        order by c.name, c.flavour)
                   from public.order_items c
                  where c.parent_item_id = i.id), '[]'::jsonb))
             order by i.created_at, i.name)
        from public.order_items i
       where i.order_id = o.id and i.parent_item_id is null), '[]'::jsonb))
  from public.orders o
  where o.access_token = token;
$fn$;

revoke all on function public.get_order_by_token(uuid) from public;
grant execute on function public.get_order_by_token(uuid) to anon, authenticated;
