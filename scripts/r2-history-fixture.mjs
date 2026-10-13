// Explicitly local, synthetic historical records for R2 browser/JWT checks.
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'node:fs';
if (process.env.R2_FIXTURE !== '1') throw new Error('Set R2_FIXTURE=1 to create local verification data.');
const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
if (!/^http:\/\/(127\.0\.0\.1|localhost):/.test(url ?? '')) throw new Error('Local Supabase only.');
const db=createClient(url,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
async function checked(query) {const {data,error}=await query;if(error) throw new Error(error.message);return data;}
const id=n=>`a2c00000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const yearId=id(1);
const existing=await checked(db.from('academic_years').select('name,status').eq('id',yearId).maybeSingle());
if(existing) {if(existing.name!=='R2 — năm học kiểm chứng')throw new Error('Fixture ID collision');if(existing.status==='closed'){console.log('Historical fixture already exists.');process.exit(0);}}
const current=await checked(db.from('academic_years').select('id').eq('status','current').single());
if(!existing) await checked(db.from('academic_years').insert({id:yearId,code:'2018-2019',name:'R2 — năm học kiểm chứng',start_date:'2018-09-01',end_date:'2019-06-30',retention_until:'2024-06-30',status:'draft'}));
const source=await checked(db.from('enrollments').select('student_id,students(guardian_id),classes(grade_level_id,section_code,grade_levels(sector_id))').eq('academic_year_id',current.id).eq('status','active'));
const fixtures=[];
for(const [offset,sector,label] of [[10,'10000000-0000-0000-0000-000000000002','Ấu'],[20,'10000000-0000-0000-0000-000000000003','Thiếu']]) {
  const first=source.find(row=>row.classes?.grade_levels?.sector_id===sector && row.students?.guardian_id);
  if(!first) throw new Error('Missing seeded current student for sector.');
  const classId=id(offset), alumniId=id(offset+1);
  await checked(db.from('classes').upsert({id:classId,academic_year_id:yearId,grade_level_id:first.classes.grade_level_id,section_code:first.classes.section_code,display_name:`R2 ${label} lịch sử`,status:'active'}));
  await checked(db.from('students').upsert({id:alumniId,guardian_id:first.students.guardian_id,saint_name:'Maria',full_name:`R2 hồ sơ cũ ${label}`,gender:'male',date_of_birth:'2010-01-01',status:'active'}));
  await checked(db.from('enrollments').upsert([first.student_id,alumniId].map((studentId,index)=>({id:id(offset+2+index),student_id:studentId,academic_year_id:yearId,class_id:classId,status:'completed',enrolled_on:'2018-09-01',ended_on:'2019-06-30'}))));
  await checked(db.from('students').update({status:'archived'}).eq('id',alumniId));
  const staffId=id(offset+5);
  const staff=await checked(db.from('staff_profiles').select('id').eq('id',staffId).maybeSingle());
  if(!staff) await checked(db.from('staff_profiles').insert({id:staffId,title:'anh',full_name:`R2 giáo lý viên cũ ${label}`,phone:null,component:'huynh_truong'}));
  await checked(db.from('class_staff_assignments').upsert({id:id(offset+6),class_id:classId,staff_profile_id:staffId,capacity:'representative',starts_on:'2018-09-01',ends_on:'2019-06-30',is_active:false}));
  await checked(db.from('classes').update({status:'closed'}).eq('id',classId));
  fixtures.push({classId,alumniId,currentStudentId:first.student_id,sector});
}
await checked(db.from('academic_years').update({status:'closed'}).eq('id',yearId));
writeFileSync('../REDESIGN/r2-verification/history-fixture.json',JSON.stringify({yearId,fixtures},null,2));
console.log('Created synthetic historical year, 2 closed classes and 4 completed enrollments.');
