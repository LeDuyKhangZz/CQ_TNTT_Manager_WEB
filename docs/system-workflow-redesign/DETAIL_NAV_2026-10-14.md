# DETAIL-NAV-AFFORDANCE-20261014 — Hồ sơ và vùng bấm mở chi tiết

Yêu cầu của chủ dự án ngày 14/10/2026: danh sách đang giống văn bản thường, khó nhận biết tên có thể bấm; muốn bấm cả khối bao quanh và bố trí lại các trang chi tiết, đặc biệt hồ sơ thiếu nhi/huynh trưởng trên điện thoại.

## Thay đổi

| Phạm vi | Kết quả |
|---|---|
| Nhân sự, thiếu nhi, lớp | Hàng có mũi tên, nhãn mở hồ sơ/lớp trên mobile, viền và phản hồi hover/focus; cả nền hàng mở được. |
| Giáo án, kết quả, buổi điểm danh, kho báo cáo | Dùng cùng `DataTable.rowHref`; các ô dữ liệu đều mở đúng trang chi tiết. Nút tải Excel/PDF vẫn độc lập. |
| Ban, lần nhập Excel, thành viên lớp, gia đình, con của tôi | Thẻ/link toàn vùng có dấu hiệu điều hướng rõ. Nút quản lý ghi danh đứng ngoài link, mở đúng sheet. |
| Hồ sơ nghi trùng và cảnh báo dashboard | Toàn thẻ dẫn đến hồ sơ; giữ cảnh báo trùng và bước xác nhận tạo mới. |
| Thiếu nhi | Header nhận diện, lớp/trạng thái, liên hệ giám hộ và tác vụ; sáu mục hồ sơ hiện đủ trên mobile; tách thông tin cá nhân, liên hệ và chuyên cần. |
| Nhân sự | Header nhận diện/phục vụ/lớp; hai khối hồ sơ và liên hệ; phân công, tài khoản, xóa vẫn tách riêng. |
| Lớp và các trang chi tiết còn lại | Dùng header chi tiết thống nhất, đường quay lại và khối nội dung có nền/viền trên mobile. Lớp có tóm tắt sĩ số/phòng, thẻ đội ngũ và danh sách thiếu nhi mở toàn hàng. |

## Các hành vi giữ nguyên

- HTML link thật, hỗ trợ Enter, mở tab mới, quay lại và không có JavaScript; không gắn `onClick` vào hàng bảng.
- Chỉ hồ sơ có đích và quyền hiện tại mới có dấu hiệu mở. Thủ quỹ vẫn không có link hồ sơ thiếu nhi; người không có quyền đọc nhân sự vẫn chỉ thấy tên thường trong đội ngũ lớp.
- `prefetch={false}` cho link hồ sơ để không tải hàng loạt trang chi tiết/RPC trước khi bấm, đặc biệt phân trang nhân sự.
- Gọi điện, checkbox, biểu mẫu, nút quản lý ghi danh, tải báo cáo độc lập với link nền hàng.
- Giữ nguồn dữ liệu, quyền nhạy cảm, các tab/URL, bộ lọc, phân trang, thông báo thành công/lỗi và xác nhận thao tác. Không SQL/migration/RLS/server action/dependency mới; không đổi dữ liệu production.
- Luce, Lời Chúa ngẫu nhiên và chế độ giảm chuyển động được giữ nguyên.

## Kiểm chứng

Lượt đầu: lint/typecheck/build đạt, 2.033 unit pass / 24 skip; browser 45 pass / 6 fail. Sáu lỗi cùng nguyên nhân: test cũ tìm `Ngày sinh` đầu tiên trong DOM nên trúng label của sheet sửa đang ẩn. Snapshot cho thấy ngày sinh trong khối đọc hiện đúng. Đã đổi assertion sang vùng “Thông tin liên hệ”; không bỏ kiểm tra quyền.

**Lint/typecheck/build đạt; 2.033 unit pass / 24 skip; browser 117/117 đạt, kiểm lại 51/51 sau chỉnh menu cuối**, gồm bấm khoảng trống thật, Enter, gọi điện, ghi danh, không JavaScript, sáu mục hồ sơ, quyền GLV/Thủ quỹ/Super Admin và loading, trên 360/768/1366. Log/ảnh thử nghiệm dùng fixture local lưu ngoài Git tại `backups/detail-nav-20261014`.

Không coi các lượt này là full E2E toàn hệ thống. Backlog R5–R13/UX-42/R13.3 và các thiếu sót nhập dữ liệu năm học giữ nguyên.

Hoàn tất kiểm chứng ngày 15/10/2026. Lượt cuối sửa menu “Thao tác khác”: tránh bị header cắt và tràn khỏi mép màn hình điện thoại; bổ sung kiểm tra mở menu và sheet trạng thái. Build lại rồi chạy 51/51 bài trong detail-navigation, staff-detail, r4-student-workflows và loading-overlay, không retry/skip.

Lượt chạy sau build bị ngắt vì Docker Desktop chưa chạy (`ECONNREFUSED 127.0.0.1:54421`). Đã giữ log ở `e2e-polish-docker-stopped.log`, khởi động lại các container local có sẵn, rồi chạy lại cùng build. Không đổi môi trường sang production để vượt lỗi này.

Lượt mở rộng đã phát hiện lỗi thật: cột tên cố định che nút Excel trên màn hình hẹp. Đã đổi kho báo cáo sang card-row trên mobile và bỏ sticky tên ở bảng này; kiểm lại bấm xuất độc lập. Các bài cũ cũng được nối đúng entry hiện hành: mở sheet tạo nhân sự/mốc học kỳ, tìm bằng nút Tìm nhân sự, chọn vùng đọc hồ sơ, kiểm bottom sheet theo mép dưới thay vì bắt full-height. Giữ nguyên các assertion nghiệp vụ và kiểm tra quyền.

Ảnh fixture local: [nhân sự 360](verification/evidence/detail-nav-20261014/staff-list-360.png), [hồ sơ nhân sự 360](verification/evidence/detail-nav-20261014/staff-detail-360.png), [thiếu nhi 360](verification/evidence/detail-nav-20261014/student-detail-360.png), [hồ sơ nhân sự 1366](verification/evidence/detail-nav-20261014/staff-detail-1366.png), [lớp 1366](verification/evidence/detail-nav-20261014/class-detail-1366.png).

## Phát hành — 15/10/2026

Source `117362caeb8cf7fb936cfafc8b3208d51818fd3e` đã push `main`; trạng thái Vercel **success** cho đúng commit. Website: [https://cq-tntt-manager-web.vercel.app](https://cq-tntt-manager-web.vercel.app).

Smoke public trên 360 và 1366: `/login` HTTP 200, ô đăng nhập hiển thị, stylesheet có các marker của bản sửa, không tràn ngang hoặc lỗi JavaScript. Chặn mọi POST trong lượt smoke; không thử mật khẩu hoặc thay dữ liệu production. Hồ sơ sau đăng nhập được kiểm trong môi trường local với tài khoản và fixture thử nghiệm; không gọi smoke public là kiểm tra trực tiếp mọi hồ sơ production.

Chứng cứ: [deployment](verification/evidence/detail-nav-20261014/production-deployment.json), [smoke](verification/evidence/detail-nav-20261014/production-smoke.json), [kết quả kiểm thử](verification/evidence/detail-nav-20261014/checks.json). Lệnh: `npm run lint`, `npm run typecheck`, `npm test`; `node scripts/run-e2e.mjs` tự build bằng Next production với Supabase local trước bộ browser. Lượt cuối dùng lại đúng build vừa tạo (`CQ_E2E_DIST_DIR=.next-detail-release`) sau khi Docker hoạt động lại.
