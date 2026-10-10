-- 0004_catalog_functions.sql — Read-only helpers the public storefront may call.

-- The single strongest automatic discount that is active right now (powers the
-- "Buy any 5 cups and save 10%" strip). Discounts themselves stay staff-only.
create or replace function public.get_active_automatic_discount()
returns table (title text, value numeric, min_cup_quantity int)
language sql
stable
security definer
set search_path = ''
as $$
  select d.title, d.value, d.min_cup_quantity
  from public.discounts d
  where d.is_automatic
    and d.is_active
    and (d.starts_at is null or d.starts_at <= now())
    and (d.ends_at is null or d.ends_at > now())
  order by d.value desc
  limit 1;
$$;

revoke all on function public.get_active_automatic_discount() from public;
grant execute on function public.get_active_automatic_discount() to anon, authenticated;
