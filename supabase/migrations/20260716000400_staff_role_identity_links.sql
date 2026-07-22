-- P1-T3B: GLV leadership/sector/class roles require a linked staff profile.

create function app.validate_staff_role_link()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.is_active
     and new.role in (
       'group_leader', 'deputy_group_leader', 'secretary', 'treasurer',
       'sector_leader', 'sector_deputy',
       'class_representative', 'class_teacher', 'trainee_assistant'
     )
     and not exists (
       select 1 from public.staff_profiles where profile_id = new.profile_id
     ) then
    raise exception 'STAFF_PROFILE_REQUIRED' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger role_assignments_validate_staff_link
before insert or update of profile_id, role, is_active
on public.role_assignments
for each row execute function app.validate_staff_role_link();

revoke all on function app.validate_staff_role_link() from public, anon, authenticated;
grant execute on function app.validate_staff_role_link() to service_role;

comment on function app.validate_staff_role_link() is
  'Active GLV leadership, sector and class roles require staff_profiles.profile_id.';
