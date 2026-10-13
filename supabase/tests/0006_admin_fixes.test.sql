-- supabase/tests/0006_admin_fixes.test.sql
-- Automatic discounts can only be "percentage off cups", and the active lookup ignores anything else.
-- Everything is rolled back. Success = a single row: "admin fixes: all passed".

begin;

do $$
begin
  begin
    insert into public.discounts (title, kind, value, applies_to, is_automatic)
    values ('Bad automatic', 'fixed_amount', 5, 'order', true);
    raise exception 'FAIL an automatic fixed-amount discount was accepted';
  exception when check_violation then
    null;
  end;

  begin
    insert into public.discounts (title, kind, value, applies_to, is_automatic)
    values ('Too much', 'percentage', 150, 'cups', true);
    raise exception 'FAIL an automatic discount over 100%% was accepted';
  exception when check_violation then
    null;
  end;

  -- Codes may still be any kind.
  insert into public.discounts (code, title, kind, value, applies_to)
  values ('ZZFIXED5', 'Five off', 'fixed_amount', 5, 'order');

  -- A bigger valid automatic rule wins the lookup.
  insert into public.discounts (title, kind, value, applies_to, is_automatic, min_cup_quantity)
  values ('Big cup deal', 'percentage', 99, 'cups', true, 5);
  if (select value from public.get_active_automatic_discount()) <> 99 then
    raise exception 'FAIL lookup did not return the valid automatic rule';
  end if;
end $$;

rollback;

select 'admin fixes: all passed' as result;
