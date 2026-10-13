-- Accounts: join a signed-in person to their customer record.
--
-- Guest checkout and accounts share one customers row per email (spec section 5).
-- claim_customer() links the current account to that row, so earlier guest orders
-- appear in the account, but only once the account's email is verified: otherwise
-- anyone could register someone else's address and read their order history.

create or replace function public.claim_customer()
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $fn$
declare
  uid  uuid := auth.uid();
  u    record;
  p    record;
  cid  uuid;
  wants_marketing boolean;
begin
  if uid is null then
    return null;
  end if;

  select c.id into cid from public.customers c where c.profile_id = uid;
  if found then
    return cid;
  end if;

  select au.email, au.email_confirmed_at, au.raw_user_meta_data
    into u from auth.users au where au.id = uid;
  if u.email is null or u.email_confirmed_at is null then
    return null;
  end if;

  select pr.full_name, pr.phone into p from public.profiles pr where pr.id = uid;
  wants_marketing := coalesce(u.raw_user_meta_data ->> 'accepts_marketing', '') = 'true';

  -- The guest record with the same email, if there is one and nobody has claimed it.
  update public.customers c
     set profile_id = uid,
         full_name = coalesce(c.full_name, p.full_name),
         phone = coalesce(c.phone, p.phone),
         accepts_marketing = c.accepts_marketing or wants_marketing
   where lower(c.email) = lower(u.email)
     and c.profile_id is null
  returning c.id into cid;
  if cid is not null then
    return cid;
  end if;

  insert into public.customers (profile_id, email, full_name, phone, accepts_marketing)
  values (uid, lower(u.email), p.full_name, p.phone, wants_marketing)
  on conflict ((lower(email))) do update
     set profile_id = excluded.profile_id
   where public.customers.profile_id is null
  returning id into cid;

  return cid;
end;
$fn$;

revoke all on function public.claim_customer() from public;
grant execute on function public.claim_customer() to authenticated;
