-- 0002_rls.sql — Row level security for every table (spec §5 "RLS summary").
-- Staff (profiles.role owner/staff) get full access through public.is_staff().
-- Orders and order items are never inserted directly by customers: Plan 2's
-- place_order() (security definer) is the only write path.

do $$
declare
  t text;
begin
  foreach t in array array[
    'settings', 'profiles', 'collections', 'products', 'product_images', 'collection_products',
    'inventory_movements', 'customers', 'addresses', 'wishlist_items', 'discounts',
    'subscription_plans', 'subscriptions', 'orders', 'order_items', 'order_events',
    'recipes', 'stores', 'store_products', 'reviews', 'newsletter_subscribers'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()))',
      t || '_staff_all', t
    );
  end loop;
end $$;

-- Public catalog & content -------------------------------------------------
create policy settings_public_read on public.settings
  for select to anon, authenticated using (true);

create policy collections_public_read on public.collections
  for select to anon, authenticated using (is_visible);

create policy products_public_read on public.products
  for select to anon, authenticated using (status = 'active');

create policy product_images_public_read on public.product_images
  for select to anon, authenticated
  using (exists (
    select 1 from public.products p
    where p.id = product_images.product_id and p.status = 'active'
  ));

create policy collection_products_public_read on public.collection_products
  for select to anon, authenticated using (true);

create policy subscription_plans_public_read on public.subscription_plans
  for select to anon, authenticated using (is_active);

create policy recipes_public_read on public.recipes
  for select to anon, authenticated using (status = 'published');

create policy stores_public_read on public.stores
  for select to anon, authenticated using (is_active);

create policy store_products_public_read on public.store_products
  for select to anon, authenticated using (true);

create policy reviews_public_read on public.reviews
  for select to anon, authenticated using (status = 'approved');

-- Signed-in customers ------------------------------------------------------
create policy reviews_customer_insert on public.reviews
  for insert to authenticated with check (status = 'pending');

create policy profiles_own_read on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy profiles_own_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy customers_own_read on public.customers
  for select to authenticated using (profile_id = (select auth.uid()));

create policy addresses_own_all on public.addresses
  for all to authenticated
  using (customer_id in (select c.id from public.customers c where c.profile_id = (select auth.uid())))
  with check (customer_id in (select c.id from public.customers c where c.profile_id = (select auth.uid())));

create policy wishlist_items_own_all on public.wishlist_items
  for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

create policy subscriptions_own_read on public.subscriptions
  for select to authenticated
  using (customer_id in (select c.id from public.customers c where c.profile_id = (select auth.uid())));

create policy orders_own_read on public.orders
  for select to authenticated
  using (customer_id in (select c.id from public.customers c where c.profile_id = (select auth.uid())));

create policy order_items_own_read on public.order_items
  for select to authenticated
  using (order_id in (
    select o.id from public.orders o
    join public.customers c on c.id = o.customer_id
    where c.profile_id = (select auth.uid())
  ));

-- Anyone may join the newsletter; nobody but staff may read the list. --------
create policy newsletter_subscribers_public_insert on public.newsletter_subscribers
  for insert to anon, authenticated with check (true);

grant execute on function public.is_staff() to anon, authenticated;
