# M03 — STUDENTS & GUARDIANS · Business Rules

> Quy tắc nghiệp vụ **trích từ code đang chạy**, không phải từ mong muốn.
> Cột "Nơi enforce" cho biết luật được giữ ở đâu — luật chỉ nằm ở UI là luật **có thể bị lách**.

Ký hiệu nơi enforce: `UI` · `Zod` (schema) · `Action` (server action) · `CHECK`/`UNIQUE`/`FK` (ràng buộc DB) ·
`TRG` (trigger) · `RLS` (row-level security).

---

## 1. Danh tính thiếu nhi

| Mã | Phát biểu | Nơi enforce | file:line | Đối chiếu docs |
|---|---|---|---|---|
| BR-M03-01 | Mỗi thiếu nhi có mã `CQxxxx` sinh tự động, không nhập tay | `CHECK` + sequence | `20260716000100:8-10,36-37,53` | ✅ WF-02, D-27 |
| BR-M03-02 | Mã thiếu nhi phải khớp `^CQ[0-9]{4,}$` | `CHECK` | `20260716000100:53` | ✅ |
| BR-M03-03 | Ngày sinh không được ở tương lai | `CHECK` | `20260716000100:54` | ✅ |
| BR-M03-04 | Mỗi thiếu nhi có **đúng một** người giám hộ, không được để trống | `FK NOT NULL` + `on delete restrict` | `20260716000100:38` | ✅ D-24 |
| BR-M03-05 | Không hard delete hồ sơ thiếu nhi; chỉ đổi trạng thái | `grant` (không cấp `delete`) | `20260716000100:176-179` | ✅ AGENTS §6 |
| BR-M03-06 | Mã thiếu nhi **không** hiển thị ở bảng danh sách mặc định | `UI` | `students/page.tsx` | ✅ AGENTS §8 |
| BR-M03-07 | Tên được chuẩn hóa vào cột sinh `normalized_full_name` phục vụ dò trùng | `DB (generated column)` | `20260716000100:49`, index `:59` | ⚠️ **hạ tầng có, chưa dùng cho nhập tay** — xem BR-M03-31 |

## 2. Người giám hộ

| Mã | Phát biểu | Nơi enforce | file:line | Đối chiếu docs |
|---|---|---|---|---|
| BR-M03-08 | Một người giám hộ có thể có nhiều con | `FK` (không unique) | `20260716000100:38` | ✅ D-24 |
| BR-M03-09 | `guardians.profile_id` là duy nhất (một tài khoản ↔ một hồ sơ giám hộ) | `UNIQUE` | `20260716000100:13-30` | ✅ |
| BR-M03-10 | Tài khoản có role `guardian` **bắt buộc** liên kết `guardians.profile_id` | `TRG` | `20260716000200:9-19` | ✅ WF-02, D-28 |
| BR-M03-11 | ❌ **Không có** ràng buộc chống trùng người giám hộ theo tên/số điện thoại | — | *(không tồn tại)* | ⚠️ WF-03 b4 yêu cầu cảnh báo |
| BR-M03-12 | Số điện thoại giám hộ chỉ kiểm độ dài, không kiểm định dạng | `Zod` | `guardians/schemas.ts:13` | ⚠️ số này về sau thành tên đăng nhập (`auth/actions.ts:139`) |

## 3. Ghi danh (enrollment)

| Mã | Phát biểu | Nơi enforce | file:line | Đối chiếu docs |
|---|---|---|---|---|
| BR-M03-13 | Mỗi em tối đa **một ghi danh đang mở** trong một năm học | `UNIQUE` (partial index) | `20260716000500:24-26` | ✅ D-11, WF-03 b7 |
| BR-M03-14 | Ghi danh **đang mở** (`active`, `paused`) bắt buộc `ended_on IS NULL` | `CHECK` | `20260716000500:19-20` | ✅ |
| BR-M03-15 | `ended_on >= enrolled_on` | `CHECK` | `20260716000500:18` | ✅ |
| BR-M03-16 | Lớp của ghi danh phải cùng năm học với ghi danh | `TRG` | `20260716000500:49-51` | ✅ |
| BR-M03-17 | Ghi danh mở chỉ vào lớp trạng thái `active` | `TRG` | `20260716000500:52-54` | ✅ |
| BR-M03-18 | Năm học của ghi danh lấy **từ lớp**, không nhận từ client | `Action` | `enrollments/server/actions.ts:49` | ✅ AGENTS §5 |
| BR-M03-19 | ⚠️ **`paused` bị hai tầng định nghĩa trái ngược**: DB coi là trạng thái MỞ, ứng dụng xếp vào danh sách trạng thái ĐÓNG | `CHECK` vs `Zod` | `20260716000500:19-20` vs `enrollments/schemas.ts:19-25` | ❌ **mâu thuẫn → CRITICAL F10** |
| BR-M03-20 | ❌ **Không có** luật chặn ghi danh cho em đã lưu trữ/rút | — | *(không tồn tại)* | ⚠️ |
| BR-M03-21 | ❌ **Không có** luồng khôi phục ghi danh đã tạm nghỉ | — | `docs/11:62` yêu cầu `resumeEnrollment` | ❌ thiếu |
| BR-M03-22 | `previous_enrollment_id` tồn tại nhưng **chưa bao giờ được ghi giá trị** | — | `20260716000500:13` | ⚠️ mất vết chuyển lớp |

## 4. Dữ liệu nhạy cảm (sức khỏe & bí tích)

| Mã | Phát biểu | Nơi enforce | file:line | Đối chiếu docs |
|---|---|---|---|---|
| BR-M03-23 | Hồ sơ sức khỏe: mỗi em tối đa một bản ghi (PK = `student_id`) ⇒ ghi lại là idempotent | `PK` + `upsert` | `20260716000100:66-78`; `students/server/actions.ts:106` | ✅ |
| BR-M03-24 | Mỗi loại bí tích chỉ một bản ghi/em, trừ loại `other` | `UNIQUE` (partial) | `20260716000100:101-103` | ✅ |
| BR-M03-25 | Bí tích loại `other` bắt buộc có tên tự nhập | `CHECK` + `Zod refine` | `20260716000100:94-97`; `students/schemas.ts:56-70` | ✅ |
| BR-M03-26 | **Phụ huynh và thiếu nhi KHÔNG BAO GIỜ đọc được sức khỏe/bí tích** | `RLS` (không có nhánh nào cho họ) | `20260721000200:128-142` | ✅ §5.2, §5.3 — pgTAP `006:98-99,109` |
| BR-M03-27 | Sức khỏe không hiển thị trong danh sách tổng | `UI` + `Action` | `students/server/queries.ts:164-199` | ✅ §5.3 |
| BR-M03-28 | Bí tích chỉ **thêm được**, không sửa/xóa qua giao diện | `Action` (thiếu chức năng) | `students/server/actions.ts:116-138` | ❌ `docs/11:51` yêu cầu `upsertStudentSacrament` |
| BR-M03-29 | Trưởng/Phó ngành và GLV **chỉ đọc** sức khỏe/bí tích, không ghi | `Action` | `students/server/permissions.ts:10-15` | ⚠️ `docs/05:36-37` cho quyền ✅ ghi → **code an toàn hơn docs** |

## 5. Phân quyền dữ liệu

| Mã | Phát biểu | Nơi enforce | file:line | Đối chiếu docs |
|---|---|---|---|---|
| BR-M03-30 | Ghi hồ sơ thiếu nhi/giám hộ: chỉ 4 role global-write | `Action` + `RLS` | `students/server/permissions.ts:10-15`; `20260716000100:201-207` | ⚠️ `docs/05:184` cho Trưởng/Phó ngành → **lệch, cần chốt** |
| BR-M03-31 | Ghi danh: 4 role global-write **+ Trưởng/Phó ngành đúng ngành** | `Action` + `RLS` | `enrollments/permissions.ts:6-13`; `20260716000500:66-87` | ✅ |
| BR-M03-32 | Đọc hồ sơ: global-read ∨ con mình ∨ em trong lớp/ngành mình | `RLS` | `20260721000200:119-126` | ✅ pgTAP `010` |
| BR-M03-33 | Ghi hồ sơ bắt buộc `updated_by = auth.uid()` — không nhận từ client | `RLS` | `20260716000100:201-207` | ✅ AGENTS §5 |
| BR-M03-34 | Thủ quỹ vào được `/students` nhưng RLS trả 0 dòng | `route-map` + `RLS` | `route-map.ts:26`; `20260721000200:120-126` | ⚠️ an toàn, nhưng hiển thị như "chưa có dữ liệu" |

## 6. Quy tắc bị VI PHẠM hoặc THIẾU (tổng hợp)

| Mã | Luật theo tài liệu | Hiện trạng code | Mức |
|---|---|---|---|
| BR-M03-35 | WF-03 b4: "Hệ thống cảnh báo trùng gần đúng; người nhập vẫn được tiếp tục" (`docs/03:92`) | **Không tồn tại** ở đường nhập tay; chỉ có ở đường Import (`imports/dedup.ts`) | **CRITICAL** |
| BR-M03-36 | `paused` phải là trạng thái tạm nghỉ dùng được | Chọn "Tạm nghỉ" **luôn thất bại im lặng** (vi phạm CHECK) | **CRITICAL** |
| BR-M03-37 | Lưu trữ hồ sơ phải đồng bộ với ghi danh | Hai trục trạng thái **không có luật ràng buộc nào**; em `archived` vẫn nằm trong sĩ số | NEEDS_IMPROVEMENT |
| BR-M03-38 | Mọi thao tác ghi phải báo kết quả cho người dùng | Toàn bộ `*FromForm` trả `void`, nuốt kết quả | NEEDS_IMPROVEMENT |
| BR-M03-39 | Thao tác bị RLS từ chối phải báo lỗi | `.update()` không `.select()` ⇒ 0 dòng vẫn trả `ok:true` | NEEDS_IMPROVEMENT |
| BR-M03-40 | `docs/11:52` yêu cầu action `archiveStudent` riêng | Chỉ là một mục trong `<select>` chung form | NEEDS_IMPROVEMENT |
| BR-M03-41 | Giám hộ phải sửa được | `updateGuardian` đã viết nhưng **không màn hình nào gọi** | NEEDS_IMPROVEMENT |

---

## 7. Nhận định

**Tầng DB của module này viết tốt.** 15/41 luật được giữ bằng `CHECK`/`UNIQUE`/`FK`/`TRIGGER`/`RLS` — tức
không lách được kể cả khi gọi thẳng vào cơ sở dữ liệu. Đặc biệt BR-M03-13 (một ghi danh mở/năm) và
BR-M03-26 (phụ huynh không đọc được sức khỏe) là hai luật quan trọng nhất, và cả hai đều được chốt ở
tầng thấp nhất kèm kiểm thử pgTAP.

**Vấn đề nằm ở tầng ứng dụng**, tập trung vào ba nhóm:
1. **Mâu thuẫn khái niệm `paused`** (BR-M03-19) — DB đúng, ứng dụng sai, kết quả là một chức năng
   không bao giờ chạy được.
2. **Luật "cảnh báo trùng" bị bỏ quên ở một nửa hệ thống** (BR-M03-35) — cùng một bảng, đường Excel
   có kiểm, đường nhập tay không.
3. **Không có kênh phản hồi** (BR-M03-38, 39) — làm cho hai vấn đề trên trở nên vô hình với người dùng.
