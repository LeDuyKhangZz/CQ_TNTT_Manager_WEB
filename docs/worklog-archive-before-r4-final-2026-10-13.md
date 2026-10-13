# WORKLOG archive before R4 final

### [2026-08-19] Phiên 74 — Claude — `STAFF-COMP-001` (ngoài 2B — yêu cầu trực tiếp của chủ dự án)

- **Claim:** chủ dự án đang dán khối §4.3 của `NHAP_LIEU_HANG_LOAT.md` thì hỏi: *"về phần trợ tá là
  1 vai trò mới hình như không có trong hệ thống thì hệ thống hiện tại xử lí sao với người này?"*,
  rồi *"họ là trợ tá, không phải giáo lí viên, họ thường là phụ huynh của 1 hoặc nhiều em thiếu nhi
  trong giáo xứ, họ thường hỗ trợ, làm đồ ăn sáng cho thiếu nhi, không liên quan gì đến việc dạy học
  như glv"*, và cuối cùng: *"vậy bạn ko sửa code gì à? vì họ là trợ tá ko phải giáo lí viên thì sao
  vai trò lại có thể nhập là glv lớp được hay mã sao có thể giống mng là GLVXXX được"*.
- **Đã hỏi lại trước khi code** — bốn mức, chủ dự án chọn **"Thêm cột + đổi mã thành TT001"**
  (mức 2/4). Mức 1 (chỉ thêm cột) và mức 4 (không nhập trợ tá) bị loại.
- **Đo trước khi sửa, không đoán:** `app_role` có 14 giá trị, **không** giá trị nào là Trợ tá;
  `class_staff_capacity` chỉ có `representative|member|trainee`; `staff_code` sinh từ
  `('GLV' || lpad(nextval(staff_code_seq),3,'0'))` và bị `staff_profiles_code_format` chốt
  `^GLV[0-9]{3,}$`. Riêng `NormalizedStaffRow.component` **đã tồn tại từ IMP-BULK-001** — đọc đúng
  cột `Thành phần` rồi bỏ, vì không có cột nào để ghi.
- **Làm được:**
  1. **`staff_component`** — enum 7 giá trị (`huynh_truong` · `du_truong` · `nu_tu` · `chung_sinh` ·
     `linh_muc` · `tro_ta` · `khac`) + cột `staff_profiles.component not null default 'khac'`.
     Mặc định cố ý là `khac` ("Chưa phân loại"), **không** phải `huynh_truong`: đoán bừa ở cột sinh
     ra để nói đúng về một người là biến nó thành chỗ nói sai có hệ thống.
  2. **Mã hồ sơ theo thành phần.** Bỏ DEFAULT của `staff_code`, thay bằng trigger
     `app.assign_staff_code()` (BEFORE INSERT): `tro_ta` ⇒ `TT` + `assistant_code_seq`, còn lại ⇒
     `GLV` + `staff_code_seq`. **Sequence riêng** để hai dãy mã không đục lỗ của nhau. CHECK nới
     đúng hai tiền tố (`^(GLV|TT)[0-9]{3,}$`), không nới thành "chữ gì cũng được" — dạng mã là thứ
     `deriveLoginAlias` dựa vào để phân biệt nhân sự với tài khoản thường.
     🔴 **Không có trigger UPDATE**: đổi `component` KHÔNG đánh lại mã (mã = tên đăng nhập).
  3. **Backfill trong migration — chỉ chỗ dữ liệu tự nói ra:** `title='so'` ⇒ `nu_tu`, `'cha'` ⇒
     `linh_muc`, `'thay'` ⇒ `chung_sinh`, phân công đang hoạt động `capacity='trainee'` ⇒
     `du_truong`. Còn lại để `khac`.
  4. **Tầng ứng dụng:** `parseStaffComponent()` (khớp theo *chứa chữ* vì ô trong sổ là văn bản gõ
     tay: "Huynh trưởng/ Phó ngành Ấu", "Sổ DỰ TRƯỞNG 1") · ghi vào cả đường tạo tay lẫn đường dán
     hàng loạt · lượt dán **nâng `khac` lên giá trị thật** và **đếm riêng** (`componentUpdated`) vì
     nó sửa hồ sơ đã có · thẻ "Thành phần" trên `/staff` và `/staff/[id]` · ô chọn ở form tạo và
     form sửa · nhãn thành phần vào chuỗi tìm kiếm (gõ "trợ tá" ra đủ cả ban — màn hình không có ô
     lọc theo thành phần) · `deriveLoginAlias` nhận thêm tiền tố `TT`.
- **File thay đổi:** `supabase/migrations/20260819000200_staff_component_and_assistant_code.sql` ·
  `supabase/tests/057_staff_component_and_code_test.sql` · `src/types/database.ts` ·
  `staff/bulk/parse.ts` · `staff/bulk/server/actions.ts` · `staff/bulk/components/staff-bulk-form.tsx` ·
  `staff/staff-directory.ts` · `staff/server/queries.ts` · `staff/server/actions.ts` ·
  `staff/schemas.ts` · `staff/create-form-state.ts` · `staff/components/staff-create-form.tsx` ·
  `staff/components/staff-profile-editor.tsx` · `app/(dashboard)/staff/page.tsx` ·
  `app/(dashboard)/staff/[staffId]/page.tsx` · `auth/aliases.ts` · 3 file test ·
  `NH_2025-2026/NHAP_LIEU_HANG_LOAT.md` (§4 và §4.3).
- **Migration/data impact:** 1 migration. Trên production: enum + cột + sequence + trigger + CHECK
  mới, và backfill chạm **55/112** hồ sơ (14 `nu_tu` · 2 `chung_sinh` · 1 `linh_muc` · 38
  `du_truong`). **0 mã hồ sơ bị đánh lại.** Dump schema + data trước khi push, để ở
  `CQ_TNTT_Manager/backups/2026-08-19_pre-STAFF-COMP-001_{schema,data}.sql`.
- **Đã test (số thật):**
  - `npx supabase db reset` → 66 migration áp sạch, không lỗi.
  - `npx supabase test db` → **57 file / 1481 test — PASS** (mới: `057_...` 16 test — cấp mã theo
    thành phần, mã đặt tay không bị ghi đè, đổi thành phần không đổi mã, CHECK chặn tiền tố lạ).
  - `npm run typecheck` → sạch. `npm run lint` → *No ESLint warnings or errors*.
  - `npm test` → **123 file / 1736 pass · 24 skip · 0 fail** (mới: 8 bài `parseStaffComponent` +
    3 bài thành phần trong `staff-directory`).
  - `npm run build` → xanh.
  - `supabase migration list` sau khi push: `20260819000200` có ở **cả local lẫn remote**. Truy vấn
    thẳng production xác nhận CHECK mới là `^(GLV|TT)[0-9]{3,}$` và trigger
    `staff_profiles_assign_code` đang gắn trên bảng.
- **Quyết định mới:** (a) **KHÔNG thêm vai trò `Trợ tá` vào `app_role`** — Ban Trợ tá không cấp tài
  khoản, nên thêm một giá trị `app_role` là kéo theo khai quyền ở RLS của mọi bảng cho một nhóm
  không đăng nhập. (b) **Mã cấp một lần, không đổi theo `component`.** (c) Lượt dán chỉ **nâng**
  `khac` lên giá trị thật, không bao giờ ghi đè thành phần đã có — nếu không thì mỗi lần dán lại
  khối cũ sẽ xoá tay sửa của quản trị viên.
- **Blocker/rủi ro:** 57 hồ sơ nhập **trước** migration vẫn là `khac` (xem `BLOCKERS`).
- **Next action:** chủ dự án dán §4.3 (16 Trợ tá ⇒ `TT001`–`TT016`), rồi xử nốt 57 hồ sơ `khac`.

Các entry cũ hơn: [bản lưu R4.1](docs/worklog-archive-r4-2026-10-13.md) · [bản lưu trước R3](docs/worklog-archive-before-r3-2026-10-12.md).
