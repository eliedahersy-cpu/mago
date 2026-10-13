-- Admin: operations that must be atomic or need auth.users. Staff already have full
-- table access through the *_staff_all policies; these functions add the rules.
-- All are security definer and refuse anyone who is not staff (42501).

create or replace function public.require_staff()
returns void
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
  if not public.is_staff() then
    raise exception using errcode = '42501', message = 'Only staff can do that.';
  end if;
end;
$fn$;

revoke all on function public.require_staff() from public;


-- Orders: pending -> confirmed -> preparing -> out_for_delivery -> delivered, forward only
-- (skipping is fine); cancelled from any state before delivered. Delivered and cancelled
-- are final. Cancelling puts back what the order took from stock.
create or replace function public.update_order_status(p_order uuid, p_status text, p_note text default null)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  flow   constant text[] := array['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered'];
  o      record;
  m      record;
  note   text := nullif(btrim(coalesce(p_note, '')), '');
begin
  perform public.require_staff();

  select id, status into o from public.orders where id = p_order for update;
  if o.id is null then
    raise exception using errcode = 'P0001', message = 'Order not found.';
  end if;
  if o.status in ('delivered', 'cancelled') then
    raise exception using errcode = 'P0001',
      message = 'This order is ' || replace(o.status, '_', ' ') || ' and can no longer change.';
  end if;

  if p_status = 'cancelled' then
    for m in
      select im.product_id, -sum(im.delta)::int as qty
        from public.inventory_movements im
       where im.order_id = o.id
       group by im.product_id
      having -sum(im.delta) > 0
    loop
      update public.products set stock = stock + m.qty where id = m.product_id;
      insert into public.inventory_movements (product_id, delta, reason, order_id, note, created_by)
      values (m.product_id, m.qty, 'cancel', o.id, 'Order cancelled', auth.uid());
    end loop;
    update public.orders set status = 'cancelled', cancelled_at = now() where id = o.id;
    insert into public.order_events (order_id, type, message, data, created_by)
    values (o.id, 'cancelled', coalesce(note, 'Order cancelled'), jsonb_build_object('from', o.status), auth.uid());
  else
    if array_position(flow, p_status) is null then
      raise exception using errcode = 'P0001', message = 'Unknown order status.';
    end if;
    if array_position(flow, p_status) <= array_position(flow, o.status) then
      raise exception using errcode = 'P0001',
        message = 'An order can only move forward (it is ' || replace(o.status, '_', ' ') || ').';
    end if;
    update public.orders
       set status = p_status,
           delivered_at = case when p_status = 'delivered' then now() else delivered_at end
     where id = o.id;
    insert into public.order_events (order_id, type, message, data, created_by)
    values (o.id, 'status_changed',
            'Status changed to ' || replace(p_status, '_', ' ') || coalesce(': ' || note, ''),
            jsonb_build_object('from', o.status, 'to', p_status), auth.uid());
  end if;

  return jsonb_build_object('status', (select status from public.orders where id = o.id));
end;
$fn$;


create or replace function public.set_order_payment(p_order uuid, p_status text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
begin
  perform public.require_staff();
  if p_status not in ('unpaid', 'paid', 'refunded') then
    raise exception using errcode = 'P0001', message = 'Unknown payment status.';
  end if;
  update public.orders set payment_status = p_status where id = p_order;
  if not found then
    raise exception using errcode = 'P0001', message = 'Order not found.';
  end if;
  insert into public.order_events (order_id, type, message, data, created_by)
  values (p_order, 'payment', 'Payment marked as ' || p_status, jsonb_build_object('payment_status', p_status), auth.uid());
end;
$fn$;


-- Stock changes made by staff, logged with who and why. Never below zero unless the
-- product allows backorders.
create or replace function public.adjust_stock(p_product uuid, p_delta int, p_reason text, p_note text default null)
returns int
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  new_stock int;
begin
  perform public.require_staff();
  if p_reason not in ('adjustment', 'restock') then
    raise exception using errcode = 'P0001', message = 'Choose a reason: adjustment or restock.';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception using errcode = 'P0001', message = 'Enter a quantity to add or remove.';
  end if;

  update public.products
     set stock = stock + p_delta
   where id = p_product
     and (allow_backorder or stock + p_delta >= 0)
  returning stock into new_stock;

  if new_stock is null then
    if not exists (select 1 from public.products where id = p_product) then
      raise exception using errcode = 'P0001', message = 'Product not found.';
    end if;
    raise exception using errcode = 'P0001', message = 'Stock cannot go below zero for this product.';
  end if;

  insert into public.inventory_movements (product_id, delta, reason, note, created_by)
  values (p_product, p_delta, p_reason, nullif(btrim(coalesce(p_note, '')), ''), auth.uid());
  return new_stock;
end;
$fn$;


-- Dashboard and analytics numbers for [p_from, p_to), with the previous period of the
-- same length for comparison. Cancelled orders do not count as sales. Days are Lebanon days.
create or replace function public.admin_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  prev_from timestamptz := p_from - (p_to - p_from);
  result jsonb;
begin
  perform public.require_staff();

  with
  cur as (
    select o.* from public.orders o
     where o.created_at >= p_from and o.created_at < p_to and o.status <> 'cancelled'
  ),
  prev as (
    select o.* from public.orders o
     where o.created_at >= prev_from and o.created_at < p_from and o.status <> 'cancelled'
  ),
  first_orders as (
    select o.customer_id, min(o.created_at) as first_at
      from public.orders o
     where o.status <> 'cancelled' and o.customer_id is not null
     group by o.customer_id
  ),
  lines as (
    -- Lines that were sold as such: loose items and the cups inside boxes, not box headers.
    select oi.* from public.order_items oi
      join cur on cur.id = oi.order_id
     where not exists (select 1 from public.order_items c where c.parent_item_id = oi.id)
  ),
  days as (
    select d::date as day
      from generate_series((p_from at time zone 'Asia/Beirut')::date,
                           ((p_to at time zone 'Asia/Beirut') - interval '1 second')::date,
                           interval '1 day') d
  )
  select jsonb_build_object(
    'sales', coalesce((select sum(total) from cur), 0),
    'orders', (select count(*) from cur),
    'aov', coalesce(round((select avg(total) from cur), 2), 0),
    'new_customers', (select count(*) from first_orders f where f.first_at >= p_from and f.first_at < p_to),
    'previous', jsonb_build_object(
      'sales', coalesce((select sum(total) from prev), 0),
      'orders', (select count(*) from prev),
      'aov', coalesce(round((select avg(total) from prev), 2), 0),
      'new_customers', (select count(*) from first_orders f where f.first_at >= prev_from and f.first_at < p_from)
    ),
    'daily', coalesce((
      select jsonb_agg(jsonb_build_object(
               'day', to_char(d.day, 'YYYY-MM-DD'),
               'sales', coalesce((select sum(c.total) from cur c where (c.created_at at time zone 'Asia/Beirut')::date = d.day), 0),
               'orders', (select count(*) from cur c where (c.created_at at time zone 'Asia/Beirut')::date = d.day))
             order by d.day)
        from days d), '[]'::jsonb),
    'top_products', coalesce((
      select jsonb_agg(t) from (
        select l.name, l.flavour, sum(l.quantity)::int as quantity, sum(l.line_total) as sales
          from lines l group by l.name, l.flavour
         order by sum(l.quantity) desc, sum(l.line_total) desc limit 5) t), '[]'::jsonb),
    'by_collection', coalesce((
      select jsonb_agg(t) from (
        select col.title, sum(l.quantity)::int as quantity, sum(l.line_total) as sales
          from lines l
          join public.collection_products cp on cp.product_id = l.product_id
          join public.collections col on col.id = cp.collection_id
         group by col.title order by sum(l.line_total) desc) t), '[]'::jsonb),
    'by_source', coalesce((
      select jsonb_agg(t) from (
        select c.source, count(*)::int as orders, sum(c.total) as sales
          from cur c group by c.source order by c.source) t), '[]'::jsonb),
    'by_status', coalesce((
      select jsonb_agg(t) from (
        select o.status, count(*)::int as orders
          from public.orders o
         where o.created_at >= p_from and o.created_at < p_to
         group by o.status order by o.status) t), '[]'::jsonb),
    'low_stock', coalesce((
      select jsonb_agg(t) from (
        select p.id, p.name, p.flavour, p.stock, p.low_stock_threshold as threshold
          from public.products p
         where p.track_inventory and p.status = 'active' and p.stock <= p.low_stock_threshold
         order by p.stock, p.name limit 10) t), '[]'::jsonb)
  ) into result;

  return result;
end;
$fn$;


-- Customers with their order totals, for the admin list. Searches email, name and phone.
create or replace function public.admin_customers(p_search text, p_limit int default 25, p_offset int default 0)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
declare
  pattern text := case when nullif(btrim(coalesce(p_search, '')), '') is null then null
                       else '%' || replace(replace(replace(btrim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%' end;
  result jsonb;
begin
  perform public.require_staff();

  with base as (
    select c.id, c.email, c.full_name, c.phone, c.tags, c.created_at, c.profile_id is not null as has_account,
           (select count(*) from public.orders o where o.customer_id = c.id and o.status <> 'cancelled')::int as orders,
           (select coalesce(sum(o.total), 0) from public.orders o where o.customer_id = c.id and o.status <> 'cancelled') as total_spent,
           (select max(o.created_at) from public.orders o where o.customer_id = c.id) as last_order_at
      from public.customers c
     where pattern is null
        or c.email ilike pattern or c.full_name ilike pattern or c.phone ilike pattern
  )
  select jsonb_build_object(
    'total', (select count(*) from base),
    'rows', coalesce((
      select jsonb_agg(to_jsonb(b) order by b.last_order_at desc nulls last, b.created_at desc)
        from (select * from base
               order by last_order_at desc nulls last, created_at desc
               limit greatest(1, least(coalesce(p_limit, 25), 100))
              offset greatest(0, coalesce(p_offset, 0))) b), '[]'::jsonb)
  ) into result;
  return result;
end;
$fn$;


-- Staff list with emails (auth.users is not readable from the app).
create or replace function public.admin_staff()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $fn$
begin
  perform public.require_staff();
  return coalesce((
    select jsonb_agg(jsonb_build_object('id', p.id, 'email', u.email, 'full_name', p.full_name, 'role', p.role)
                     order by p.role, u.email)
      from public.profiles p
      join auth.users u on u.id = p.id
     where p.role in ('owner', 'staff')), '[]'::jsonb);
end;
$fn$;


-- Owners change roles by email. The person must already have registered, and the store
-- always keeps at least one owner.
create or replace function public.admin_set_role(p_email text, p_role text)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  target uuid;
  target_role text;
begin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'owner') then
    raise exception using errcode = '42501', message = 'Only an owner can change roles.';
  end if;
  if p_role not in ('owner', 'staff', 'customer') then
    raise exception using errcode = 'P0001', message = 'Unknown role.';
  end if;

  select u.id into target from auth.users u where lower(u.email) = lower(btrim(p_email));
  if target is null then
    raise exception using errcode = 'P0001', message = 'No account uses that email. Ask them to register on the site first.';
  end if;

  select role into target_role from public.profiles where id = target;
  if target_role = 'owner' and p_role <> 'owner'
     and (select count(*) from public.profiles where role = 'owner') <= 1 then
    raise exception using errcode = 'P0001', message = 'The store needs at least one owner.';
  end if;

  update public.profiles set role = p_role where id = target;
end;
$fn$;


revoke all on function public.update_order_status(uuid, text, text) from public;
revoke all on function public.set_order_payment(uuid, text) from public;
revoke all on function public.adjust_stock(uuid, int, text, text) from public;
revoke all on function public.admin_stats(timestamptz, timestamptz) from public;
revoke all on function public.admin_customers(text, int, int) from public;
revoke all on function public.admin_staff() from public;
revoke all on function public.admin_set_role(text, text) from public;

grant execute on function public.update_order_status(uuid, text, text) to authenticated;
grant execute on function public.set_order_payment(uuid, text) to authenticated;
grant execute on function public.adjust_stock(uuid, int, text, text) to authenticated;
grant execute on function public.admin_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_customers(text, int, int) to authenticated;
grant execute on function public.admin_staff() to authenticated;
grant execute on function public.admin_set_role(text, text) to authenticated;
