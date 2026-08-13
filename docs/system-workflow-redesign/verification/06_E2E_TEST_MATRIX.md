# 06 — Ma trận E2E và phân loại failure

> Baseline đầu: **full Playwright ngày 2026-08-12**; lượt quyết định: **full final ngày 2026-08-13**  
> Cấu hình: 23 spec · 3 project `mobile-360` / `tablet-768` / `laptop-1366` · 1 worker  
> Kết quả final: **585 test · 571 pass · 14 fail · 32,2 phút — GATE ĐỎ**  
> Artifact final: `verification/evidence/full-e2e-20260813-final/`

## 1. Quy tắc kết luận

- `.last-run.json` của artifact là nguồn đếm 14 failure; từng `error-context.md` là bằng chứng màn hình
  tại thời điểm lỗi. Con số 571/585 và 32,2 phút đến từ console result quan sát trong chính lượt chạy.
- `full-e2e-20260813-final/playwright-report/index.html` **không được dùng làm bằng chứng final**: nội dung
  stale/mismatched (`home.spec`, 15 total/11 unexpected, start 2026-07-15, 10 workers), không khớp lượt
  585 test/1 worker ngày 2026-08-13.
- Phân loại mô tả **điểm test dừng**, không tự suy ra nghiệp vụ phía sau đúng hoặc sai.
- Một failure timeout không mặc định là “flaky”; phải đối chiếu DOM/error context, tiền điều kiện, dữ
  liệu sau thao tác và mã test.
- Targeted rerun chỉ dùng chẩn đoán. Chỉ full rerun sau reset + seed trên cùng baseline mới có thể đổi
  trạng thái gate.
- Một lượt targeted sau đó chạy khi Docker/Supabase đã dừng và trả `ECONNREFUSED` là
  **INVALID_INFRA**. Lượt đó không được cộng vào product failure, cũng không được dùng làm PASS.

## 2. Kết quả full final 2026-08-13

### 2.1 Tổng hợp

| Chỉ số | Kết quả |
|---|---:|
| Tổng test | **585** |
| Pass | **571** |
| Fail | **14** |
| Thời lượng | **32,2 phút** |
| Phân bố failure | **mobile 2 · tablet 4 · laptop 8** |
| Trạng thái `.last-run.json` | `failed` với đúng **14** test id |

SHA-256 của `test-results/.last-run.json` là
`75EC8062FAA20960951A094C1FB190F4C10EDFB60DCECEED67C27646F5274659`. Lượt này chạy được tới kết
quả browser thật; **không** có `ECONNREFUSED`, nên 14 failure là tín hiệu hợp lệ cần xử lý.

### 2.2 Ma trận 14 failure final

| ID | Module / hành trình | Viewport / số fail | Điểm dừng quan sát được | Phân loại thận trọng |
|---|---|---:|---|---|
| F-E2E-01 | M02 · sinh lớp mặc định, phân biệt “đã có đủ” với “vừa tạo” | tablet + laptop · **2** | Card đã hiện `19/19`, nhưng nhãn phản hồi mong đợi không xuất hiện; snapshot còn trạng thái xử lý | **PRODUCT_UX_RELIABILITY** — feedback/RSC không hội tụ; chưa chứng minh sinh lớp hoặc invariant dữ liệu sai |
| F-E2E-02 | M02 · đổi trạng thái lớp rồi trả lại | laptop · **1** | Không thấy nhãn trạng thái active sau thao tác khôi phục | **PRODUCT_UX_RELIABILITY** — derived state/RSC không hội tụ; không suy ra mutation sai |
| F-E2E-03 | M02 · lưu/chặn/xóa mốc học kỳ | laptop · **1** | Không thấy phản hồi “đã xóa mốc” trong 45 giây | **PRODUCT_UX_RELIABILITY** — feedback/RSC không hội tụ; chưa chứng minh luật ngày hoặc xóa DB sai |
| F-E2E-04 | M12 · xác nhận dòng trùng và mở lại lô đã hủy | laptop + tablet · **2** | Một ca thiếu toast “đã lưu 1 dòng”; một ca `waitForURL` hết 45 giây | **PRODUCT_UX_RELIABILITY** — feedback/navigation không hội tụ; chưa chứng minh state machine sai |
| F-E2E-05 | M10 · người nhận xem thông báo đã thu hồi | laptop · **1** | Không tìm thấy item đích trong danh sách sau chuyển persona/state | **PRODUCT_UX_RELIABILITY** — derived state/navigation không hội tụ; chưa chứng minh nghiệp vụ sai |
| F-E2E-06 | M07 · nhập/công bố/Top 5/chuyển lớp | mobile + laptop · **2** | Mobile không thấy control của bước lưu trong state hành trình; laptop không thấy Top 5 đã công bố trong derived state | **PRODUCT_UX_RELIABILITY** — hành trình không hội tụ đến trạng thái UI đã hứa; không có bằng chứng mutation điểm/chuyển lớp sai |
| F-E2E-07 | M03 · tạm nghỉ rồi khôi phục hồ sơ/ghi danh | tablet + laptop · **2** | Thiếu feedback “đã khôi phục ghi danh” dù đã chờ 75 giây | **PRODUCT_UX_RELIABILITY** — feedback/RSC không hội tụ; cần xác minh cả hai state DB |
| F-E2E-08 | M03 · thêm → trùng → sửa → xóa bí tích | mobile · **1** | Thiếu feedback sau xóa trong 45 giây | **PRODUCT_UX_RELIABILITY** — feedback/RSC không hội tụ; không tự suy ra bản ghi chưa xóa |
| F-E2E-09 | M03 · sửa rồi hoàn nguyên liên hệ phụ huynh | tablet + laptop · **2** | Thiếu feedback lưu liên hệ; ít nhất context cho thấy dừng ở bước hoàn nguyên trong `finally` | **PRODUCT_UX_RELIABILITY** — feedback/cleanup không hội tụ; không chứng minh dữ liệu cuối sai |

Tổng: **2 + 1 + 1 + 2 + 1 + 2 + 2 + 1 + 2 = 14**. Phân loại final: **14/14
`PRODUCT_UX_RELIABILITY`; 0 `TEST_SYNCHRONIZATION`; 0 `INCONCLUSIVE/CASCADE`**. Không có error context
nào trong 14 ca đủ để khẳng định trực tiếp một mutation nghiệp vụ đã ghi sai.

### 2.3 Danh mục artifact failure final

1. `academic-year-M02-A-·-quản-4bc3d-có-đủ-từ-trước-với-vừa-tạo--laptop-1366`
2. `academic-year-M02-A-·-quản-4bc3d-có-đủ-từ-trước-với-vừa-tạo--tablet-768`
3. `class-settings-M02-B-·-chi-42e9c--hiệu-ở-classes-rồi-trả-lại-laptop-1366`
4. `class-settings-M02-B-·-mốc-c0edd-y-ngoài-năm-học-rồi-xoá-lại-laptop-1366`
5. `imports-M12-A-·-nhập-Excel-73de8-ắn-KHÔNG-lưu-hàng-loạt-được-laptop-1366`
6. `imports-M12-A-·-nhập-Excel-9433c-ỷ-và-mở-ra-vẫn-xem-lại-được-tablet-768`
7. `notifications-M10-C-·-thu--054a4--nhận-thấy-nhãn-Đã-thu-hồi--laptop-1366`
8. `results-Kết-quả-và-chuyển--aef4b--duyệt-chuyển-lớp-nguyên-tử-laptop-1366`
9. `results-Kết-quả-và-chuyển--aef4b--duyệt-chuyển-lớp-nguyên-tử-mobile-360`
10. `student-lifecycle-TB-F06-·-cfaa0--Tạm-nghỉ-rồi-khôi-phục-lại-laptop-1366`
11. `student-lifecycle-TB-F06-·-cfaa0--Tạm-nghỉ-rồi-khôi-phục-lại-tablet-768`
12. `student-lifecycle-TB-F08-·-fc785-hi-thêm-→-trùng-→-sửa-→-xoá-mobile-360`
13. `student-lifecycle-TB-F12-·-fc7a5--phụ-huynh-lỗi-F12-—-31-75--laptop-1366`
14. `student-lifecycle-TB-F12-·-fc7a5--phụ-huynh-lỗi-F12-—-31-75--tablet-768`

## 3. Đối chiếu triage full baseline 23 failure

| Nhóm phân loại | Số test | Ý nghĩa |
|---|---:|---|
| Test stale / assertion không theo UI hiện hành | **5** | Test không hoàn tất hộp xác nhận hoặc chờ một biểu diễn dẫn xuất đã đổi; cần sửa test rồi retest hành vi thật |
| Fixture contamination | **2** | Tài khoản GLV dùng cho D-25 bị seed/liên kết thêm con, phá tiền điều kiện của bài |
| Timing / navigation / RSC refresh | **13** | Chờ feedback, trạng thái mới hoặc URL quá lâu/không ổn định; là nợ UX/runtime dù chưa chứng minh mutation sai |
| Inconclusive vì precondition fail | **3** | Bài ownership 404 chưa tới được request đích; không được tính là security PASS hay product FAIL |
| Failure chứng minh trực tiếp mutation nghiệp vụ sai | **0** | Không có trong 23 artifact; điều này **không** chứng minh toàn bộ mutation đúng |
| **Tổng** | **23** | Khớp `.last-run.json` |

Kết luận của full gate vẫn là **FAILED**. Việc 0 failure chứng minh trực tiếp mutation sai chỉ là kết quả
triage; 13 failure timing/navigation là hành vi người dùng nhìn thấy và phải được ổn định.

### 3.1 Ma trận failure baseline theo hành trình

Mỗi dòng dưới đây gom các viewport cùng một kịch bản. Cột cleanup nêu cơ chế mà spec dự kiến dùng;
failure giữa chừng vẫn có thể làm fixture chung thay đổi, vì vậy mọi rerun phải bắt đầu bằng reset + seed.

| ID | Module / actor | Tiền điều kiện và bước chính | Expected result | Viewport / số fail | Spec + artifact | Cleanup | Kết quả triage |
|---|---|---|---|---:|---|---|---|
| E2E-01 | M02 · nhân sự có quyền cài lớp | Mở chi tiết lớp → lưu mốc hợp lệ → thử ngày ngoài năm → xóa lại | Mốc hợp lệ lưu được, ngày ngoài năm bị chặn, dữ liệu được trả về ban đầu | laptop · **1** | `tests/e2e/class-settings.spec.ts:152`; thư mục `class-settings-M02-B-…-laptop-1366` | Bài tự xóa mốc đã tạo | **Timing/navigation/RSC** — trang/URL không đạt trạng thái chờ; chưa chứng minh luật ngày sai |
| E2E-02 | M09 · Trưởng ban, thành viên và người ngoài Ban | Đăng nội dung Ban → kiểm thành viên chỉ đọc → kiểm người ngoài không thấy | Nội dung đúng phạm vi thành viên | laptop · **1** | `committees.spec.ts:156`; `committees-Phase-6-—-Ban-v…-laptop-1366` | Nội dung đặt tên theo project, spec dọn fixture | **Test stale** — assertion dựa trên UI dẫn xuất cũ, không phải bằng chứng RLS/mutation sai |
| E2E-03 | M09/M11 · thành viên Ban có quyền báo cáo | Chọn filter → tạo/chốt báo cáo → mở lại/tải bản bất biến | Hộp xác nhận được hoàn tất; tải lại vẫn đúng filter và snapshot không đổi | 360/768/1366 · **3** | `committees.spec.ts:429`; ba thư mục `committees-…-Báo-c…` | Dữ liệu báo cáo theo suffix project | **Test stale** — test mở nhưng không bấm bước xác nhận cuối của UI mới |
| E2E-04 | M03 · nhân sự quản lý hồ sơ/ghi danh | Thực hiện chuỗi thao tác ghi trên trang thiếu nhi và đọc phản hồi | Mỗi thao tác nói rõ kết quả theo TB-F14/AC-F14-01 | 768/1366 · **2** | `enrollment-lifecycle.spec.ts:180`; hai thư mục `enrollment-lifecycle-…` | `try/finally`/fixture riêng của spec | **Timing** — test cap 30 s cắt trước expectation 45 s; trạng thái kết thúc chưa được xác nhận |
| E2E-05 | M12 · người có quyền nhập Excel | Nạp lô có nhiều dòng thiếu giới tính → điền hàng loạt → lưu một lần | Mọi dòng chọn được cập nhật bằng một lượt lưu và có feedback | 360 · **1** | `imports.spec.ts:274`; `imports-M12-A-…-mobile-360` | Lô import đặt theo project và được xóa/huỷ theo spec | **Timing/RSC** — pending/refresh không hoàn tất trong cửa sổ chờ; chưa chứng minh dữ liệu commit sai |
| E2E-06 | M13 · phụ huynh có đúng một con | Đăng nhập → dùng lối vào UI của “Con của tôi” | Đi thẳng tới hồ sơ duy nhất trong tối đa hành trình đã duyệt | 360/768/1366 · **3** | `portal.spec.ts:257`; ba thư mục `portal-…-một-con…` | Fixture portal dùng seed cố định | **Navigation/RSC** — click/URL không ổn định trên cả ba viewport; là nợ UX thực tế |
| E2E-07 | M13 · GLV đồng thời là phụ huynh | Đăng nhập tài khoản hai vai → kiểm mục “Con của tôi” | Mục portal vẫn hiện và dẫn tới đúng con | 768/1366 · **2** | `portal.spec.ts:289`; hai thư mục `portal-…-D25…` | Seed phải giữ một guardian/persona độc lập | **Fixture contamination** — GLV910 nhận thêm liên kết con từ bài khác/seed, làm sai tiền điều kiện |
| E2E-08 | M13 · phụ huynh A truy URL con của phụ huynh B | Xác định con của người khác → mở URL trực tiếp | 404 trong shell, không lộ tên/chi tiết | 360/768/1366 · **3** | `portal.spec.ts:306`; ba thư mục `portal-…-404…` | Chỉ đọc, không mutation | **Inconclusive** — bước dựng/xác nhận target ownership fail trước request đích; không được gọi security PASS |
| E2E-09 | M07/M08/M13 · GLV đại diện, phụ huynh và người duyệt | Nhập/công bố/khóa/xuất/Top 5 → portal ownership → duyệt chuyển lớp nguyên tử | Mọi trạng thái hiển thị nhất quán; transfer nguyên tử | 360/768/1366 · **3** | `results.spec.ts:260`; ba thư mục `results-…-duyệt-chuyển…` | Spec dùng dữ liệu theo project và rollback/cleanup cuối bài | **Timing/RSC** — failure xảy ra trước/ở trạng thái giao diện cũ; không đủ bằng chứng kết luận RPC chuyển lớp sai |
| E2E-10 | M04 · người xem danh sách nhân sự | Lọc → sang trang 2 → chép/mở lại URL | Filter được giữ trong href và trang 2 mở ổn định | 360/768 · **2** | `staff-directory.spec.ts:122`; hai thư mục `staff-directory-…` | Chỉ đọc | **Navigation** — `waitForURL` không ổn định; href semantics cần retest sau patch |
| E2E-11 | M03 · người quản lý thiếu nhi | Đưa hồ sơ sang tạm nghỉ → xác nhận ghi danh paused → khôi phục | Hai trục hồ sơ/ghi danh đổi đồng bộ và có feedback | 1366 · **1** | `student-lifecycle.spec.ts:148`; `student-lifecycle-TB-F06-…` | Spec có `try/finally` khôi phục trạng thái, mở lại với filter rộng | **Timing/RSC** — phản hồi/trạng thái mới chậm; failure có thể làm bài sau nhiễm nếu cleanup không chạy |
| E2E-12 | M03 · người quản lý bí tích | Thêm → thử trùng → sửa → xóa một bản ghi bí tích | Trùng bị chặn; sửa/xóa đúng bản; danh sách cập nhật | 1366 · **1** | `student-lifecycle.spec.ts:207`; `student-lifecycle-TB-F08-…` | Bài xóa bản ghi đã tạo | **Test stale** — locator/assertion không còn khớp biểu diễn UI hiện hành; cần sửa test rồi đo lại mutation |

Tổng theo ma trận: **1 + 1 + 3 + 2 + 1 + 3 + 2 + 3 + 3 + 2 + 1 + 1 = 23**.

## 4. Phủ hành trình và khoảng trống sau full final

| Hành trình bắt buộc | Spec đại diện | Bằng chứng final | Trạng thái |
|---|---|---|---|
| Account ↔ hồ sơ ↔ role | `account-security`, `staff-detail`, `staff-transfer`, `security` | Không nằm trong 14 failure final; full gate tổng thể vẫn đỏ | `PARTIAL_EVIDENCE` |
| Năm học ↔ lớp ↔ ghi danh | `academic-year`, `class-settings`, `enrollment-lifecycle` | **4 failure** final ở year/class feedback; còn bypass M02 ở review nghiệp vụ | `FAILED` |
| Phụ huynh ↔ thiếu nhi | `portal`, `students-directory` | Không còn failure portal trong final; luồng người giám hộ M03 còn 2 failure feedback | `PARTIAL_EVIDENCE`, gate tổng thể đỏ |
| Lớp ↔ GLV ↔ điểm danh | `staff-transfer`, `attendance` | Không thuộc 14 failure final | `PARTIAL_EVIDENCE` |
| Điểm danh ↔ điểm ↔ kết quả | `attendance`, `results`, `reports` | `results` fail mobile/laptop; cả hai là product UX reliability | `FAILED` |
| Chuyển lớp | `results`, `promotions`, `class-settings` | Cross-journey `results` chưa hoàn tất ổn định ở 2 viewport | `FAILED` |
| Thông báo | `notifications` | **1 failure** final khi người nhận tìm item đã thu hồi | `FAILED` ở UI E2E |
| Excel | `imports` + gate import integration | **2 failure** final feedback/navigation; gate DB/import là tầng khác | `FAILED` ở UI E2E |
| Audit toàn hệ thống | Không có spec end-to-end chung | D-65 chưa được cài toàn hệ thống | `NOT_COVERED / FAILED` |

“Không nằm trong 14 failure final” chỉ có nghĩa bài không bị liệt kê ở lượt đó, không phải chứng nhận độc lập
cho cả module. D-65 đặc biệt không có walking skeleton “thao tác nhạy cảm → audit redacted →
append-only → SA-only viewer”.

## 5. Ledger các lượt chạy liên quan

| Lượt | Môi trường | Kết quả | Có dùng để kết luận sản phẩm? |
|---|---|---|---|
| Full baseline 2026-08-12 | DB reset + seed local, Next production server, 1 worker, 3 project | **585 chạy / 23 fail** | **Có — gate đỏ** |
| Targeted sau khi Docker/Supabase dừng | Kết nối DB trả `ECONNREFUSED` | Không tạo được phép đo sản phẩm hợp lệ | **Không — INVALID_INFRA** |
| Targeted run 1 | 9 spec · 3 viewport · 1 worker | **210 chạy / 197 pass / 13 fail** | **Có — chẩn đoán, gate đỏ** |
| Targeted run 2 | 18 test tập trung vào class settings/results | **18 chạy / 15 pass / 3 fail** | **Có — chẩn đoán, gate đỏ**; artifact `evidence/targeted-e2e-20260813-run2/` |
| Full final 2026-08-13 | Reset + seed sạch, build cuối, 23 spec × 3 viewport, 1 worker | **585 chạy / 571 pass / 14 fail / 32,2 phút** | **Có — kết quả quyết định, gate đỏ** |

Không được gộp kết quả các lượt dùng baseline khác nhau thành một “suite xanh”. Nếu targeted xanh nhưng
full final đỏ, gate cuối vẫn đỏ.

## 6. Tiêu chí retest

1. Reset + seed sạch trước targeted; không dùng DB đã qua gate import/perf làm fixture E2E.
2. Chạy lại 6 spec có failure final: `academic-year`, `class-settings`, `imports`, `notifications`,
   `results` và `student-lifecycle`; thêm spec đối chứng khi cần chứng minh fixture/cleanup không lan truyền.
3. Giữ đủ ba project cho các bài cross-viewport; không dùng `--last-failed` từ lượt ECONNREFUSED.
4. Với mỗi thao tác ghi, xác nhận cả dữ liệu cuối và feedback/URL; cleanup phải chạy trong `finally`.
5. Sau khi 14 failure final được sửa/phân loại, reset + seed lần nữa rồi chạy **full 585 test**.
6. Lưu `.last-run.json`, error context và console log mới cạnh artifact baseline; chỉ lưu/dẫn HTML report
   sau khi kiểm metadata khớp đúng 585 test, 1 worker và timestamp của lượt chạy. Ghi commit/working-tree
   fingerprint và giờ chạy.

Full final đã có kết quả thật và đang **FAILED**. Không được đổi thành `PASS_WITH_FLAKES`: 571 test xanh
không bù cho 14 failure product UX reliability.
