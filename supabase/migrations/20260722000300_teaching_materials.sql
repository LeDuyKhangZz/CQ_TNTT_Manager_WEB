-- Phase 4 / P4-T3: một tài liệu riêng tư cho mỗi mục giáo án.

alter table public.teaching_plan_items
  add column material_path text,
  add column material_name text,
  add column material_mime_type text,
  add column material_size bigint,
  add constraint teaching_plan_material_complete check (
    (material_path is null and material_name is null and material_mime_type is null and material_size is null)
    or
    (material_path is not null and material_name is not null and material_mime_type is not null and material_size is not null)
  ),
  add constraint teaching_plan_material_name_length check (
    material_name is null or char_length(material_name) between 1 and 255
  ),
  add constraint teaching_plan_material_path_length check (
    material_path is null or char_length(material_path) between 1 and 500
  ),
  add constraint teaching_plan_material_size_limit check (
    material_size is null or material_size between 1 and 5242880
  ),
  add constraint teaching_plan_material_mime_allowed check (
    material_mime_type is null or material_mime_type in (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg', 'image/png', 'image/webp', 'text/plain'
    )
  );

create unique index teaching_plan_items_material_path_key
on public.teaching_plan_items (material_path)
where material_path is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'teaching-materials',
  'teaching-materials',
  false,
  5242880,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg', 'image/png', 'image/webp', 'text/plain'
  ]::text[]
);

create function app.can_manage_teaching_material(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[];
  path_class_id uuid;
  path_item_id uuid;
begin
  path_parts := string_to_array(object_name, '/');
  if coalesce(array_length(path_parts, 1), 0) <> 3 then return false; end if;
  begin
    path_class_id := path_parts[1]::uuid;
    path_item_id := path_parts[2]::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  return exists (
    select 1
    from public.teaching_plan_items as item
    join public.teaching_plans as plan on plan.id = item.teaching_plan_id
    where item.id = path_item_id
      and plan.class_id = path_class_id
      and app.can_manage_teaching_plan(plan.class_id)
  );
end;
$$;

create function app.can_read_teaching_material(object_name text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  path_parts text[];
  path_class_id uuid;
  path_item_id uuid;
begin
  path_parts := string_to_array(object_name, '/');
  if coalesce(array_length(path_parts, 1), 0) <> 3 then return false; end if;
  begin
    path_class_id := path_parts[1]::uuid;
    path_item_id := path_parts[2]::uuid;
  exception when invalid_text_representation then
    return false;
  end;

  return exists (
    select 1
    from public.teaching_plan_items as item
    join public.teaching_plans as plan on plan.id = item.teaching_plan_id
    where item.id = path_item_id
      and plan.class_id = path_class_id
      and (
        (item.material_path = object_name and app.can_access_class(plan.class_id))
        -- Storage DELETE kiểm SELECT trước. Manager vẫn được thấy object vừa
        -- tách metadata để dọn vật lý; staff chỉ-xem không thấy object mồ côi.
        or app.can_manage_teaching_plan(plan.class_id)
      )
  );
end;
$$;

create policy teaching_materials_select_staff_scope
on storage.objects for select to authenticated
using (
  bucket_id = 'teaching-materials'
  and app.can_read_teaching_material(name)
);

create policy teaching_materials_insert_manager
on storage.objects for insert to authenticated
with check (
  bucket_id = 'teaching-materials'
  and app.can_manage_teaching_material(name)
);

create policy teaching_materials_update_manager
on storage.objects for update to authenticated
using (
  bucket_id = 'teaching-materials'
  and app.can_manage_teaching_material(name)
)
with check (
  bucket_id = 'teaching-materials'
  and app.can_manage_teaching_material(name)
);

create policy teaching_materials_delete_manager
on storage.objects for delete to authenticated
using (
  bucket_id = 'teaching-materials'
  and app.can_manage_teaching_material(name)
);

revoke all on function app.can_manage_teaching_material(text) from public, anon;
revoke all on function app.can_read_teaching_material(text) from public, anon;
grant execute on function app.can_manage_teaching_material(text) to authenticated, service_role;
grant execute on function app.can_read_teaching_material(text) to authenticated, service_role;

comment on column public.teaching_plan_items.material_path is
  'Private Storage object path: {class_id}/{item_id}/{uuid}-{safe_filename}.';
comment on function app.can_read_teaching_material(text) is
  'Staff-only Storage authorization; guardian/student never receive material access.';
