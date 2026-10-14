# WORKLOG archive before MOBILE-NAV-GROUPS-20261014

### [2026-10-12] Codex — R3 — Shell & Navigation và rà luồng theo vai trò

- **Làm được:** R3.1–R3.5 DONE; 5 biến thể menu, resolver Lớp của tôi đúng Q-R9/năm/phân công, rail nhớ theo tài khoản, badge server đúng lớp/ngành/người nhận, Menu/map/no-JS/coachmark. Sửa QA-01–06; giữ 7 preset mobile và luật CQ.
- **File thay đổi:** `src/config/navigation.ts`, feature navigation mới, layout shell/header/sidebar/drawer/rail/badge/map/sign-out, dashboard layout/page, class detail shortcuts; unit navigation/query và `tests/e2e/r3-navigation.spec.ts`; tài liệu và evidence ở `../REDESIGN/17_R3_COMPLETION_2026-10-12.md`, `18_ROLE_WORKFLOW_REVIEW_2026-10-12.md`.
- **Migration/data impact:** không migration/RLS mới, không production. E2E ghi DB audit riêng 54521; 16 dòng fixture badge/4 bảng đã cleanup đúng ID, xác nhận còn 0 và count về baseline. Walkthrough chỉ đọc normal 54421. Giữ toàn bộ thay đổi R2 chưa commit.
- **Đã test:** `npm.cmd test` 1.967 pass / 24 skip; `npm.cmd run lint`, `typecheck`, `build` đạt. Playwright R3 cuối 54/54; full 651 test: 645 pass / 6 fail, chạy lại 6 tình huống × 3 viewport: 18/18 pass. Walkthrough 644/644; SSR 15/15; shortcut 9/9; 9 cặp viewport chuẩn. Log thật trong `../REDESIGN/r3-verification/`.
- **Độc lập theo AGENTS §9:** JWT 54/54, sau Q-R9 20/20; pure Q-R9 9/9; badge dương 52/52; rail 13/13; NextLink 32/32. Không dùng lượt trước sửa để che lỗi; bundle cuối QA-06 được build và kiểm R3/shortcut lại.
- **Quyết định mới:** không có; CT_NOIBO chỉ áp nguyên tắc UI, giữ DS/nghiệp vụ CQ. Đã rà 14 vai trò/14 module và ghi điểm bất tiện từng phase sau.
- **Blocker/rủi ro:** R13.3 chưa có ba lượt toàn bộ xanh; UX-41 thiếu báo lỗi/retry giám hộ khi RPC 502; UX-42 tiêu đề desktop lặp. Chưa kiểm Safari/iOS thật, không tuyên bố mọi mutation của mọi vai trò đều đã chạy lại.
- **Next action:** R4 Thiếu nhi + UX-41; chưa bắt đầu R4, chưa deploy, chưa commit/push gộp working tree R2/R3.

### [2026-10-13] Codex — R4.1 — danh sách thiếu nhi

- **Làm được:** Toolbar/FacetFilter, DataTable v2, sort máy chủ và phân trang20/50; form trong drawer URL; giữ năm lịch sử/quyền Thủ quỹ. Sửa compact CSS, popup tràn và margin drawer.
- **File thay đổi:** students page/directory/queries, PageHeader, FacetFilter, ColumnToggle, Drawer, globals.css; unit/E2E và docs. [Báo cáo19](../REDESIGN/19_R4_1_COMPLETION_2026-10-13.md) ghi phạm vi và ảnh.
- **Migration/data impact:** không migration/RLS/production; E2E local có ghi fixture. Spec mới cleanup đúng51 UUID/worker; spec cũ giữ tác động fixture vốn có. Không reset/seed DB.
- **Đã test:** lint/typecheck/build đạt; full unit1.978 pass/24 skip; E2E90/90 ba viewport; hồi quy tập trung111/111. Reviewer độc lập query/component, các lượt70/70,37/37,44/44.
- **Quyết định mới:** không có; D-R14 một task rủi ro cao trong phiên. Form hiện có chưa phải wizard R4.2.
- **Blocker/rủi ro:** không có blocker R4.1; R4.2–.5, UX-41 detail, UX-42/R13.3 vẫn mở. Giữ log lỗi trước sửa và giới hạn Thủ quỹ scalar/fixed sort.
- **Next action:** R4.2 wizard giám hộ → thiếu nhi. Chưa commit/push vì có thay đổi R2/R3 sẵn trong cùng worktree; không gộp vào task này.
