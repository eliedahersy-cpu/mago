-- supabase/cleanup/e2e-orders.sql
-- Removes the orders placed by the Playwright checkout tests (emails
-- e2e-...@example.com), puts their stock back and drops those test customers.
-- Touches nothing else; safe to run any time in the SQL editor.

begin;

-- Give back what the test orders took from stock.
update public.products p
   set stock = p.stock + m.qty
  from (
    select im.product_id, -sum(im.delta)::int as qty
      from public.inventory_movements im
      join public.orders o on o.id = im.order_id
     where o.email like 'e2e-%@example.com'
     group by im.product_id
  ) m
 where p.id = m.product_id;

delete from public.inventory_movements im
 using public.orders o
 where o.id = im.order_id and o.email like 'e2e-%@example.com';

-- order_items and order_events cascade with the order.
delete from public.orders where email like 'e2e-%@example.com';

delete from public.customers c
 where c.email like 'e2e-%@example.com'
   and not exists (select 1 from public.orders o where o.customer_id = c.id);

commit;

select count(*) as remaining_test_orders from public.orders where email like 'e2e-%@example.com';
