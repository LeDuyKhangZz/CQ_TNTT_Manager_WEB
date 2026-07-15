-- P1-T3: Narrow authenticated RPC used after a successful password change.

create function public.complete_password_change()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED' using errcode = '42501';
  end if;

  update public.profiles
  set must_change_password = false,
      updated_at = now(),
      updated_by = auth.uid()
  where id = auth.uid() and account_status = 'active';

  if not found then
    raise exception 'ACCOUNT_UNAVAILABLE' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.complete_password_change() from public, anon;
grant execute on function public.complete_password_change() to authenticated;

comment on function public.complete_password_change() is
  'Clears must_change_password for the authenticated active account only.';
