-- 0005_reviews_insert_policy.sql — tighten what signed-in customers may submit as a review.
-- Previously only status = 'pending' was enforced, so a customer could self-mark
-- "verified buyer", post as another customer, or review a hidden product.

drop policy if exists reviews_customer_insert on public.reviews;

create policy reviews_customer_insert on public.reviews
  for insert to authenticated
  with check (
    status = 'pending'
    and is_verified_buyer = false
    and product_id in (select p.id from public.products p where p.status = 'active')
    and (
      customer_id is null
      or customer_id in (select c.id from public.customers c where c.profile_id = (select auth.uid()))
    )
  );
