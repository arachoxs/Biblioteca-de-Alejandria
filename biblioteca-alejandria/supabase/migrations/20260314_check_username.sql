create or replace function public.check_username_exists(username_check text)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return exists (
    select 1
    from auth.users
    where lower(raw_user_meta_data->>'username') = lower(username_check)
  );
end;
$$;
