begin;

select plan(19);

select has_table('public', 'academic_years', 'academic years table exists');
select has_table('public', 'sectors', 'sectors table exists');
select has_table('public', 'grade_levels', 'grade levels table exists');
select has_table('public', 'class_templates', 'class templates table exists');
select has_table('public', 'classes', 'classes table exists');
select has_index('public', 'academic_years', 'academic_years_one_current_idx', 'one current year index exists');
select has_index('public', 'classes', 'classes_year_grade_section_idx', 'class uniqueness index exists');
select has_function('public', 'generate_default_classes', array['uuid'], 'class generation RPC exists');
select is((select count(*)::integer from public.sectors), 5, 'five sectors are seeded');
select is((select count(*)::integer from public.grade_levels), 13, 'thirteen grade levels are seeded (no Chien Con 3)');
select is((select count(*)::integer from public.class_templates), 19, 'nineteen class templates are seeded');
select is((select count(*)::integer from public.class_templates where section_code is not null), 10, 'only Au 1..3 and Thieu 1..2 use A/B sections');
select is((select count(*)::integer from public.grade_levels where is_sector_final_level), 5, 'each sector has one final level');
select is((select count(*)::integer from public.grade_levels where can_propose_trainee), 1, 'only Hiep 2 can propose trainee');
select is((select count(*)::integer from public.class_templates where class_kind = 'trainee'), 1, 'exactly one trainee template');
select has_index('public', 'class_templates', 'class_templates_one_trainee_idx', 'single trainee template index exists');
select has_index('public', 'classes', 'classes_one_trainee_per_year_idx', 'single trainee class per year index exists');
select ok((select relrowsecurity from pg_class where oid = 'public.academic_years'::regclass), 'academic years RLS enabled');
select ok((select relrowsecurity from pg_class where oid = 'public.classes'::regclass), 'classes RLS enabled');

select * from finish();
rollback;
