# RESPONSIVE-FEEDBACK-20261016

Phản hồi chủ dự án ngày 16/10/2026: bỏ cột nhãn lặp trong module lên lớp trên điện thoại; sửa chữ chật ở laptop và rà các module; ô tìm tài khoản tự điền KHANG.NHO; thêm tìm tên và lọc ngành/lớp cho thành viên Ban. Dùng skill `ui-ux-pro-max` theo yêu cầu, đối chiếu hướng dẫn responsive table/card, text reflow và responsive padding với hệ màu/font hiện hành.

## Thay đổi

| Phần | Kết quả |
|---|---|
| Lên lớp/chuyển lớp | Mobile mỗi em là một thẻ riêng, có viền và khoảng cách. Tên nổi bật, lớp ở dưới, đề xuất có nội dung mới hiện, badge trạng thái và hàng tác vụ tách bằng đường ngang. Bỏ các nhãn cột lặp. Giữ checkbox, chọn hàng loạt, form đề xuất/duyệt, lịch sử và xác nhận. Desktop giữ bảng. |
| Danh sách trên laptop | Đo trước sửa: bảng compact có padding dọc 0px, header chỉ cao theo một dòng chữ; nhiều hàng chứa hai dòng nên dính sát viền. Từ 768px, token padding ô thành 8px 16px; staff có khoảng cách 4px giữa dòng chính/phụ. Mobile vẫn dùng padding thẻ riêng. Điều chỉnh mật độ theo phản hồi mới, không đổi font, màu hoặc quyền. |
| Tìm tài khoản | Form tìm kiếm riêng `role=search`, tên trường riêng, autocomplete off. Form sửa từng tài khoản tách riêng; mật khẩu cấp cho người khác dùng `new-password`. Không sửa giá trị tìm kiếm bằng timer hoặc chặn người dùng nhập KHANG.NHO khi thực sự muốn tìm. |
| Thêm thành viên Ban | Tìm tên có/không dấu; ngành và lớp phụ thuộc; lọc người chưa phân lớp; từng dòng có tên/lớp/ngành. Chọn một người bằng radio, giữ lựa chọn khi đổi lọc và khi đóng/mở sheet, báo rõ nếu người chọn nằm ngoài lọc. Có vùng cuộn danh sách, chức vụ và nút lưu. Đủ hai Ban vẫn không chọn được; người đã ở Ban bị loại như trước. |
| Dữ liệu cho bộ lọc Ban | Query đang có thêm quan hệ phân công/lớp/ngành, theo năm học đang xem; năm hiện hành lấy phân công đang hiệu lực, năm lịch sử lấy phân công gần nhất trong năm. Không N+1 hoặc migration; chỉ nạp cho người có quyền quản lý thành viên. |

Hành vi autofill: `autocomplete=off` không đủ cho biểu mẫu bị trình duyệt nhận là đăng nhập. Việc dùng `new-password` cho trang quản lý mật khẩu người khác theo [hướng dẫn MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Practical_implementation_guides/Turning_off_form_autocompletion). Kiểm thử dùng browser profile mới: kiểm tách form, xóa/gõ lại, đổi bộ lọc, mở sheet và tải lại; không có profile Chrome/password manager cá nhân của chủ dự án để xác nhận trực tiếp hành vi extension trên máy đó.

## Phạm vi rà giao diện

Ba viewport 360/768/1366; ảnh fixture local, không chụp hồ sơ production.

- Nhân sự, thiếu nhi, lớp, kết quả, giáo án, điểm danh, kho báo cáo: đo padding các ô đang hiển thị, giữ link toàn hàng/tác vụ riêng và kiểm tràn ngang.
- Nhập Excel, Ban, thông báo, báo cáo, quản trị, tổng quan, tài khoản: kiểm layout và ảnh ở ba viewport.
- Lên lớp/chuyển lớp: kiểm thẻ/bảng theo viewport, chọn một em, mở/đóng chi tiết vẫn giữ lựa chọn.
- Ban: kết hợp tên/ngành/lớp, không có kết quả, giữ lựa chọn, lưu người/chức vụ thật bằng tài khoản trên local và đọc đối soát; dọn fixture đúng ID.
- Quản trị: tìm kiếm và cơ chế xác nhận xóa tài khoản, không xác nhận xóa fixture tài khoản dùng chung.

## Kiểm thử

- `npm run lint`, `npm run typecheck`: đạt (mã thoát 0).
- `npm test`: **2.037 pass / 24 integration skip** (138 file pass / 6 skip).
- Unit liên quan trước đó: **105/105**; không cộng vào tổng unit.
- Browser dev lượt đầu: **6 pass / 6 fail**. Ba test gọi nhầm `/admin?tab=accounts` thay vì `section=accounts`; hai ca checkbox không đổi trạng thái và một ca chưa tìm được lựa chọn ngành. Lượt này có hot reload trong lúc sửa layout, chưa đủ bằng chứng quy nguyên nhân ba ca sau. Chuyển kiểm cuối sang production build cố định, đợi trang tương tác ổn định và dùng đúng URL.
- Build local lượt đầu bị sandbox chặn tải font Google (`EACCES`); chạy lại với quyền mạng, vẫn dùng Supabase local. Log giữ nguyên ngoài Git.
- Lượt build kế tiếp: các test cũ của promotions chưa mở tab tiến độ/sheet lọc; cập nhật bước mở đúng UI, giữ nguyên kiểm tra nghiệp vụ. Một ca Escape hồ sơ thiếu nhi thất bại một lần, kiểm lại cùng test không sửa đã đạt. Hai lượt kiểm tra này được dừng trước khi kết thúc; không dùng làm số nghiệm thu.
- Kiểm ảnh phát hiện vùng danh sách chọn thành viên tràn qua phần chức vụ do flex trong `fieldset`; chuyển vùng radio sang nhóm flex thông thường và thêm kiểm tra hình học không chồng lấn/nút lưu nằm trong viewport. Unit nhóm chọn thành viên sau chỉnh cuối: **4/4**.
- Build phát hành đạt; browser cuối **147/147 pass, 0 skip, 0 flaky** trên 360/768/1366 (mã thoát 0). Sáu spec: responsive-feedback, promotions, detail-navigation, account-security, staff-directory, loading-overlay. Gồm 15 ca mới, kiểm luồng lưu thành viên thật trên local và xác nhận không tràn/chồng lấn. Lint và typecheck cuối đạt; nhóm unit picker sau chỉnh cuối 4/4.

Không đổi server action, phân quyền, migration/RLS hoặc dữ liệu production. Không gọi lượt kiểm tra này là full E2E toàn hệ thống. Backlog dữ liệu năm học và các hạng mục tái thiết kế khác giữ riêng.

## Phát hành

**RESPONSIVE-FEEDBACK-RELEASE-20261016:** source `04fd353cf384569dcea1b3fb525a00b6011a473c` đã push main, Vercel success đúng SHA. Smoke `https://cq-tntt-manager-web.vercel.app/login` ở 360/1366 đạt: HTTP 200, CSS thẻ chuyển lớp mới có mặt, token padding desktop đo được 8px 16px, không tràn ngang/runtime error. Chặn POST trong trình duyệt smoke; không đăng nhập/ghi production. Các luồng có đăng nhập được kiểm trên build local. [Bằng chứng phát hành](verification/evidence/responsive-feedback-20261016/release.json).

## Ảnh và bằng chứng

Dữ liệu fixture local. [Số kiểm tra](verification/evidence/responsive-feedback-20261016/checks.json) · [Huynh trưởng laptop](verification/evidence/responsive-feedback-20261016/staff-laptop.png) · [Chuyển lớp mobile](verification/evidence/responsive-feedback-20261016/promotions-mobile.png) · [Chọn thành viên mobile](verification/evidence/responsive-feedback-20261016/committee-mobile.png) · [Chọn thành viên laptop](verification/evidence/responsive-feedback-20261016/committee-laptop.png) · [Tìm tài khoản laptop](verification/evidence/responsive-feedback-20261016/admin-laptop.png).
