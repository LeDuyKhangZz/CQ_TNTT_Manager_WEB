# 09 — Data Import and Seed

## 1. Nguồn dữ liệu

Hiện tại:

- Google Sheets riêng theo lớp.
- Sổ giấy.
- Không có mã thiếu nhi.
- Có thể trùng họ tên.
- User là người kiểm tra dữ liệu import.

## 2. Chiến lược

Không import trực tiếp vào bảng production từ Excel.

Flow:

```text
Upload → Parse → Normalize → Validate → Duplicate warnings
→ Dry-run preview → User confirms → Commit batch → Download result
```

> 🔴 **Cập nhật M12-C (2026-08-03) — hai cái trần của bước Upload.**
> Chủ dự án chốt **D-137** (dung lượng **4 MB**) và **D-138** (**1.000 dòng** một file).
> Cả hai nằm ở `src/features/imports/limits.ts` và được **nói ra ngay trên biểu mẫu**,
> không phải chỉ báo sau khi tải xong.
>
> - **4 MB, không phải 5 MB.** Nền tảng triển khai (Vercel, `docs/12` §1) chặn thân
>   request nặng hơn ~4,5 MB **ở tầng hạ tầng**, tức trước khi mã ứng dụng chạy. Trần cũ
>   5 MB nằm **trên** con số ấy nên câu tiếng Việt `"File vượt quá 5MB."` chưa từng có cơ
>   hội chạy cho đúng khoảng nó sinh ra để canh. `next.config.mjs` hạ `bodySizeLimit` từ
>   `6mb` xuống `4.5mb` theo. Căn cứ: 21 file thật của giáo xứ, **nặng nhất 860 KB**.
> - **1.000 dòng — trước đây không có giới hạn nào** (SEC-12). Giới hạn dung lượng không
>   thay được nó: sheet toàn chữ nén rất tốt. Sổ lớp đông nhất của giáo xứ là **75 dòng**;
>   gộp cả 19 lớp cũng chỉ ~900. Kiểm **ngay sau `parseWorkbook`**, trước mọi truy vấn.
> - `maxDuration = 60` (trần gói Hobby) đặt ở cả hai trang của module. Ghi 1.000 dòng là
>   10 lượt gọi RPC nối đuôi; nếu không kịp thì **bấm "Ghi" lần nữa chạy tiếp từ chỗ dừng**
>   và không tạo hồ sơ trùng (`commitBatch` chỉ lấy dòng còn `valid`/`warning`).

## 2b. Định dạng thực tế của xứ đoàn (khảo sát 2026-07-21)

Bộ file mẫu thật (`Excel mẫu/`) là **sổ lớp của GLV**, mỗi lớp một workbook 14–16 sheet
(`SYLL`, `DS_dau_nam`, `thang_9..thang_5`, `HK_1/HK_2/ca_nam`). Chỉ hai sheet đầu liên quan import.

- `SYLL` (Sơ yếu lý lịch) — nguồn giàu nhất, **19 cột A–S nhất quán** ở Ấu/Thiếu/Nghĩa/Hiệp:
  tên thánh, họ tên, ngày/nơi sinh, ngày/nơi Rửa Tội, ngày/nơi Thêm Sức, ngày bổn mạng,
  cha (tên + SĐT), mẹ (tên + SĐT), người giám hộ (tên + SĐT), địa chỉ hộ khẩu, nơi ở hiện nay,
  thuộc giáo xứ, lớp hiện nay.
- `DS_dau_nam` — với Chiên Con là nguồn chính (SYLL trống): tên thánh, họ và tên **tách hai cột**,
  ngày sinh, ghi chú, địa chỉ, "Họ tên cha/mẹ", "SĐT". Với Thiếu/Nghĩa/Hiệp chỉ là danh sách tên
  (không có ngày sinh/SĐT) nên **không đủ để import** — parser từ chối kèm thông báo rõ.
- **Không file nào có sheet `GIAO_LY_VIEN`.** Import GLV chưa có dữ liệu mẫu; để lại phase sau.

Khác biệt so với schema và cách xử lý đã chốt với user:

| Vấn đề | Quyết định |
|---|---|
| SYLL không có cột giới tính (ảnh hưởng 83% dòng) | `gender` thiếu là **cảnh báo**, người duyệt chọn Nam/Nữ trên màn hình review; commit từ chối nếu còn dòng chưa chọn. Không đổi schema, không đặt mặc định.<br>**Cập nhật M12-B (2026-07-29):** màn hình review nay chọn được **hàng loạt** — đánh dấu nhiều dòng rồi "Áp dụng Nam/Nữ", và cả trang lưu trong **một** lượt gửi (TO-BE 4 / AC-21). Vẫn **không đoán** theo tên đệm: mọi giá trị đều là lựa chọn tường minh của người duyệt (BR-M12-36). |
| SYLL có cha + mẹ + giám hộ nhưng DB chỉ 1 guardian | Ưu tiên **giám hộ > cha > mẹ**, trong đó ứng viên có SĐT hợp lệ thắng. Người còn lại ghi vào `general_notes` để không mất liên lạc. |
| Sổ Chiên Con không có cột lớp | Người dùng **chọn lớp đích khi upload**; dòng nào có cột lớp thì giá trị trong file vẫn thắng. |
| Thư viện parse | **exceljs**. Không dùng SheetJS: bản `xlsx` trên npm (0.18.5) dính 1 CVE HIGH (prototype pollution + ReDoS) không có bản vá trên npm, mà đây đúng là đường xử lý file người dùng upload. |

Kết quả đo trên 302 dòng thật của 11 sổ lớp: **241 dòng (80%) ghi được**, 61 dòng lỗi do
**dữ liệu gốc thiếu** (thiếu SĐT phụ huynh 61, thiếu ngày sinh 25 — tập trung ở hai sổ Chiên Con).
Đây là khoảng trống nghiệp vụ, phải bổ sung thủ công.

## 3. Template Excel

Sheet `THIEU_NHI`:

| Cột | Bắt buộc |
|---|---:|
| nam_hoc | Có |
| nganh | Có |
| lop | Có |
| ten_thanh | Có |
| ho_ten | Có |
| gioi_tinh | Có |
| ngay_sinh | Có |
| ngay_bon_mang | Không |
| dia_chi | Không |
| sdt_thieu_nhi | Không |
| ho_ten_phu_huynh | Có |
| sdt_phu_huynh | Có |
| hoan_canh_kho_khan | Không |
| di_ung | Không |
| suc_khoe_luu_y | Không |
| ghi_chu | Không |

Sheet `BI_TICH` tùy chọn:

- key row/student temp key.
- loại.
- ngày.
- nơi.
- số sổ.
- ghi chú.

Sheet `GIAO_LY_VIEN`:

- tên thánh.
- họ tên.
- danh xưng.
- phone.
- email.
- ngành.
- lớp.
- capacity.
- cấp HT.
- Ban 1/2.

## 4. Normalization

- Trim whitespace.
- Collapse multiple spaces.
- Unicode NFC.
- Normalize Vietnamese name for duplicate matching nhưng giữ bản gốc để hiển thị.
- Phone về E.164 nội bộ hoặc normalized VN.
- Date chấp nhận Excel serial, dd/MM/yyyy, yyyy-MM-dd.
- Class aliases:
  - `Ấu 1 A`, `Au1A`, `Ấu 1A` → canonical.
- Gender mapping.
- Boolean mapping `x/có/1/yes`.

## 5. Duplicate warning

Không block.

Score warning từ:

- normalized full name.
- date of birth.
- guardian phone.

Mức:

- High: cả 3 trùng.
- Medium: name + birth.
- Low: name gần giống + phone.

User chọn:

- Tạo mới.
- Ghép với hồ sơ có sẵn.
- Bỏ qua.

> 🔴 **Cập nhật 2B · M12-A (2026-07-29) — D-133.** "User chọn" ở trên vẫn đúng, nhưng
> **mặc định** trước khi user chọn thì đổi:
>
> - Mức `high` và `medium` mặc định là **Ghép**, không phải Tạo mới. Bản cài đặt cũ
>   lặp lại giá trị mặc định của cột trong DB (`action = 'create'`) cho **mọi** dòng,
>   nên bấm thẳng "Ghi" là sinh hồ sơ trùng.
> - Mức `high` **chặn ghi** cho tới khi người duyệt tự lưu quyết định của dòng đó
>   (BR-M12-32). Dòng nào mặc định là Ghép mà hồ sơ đối chiếu **không còn sinh hoạt**
>   cũng bị chặn, vì trigger `enrollments_need_active_student` (M03-C) sẽ từ chối.
> - Phép dò trùng xét **mọi** hồ sơ, không chỉ hồ sơ `active` (BR-M12-33): em nghỉ rồi
>   quay lại phải được ghép, không tạo hồ sơ thứ hai.
>
> Luật "thế nào là trùng" từ M03-B nằm ở `src/lib/students/duplicate.ts`, dùng chung
> với đường nhập tay; luật "mặc định và chặn" nằm ở `src/features/imports/row-decision.ts`.

## 6. Batch tables

### `import_batches`

- id.
- filename.
- academic_year_id.
- uploaded_by.
- status.
- total_rows.
- valid_rows.
- warning_rows.
- error_rows.
- created_at/committed_at.
- cancelled_at/cancelled_by (2B · M12-A, D-131).
- raw_purged_at/raw_purged_by (2B · M12-A, D-132).

### `import_rows`

- batch_id.
- row_number.
- raw_json.
- normalized_json.
- status.
- errors_json.
- warnings_json.
- matched_student_id.
- action.

Có thể xóa raw import sau thời hạn ngắn; không cần giữ 5 năm.

> 🔴 **Cập nhật 2B · M12-A (2026-07-29) — D-131 / D-132.** Câu trên nói về **`raw_json`**,
> **không** nói về cả lần nhập. Bản cài đặt cũ đọc nó thành "xóa tất" nên nút "Xoá lần
> nhập này" xoá được cả lần nhập **đã ghi dữ liệu**, cuốn theo mapping `row → student`
> mà §7 đòi giữ. Từ M12-A:
>
> - Lần nhập **đã ghi** (`committed_rows > 0`): **không xoá được**, kể cả gọi thẳng Data
>   API — policy `import_batches_delete_dry_run` chặn ở DB (pgTAP `039`, JWT thật).
> - Lần nhập **chưa ghi**: huỷ = đặt `status = 'cancelled'` + `cancelled_at/by`, **giữ
>   nguyên hàng** để tra cứu về sau (D-131).
> - "Xoá dữ liệu thô" là thao tác **riêng**, chỉ dọn `raw_json`, giữ
>   `created_student_id`/`created_guardian_id`; mở cho **cả bốn vai trò nhập được**
>   (D-132), có ghi `raw_purged_at/by`. Chưa có tác vụ nền tự dọn theo thời hạn.

## 7. Commit

- Transaction theo chunk.
- Sinh guardian reuse theo normalized phone.
- Sinh student code an toàn bằng DB sequence/locked counter.
- Tạo enrollment.
- Không tạo account hàng loạt tự động trừ khi user chọn.
- Kết quả có mapping row → student_code.
- Failure một row không được làm mơ hồ; chọn all-or-nothing hoặc chunk có báo cáo. Đề xuất chunk 100 row, mỗi chunk transaction.

> 🔴 **Cập nhật M12-C (2026-08-03) — ghi danh không tạo được PHẢI được nói ra** (TO-BE 6,
> BR-M12-39, AC-24; migration `20260803000100`).
> `enrollments` có unique index *một ghi danh đang mở / một em / một năm học* (D-11), nên
> `insert … on conflict do nothing` **im lặng không làm gì** khi em đã có lớp. Trước đợt này
> dòng vẫn báo `committed` và người nhập tin rằng em đã được xếp vào lớp ghi trong file —
> trong khi Giáo lý viên lớp mới không bao giờ thấy em. Đây là **đường đi thường gặp nhất**
> của module (nhập lại sổ đầu năm sau khi sửa vài dòng).
>
> Nay `commit_import_rows` trả thêm cột **`out_enrollment_created boolean`**:
> - dòng **vẫn** `committed` — hồ sơ em đã thật sự được tạo hoặc ghép, nói là lỗi thì sai;
> - một cảnh báo `field = enrollment` được ghi lên chính dòng đó, **nêu đúng tên lớp em
>   đang học** (câu khác cho ca em đã ở đúng lớp trong file);
> - kết quả ghi đếm con số này **riêng**, không gộp vào `committed` cũng không gộp vào lỗi.
>
> ⚠️ Đổi kiểu trả về bắt buộc `drop function` + `create`, nên phải **cấp lại `grant execute`**
> — quên là gãy toàn bộ import cho người dùng thường. pgTAP `040` có bài canh đúng chỗ đó.

## 8. Seed reference

`seed.sql`:

- 5 sectors.
- 13 grade levels thuộc 5 ngành.
- 19 class template logic: 18 lớp giáo lý và 1 lớp Dự trưởng trong HK1.
- 6 Ban.
- assessment type defaults.
- attendance weights.
- system settings.

`seed.dev.sql`:

- Chỉ local.
- Demo users/password.
- Demo students/data.
- Không chạy production.

> 🔴 **Cập nhật IMP-BULK-002 (2026-08-19) — hai luật của module bị đảo, theo lệnh chủ dự án.**
>
> **(a) Quyền: chỉ Super Admin.** `/imports` và `/staff/bulk` trước đây mở cho bốn vai
> trò ghi-toàn-xứ-đoàn (`app.can_global_write()`). Một lượt dán tạo hàng trăm hồ sơ và
> ghi danh trong một cú bấm, nên quyền thu về **đúng một người**. Ba chỗ phải khớp nhau:
> `ROUTE_RULES` (`route-map.ts`), `IMPORT_ROLES` (`imports/server/permissions.ts`) và
> `app.is_super_admin()` trong policy của `import_batches`/`import_rows`
> (migration `20260819000100`). Hai trang **không còn mục điều hướng**; lối vào duy nhất
> là thẻ "Nhập liệu hàng loạt" ở `/admin`.
>
> ⚠️ Hệ quả kèm theo: D-117 cho Super Admin ghi vào **mọi** năm học, kể cả năm đã đóng.
> Trước đợt này một Thư ký bị `YEAR_NOT_WRITABLE` chặn khi nhập vào năm đã đóng; nay
> người nhập duy nhất lại là người được miễn luật đó. Hàng rào ở
> `guard_import_row_update` giữ nguyên cho mọi vai trò khác (bài `054`).
>
> **(b) Thiếu dữ liệu KHÔNG còn chặn.** Sổ giấy của giáo xứ không bao giờ đủ: 229/593
> thiếu nhi thiếu ngày sinh hoặc số điện thoại phụ huynh, 46/128 nhân sự thiếu số điện
> thoại (cả Ban Trợ tá). Luật cũ nghĩa là những người ấy **không tồn tại trong hệ thống**
> nên không điểm danh được. Năm cột NOT NULL được nới: `staff_profiles.phone`,
> `guardians.phone`, `students.gender`, `students.date_of_birth`, `students.guardian_id`.
>
> Vẫn chặn: **thiếu họ tên** · **lớp không khớp** · **ngày sinh ở tương lai** · **dòng
> nghi trùng chắc chắn chưa xác nhận** (D-133). Ba cái đầu là dữ liệu *hỏng* chứ không
> phải dữ liệu *thiếu*; cái cuối là chỗ máy không được quyết thay người.
>
> Bù lại phải có đường bổ sung: `v_incomplete_student_profiles` nay soi cả ba cột mới,
> và nhân sự tự điền SĐT/ngày sinh/địa chỉ/email của **chính mình** ở `/account`
> (policy `staff_profiles_update_self` + trigger `app.guard_staff_self_update`, chỉ bốn
> cột ấy). 🔴 Phụ huynh đăng nhập **bằng số điện thoại**, nên em nào chưa có số cha/mẹ
> thì chưa cấp được tài khoản phụ huynh — nhân sự thì không vướng, vì họ đăng nhập bằng
> `staff_code`.

## 9. Import acceptance criteria

- Vietnamese không mojibake.
- 900 rows khả thi.
- Không duplicate student code.
- Guardian reuse đúng.
- Không create class ngoài 19 lớp chuẩn; không có Chiên Con 3, Thiếu 3A/B hoặc lớp Dự trưởng thứ hai.
- Dry-run không write business tables.
- User download được errors.
- RLS không cho non-authorized import.

> 🔴 **Cập nhật M12-C (2026-08-03) — "User download được errors" nay ĐÃ CÓ THẬT**
> (TO-BE 5, AC-22/AC-23, BR-M12-37/38): `GET /imports/[batchId]/errors` trả `.xlsx`
> hai sheet — **`LOI`** (`Dòng · Họ và tên · Lớp · Lỗi · Cảnh báo`, chỉ dòng có việc
> phải làm) và **`KET_QUA`** (`Dòng · Họ và tên · Mã thiếu nhi · Trạng thái`, đủ mọi dòng).
>
> - **Đây là cầu nối duy nhất tới Giáo lý viên lớp.** Họ biết dữ liệu còn thiếu nhưng
>   `route-map.ts` không cho họ vào `/imports` (SEC-01), và điều đó đúng. Route handler gọi
>   `requireImportAccess()` **trước mọi truy vấn** (SEC-04b) và trả **403 kèm câu tiếng
>   Việt**, không phải 500 — Thư ký tải file rồi gửi cho GLV.
> - **Mọi ô chuỗi đi qua `safeSpreadsheetText`** (BR-M12-37). Bộ chặn được mở rộng thêm
>   `TAB` và `CR` đúng chữ của TO-BE 5 bước 3. Lỗi ghi hỏng được **dịch qua
>   `commitErrorText` trước khi vào file** — nếu không thì SEC-16 mở lại ở cửa thứ hai, và
>   cửa này tệ hơn màn hình vì tệp đi ra ngoài hệ thống.
> - File báo cáo **không nhập ngược lại được**: cả hai sheet đều thiếu cột ngày sinh nên
>   `parseWorkbook` từ chối bằng đúng câu *"Sheet chỉ có danh sách tên…"*.
