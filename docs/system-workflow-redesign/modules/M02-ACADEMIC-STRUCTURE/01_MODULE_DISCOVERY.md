# M02 — ACADEMIC STRUCTURE · Module Discovery

> Giai đoạn 1 — Audit nghiệp vụ (read-only). Mọi khẳng định đều kèm `file:line`.

## 1. Mục tiêu nghiệp vụ

Module này là **nền móng thời gian và tổ chức** của toàn hệ thống:

1. Định nghĩa **năm học** (`academic_years`) và vòng đời `draft → current → closed → archived`.
2. Giữ **danh mục cố định** 5 ngành (`sectors`), 13 cấp giáo lý (`grade_levels`), 19 mẫu lớp (`class_templates`).
3. **Sinh 19 lớp mặc định** cho mỗi năm học (18 lớp giáo lý + 1 lớp Dự trưởng HK1) — WF-01.
4. Giữ **cấu hình vận hành theo năm học**: khóa điểm danh, lease chỉnh sửa, ngưỡng cảnh báo chuyên cần, bật/tắt Top 5, trọng số điểm danh, loại điểm.
5. **Lưu trữ/đóng năm học** — WF-16.

Mọi module khác (ghi danh, điểm danh, giáo án, điểm số, chuyển lớp, báo cáo) đều neo vào `academic_year_id` và `class_id` do module này tạo ra.

## 2. Actor

| Actor | Vai trò trong module | Nguồn |
|---|---|---|
| `super_admin` | Toàn quyền: tạo năm học, sinh lớp, đặt hiện hành, cấu hình điểm danh | `src/lib/permissions/route-map.ts:47` |
| `group_leader` | Theo docs/05 §3 có ✅ "Năm học"/"Ngành–lớp"; **thực tế không vào được `/admin`** | `src/features/academic-years/server/permissions.ts:7-12` vs `route-map.ts:47` |
| `deputy_group_leader`, `secretary` | Như trên (server action cho phép, route chặn) | `permissions.ts:7-12` |
| `parish_priest`, `chaplain`, `treasurer` | Chỉ xem danh sách lớp | `route-map.ts:27` |
| `sector_leader`/`sector_deputy` | Xem lớp; theo docs/05 phải có ✅📍 trên "Ngành/lớp" — **chưa có UI sửa lớp** | `route-map.ts:27` |
| Role lớp (`class_representative`, `class_teacher`, `trainee_assistant`) | Xem danh sách lớp + chi tiết lớp mình | `route-map.ts:27` |
| `guardian`, `student` | Bị chặn khỏi `/classes` ở tầng route | `route-map.ts:27`, `canAccessRoute` `route-map.ts:56-63` |

## 3. Route

| Route | File | Guard | Role được phép |
|---|---|---|---|
| `/admin` | `src/app/(dashboard)/admin/page.tsx:22-23` | `requireRouteAccess("/admin")` | `super_admin` (`route-map.ts:47`) |
| `/classes` | `src/app/(dashboard)/classes/page.tsx:25-26` | `requireRouteAccess("/classes")` trong query | 12 role staff (`route-map.ts:27`) |
| `/classes/[classId]` | `src/app/(dashboard)/classes/[classId]/page.tsx:16-19` | `requireRouteAccess('/classes/{id}')` (`classes/server/queries.ts:123`) | như trên |

## 4. Component

| Component | File | Ghi chú |
|---|---|---|
| `AdminPage` | `src/app/(dashboard)/admin/page.tsx` | Server Component, 3 card: danh sách năm học, tạo năm học, cấu hình điểm danh |
| `ClassesPage` | `src/app/(dashboard)/classes/page.tsx` | Nhóm theo ngành + section Dự trưởng |
| `ClassCardLink` | `src/app/(dashboard)/classes/page.tsx:8-23` | Card lớp: tên, sĩ số, GLV đại diện, số GLV |
| `ClassDetailPage` | `src/app/(dashboard)/classes/[classId]/page.tsx` | Roster + đội ngũ + form ghi danh |
| `AcademicYearSwitcher` | `src/components/layout/academic-year-switcher.tsx:3-11` | **Stub `disabled`, chuỗi "Năm học 2026–2027" hardcode**, dùng ở `app-header.tsx:18` |
| `PageContainer`, `PageHeader`, `Card`, `Badge`, `Button`, `Input`, `Label` | `src/components/{layout,ui}` | Dùng lại, không có component riêng của module |

Ghi chú: module **không có** component client nào; tất cả form đều là `<form action={serverAction}>` progressive-enhancement.

## 5. Server Action / Service / Query

### Server Actions — `src/features/academic-years/server/actions.ts`

| Hàm | Dòng | Quyền | Ghi chú |
|---|---|---|---|
| `createAcademicYear` | `27-51` | `requireAcademicWrite` | Tự tính `retention_until = end_date + 5 năm` (`:32`), tạo status `draft` (`:42`) |
| `setCurrentAcademicYear` | `53-68` | `requireSetCurrentYear` (SA + XĐ trưởng) | Gọi RPC `set_current_academic_year` |
| `generateDefaultClasses` | `70-85` | `requireAcademicWrite` | Gọi RPC `generate_default_classes`, trả `inserted` |
| `updateClass` | `87-105` | `requireAcademicWrite` | **Không có UI nào gọi** (orphan) |
| `updateAttendanceSettings` | `107-133` | `requireAcademicWrite` | Quy đổi `%` → tỷ lệ 0..1 (`:122`) |
| `*FromForm` (4 hàm) | `135-164` | — | **Trả `void`, nuốt toàn bộ `AcademicActionResult`** |

### Query — `src/features/academic-years/server/queries.ts`

| Hàm | Dòng | Ghi chú |
|---|---|---|
| `listAcademicYears` | `12-23` | Kèm `classes(count)`; lỗi → trả `[]` (`:19`) |
| `getCurrentAttendanceSettings` | `37-48` | Lấy năm `status='current'` |

### Query — `src/features/classes/server/queries.ts`

| Hàm | Dòng | Ghi chú |
|---|---|---|
| `getClassesPageData` | `56-104` | Chỉ đọc lớp của năm `current` (`:60-64`, `:75`) |
| `getClassDetail` | `118-193` | **Không lọc theo năm học** — chi tiết lớp của năm cũ vẫn mở được |
| `toCard` | `42-54` | Sĩ số = enrollment `active`/`paused` (`OPEN_STATUSES` `:7`) |

### Schema Zod — `src/features/academic-years/schemas.ts`

| Schema | Dòng |
|---|---|
| `academicYearInputSchema` | `5-16` (regex `^\d{4}-\d{4}$`, `endDate > startDate`) |
| `academicYearIdSchema` | `18` |
| `attendanceSettingsSchema` | `22-29` (khớp CHECK trong migration `...000500`) |
| `updateClassSchema` | `31-36` (whitelist `status`, `meetingLocation`, `notes`) |

### RPC / Function DB

| Function | File:line | Security |
|---|---|---|
| `public.generate_default_classes(uuid)` | `20260716000300_canonical_19_classes.sql:89-117` (bản v2) | `security definer`, kiểm `app.can_global_write()` (`:98`) |
| `public.set_current_academic_year(uuid)` | `20260715000200_academic_structure.sql:234-261` | `security definer`, chỉ `super_admin`/`group_leader` (`:241`) |
| `app.validate_class_section()` | `20260716000300:46-75` | Trigger BEFORE INSERT/UPDATE trên `classes`, `class_templates` |
| `app.can_access_class(uuid)` | `20260715000200:183-202` | Mở rộng thêm nhánh ngành |
| `app.scope_class_ids()` | `20260721000200:21-43` | Bản set-based, **không lọc theo năm học** |

## 6. Bảng DB

| Bảng | Migration | Vai trò |
|---|---|---|
| `academic_years` | `20260715000200:6-22`, +cột cảnh báo `20260721000500:18-24`, +`20260722000400:10` | Năm học + cấu hình |
| `sectors` | `20260715000200:31-41` | 5 ngành (seed `seed.sql:5-11`) |
| `grade_levels` | `20260715000200:47-62`, +`allows_sections` `20260716000300:14-15` | 13 cấp (seed `seed.sql:15-32`) |
| `class_templates` | `20260715000200:68-85`, +`class_kind`/`term_scope` `20260716000300:18-29` | 19 mẫu (seed `seed.sql:40-60`) |
| `classes` | `20260715000200:87-108`, +`20260716000300:32-43` | Lớp thực của một năm |
| `attendance_weight_settings` | `20260721000500:36` + trigger seed `:74-77` | Tự sinh khi tạo năm học |
| `assessment_type_settings` | `20260722000400:18-26` + trigger seed `:53-55` | Tự sinh khi tạo năm học |

### Ràng buộc quan trọng

| Ràng buộc | File:line |
|---|---|
| Chỉ một năm `current` | `20260715000200:24-25` (unique partial index) |
| `end_date > start_date` | `20260715000200:20` |
| `retention_until >= end_date` | `20260715000200:21` |
| Không trùng `(year, grade, section)` | `20260715000200:102-103` |
| Đúng 1 lớp Dự trưởng/năm | `20260716000300:42-43` |
| Trainee ⇒ không grade/section, `semester_1` | `20260716000300:36-40` |
| Section chỉ khi `grade_levels.allows_sections` | `20260716000300:46-75` |
| `sort_order` unique trên `sectors`/`grade_levels`/`class_templates` | `20260715000200:36,57,73` |

## 7. Role / Permission

| Lớp | Cơ chế | File:line |
|---|---|---|
| Route | `ROUTE_RULES` + `canAccessRoute` | `route-map.ts:19-63` |
| Server action | `requireAcademicWrite` (4 role global-write), `requireSetCurrentYear` (2 role) | `academic-years/server/permissions.ts:14-28` |
| RPC | `app.can_global_write()` / `app.current_role() in (super_admin, group_leader)` | `20260716000300:98`, `20260715000200:241` |
| RLS `academic_years` | SELECT: mọi role có `current_role()`; INSERT/UPDATE: `can_global_write()` **và** `updated_by = auth.uid()` **và** (`status <> 'current'` hoặc SA/XĐT) | `20260715000200:278-295` |
| RLS `classes` | SELECT: mọi authenticated; INSERT/UPDATE: `can_global_write()` | `20260715000200:305-313` |
| RLS `sectors`/`grade_levels` | SELECT: mọi authenticated | `20260715000200:297-300` |
| RLS `class_templates` | SELECT: mọi role trừ `guardian`/`student` | `20260715000200:301-303` |

## 8. Module phụ thuộc

**Module này phụ thuộc:** M01 (auth/role — `app.current_role()`, `profiles`).

**Module phụ thuộc vào M02:**

| Module | Phụ thuộc |
|---|---|
| M03 Students/Guardians | `enrollments.academic_year_id`, `class_id`, `app.can_manage_class` |
| M04 Staff | `class_staff_assignments.class_id`, `role_assignments.academic_year_id/sector_id/class_id` |
| M05 Attendance | `attendance_lock_days`, `attendance_edit_lease_minutes`, ngưỡng cảnh báo, `attendance_weight_settings` |
| M06 Teaching plans | `class_id`, khoảng ngày `start_date..end_date` (`20260722000400:199-211`) |
| M07 Assessments | `assessment_type_settings`, `gradebook_locks.academic_year_id` |
| M08 Promotions | `grade_levels.next_grade_level_id`, `is_sector_final_level`, `requires_sacrament_review` |
| M11 Reports/Dashboard | Lọc theo năm học |
| M12 Imports | Ánh xạ tên lớp → `classes` của năm hiện hành |

## 9. Mức độ quan trọng

**P0 — nền móng.** Nếu 19 lớp không được sinh, `/classes` rỗng và **mọi** module vận hành (điểm danh, giáo án, điểm, báo cáo) không có dữ liệu để bám. Sự cố này **đã xảy ra thật trên production** (`WORKLOG.md:95-100`).

## 10. Tình trạng test

| Loại | File | Bao phủ | Thiếu |
|---|---|---|---|
| pgTAP | `supabase/tests/002_academic_structure_test.sql:13-23` (plan 19) | Seed 5 ngành/13 cấp/19 template, 10 lớp có section, RLS bật | Không kiểm unique "một năm current"; không kiểm `set_current_academic_year` |
| pgTAP | `supabase/tests/008_canonical_classes_test.sql:26-76` (plan 13) | Sinh đúng 19 lớp, idempotent (lần 2 = 0), Thiếu 3 không A/B, Thiếu 1 bắt buộc section, 1 trainee/năm | **Không kiểm `class_templates` rỗng**; không kiểm sinh lớp cho năm đã `closed` |
| Unit | `tests/unit/academic-year-schemas.test.ts:5-35` | Range hợp lệ/không hợp lệ, whitelist field `updateClass` | Không kiểm regex `code`, không kiểm `attendanceSettingsSchema` |
| E2E | `tests/e2e/responsive.spec.ts:100-101,126-128` | `/students`, `/classes`, `/admin` không tràn ngang, tap target ≥44px ở 360/768/1366 | Không có E2E cho luồng tạo năm học/sinh lớp |
| E2E | `tests/e2e/security.spec.ts:48-51` | `/classes/{uuid lạ}` và `/classes/{không phải uuid}` → 404 | — |

**Kết luận test:** ràng buộc DB được phủ tốt; **luồng nghiệp vụ đầu-cuối (tạo năm → sinh lớp → đặt hiện hành → đóng năm) hoàn toàn chưa có test**.
