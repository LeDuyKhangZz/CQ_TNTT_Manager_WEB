# Nhật ký lưu trước MOBILE-SHEETS-COPY-20261014

### [2026-10-12] Codex — 2C-VERIFY-R1-R2 — kiểm định theo yêu cầu chủ dự án

- **Kết luận:** R1 chưa thấy lỗi mới trong diff đã kiểm; R1.5 chỉ hoàn tất scope cục bộ. R2.1/R2.2/R2.4 chưa đạt nghiệm thu, chuyển REVIEW; 8 lỗi UI có source, bước tái hiện và browser evidence.
- **Đã chạy:** lint/typecheck/build đạt; Vitest 1869 pass / 1 fail / 24 skip (lỗi cũ phụ thuộc tuần hiện tại, đối chứng Date 21/08 đạt 9/9); browser harness 77/92 pass; E2E chọn lọc app thật + Supabase local 27/30 pass, 3 fail bảng điểm. Baseline trước redesign: 1/3 pass, 2 fail do badge khoá/mở không cập nhật; lỗi hiện lại cột laptop của HEAD chưa phân loại dứt điểm. Chi tiết ở báo cáo.
- **Tài liệu bổ sung:** đã đọc CT_NOIBO_MASTER_UI_UX_CONSTRAINTS_CODEX.md; chỉ áp nguyên tắc UI phù hợp CQ TNTT, không nhập branding/domain của hệ thống khác. Ma trận ràng buộc và bảo toàn nghiệp vụ trong báo cáo.
- **File thay đổi:** WORKLOG + tài liệu tracking REDESIGN + báo cáo/harness/evidence độc lập ngoài repo app. **Không sửa source sản phẩm, không migration/RLS/production; E2E chỉ dùng fixture DB local.**
- **Next:** khi tiếp tục sửa, ưu tiên QA-05 rồi QA-01/02/03/04 và QA-06/07/08. Phiên này **dừng sau kiểm định**, không sửa lỗi hoặc làm task mới, không commit/push; giữ nguyên thay đổi chưa commit của R2.12.

### [2026-10-12] Codex — R2 — hoàn thiện 13 task và kiểm chứng độc lập

- **Đã làm:** sửa QA-01–08; hoàn thiện các primitive và consumer R2; sửa race điều hướng React bằng backport có version/hash guard; chọn năm cũ trên 4 module, banner chỉ đọc và 34 guard server. Bổ sung SSR/no-JS, Login POST, vùng bấm checkbox và feedback khôi phục cột điểm cuối.
- **File thay đổi:** shared UI/layout, truy vấn/action năm học, 4 consumer tabs, export, migration/types, test/runner và tài liệu. Danh mục theo task ở [báo cáo R2](../REDESIGN/16_R2_COMPLETION_2026-10-12.md).
- **Migration/data impact:** migration mới chỉ thêm view/RPC đọc, không đổi RLS/backfill; chạy sạch và áp local. Fixture lịch sử tổng hợp ở local; E2E dùng project audit riêng. Không áp production.
- **Đã test:** lint/typecheck/build đạt; Vitest 1.936 pass / 24 skip; patcher 3/3; pgTAP 1.512/1.512; harness 112/112; navigation 80/80; year view 78/78 và JWT thật. E2E đầu 547 pass / 16 fail / 34 không chạy; cuối 593 pass / 4 lỗi proxy fixture; chạy lại 9/9 đạt. Build hiển thị cuối: shell 87 pass / 3 lỗi giả định fixture, sửa test và chạy lại 3/3 đạt; component 20/20 và context 12/12 đạt.
- **Review độc lập:** foundation, React navigation và year view đã có reviewer; bản sửa feedback cột điểm được xác nhận đúng nguyên nhân. Log/JSON/screenshot giữ tại `../REDESIGN/r2-verification/`.
- **Rủi ro:** Next pin 15.5.20; khi nâng phiên bản phải đánh giá lại backport React. Chưa deploy; không đóng nợ production ngoài R2.
- **Next:** đã dừng sau R2; R3 là phase kế tiếp. R13.3 vẫn cần ba lượt toàn bộ E2E xanh ổn định.
