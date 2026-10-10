-- supabase/tests/0001_catalog_rls.test.sql
-- Verifies anonymous visitors only see public catalog data and cannot write it.
-- Run in the Supabase SQL editor (or execute_sql). All fixtures are rolled back.
-- Success = a single row: "catalog rls: all passed". Any failure raises "FAIL <reason>".

begin;

insert into public.products (id, slug, name, type, status, price)
values ('00000000-0000-4000-8000-0000000000a1', 'rls-test-draft', 'RLS Draft', 'cup', 'draft', 1),
       ('00000000-0000-4000-8000-0000000000a2', 'rls-test-active', 'RLS Active', 'cup', 'active', 1);
insert into public.product_images (product_id, url, alt, position, kind)
values ('00000000-0000-4000-8000-0000000000a2', '/products/rls-test.webp', 'RLS test', 0, 'packshot');
insert into public.orders (email, phone, subtotal, discount_total, shipping_total, total, shipping_address)
values ('rls@test.local', '+96100000000', 1, 0, 3, 4, '{}'::jsonb);
insert into public.discounts (title, kind, value, applies_to, min_cup_quantity, is_automatic, is_active)
values ('RLS test discount', 'percentage', 99, 'cups', 5, true, true);
insert into public.recipes (slug, title, status) values ('rls-test-draft-recipe', 'RLS Draft Recipe', 'draft');
insert into public.collections (slug, title, is_visible) values ('rls-test-hidden', 'RLS Hidden', false);

set local role anon;

do $$
declare
  n int;
begin
  if exists (select 1 from public.products where slug = 'rls-test-draft') then
    raise exception 'FAIL anon sees draft product';
  end if;

  if not exists (
    select 1 from public.products p
    join public.product_images i on i.product_id = p.id
    where p.slug = 'rls-test-active'
  ) then
    raise exception 'FAIL anon cannot see active product';
  end if;

  begin
    insert into public.products (slug, name, type, status, price) values ('rls-anon-insert', 'x', 'cup', 'active', 1);
    raise exception 'FAIL anon inserted product';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.newsletter_subscribers (email, source) values ('rls-anon@test.local', 'test');
  exception when others then
    raise exception 'FAIL anon cannot subscribe: %', sqlerrm;
  end;

  select count(*) into n from public.newsletter_subscribers;
  if n <> 0 then
    raise exception 'FAIL anon can read subscribers';
  end if;

  select count(*) into n from public.orders;
  if n <> 0 then
    raise exception 'FAIL anon can read orders';
  end if;

  begin
    insert into public.orders (email, phone, subtotal, discount_total, shipping_total, total, shipping_address)
    values ('anon@test.local', '1', 0, 0, 0, 0, '{}'::jsonb);
    raise exception 'FAIL anon inserted order';
  exception when insufficient_privilege then
    null;
  end;

  if exists (select 1 from public.discounts) then
    raise exception 'FAIL anon can read discounts';
  end if;

  if not exists (select 1 from public.get_active_automatic_discount() where title = 'RLS test discount') then
    raise exception 'FAIL automatic discount function hides the active rule';
  end if;

  if exists (select 1 from public.recipes where slug = 'rls-test-draft-recipe') then
    raise exception 'FAIL draft recipe visible';
  end if;

  if exists (select 1 from public.collections where slug = 'rls-test-hidden') then
    raise exception 'FAIL hidden collection visible';
  end if;
end $$;

rollback;

select 'catalog rls: all passed' as result;
