# ERP UI/UX Redesign — ANTI-AI-ERP-20261013

> Cập nhật 14/10/2026: đã hoàn tất implementation và build local; đang chạy E2E mở rộng và chuẩn bị push/redeploy theo yêu cầu mới của chủ dự án. Chỉ ghi deployed sau khi kiểm tra URL production.

## Phạm vi và nguồn quyết định

Yêu cầu ngày 13/10/2026: đọc toàn bộ `../../../redesign-anti-AI/ERP_UI_UX_REDESIGN_MASTER_ANTI_AI.md`, redesign toàn bộ ERP, giữ nghiệp vụ và chỉ giữ quy định màu từ giao diện cũ. Yêu cầu này thay thế các quy định hình thức cũ về card mềm, minh họa, radius, shadow và mật độ; không thay thế quy tắc nghiệp vụ, phân quyền và theme resolver.

Giữ nguyên màu nền, chữ, viền, semantic status và toàn bộ bảng màu ngành (bao gồm chữ đậm/nguyên tắc hover sáng của Nghĩa Sĩ), theme theo dữ liệu năm hiện hành và các trạng thái năm lịch sử. Giữ Be Vietnam Pro vì đã hỗ trợ tiếng Việt và không cần thêm font/dependency.

## UI Audit Matrix trước triển khai

| Phạm vi | Người dùng / công việc | Vấn đề xác định từ source | Mức | Giải pháp |
|---|---|---|---|---|
| Shell và mọi page | Mọi vai trò, tìm đúng tác vụ | PageContainer giới hạn 1440px cả bảng trên màn 2560px; header lặp tên trang; spacing 24–32px cộng dồn | P2 | Workspace rộng theo màn; title tập trung ở page; spacing 16–24px |
| Card / EmptyState / FilterBar | Đọc dữ liệu, tìm kiếm | Card 16px + bóng; empty min-height 256px + minh họa; helper rỗng vẫn giữ chỗ; lọc luôn có CTA màu mạnh | P2 | Panel có border và radius nhỏ; empty gọn bằng chữ; lọc thứ cấp và bỏ chỗ trống không có nội dung |
| Dashboard | Người vận hành tìm việc tiếp theo | 5 KPI thành grid 4 + 1, tác vụ/ngoại lệ xen nội dung ít khẩn cấp | P1 | Việc cần xử lý trước, số tổng hợp thành dải thống kê gọn |
| Lớp / giáo án / kết quả | GLV, quản lý tìm lớp và nhập liệu | Danh mục lớp dạng card lớn; cấu hình lấn chỗ tác vụ lặp lại | P1 | Bảng/row gọn; giữ ngữ cảnh, ưu tiên điểm danh/nhập điểm/giáo án |
| Thiếu nhi / nhân sự / quản trị | Tra cứu, sửa hồ sơ | Dùng chung nhiều kiểu panel, chi tiết và form còn nặng khung | P2 | Đồng bộ token, header, list/detail, giảm card lồng nhau |
| Điểm danh / bảng điểm / chuyển lớp | GLV nhập ngoại lệ, quản lý duyệt | Nhiều khối rời, màu bình thường lấn át ngoại lệ | P1 | Row liên tục, nhấn trạng thái cần xử lý; giữ điều kiện khóa/lease |
| Báo cáo / nhập liệu / Ban / thiết bị | Đối soát, upload, quản lý | Filter và biểu mẫu dài, nhiều card nội dung tương đương | P2 | Phân cấp section, toolbar, bảng đồng nhất |
| Portal / đăng nhập | Phụ huynh, thiếu nhi | Card dày, khoảng trống lớn | P2 | Danh sách gọn, giữ chữ/touch comfortable và cô lập dữ liệu |

## Business Preservation Matrix

| Luồng | Route / nguồn | Ràng buộc giữ | Rủi ro UI / cách bảo toàn |
|---|---|---|---|
| Điều hướng / theme / năm học | config/navigation, lib/theme, shell | Menu theo quyền, cookie năm xem, ngữ cảnh ngành, deep-link | Giữ href/guards/resolver; chỉ đổi bố cục |
| Hồ sơ thiếu nhi / giám hộ / nhân sự | students, staff, enrollments | Một lớp chính, liên kết giám hộ, archived, Thủ quỹ cửa sổ hẹp | Giữ queries/actions/schema, tabs và xác nhận |
| Điểm danh | attendance | Mass/catechism độc lập, mặc định có mặt, lease 15 phút, khóa 3 ngày, đơn nghỉ | Giữ handlers, input names, trạng thái pending/locked |
| Giáo án / điểm / Top 5 | teaching-plans, assessments, results | Quyền phân công, upload, null ≠ 0, trọng số, khóa, publish | Không đổi phép tính/API; bổ sung baseline đã lưu và đồng bộ từng ô để giữ phần gõ tiếp khi refresh |
| Chuyển lớp | promotions | Đề nghị/duyệt, năm nguồn/đích, lịch sử quyết định | Giữ eligibility/quyền/trạng thái và RPC; bulk proposal chỉ hiện khi đã chọn dòng |
| Ban / thiết bị | committees, equipment | Phạm vi thành viên, mượn/trả từng phần, hỏng/mất, stock audit | Giữ actions và confirm; không đổi tồn kho |
| Báo cáo / import | reports, imports | Filter/export, snapshot bất biến, formula injection, preview/commit import | Giữ query/form field và endpoints |
| Tài khoản / năm học / thông báo | admin, auth, academic-years, notifications | Super Admin, credential, recipients/idempotency | Không thay permission/action/query |
| Portal | parent, student, portal | Cô lập con/mình, staff_only, ghi chú điểm danh nội bộ | Giữ server data scope; không thêm trường |

## Design direction

- Một hệ token: radius badge 4px, control 6px, panel 8px, overlay 10px; panel không bóng, overlay giữ bóng hiện có.
- Tiêu đề 20px mobile / 24px desktop, section 16px, data 14px; control/touch ít nhất 44px, portal giữ 48px.
- Nền trung tính hiện có; màu ngành dành cho context, selected và CTA; trạng thái có chữ.
- List dùng toàn chiều ngang; form đơn lẻ giới hạn chiều rộng khi có ý nghĩa. Khoảng cách cha sở hữu, tránh nhân đôi.
- Không thêm thư viện, API, module, KPI, dữ liệu mẫu hoặc quyền mới.

## Phạm vi route và component

| Nhóm | Route áp dụng | Thay đổi |
|---|---|---|
| Shell / hệ thống | Mọi route dashboard; `/account`, `/access-denied`, loading/error/404 | `globals.css`, PageContainer/Header, AppHeader/Sidebar/Shell, AllFeaturesGrid; Card/Badge/Section/FilterBar, EmptyState/LoadingState/ErrorState |
| Auth | `/login`, `/change-password` | Layout một cột, nhận diện thật, form gọn; bỏ hero, blob và câu chào trang trí |
| Tổng quan | `/dashboard` | DashboardOverview theo quyền; việc cần làm trước; thống kê thành một dải; các section không bị kéo cao theo ô bên cạnh |
| Danh bạ | `/classes`, `/classes/[classId]`, `/staff`, `/staff/[staffId]`, `/staff/bulk`, `/students`, `/students/[studentId]` | Lớp/nhân sự thành bảng; enrollment thành row; trường hợp tạo/phân công bên dưới danh sách. Students giữ DataTable, drawer, wizard và detail tabs đã có, nhận token/shell mới |
| Điểm danh | `/attendance`, `/attendance/[sessionId]` | Bảng buổi gần đây, row ngoại lệ gọn, tên dài xuống dòng; save bar tránh bottom navigation ở cả mobile/tablet |
| Học tập | `/results`, `/results/[classId]`, `/teaching-plan`, `/teaching-plan/[classId]` | Bảng chọn lớp; nhập điểm trước cấu hình; điểm số căn phải; lịch giáo án dùng bảng; kết quả công bố bớt khung màu |
| Chuyển lớp | `/promotions` | Danh sách trước tiến độ, form hàng loạt chỉ xuất hiện khi chọn dòng; guard duyệt giữ nguyên |
| Vận hành | `/committees`, `/committees/[committeeId]`, `/notifications` | Danh sách Ban liên tục; thêm thiết bị và soạn thông báo dùng disclosure; inbox giữ thứ tự/quyền |
| Báo cáo / nhập | `/reports`, `/reports/snapshots`, `/reports/snapshots/[snapshotId]`, `/imports`, `/imports/[batchId]` | ReportWorkbench bỏ header lặp; upload có chiều rộng hợp lý, paste là disclosure; lịch sử nhập thành row; detail nhận shared UI |
| Quản trị | `/admin?section=years\|accounts\|attendance\|imports` | Nhóm cấu hình có URL riêng và active state; tài khoản đóng/mở từng mục; helper liên kết tới nhân sự đủ vùng chạm |
| Portal | `/parent/children`, `/parent/children/[studentId]`, `/parent/absence-requests`, `/student/attendance` | ChildrenLinks dạng list; AttendanceHistory hiển thị ngày, thứ, Thánh lễ và Giáo lý ở mobile; giữ density comfortable và scope server |

Các export routes, actions, queries, permission helpers, schema, RLS, migration, theme resolver, phép tính và dependency không được thay đổi. Không tạo module hoặc dữ liệu hiển thị mẫu. Các trang detail đã có template phù hợp được cập nhật qua shared components, không viết lại logic.

## Đối chiếu trước / sau

| Vấn đề | Kết quả triển khai / cách đối chiếu |
|---|---|
| Workspace list bị giới hạn 1440px | PageContainer bỏ trần width; form đơn có max-width riêng. Đã kiểm tra tới 2560px |
| Mọi card đều nổi và bo mềm | Token radius 4/6/8/10px; Card bỏ bóng, dùng border. Giá trị màu trong globals.css không đổi |
| Dashboard nhiều ô rỗng/cao bằng nhau | Một dải số liệu + section theo công việc; hai cột desktop là hai stack độc lập |
| Chọn lớp qua card lớn | `/classes`, `/results`, `/teaching-plan` dùng table semantic; giữ liên kết chi tiết và đúng quyền |
| Nhân sự phải cuộn qua form/bộ lọc lớn mới thấy dữ liệu | Search chính + disclosure bộ lọc; create/assign nằm sau danh sách và có anchor từ header |
| Portal mobile phải cuộn ngang để đọc chuyên cần | Ngày/thứ chung một ô; cả hai loại điểm danh còn trên màn 360px |
| Loading che toàn bộ công việc bằng ảnh/câu trích | Thông báo tiến trình nhỏ, không bắt pointer; timing/điều kiện loading giữ; layout không fetch/serialize tài nguyên ảnh và câu trích nữa |
| Hành động ít dùng chiếm toàn màn | Account edit, thêm thiết bị, paste import, soạn thông báo dùng disclosure native; phải mở thêm một bước có chủ đích, draft vẫn mounted |
| Bulk action hiện khi không có lựa chọn | Form đề nghị hàng loạt chỉ hiện khi có dòng đã chọn; số dòng và xác nhận cũ giữ nguyên. Duyệt vẫn theo từng dòng |
| Bản nháp điểm danh/điểm có thể mất khi chuyển trang; refresh thay mất phần gõ tiếp trong lúc lưu | Guard opt-in cho hai editor; ghi nhận đúng snapshot đã lưu, so sánh từng ô khi nhận dữ liệu mới; không thay phép tính hoặc API |

Không có nghiên cứu người dùng hoặc đo thời gian hoàn thành tác vụ trước/sau trong phiên này; không suy diễn phần trăm tăng năng suất từ screenshot. Đổi thứ tự tác vụ và mật độ được đối chiếu bằng source, vị trí dòng thật trong browser và các hành trình E2E.

## QA và bàn giao

Kết quả trên source cuối, không sử dụng kết quả của phiên R4 làm bằng chứng cho phiên này:

| Kiểm tra | Kết quả / evidence |
|---|---|
| `npm.cmd run lint` | Đạt, không ESLint warning/error; có thông báo deprecation của lệnh Next lint |
| `npm.cmd run typecheck` | Đạt |
| `npm.cmd test` | **2026 pass / 24 skip**, 135 file pass / 6 file skip; `anti-ai-unit-release-final.log` |
| `npm.cmd run build` | Đạt, prebuild React retry check và mọi route build xong; `anti-ai-build-final.log` |
| E2E laptop lượt đầu | **226 pass / 3 fail**. Ba lỗi do fixture dùng lại: 2 nhân sự đã bị lượt trước xóa, 1 đề nghị chuyển lớp đã được duyệt. Đã sửa fixture đúng scope local; rerun **2/2 staff + 1/1 results** đạt; không cộng thành một lượt 229/229 |
| E2E ba viewport, bản build cuối | Lượt **687 ca** bị ngắt sau **19 ca đạt** khi local stack dừng; chưa có kết quả toàn bộ. `anti-ai-e2e-final.log` |
| Smoke phát hành, build cuối | **43/43 đạt**, gồm authenticated shell, home/login/deep-link/404, results/publish/lock/export/Top5/promotion và staff CRUD/permission. `anti-ai-release-smoke-restored.log`; Docker khởi động lại với dữ liệu sẵn có, không reset |
| Portal/auth/dashboard/404 bản cuối | **80/80** (8 màn × 10 width), không overflow/page error/button thiếu tên; role isolation và Back/Forward/Refresh đạt; `playwright-report/anti-ai-portal-final` |
| Nhân sự bản cuối | 10 width × filter đóng/mở đều không overflow; GET q/classId/service, refresh/back, no-JS GET đạt; helper tài khoản 44px ở 360/1366; `staff-final-results.json` |
| Directory/admin lượt nền | **90/90** (9 màn × 10 width), HTTP200, một h1 và không overflow; thêm 90 hard navigation có gắn route không lặp hydration error |
| Operations build cuối | **100/100** kiểm layout (10 màn × 10 width) HTTP200, không overflow, một h1, không button thiếu accessible name. Có **2 hydration #418** ở `/teaching-plan:390` và `/results:1440`; không coi đây là 100 lượt không JS error. `playwright-report/anti-ai-operations/results.json` |
| Draft safety | **83/83** targeted cases; thêm 26 tests có trong tổng unit, không cộng hai lần. Reviewer độc lập kiểm window capture, baseline ack và giữ phần gõ sau khi lưu |

Riêng mật độ `/staff`: trong lượt QA đầu dòng dữ liệu ở y584.5 (1366px) và y831.5 (360px); sau thu gọn toolbar đạt **y333.5** và **y410.5** tương ứng. Đây là đo vị trí trong browser, không phải đo thời gian thao tác.

### Phân biệt bằng chứng

- Playwright nghiệp vụ dùng Supabase **local** và Chromium; không chạy vào production, không reset DB.
- Ma trận responsive dùng 10 chiều rộng `360/375/390/430/768/1024/1366/1440/1920/2560`.
- Fixture stress của DataTable dùng DOM bản sao trên browser ở 1/5/20/105 dòng; trạng thái 0 dùng query rỗng thật. Đây là kiểm tra layout, không chứng minh backend có 105 bản ghi hay hiệu năng phân trang ở quy mô đó.
- Portal fixture 0/1/5/20/100 dùng component thực và dữ liệu tổng hợp trong trang browser riêng, không ghi DB.
- Kết quả test đầy đủ, screenshot và giới hạn sẽ được ghi sau lượt chạy cuối.

## Rollback và giới hạn phạm vi

Rollback bằng khôi phục riêng các thay đổi UI, hook bảo vệ nháp và test của task này về baseline `8c6024a` (UI source tương đương `e4dcf89`), sau đó build lại. Không reset repository hoặc hoàn tác thay đổi khác của chủ dự án. Không có migration/backfill/API mới nên không có bước rollback dữ liệu. Trạng thái push/deploy ghi ở phần cập nhật đầu báo cáo.

Backlog R5–R13/UX-42 của lộ trình trước vẫn giữ trạng thái riêng; việc áp dụng giao diện này không tự đánh dấu các task nghiệp vụ/kiểm định đó hoàn tất.

### Giới hạn phải giữ khi nghiệm thu

- **P2 — phạm vi bảo vệ nháp:** chỉ áp dụng cho điểm danh và ô nhập điểm/ghi chú điểm. Cảnh báo khi đóng/reload và bấm liên kết nội bộ đổi trang/query; không chặn Back/Forward hoặc điều hướng bằng mã, không thêm cơ chế bảo vệ mọi form trong ERP. Link external dùng cơ chế unload của trình duyệt; hash, export, download, new-tab và submit không bị click guard can thiệp.
- **P2 — thiết bị/browser:** chạy Chromium desktop với viewport/touch emulation. Chưa nghiệm thu Safari/iOS, Android thật hoặc bàn phím ảo che save bar. Không suy từ resize sang chứng nhận thiết bị thật.
- **P2 — dữ liệu lớn/hiệu năng:** stress 100+ là layout fixture; không phải đo tải đồng thời, độ trễ mạng yếu hay backend với dữ liệu lớn thật. Không bổ sung virtualizer khi chưa có số liệu cần nó.
- **Kiểm thử tùy chọn:** 24 ca thuộc 6 integration suites bị skip theo cấu hình môi trường; không ghi chúng là pass. Không chạy lại pgTAP vì không sửa SQL/RLS/server permission; kết quả pgTAP phiên R4 không được tính vào lần này.
- **Mạng lỗi:** có kiểm tra phản hồi save thất bại bằng unit mocks và PWA/offline trong bộ E2E; chưa chứng minh mọi thao tác giữ nháp qua mất mạng thật/khởi động lại ứng dụng.
- **P2 — hydration còn cần điều tra:** một lần React #418 ở sweep directory ban đầu chưa gắn route, không tái hiện qua16+90 lượt điều tra. Sweep operations cuối ghi2 lần tại `/teaching-plan:390` và `/results:1440`. Lặp10 lần mỗi case: teaching-plan tái hiện2/10, results0/10; tất cả vẫnHTTP200 và có nội dung. Chưa xác định nguyên nhân/quan hệ với redesign; không ghi đã sửa hay không còn JS error. Không ghi nhận luồng bị chặn trong43 smoke E2E. Evidence `hydration-followup.json`.

## Task file inventory

- `WORKLOG.md`
- `docs/08-phase-plan.md`
- `docs/system-workflow-redesign/00_SYSTEM_AUDIT_BOARD.md`
- `docs/system-workflow-redesign/ANTI_AI_ERP_2026-10-13.md`
- `docs/system-workflow-redesign/ui-redesign/09_APPROVED_DESIGN_SYSTEM.md`
- `docs/system-workflow-redesign/ui-redesign/16_PHASE_2B_IMPLEMENTATION_LOG.md`
- `docs/worklog-archive-before-anti-ai-2026-10-14.md`
- `src/app/(auth)/change-password/page.tsx`
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(dashboard)/admin/page.tsx`
- `src/app/(dashboard)/attendance/page.tsx`
- `src/app/(dashboard)/classes/[classId]/page.tsx`
- `src/app/(dashboard)/classes/page.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/imports/page.tsx`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/promotions/page.tsx`
- `src/app/(dashboard)/results/page.tsx`
- `src/app/(dashboard)/staff/page.tsx`
- `src/app/(dashboard)/teaching-plan/page.tsx`
- `src/app/globals.css`
- `src/app/not-found.tsx`
- `src/components/layout/all-features-grid.tsx`
- `src/components/layout/app-header.tsx`
- `src/components/layout/app-shell.tsx`
- `src/components/layout/app-sidebar.tsx`
- `src/components/layout/page-container.tsx`
- `src/components/layout/page-header.tsx`
- `src/components/loading/loading-overlay.tsx`
- `src/components/loading/loading-provider.tsx`
- `src/components/shared/empty-state.tsx`
- `src/components/shared/error-state.tsx`
- `src/components/shared/loading-state.tsx`
- `src/components/shared/use-unsaved-changes-guard.ts`
- `src/components/ui/badge.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/filter-bar.tsx`
- `src/components/ui/section.tsx`
- `src/features/assessments/components/gradebook-editor.tsx`
- `src/features/assessments/components/published-results-portal.tsx`
- `src/features/attendance/components/attendance-editor.tsx`
- `src/features/attendance/components/roster-row.tsx`
- `src/features/auth/components/account-admin-panel.tsx`
- `src/features/auth/components/change-password-form.tsx`
- `src/features/auth/components/login-form.tsx`
- `src/features/committees/components/committee-list.tsx`
- `src/features/dashboard/components/dashboard-overview.tsx`
- `src/features/enrollments/components/roster-row.tsx`
- `src/features/equipment/components/equipment-board.tsx`
- `src/features/imports/components/import-target-fields.tsx`
- `src/features/notifications/components/notification-center.tsx`
- `src/features/portal/components/attendance-history.tsx`
- `src/features/portal/components/children-links.tsx`
- `src/features/promotions/components/promotion-board.tsx`
- `src/features/promotions/components/promotion-progress.tsx`
- `src/features/reports/components/report-workbench.tsx`
- `src/features/teaching-plans/components/teaching-plan-editor.tsx`
- `src/features/teaching-plans/components/week-ahead-schedule.tsx`
- `tests/e2e/account-security.spec.ts`
- `tests/e2e/attendance.spec.ts`
- `tests/e2e/authenticated-shell.spec.ts`
- `tests/e2e/class-settings.spec.ts`
- `tests/e2e/committees.spec.ts`
- `tests/e2e/enrollment-lifecycle.spec.ts`
- `tests/e2e/home.spec.ts`
- `tests/e2e/notifications.spec.ts`
- `tests/e2e/promotions.spec.ts`
- `tests/e2e/results.spec.ts`
- `tests/e2e/staff-directory.spec.ts`
- `tests/e2e/teaching-plan.spec.ts`
- `tests/unit/attendance-editor-roster.test.tsx`
- `tests/unit/filter-field.test.tsx`
- `tests/unit/gradebook-editor.test.tsx`
- `tests/unit/loading-provider.test.tsx`
- `tests/unit/panel.test.tsx`
- `tests/unit/use-unsaved-changes-guard.test.tsx`
