-- 0015_prices_and_boxes.sql — cups $3.69, the four 400g pasta boxes live at $4.99 with their new pack photos.
-- Safe to run more than once.

begin;

update public.products set price = 3.69 where type = 'cup';

update public.products
set price = 4.99, status = 'active', stock = greatest(stock, 100)
where slug in ('fusilli-400g', 'tagliolini-400g', 'conchiglie-400g', 'lasagna-400g');

-- The new pack photo goes first; the older images follow it.
delete from public.product_images where url like '/products/%-400g-pack.webp';

update public.product_images pi
set position = pi.position + 1
from public.products p
where p.id = pi.product_id
  and p.slug in ('fusilli-400g', 'tagliolini-400g', 'conchiglie-400g', 'lasagna-400g');

insert into public.product_images (product_id, url, alt, position, kind)
select p.id, '/products/' || v.k || '-400g-pack.webp', 'MAGO ' || v.name || ' 400g box', 0, 'packshot'
from (values ('fusilli', 'Fusilli'), ('tagliolini', 'Tagliolini'), ('conchiglie', 'Conchiglie'), ('lasagna', 'Lasagna')) as v (k, name)
join public.products p on p.slug = v.k || '-400g';

commit;
