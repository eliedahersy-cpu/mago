-- 0010_engagement.sql — Reviews written by customers, and Subscribe & Save.
--
-- submit_review          signed-in customer; one per product; pending; "verified buyer" decided here.
-- quote_subscription     prices a subscription box (plan discount replaces Mix & Match, spec §6 rule 6).
-- create_subscription    signed-in customer with a verified email.
-- update_subscription    owner or staff: pause, resume, skip, cancel, change cups / plan / address.
-- process_due_subscriptions  staff or the daily pg_cron job: one COD order per due subscription.

-- ---------------------------------------------------------------------------------------- reviews

create unique index if not exists reviews_one_per_customer
  on public.reviews (product_id, customer_id) where customer_id is not null;

create or replace function public.submit_review(p_product uuid, p_rating int, p_title text, p_body text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  cid      uuid;
  v_title  text := nullif(btrim(coalesce(p_title, '')), '');
  v_body   text := btrim(coalesce(p_body, ''));
  v_name   text;
  words    text[];
  verified boolean;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Sign in to write a review.';
  end if;
  cid := public.claim_customer();
  if cid is null then
    raise exception using errcode = 'P0001', message = 'Confirm your email address before writing a review.';
  end if;
  if p_rating is null or p_rating not between 1 and 5 then
    raise exception using errcode = 'P0001', message = 'Choose a rating from 1 to 5 stars.';
  end if;
  if char_length(v_body) < 10 or char_length(v_body) > 1000 then
    raise exception using errcode = 'P0001', message = 'Write between 10 and 1,000 characters.';
  end if;
  if v_title is not null and char_length(v_title) > 80 then
    raise exception using errcode = 'P0001', message = 'Keep the title under 80 characters.';
  end if;
  if not exists (select 1 from public.products p where p.id = p_product and p.status = 'active') then
    raise exception using errcode = 'P0001', message = 'This product is not available.';
  end if;
  if exists (select 1 from public.reviews r where r.product_id = p_product and r.customer_id = cid) then
    raise exception using errcode = 'P0001', message = 'You have already reviewed this product.';
  end if;

  -- Shown publicly as "First L." so a full name is never published.
  select coalesce(nullif(btrim(c.full_name), ''), split_part(c.email, '@', 1)) into v_name
    from public.customers c where c.id = cid;
  words := regexp_split_to_array(btrim(v_name), '\s+');
  if array_length(words, 1) > 1 then
    v_name := words[1] || ' ' || upper(left(words[array_length(words, 1)], 1)) || '.';
  else
    v_name := words[1];
  end if;

  -- Bought it: any order of theirs (not cancelled) with this product, loose or inside a Mix Box.
  verified := exists (
    select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
     where o.customer_id = cid and o.status <> 'cancelled' and oi.product_id = p_product);

  insert into public.reviews (product_id, customer_id, author_name, rating, title, body, status, is_verified_buyer)
  values (p_product, cid, left(v_name, 60), p_rating, v_title, v_body, 'pending', verified);
end;
$fn$;

revoke all on function public.submit_review(uuid, int, text, text) from public;
grant execute on function public.submit_review(uuid, int, text, text) to authenticated;

-- ---------------------------------------------------------------------------------- subscriptions

alter table public.subscriptions add column if not exists last_run_at timestamptz;
alter table public.subscriptions add column if not exists last_run_note text;

-- Internal: prices a box ({cups:[{product_id,quantity}], extras:[…]}) on a plan.
-- Returns lines with names, images and prices, the totals and any problems (errors[]).
create or replace function public.subscription_priced(p_plan uuid, p_items jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  uuid_re   constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  pl        record;
  st        record;
  box_size  int;
  it        jsonb;
  pr        record;
  kind      text;
  qty       int;
  cups      jsonb := '[]';
  extras    jsonb := '[]';
  errors    jsonb := '[]';
  n_cups    int := 0;
  cups_sub  numeric := 0;
  extra_sub numeric := 0;
  disc      numeric := 0;
  pct       numeric := 0;
  ship      numeric;
  sub       numeric;
  img       text;
begin
  select * into pl from public.subscription_plans p where p.id = p_plan and p.is_active;
  if found then
    pct := pl.discount_percent;
  else
    errors := errors || jsonb_build_object('code', 'plan', 'message', 'Choose a delivery plan.');
  end if;
  select coalesce((select p.bundle_size from public.products p where p.slug = 'mago-mix-box'), 5) into box_size;
  select * into st from public.settings where id;

  foreach kind in array array['cups', 'extras'] loop
    for it in select * from jsonb_array_elements(case when jsonb_typeof(p_items -> kind) = 'array' then p_items -> kind else '[]' end) loop
      if coalesce(it ->> 'product_id', '') !~ uuid_re or coalesce(it ->> 'quantity', '') !~ '^[0-9]{1,2}$' then
        errors := errors || jsonb_build_object('code', 'item', 'message', 'Something in the box could not be read.');
        continue;
      end if;
      qty := (it ->> 'quantity')::int;
      continue when qty = 0;
      select p.id, p.name, p.flavour, p.price, p.type, p.status into pr
        from public.products p where p.id = (it ->> 'product_id')::uuid;
      if not found then
        errors := errors || jsonb_build_object('code', 'unavailable', 'message', 'A product in the box is no longer available.');
        continue;
      end if;
      if pr.status <> 'active' or pr.type <> (case kind when 'cups' then 'cup' else 'extra' end) then
        errors := errors || jsonb_build_object('code', 'unavailable', 'message',
          pr.name || coalesce(' ' || pr.flavour, '') || ' is no longer available.');
        continue;
      end if;
      select i.url into img from public.product_images i
       where i.product_id = pr.id order by (i.kind = 'packshot') desc, i.position limit 1;
      if kind = 'cups' then
        n_cups := n_cups + qty;
        cups_sub := cups_sub + round(pr.price * qty, 2);
        disc := disc + round(pr.price * qty * pct / 100, 2);
        cups := cups || jsonb_build_object('product_id', pr.id, 'name', pr.name, 'flavour', pr.flavour, 'image', img,
                                           'unit_price', pr.price, 'quantity', qty, 'line_total', round(pr.price * qty, 2));
      else
        extra_sub := extra_sub + round(pr.price * qty, 2);
        extras := extras || jsonb_build_object('product_id', pr.id, 'name', pr.name, 'flavour', pr.flavour, 'image', img,
                                               'unit_price', pr.price, 'quantity', qty, 'line_total', round(pr.price * qty, 2));
      end if;
    end loop;
  end loop;

  if n_cups <> box_size then
    errors := errors || jsonb_build_object('code', 'cups', 'message', format('Choose exactly %s cups (you have %s).', box_size, n_cups));
  end if;

  sub := cups_sub + extra_sub;
  ship := case when sub - disc >= st.free_shipping_threshold then 0 else st.shipping_flat_fee end;
  return jsonb_build_object(
    'box_size', box_size,
    'cup_count', n_cups,
    'cups', cups,
    'extras', extras,
    'cups_subtotal', cups_sub,
    'extras_subtotal', extra_sub,
    'subtotal', sub,
    'discount_percent', pct,
    'discount', disc,
    'shipping', ship,
    'total', sub - disc + ship,
    'errors', errors);
end;
$fn$;

revoke all on function public.subscription_priced(uuid, jsonb) from public;

-- Public: what the subscribe page shows. Only prices, nothing personal.
create or replace function public.quote_subscription(p_plan uuid, p_items jsonb)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select public.subscription_priced(p_plan, p_items);
$$;

revoke all on function public.quote_subscription(uuid, jsonb) from public;
grant execute on function public.quote_subscription(uuid, jsonb) to anon, authenticated;

-- Internal: a delivery address, checked like checkout does.
create or replace function public.subscription_address(p_address jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  st     record;
  v_name text := nullif(btrim(p_address ->> 'full_name'), '');
  v_phone text := nullif(btrim(p_address ->> 'phone'), '');
  v_gov  text := nullif(btrim(p_address ->> 'governorate'), '');
  v_area text := nullif(btrim(p_address ->> 'area'), '');
  v_street text := nullif(btrim(p_address ->> 'street'), '');
begin
  select * into st from public.settings where id;
  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception using errcode = 'P0001', message = 'Please enter the full name for delivery.';
  end if;
  if v_phone is null or v_phone !~ '^[+0-9][0-9 -]{5,19}$' then
    raise exception using errcode = 'P0001', message = 'Please enter a valid phone number.';
  end if;
  if v_gov is null or (jsonb_array_length(st.delivery_areas) > 0 and not (st.delivery_areas ? v_gov)) then
    raise exception using errcode = 'P0001', message = 'Please choose a governorate we deliver to.';
  end if;
  if v_area is null or v_street is null then
    raise exception using errcode = 'P0001', message = 'Please enter the area and street.';
  end if;
  return jsonb_build_object(
    'full_name', v_name, 'phone', v_phone, 'governorate', v_gov, 'area', left(v_area, 100), 'street', left(v_street, 200),
    'building', left(coalesce(btrim(p_address ->> 'building'), ''), 100),
    'floor', left(coalesce(btrim(p_address ->> 'floor'), ''), 50),
    'notes', left(coalesce(btrim(p_address ->> 'notes'), ''), 200));
end;
$fn$;

revoke all on function public.subscription_address(jsonb) from public;

-- Internal: keep only ids and quantities of a priced box.
create or replace function public.subscription_items(q jsonb)
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select jsonb_build_object(
    'cups', coalesce((select jsonb_agg(jsonb_build_object('product_id', c ->> 'product_id', 'quantity', (c ->> 'quantity')::int))
                        from jsonb_array_elements(q -> 'cups') c), '[]'),
    'extras', coalesce((select jsonb_agg(jsonb_build_object('product_id', e ->> 'product_id', 'quantity', (e ->> 'quantity')::int))
                          from jsonb_array_elements(q -> 'extras') e), '[]'));
$$;

revoke all on function public.subscription_items(jsonb) from public;

create or replace function public.create_subscription(payload jsonb)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  cid     uuid;
  q       jsonb;
  addr    jsonb;
  today   date := (now() at time zone 'Asia/Beirut')::date;
  start   date;
  v_gift  boolean := coalesce((payload ->> 'is_gift')::boolean, false);
  v_note  text := nullif(btrim(coalesce(payload ->> 'gift_note', '')), '');
  sid     uuid;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'Sign in to subscribe.';
  end if;
  cid := public.claim_customer();
  if cid is null then
    raise exception using errcode = 'P0001', message = 'Confirm your email address before subscribing.';
  end if;
  if (select count(*) from public.subscriptions s where s.customer_id = cid and s.status <> 'cancelled') >= 5 then
    raise exception using errcode = 'P0001', message = 'You already have 5 subscriptions. Manage them from your account.';
  end if;

  if coalesce(payload ->> 'plan_id', '') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' then
    raise exception using errcode = 'P0001', message = 'Choose a delivery plan.';
  end if;
  q := public.subscription_priced((payload ->> 'plan_id')::uuid, payload -> 'items');
  if jsonb_array_length(q -> 'errors') > 0 then
    raise exception using errcode = 'P0001', message = q -> 'errors' -> 0 ->> 'message';
  end if;
  addr := public.subscription_address(coalesce(payload -> 'address', '{}'));

  if coalesce(payload ->> 'start_date', '') ~ '^\d{4}-\d{2}-\d{2}$' then
    start := (payload ->> 'start_date')::date;
  else
    start := today + 2;
  end if;
  if start < today + 1 or start > today + 60 then
    raise exception using errcode = 'P0001', message = 'Choose a first delivery date within the next 60 days.';
  end if;
  if v_note is not null and char_length(v_note) > 200 then
    raise exception using errcode = 'P0001', message = 'Keep the gift note under 200 characters.';
  end if;

  insert into public.subscriptions (customer_id, plan_id, status, items, address, next_delivery_date, is_gift, gift_note)
  values (cid, (payload ->> 'plan_id')::uuid, 'active', public.subscription_items(q), addr, start, v_gift,
          case when v_gift then v_note end)
  returning id into sid;
  return sid;
end;
$fn$;

revoke all on function public.create_subscription(jsonb) from public;
grant execute on function public.create_subscription(jsonb) to authenticated;

create or replace function public.update_subscription(p_id uuid, p_action text, p_payload jsonb default '{}')
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  sub    record;
  q      jsonb;
  today  date := (now() at time zone 'Asia/Beirut')::date;
begin
  select s.*, c.profile_id, p.interval_weeks into sub
    from public.subscriptions s
    join public.customers c on c.id = s.customer_id
    join public.subscription_plans p on p.id = s.plan_id
   where s.id = p_id
   for update of s;
  if not found or not (public.is_staff() or (auth.uid() is not null and sub.profile_id = auth.uid())) then
    raise exception using errcode = '42501', message = 'Subscription not found.';
  end if;
  if sub.status = 'cancelled' then
    raise exception using errcode = 'P0001', message = 'This subscription is cancelled.';
  end if;

  case p_action
    when 'pause' then
      update public.subscriptions set status = 'paused' where id = p_id;
    when 'resume' then
      update public.subscriptions
         set status = 'active', next_delivery_date = greatest(next_delivery_date, today + 2)
       where id = p_id;
    when 'skip' then
      update public.subscriptions set next_delivery_date = next_delivery_date + sub.interval_weeks * 7 where id = p_id;
    when 'cancel' then
      update public.subscriptions set status = 'cancelled' where id = p_id;
    when 'update_items' then
      q := public.subscription_priced(sub.plan_id, p_payload -> 'items');
      if jsonb_array_length(q -> 'errors') > 0 then
        raise exception using errcode = 'P0001', message = q -> 'errors' -> 0 ->> 'message';
      end if;
      update public.subscriptions set items = public.subscription_items(q) where id = p_id;
    when 'change_plan' then
      if coalesce(p_payload ->> 'plan_id', '') !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
         or not exists (select 1 from public.subscription_plans p where p.id = (p_payload ->> 'plan_id')::uuid and p.is_active) then
        raise exception using errcode = 'P0001', message = 'Choose a delivery plan.';
      end if;
      update public.subscriptions set plan_id = (p_payload ->> 'plan_id')::uuid where id = p_id;
    when 'update_address' then
      update public.subscriptions set address = public.subscription_address(coalesce(p_payload -> 'address', '{}')) where id = p_id;
    else
      raise exception using errcode = 'P0001', message = 'Unknown action.';
  end case;

  return (select jsonb_build_object('status', s.status, 'next_delivery_date', s.next_delivery_date)
            from public.subscriptions s where s.id = p_id);
end;
$fn$;

revoke all on function public.update_subscription(uuid, text, jsonb) from public;
grant execute on function public.update_subscription(uuid, text, jsonb) to authenticated;

-- One order per due subscription. Safe to run more than once a day: each subscription's next date
-- moves past the 2-day window in the same transaction, and rows being handled elsewhere are skipped.
create or replace function public.process_due_subscriptions()
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  today    date := (now() at time zone 'Asia/Beirut')::date;
  sub      record;
  q        jsonb;
  bundle_id    uuid;
  bundle_name  text;
  bundle_image text;
  ord      record;
  prod     record;
  parent   uuid;
  line     jsonb;
  need     record;
  taken    int;
  short    text[];
  next_on  date;
  made     int := 0;
begin
  -- Staff from the admin, or the pg_cron job (no signed-in user, running as postgres).
  if auth.uid() is not null then
    if not public.is_staff() then
      raise exception using errcode = '42501', message = 'Only staff can run subscriptions.';
    end if;
  elsif session_user not in ('postgres', 'supabase_admin') then
    raise exception using errcode = '42501', message = 'Only staff can run subscriptions.';
  end if;

  select p.id, p.name, (select i.url from public.product_images i where i.product_id = p.id order by i.position limit 1)
    into bundle_id, bundle_name, bundle_image from public.products p where p.slug = 'mago-mix-box';

  for sub in
    select s.*, p.interval_weeks, p.name as plan_name, c.email
      from public.subscriptions s
      join public.subscription_plans p on p.id = s.plan_id
      join public.customers c on c.id = s.customer_id
     where s.status = 'active' and s.next_delivery_date <= today + 2
     order by s.next_delivery_date, s.id
     for update of s skip locked
  loop
    q := public.subscription_priced(sub.plan_id, sub.items);
    -- A plan or product that went away: leave the date, say why, try again tomorrow.
    if jsonb_array_length(q -> 'errors') > 0 then
      update public.subscriptions
         set last_run_at = now(), last_run_note = q -> 'errors' -> 0 ->> 'message'
       where id = sub.id;
      continue;
    end if;

    insert into public.orders (customer_id, email, phone, status, subtotal, discount_total, shipping_total, total,
                               shipping_address, gift_note, is_gift, source, subscription_id)
    values (sub.customer_id, sub.email, coalesce(sub.address ->> 'phone', ''), 'pending',
            (q ->> 'subtotal')::numeric, (q ->> 'discount')::numeric, (q ->> 'shipping')::numeric, (q ->> 'total')::numeric,
            sub.address, sub.gift_note, sub.is_gift, 'subscription', sub.id)
    returning id, number into ord;

    parent := null;
    if bundle_id is not null then
      insert into public.order_items (order_id, product_id, name, image, unit_price, quantity, line_total, created_at)
      values (ord.id, bundle_id, bundle_name, bundle_image, (q ->> 'cups_subtotal')::numeric, 1, (q ->> 'cups_subtotal')::numeric, clock_timestamp())
      returning id into parent;
    end if;
    for line in select * from jsonb_array_elements(q -> 'cups') loop
      insert into public.order_items (order_id, product_id, parent_item_id, name, flavour, image, unit_price, quantity, line_total, created_at)
      values (ord.id, (line ->> 'product_id')::uuid, parent, line ->> 'name', line ->> 'flavour', line ->> 'image',
              (line ->> 'unit_price')::numeric, (line ->> 'quantity')::int, (line ->> 'line_total')::numeric, clock_timestamp());
    end loop;
    for line in select * from jsonb_array_elements(q -> 'extras') loop
      insert into public.order_items (order_id, product_id, name, flavour, image, unit_price, quantity, line_total, created_at)
      values (ord.id, (line ->> 'product_id')::uuid, line ->> 'name', line ->> 'flavour', line ->> 'image',
              (line ->> 'unit_price')::numeric, (line ->> 'quantity')::int, (line ->> 'line_total')::numeric, clock_timestamp());
    end loop;

    -- Stock: never below zero unless the product allows backorders; shortfalls are noted on the order.
    short := '{}';
    for need in
      select (l ->> 'product_id')::uuid as product_id, sum((l ->> 'quantity')::int)::int as qty
        from jsonb_array_elements((q -> 'cups') || (q -> 'extras')) l
       group by 1 order by 1
    loop
      select p.track_inventory, p.allow_backorder, p.stock, p.name || coalesce(' ' || p.flavour, '') as label
        into prod from public.products p where p.id = need.product_id for update;
      continue when not found or not prod.track_inventory;
      taken := case when prod.allow_backorder then need.qty else least(need.qty, greatest(prod.stock, 0)) end;
      if taken > 0 then
        update public.products set stock = stock - taken where id = need.product_id;
        insert into public.inventory_movements (product_id, delta, reason, order_id)
        values (need.product_id, -taken, 'subscription', ord.id);
      end if;
      if taken < need.qty then
        short := short || (prod.label || ' (short by ' || (need.qty - taken) || ')');
      end if;
    end loop;

    insert into public.order_events (order_id, type, message, data)
    values (ord.id, 'created', 'Subscription order (' || sub.plan_name || ')',
            jsonb_build_object('subscription_id', sub.id, 'delivery_date', sub.next_delivery_date, 'total', q -> 'total'));
    if array_length(short, 1) > 0 then
      insert into public.order_events (order_id, type, message)
      values (ord.id, 'note', 'Not enough stock for: ' || array_to_string(short, ', ') || '. Restock or call the customer.');
    end if;

    next_on := sub.next_delivery_date;
    while next_on <= today + 2 loop
      next_on := next_on + sub.interval_weeks * 7;
    end loop;
    update public.subscriptions
       set last_order_id = ord.id, next_delivery_date = next_on, last_run_at = now(),
           last_run_note = case when array_length(short, 1) > 0 then 'Order #' || ord.number || ' was short of stock.' end
     where id = sub.id;
    made := made + 1;
  end loop;
  return made;
end;
$fn$;

revoke all on function public.process_due_subscriptions() from public;
grant execute on function public.process_due_subscriptions() to authenticated;

-- Daily at 03:00 UTC (06:00 in Beirut in summer, 05:00 in winter).
do $do$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron with schema pg_catalog;
    if exists (select 1 from cron.job where jobname = 'mago-process-due-subscriptions') then
      perform cron.unschedule('mago-process-due-subscriptions');
    end if;
    perform cron.schedule('mago-process-due-subscriptions', '0 3 * * *', 'select public.process_due_subscriptions()');
  end if;
end
$do$;
