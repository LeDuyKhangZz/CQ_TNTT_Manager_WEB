# M03 — STUDENTS & GUARDIANS · Module Discovery

> Giai đoạn 1 — Audit nghiệp vụ (read-only). Mọi khẳng định đều kèm `file:line`.

## 1. Mục tiêu nghiệp vụ

Module giữ **danh tính nghiệp vụ của thiếu nhi** và mối quan hệ với gia đình:

1. **Hồ sơ thiếu nhi** (`students`) với mã `CQxxxx` cấp tự động.
2. **Người giám hộ** (`guardians`) — một em có đúng một guardian, một guardian có nhiều con.
3. **Ghi danh** (`enrollments`) — mỗi em tối đa **một ghi danh đang mở** trong mỗi năm học (D-11).
4. **Dữ liệu nhạy cảm**: hồ sơ sức khỏe (`student_health_profiles`) và bí tích (`student_sacraments`).
5. **Liên kết tài khoản**: `guardians.profile_id` / `students.profile_id` bắt buộc khi có role `guardian`/`student`.

Đây là nguồn sự thật mà M05 (điểm danh), M07 (điểm), M08 (chuyển lớp), M11 (báo cáo), M13 (portal phụ huynh) đều đọc.

## 2. Actor

| Actor | Quyền trong module | Bằng chứng |
|---|---|---|
| `super_admin`, `group_leader`, `deputy_group_leader`, `secretary` | Tạo/sửa thiếu nhi, guardian, sức khỏe, bí tích; ghi danh | `students/server/permissions.ts:10-15`; `enrollments/permissions.ts:6-13` |
| `sector_leader`, `sector_deputy` | **Chỉ** ghi danh (không tạo/sửa hồ sơ) | `enrollments/permissions.ts:6-13` vs `students/server/permissions.ts:10-15` |
| `parish_priest`, `chaplain` | Xem hồ sơ + sức khỏe + bí tích toàn hệ thống (qua `can_global_read`) | `students/server/permissions.ts:21-33`; `20260715000100_identity_foundation.sql:164-167` |
| `class_representative`, `class_teacher`, `trainee_assistant` | Xem hồ sơ + sức khỏe + bí tích **của lớp mình** | `permissions.ts:29-32`; `20260721000200_scope_lookup_performance.sql:120-142` |
| `treasurer` | Vào được `/students` nhưng **RLS trả 0 dòng**; không thấy tab nhạy cảm | `route-map.ts:26`; `20260721000200:120-126`; `permissions.ts:21-33` |
| `guardian` | Bị chặn `/students`; qua RLS chỉ đọc hồ sơ **con mình**, **không** đọc sức khỏe/bí tích | `route-map.ts:26`; `20260721000200:124,128-134` |
| `student` | Tương tự, chỉ đọc hồ sơ **của chính mình** | `20260721000200:124`; pgTAP `010:108-111` |

## 3. Route

| Route | File | Guard | Role |
|---|---|---|---|
| `/students` | `src/app/(dashboard)/students/page.tsx:22-23` | `requireRouteAccess("/students")` (`students/server/queries.ts:25`) | 12 role staff (`route-map.ts:26`) |
| `/students/[studentId]` | `src/app/(dashboard)/students/[studentId]/page.tsx:52-61` | `requireRouteAccess('/students/{id}')` (`queries.ts:112`) | như trên |
| `/classes/[classId]` | `src/app/(dashboard)/classes/[classId]/page.tsx` | (M02) | chứa form ghi danh của M03 |

Tab của trang chi tiết dùng `?tab=` (`[studentId]/page.tsx:48-50,65-66`): `overview` (mặc định), `history`, `sacraments`, `health`.

## 4. Component

| Component | File | Ghi chú |
|---|---|---|
| `StudentsPage` | `src/app/(dashboard)/students/page.tsx:22-167` | Danh sách + form tạo guardian + form tạo thiếu nhi |
| `StudentDetailPage` | `src/app/(dashboard)/students/[studentId]/page.tsx:52-356` | 4 tab, form sửa, form sức khỏe, form bí tích |
| (không có component riêng của feature) | `src/features/students/`, `guardians/`, `enrollments/` chỉ chứa `schemas.ts` + `server/` | Toàn bộ UI nằm trong `app/` |

Module **không có** Client Component; mọi form là `<form action={serverAction}>`.

## 5. Server Action / Service / Query

### `src/features/students/server/actions.ts`
| Hàm | Dòng | Quyền | Ghi chú |
|---|---|---|---|
| `createStudent` | `27-58` | `requireStudentWrite` | Trả `{id, studentCode}` |
| `updateStudent` | `60-88` | `requireStudentWrite` | Payload dựng theo field có mặt (`:65-78`) |
| `saveHealthProfile` | `90-114` | `requireStudentWrite` | `upsert` theo `student_id` (`:106`) |
| `createSacrament` | `116-138` | `requireStudentWrite` | Chỉ **thêm**, không sửa/xóa |
| `*FromForm` (4) | `141-194` | — | **Trả `void`, nuốt kết quả** |

### `src/features/guardians/server/actions.ts`
| Hàm | Dòng | Ghi chú |
|---|---|---|
| `createGuardian` | `23-47` | Dùng `requireStudentWrite` của students (`:27`) |
| `updateGuardian` | `49-70` | **Không có UI nào gọi** |
| `createGuardianFromForm` | `72-79` | Trả `void` |

### `src/features/enrollments/server/actions.ts`
| Hàm | Dòng | Ghi chú |
|---|---|---|
| `requireEnrollmentWrite` | `24-28` | 6 role (`enrollments/permissions.ts:6-13`) |
| `enrollStudent` | `30-67` | Đọc `academic_year_id` **từ lớp** (`:49`); kiểm `class.status='active'` (`:42`) |
| `endEnrollment` | `69-84` | Cập nhật `status` + `ended_on` |
| `*FromForm` | `86-101` | Trả `void` |

### Query — `src/features/students/server/queries.ts`
| Hàm | Dòng | Ghi chú |
|---|---|---|
| `getStudentsPageData` | `24-64` | **Không phân trang, không lọc, không tìm kiếm** (`:28-33`) |
| `getStudentDetail` | `106-231` | Chỉ đọc health/sacraments khi `canViewSensitive` (`:164-199`) |

### Query — `src/features/classes/server/queries.ts` (dùng chung)
| `getClassDetail` | `118-193` | Roster + `availableStudents` cho form ghi danh |

### Schema Zod
| Schema | File:line |
|---|---|
| `createStudentSchema` | `students/schemas.ts:28-42` |
| `updateStudentSchema` | `students/schemas.ts:44-46` (`.partial()` + `id`) |
| `healthProfileSchema` | `students/schemas.ts:48-54` |
| `createSacramentSchema` | `students/schemas.ts:56-70` (refine: `other` bắt buộc có tên) |
| `createGuardianSchema` / `updateGuardianSchema` | `guardians/schemas.ts:11-20` |
| `enrollStudentSchema` | `enrollments/schemas.ts:11-16` |
| `endEnrollmentSchema` + `CLOSE_ENROLLMENT_STATUSES` | `enrollments/schemas.ts:19-31` |

## 6. Bảng DB

| Bảng | Migration | Ghi chú |
|---|---|---|
| `guardians` | `20260716000100_guardians_and_students.sql:13-30` | `profile_id` unique, nullable |
| `students` | `:33-63` | `student_code` mặc định từ **sequence** (`:36-37`); `normalized_full_name` cột sinh (`:49`); index dedup (`:59`) |
| `student_health_profiles` | `:66-78` | PK = `student_id` ⇒ upsert an toàn |
| `student_sacraments` | `:81-108` | Unique 1 bản ghi/loại trừ `other` (`:101-103`) |
| `enrollments` | `20260716000500_enrollments.sql:5-32` | Unique 1 ghi danh mở/em/năm (`:24-26`) |

### Ràng buộc quan trọng
| Ràng buộc | File:line |
|---|---|
| `student_code ~* '^CQ[0-9]{4,}$'` | `20260716000100:53` |
| `date_of_birth <= current_date` | `:54` |
| `guardian_id` NOT NULL, `on delete restrict` | `:38` |
| Bí tích `other` bắt buộc có `sacrament_name` | `:94-97` |
| Ghi danh mở ⇒ `ended_on IS NULL` | `20260716000500:19-20` |
| `ended_on >= enrolled_on` | `:18` |
| Lớp phải cùng năm học với ghi danh | `:49-51` (trigger) |
| Ghi danh mở chỉ vào lớp `active` | `:52-54` (trigger) |
| Role `guardian`/`student` bắt buộc có liên kết hồ sơ | `20260716000200_account_identity_links.sql:9-19` |

## 7. Role / Permission

| Tầng | Cơ chế | file:line |
|---|---|---|
| Route | `/students` cho 12 role staff | `route-map.ts:26` |
| Action ghi hồ sơ | 4 role global-write | `students/server/permissions.ts:10-15,43-47` |
| Action ghi danh | 6 role (thêm Trưởng/Phó ngành) | `enrollments/permissions.ts:6-13` |
| Hiển thị tab nhạy cảm | 11 role (loại `treasurer`, `guardian`, `student`) | `students/server/permissions.ts:21-33` |
| RLS `students` SELECT | global-read ∨ `own_student_ids()` ∨ `class_scoped_student_ids()` | `20260721000200:119-126` |
| RLS `students` INSERT/UPDATE | `can_global_write()` ∧ `updated_by = auth.uid()` | `20260716000100:201-207` |
| RLS `guardians` SELECT | global-read ∨ `profile_id = auth.uid()` | `20260716000100:186-188` (+ tối ưu `20260724000100`) |
| RLS health/sacraments SELECT | global-read ∨ `class_scoped_student_ids()` — **không bao giờ guardian/student** | `20260721000200:128-142` |
| RLS `enrollments` | SELECT theo 4 nhánh; INSERT/UPDATE `can_manage_class()` | `20260721000200:144-152`; `20260716000500:146-152` |
| Hàm phạm vi | `app.can_access_student`, `app.can_view_student_sensitive`, `app.can_manage_class` | `20260716000500:66-130` |

## 8. Module phụ thuộc

**M03 phụ thuộc:** M01 (auth/profiles/role), M02 (`academic_years`, `classes`, `app.can_manage_class` dựa trên `grade_levels.sector_id`).

**Phụ thuộc vào M03:**

| Module | Phụ thuộc |
|---|---|
| M05 Attendance | `enrollments` (danh sách điểm danh), `students` |
| M07 Assessments | `assessment_scores.enrollment_id`, `student_id` (`20260722000400:305-316`) |
| M08 Promotions | Ghi danh của năm cũ → năm mới; `previous_enrollment_id` |
| M11 Reports | Sĩ số, hồ sơ, cảnh báo |
| M12 Imports | Tạo hàng loạt `guardians`/`students`/`enrollments`; **đã có** module dedup (`src/features/imports/dedup.ts`) |
| M13 Portal | `own_student_ids()` cho phụ huynh/thiếu nhi |
| M01 Auth | `adminProvisionAccount` bắt buộc link `guardians`/`students` (`src/features/auth/server/actions.ts:130-152`) |

## 9. Mức độ quan trọng

**P0.** Chứa **dữ liệu cá nhân của trẻ em** (ngày sinh, địa chỉ, điện thoại) và **dữ liệu nhạy cảm** (sức khỏe, bí tích). Sai phạm vi ở đây là sự cố bảo mật, không chỉ là lỗi chức năng.

## 10. Tình trạng test

| Loại | File | Bao phủ | Thiếu |
|---|---|---|---|
| pgTAP | `supabase/tests/006_guardians_students_test.sql` (plan 26) | Cấu trúc, CHECK ngày sinh/mã, RLS: global reader thấy hết (`:82-84`), guardian chỉ thấy con (`:95-99`), **guardian/student không đọc được sức khỏe & bí tích** (`:98-99,109`) | Không kiểm `treasurer`; không kiểm sinh mã đồng thời |
| pgTAP | `supabase/tests/009_enrollments_test.sql` (plan 16) | GLV lớp tiếp cận em trong lớp (`:48-52`), GLV lớp khác không (`:60`), guardian/self (`:64-67`), ràng buộc (`:71-81`) | Không kiểm ghi danh trùng (`23505`) một cách tường minh; **không kiểm `status='paused'` kèm `ended_on`** |
| pgTAP | `supabase/tests/010_core_rls_test.sql` (plan 28) | Trưởng ngành chỉ thấy ngành mình (`:72-78`), GLV chỉ thấy lớp mình (`:82-88`), guardian/student (`:97-111`) | Không kiểm `treasurer`; không kiểm phạm vi **theo năm học** |
| Integration | `tests/integration/gate-phase2-scope.test.ts` | Phạm vi đọc trên ~900 em bằng **JWT thật** cho từng vai (chạy có cờ `GATE_PHASE2=1`) | Chạy có điều kiện ⇒ không nằm trong CI mặc định |
| Unit | — | **Không có test nào cho `students/schemas.ts`, `guardians/schemas.ts`, `enrollments/schemas.ts`** | Toàn bộ |
| E2E | `tests/e2e/authenticated-shell.spec.ts:48-105`, `security.spec.ts:48-51,88` | Vào được `/students`, GLV lớp không thấy link em ngoài lớp, 404 với UUID sai | Không có E2E cho tạo hồ sơ / ghi danh |

**Kết luận test:** phân quyền đọc được phủ **rất tốt** (3 file pgTAP + 1 integration JWT thật). **Luồng ghi (tạo/sửa/ghi danh/kết thúc) gần như không có test** — và đó chính là nơi có lỗi nghiêm trọng nhất của module (xem `03_AUDIT_RESULTS.md`).
