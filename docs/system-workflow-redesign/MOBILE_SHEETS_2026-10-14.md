# MOBILE-SHEETS-COPY-20261014 — giao diện vận hành trên điện thoại

## Yêu cầu đang có hiệu lực

Chủ dự án yêu cầu menu và tài khoản mở từ đáy theo ảnh tham khảo; giảm chữ, giảm khung card, không dùng nút cuộn xuống form cuối trang. Phạm vi mở rộng sang mọi module/vai trò, giữ màu và nghiệp vụ. Yêu cầu này thay thế các quy tắc trình bày cũ mâu thuẫn với ảnh tham khảo.

Preview trực tiếp chạy ở `http://127.0.0.1:3150`, Chromium có cửa sổ 390×844 và Fast Refresh. Browser kiểm tra chạy riêng. Preview dùng Supabase local, không dùng dữ liệu production. Tài khoản production KHANG.NHO tiếp tục dùng mật khẩu hiện có; không đặt lại.

## Thay đổi

| Phạm vi | Bố cục mới |
|---|---|
| Điều hướng chung, 14 vai trò | Menu bottom sheet có tìm kiếm không dấu, lưới chức năng theo quyền; tài khoản là sheet có hồ sơ, đổi mật khẩu, đăng xuất. Desktop giữ sidebar. |
| Tổng quan | Rút gọn số liệu, thông báo rỗng và lời dẫn; giữ cảnh báo, phạm vi, và giới hạn dữ liệu của Thủ quỹ. |
| Thiếu nhi | Mobile giữ họ tên, lớp, nút gọi; thông tin gia đình/tên thánh vẫn trong hồ sơ. Bỏ chip trùng với trạng thái mặc định. Bí tích thêm/sửa trong sheet. |
| Huynh trưởng/GLV | Danh sách mobile chỉ giữ thông tin nhận diện và phân công. Thêm/phân công dùng URL drawer; sửa hồ sơ/quản lý phân công dùng sheet. Không còn anchor tới form cuối danh sách. |
| Điểm danh | Hai cột Thánh lễ/Giáo lý thao tác trực tiếp; đủ 5 trạng thái độc lập. Chạm tên mở ghi chú/đơn nghỉ/cảnh báo. Bộ lọc gọn, nút lưu/hoàn tất cùng hàng. |
| Lớp/ghi danh | Danh sách phẳng trên mobile; quản lý ghi danh mở sheet, các xác nhận và ngày/lý do kết thúc vẫn giữ riêng. |
| Giáo án | Áp dụng bố cục mobile chung, giữ các thao tác và biểu mẫu chuyên biệt hiện có. |
| Kết quả học tập | Chuyển mục tại chỗ, giữ các bản nháp khi đổi mục; chọn cột điểm tại chỗ thay vì anchor xuống nhiều form. Thêm cột mở sheet. |
| Lên/chuyển lớp | Đề xuất và tiến độ là hai mục tại chỗ; bộ lọc mở sheet, phạm vi áp dụng vẫn hiện trên danh sách. |
| Ban | Sửa thông tin, thêm thành viên, đăng thông báo, thêm/sửa lịch họp mở sheet; phản hồi tác vụ nằm trong sheet. |
| Trang thiết bị | Tạo, sửa, cho mượn, nhận lại, hỏng/mất, điều chỉnh kho mở sheet. Xác nhận nghiệp vụ giữ nguyên. |
| Thông báo | Soạn trong sheet, vẫn xem lại đối tượng/số người nhận và xác nhận trước gửi. |
| Báo cáo | Bộ lọc mở sheet; loại/phạm vi/kỳ của báo cáo đang xem và xuất/chốt giữ theo dữ liệu đã tải. |
| Nhập dữ liệu | Giữ quy trình nhập chuyên biệt có kiểm tra/xem trước; áp dụng bố cục mobile chung. |
| Quản trị/tài khoản | Tạo năm học, mốc học kỳ, chốt năm, tạo/quản lý tài khoản và sửa liên lạc trong sheet. Các giới hạn quyền/xác nhận giữ nguyên. |
| Phụ huynh/thiếu nhi | Shell theo cùng mẫu, nội dung chỉ theo quyền; gửi đơn nghỉ mở sheet. Không thêm quyền đọc ghi chú nội bộ. |

Card trên màn hình nhỏ được bỏ viền/nền bao dư, dùng tiêu đề và đường phân cách. Ngoại lệ: ô chức năng menu theo ảnh tham khảo, bảng dữ liệu và cảnh báo cần phân biệt. Màu vẫn dùng token hiện có; không thêm thư viện, API, schema hay migration.

## Cơ sở thiết kế

Form thao tác phụ được tách khỏi danh sách, theo cách phân loại form trong [Carbon create flows](https://v10.carbondesignsystem.com/community/patterns/create-flows/). Danh sách mobile ưu tiên trường nhận diện và thao tác, đưa thông tin bổ sung vào chi tiết, tham khảo [SAP Fiori responsive table](https://experience.sap.com/fiori-design-web/responsive-table/). Đây là lựa chọn áp dụng cho ERP này, không sao chép toàn bộ giao diện hai hệ thống.

## Bảo toàn hành vi

- `TaskSheet` giữ form trong DOM khi đóng để mở lại còn nháp. `ActionSheet` nâng cấp native disclosure thành sheet trên cùng cây DOM; dữ liệu nhập trước hydration được giữ. Native form còn truy cập được khi JavaScript chưa tải.
- Focus, Escape, Tab và khóa cuộn dùng chung modal behavior; có đường trả focus rõ cho thao tác mở trước hydration. Xác nhận lồng sheet chỉ đóng lớp trên cùng.
- Các drawer theo URL giữ link/GET/Server Action và đường đóng không-JS. Không đổi quy tắc cấp quyền, scope, lưu điểm hay chốt buổi.
- Khi kiểm tra phát hiện lỗi UI cũ: heartbeat mất lease nhưng vẫn cho chỉnh/lưu. Đã khóa điều khiển, chặn submit và đóng xác nhận đang mở; giữ bản nháp và nội dung bàn giao. Không thay luật lease trên server. Refresh cùng phiên giữ trạng thái khóa an toàn.

## Kiểm chứng cuối

- `npm.cmd run lint`, `npm.cmd run typecheck`: đạt, không lỗi. `npm.cmd run build` với `CQ_E2E_DIST_DIR=.next-r4-mobile-20261014`: đạt; build riêng để không ngắt Fast Refresh của cửa sổ người dùng.
- `npm.cmd test -- --maxWorkers=2 --minWorkers=1 --reporter=json --outputFile=playwright-report/mobile-unit-release.json`: **2.028 đạt, 0 lỗi, 24 integration bỏ qua**. Hai timeout khi chạy cạnh build đã được kiểm lại theo nhóm (37/37), sau đó toàn bộ suite chạy cuối đạt như số trên.
- Playwright `tests/e2e/r3-navigation.spec.ts tests/e2e/mobile-workspaces.spec.ts`: **74 đạt, 28 bỏ qua có chủ đích**, 8,7 phút. Phần rà toàn bộ module của 14 vai trò chỉ chạy ở 360px nên bỏ qua 28 bản trùng ở tablet/laptop. Đây không phải lượt toàn bộ E2E lịch sử.
- Sau khi thu gọn bộ lọc Huynh trưởng và Lên lớp, chạy lại `mobile-workspaces.spec.ts --grep 'Staff|Roster'` trên build cuối: **9/9 đạt**, 29,4 giây, ba viewport. Không cộng lượt này vào lượt chính để tạo số kiểm thử giả.
- Bộ `mobile-workspaces.spec.ts` mở các route trong danh mục quyền của đủ 14 vai trò ở 360px, kiểm tra HTTP, heading, overflow, JavaScript error và chụp ảnh từng trang. Các ca form/roster/report được chạy thêm ở 768/1366px.
- Bộ `r3-navigation.spec.ts` kiểm tra danh mục, menu, lớp của tôi, account, tìm không dấu, đổi viewport, focus và fallback không-JS ở ba viewport.
- Kiểm chứng độc lập theo AGENTS §9: 59 test guard/drawer đạt; harness component thật xác minh 5 trạng thái độc lập, giữ ghi chú, mất lease không gửi save; SSR→hydrate giữ node/giá trị/focus và nested modal. Hai lượt browser của verifier timeout trong lúc HMR không được tính là đạt.
- Screenshot và log local: `playwright-report/mobile-working/`, `playwright-report/mobile-suite-1/`, `playwright-report/mobile-e2e.log`, `playwright-report/mobile-refinement-e2e.log`, `playwright-report/mobile-unit-release.json`, `playwright-report/mobile-release-build.log`.

## Giới hạn và phát hành

Giả lập browser không thay thế kiểm tra bàn phím ảo và Safari trên máy iPhone thật. Lượt kiểm tra route theo vai trò là kiểm tra giao diện/read-only, không phải toàn bộ ma trận CRUD/RLS. Không gọi toàn bộ E2E lịch sử là xanh khi chỉ chạy các spec được ghi ở đây. Các backlog R5–R13/UX-42/R13.3, 24 integration test skip và theo dõi hydration lịch sử giữ riêng.

Giữ nháp trong `TaskSheet` áp dụng khi component còn mounted. Drawer theo URL hoặc điều hướng sang trang khác không được mô tả như có bảo vệ nháp toàn hệ thống; guard hiện có của điểm danh/điểm không chặn mọi history/programmatic navigation. Kiểm thử không-JS bao phủ directory và native form fallback, chưa bao phủ chuyển mục của `SectionSwitcher`.

Implementation và các gate cục bộ đã hoàn tất. Đang chuẩn bị commit/push; chỉ ghi nhận deployed sau khi Vercel success đúng SHA và smoke URL công khai. Không migration, reset/seed DB hay thay mật khẩu production. Rollback UI bằng revert commit task, không cần rollback dữ liệu.
