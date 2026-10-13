# R4 — hoàn tất module Thiếu nhi — 13/10/2026

R4 hoàn tất **5/5 task** theo roadmap đã duyệt. Chủ dự án yêu cầu hoàn tất R4, push Git và redeploy. Hồ sơ này bao gồm các phụ thuộc R2/R3 đang nằm trong working tree; lịch sử kiểm định trước sửa được giữ nguyên.

| Task | Kết quả |
|---|---|
| R4.1 | Danh sách toàn chiều rộng: Toolbar, DataTable v2, sort/filter phía máy chủ, phân trang 20/50, ẩn cột theo tài khoản, năm lịch sử và RPC hẹp cho Thủ quỹ. |
| R4.2 | Drawer hai bước: chọn/tạo giám hộ → tạo thiếu nhi. Server actions hiện có giữ kiểm quyền và kiểm trùng; chỉ chuyển bước khi lưu thành công. Có liên kết hồ sơ sau tạo, hoạt động cả khi tắt JavaScript. |
| R4.3 | EntityHeader và 6 tab: Tổng quan, Gia đình, Lịch sử, Chuyên cần, Sức khỏe, Bí tích. Form sửa mở theo URL và đúng quyền; dữ liệu nhạy cảm vẫn bị chặn ở máy chủ. UX-41 đã có trạng thái lỗi/thử lại riêng với trạng thái rỗng. |
| R4.4 | Mobile: hàng cao 63px, tìm kiếm gọn, filter sheet/chip và nút thêm; giữ trang khi đóng sheet. Sheet vẫn dùng được khi đổi kích thước sang desktop. Tab đang chọn tự hiện trong thanh cuộn ngang. |
| R4.5 | Banner chỉ xem nêu rõ liên hệ Thư ký; không mở hồ sơ/thao tác ghi cho Thủ quỹ. Bộ lọc scalar giữ tương thích RPC hẹp. |

## Kiểm thử thật

| Kiểm tra | Kết quả |
|---|---|
| Lint / TypeScript / production build | PASS |
| Vitest toàn bộ | **2.000 pass / 24 skip**, 140 file; không tính skip là pass |
| Kiểm lại các component thay đổi cuối | **29/29** |
| R4 E2E, 4 spec × 3 viewport | **105/105 PASS**, 3,9 phút; có ghi dữ liệu và kiểm DB cho luồng JS/no-JS |
| pgTAP trên DB audit mới | **1.512/1.512 PASS**, 59 file; toàn bộ 70 migration áp sạch |
| E2E toàn hệ thống trước sửa cuối | **677 pass /10 fail**, không gọi lượt gốc xanh |
| E2E R4 và luồng ảnh hưởng trên build release | **140 pass /1 lỗi giả định fixture lớp**; riêng R4 **105/105 PASS** |
| Lớp sau sửa test / lên lớp trên fixture audit mới | **15/15 PASS /3/3 PASS** |

Reviewer độc lập kiểm browser, query và 16 unit test boundary. JWT thật ở local xác nhận RPC ghi chú chuyên cần cho Thư ký thành công, phụ huynh bị FORBIDDEN; đọc trực tiếp cột ghi chú bị chặn với cả hai vai trò. Ghi chú chỉ tải qua RPC hiện có, giới hạn session đã được đọc và đúng record của em; không fan-out 60 RPC. Không có fixture ghi chú khác rỗng để kiểm browser live; nội dung ghi chú được kiểm bằng unit fixture.

Các lượt lỗi trước sửa được giữ: R4 round 1: 63 pass / 27 fail; round 2: 100 pass / 5 fail. Đã sửa nhãn/selector theo UI mới và chờ hoạt ảnh CSS thật ở no-JS, không ép click hoặc tắt animation. Lượt cuối 105/105 là lượt riêng. Lượt pgTAP trên DB local có sẵn fixture E2E bị xung đột; thay bằng DB audit riêng từ migration, không reset DB đang dùng.

## Kích thước và giới hạn

- Desktop 1366×768: hàng đầu y=287, cao 44,5px, đạt ≥10 hồ sơ/màn hình.
- Mobile 360×800: hàng đầu y=321,5, cao 63px; không tràn ngang trang. Tab Chuyên cần/Sức khỏe tự hiện, không kéo cuộn dọc.
- Tablet 768×1024: 12 hàng đầy đủ trên bottom navigation; hàng đầu y=366,5. Bảng có cuộn ngang nội bộ: khoảng 20px cuối cột điện thoại và cột trạng thái cần cuộn để đọc hết. Ở 768×800 chỉ khoảng 7 hàng đầy đủ. Giữ giới hạn này cho tablet pass R12.
- Giám hộ vừa tạo đã được lưu khi sang bước em; hủy bước em không xóa giám hộ. Bản nháp chưa lưu ở bước em không được hứa giữ khi quay lại. Không đưa tên/số điện thoại vào URL wizard.
- UX-42 và R13.3 (ba lượt E2E toàn hệ thống xanh liên tiếp) vẫn mở. R5–R13 chưa được triển khai chỉ vì R4 hoàn tất.

## Database và triển khai

- Supabase production `hvcfhlaubnukeoutxiuq` được xác nhận ACTIVE_HEALTHY trước triển khai; không gửi lệnh resume.
- Backup schema/data trước migration: `backups/2026-10-13-before-r4/` ở workspace ngoài Git. Không đưa dữ liệu cá nhân/secret vào repo.
- Đã áp migration R2.13 `20261012000100_academic_year_history_directory.sql`: view security_invoker và RPC đọc lịch sử cho Thủ quỹ. Migration list sau áp: **70/70 khớp, 0 pending**. Không đổi policy RLS, không backfill hồ sơ.
- Git/Vercel: đang chuẩn bị push và redeploy; chưa ghi deployed trước khi smoke URL production.

## Bằng chứng

Log và artifact đầy đủ tại workspace `REDESIGN/r4-final-verification/`: `acceptance.log`, `unit-final.log`, `changed-units-final.log`, `lint-final.log`, `typecheck-final.log`, `build-final.log`, `db-isolated-tests.log`, `full-e2e.log`, `migrations-before.log`, `migrations-after.log`, ảnh/JSON `independent-*`. Những artifact ngoài repo không được mô tả là đã commit. Bản báo cáo và ghi chú reviewer được lưu trong Git để đối chiếu sau deploy.

## R4-QA-01 — blocker phát hiện khi hồi quy

Full E2E phát hiện trang lớp lỗi khi có promotion_reviews: FK source_enrollment_id unique trả object|null nhưng code gọi .some như mảng. Đã sửa đúng quan hệ, giữ nguyên FK/quyền; unit4/4. Reviewer độc lập đọc bằng JWT Thư ký local xác nhận38null,3object,0array. Lint/typecheck và Vitest toàn bộ sau sửa:2.000 pass/24 skip. Production build đạt; R4 E2E cuối105/105, test lớp15/15 và lên lớp audit3/3 đạt; giữ riêng lượt release140pass/1fixture fail.

## Phân loại hồi quy và giới hạn release

Full E2E trước sửa cuối: **677 pass /10 fail**; build release: **140 pass /1 lỗi giả định fixture lớp**, trong đó R4 **105/105 PASS**. Sau cập nhật test xác nhận lớp: **15/15 PASS**; luồng lên lớp trên DB audit mới **3/3 PASS**. Không cộng rerun vào lượt gốc để gọi toàn hệ thống xanh.

- Các lỗi trang lớp/shell cùng gốc quan hệ promotion_reviews đã sửa R4-QA-01; rerun giữ nguyên khẳng định sản phẩm.
- Sau hết crash, bài đổi trạng thái lớp còn giả định Hiệp1 không có học sinh; fixture của results đã ghi danh vào lớp này. UI yêu cầu xác nhận đúng BR-M02-N11. Test được cập nhật để đọc cảnh báo, bấm xác nhận, kiểm dữ liệu sau reload rồi khôi phục; toàn spec lớp15/15 đạt. Không sửa sản phẩm để bỏ xác nhận.
- Test tạo giám hộ cũ còn tìm form inline: cập nhật sang wizard thật, kiểm tên người vừa lưu, bước em, ID trong DB và nút tạo em; cleanup đúng giám hộ tổng hợp chưa gán con.
- Một ca Escape trong lượt dài không đóng kịp, reviewer không tái hiện8/8 lần. Test nay chờ animation thật/body khóa rồi phát một Escape vào drawer; không sleep cố định, không retry phím. Browser kiểm Tab/Shift+Tab vẫn trong modal.
- Ba ca results.spec dùng lại fixture đã duyệt từ lượt trước: trạng thái Đã duyệt không có form Đề xuất, nên timeout trước bước đề xuất. Đã chạy lại toàn bộ luồng bảng điểm/công bố/khóa/xuất/Top5/portal/duyệt lên lớp trên DB audit54621 với fixture mới: **3/3 PASS**. Không xóa lịch sử lên lớp trong DB chính. Tính lặp lại fixture thuộc R13.3 còn mở; không có lượt E2E toàn hệ thống xanh trên bản cuối để tuyên bố.
- Lint/typecheck/build cuối đạt; backport React guarded installer3/3. Production trước deploy: login/redirect trình duyệt/tài nguyên desktop-mobile đạt; REST view student_year_directory trảHTTP200 khi chọn0dòng. Chưa chạy luồng ghi bằng tài khoản production, không gửi form production.
