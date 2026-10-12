-- Commerce: cart pricing and order placement.
--
-- quote_cart is the single source of truth for money (spec section 6).
-- place_order calls it rather than repeating the arithmetic, so a browser can
-- never talk the server into a price the cart page did not also show.
--
-- Shape of `items`:
--   [{ "product_id": uuid, "quantity": int, "children": [uuid, ...] }]
-- `children` are the cups inside a bundle line; the bundle product itself is
-- priced at 0 and its children carry the money.

create or replace function public.quote_cart(items jsonb, code text default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  s                record;
  item             jsonb;
  child_id         uuid;
  p                record;
  cup              record;
  children         jsonb;
  lines            jsonb := '[]'::jsonb;
  errors           jsonb := '[]'::jsonb;
  qty              int;
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
    qty := greatest(1, least(99, coalesce((item ->> 'quantity')::int, 1)));

    select pr.id, pr.slug, pr.name, pr.flavour, pr.type, pr.price, pr.status,
           pr.stock, pr.track_inventory, pr.allow_backorder, pr.bundle_size,
           (select pi.url from public.product_images pi
             where pi.product_id = pr.id order by pi.position limit 1) as image
      into p
      from public.products pr
     where pr.id = (item ->> 'product_id')::uuid;

    if p.id is null or p.status <> 'active' then
      errors := errors || jsonb_build_object(
        'code', 'unavailable',
        'product_id', item ->> 'product_id',
        'message', coalesce(p.name, 'An item') || ' is no longer available.');
      continue;
    end if;

    children := '[]'::jsonb;
    unit := p.price;

    if p.type = 'bundle' then
      -- A box is worth the cups inside it; the bundle row is priced 0.
      child_unit := 0;

      for child_id in
        select (value #>> '{}')::uuid
          from jsonb_array_elements(coalesce(item -> 'children', '[]'::jsonb))
      loop
        select pr.id, pr.name, pr.flavour, pr.price, pr.status, pr.type,
               (select pi.url from public.product_images pi
                 where pi.product_id = pr.id order by pi.position limit 1) as image
          into cup
          from public.products pr
         where pr.id = child_id;

        if cup.id is null or cup.status <> 'active' then
          errors := errors || jsonb_build_object(
            'code', 'unavailable',
            'product_id', child_id,
            'message', 'A cup in your box is no longer available.');
          continue;
        end if;

        child_unit := child_unit + cup.price;
        children := children || jsonb_build_object(
          'product_id', cup.id, 'name', cup.name, 'flavour', cup.flavour,
          'image', cup.image, 'unit_price', cup.price);

        if cup.type = 'cup' then
          cup_quantity := cup_quantity + qty;
          cup_subtotal := cup_subtotal + round(cup.price * qty, 2);
        end if;
      end loop;

      if p.bundle_size is not null
         and jsonb_array_length(children) <> p.bundle_size then
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

    if p.track_inventory and not p.allow_backorder and p.stock < qty then
      errors := errors || jsonb_build_object(
        'code', 'out_of_stock',
        'product_id', p.id,
        'available', p.stock,
        'message', p.name || ' only has ' || p.stock || ' left.');
    end if;

    lines := lines || jsonb_build_object(
      'product_id', p.id, 'slug', p.slug, 'name', p.name, 'flavour', p.flavour,
      'type', p.type, 'image', p.image, 'unit_price', unit, 'quantity', qty,
      'line_total', round(unit * qty, 2), 'children', children);

    subtotal := subtotal + round(unit * qty, 2);
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
        'message', 'This code needs a subtotal of at least '
                   || d.min_subtotal || '.');
    elsif d.min_cup_quantity is not null
          and cup_quantity < d.min_cup_quantity then
      errors := errors || jsonb_build_object(
        'code', 'discount_min_cups',
        'message', 'This code needs at least ' || d.min_cup_quantity
                   || ' cups.');
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
