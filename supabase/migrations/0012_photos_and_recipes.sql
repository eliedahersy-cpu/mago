-- 0012_photos_and_recipes.sql — photos for the product pages and the recipes, from the approved designs.
-- Safe to run more than once.

begin;

-- Recipe photos (approved bowls for each recipe).
update public.recipes r
set hero_image = v.img
from (values
  ('spicy-muhammara-fusilli-roasted-veggies', '/images/recipes/spicy-muhammara-fusilli-roasted-veggies.webp'),
  ('pesto-fusilli-grilled-chicken', '/images/recipes/pesto-fusilli-grilled-chicken.webp'),
  ('creamy-truffle-tagliolini-mushrooms', '/images/recipes/creamy-truffle-tagliolini-mushrooms.webp'),
  ('mac-and-cheese-conchiglie-crispy-breadcrumbs', '/images/recipes/mac-and-cheese-conchiglie-crispy-breadcrumbs.webp'),
  ('rishta-soup-lemon-herbs', '/images/recipes/rishta-soup-lemon-herbs.webp'),
  ('sweet-cinnamon-pastina-caramelized-bananas', '/images/recipes/sweet-cinnamon-pastina-caramelized-bananas.webp'),
  ('lemon-tagliolini-fresh-herbs', '/images/recipes/lemon-tagliolini-fresh-herbs.webp'),
  ('garlic-macaroon-crispy-chickpeas', '/images/recipes/garlic-macaroon-crispy-chickpeas.webp')
) as v (slug, img)
where r.slug = v.slug;

-- Product photos (approved product-page designs): photos first, then the existing packshots / lifestyle shots.
delete from public.product_images where url like '/products/gallery/%';

-- Put the existing images in a clean 0..n-1 order, then make room in front for the photos.
update public.product_images pi
set position = r.rn - 1
from (
  select id, row_number() over (partition by product_id order by position, created_at) as rn
  from public.product_images
  where product_id in (select id from public.products where slug = any (array['fusilli-spicy-muhammara', 'tagliolini-al-tartufo-bianco', 'rishta-lentil-pasta-soup', 'lasagna-melanzane-ricotta', 'fusilli-400g', 'lasagna-400g', 'conchiglie-400g', 'tagliolini-400g']))
) r
where pi.id = r.id;

update public.product_images pi
set position = pi.position + c.n
from (select p.id, v.n from (values ('fusilli-spicy-muhammara', 6), ('tagliolini-al-tartufo-bianco', 6), ('rishta-lentil-pasta-soup', 4), ('lasagna-melanzane-ricotta', 5), ('fusilli-400g', 4), ('lasagna-400g', 4), ('conchiglie-400g', 3), ('tagliolini-400g', 5)) as v (slug, n) join public.products p on p.slug = v.slug) c
where pi.product_id = c.id;

insert into public.product_images (product_id, url, alt, position, kind)
select p.id, v.url, v.alt, v.position, 'lifestyle'
from (values
  ('fusilli-spicy-muhammara', '/products/gallery/fusilli-spicy-muhammara-1.webp', 'MAGO Fusilli Cup Spicy Muhammara with roasted peppers and walnuts', 0),
  ('fusilli-spicy-muhammara', '/products/gallery/fusilli-spicy-muhammara-2.webp', 'A bowl of spicy muhammara fusilli', 1),
  ('fusilli-spicy-muhammara', '/products/gallery/fusilli-spicy-muhammara-3.webp', 'Spicy muhammara fusilli lifted on a fork', 2),
  ('fusilli-spicy-muhammara', '/products/gallery/fusilli-spicy-muhammara-4.webp', 'A MAGO Fusilli Cup Spicy Muhammara beside a bowl of fusilli', 3),
  ('fusilli-spicy-muhammara', '/products/gallery/fusilli-spicy-muhammara-5.webp', 'Enjoying a MAGO Fusilli Cup Spicy Muhammara', 4),
  ('fusilli-spicy-muhammara', '/products/gallery/fusilli-spicy-muhammara-6.webp', 'MAGO Fusilli Cup Spicy Muhammara with fresh peppers and tomatoes', 5),
  ('tagliolini-al-tartufo-bianco', '/products/gallery/tagliolini-al-tartufo-bianco-1.webp', 'MAGO Tagliolini Cup Al Tartufo Bianco with truffle and parmesan', 0),
  ('tagliolini-al-tartufo-bianco', '/products/gallery/tagliolini-al-tartufo-bianco-2.webp', 'Truffle tagliolini with mushrooms in a bowl', 1),
  ('tagliolini-al-tartufo-bianco', '/products/gallery/tagliolini-al-tartufo-bianco-3.webp', 'Truffle tagliolini lifted on a fork from the cup', 2),
  ('tagliolini-al-tartufo-bianco', '/products/gallery/tagliolini-al-tartufo-bianco-4.webp', 'MAGO Tagliolini Cup Al Tartufo Bianco with parmesan and mushrooms', 3),
  ('tagliolini-al-tartufo-bianco', '/products/gallery/tagliolini-al-tartufo-bianco-5.webp', 'Enjoying a MAGO Tagliolini Cup Al Tartufo Bianco', 4),
  ('tagliolini-al-tartufo-bianco', '/products/gallery/tagliolini-al-tartufo-bianco-6.webp', 'MAGO Tagliolini Cup Al Tartufo Bianco with a plate of tagliolini', 5),
  ('rishta-lentil-pasta-soup', '/products/gallery/rishta-lentil-pasta-soup-1.webp', 'MAGO Rishta Cup Lentil & Pasta Soup with a bowl of soup', 0),
  ('rishta-lentil-pasta-soup', '/products/gallery/rishta-lentil-pasta-soup-2.webp', 'A MAGO Rishta Cup with a spoonful of lentil soup', 1),
  ('rishta-lentil-pasta-soup', '/products/gallery/rishta-lentil-pasta-soup-3.webp', 'Enjoying a MAGO Rishta Cup Lentil & Pasta Soup', 2),
  ('rishta-lentil-pasta-soup', '/products/gallery/rishta-lentil-pasta-soup-4.webp', 'MAGO Rishta Cup with lentils, onion, garlic and lemon', 3),
  ('lasagna-melanzane-ricotta', '/products/gallery/lasagna-melanzane-ricotta-1.webp', 'MAGO Lasagna Cup Melanzane & Ricotta with grilled aubergine', 0),
  ('lasagna-melanzane-ricotta', '/products/gallery/lasagna-melanzane-ricotta-2.webp', 'Lasagna melanzane and ricotta in a bowl', 1),
  ('lasagna-melanzane-ricotta', '/products/gallery/lasagna-melanzane-ricotta-3.webp', 'A MAGO Lasagna Cup Melanzane & Ricotta, opened', 2),
  ('lasagna-melanzane-ricotta', '/products/gallery/lasagna-melanzane-ricotta-4.webp', 'Enjoying a MAGO Lasagna Cup Melanzane & Ricotta', 3),
  ('lasagna-melanzane-ricotta', '/products/gallery/lasagna-melanzane-ricotta-5.webp', 'Lasagna melanzane and ricotta lifted on a fork', 4),
  ('fusilli-400g', '/products/gallery/fusilli-400g-1.webp', 'MAGO Fusilli 400g box in a Mediterranean kitchen', 0),
  ('fusilli-400g', '/products/gallery/fusilli-400g-2.webp', 'Pesto fusilli made with MAGO Fusilli', 1),
  ('fusilli-400g', '/products/gallery/fusilli-400g-3.webp', 'MAGO Fusilli 400g box with fresh ingredients', 2),
  ('fusilli-400g', '/products/gallery/fusilli-400g-4.webp', 'Cooking with MAGO Fusilli', 3),
  ('lasagna-400g', '/products/gallery/lasagna-400g-1.webp', 'MAGO Lasagna 400g box with cheese and basil', 0),
  ('lasagna-400g', '/products/gallery/lasagna-400g-2.webp', 'MAGO Lasagna 400g box on the kitchen counter', 1),
  ('lasagna-400g', '/products/gallery/lasagna-400g-3.webp', 'Layering lasagna with MAGO Lasagna sheets', 2),
  ('lasagna-400g', '/products/gallery/lasagna-400g-4.webp', 'MAGO Lasagna 400g box beside a baked lasagna', 3),
  ('conchiglie-400g', '/products/gallery/conchiglie-400g-1.webp', 'MAGO Conchiglie 400g box beside a bowl of shells', 0),
  ('conchiglie-400g', '/products/gallery/conchiglie-400g-2.webp', 'MAGO Conchiglie 400g box', 1),
  ('conchiglie-400g', '/products/gallery/conchiglie-400g-3.webp', 'MAGO Conchiglie 400g box with shells and basil', 2),
  ('tagliolini-400g', '/products/gallery/tagliolini-400g-1.webp', 'MAGO Tagliolini 400g box with nests of tagliolini', 0),
  ('tagliolini-400g', '/products/gallery/tagliolini-400g-2.webp', 'MAGO Tagliolini 400g box beside a bowl of tagliolini', 1),
  ('tagliolini-400g', '/products/gallery/tagliolini-400g-3.webp', 'Tossing tagliolini in a pan', 2),
  ('tagliolini-400g', '/products/gallery/tagliolini-400g-4.webp', 'MAGO Tagliolini 400g box with lemon and parmesan', 3),
  ('tagliolini-400g', '/products/gallery/tagliolini-400g-5.webp', 'MAGO Tagliolini 400g box beside a plate of tagliolini', 4)
) as v (slug, url, alt, position)
join public.products p on p.slug = v.slug;

commit;
