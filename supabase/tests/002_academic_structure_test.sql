begin;

select plan(16);

select has_table('public', 'academic_years', 'academic years table exists');
select has_table('public', 'sectors', 'sectors table exists');
select has_table('public', 'grade_levels', 'grade levels table exists');
select has_table('public', 'class_templates', 'class templates table exists');
select has_table('public', 'classes', 'classes table exists');
select has_index('public', 'academic_years', 'academic_years_one_current_idx', 'one current year index exists');
select has_index('public', 'classes', 'classes_year_grade_section_idx', 'class uniqueness index exists');
select has_function('public', 'generate_default_classes', array['uuid'], 'class generation RPC exists');
select is((select count(*)::integer from public.sectors), 5, 'five sectors are seeded');
select is((select count(*)::integer from public.grade_levels), 14, 'fourteen grade levels are seeded');
select is((select count(*)::integer from public.class_templates), 20, 'twenty class templates are seeded');
select is((select count(*)::integer from public.class_templates where section_code is not null), 12, 'Au and Thieu templates use A/B sections');
select is((select count(*)::integer from public.grade_levels where is_sector_final_level), 5, 'each sector has one final level');
select is((select count(*)::integer from public.grade_levels where can_propose_trainee), 1, 'only Hiep 2 can propose trainee');
select ok((select relrowsecurity from pg_class where oid = 'public.academic_years'::regclass), 'academic years RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.classes'::regclass), 'classes RLS enabled');

select * from finish();
rollback;
