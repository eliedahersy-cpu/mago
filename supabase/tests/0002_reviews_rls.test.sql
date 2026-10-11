-- supabase/tests/0002_reviews_rls.test.sql
-- A signed-in customer may submit an honest pending review, and nothing more:
-- no self-approval, no "verified buyer" flag, no posting as another customer,
-- no reviews on hidden products. All fixtures are rolled back.
-- Success = a single row: "reviews rls: all passed".

begin;

insert into public.products (id, slug, name, type, status, price)
values ('00000000-0000-4000-8000-0000000000b1', 'rls-review-active', 'Review Cup', 'cup', 'active', 1),
       ('00000000-0000-4000-8000-0000000000b2', 'rls-review-draft', 'Review Draft', 'cup', 'draft', 1);
insert into public.customers (id, email) values ('00000000-0000-4000-8000-0000000000c1', 'someone-else@test.local');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
  begin
    insert into public.reviews (product_id, author_name, rating, body)
    values ('00000000-0000-4000-8000-0000000000b1', 'Ana', 5, 'Great');
  exception when others then
    raise exception 'FAIL honest pending review rejected: %', sqlerrm;
  end;

  begin
    insert into public.reviews (product_id, author_name, rating, body, is_verified_buyer)
    values ('00000000-0000-4000-8000-0000000000b1', 'Ana', 5, 'Great', true);
    raise exception 'FAIL self-verified review accepted';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.reviews (product_id, customer_id, author_name, rating, body)
    values ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000c1', 'Ana', 5, 'Great');
    raise exception 'FAIL review posted as another customer accepted';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.reviews (product_id, author_name, rating, body, status)
    values ('00000000-0000-4000-8000-0000000000b1', 'Ana', 5, 'Great', 'approved');
    raise exception 'FAIL self-approved review accepted';
  exception when insufficient_privilege then
    null;
  end;

  begin
    insert into public.reviews (product_id, author_name, rating, body)
    values ('00000000-0000-4000-8000-0000000000b2', 'Ana', 5, 'Great');
    raise exception 'FAIL review on a draft product accepted';
  exception when insufficient_privilege then
    null;
  end;
end $$;

rollback;

select 'reviews rls: all passed' as result;
