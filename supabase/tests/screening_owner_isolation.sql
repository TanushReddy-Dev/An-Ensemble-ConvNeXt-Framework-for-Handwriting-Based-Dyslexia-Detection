-- Run against a local or staging Supabase database with schema.sql installed.
-- Requires the database admin role so the test can create disposable Auth rows.
\set ON_ERROR_STOP on
begin;

select set_config('nw.test_user_a', gen_random_uuid()::text, true);
select set_config('nw.test_user_b', gen_random_uuid()::text, true);
insert into auth.users (id, email, raw_user_meta_data)
values
  (current_setting('nw.test_user_a')::uuid, current_setting('nw.test_user_a') || '@example.test', '{}'),
  (current_setting('nw.test_user_b')::uuid, current_setting('nw.test_user_b') || '@example.test', '{}');

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('nw.test_user_a'), true);
insert into public.screenings (id, user_id, category, risk_score)
values (current_setting('nw.test_user_a'), auth.uid(), 'Typical', 0.2);

select set_config('request.jwt.claim.sub', current_setting('nw.test_user_b'), true);
insert into public.screenings (id, user_id, category, risk_score)
values (current_setting('nw.test_user_b'), auth.uid(), 'Typical', 0.3);

do $$
begin
  if not exists (select from public.screenings where id = current_setting('nw.test_user_b')) then
    raise exception 'Account B could not read its own screening';
  end if;
  if exists (select from public.screenings where id = current_setting('nw.test_user_a')) then
    raise exception 'Account B could see account A’s screening';
  end if;

  update public.screenings set risk_score = 0.9 where id = current_setting('nw.test_user_a');
  if found then
    raise exception 'Account B could modify account A’s screening';
  end if;

  begin
    insert into public.screenings (id, user_id, category, risk_score)
    values (gen_random_uuid()::text, current_setting('nw.test_user_a')::uuid, 'Typical', 0.1);
    raise exception 'Account B could insert in account A’s workspace';
  exception when insufficient_privilege then
    null;
  end;
end $$;

select set_config('request.jwt.claim.sub', current_setting('nw.test_user_a'), true);
insert into public.screenings (id, user_id, category, risk_score)
values (current_setting('nw.test_user_a'), auth.uid(), 'Typical', 0.25)
on conflict (id) do update set risk_score = excluded.risk_score;

do $$
begin
  if exists (select from public.screenings where id = current_setting('nw.test_user_b')) then
    raise exception 'Account A could see account B’s screening';
  end if;
  if (select risk_score from public.screenings where id = current_setting('nw.test_user_a'))
     is distinct from 0.25::numeric then
    raise exception 'Account A could not save and update its own screening';
  end if;
end $$;

rollback;
