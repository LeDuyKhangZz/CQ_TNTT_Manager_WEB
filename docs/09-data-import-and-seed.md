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
| SYLL không có cột giới tính (ảnh hưởng 83% dòng) | `gender` thiếu là **cảnh báo**, người duyệt chọn Nam/Nữ trên màn hình review; commit từ chối nếu còn dòng chưa chọn. Không đổi schema, không đặt mặc định. |
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

## 7. Commit

- Transaction theo chunk.
- Sinh guardian reuse theo normalized phone.
- Sinh student code an toàn bằng DB sequence/locked counter.
- Tạo enrollment.
- Không tạo account hàng loạt tự động trừ khi user chọn.
- Kết quả có mapping row → student_code.
- Failure một row không được làm mơ hồ; chọn all-or-nothing hoặc chunk có báo cáo. Đề xuất chunk 100 row, mỗi chunk transaction.

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

## 9. Import acceptance criteria

- Vietnamese không mojibake.
- 900 rows khả thi.
- Không duplicate student code.
- Guardian reuse đúng.
- Không create class ngoài 19 lớp chuẩn; không có Chiên Con 3, Thiếu 3A/B hoặc lớp Dự trưởng thứ hai.
- Dry-run không write business tables.
- User download được errors.
- RLS không cho non-authorized import.
