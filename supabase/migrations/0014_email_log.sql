-- 0014_email_log.sql — a record of every email the shop tries to send (like Shopify's notification log).
-- Safe to run more than once.

begin;

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  to_email text not null,
  subject text not null,
  template text not null,
  order_number int,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists email_log_created_idx on public.email_log (created_at desc);

alter table public.email_log enable row level security;
drop policy if exists email_log_staff_select on public.email_log;
create policy email_log_staff_select on public.email_log for select to authenticated using (public.is_staff());

-- The server logs through this function (it has no service key). Every value is length-limited.
create or replace function public.log_email(p jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if p ->> 'status' not in ('sent', 'skipped', 'failed') then
    raise exception 'bad status';
  end if;
  insert into public.email_log (to_email, subject, template, order_number, status, provider_id, error)
  values (
    left(coalesce(p ->> 'to', ''), 300),
    left(coalesce(p ->> 'subject', ''), 300),
    left(coalesce(p ->> 'template', ''), 60),
    nullif(p ->> 'order_number', '')::int,
    p ->> 'status',
    left(p ->> 'provider_id', 100),
    left(p ->> 'error', 300)
  );
end;
$fn$;

revoke all on function public.log_email(jsonb) from public;
grant execute on function public.log_email(jsonb) to anon, authenticated;
grant select on public.email_log to authenticated;

commit;
