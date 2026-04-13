create schema if not exists private;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_first_user boolean;
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('private.handle_new_user.first_admin')
  );

  select not exists (
    select 1
    from public.profiles
    where role = 'admin'::public.profile_role
  )
  into is_first_user;

  insert into public.profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'Anonymous'),
    case
      when is_first_user then 'admin'::public.profile_role
      else 'sales'::public.profile_role
    end
  );

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();
