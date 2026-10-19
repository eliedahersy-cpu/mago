-- 0013_explicit_grants.sql — back to explicit grants only.
-- A project created with "Automatically expose new tables" ticked hands anon and authenticated every
-- privilege on every new table, function and sequence in public. MAGO grants access one object at a time
-- (see 0002 and the grants beside each function), so this removes the automatic grants and applies the
-- intended ones again. Safe to run more than once, on any project.

begin;

alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Tables (from 0002).
grant usage on schema public to anon, authenticated;
grant select on
  public.settings, public.collections, public.products, public.product_images,
  public.collection_products, public.subscription_plans, public.recipes, public.stores,
  public.store_products, public.reviews
to anon;
grant insert on public.newsletter_subscribers to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Functions: exactly the ones the shop and the admin call.
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.get_active_automatic_discount() to anon, authenticated;
grant execute on function public.quote_cart(jsonb, text) to anon, authenticated;
grant execute on function public.place_order(jsonb) to anon, authenticated;
grant execute on function public.get_order_by_token(uuid) to anon, authenticated;
grant execute on function public.quote_subscription(uuid, jsonb) to anon, authenticated;

grant execute on function public.claim_customer() to authenticated;
grant execute on function public.update_order_status(uuid, text, text) to authenticated;
grant execute on function public.set_order_payment(uuid, text) to authenticated;
grant execute on function public.adjust_stock(uuid, int, text, text) to authenticated;
grant execute on function public.admin_stats(timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_customers(text, int, int) to authenticated;
grant execute on function public.admin_staff() to authenticated;
grant execute on function public.admin_set_role(text, text) to authenticated;
grant execute on function public.submit_review(uuid, int, text, text) to authenticated;
grant execute on function public.create_subscription(jsonb) to authenticated;
grant execute on function public.update_subscription(uuid, text, jsonb) to authenticated;
grant execute on function public.process_due_subscriptions() to authenticated;

commit;
