-- 0003_storage.sql — Public image buckets; only staff may write.

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true),
       ('content-images', 'content-images', true)
on conflict (id) do update set public = excluded.public;

create policy mago_images_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id in ('product-images', 'content-images'));

create policy mago_images_staff_insert on storage.objects
  for insert to authenticated
  with check (bucket_id in ('product-images', 'content-images') and (select public.is_staff()));

create policy mago_images_staff_update on storage.objects
  for update to authenticated
  using (bucket_id in ('product-images', 'content-images') and (select public.is_staff()))
  with check (bucket_id in ('product-images', 'content-images') and (select public.is_staff()));

create policy mago_images_staff_delete on storage.objects
  for delete to authenticated
  using (bucket_id in ('product-images', 'content-images') and (select public.is_staff()));
