# M12-IMPORTS — 03. Kết quả audit

## 1. Chấm điểm 15 tiêu chí

| # | Tiêu chí | Điểm /5 | Lý do (có `file:line`) |
|---|---|---:|---|
| 1 | Đúng nghiệp vụ | 4 | Luồng đúng `docs/09` §2: dry-run không ghi bảng nghiệp vụ (test `011:105-106`), chunk 100/giao dịch (`actions.ts:23`), guardian reuse theo SĐT (`…import_batches.sql:207-222`), `student_code` từ sequence, không tạo tài khoản. **Trừ điểm:** thiếu bước "Download result/errors" mà `docs/09` §2 và §9 liệt kê là bắt buộc. |
| 2 | Dễ hiểu | 3 | Ba màn hình rõ ràng, nhãn tiếng Việt tốt ("Bước tải lên chỉ kiểm tra, chưa ghi gì vào hệ thống" — `imports/page.tsx:82`). **Trừ điểm:** sau khi upload không có gì thay đổi trên màn hình; người dùng không biết đã xong hay chưa. |
| 3 | Số bước hợp lý | 2 | Với sổ SYLL (83% dòng thiếu giới tính — `docs/09` §2b), mỗi dòng cần **một lần submit + tải lại toàn trang** (`[batchId]/page.tsx:93-115`). 30 em = 30 lần tải lại một trang render đủ 30 card. Không có thao tác hàng loạt. |
| 4 | Không nhập trùng | 2 | Dò trùng đúng 3 mức theo `docs/09` §5 (`dedup.ts:63-108`) + trùng trong file (`111-130`). **Nhưng** `action` mặc định là `"create"` cho **mọi** dòng kể cả trùng mức `high` (`actions.ts:149`) → bấm thẳng "Ghi" là tạo hồ sơ trùng. Thêm nữa, chỉ so với `students.status='active'` (`queries.ts:54`) → em cũ quay lại bị tạo hồ sơ mới. |
| 5 | Khó thao tác nhầm | 2 | Nút "Xóa lần nhập này" **không có xác nhận**, đứng cạnh nút "Ghi", và **xóa được cả batch đã commit** (`actions.ts:317-328`, `[batchId]/page.tsx:185-190`) — mất vĩnh viễn vết `created_student_id`. Nút "Ghi N dòng" cũng không xác nhận dù nó tạo hàng trăm hồ sơ trẻ em. |
| 6 | Validation đầy đủ | 4 | Ba tầng: `buildRow` per-field (`build-row.ts:162-217`), CHECK constraint (`…import_batches.sql:33-34, 62-63`), RPC (`145-190`) + trigger `validate_enrollment`. Chặn trước dòng thiếu giới tính với thông điệp rất tốt (`actions.ts:277-282`). **Trừ điểm:** không có Zod schema cho input của các action (`setRowAction`, `setRowGender`, `commitBatch`, `deleteBatch` nhận string thô, chỉ kiểm bằng `if` ở tầng form — `[batchId]/page.tsx:44, 51`). |
| 7 | Trạng thái rõ ràng | 3 | 4 trạng thái batch + 5 trạng thái dòng, có nhãn tiếng Việt (`imports/page.tsx:16-21`, `[batchId]/page.tsx:17-23`). **Trừ điểm:** `cancelled` là trạng thái chết (không luồng nào đặt được); `partially_committed` hiển thị nhưng người dùng không được biết **dòng nào** vừa hỏng vì `CommitSummary.failures` bị vứt. |
| 8 | Phân quyền an toàn | 5 | Khớp 3 tầng (route / action / RLS) đúng cùng một tập vai trò; RPC `security definer` kiểm `can_global_write()` ngay dòng đầu (`…import_batches.sql:145-147`) và dùng `auth.uid()` làm actor; **không dùng `service_role`** ở đâu. Test phủ GLV lớp và phụ huynh (`011:85-94`). |
| 9 | Dữ liệu nhất quán | 3 | Guardian reuse đúng, `student_code` không trùng, lỗi từng dòng được ghi lên chính dòng đó. **Trừ điểm nặng:** `insert into enrollments … on conflict do nothing` (`…import_batches.sql:274-278`) — em đã có ghi danh mở ở lớp khác thì dòng vẫn báo `committed` dù **không có gì thay đổi**; xóa batch đã commit phá audit; không có rollback. |
| 10 | Dễ bảo trì | 4 | Tách tầng rất tốt: parse / columns / normalize / build-row / dedup đều là hàm thuần, có comment giải thích **vì sao** (không chỉ *cái gì*). **Trừ điểm:** `actions.ts` gánh cả orchestration lẫn nghiệp vụ dedup (`123-151`). |
| 11 | Dễ mở rộng | 4 | Ánh xạ theo header thay vì vị trí cột (`columns.ts:57-105`) và cơ chế chấm điểm sheet (`parse.ts:209-233`) làm việc thêm layout mới rất rẻ. **Trừ điểm:** sheet `GIAO_LY_VIEN` và `BI_TICH` trong `docs/09` §3 chưa có chỗ móc. |
| 12 | UI hỗ trợ đúng nghiệp vụ | 2 | **Toàn bộ 5 form action vứt giá trị trả về** (`imports/page.tsx:23-26`; `[batchId]/page.tsx:31-53`) → không thông báo lỗi, không thông báo thành công, không hiện kết quả commit. Không phân trang dòng, không lọc theo trạng thái dòng, không tải được file lỗi, không liên kết tới hồ sơ trùng. |
| 13 | Responsive | 4 | `flex-wrap` cho hàng nút (`[batchId]/page.tsx:178`), `break-all` cho tên file (`imports/page.tsx:35`), input file `w-full`. Không vỡ ở 360/1366. **Trừ điểm:** danh sách 300 card dòng ở 360px là ~40.000px cuộn. |
| 14 | Accessibility | 4 | `label htmlFor` đầy đủ cho mọi select (`imports/page.tsx:95-100`; `[batchId]/page.tsx:96-104, 124-130`), select `min-h-11` = 44px, nút "Tải file mẫu" `h-11 min-h-11` (`imports/page.tsx:125`). **Trừ điểm:** không có `aria-live` cho kết quả (mà cũng không có kết quả để đọc); `option` rỗng `disabled` không thông báo khi submit hụt (`[batchId]/page.tsx:105-107`). |
| 15 | Khả năng kiểm thử | 5 | pgTAP 26 assertion phủ RLS + commit + partial + recommit; unit test cho toàn bộ hàm thuần; **integration test chạy trên file Excel thật của giáo xứ** (`import-sample-workbooks.test.ts`), kể cả case từ chối workbook không đủ dữ liệu. Đây là mức test tốt nhất trong repo. |

**Tổng: 51/75.**

## 2. Trạng thái tổng thể

**`NEEDS_IMPROVEMENT`** — với **2 hạng mục `CRITICAL`** phải xử lý trước khi dùng thật.

Tầng dữ liệu (parse/normalize/dedup/RPC/RLS) chất lượng cao và có test tốt.
Tầng giao diện thì **câm**: mọi thông điệp lỗi được soạn công phu ở tầng dưới đều bị vứt ở tầng trên.

## 3. Trạng thái theo luồng

| Luồng | Trạng thái | Điểm /75 |
|---|---|---:|
| M12-F01 Tải file mẫu | `PASS` | 68 |
| M12-F02 Upload + dry-run | `CRITICAL` | 40 |
| M12-F03 Danh sách batch | `PASS_WITH_MINOR_UI_FIX` | 58 |
| M12-F04 Chi tiết batch | `NEEDS_IMPROVEMENT` | 50 |
| M12-F05 Chọn giới tính từng dòng | `NEEDS_IMPROVEMENT` | 42 |
| M12-F06 Chọn xử lý dòng | `NEEDS_IMPROVEMENT` | 46 |
| M12-F07 Commit | `CRITICAL` | 45 |
| M12-F08 Xóa batch | `CRITICAL` | 38 |
| M12-F09 Tải file lỗi | `NEEDS_IMPROVEMENT` (chưa có) | 25 |
| M12-F10 Rollback batch | `NEEDS_CONFIRMATION` (chưa có) | 25 |

## 4. Phân tích 5 Whys

### 4.1 CRITICAL — Toàn bộ kết quả Server Action bị vứt (M12-F02, F07)

> **Hiện tượng:** `uploadAction` (`imports/page.tsx:23-26`), `commitAction`, `discardAction`,
> `rowActionForm`, `rowGenderForm` (`[batchId]/page.tsx:31-53`) đều `await …` rồi **bỏ** giá trị trả về.
> `createDryRunBatch` và `commitBatch` trả về `ImportActionResult` đầy đủ thông điệp tiếng Việt
> (`actions.ts:34-44, 296-310`) — không ai đọc.

1. **Vì sao người dùng không thấy lỗi?** Vì action bọc trả `Promise<void>`.
2. **Vì sao trả `void`?** Vì `<form action={…}>` của Server Component yêu cầu chữ ký `(formData) => Promise<void>`.
3. **Vì sao không dùng `useActionState`/`useFormState`?** Vì cả hai trang đều là Server Component thuần, không có Client Component nào trong module (khác hẳn M08 dùng `useTransition`).
4. **Vì sao chọn Server Component thuần?** Để tránh JavaScript phía client — hợp lý cho danh sách, **không hợp lý** cho luồng có kết quả cần phản hồi.
5. **Gốc rễ:** **quyết định kiến trúc "không client component" được áp dụng đồng loạt cho cả những màn hình mà phản hồi lỗi là yêu cầu nghiệp vụ** — và `docs/09` §7 nói rõ "failure một row không được làm mơ hồ".

### 4.2 CRITICAL — Xóa batch đã commit, không xác nhận, không rollback (M12-F08)

1. **Vì sao xóa được batch đã ghi?** Vì `deleteBatch` không kiểm `status` (`actions.ts:317-328`).
2. **Vì sao không kiểm?** Vì comment nói "Staging data is disposable (docs/09 §6)".
3. **Vì sao coi là disposable?** Vì `docs/09` §6 viết "Có thể xóa raw import sau thời hạn ngắn".
4. **Vì sao hiểu nhầm?** Câu đó nói về **raw_json** (dữ liệu thô, nhạy cảm), không nói về **mapping row → student**, mà `docs/09` §7 lại yêu cầu "Kết quả có mapping row → student_code".
5. **Gốc rễ:** **hai yêu cầu trái chiều trong cùng tài liệu (xóa raw sớm vs giữ mapping) được gộp thành một quyết định "xóa tất"** — và không có luồng rollback nên xóa batch là thứ duy nhất người dùng làm được khi hoảng.

### 4.3 CRITICAL — Mặc định `create` cho dòng trùng chắc chắn (M12-F02)

1. **Vì sao vẫn tạo trùng?** Vì `action: "create"` gán cứng cho mọi dòng (`actions.ts:149`).
2. **Vì sao gán cứng?** Vì `docs/09` §5 nói "User chọn: Tạo mới / Ghép / Bỏ qua" — hệ thống nhường quyết định cho người.
3. **Vì sao nhường mà vẫn đặt mặc định nguy hiểm?** Vì "create" là giá trị default của cột trong DB (`…import_batches.sql:59`), và code lặp lại default đó.
4. **Vì sao không mặc định `merge` khi trùng mức `high`?** Vì trùng `high` (tên + ngày sinh + SĐT) vẫn có thể là **hai anh em sinh đôi**? — không, sinh đôi khác tên; đây là trùng gần như chắc chắn.
5. **Gốc rễ:** **default của cột DB bị dùng làm default của quyết định nghiệp vụ**; không có trạng thái "chưa quyết định" để ép người dùng chọn.

### 4.4 Sửa giới tính từng dòng, tải lại toàn trang (M12-F05)

1. **Vì sao chậm?** Vì mỗi dòng là một `<form>` riêng gọi `revalidatePath("/imports")` (`actions.ts:229`).
2. **Vì sao revalidate cả `/imports`?** Vì action dùng chung một câu revalidate cho mọi thao tác.
3. **Vì sao không revalidate đúng trang batch?** Vì đường dẫn batch là động (`/imports/[batchId]`) và action không nhận `batchId`.
4. **Vì sao không nhận `batchId`?** Vì chữ ký `setRowGender(rowId, gender)` được thiết kế cho một dòng, không cho ngữ cảnh trang.
5. **Gốc rễ:** **thiếu thao tác hàng loạt cho một vấn đề đã biết là ảnh hưởng 83% dòng** (`docs/09` §2b) — thiết kế per-row cho một bài toán per-batch.

### 4.5 `on conflict do nothing` che giấu thất bại nghiệp vụ (M12-F07)

1. **Vì sao báo `committed` mà không đổi lớp?** Vì `insert … on conflict do nothing` (`…import_batches.sql:274-278`) không phân biệt "đã tồn tại" với "vừa tạo".
2. **Vì sao dùng `do nothing`?** Để tôn trọng D-11 (một ghi danh mở/năm) và không ném lỗi.
3. **Vì sao không kiểm sau khi insert?** Vì code không dùng `RETURNING` để biết có hàng nào được chèn.
4. **Vì sao không cảnh báo?** Vì luồng cho rằng "em đã có lớp thì giữ lớp cũ" là chấp nhận được (comment dòng 272-273).
5. **Gốc rễ:** **một quyết định nghiệp vụ (giữ lớp cũ) được cài đặt như một cơ chế im lặng của DB**, nên người nhập không bao giờ biết mình vừa import một em vào lớp mà em đó không được chuyển sang.

### 4.6 Thiếu "Download errors" (M12-F09)

1. **Vì sao thiếu?** Không có route handler nào ngoài `/imports/template`.
2. **Vì sao chưa làm?** Vì lỗi đã hiển thị trên màn hình chi tiết batch.
3. **Vì sao màn hình không đủ?** Vì người sửa dữ liệu là **GLV của lớp** — người này **không có quyền vào `/imports`** (chỉ 4 vai trò global-write).
4. **Vì sao điều đó quan trọng?** Vì `docs/09` §2b đo được 61/302 dòng lỗi do dữ liệu gốc thiếu, phải bổ sung thủ công — bởi chính GLV.
5. **Gốc rễ:** **thiếu cầu nối giữa người có quyền import và người có dữ liệu** — file lỗi tải về chính là cầu nối đó, và nó nằm trong acceptance criteria `docs/09` §9 nhưng bị bỏ.
