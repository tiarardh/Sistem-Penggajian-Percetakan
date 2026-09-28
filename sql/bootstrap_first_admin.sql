do $$
declare
  target_email constant text := 'REPLACE_WITH_VERIFIED_OWNER_EMAIL';
  target_user_id uuid;
begin
  if target_email = 'REPLACE_WITH_VERIFIED_OWNER_EMAIL' or position('@' in target_email) < 2 then
    raise exception 'Edit target_email to the verified owner email before running this script.';
  end if;

  lock table public.profiles in exclusive mode;

  if exists (select 1 from public.profiles where role = 'admin') then
    raise exception 'An admin already exists. Use the authenticated admin account to manage roles.';
  end if;

  select users.id
  into target_user_id
  from auth.users as users
  where lower(users.email) = lower(target_email)
    and users.email_confirmed_at is not null;

  if target_user_id is null then
    raise exception 'No Auth account with a confirmed email matching target_email was found.';
  end if;

  update public.profiles
  set role = 'admin', employee_id = null
  where id = target_user_id;

  if not found then
    raise exception 'The owner profile was not provisioned. Confirm the latest schema.sql was applied.';
  end if;
end;
$$;
