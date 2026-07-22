-- P1-T3B: Require ownership accounts to link their business profile.

create function app.validate_ownership_role_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_active and new.role = 'guardian' and not exists (
    select 1 from public.guardians where profile_id = new.profile_id
  ) then
    raise exception 'GUARDIAN_PROFILE_REQUIRED' using errcode = '23514';
  end if;

  if new.is_active and new.role = 'student' and not exists (
    select 1 from public.students where profile_id = new.profile_id
  ) then
    raise exception 'STUDENT_PROFILE_REQUIRED' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger role_assignments_validate_ownership_link
before insert or update of profile_id, role, is_active
on public.role_assignments
for each row execute function app.validate_ownership_role_link();

revoke all on function app.validate_ownership_role_link() from public, anon, authenticated;
grant execute on function app.validate_ownership_role_link() to service_role;

comment on function app.validate_ownership_role_link() is
  'Active guardian/student roles require a matching guardians/students profile_id link.';
