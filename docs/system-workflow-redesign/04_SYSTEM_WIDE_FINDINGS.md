# 04 — Phát hiện toàn hệ thống

> Những vấn đề **lặp lại ở nhiều module**. Sửa ở đây một lần có giá trị hơn sửa từng module.
> Mỗi phát hiện có: mô tả · module bị ảnh hưởng · nguyên nhân gốc · hướng xử lý.

---

## Tóm tắt

| Mã | Phát hiện | Số module ảnh hưởng | Mức |
|---|---|---|---|
| **SW-01** | Thao tác ghi không phản hồi kết quả cho người dùng | **9/14** | 🔴 Nghiêm trọng |
| **SW-02** | Coi RLS là bộ lọc nghiệp vụ thay vì hàng rào bảo mật | 4/14 | 🔴 Nghiêm trọng |
| **SW-03** | Không phân biệt "chưa có dữ liệu" với "bạn không có quyền xem" | **12/14** | 🟠 Cao |
| **SW-04** | Ghi vào cơ sở dữ liệu không kiểm số dòng bị ảnh hưởng | 6/14 | 🟠 Cao |
| **SW-05** | Chức năng đã xây nhưng không có lối vào từ giao diện | 5/14 | 🟠 Cao |
| **SW-06** | Thao tác nguy hiểm không có bước xác nhận | **8/14** | 🟠 Cao |
| **SW-07** | Danh sách không có tìm kiếm / lọc / phân trang | 5/14 | 🟠 Cao |
| **SW-08** | Ngày giờ tính theo máy chủ thay vì múi giờ Việt Nam | 3/14 | 🟡 Trung bình |
| **SW-09** | Tài liệu mô tả chức năng chưa tồn tại | **10/14** | 🟡 Trung bình |
| **SW-10** | Không có nhật ký thao tác cho hành động nhạy cảm | Toàn hệ thống | 🟡 Trung bình |
| **SW-11** | Cột/cờ đã thiết kế trong cơ sở dữ liệu nhưng không ai dùng | 6/14 | 🟡 Trung bình |
| **SW-12** | Kiểm thử được thiết kế để né tình huống khó | 5/14 | 🟠 Cao |
| **SW-13** | Thành phần giao diện dùng chung không được dùng | **13/14** | 🟢 Thấp |
| **SW-14** | Độ tương phản màu chưa đạt chuẩn tiếp cận | Toàn hệ thống | 🟡 Trung bình |

---

## SW-01 — Thao tác ghi không phản hồi kết quả 🔴

**Module:** M01, M02, M03, M04, M09, M10, M12 (nặng nhất) · M05, M13 (một phần)

**Hiện tượng.** Người dùng bấm nút lưu. Trang tải lại. Không có gì thay đổi trên màn hình.
Ba tình huống hoàn toàn khác nhau — *lưu thành công*, *dữ liệu sai*, *không có quyền* — đều cho ra
**cùng một hiện tượng**.

**Bằng chứng.** Các hàm bọc form đều khai báo trả về "không có gì" và vứt bỏ kết quả:
`students/server/actions.ts:141-194` · `guardians/server/actions.ts:72-79` ·
`enrollments/server/actions.ts:86-101` · `staff/server/actions.ts:115,129,138` ·
`imports/page.tsx:23-26` và `imports/[batchId]/page.tsx:31-53`.

**Nguyên nhân gốc.** Quyết định kiến trúc "hạn chế tối đa mã chạy trên trình duyệt" (đúng đắn cho
điện thoại yếu, mạng phòng học kém) được áp dụng **đồng loạt** cho cả những màn hình mà phản hồi lỗi
là *yêu cầu nghiệp vụ*. Form của Server Component yêu cầu chữ ký hàm không trả giá trị; thay vì tìm
cách truyền kết quả về, mã nguồn chấp nhận vứt bỏ nó.

**Hậu quả thực tế.** Đây là **chất khuếch đại của mọi lỗi khác** trong hệ thống. Ví dụ điển hình:
lựa chọn "Tạm nghỉ" của M03 luôn thất bại — nhưng vì không có phản hồi, người dùng bấm mãi và kết luận
"hệ thống hỏng", hoặc tệ hơn, tin rằng đã tạm nghỉ thành công.

**Hướng xử lý.** 🔴 **Phải chọn MỘT cách làm thống nhất cho toàn hệ thống trước khi sửa module nào.**
Hai lựa chọn: chuyển hướng kèm mã kết quả, hoặc dùng cơ chế trạng thái form của React.
Không được để hai module dùng hai cách. Đây là quyết định kiến trúc, cần chốt trước tiên.

---

## SW-02 — Coi RLS là bộ lọc nghiệp vụ 🔴

**Module:** M10 (đã gây 2 lỗi nghiêm trọng) · M08, M11, M13 (nguy cơ)

**Hiện tượng.** Truy vấn cho màn hình "của tôi" không lọc theo người đang đăng nhập, mà tin rằng
lớp bảo vệ ở cơ sở dữ liệu đã lọc giúp.

**Vì sao sai.** Chính sách bảo vệ thường có dạng *"chỉ thấy dòng của mình **HOẶC** mình có quyền
quản trị"*. Nhánh thứ hai phục vụ mục đích quản trị. Với 8/14 vai trò không có quyền rộng, mọi thứ
đúng. Với 6 vai trò quản lý, màn hình "của tôi" **hiện dữ liệu của cả hệ thống**.

**Bằng chứng cụ thể.** `notifications/server/queries.ts:42-49` và `:111-115` thiếu điều kiện lọc theo
người dùng ⇒ hộp thư cá nhân của Thư ký chứa thông báo riêng của người khác; chuông hiện số chưa đọc
của toàn xứ đoàn.

**Nguyên nhân gốc.** Trộn hai câu hỏi khác nhau vào một cơ chế:
- Lớp bảo vệ trả lời: *"người này **được phép** thấy gì?"*
- Truy vấn phải trả lời: *"màn hình này **muốn** hiện gì?"*

**Hướng xử lý.** Rà **mọi** truy vấn phục vụ màn hình "của tôi" trong toàn bộ mã nguồn, đảm bảo có
điều kiện lọc tường minh. **Không** sửa bằng cách gỡ nhánh quản trị khỏi chính sách bảo vệ — sửa đúng
chỗ là ở truy vấn.

**Lỗ hổng kiểm thử đi kèm.** Bộ kiểm thử hiện chỉ chạy bằng phiên phụ huynh — vai trò *không* có
quyền rộng — nên **không bao giờ chạm tới nhánh lỗi**. Phải bổ sung kiểm thử chạy bằng vai trò quản lý.

---

## SW-03 — Không phân biệt "chưa có dữ liệu" với "không có quyền" 🟠

**Module:** 12/14 (mọi module có phạm vi dữ liệu)

**Hiện tượng.** Thủ quỹ mở danh sách thiếu nhi và thấy màn hình trống y hệt như khi thật sự chưa có
em nào. Giáo lý viên mở lớp khác thấy *"Lớp chưa có thiếu nhi ghi danh"*. Tài khoản phụ huynh chưa được
nối với con thấy *"Chưa có kết quả nào được công bố"*.

**Bảo mật thì ĐÚNG** — không rò dữ liệu. **Trải nghiệm thì SAI** — người dùng không tự chẩn đoán được,
và không biết phải liên hệ ai.

**Nguyên nhân gốc.** Nguyên tắc "dựa hoàn toàn vào lớp bảo vệ" (rất đúng cho *bảo mật*) bị áp dụng luôn
cho *trình bày*. Cơ sở dữ liệu trả về danh sách rỗng vì nhiều lý do khác nhau, nhưng tầng ứng dụng
cố ý không giữ lại thông tin về lý do.

**Bằng chứng cho thấy đây là vấn đề nhận thức, không phải năng lực.** Cùng một dự án đã làm đúng ở
hai nơi: trang điểm danh của thiếu nhi (`student/attendance/page.tsx:19-21`) nói rõ nguyên nhân và
việc cần làm; danh sách thiếu nhi dùng đúng ngôn ngữ phạm vi (*"…trong phạm vi của bạn"*).

**Hướng xử lý.** Định nghĩa ba loại trạng thái rỗng chuẩn cho toàn hệ thống — *chưa có dữ liệu* /
*ngoài phạm vi của bạn* / *tài khoản chưa được thiết lập* — và áp dụng dần theo từng module.
Lấy hai ví dụ đã làm đúng ở trên làm mẫu.

---

## SW-04 — Ghi không kiểm số dòng bị ảnh hưởng 🟠

**Module:** M01, M02, M03, M04, M09, M12

**Hiện tượng.** Câu lệnh cập nhật chạy không báo lỗi, nhưng **không dòng nào thay đổi** vì lớp bảo vệ
đã lọc hết. Mã nguồn kết luận "thành công".

**Nguyên nhân gốc.** Nhầm lẫn giữa *"câu lệnh chạy không lỗi"* và *"thao tác nghiệp vụ đã xảy ra"*.
Trong mô hình bảo vệ theo dòng, **quyền bị từ chối biểu hiện dưới dạng 0 dòng, không phải lỗi**.

**Điều đáng chú ý:** bài học này **đã được ghi lại** trong WORKLOG cho luồng *đọc* — *"Bảng rỗng trả `[]`
giống hệt RLS chặn"* — nhưng chưa được áp dụng cho luồng *ghi*.

**Hậu quả kép.** Không chỉ che giấu việc vượt quyền, mà còn che giấu việc **người đúng quyền bị chặn nhầm**
— nghĩa là một lỗi phân quyền thật sự cũng sẽ im lặng.

**Hướng xử lý.** Mọi câu lệnh ghi phải yêu cầu trả về dòng đã thay đổi và coi "0 dòng" là thất bại.
Đi kèm SW-01 (phải có kênh phản hồi thì mới báo được).

---

## SW-05 — Chức năng đã xây nhưng không có lối vào 🟠

**Module:** M13 (nặng nhất), M01, M03, M04, M10

| Chức năng | Trạng thái | Module |
|---|---|---|
| Trang phụ huynh xem con | Xây đầy đủ, **an toàn**, nhưng không mục menu nào trỏ tới | M13 |
| Nút đăng xuất | **Không tồn tại** trong toàn bộ giao diện | M01 |
| Sửa thông tin người giám hộ | Hàm đã viết xong, không màn hình nào gọi | M03 |
| Sửa hồ sơ nhân sự | Hàm đã viết xong, không màn hình nào gọi | M04 |
| Gán/đổi vai trò cho tài khoản | **Không có giao diện** | M01/M04 |
| Ghi nhận đơn xin nghỉ | Hàm đã viết xong, không màn hình nào gọi | M05 |
| Gửi thông báo cho một người | Cơ sở dữ liệu hỗ trợ, giao diện không có | M10 |

**Nguyên nhân gốc.** Hệ thống được nghiệm thu **theo đường dẫn** (mở thẳng địa chỉ trang), không nghiệm
thu **theo hành trình người dùng** (từ màn hình đăng nhập, bấm những đâu để tới được chức năng).
Cộng thêm một hạn chế kỹ thuật: cấu hình điều hướng chỉ hỗ trợ đường dẫn cố định, nên mọi trang có
tham số động (như mã số em) đều có nguy cơ mồ côi.

**Hướng xử lý.** Bổ sung dạng kiểm thử mới: *"người dùng vai trò X đi từ màn hình đăng nhập tới chức năng
Y trong tối đa N bước"*. Đây là dạng kiểm thử còn thiếu hoàn toàn và chính là khoảng trống đã để lọt
toàn bộ nhóm lỗi này.

---

## SW-06 — Thao tác nguy hiểm không có xác nhận 🟠

**Module:** M01, M03, M04, M07, M09, M10, M12, M13

| Thao tác | Hậu quả | Xác nhận? |
|---|---|---|
| Kết thúc ghi danh của một em | Đóng ghi danh, em rời lớp | ❌ |
| Xóa lô dữ liệu nhập đã ghi | Mất liên kết dòng ↔ hồ sơ, **không hoàn tác được** | ❌ |
| Công bố thông báo | Gửi tới hàng trăm người, **không thu hồi được** | ❌ |
| Xóa nội dung Ban / lịch họp | Xóa vĩnh viễn, không dấu vết | ❌ |
| Đổi chức vụ trong Ban | **Thay đổi quyền ghi** nội dung Ban | ❌ (lưu ngay khi chọn) |
| Trả một phần thiết bị | Phần chênh bị **trừ vĩnh viễn** khỏi tổng kho | ❌ |
| Xóa tài khoản | Mất lịch sử vai trò | ✅ có |

**Nguyên nhân gốc.** Không có tiêu chí thống nhất "thao tác nào cần xác nhận". Quyết định được đưa ra
theo cảm tính từng chỗ. Ví dụ rõ nhất: đổi chức vụ Ban bị coi là "ít rủi ro" nên lưu ngay khi chọn —
nhưng nó **thay đổi quyền ghi**, tức là một thao tác phân quyền.

**Hướng xử lý.** Đặt quy tắc: mọi thao tác **không hoàn tác được**, hoặc **ảnh hưởng tới người khác**,
hoặc **thay đổi quyền**, đều phải xác nhận và phải nêu rõ hậu quả bằng tên riêng (tên em, tên lớp,
số người nhận).

---

## SW-07 — Danh sách không có tìm kiếm / lọc / phân trang 🟠

**Module:** M03 (~900 em), M08, M09, M11, M12

**Hiện tượng.** Trang đổ toàn bộ dữ liệu một lần. Trên điện thoại 360px của Giáo lý viên đứng lớp,
đây là màn hình không dùng được.

**Nguyên nhân gốc.** **Nhầm phạm vi bảo mật với phạm vi trải nghiệm.** Lớp bảo vệ giới hạn *được thấy gì*,
không giới hạn *phải cuộn bao nhiêu*. Các trang được dựng khi dữ liệu mẫu còn nhỏ, và bộ đo hiệu năng
chỉ đo *thời gian truy vấn*, không đánh giá *khả năng sử dụng*.

**Trường hợp nặng nhất.** Bảng chuyển lớp gọi 2 truy vấn cho **mỗi** ghi danh, không giới hạn năm học,
không phân trang.

---

## SW-08 — Ngày giờ tính theo máy chủ thay vì múi giờ Việt Nam 🟡

**Module:** M05, M09, M02 (một phần)

**Bằng chứng.**
- `attendance/page.tsx:22-31` dùng ngày của máy chủ (giờ quốc tế trên nền tảng triển khai) để đoán buổi
  mặc định ⇒ **sáng Chúa nhật trước 7 giờ, hệ thống hiểu là thứ Bảy** và mặc định lùi về buổi thứ Năm
  trước đó. Giáo lý viên mở nhầm buổi.
- `committees/server/actions.ts:138` lấy ngày kết thúc nhiệm kỳ theo giờ quốc tế trong khi ngày bắt đầu
  lấy từ cơ sở dữ liệu ⇒ thao tác lúc sáng sớm có thể bị từ chối.

**Nguyên nhân gốc.** Quy ước *"mốc thời gian lấy từ cơ sở dữ liệu"* đã được áp dụng rất tốt cho cơ chế
giữ quyền điểm danh, nhưng **chưa được áp dụng nhất quán** cho các chỗ khác.

**Vì sao kiểm thử không bắt được.** Kiểm thử tự nhập ngày thủ công nên không bao giờ chạm vào logic
đoán ngày mặc định.

---

## SW-09 — Tài liệu mô tả chức năng chưa tồn tại 🟡

**Module:** 10/14

| Tài liệu | Mô tả | Thực tế |
|---|---|---|
| `docs/06 §6` | 10 địa chỉ trang (chi tiết nhân sự, quản trị tài khoản, cấu hình, thiết bị, lịch học thiếu nhi…) | **Chưa tồn tại** |
| `docs/05 §7` | 5 công tắc bật/tắt tính năng | 3 có thật, **2 không tồn tại** trong cơ sở dữ liệu |
| `docs/11` | Nhiều hàm nghiệp vụ (`assignPrimaryRole`, `archiveStudent`, `resumeEnrollment`, `upsertStudentSacrament`…) | **Chưa cài** |
| `docs/03` WF-16 | Toàn bộ quy trình đóng năm học | **Chưa cài bước nào** |
| `docs/05` | Cha sở "không ghi dữ liệu nghiệp vụ" nhưng cũng cho phép chốt báo cáo | **Tự mâu thuẫn** |

**Nguyên nhân gốc.** Tài liệu là danh sách **dự kiến**, chưa được đánh dấu phần nào đã làm.
Không có bảng đối chiếu "đặc tả ↔ đã cài ↔ có lối vào".

**Rủi ro thật.** Một người (hoặc một AI) đọc tài liệu sẽ tin rằng chức năng đã có. Đây chính là cách
lỗi "trang mồ côi" của M13 lọt qua mọi vòng kiểm.

---

## SW-10 — Không có nhật ký thao tác 🟡

**Phạm vi:** toàn hệ thống

Không truy được: ai xóa/khóa tài khoản · ai đổi vai trò · ai sửa dữ liệu sức khỏe · ai xóa nội dung Ban ·
ai bỏ qua cảnh báo trùng · ai đổi người giám hộ (thao tác **thay đổi ngay quyền đọc** của phụ huynh).

**Lưu ý quan trọng:** quyết định *"không làm nhật ký đầy đủ trước/sau"* là **quyết định đã chốt** và
tài liệu này **không đề nghị đảo ngược**. Nhưng cần phân biệt:
- *Nhật ký đầy đủ giá trị trước/sau* — đã chốt là không làm. Giữ nguyên.
- *Ghi vết ai làm gì lúc nào cho một số ít thao tác nhạy cảm* — chưa từng được thảo luận.

Đây là câu hỏi cần user chốt, không phải khuyến nghị đơn phương.

---

## SW-11 — Cột đã thiết kế nhưng không ai dùng 🟡

| Cột / cờ | Nơi định nghĩa | Trạng thái |
|---|---|---|
| `previous_enrollment_id` | ghi danh | **Chưa bao giờ có giá trị** ⇒ mất vết chuyển lớp |
| `staff_profiles.service_status` | hồ sơ nhân sự | Gán cứng "đang phục vụ", không đọc, không hiện |
| `grade_levels.requires_sacrament_review` | cấp giáo lý | Đã seed, **không ai đọc** ⇒ quy tắc bí tích lớp cuối ngành chưa chạy |
| `class_templates.term_scope = 'semester_1'` | mẫu lớp | Dữ liệu chết — không có mốc ngày kết thúc học kỳ 1 |
| `profiles.last_login_at` | tài khoản | Không mã nào ghi |
| `assessments.is_active` | cột điểm | Chưa dùng cho việc ẩn cột |
| Trạng thái buổi điểm danh "đã khóa" | điểm danh | Không mã nào ghi; "đã khóa" luôn suy ra từ mốc thời gian |

**Nguyên nhân gốc.** Cơ sở dữ liệu được thiết kế trước cho cả lộ trình dài, tầng ứng dụng theo sau
từng phần. Không có danh sách theo dõi "đã mô hình hóa nhưng chưa nối vào".

**Ý nghĩa tích cực:** phần lớn các cột này là **hạ tầng đã sẵn sàng** — nhiều đề xuất cải tiến không cần
thay đổi cơ sở dữ liệu vì cột đã có.

---

## SW-12 — Kiểm thử né tình huống khó 🟠

**Module:** M09, M10, M12, M13, M05

| Ví dụ | Vấn đề |
|---|---|
| Kiểm thử hộp thư chỉ chạy bằng phiên **phụ huynh** | Vai trò không có quyền rộng ⇒ không bao giờ chạm nhánh lỗi SW-02 |
| Kiểm thử công việc tuần **cố ý chia mỗi phiên một tuần riêng** | Né đúng tình huống ghi đè mất dữ liệu |
| Kiểm thử giao diện luôn tự nhập ngày | Không bao giờ chạm logic đoán ngày mặc định (SW-08) |
| Nghiệm thu bằng cách mở thẳng đường dẫn có sẵn mã số | Không phát hiện trang không có lối vào (SW-05) |
| Toàn bộ luồng ghi của M03 | **Không có kiểm thử nào** |
| `home.spec.ts:15-18` | **Chốt cứng một hành vi sai** — sửa lỗi sẽ làm kiểm thử đỏ |

**Nguyên nhân gốc.** Kiểm thử được viết để *xanh*, không phải để *bắt lỗi*. Tình huống đồng thời và
tình huống vai trò quyền cao bị né tránh vì khó dựng.

**Điểm cần ghi nhận công bằng:** phần kiểm thử phân quyền **đọc** rất tốt — 23 bộ kiểm thử cơ sở dữ liệu,
547 khẳng định, chạy bằng phiên đăng nhập thật. Vấn đề tập trung ở luồng **ghi** và tình huống **đồng thời**.

---

## SW-13 — Thành phần giao diện dùng chung không được dùng 🟢

`EmptyState` — thành phần đúng chuẩn, **0 nơi dùng**. 13 module tự viết đoạn văn bản rỗng theo 3 kiểu
khác nhau. Tương tự: hàm kiểm mã định danh bị chép ở 2 nơi trong khi thư mục dùng chung để trống;
hàm đặt tên tệp tải về có bản sao riêng song song với bản dùng chung.

**Hướng xử lý.** Sửa dần theo từng module khi động vào, không làm một đợt riêng.

---

## SW-14 — Độ tương phản màu chưa đạt chuẩn 🟡

**Phạm vi:** toàn hệ thống — 7 tổ hợp màu trượt chuẩn tiếp cận, nặng nhất là **chữ trắng trên nền màu
chính của mọi nút bấm** và **dòng chữ cảnh báo "không có quyền truy cập"**.

Cỡ chữ 10–11px xuất hiện nhiều nơi, dưới ngưỡng 13px do chính đặc tả giao diện của dự án đặt ra.
Với nhóm người dùng chính là **phụ huynh lớn tuổi trên điện thoại**, đây là rào cản thật.

**Sửa một chỗ = sửa toàn hệ thống**, nhưng cần user duyệt vì đây là màu bản sắc sinh từ logo chính thức.

---

## Những điều hệ thống làm ĐÚNG và không được phá

> Phần này quan trọng ngang phần trên. Giai đoạn 2 **không được** đụng vào các điểm sau.

| # | Điểm mạnh | Bằng chứng |
|---|---|---|
| 1 | **Mọi thao tác cần nguyên tử đều nằm sau hàm chuyên dụng có khóa dòng**; tài khoản thường **không có quyền ghi trực tiếp** vào bảng điểm danh, điểm số, phiếu mượn, thông báo, chuyển lớp, Top 5, báo cáo chốt | `02_ROLE_PERMISSION_MAP.md` §4 |
| 2 | **Giành quyền điểm danh là nguyên tử thật**, thời hạn giữ quyền tính bằng giờ cơ sở dữ liệu, người bị tiếp quản bị chặn ghi | M05 |
| 3 | **Bản báo cáo đã chốt là bất biến** — không cấp quyền sửa/xóa, và thông tin người chốt/thời điểm/mã kiểm tra do máy chủ đặt | M11 |
| 4 | **Danh sách người nhận thông báo chốt ngay trong cùng giao dịch** ⇒ số chưa đọc không nhảy khi ai đó đổi lớp | M10 |
| 5 | **Cổng phụ huynh lọc hai tầng** cho dữ liệu chưa chốt/chưa công bố | M13 |
| 6 | **Trả "không tìm thấy" thay vì "không có quyền"** khi mở hồ sơ em không phải con mình ⇒ không lộ sự tồn tại | M13 |
| 7 | **Top 5 dùng tên đã chụp lại** ⇒ cô lập ngoại lệ mà không mở quyền đọc hồ sơ | M07 |
| 8 | **Danh sách đường dẫn hợp lệ canh bằng kiểm thử so cả nội dung lẫn số lượng** giữa mã nguồn và cơ sở dữ liệu | M10 — **mẫu tốt nhất dự án** |
| 9 | **Duyệt chuyển lớp và trả thiết bị là idempotent thật** — làm lại không sinh bản ghi thừa | M08, M09 |
| 10 | **Ô điểm để trống là rỗng, không phải 0**; điểm 0 vẫn hợp lệ | M07 |
| 11 | **Mọi hàm quyền đặt đường tìm kiếm cố định và thu hồi quyền của người ẩn danh** | Toàn bộ |
| 12 | **Tài khoản bị khóa mất quyền ngay ở tầng cơ sở dữ liệu**, không phụ thuộc ứng dụng nhớ kiểm | M01 |
| 13 | **Chỉ 2 điểm gọi quyền quản trị cao nhất**, đều ở phía máy chủ | M01 |
| 14 | **Bộ nhớ đệm ngoại tuyến cố ý không lưu trang** — máy phòng học là máy dùng chung | M14 |
| 15 | **Nút bấm cao tối thiểu 44px**, vùng chạm ô tick đo theo nhãn bao quanh | M14 |
| 16 | **Không hard delete** hồ sơ, ghi danh, điểm danh, điểm số, báo cáo chốt | Toàn bộ |
