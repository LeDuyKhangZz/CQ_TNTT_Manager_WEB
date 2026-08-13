# 06 — Nhật ký quyết định (chốt sau Giai đoạn 1)

> **Ngày chốt: 2026-07-23.** Người chốt: chủ dự án.
> Đây là **nguồn sự thật** cho mọi quyết định phát sinh từ audit Giai đoạn 1.
> Quyết định ở đây **ghi đè** mọi mô tả cũ trong `docs/` và `WORKLOG.md`.
>
> Đánh số tiếp nối bảng `QUYẾT ĐỊNH ĐÃ CHỐT` trong `WORKLOG.md` (đã có D-1…D-60).

---

## Bảng tra nhanh

| Mã | Quyết định | Ghi đè gì | Cần migration |
|---|---|---|---|
| D-61 | Cách báo kết quả thao tác | — | ❌ |
| D-62 | Quyền tạo tài khoản giữ ở Super Admin | — | ❌ |
| D-63 | Trưởng ngành & Thư ký tạo được hồ sơ thiếu nhi | `docs/05` §5 | ✅ |
| D-64 | Lối vào cổng phụ huynh | `docs/06` §5 | ❌ |
| **D-65** | **CÓ nhật ký thao tác đầy đủ** | **Đảo ngược D-34** | ✅ |
| D-66 | Cha sở/Cha phó KHÔNG chốt báo cáo | `docs/05` §6 | ✅ |
| D-67 | Phạm vi dữ liệu của Thủ quỹ | `docs/05` §4.5 | ✅ |
| D-68 | Cha sở/Cha phó/Thủ quỹ xem được điểm danh | `docs/05` §3 | ❌ |
| D-69 | Trưởng ngành xem được năm học cũ | — (xác nhận hiện trạng) | ❌ |
| D-70 | Phụ huynh/Thiếu nhi chỉ thấy lớp của mình | — | ✅ |
| D-71 | Thêm ngày kết thúc học kỳ 1 | `docs/02` | ✅ |
| D-72 | Không thêm lớp ngoài 19 lớp — **tạm thời** | — | ❌ |
| D-73 | Chỉ Super Admin đóng năm học | `docs/03` WF-16 | ✅ |
| D-74 | Ai được khóa bảng điểm | `docs/05` §5, mã nguồn | ✅ |
| D-75 | Phụ huynh KHÔNG đọc ghi chú điểm danh | — | ✅ |
| D-76 | Trả thiết bị một phần = còn nợ | `docs/03` WF-13 | ✅ |
| D-77 | Thu hồi được thông báo đã gửi | `docs/03` WF-14 | ✅ |
| D-78 | Mỗi Ban chỉ một Trưởng ban | `docs/03` WF-12 | ✅ |
| D-79 | Được chỉnh màu và cỡ chữ để đạt chuẩn dễ đọc | `docs/06` §3 | ❌ |

---

## D-61 · Cách báo kết quả thao tác cho người dùng

**Chốt:** hai cách, dùng theo loại biểu mẫu — nhưng phải viết thành quy tắc, không mỗi nơi một kiểu.

| Loại biểu mẫu | Cách dùng |
|---|---|
| Biểu mẫu ngắn (1–3 ô): xác nhận, xóa, đổi trạng thái, đánh dấu đã đọc | Chuyển hướng kèm mã kết quả, hiện dòng thông báo ở đầu trang |
| Biểu mẫu dài: tạo/sửa hồ sơ thiếu nhi, hồ sơ nhân sự, nhập điểm cả lớp, soạn thông báo, nhập Excel | Giữ nguyên dữ liệu đã nhập, hiện lỗi tại chỗ |

**Kèm theo bắt buộc:** mọi câu lệnh ghi phải kiểm số dòng thay đổi; 0 dòng = thất bại, **không bao giờ**
báo thành công. Xem `04_SYSTEM_WIDE_FINDINGS.md` SW-01, SW-04.

**Ảnh hưởng:** 9/14 module. Là việc nền tảng của Đợt 2.

---

## D-62 · Quyền tạo tài khoản và gán chức vụ

**Chốt:** giữ **chỉ Super Admin** tạo tài khoản và gán chức vụ.

**Nhưng phải làm quy trình liền mạch:**
1. Trang chi tiết Giáo lý viên có nút **"Cần tạo tài khoản"** — Thư ký/Xứ đoàn trưởng bấm được.
2. Hồ sơ hiện trạng thái rõ: *Chưa có tài khoản* / *Đang chờ cấp* / *Đã có tài khoản*.
3. Super Admin có một chỗ duyệt tập trung các yêu cầu đang chờ.
4. Thông tin tài khoản **tự điền từ hồ sơ** (hệ thống đã làm sẵn, chỉ cần giao diện thể hiện).
5. Liên kết tài khoản ↔ hồ sơ **tự động** (đã có, giữ nguyên).

**Không gộp** "tạo hồ sơ" và "tạo tài khoản" thành một bước bắt buộc — hồ sơ không có tài khoản là
trạng thái hợp lệ và phải giữ được.

**Chống trùng là cảnh báo mềm, không khóa cứng:** hiện cảnh báo "có hồ sơ giống thế này", vẫn cho tạo tiếp.

---

## D-63 · Ai tạo được hồ sơ thiếu nhi

**Chốt:**

| Vai trò | Phạm vi tạo/sửa hồ sơ thiếu nhi |
|---|---|
| Super Admin, Xứ đoàn trưởng, Phó Xứ đoàn, **Thư ký** | **Toàn xứ đoàn** |
| **Trưởng ngành, Phó ngành** | **Chỉ ngành mình** |
| Giáo lý viên đại diện / lớp / Dự trưởng | ❌ không tạo/sửa |

**Ghi đè:** `docs/05-permission-matrix.md` §5 và hiện trạng mã nguồn (đang chỉ cho 4 vai trò cấp xứ đoàn).

**Cần thay đổi cơ sở dữ liệu:** mở quyền ghi trên hồ sơ thiếu nhi từ "chỉ cấp xứ đoàn" sang
"cấp xứ đoàn **hoặc** vai trò ngành đúng ngành của em" — dùng lại đúng cách đã áp dụng cho ghi danh.

**Áp dụng cả cho hồ sơ người giám hộ** — vì không tạo được người giám hộ thì cũng không tạo được hồ sơ em.

**Giải quyết mâu thuẫn cũ:** trước đây Trưởng ngành ghi danh được nhưng không tạo được hồ sơ.
Nay đã nhất quán.

**Lưu ý bảo mật khi triển khai:** phải có kiểm thử chứng minh Trưởng ngành ngành A **không** tạo/sửa
được hồ sơ em thuộc ngành B.

---

## D-64 · Lối vào cổng phụ huynh

**Chốt: cách 2** — thêm mục **"Con của tôi"**; phụ huynh có **một** con thì vào thẳng trang em đó,
có **nhiều** con thì hiện danh sách chọn.

**Thanh menu dưới của phụ huynh** (tối đa 5 mục) — chủ dự án chưa nêu mục bỏ đi.
**Đề xuất mặc định để triển khai:**

| Thứ tự | Mục | Ghi chú |
|---|---|---|
| 1 | Trang chủ | giữ |
| 2 | **Con của tôi** | **mới — thay chỗ "Kết quả"** |
| 3 | Xin nghỉ | giữ |
| 4 | Thông báo | giữ |
| 5 | Tài khoản | giữ |

**Lý do bỏ "Kết quả" khỏi thanh dưới:** kết quả học tập là **thông tin của từng em**, nên đặt bên trong
trang "Con của tôi" hợp lý hơn là một mục riêng ngang hàng. Phụ huynh nhiều con hiện phải đoán "Kết quả"
đang hiện của em nào.

> ⚠️ Nếu chủ dự án muốn giữ "Kết quả" ở thanh dưới thì báo lại trước khi làm Đợt 4.

---

## D-65 · CÓ nhật ký thao tác đầy đủ 🔴 **ĐẢO NGƯỢC D-34**

**Chốt:** làm **nhật ký thao tác đầy đủ** (audit log) như thông lệ, để Super Admin kiểm soát được
ai làm việc gì.

**Quyết định này ĐẢO NGƯỢC:**
- `WORKLOG.md` D-34 — *"Không full audit before/after; chỉ metadata updated_at/by"*
- `AGENTS.md` §6 — *"Không tạo full audit log; chỉ metadata cập nhật theo quyết định user"*
- `AGENTS.md` §12 — *"Không full audit"*
- `docs/03-workflow.md` WF-05 — *"Không lưu before/after log"*

**Phạm vi tối thiểu phải ghi:**

| Nhóm | Thao tác |
|---|---|
| Tài khoản | Tạo · xóa · khóa/mở khóa · đổi tên đăng nhập · đặt lại mật khẩu · gán/đổi chức vụ |
| Hồ sơ | Tạo/sửa/lưu trữ hồ sơ thiếu nhi · sửa hồ sơ sức khỏe · sửa bí tích · **đổi người giám hộ** |
| Nhân sự | Tạo/sửa hồ sơ · phân công lớp · kết thúc phân công · đổi trạng thái phục vụ |
| Học vụ | Tạo/đóng năm học · sinh lớp · đổi cấu hình năm học |
| Ghi danh | Ghi danh · tạm nghỉ · khôi phục · kết thúc |
| Điểm danh | Mở khóa buổi đã khóa · sửa sau khi mở khóa |
| Điểm số | Khóa/mở khóa bảng điểm · xóa/ẩn cột điểm · công bố/ẩn kết quả · công bố Top 5 |
| Chuyển lớp | Đề xuất · duyệt · từ chối |
| Ban & Thiết bị | Đổi chức vụ Ban · xóa nội dung Ban · **báo hỏng/mất thiết bị** |
| Thông báo | Công bố · **thu hồi** |
| Nhập Excel | Ghi dữ liệu vào hệ thống · xóa lô |
| Báo cáo | Chốt báo cáo |

**Mỗi bản ghi tối thiểu:** ai · lúc nào · thao tác gì · trên đối tượng nào · giá trị trước và sau ·
địa chỉ truy cập.

**Ràng buộc bắt buộc:**
- Nhật ký **chỉ ghi thêm** — không ai sửa/xóa được, kể cả Super Admin.
- **Không ghi mật khẩu, mã đăng nhập, hoặc toàn bộ hồ sơ sức khỏe vào nhật ký.** Với dữ liệu nhạy cảm
  chỉ ghi *"đã sửa hồ sơ sức khỏe của em X"*, không ghi nội dung.
- Chỉ **Super Admin** đọc được nhật ký.
- Ghi nhật ký **không được làm hỏng thao tác chính**: nếu ghi nhật ký lỗi, thao tác nghiệp vụ vẫn phải
  thành công (hoặc cả hai cùng thất bại — chọn một cách và ghi rõ).

**Ảnh hưởng kế hoạch:** đây là **hạng mục mới lớn**, chưa có trong kế hoạch 6 đợt ban đầu.
Xem `05_REDESIGN_PRIORITY_PLAN.md` đã cập nhật — bổ sung vào **Đợt 2**.

---

## D-66 · Cha sở và Cha phó KHÔNG chốt báo cáo

**Chốt:** hai vị **chỉ xem và tải báo cáo**, **không chốt** báo cáo.

**Ghi đè:** hiện trạng mã nguồn (đang cho phép chốt) và câu mâu thuẫn trong `docs/05` §6.

**Cần thay đổi cơ sở dữ liệu:** tách quyền *xem/tải* khỏi quyền *chốt*.
Quyền chốt = nhóm ghi cấp xứ đoàn + vai trò ngành + Giáo lý viên lớp trong phạm vi mình.
Quyền xem/tải = giữ nguyên như hiện tại (rộng hơn).

**Nhất quán với D-17:** *"Cha sở và Cha phó/Tuyên úy chỉ xem/báo cáo"* — chốt báo cáo là thao tác ghi.

---

## D-67 · Phạm vi dữ liệu của Thủ quỹ

**Bối cảnh chủ dự án nêu:** Thủ quỹ cần **danh sách các em theo lớp** để khi có khoản phí thì tra cứu
và ghi chú được.

**Chốt — Thủ quỹ ĐƯỢC xem:**

| Nội dung | Chi tiết |
|---|---|
| Danh sách thiếu nhi theo lớp | Tên thánh, họ tên, lớp hiện tại, ngành |
| Thông tin liên lạc | Tên người giám hộ + số điện thoại |
| Số liệu tổng hợp | Sĩ số từng lớp, tổng sĩ số xứ đoàn |
| Danh sách nhân sự cơ bản | Tên, chức vụ, lớp phụ trách |
| Báo cáo tổng hợp | Xem và tải; **không** chốt |
| Tìm kiếm | Theo tên em, theo lớp |

**Thủ quỹ KHÔNG được xem:**

| Nội dung | Lý do |
|---|---|
| Ngày sinh, địa chỉ chi tiết của em | Không cần cho nghiệp vụ thu phí |
| Hồ sơ sức khỏe | Dữ liệu nhạy cảm (D-19) |
| Lịch sử bí tích | Dữ liệu nhạy cảm (D-19) |
| Điểm số chi tiết, nhận xét | D-19 |
| Chi tiết điểm danh từng buổi | Chỉ xem tỷ lệ tổng hợp |
| Ghi chú nội bộ | D-19 |
| Hoàn cảnh khó khăn | Nhạy cảm — **nhưng xem lưu ý bên dưới** |

> **Lưu ý cần chủ dự án xác nhận khi làm:** ô đánh dấu *"hoàn cảnh khó khăn"* có thể chính là thứ Thủ quỹ
> cần khi xét miễn/giảm phí. Hiện tôi xếp vào nhóm **không cho xem** vì đây là thông tin riêng tư của
> gia đình. Nếu nghiệp vụ thu phí thực sự cần, báo lại để mở riêng ô này.

**Thủ quỹ KHÔNG ghi được gì** — kể cả ghi chú. Việc "ghi chú" khoản phí nằm ngoài phạm vi hệ thống này
(không quản lý học phí — mục 2.2 của `docs/01`).

**Cần thay đổi cơ sở dữ liệu:** thêm một mức quyền "chỉ đọc số liệu cơ bản toàn xứ đoàn" cho Thủ quỹ.
Hiện Thủ quỹ **không nằm trong bất kỳ nhóm đọc nào**, nên mọi trang đều trống.

---

## D-68 · Cha sở, Cha phó, Thủ quỹ xem được trang điểm danh

**Chốt:** ba vị **vào xem được**, **không sửa**.

**Sửa:** danh sách vai trò được vào trang điểm danh — thêm cả ba.
**Không đụng cơ sở dữ liệu:** quyền *sửa* điểm danh vốn đã giới hạn ở nhân sự đứng lớp và Super Admin,
nên cho vào xem là an toàn.

**Giải quyết:** link chết trong menu (ba vị đang thấy mục "Điểm danh" rồi bấm vào bị chặn).

**Phạm vi xem:** Cha sở/Cha phó xem toàn xứ đoàn; Thủ quỹ xem **tỷ lệ tổng hợp**, không xem chi tiết
từng buổi từng em (theo D-67).

---

## D-69 · Trưởng ngành xem được dữ liệu năm học cũ

**Chốt:** **được xem**, trong phạm vi ngành mình, mọi năm học.

Đây là **xác nhận hiện trạng** — không cần thay đổi gì. Ghi lại để không ai "sửa nhầm" thành hạn chế
sau này.

---

## D-70 · Phụ huynh và Thiếu nhi chỉ thấy lớp của mình

**Chốt:** phụ huynh chỉ thấy lớp của con mình; thiếu nhi chỉ thấy lớp của mình.
**Không** được đọc danh sách toàn bộ lớp và toàn bộ năm học.

**Ghi đè:** hiện trạng (đang cho đọc hết).

**Cần thay đổi cơ sở dữ liệu:** siết quyền đọc trên bảng lớp và bảng năm học.

**Cảnh báo khi triển khai:** nhiều màn hình hiện dựa vào việc đọc được danh sách lớp để hiển thị tên lớp.
Siết quá tay sẽ làm cổng phụ huynh hiện *"lớp không xác định"*. Phải kiểm lại toàn bộ cổng phụ huynh
và cổng thiếu nhi sau khi siết.

> ✅ **ĐÃ CÀI — M02-C, 2026-07-26** (`20260726000300_portal_class_year_scope.sql`).
> **Lớp**: mọi lớp mà con mình / chính mình **từng ghi danh** — không chỉ năm hiện hành, vì em chuyển
> lớp giữa năm thì cả hai lớp đều là lớp của em. **Năm học**: **năm hiện hành** + những năm con mình có
> ghi danh; nhánh "năm hiện hành" là **bắt buộc** vì thanh đầu trang hiện tên năm học cho mọi vai trò —
> chặn sạch là cổng phụ huynh hiện *"Chưa đặt năm học"*, đúng cái bẫy cảnh báo ở trên.
> `sectors`/`grade_levels` **không** bị siết (danh mục của cả giáo xứ; siết là mất màu ngành của lớp con).
> Bốn đường đi đã rà từng cái: bộ chọn màu ngành · `/results` phụ huynh · `v_students_at_risk` +
> `v_upcoming_teaching_items` (`security_invoker`) · thanh đầu trang.
> Kiểm bằng JWT thật: pgTAP `035`, 18 test — gồm **năm bài "không quá tay"** và **ba bài đối chứng
> D-69** cho nhân sự. **M13 khi tới lượt phải rà lại lần nữa** vì nó thêm màn hình mới.

---

## D-71 · Thêm ngày kết thúc học kỳ 1

**Chốt:** thêm trường **"Ngày kết thúc học tại giáo xứ"** vào cấu hình năm học — đây chính là mốc
kết thúc học kỳ 1.

**Dùng để:** xác định lớp Dự trưởng chỉ hoạt động trong học kỳ 1 (D-9).

**Cần thay đổi cơ sở dữ liệu:** thêm cột ngày vào bảng năm học; ràng buộc phải nằm giữa ngày bắt đầu
và ngày kết thúc năm học.

**Giải quyết:** hiện trường đánh dấu "chỉ học kỳ 1" của lớp Dự trưởng là **dữ liệu chết** vì không có
mốc ngày nào để so.

**Cần làm rõ khi triển khai:** sau mốc này, lớp Dự trưởng chuyển sang trạng thái gì — ngừng hoạt động
tự động, hay chỉ hiện cảnh báo cho người quản lý? **Đề xuất: hiện cảnh báo, không tự động đóng** —
theo nguyên tắc *"không tự động quyết định mục vụ thay người phụ trách"* (`docs/03` §1).

---

## D-72 · Không thêm lớp ngoài 19 lớp chuẩn — **tạm thời**

**Chốt:** hiện **không cần** màn hình thêm lớp. **Nhưng đây không phải ràng buộc vĩnh viễn** — sau này
có thể cần.

**Hệ quả thiết kế:**
- **Không** thêm ràng buộc cứng "tối đa 19 lớp" vào cơ sở dữ liệu.
- Giữ mô hình hiện tại (lớp sinh từ danh mục mẫu) — vốn đã cho phép mở rộng.
- Không xây màn hình thêm lớp ở giai đoạn này.

**Ghi chú:** `AGENTS.md` §12 ghi *"19 lớp mặc định"* — chữ **mặc định** là đúng, không phải "tối đa".

---

## D-73 · Chỉ Super Admin đóng năm học

**Chốt:** **chỉ Super Admin** thực hiện việc đóng năm học.

**Cần thay đổi cơ sở dữ liệu:** quy trình đóng năm học hiện **chưa cài bước nào** — phải xây mới,
và giới hạn ở Super Admin ngay từ đầu.

**Kèm theo (từ `docs/03` WF-16):** sau khi đóng, **không ai ghi mới được** trừ Super Admin.

> ✅ **ĐÃ CÀI — M02-C, 2026-07-26.** Trước đợt đó câu trên là một lỗi nghiêm trọng **đang mở**: năm đã
> đóng vẫn ghi được bình thường, kể cả khi gọi thẳng Data API bằng JWT thật.
> Nay: `public.close_academic_year` (Super Admin, bảng kiểm tiền điều kiện, gõ lại mã năm, lý do bắt
> buộc khi còn việc tồn đọng) và `app.writable_academic_year_ids()` làm hàng rào trong policy
> INSERT/UPDATE của `enrollments` + `classes`. **D-117** chốt phạm vi ngoại lệ: Super Admin ghi được
> **tất cả**. ⚠️ **D-118** chốt phạm vi hàng rào **hẹp** — các bảng có `academic_year_id` của
> M05/M06/M07/M08/M10/M11 **chưa** có hàng rào này (nợ #18 ở `ui-redesign/16` §3).
> Kiểm bằng JWT thật: pgTAP `034`, 37 test.

---

## D-74 · Ai được khóa bảng điểm

**Chốt:**

| Vai trò | Khóa bảng điểm |
|---|---|
| Giáo lý viên **đại diện** lớp đó | ✅ |
| Giáo lý viên **lớp** thuộc lớp đó | ✅ |
| **Dự trưởng phụ tá** | ❌ |
| Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký | ❌ **(siết lại — trước đây được)** |
| Super Admin | **mở khóa** (giữ nguyên D-38) |

**Ghi đè:** `docs/05` §5 (*"Lock gradebook: Representative"*) và hiện trạng mã nguồn (đang cho nhóm
cấp xứ đoàn khóa).

**Cần thay đổi cơ sở dữ liệu.**

> **Lưu ý vận hành cần biết trước:** với quyết định này, nếu cuối năm cả Giáo lý viên đại diện lẫn các
> Giáo lý viên của một lớp đều không thao tác kịp, **không ai ở cấp xứ đoàn khóa hộ được**.
> Super Admin vẫn mở khóa được nhưng theo đúng câu chữ thì **không khóa được**.
> Khi triển khai, tôi sẽ để Super Admin khóa được như phương án dự phòng — nếu chủ dự án không muốn,
> báo lại.

---

## D-75 · Phụ huynh KHÔNG đọc ghi chú điểm danh

**Chốt:** ghi chú Giáo lý viên nhập khi điểm danh là **ghi chú nội bộ**, phụ huynh và thiếu nhi
**không đọc được**.

**Ghi đè:** hiện trạng — ghi chú đang hiển thị trên cổng phụ huynh.

**Cần thay đổi:** ẩn ghi chú khỏi cổng phụ huynh/thiếu nhi **và** chặn ở tầng cơ sở dữ liệu
(không chỉ ẩn trên giao diện).

**Kèm theo giao diện:** khi Giáo lý viên nhập ghi chú, nên ghi rõ *"Ghi chú nội bộ — phụ huynh không
nhìn thấy"* để không ai nhầm đây là kênh nhắn tin cho phụ huynh.

---

## D-76 · Trả thiết bị một phần = còn nợ

**Chốt:** mượn 5 trả 3 nghĩa là **còn nợ 2 cái** — phiếu mượn **vẫn mở**, kho **không bị trừ**.
Nếu hỏng/mất thì dùng thao tác **"Báo hỏng/mất"** riêng, khi đó mới trừ khỏi tổng kho.

**Ghi đè:** hiện trạng — trả một phần đang **trừ vĩnh viễn** phần chênh khỏi tổng kho, và nhãn nút
không nói điều đó.

**Cần thay đổi cơ sở dữ liệu:**
- Phiếu mượn có thêm trạng thái **"trả một phần"** với số lượng còn nợ.
- Tách thao tác **"Báo hỏng/mất"** riêng, có xác nhận, **ghi vào nhật ký** (D-65).
- Trả nhiều lần trên cùng phiếu phải cộng dồn đúng và không cộng kho hai lần.

**Kèm theo:** ai được báo hỏng/mất? **Đề xuất: Trưởng/Phó Ban Kỹ thuật**, không phải mọi thành viên —
vì thao tác này làm giảm tài sản vĩnh viễn.

---

## D-77 · Thu hồi được thông báo đã gửi

**Chốt:** **có** chức năng thu hồi.

**Cách làm (bắt buộc):**
- Thu hồi = **đánh dấu đã thu hồi**, **không xóa bản ghi**. Bản ghi thông báo vẫn bất biến.
- Thông báo đã thu hồi **biến mất khỏi hộp thư** người nhận và không tính vào số chưa đọc.
- Ghi vào **nhật ký thao tác** (D-65): ai thu hồi, lúc nào, thông báo nào.

**Ai được thu hồi:** người gửi, hoặc nhóm ghi cấp xứ đoàn, hoặc Super Admin.
**Không giới hạn thời gian** thu hồi.

**Ghi đè:** `docs/03` WF-14 (chỉ mô tả đường gửi đi, không có đường sửa sai).

---

## D-78 · Mỗi Ban chỉ một Trưởng ban

**Chốt:** một Ban chỉ có **một** Trưởng ban tại một thời điểm. Phó ban không giới hạn số lượng
(giữ nguyên như hiện tại).

**Cần thay đổi cơ sở dữ liệu:** thêm ràng buộc chặn Trưởng ban thứ hai.

**Kèm theo:** khi bổ nhiệm Trưởng ban mới mà đã có Trưởng ban cũ, hệ thống phải **hỏi rõ**
*"Kết thúc nhiệm kỳ của [tên] và bổ nhiệm [tên mới]?"* thay vì báo lỗi khô khan.

---

## D-79 · Được chỉnh màu và cỡ chữ để đạt chuẩn dễ đọc

**Chốt:** **cho phép** chỉnh đậm màu nền nút chính và các màu cảnh báo, tăng cỡ chữ nhỏ.

**Phạm vi:**
- 7 tổ hợp màu đang không đạt chuẩn — nặng nhất là **chữ trắng trên nền nút chính**
  và **dòng chữ cảnh báo "không có quyền truy cập"**.
- Cỡ chữ 10–11px nâng lên tối thiểu **13px** (đúng chuẩn `docs/06` §3 do chính dự án đặt ra).

**Ràng buộc:** giữ **tinh thần màu cam/da người ấm** lấy từ logo — chỉ chỉnh độ đậm nhạt cho đủ tương phản,
**không đổi sang hệ màu khác**, **không làm dark mode** (D-5).

**Lý do:** nhóm dùng nhiều nhất là phụ huynh lớn tuổi trên điện thoại.

---

# Thay đổi so với kế hoạch ban đầu

| # | Kế hoạch cũ | Nay đổi thành | Vì quyết định |
|---|---|---|---|
| 1 | Không có nhật ký thao tác | **Có nhật ký đầy đủ** — hạng mục lớn mới, đưa vào Đợt 2 | D-65 |
| 2 | Chỉ 4 vai trò cấp xứ đoàn tạo hồ sơ thiếu nhi | **Thêm Trưởng/Phó ngành** trong ngành mình | D-63 |
| 3 | Thủ quỹ thấy màn hình trống | **Có mức quyền đọc riêng** cho Thủ quỹ — hạng mục mới | D-67 |
| 4 | Cha sở/Cha phó chốt được báo cáo | **Siết lại** — tách quyền xem khỏi quyền chốt | D-66 |
| 5 | Nhóm cấp xứ đoàn khóa được bảng điểm | **Siết về Giáo lý viên đại diện + Giáo lý viên lớp** | D-74 |
| 6 | Phụ huynh/Thiếu nhi đọc được mọi lớp | **Siết về lớp của mình** | D-70 |
| 7 | Ghi chú điểm danh hiện cho phụ huynh | **Ẩn đi** | D-75 |
| 8 | Trả thiết bị một phần = trừ kho | **= còn nợ**; tách thao tác báo hỏng/mất | D-76 |
| 9 | Thông báo gửi rồi không sửa được | **Thu hồi được** | D-77 |
| 10 | Không có mốc kết thúc học kỳ 1 | **Thêm trường ngày** vào năm học | D-71 |
| 11 | Ba vị Cha sở/Cha phó/Thủ quỹ bị chặn trang điểm danh | **Cho vào xem** | D-68 |
| 12 | Chưa rõ ai đóng năm học | **Chỉ Super Admin** | D-73 |
| 13 | Một Ban có thể nhiều Trưởng ban | **Chỉ một** | D-78 |
| 14 | Màu và cỡ chữ giữ nguyên | **Được chỉnh** để đạt chuẩn dễ đọc | D-79 |

## Ảnh hưởng tới khối lượng công việc

| | Ước lượng ban đầu | Sau khi chốt |
|---|--:|--:|
| Đợt 1 — sửa nhanh | 3–5 ngày | 3–5 ngày *(+D-68)* |
| Đợt 2 — nền tảng | 8–12 ngày | **16–22 ngày** *(+nhật ký thao tác D-65)* |
| Đợt 3 — chống dữ liệu sai | 10–14 ngày | 10–14 ngày |
| Đợt 4 — hoàn thiện quy trình | 10–15 ngày | **14–20 ngày** *(+D-71, D-73, D-76, D-77)* |
| Đợt 5 — trải nghiệm | 10–14 ngày | 10–14 ngày |
| Đợt 6 — kiểm thử | 5–8 ngày | **7–11 ngày** *(+kiểm thử quyền mới)* |
| **Tổng** | **46–68 ngày** | **60–86 ngày** |

Phần tăng chủ yếu do **nhật ký thao tác** (D-65) và **4 thay đổi quyền cần sửa cơ sở dữ liệu**
(D-63, D-66, D-67, D-70, D-74).

## Việc phải làm ngay khi vào Giai đoạn 2

Sáu thay đổi quyền dưới đây **đều cần sửa cơ sở dữ liệu** và **đều phải có kiểm thử phân quyền**
chạy bằng tài khoản thật của từng vai trò trước khi coi là xong:

1. D-63 — Trưởng/Phó ngành tạo hồ sơ trong ngành mình *(nới quyền)*
2. D-66 — Cha sở/Cha phó không chốt báo cáo *(siết quyền)*
3. D-67 — Thủ quỹ có mức đọc riêng *(nới quyền)*
4. D-70 — Phụ huynh/Thiếu nhi chỉ thấy lớp mình *(siết quyền)*
5. D-74 — Khóa bảng điểm về Giáo lý viên đại diện + lớp *(siết quyền)*
6. D-75 — Ẩn ghi chú điểm danh khỏi cổng phụ huynh *(siết quyền)*

> **Ba việc siết quyền (2, 4, 5, 6) làm giảm quyền của người đang dùng.** Phải báo trước cho những
> người bị ảnh hưởng, nếu không họ sẽ tưởng hệ thống hỏng.

## Câu hỏi nhỏ còn mở — trả lời khi tới lúc làm, không chặn Giai đoạn 2

| # | Câu hỏi | Liên quan |
|---|---|---|
| 1 | Bỏ mục "Kết quả" khỏi thanh menu dưới của phụ huynh — đồng ý không? | D-64 |
| 2 | Thủ quỹ có được xem ô "hoàn cảnh khó khăn" để xét miễn/giảm phí không? | D-67 |
| 3 | Super Admin có được khóa bảng điểm như phương án dự phòng không? | D-74 |
| ~~4~~ | ~~Sau ngày kết thúc học kỳ 1, lớp Dự trưởng tự đóng hay chỉ cảnh báo?~~ **ĐÃ TRẢ LỜI 2026-07-25: chỉ cảnh báo, không tự đóng → D-115** | D-71 |
| 5 | Ai được "Báo hỏng/mất" thiết bị — mọi thành viên Ban Kỹ thuật hay chỉ Trưởng/Phó Ban? | D-76 |
