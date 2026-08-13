# M02 — ACADEMIC STRUCTURE · Business Rules

Cột "Nơi enforce" ghi **tất cả** các tầng thực sự chặn được vi phạm.
Cột "Mâu thuẫn docs" chỉ ghi khi có khác biệt thật giữa code và `docs/`.

## 1. Năm học

| Mã | Phát biểu | Nơi enforce | file:line | Mâu thuẫn docs |
|---|---|---|---|---|
| BR-M02-01 | Mã năm học có dạng `YYYY-YYYY` | Zod + CHECK DB | `academic-years/schemas.ts:6`; `20260715000200_academic_structure.sql:8`; HTML `pattern` `admin/page.tsx:77` | Không |
| BR-M02-02 | Mã năm học là duy nhất | UNIQUE | `20260715000200:8` | Không |
| BR-M02-03 | `end_date > start_date` | Zod refine + CHECK | `schemas.ts:13-16`; `20260715000200:20` | Không |
| BR-M02-04 | Năm học mới luôn ở trạng thái `draft` | Server action (giá trị cứng) | `academic-years/server/actions.ts:42` | Không |
| BR-M02-05 | `retention_until = end_date + 5 năm`; không nhỏ hơn `end_date` | Server action + CHECK | `actions.ts:32`; `20260715000200:21` | Không. `docs/03-workflow.md:340` nói "lưu 5 năm" ✔ |
| BR-M02-06 | **Không được có hai năm học `current`** | UNIQUE partial index + logic RPC | `20260715000200:24-25` (index); `:253-259` (RPC đóng năm cũ trước) | Không (`docs/03-workflow.md:33`) |
| BR-M02-07 | Chỉ `super_admin`/`group_leader` được đặt năm hiện hành | Action + RPC | `academic-years/server/permissions.ts:22-28`; `20260715000200:241-243` | Không |
| BR-M02-08 | Chỉ đặt hiện hành được cho năm `draft` hoặc `current` | RPC | `20260715000200:246-251`; UI ẩn nút `admin/page.tsx:56` | Không |
| BR-M02-09 | Thao tác đặt hiện hành phải chống race | `for update` toàn bảng + unique index | `20260715000200:245`, `:24-25` | Không |
| BR-M02-10 | `attendance_lock_days` 0..30; `attendance_edit_lease_minutes` 1..60 | Zod + CHECK + HTML min/max | `schemas.ts:11-12,24-25`; `20260715000200:14-15`; `admin/page.tsx:96,100,131,135` | Không (`docs/03-workflow.md:26-27`) |
| BR-M02-11 | Ngưỡng cảnh báo chuyên cần: liên tiếp 1..20, tỷ lệ 1..100% | Zod + CHECK | `schemas.ts:26-28`; `20260721000500_attendance_alerts_and_score.sql:19-24` | Không (`docs/02-database-design.md:538`) |
| BR-M02-12 | UI nhập `%`, DB lưu tỷ lệ 0..1 | Server action | `actions.ts:122`; ngược lại `admin/page.tsx:148` | Không |
| BR-M02-13 | Mỗi năm học tự có `attendance_weight_settings` | Trigger AFTER INSERT | `20260721000500:74-77` | Không |
| BR-M02-14 | Mỗi năm học tự có `assessment_type_settings` | Trigger AFTER INSERT | `20260722000400_assessments_gradebooks.sql:53-55` | Không |
| BR-M02-15 | Chỉ role global-write được tạo/sửa năm học | Action + RLS | `permissions.ts:7-12`; `20260715000200:281-295` | **CÓ** — `route-map.ts:47` giới hạn `/admin` cho `super_admin`, nên XĐ trưởng/Phó XĐ/Thư ký **không vào được UI** dù `docs/05-permission-matrix.md:35` ghi ✅ |
| BR-M02-16 | Chỉ SA/XĐ trưởng được ghi vào năm `current` | RLS WITH CHECK | `20260715000200:286`, `:294` | **CÓ (nội bộ)** — mâu thuẫn với BR-M02-15: `secretary`/`deputy_group_leader` được action cho phép nhưng bị RLS chặn khi năm là `current` |
| BR-M02-17 | Năm học `closed` không nhận ghi mới (trừ SA) | **KHÔNG ENFORCE Ở ĐÂU** | — | **CÓ** — `docs/03-workflow.md:339` (WF-16 bước 5) yêu cầu, code không có |
| BR-M02-18 | Có trạng thái `archived` sau thời hạn lưu | Enum tồn tại, **không có code nào ghi giá trị này** | `20260715000200:3` | **CÓ** — `docs/03-workflow.md:335-340` |
| BR-M02-19 | Mọi role đăng nhập đều đọc được danh sách năm học | RLS SELECT | `20260715000200:278-280` | **CÓ** — `docs/05-permission-matrix.md:35` ghi "Năm học ❌" cho Phụ huynh/Thiếu nhi |

## 2. Ngành / cấp giáo lý / mẫu lớp

| Mã | Phát biểu | Nơi enforce | file:line | Mâu thuẫn docs |
|---|---|---|---|---|
| BR-M02-20 | Đúng 5 ngành: Chiên Con, Ấu Nhi, Thiếu Nhi, Nghĩa Sĩ, Hiệp Sĩ | Seed (không có UI/API ghi) | `supabase/seed.sql:5-11`; pgTAP `002:13` | Không (quyết định đã chốt) |
| BR-M02-21 | 13 cấp giáo lý; **không có Chiên Con 3** | Seed + `unique (sector_id, level_number)` | `seed.sql:15-32`; `20260715000200:60`; pgTAP `002:14` | Không |
| BR-M02-22 | Mỗi ngành có đúng 1 cấp cuối (`is_sector_final_level`) | Seed | `seed.sql:20,23,26,29,31`; pgTAP `002:17` | Không |
| BR-M02-23 | Chỉ Hiệp 2 được `can_propose_trainee` | Seed | `seed.sql:31`; pgTAP `002:18` | Không |
| BR-M02-24 | A/B là thuộc tính **của cấp**, không của ngành: chỉ Ấu 1..3 và Thiếu 1..2 | Cột `grade_levels.allows_sections` + trigger | `20260716000300_canonical_19_classes.sql:14-15,46-75`; `seed.sql:21-26`; pgTAP `008:52-66` | Không |
| BR-M02-25 | Thiếu 3 là lớp đơn, không A/B | Seed `allows_sections=false` + trigger | `seed.sql:26`; `20260716000300:69-71`; pgTAP `008:52-56` | Không |
| BR-M02-26 | 19 mẫu lớp = 18 giáo lý + 1 Dự trưởng | Seed + `class_templates_one_trainee_idx` | `seed.sql:40-60`; `20260716000300:28-29`; pgTAP `002:15,19` | Không |
| BR-M02-27 | Lớp Dự trưởng không thuộc ngành, không có cấp, không có section, `term_scope='semester_1'` | CHECK `class_templates_kind_shape` / `classes_kind_shape` | `20260716000300:22-26`, `:36-40`; pgTAP `008:67-71` | Không |
| BR-M02-28 | `next_grade_level_id` nối theo `sort_order` | Seed (UPDATE) | `seed.sql:34-37` | Không |
| BR-M02-29 | Danh mục là read-only với mọi role | GRANT chỉ `select` | `20260715000200:270` | Không (chủ đích) |
| BR-M02-30 | `class_templates` ẩn với `guardian`/`student` | RLS | `20260715000200:301-303` | Không |
| BR-M02-31 | `sectors`/`grade_levels` mọi role đọc được | RLS | `20260715000200:297-300` | **CÓ** — matrix ghi ❌ cho Phụ huynh/Thiếu nhi ở dòng "Năm học"; dòng "Ngành/lớp" ghi "lớp con"/"lớp mình" |

## 3. Lớp học

| Mã | Phát biểu | Nơi enforce | file:line | Mâu thuẫn docs |
|---|---|---|---|---|
| BR-M02-32 | Mỗi năm học có tối đa 1 lớp cho mỗi `(grade_level, section)` | UNIQUE index | `20260715000200:102-103`; `docs/03-workflow.md:36` | Không |
| BR-M02-33 | Mỗi năm học có tối đa 1 lớp Dự trưởng | UNIQUE partial index | `20260716000300:42-43`; pgTAP `008:72-76` | Không |
| BR-M02-34 | Lớp `catechism` bắt buộc có `grade_level_id`; lớp `trainee` bắt buộc không có | CHECK | `20260716000300:36-40` | Không |
| BR-M02-35 | Section chỉ được đặt khi cấp cho phép, và **bắt buộc** khi cấp cho phép | Trigger `app.validate_class_section` | `20260716000300:46-75` (`SECTION_REQUIRED` `:68`, `SECTION_NOT_ALLOWED` `:71`) | Không |
| BR-M02-36 | Sinh lớp mặc định là idempotent | `on conflict do nothing` + unique index | `20260716000300:112`; pgTAP `008:45-48` | Không |
| BR-M02-37 | Chỉ role global-write được sinh lớp | RPC + action | `20260716000300:98-100`; `actions.ts:72` | Xem BR-M02-15 |
| BR-M02-38 | **Sinh lớp phải báo lỗi khi không có template** | **KHÔNG ENFORCE** — trả 0 im lặng | `20260716000300:105-116` | **CÓ (ngầm)** — WF-01 bước 2 (`docs/03-workflow.md:19`) giả định luôn sao chép được 19 lớp; `WORKLOG.md:95-100` ghi nhận là bẫy |
| BR-M02-39 | **Không sinh lớp cho năm đã đóng** | **KHÔNG ENFORCE** — chỉ kiểm năm tồn tại | `20260716000300:101-103` | **CÓ** — trái tinh thần WF-16 bước 5 |
| BR-M02-40 | Lớp tạo ra ở trạng thái `active` | DEFAULT | `20260715000200:93` | Không (`docs/03-workflow.md:30`) |
| BR-M02-41 | Chỉ sửa được `status`, `meeting_location`, `notes` của lớp | Zod whitelist | `academic-years/schemas.ts:31-36`; unit test `tests/unit/academic-year-schemas.test.ts:26-35` | Không |
| BR-M02-42 | Sửa lớp cần quyền global-write | Action + RLS | `actions.ts:89`; `20260715000200:311-313` | Không — nhưng **không có UI** để thực hiện (F08) |
| BR-M02-43 | Không xóa lớp (chỉ đổi trạng thái) | Không cấp `delete` cho `authenticated` | `20260715000200:271` | Không |
| BR-M02-44 | Mọi role đăng nhập đọc được danh sách lớp | RLS SELECT | `20260715000200:305-306` | **CÓ** — matrix (`docs/05:36`) ghi Phụ huynh "lớp con", Thiếu nhi "lớp mình"; RLS cho đọc **toàn bộ** lớp. Route `/classes` chặn hai role này nhưng Data API trực tiếp thì không |
| BR-M02-45 | Sĩ số lớp = enrollment `active` + `paused` | Query tầng ứng dụng | `classes/server/queries.ts:7,50` | Không — nhưng xem BR-M03-25 về `paused` |
| BR-M02-46 | Lớp Dự trưởng chỉ hoạt động trong HK1 | **Chỉ lưu `term_scope='semester_1'`; không có ràng buộc vận hành nào** | `20260716000300:38`; UI chỉ là badge tĩnh `classes/page.tsx:65` | **CÓ (một phần)** — `docs/03-workflow.md:30` "lớp Dự trưởng chỉ hoạt động trong HK1"; hệ thống không có mốc HK1/HK2 để enforce ⇒ **NEEDS_CONFIRMATION** |

## 4. Phạm vi truy cập (liên quan M02)

| Mã | Phát biểu | Nơi enforce | file:line | Mâu thuẫn docs |
|---|---|---|---|---|
| BR-M02-47 | `can_access_class` = global-read ∨ lớp của mình ∨ lớp thuộc ngành mình | Function | `20260715000200:183-202` | Không |
| BR-M02-48 | Bản set-based `scope_class_ids()` giữ nguyên ngữ nghĩa `can_access_class` | Function | `20260721000200_scope_lookup_performance.sql:21-43` | Không |
| BR-M02-49 | Phạm vi ngành **không lọc theo năm học** | Function (thiếu điều kiện) | `20260721000200:38-41`; `20260715000200:193-199` | **CÓ (ngầm)** — `role_assignments` bắt buộc `academic_year_id` cho role ngành (`20260715000200:161-163`) nhưng helper phạm vi bỏ qua ⇒ Trưởng ngành đọc được lớp/hồ sơ của **mọi năm** trong ngành đó |
| BR-M02-50 | `/classes` chỉ cho 12 role staff | Route guard | `src/lib/permissions/route-map.ts:27`; `guards.ts:17-21` | Không |
| BR-M02-51 | `/admin` chỉ cho `super_admin` | Route guard | `route-map.ts:47` | Xem BR-M02-15 |

## 5. Tổng hợp mâu thuẫn với docs

| # | Mô tả | Mức |
|---|---|---|
| 1 | BR-M02-17, BR-M02-18: WF-16 (đóng/lưu trữ năm học) chưa được cài | **Cao** |
| 2 | BR-M02-38: sinh lớp im lặng khi thiếu danh mục | **Cao** |
| 3 | BR-M02-49: phạm vi ngành không giới hạn theo năm học | **Cao (bảo mật)** |
| 4 | BR-M02-15 + BR-M02-16: quyền "Năm học" trong matrix (4 role global-write) ≠ route `/admin` (1 role) ≠ RLS năm `current` (2 role) — **ba tầng, ba định nghĩa** | Trung bình |
| 5 | BR-M02-39: sinh lớp cho năm đã đóng | Trung bình |
| 6 | BR-M02-19, BR-M02-31, BR-M02-44: RLS SELECT rộng hơn matrix cho `guardian`/`student` | Trung bình |
| 7 | BR-M02-46: "Dự trưởng chỉ HK1" không có cơ chế enforce | Cần xác nhận |
