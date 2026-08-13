# M13 — CỔNG PHỤ HUYNH & THIẾU NHI · Business Rules

> Portal **không có bảng dữ liệu riêng**. Mọi quy tắc ở đây là quy tắc **đọc** — được thi hành bởi RLS của
> các module khác cộng với bộ lọc tường minh ở tầng ứng dụng.

Ký hiệu: `UI` · `Query` (lọc ở tầng ứng dụng) · `RLS` · `RPC` · `route-map`.

---

## 1. Quyền sở hữu — ai được xem ai

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M13-01 | Phụ huynh chỉ xem được **con mình**; thiếu nhi chỉ xem được **chính mình** | `RLS` (`own_student_ids()`) | `20260721000200:94-106` |
| BR-M13-02 | Mở hồ sơ em không phải con mình trả **404**, không phải 403 — không lộ sự tồn tại của hồ sơ | `Query` + `UI` | `parent/children/[studentId]/page.tsx:14-17` (có ghi chú giải thích chủ ý `:15-16`) |
| BR-M13-03 | Tên em chỉ được dùng **sau khi** đã qua kiểm tra quyền | `Query` | `parent/children/[studentId]/page.tsx:14-17` |
| BR-M13-04 | `studentId` không hợp lệ trả 404, không phải lỗi máy chủ | `Query` | `parent/children/[studentId]/page.tsx` |
| BR-M13-05 | Thiếu nhi **không** xem được bạn cùng lớp | `RLS` | `20260721000300:326-330`; `students` chỉ `is_self_student` |
| BR-M13-06 | Ngoại lệ duy nhất: Top 5 đã công bố — và ngoại lệ này dùng **tên đã chụp lại tại thời điểm công bố**, không truy vấn bảng hồ sơ | `Query` | `assessments/server/queries.ts:181-182` |

## 2. Dữ liệu nhạy cảm — cái gì tuyệt đối không hiện

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M13-07 | Phụ huynh và thiếu nhi **không bao giờ** xem được hồ sơ sức khỏe | `RLS` + không truy vấn | `20260716000500:112-129`; portal không đụng bảng health |
| BR-M13-08 | Phụ huynh và thiếu nhi **không bao giờ** xem được lịch sử bí tích | `RLS` + không truy vấn | như trên |
| BR-M13-09 | Nhận xét nội bộ (`staff_only`) không hiện, **kể cả số lượng** | `Query` + `RLS` | `assessments/server/queries.ts:143` (`.eq("visibility","student_visible")`) |
| BR-M13-10 | Phụ huynh **không** xem được điểm danh của Giáo lý viên | `RLS` | `20260721000300:333-341` |
| BR-M13-11 | Phụ huynh **không** sửa được hồ sơ, cũng không đề nghị sửa | (không có action nào) | ✅ D-46 |

## 3. Chỉ thấy dữ liệu đã chốt / đã công bố

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M13-12 | Điểm danh chỉ hiện sau khi buổi **đã chốt** — lọc ở **cả hai tầng** | `Query` + `RLS` | `portal/server/queries.ts:74`; `20260721000300:326-330` |
| BR-M13-13 | Điểm chỉ hiện khi cột **đã công bố** — lọc ở **cả hai tầng** | `Query` + `RLS` | `portal/server/queries.ts:133,139`; `20260722000400:519-563` |
| BR-M13-14 | Giáo án chỉ hiện phần được phép của **tuần tới**, qua hàm an toàn — không đọc bảng gốc | `RPC` | `get_week_ahead_teaching_items()` (`20260722000200`) |
| BR-M13-15 | Hàm tuần tới **không** trả mục tiêu, nội dung giáo lý, Lời Chúa, trò chơi, bài hát, bài tập, ghi chú hay tài liệu | `RPC` | ✅ WF-07 |
| BR-M13-16 | Thông báo chỉ hiện nếu mình nằm trong danh sách nhận | `RLS` | `20260723000400:271-285` |

## 4. Quyền vào trang

| Mã | Phát biểu | Nơi enforce | file:line | Trạng thái |
|---|---|---|---|---|
| BR-M13-17 | `/parent` **cố ý không giới hạn vai trò** — một Giáo lý viên vẫn có thể là phụ huynh (D-25); quyền thật nằm ở RLS | `route-map` | `route-map.ts:33-36` | ✅ đúng chủ ý |
| BR-M13-18 | `/student` chỉ dành cho vai trò thiếu nhi | `route-map` | `route-map.ts:37` | 🔴 **khai báo nhưng KHÔNG được thi hành** |
| BR-M13-19 | 🔴 **VI PHẠM BR-M13-18:** trang dùng `requireAuthContext` thay vì `requireRouteAccess` | `Query` | `portal/server/queries.ts:174` | **CRITICAL** |
| BR-M13-20 | Đối chiếu trong cùng file: trang phụ huynh **có** dùng đúng `requireRouteAccess` | `Query` | `portal/server/queries.ts:161` | ✅ — chứng tỏ là sơ suất, không phải chủ ý |

## 5. Quy tắc THIẾU hoặc SAI

| Mã | Luật cần có | Hiện trạng | Mức |
|---|---|---|---|
| BR-M13-21 | Phụ huynh phải **tới được** trang xem con từ giao diện | Không có mục điều hướng nào trỏ tới; trang chỉ tới được qua đường dẫn trong thông báo | **CRITICAL** |
| BR-M13-22 | Phụ huynh nhiều con phải **chuyển đổi được** giữa các con | Không có danh sách con, không có bộ chọn. Bộ chọn con **chỉ** tồn tại trong đơn xin nghỉ | **CRITICAL** |
| BR-M13-23 | Trạng thái rỗng phải nói **đúng nguyên nhân** | Phụ huynh chưa liên kết tài khoản thấy *"Chưa có kết quả nào được công bố"* — sai nguyên nhân | NEEDS_IMPROVEMENT |
| BR-M13-24 | Cùng một khái niệm phải cho cùng một con số | Trung bình phụ huynh thấy (tính trên cột đã công bố) khác trung bình nhân sự thấy, **không có chú thích** | NEEDS_IMPROVEMENT |
| BR-M13-25 | Hàm `getPortalChildren()` phải trả đúng "con của tôi" | Ngữ nghĩa thật là "mọi em đọc được"; đang bị dùng cho cả trang thiếu nhi | NEEDS_IMPROVEMENT |
| BR-M13-26 | Ghi chú điểm danh do Giáo lý viên nhập: phụ huynh có được đọc không? | Hiện **đang hiển thị** (`attendance-history.tsx:96`) | **NEEDS_CONFIRMATION** |

---

## 6. Nhận định

**Tầng bảo mật của portal là phần chắc nhất.** Bảy quy tắc quan trọng nhất (BR-M13-01, 05, 07, 08, 09, 12, 13)
đều được thi hành ở **hai tầng độc lập**: bộ lọc tường minh trong truy vấn **và** RLS ở cơ sở dữ liệu.
Nghĩa là nếu một tầng viết sai, tầng còn lại vẫn chặn. Đây là mẫu phòng thủ theo chiều sâu đúng nghĩa,
và có pgTAP `012/016/018` bảo vệ.

Hai lựa chọn thiết kế đáng ghi nhận và giữ nguyên:
- **Trả 404 thay vì 403** (BR-M13-02) — không xác nhận cho người lạ biết hồ sơ có tồn tại hay không.
- **Top 5 dùng tên đã chụp lại** (BR-M13-06) — cô lập ngoại lệ mà không phải mở quyền đọc bảng hồ sơ.

**Nhưng module có một nghịch lý:** phần khó nhất (bảo mật) làm rất tốt, phần dễ nhất (đặt một đường dẫn
vào menu) lại thiếu — khiến chức năng cốt lõi của cổng phụ huynh **không ai dùng được**.

Nguyên nhân gốc không nằm ở kỹ thuật mà ở cách nghiệm thu: hệ thống được kiểm **theo đường dẫn**
(mở thẳng URL có sẵn mã số em), không kiểm **theo hành trình người dùng** (từ màn hình đăng nhập,
phụ huynh bấm những đâu để tới được chức năng). Đây là bài học áp dụng cho toàn hệ thống, không riêng M13.
