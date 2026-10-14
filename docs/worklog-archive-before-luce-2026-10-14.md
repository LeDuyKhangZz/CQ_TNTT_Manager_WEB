# Nhật ký lưu trước lượt khôi phục Luce

### [2026-10-14] Codex — ANTI-AI-ERP-20261013 — redesign ERP và chuẩn bị phát hành
- **Làm được:** áp dụng tiêu chuẩn anti-AI toàn shell/module; chỉ giữ palette; bảng/list gọn, dashboard theo việc, disclosure cho tác vụ ít dùng, loading không che màn hình; bảo vệ nháp điểm danh/điểm và giữ phần gõ tiếp qua save/refresh.
- **File thay đổi:** inventory và route matrix tại [báo cáo anti-AI](docs/system-workflow-redesign/ANTI_AI_ERP_2026-10-13.md); shared UI, presentation components, tests và docs.
- **Migration/data impact:** không đổi SQL/RLS/API/permission/dependency; E2E dùng fixture local riêng, không seed/reset production.
- **Đã test:** lint/typecheck/build đạt;2026unit pass/24skip. Laptop226pass/3fixturefail, rerun3/3pass; final browser80/80 và staff10width đạt; full687 ngắt ở19pass khi local stack dừng. Khôi phục Docker, smoke release43/43pass trên build cuối.
- **Quyết định mới:** yêu cầu chủ dự án13/10 thay tiêu chuẩn hình thức cũ, giữ màu/nghiệp vụ; yêu cầu14/10 push/redeploy. Không tự đóng backlog R5–R13.
- **Blocker/rủi ro:** fullE2E chưa xanh toàn bộ; guard không intercept history/programmatic navigation; xem báo cáo. Docker đã khôi phục.
- **Phát hành / ANTI-AI-ERP-RELEASE-20261014:** source97b83c9 đã pushmain; Vercel success đúngSHA; smoke public production360/1366 đạt, xác nhận token8px/none và guard/dashboard. Bàn giao tài khoản theo lựa chọn chủ tài khoản; không tự reset mật khẩu.
