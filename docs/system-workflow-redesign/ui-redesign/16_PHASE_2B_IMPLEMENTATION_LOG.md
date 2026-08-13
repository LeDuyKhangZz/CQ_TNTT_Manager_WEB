# 16 — NHẬT KÝ TRIỂN KHAI GIAI ĐOẠN 2B

> **Bảng theo dõi việc làm của Giai đoạn 2B.** Nguồn sự thật về *thứ tự và phạm vi*
> là `11_APPROVED_MODULE_PLAN.md`; file này chỉ ghi **đã làm / chưa làm** và số kiểm thử thật.
>
> Quy ước: ✅ xong · 🔄 đang làm · ☐ chưa làm · ⏸️ cố ý không làm
>
> **CẬP NHẬT MỚI NHẤT 2026-08-12 — M13-B + M13-C XONG ⇒ ĐÓNG MODULE 14/14 VÀ ĐÓNG PHẦN TRIỂN KHAI GIAI ĐOẠN 2B.**
> Cổng Phụ huynh/Thiếu nhi nay phân biệt đúng bốn nguyên nhân rỗng, dùng mật độ chữ/điều khiển
> `comfortable`, có cảnh báo chuyên cần kèm bước tiếp theo, bảng đọc được bằng bàn phím ở 360px,
> và ba màn hình dùng chung Kết quả · Giáo án · Thông báo đã được đối chiếu ở cả hai vai trò. D-64,
> D-70, D-75, D-88 và D-91 giữ nguyên. **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi quyền.**
> DB sạch: pgTAP **1385/1385** (52 file) · unit **1545 pass / 16 skip** (111 file pass / 4 skip) ·
> portal E2E **24/24** (8 hành trình × 360/768/1366) · lint **0 warning 0 error** · typecheck ✓ ·
> build ✓ **29/29 trang**. Bộ E2E toàn hệ thống đã chạy hết **585 bài: 561 pass, 24 fail**; cả 9
> bài mới của M13-B/C xanh. 24 bài đỏ còn lại đã được phân loại là nợ ổn định Server Action/stream
> và dữ liệu dùng chung giữa các spec; vì vậy **14 module đã làm xong, nhưng chưa được gọi là sẵn
> sàng phát hành cho tới khi trả các nợ toàn hệ thống ghi ở cuối module/WORKLOG**.
>
> Ghi chú lịch sử: **2026-08-12** — xong **Đợt M11-B và M11-C trong một phiên** ⇒ **ĐÓNG MODULE 13/14 (M11 Báo cáo & Dashboard)**, còn đúng **M13**. **2 migration · 1 thay đổi phân quyền (`11` §6 D-67, NỚI — nửa còn nợ) · 0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng.** **(1) 🔴 Hiện trạng của Thủ quỹ đã ĐO bằng JWT thật trước khi sửa, không suy đoán:** trang tổng quan hiện `0 thiếu nhi · 0 giáo lý viên · 0 lớp` và cả hai bảng báo cáo trả **0 dòng**. Đó **không phải "chưa biết", đó là NÓI SAI** — và nói sai với một chức việc cấp xứ đoàn ngay màn hình đầu tiên sau khi đăng nhập. **D-170 + D-173** nới bằng **cửa sổ hẹp** phủ ba chỗ (bảng báo cáo · kho bản chốt · bốn ô số tổng quan). **(2) 🔴 Hai hàm `_for_treasurer` GỌI THẲNG hai RPC gốc, không chép một dòng SQL nào** — chép ra bản thứ hai "cho Thủ quỹ" là dựng sẵn hai con số sẽ lệch nhau vào một ngày không ai nhớ nổi, tức phá D-52 ngay chỗ nó được sinh ra để bảo vệ. **(3) 🔴 Cố ý KHÔNG sửa `v_dashboard_summary`:** ba trong bốn con số của view lọc bằng RLS của bảng gốc, riêng `class_count` lọc bằng vị từ viết tay ⇒ nới trong view chỉ nới được một số và dựng lại **đúng cái bệnh D-169 vừa chữa hôm trước**, chỉ đổi vai người mắc. **(4) 🔴 Ranh giới cũ KHÔNG nhúc nhích, và pgTAP có 6 bài canh riêng vế đó:** Thủ quỹ gọi thẳng hai RPC gốc vẫn 0 dòng · đọc thẳng `students` · `student_attendance_records` · `assessment_scores` vẫn 0 dòng · `app.can_global_read()` vẫn không có họ · và vẫn **không chốt được** ở cả ba phạm vi, đo cả bằng hàm lẫn bằng một lệnh `insert` thẳng vào cơ sở dữ liệu. **Một bản cài đặt lười thêm `treasurer` vào `can_global_read()` sẽ làm 6 bài đo cửa sổ xanh y hệt và 6 bài này đỏ hết.** **(5) D-171** báo cáo Kết quả ép kỳ = năm học — đây là một **nhãn nói sai nội dung**, và bản chốt ghi lại cái nhãn ấy **vĩnh viễn** vì snapshot không sửa được. **(6) D-172 + D-174** hộp xác nhận trước khi chốt, nêu bản trùng kèm **tên** người chốt — và chữ "ai" là **bản sinh đôi của cái bẫy `profiles` mà M08-C đã vấp**: hai nhóm chốt báo cáo nhiều nhất (Trưởng ngành · GLV đại diện) không đọc được tên người khác, nhúng thẳng là một ô `null` **trong im lặng**. **(7) 🔴 TB-03 — ngõ cụt nằm ở thẻ mà không ai bọc cờ:** bản cũ bọc ba thẻ bằng `isStaff` và **bỏ sót thẻ "Cần quan tâm"**, nên phụ huynh bấm tên con là sang `/access-denied` và hết đường. **(8) TB-06** kho 5 năm lần đầu có cửa — và kéo theo cái bẫy `profiles` **lần thứ hai** trong cùng một module. **(9) 🔴 N-6 lộ một khoảng trống của bộ dữ liệu mẫu:** `seed:dev` **không tạo một buổi điểm danh đã chốt nào**, nên nút "Chốt báo cáo" luôn `disabled` và **đường ghi nguy hiểm nhất của module sẽ không bao giờ được chạy tới**; spec tự dựng dữ liệu, mỗi viewport một tháng riêng. **(10) ⚠️ Docker Desktop hỏng HAI LẦN giữa phiên** (engine trả 500 cho mọi lệnh; một truy vấn Supabase đo được **445 giây**), nên **số E2E toàn bộ của phiên này không dùng làm số nghiệm thu** — xem `16` §2 "Đợt M11-C". pgTAP **1385/1385** trên **52 file** · unit **1531 pass / 16 skip** · lint **0** · typecheck ✓ · build ✓ **29/29 trang** · `reports.spec.ts` **18/18** khi chạy riêng.
>
> Ghi chú lịch sử: **2026-08-11** — xong **Đợt M11-A** ⇒ **MỞ MODULE 13/14 (M11 Báo cáo & Dashboard**, `NEEDS_IMPROVEMENT`, **52/75** ở mức module, **0 luồng `CRITICAL`)**. **1 migration · 1 thay đổi phân quyền trong danh sách `11` §6 (D-66, SIẾT) · 0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng.** **(1) 🔴 PHIÊN TRƯỚC ĐỂ ĐỢT NÀY DỞ DANG VÀ KHÔNG GHI MỘT DÒNG NÀO VÀO SỔ**, nên phiên này bắt đầu bằng việc dựng lại hiện trạng từ **dấu thời gian của file** chứ không từ nhật ký: migration `20260811000100` · pgTAP `050` · 8 file mã nguồn đã viết xong lúc 17:02–21:53, còn file 16 và `WORKLOG` dừng ở 16:36. Và **`src/types/database.ts` — 4120 dòng mô tả cấu trúc cơ sở dữ liệu — bị ghi đè thành ĐÚNG MỘT DÒNG báo lỗi** `{"_tag":"Error"…ECONNREFUSED 127.0.0.1:54422}` vì `npm run db:types` chạy trong lúc Postgres cục bộ đang tắt. Hệ quả đo được: `typecheck` đỏ ngay dòng 1, `build` không chạy được ⇒ **toàn bộ M11-A chưa từng qua một cửa kiểm nào**. Bài học một câu: **`db:types` ghi thẳng đầu ra vào file đích, nên nó phá file khi lệnh thất bại** — sinh ra file tạm rồi mới chép đè. **(2) D-66 — MỘT hàm đang gánh HAI câu hỏi.** `app.can_create_report` từ Phase 6 được dùng cho **cả** policy SELECT lẫn policy INSERT của `report_snapshots`, nên siết quyền *chốt* bằng cách sửa hàm ấy sẽ **lấy luôn quyền đọc** của Cha sở/Cha phó — trái đúng câu chữ D-66. Nay hai câu hỏi có hai cái tên: `app.can_read_report` (rộng, giữ nguyên luật cũ) và `app.can_create_report` (hẹp). Mất quyền chốt đúng **ba cái tên**: Cha sở · Cha phó · Thủ quỹ — đã đo bằng cách liệt kê lại **cả 14 vai trò × 3 phạm vi**, không vai trò nào khác nhúc nhích. **(3) 🔴 Cái bẫy khi siết, và nó sẽ cho một bộ pgTAP XANH GIẢ:** không được viết hàm hẹp bằng `app.can_access_sector`/`app.can_access_class`, vì **hai hàm ấy tự gọi `app.can_global_read()` bên trong** (`20260715000100:189`). Một bản siết chỉ đổi nhánh `global` vẫn cho Cha sở chốt ở phạm vi **ngành** và **lớp** — tức siết đúng một nhánh trong ba — và một bộ kiểm chỉ đo nhánh `global` sẽ xanh trọn vẹn. pgTAP `050` vì thế đo **cả ba nhánh cho từng vai trò**. **(4) D-169 — bốn con số nằm cạnh nhau đang nói hai chuyện khác nhau.** Ô "Lớp" của `/dashboard` đếm trên toàn bộ `public.classes`, mà policy của bảng ấy **cố ý mở cho mọi tài khoản** (danh mục lớp phục vụ dropdown), nên `security_invoker` **không** thu hẹp con số đó: Giáo lý viên lớp Ấu 1 thấy **19** trong khi ba ô cạnh nó đều đã đúng phạm vi. Gốc rễ audit gọi đúng tên: **view trộn nguồn có RLS phạm vi với bảng danh mục mở mà không có mệnh đề phạm vi ở chính view**. **(5) TB-04/TB-05 — trang báo cáo hết nói dối về phạm vi.** Ba lý do bảng trống nay ra **ba câu khác nhau** (rỗng thật · ngoài phạm vi · chưa buổi nào được chốt); ô chọn ngành/lớp chỉ liệt kê thứ người đó xem được; tham số URL hỏng **thu hẹp về phạm vi của chính họ và nói ra**, thay vì âm thầm **nới rộng** về `global` như bản cũ; phạm vi mặc định suy từ vai trò; và nút "Chốt báo cáo" **hỏi thẳng** `app.can_create_report` qua một hàm bọc mỏng thay vì chép lại luật bằng danh sách vai trò viết tay — đúng bài học D-151 của M07-B. **(6) Nợ #18 ĐÓNG HẲN** — `report_snapshots` là **bảng cuối cùng** của món nợ mở từ M02-C (D-118); ca **policy**, khuôn M02-C, D-117 giữ nguyên đường thoát cho Super Admin. **(7) Nợ #14 (D-96)** trả cho `reports` — còn đúng **1 module**: `theme`. **(8) 🔴 Một lỗi thật mà chỉ `typecheck` bắt được, sau khi `database.ts` được sinh lại:** bộ sinh kiểu của Supabase khai tham số **không có mặc định** thành không-nhận-`null`, trong khi phạm vi `global` đúng nghĩa là *không có id* ⇒ `p_scope_id` phải có `default null` ở SQL và chỗ gọi truyền `?? undefined`, đúng khuôn `propose_promotion` của M08. **Số kiểm thử thật:** pgTAP **1324/1324** (trước 1286, **+38**, file mới `050` toàn bộ **JWT thật của 9 vai trò**) · unit **1469 pass / 16 skip** (trước 1448/16, **+21**) · lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang**. Tiếp theo là **M11-B**.
>
> Ghi chú lịch sử: bản trước ghi **2026-08-10** — xong **cả ba đợt M10** trong một phiên ⇒ **ĐÓNG MODULE 12 (M10 Thông báo)**. Module có điểm audit **cao thứ nhì** của 2B (61,6/75) mà vẫn mang **hai luồng CRITICAL**, và cả hai hoá ra là **MỘT lỗi lặp hai chỗ: một dòng `.eq("profile_id", …)` vắng mặt**. **2 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng · 0 quyền ghi mới cho `authenticated`.** **(1)** Với 8/14 vai trò lỗi này **không tồn tại** — hàng rào cơ sở dữ liệu vốn đã lọc đúng cho họ; với **6 vai trò cấp xứ đoàn** thì chuông đếm chưa đọc của **cả xứ đoàn** (*"99+"* và **không bao giờ về 0**) còn hộp thư **cá nhân** là *"50 dòng mới nhất của toàn hệ thống"*, **kể cả nội dung thư riêng gửi cho người khác**. Gốc rễ đã được audit gọi đúng tên: **hàng rào bảo mật bị dùng thay cho bộ lọc nghiệp vụ** — nó trả lời *"được phép thấy gì"*, truy vấn phải trả lời *"muốn thấy gì"* (**BR-M10-20**). **(2) 🔴 Bài quét mã nguồn viết cho đợt A tìm ra CHỖ THỨ BA, ngoài phạm vi audit** — ô *"Thông báo mới nhất"* của `/dashboard`, tức trang **ai cũng đổ vào ngay sau khi đăng nhập**; thuộc M11 nhưng đã sửa tại chỗ và bàn giao. **(3) 🔴 Và BR-M10-20 lặp lại TRONG CHÍNH LƯỢT SỬA NÓ**: mục *"Tôi đã gửi"* của đợt C ban đầu không lọc theo tác giả — bài quét của đợt A không bắt được vì nó chỉ canh **một** bảng. Bài học một câu: **một bài kiểm chỉ bảo vệ đúng phạm vi nó quét.** **(4)** Bốn quyết định chủ dự án chốt: **D-165** mã chống gửi đúp · **D-166** thu hồi mềm (*"biện pháp an toàn không phải đồng hồ mà là nhật ký"*) · **D-167** gửi đích danh phải tới được người chưa gán vai trò · **D-168** hoà giải **hai tài liệu module nói ngược nhau** về việc bản thu hồi biến mất hay ở lại. **Số kiểm thử thật:** pgTAP **1286/1286** (trước 1233, **+53**, hai file mới `048`/`049` toàn bộ JWT thật) · unit **1448 pass / 16 skip** (trước 1385/10) · lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 494/507** (27,3 phút), `notifications.spec.ts` **21/21 xanh cả ba viewport, 0 skip**, và **0/13 bài đỏ liên quan tới thông báo**. Tiếp theo là **M11 Báo cáo & Dashboard** (module 13/14).
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M08-B** (module 11/14, đợt 2/3), **đợt CÓ MIGRATION** của module chuyển lớp. **1 migration · 0 thay đổi phân quyền · 0 `alter table` trên bảng cũ · 0 dòng dữ liệu bị đụng.** **(1) 🔴 Một quy tắc nghiệp vụ đã được mô hình hoá trong cơ sở dữ liệu từ Phase 2 mà CHƯA AI ĐỌC MỘT LẦN NÀO.** `grade_levels.requires_sacrament_review` được seed đúng cho cả 5 cấp cuối ngành và `04_SYSTEM_WIDE_FINDINGS` xếp nó vào nhóm *"đã seed, không ai đọc"*; 5-Whys `03_AUDIT_RESULTS` §4.2 truy đúng gốc rễ: **cột cờ có, consumer không có**. Nay lớp cuối ngành cảnh báo bí tích còn thiếu khi đề xuất lên lớp — **cảnh báo, KHÔNG chặn** (BR-M08-18), nhưng người duyệt **bắt buộc nêu ý kiến**. **D-161** chốt phạm vi mà D-156 để mở: *cấp cuối của một ngành xét đúng bí tích RIÊNG của ngành đó*; ngành không có bí tích riêng (Nghĩa Sĩ · Hiệp Sĩ) mới nhắc lại các ngành trước. Hệ quả đã nói rõ khi chốt và **cố ý chấp nhận**: em thiếu Rửa Tội không được nhắc lại từ sau Chiên Con 2 cho tới tận Nghĩa 3. Ba khoá mới **vắng hẳn** ở lớp thường (AC-17) và ở mọi đề xuất cũ — tầng ứng dụng phải chịu được khoá vắng, có 3 bài unit canh riêng ca ấy. **(2) 🔴 Gửi lại một đề xuất bị từ chối đang XOÁ SẠCH ai từ chối, lúc nào, vì sao.** `on conflict do update` đặt `reviewed_by`/`reviewed_at`/`review_note` về `null`; `03_AUDIT_RESULTS` §4.3 gọi gốc rễ là *"yêu cầu idempotency bị hiểu thành yêu cầu ghi đè"*. Chủ dự án chốt **D-157** bảng riêng chỉ-ghi-thêm `promotion_review_events`, **ngược** khuyến nghị "cột `history` jsonb" của `04_TO_BE_FLOWS`. **BR-M08-16 giữ nguyên** — hàng review vẫn bị xoá khi gửi lại; cái đổi là lần từ chối ấy **đã nằm ngoài tầm với** của mệnh đề `do update` **từ lúc nó xảy ra**, chứ không phải được chép lại ngay trước khi bị mất. Append-only chặn bằng **trigger** nên luật đứng độc lập với mọi `grant`, kể cả `service_role`. **(3) 🔴 QUẢ MÌN CỦA ĐỢT LÀ THỨ TỰ LỆNH, không phải một điều kiện bị quên.** Trigger bịt đường vòng đóng ghi danh (**D-158**, chủ dự án chốt **cả hai tầng**, ngược khuyến nghị *"phương án A cho v1"*) nằm trên `enrollments`, và `security definer` bỏ qua RLS nhưng **KHÔNG bỏ qua trigger** — bản cũ đóng ghi danh nguồn **rồi mới** đánh dấu review `approved`, nên hàng rào mới sẽ chặn **chính đường duyệt hợp lệ**, 100% số lượt, bằng một mã lỗi trỏ vào luật vừa dựng để bảo vệ nó. Lời giải là **đảo thứ tự** — đánh dấu `approved` trước, rồi mới đụng `enrollments` — nên **không cần** cờ phiên `set_config` mà `04_TO_BE_FLOWS` phương án B lo là *"phức tạp, dễ sai"*; tính nguyên tử BR-M08-13 không suy suyển vì cả hai nằm trong một giao dịch. **D-162** khoanh phạm vi chặn về đúng **bốn trạng thái đóng**: "Tạm nghỉ" vẫn chạy, vì `paused` là trạng thái **mở** và chặn nó là chặn một việc chính đáng bằng một nút "không ăn" không ai hiểu. **(4) Nợ #18 trả cho `promotion_reviews`** — ca **RPC**, khuôn M05-A, đúng như M08-A đã ghi trước. **D-160**: hỏi **CẢ HAI** năm học. 🔴 Vế năm đích là vế dễ quên và cũng là vế nguy hiểm: policy `enrollments_insert_scope` đã mang đúng điều kiện ấy từ M02-C, nhưng definer **bỏ qua policy** ⇒ bỏ vế này là mở một đường vòng đi xuyên qua chính hàng rào M02-C vừa dựng. D-117 giữ nguyên, có bài đo. **(5) D-159 — một nút "Chuyển lớp" cho bốn vai trò cấp xứ đoàn**, `promote_enrollment_now` gọi lại **đúng hai RPC cũ** trong một giao dịch nên mọi hàng rào đi theo miễn phí. **0 thay đổi phân quyền.** 🔴 **Và nó mở ra một lỗ mà chính đợt này phải bịt:** đường một bước **không** đi qua Server Action giữ luật *"thiếu bí tích thì bắt buộc nêu ý kiến"*, nên bốn vai trò ấy sẽ đi vòng qua đúng luật vừa dựng, bằng một nút đợt này thêm vào; luật nay cũng nằm trong RPC (`PROMOTION_NOTE_REQUIRED`), có 3 bài pgTAP canh riêng. 🔴 **MỘT LỖI THẬT LỌT QUA CẢ BỐN CỬA KIỂM, E2E BẮT ĐƯỢC:** `promotion_reviews` có **hai** khoá ngoại trỏ về `enrollments` (`source_enrollment_id` và `created_enrollment_id`), nên nhúng `promotion_reviews(...)` **trần** từ `enrollments` là **nhập nhằng** — PostgREST từ chối cả câu truy vấn, `data` về `null`, và **trang chi tiết lớp 404 toàn bộ**. `lint` · `typecheck` · `test` · `build` **đều xanh** vì chuỗi truy vấn chỉ là một chuỗi ký tự; `class-settings.spec.ts` đỏ ngay bài đầu. Đã sửa bằng cách gọi đích danh khoá ngoại và đo lại. **Số kiểm thử thật:** pgTAP **1215/1215** (trước 1162, **+53**, file mới `046` toàn bộ **JWT thật của 8 vai trò**) · unit **1322 pass / 10 skip** (trước 1282, **+40**) · lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 469/477** trên DB vừa `db:reset` + `seed:dev`, **24,5 phút**. ⚠️ **8 đỏ = 1,68 %, TĂNG so với 1,07 % của M08-A và tôi không giấu con số đó** (mẫu số cũng đổi 468 → 477 vì đợt này thêm 3 bài × 3 viewport, và cả 9 bài mới đều xanh). Phân loại bằng **ảnh chụp lỗi**, không bằng phỏng đoán — đúng bài học M05-C: **6 bài** để lại nút *"Đang …"* ở trạng thái vô hiệu ⇒ chữ ký **nợ #10** (*"ghi vào được, câu trả lời không về"* — ảnh chụp của `results.spec.ts` còn cho thấy màn hình **đã hiện** *"Thành công: Đã khóa bảng điểm"*); **2 bài** `staff-directory` rớt ở `page.waitForURL` với **0** nút vô hiệu ⇒ chữ ký **nợ #15**. **Không bài nào rớt ở một khẳng định nghiệp vụ, và không bài nào thuộc luồng chuyển lớp**: `promotions.spec.ts` **57/57 xanh cả ba viewport**, `class-settings.spec.ts` **15/15**. ⚠️ **Một điều KHÔNG kết luận được:** `results.spec.ts` rớt ở bước *"khóa bảng điểm"* của M07 **trước khi** tới bước *"duyệt chuyển lớp nguyên tử"*, nên trên `tablet-768` phần RPC vừa đảo thứ tự lệnh **chưa được chạy tới**; nó **xanh trọn vẹn trên `mobile-360`**. ⚠️ **Cái giá đã biết của đợt này, giữ nguyên từ M08-A:** nút **"Duyệt" VẪN CHƯA hỏi lại** — thuộc hạng mục 2, đợt C.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M08-A**, **MỞ MODULE 11/14 (M08 Chuyển lớp**, `NEEDS_IMPROVEMENT`, 56/75, **1 luồng `CRITICAL`)**. Đợt "rẻ nhất, an toàn nhất" theo đúng thứ tự `07_IMPLEMENTATION_IMPACT` §3: **0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng**, pgTAP giữ nguyên phần cũ và **chỉ cộng thêm bài kiểm chéo**. **(1) 🔴 Lỗi `CRITICAL` DUY NHẤT của module là một phép nhân: `/promotions` gọi `canProposeForClass` — hai truy vấn — cho MỖI ghi danh** (`queries.ts:98-101` cũ chạy nó trong một `Promise.all` trên từng phần tử), và đọc **mọi năm học**, không lọc, không phân trang. Với ~900 em toàn xứ đoàn đó là **~1.800 lượt đi về cơ sở dữ liệu cho một lượt mở trang**, và một trang cuộn dài hàng chục nghìn pixel. 5-Whys `03_AUDIT_RESULTS` §4.1 truy đúng gốc rễ: *"thiếu một truy vấn danh sách được thiết kế cho danh sách"* — quyền per-dòng được suy ra từ một hàm quyền per-thao-tác. Nay `getRepresentativeClassIds` hỏi **một lần cho cả trang** (*"tôi là đại diện của những lớp nào"*), và cả trang dùng **3–5 lượt gọi cố định** dù có 50 hay 5.000 ghi danh — AC-13 đòi ≤ 6. **(2) Bảng tiến độ theo lớp lần đầu tồn tại** — `06_UI_UX_RECOMMENDATIONS` §1 chấm đây là khoảng trống lớn nhất của trang (*"người duyệt không biết còn thiếu bao nhiêu nên không biết khi nào xong"*); mỗi con số **là một liên kết** dẫn thẳng vào đúng lớp ở đúng trạng thái, và phép đếm chạy **trên cả phạm vi chứ không trên trang đang xem** — đúng cái bẫy M12-B đã vấp. **(3) 🔴 BR-M08-X2 — `docs/03` WF-11 đòi *"mặc định giữ nhánh A/B"* từ đầu và hệ thống CHƯA BAO GIỜ làm:** ô lớp đích lấy **phần tử đầu** danh sách đã sắp theo tên, nên mọi em lớp **Ấu 1B** đều được đề xuất sẵn sang **Ấu 2A**. Hệ quả thứ hai nặng hơn hệ quả thứ nhất: ô ấy **tự chọn sẵn một giá trị hợp lệ**, nên một cú bấm "Lưu đề xuất" ra một đề xuất trông hoàn chỉnh mà người dùng **chưa thực sự quyết định** (`03_AUDIT_RESULTS` tiêu chí 5). **(4) 🔴 Mười một tên luật của RPC đi qua đúng HAI câu tiếng Việt** — riêng `23514` gánh **sáu** tên và trả *"Lớp đích hoặc trạng thái chuyển lớp không hợp lệ."*. Ca tệ nhất là `ENROLLMENT_NOT_OPEN`: câu cũ chỉ thẳng vào ô "Lớp đích", nhưng lớp đích **không phải chỗ hỏng** — ghi danh đã đóng thì không đề xuất nào hợp lệ, nên người dùng đổi lớp đích rồi bấm lại và hỏng y hệt. Ba câu `schemas.ts` tự viết từ Phase 5 (*"Vui lòng chọn lớp đích."*…) **chưa từng hiện ra một lần nào** vì `failure()` nuốt sạch `ZodError`. **(5) Kiểm chéo bàn giao từ M07-B đã ĐO, không chỉ đọc code** — ẩn một cột điểm phải loại luôn cột ấy khỏi điểm trung bình mà đề xuất chuyển lớp chụp lại; `v_student_weighted_average` có sẵn `and assessment.is_active` từ Phase 5, nhưng **một điều đúng khi đọc không phải một điều đã được đo**, nên pgTAP `019` có thêm **4 bài** đo hai con số 7,00 → 10,00. **(6) Nợ #14 trả cho `promotions`**, còn **3 module**; kèm **đính chính**: danh sách nợ ghi `absence-requests` là còn nợ — **sai**, M05-B đã trả rồi. Kèm hạng mục 9 (gỡ phụ thuộc chéo sai giữa hai feature), lọc + tìm không dấu + phân trang 25 dòng, 4 `<select>` trần cuối của module về `Select`, và ô *"Lớp đích khi duyệt"* hết là một ô `required` **rỗng không giải thích** khi năm sau chưa có lớp. unit **1282 pass / 10 skip** (trước 1224, **+58**) · pgTAP **1162/1162** (trước 1158, **+4**) · lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 463/468** trên DB vừa `db:reset` + `seed:dev`, 21,7 phút — **5 đỏ = 1,07 %**, thấp hơn 2,4 % của M07-C; **không bài nào thuộc luồng chuyển lớp**, và `promotions.spec.ts` mới **48/48 xanh cả ba viewport**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M07-C** ⇒ **ĐÓNG MODULE 10 (M07 Bảng điểm)**, module thứ **10/14**. **1 migration · 0 thay đổi phân quyền · 0 `alter table` trên bảng cũ · 0 dòng dữ liệu bị đụng.** **(1) 🔴 "Khóa bảng điểm" và "công bố kết quả cho phụ huynh" là HAI việc, mà hệ thống buộc chung làm một** — muốn công bố thêm một cột sau khi đã khóa thì phải nhờ Quản trị viên hệ thống **mở khóa cả bảng điểm**, tức mở luôn quyền sửa điểm và hệ số của cả lớp, giữa lúc điểm vừa được chốt. `07_IMPLEMENTATION_IMPACT` §1 chấm đây là hạng mục **rủi ro nghiệp vụ cao nhất** của module và §7 xếp **làm cuối**. Chủ dự án chốt tách ra, **cả hai chiều** bật và tắt (**D-154**); **ai được công bố thì KHÔNG đổi** — chỉ đổi *lúc nào* công bố được, nên đợt này **0 thay đổi phân quyền**. 🔴 **Và quả mìn nằm ở bảng KHÁC:** đường công bố đi qua **ba** lớp kiểm, lớp thứ ba là trigger dòng của `assessment_scores` — đổi `is_published` làm trigger đồng bộ chạy một lệnh UPDATE lên bảng ấy, mà trigger của nó **cũng** ném `GRADEBOOK_LOCKED`. Nới hai lớp đầu mà quên lớp thứ ba thì thao tác vẫn hỏng với đúng mã lỗi cũ, ở một bảng không ai nghĩ tới khi đọc diff. **Policy `assessments_update_grader` GIỮ NGUYÊN** — ngoại lệ chỉ sống bên trong RPC `security definer`, nên lệnh gửi thẳng vào cơ sở dữ liệu khi đã khóa vẫn bị từ chối **kể cả khi lệnh ấy chỉ đổi mỗi cờ công bố** (AC-02-02, đo bằng 6 khẳng định riêng). **(2) 🔴 Ẩn một bảng Top 5 rồi bấm công bố lại là ÂM THẦM TÍNH LẠI** — em đứng hạng 5 hôm trước biến khỏi bảng, không ai được báo, và bản cũ **không còn ở đâu**; nhãn *"Ẩn khỏi portal"* không hề nói ra điều đó (F16). Tài liệu khuyến nghị cấm hẳn việc tính lại (phương án A); **chủ dự án chọn phương án B** — giữ khả năng tính lại, nhưng bản đang có phải **xuống lịch sử** trước khi bị thay (**D-155**, bảng `leaderboard_snapshots` append-only, chỉ nhân sự phạm vi lớp đọc, **cổng phụ huynh không có nhánh đọc nào**). Một bảng Top 5 nay có **ba** trạng thái chứ không phải hai, và trạng thái thứ ba có **hai** nút tách bạch: *"Hiện lại bản đang có"* ↔ *"Chốt lại danh sách"*. Kèm **BR-M07-35** siết đường xóa: phép thử cũ `not is_published` **sai đúng hình dạng F04** mà đợt B vừa chữa — ẩn xong là policy cho qua, rồi để **khoá ngoại trả lời hộ** bằng một câu sai hẳn nghĩa. **(3) 🔴 Bốn `window.confirm` CUỐI CÙNG CỦA TOÀN HỆ THỐNG đã hết** — `grep -rn "window.confirm\|window.alert" src/` nay ra **0**, đóng **nợ #1** sau 14 đợt. **(4) Nợ #21 ĐÓNG** — cột đã ẩn có đường hiện lại ngay trên màn hình; món nợ do chính M07-B mở ra ba ngày trước. pgTAP **1158/1158** (trước 1115, **+43**) · unit **1224 pass / 10 skip** (trước 1210, **+14**) · lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · **E2E toàn bộ 410/420** (10 đỏ = **2,4 %**, **tăng** so với 1,4 %; 4 bài rớt ở `page.waitForURL` — chữ ký nợ #15, 6 bài rớt ở lượt làm mới chưa về — chữ ký nợ #10; **không bài nào rớt ở một khẳng định nghiệp vụ**, và `results.spec.ts` **xanh trọn vẹn trên `laptop-1366`** gồm cả bốn bước mới của đợt C).
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M07-B** (module 10/14, đợt 2/3). ⚠️ **Bản ấy ghi *"đợt DUY NHẤT có migration của module bảng điểm"* — câu đó SAI**, `07` §1 xếp TB-M07-02 và TB-M07-06 đều có migration và cả hai nằm ở đợt C. Câu **vẫn đúng**: đó là migration duy nhất của cả 2B **có đụng dữ liệu**. **(1) 🔴 "Ai được khóa bảng điểm" có BA TẦNG nói ba điều khác nhau** — `docs/05` §5 nói *"chỉ Giáo lý viên đại diện"*, hàm cơ sở dữ liệu cho thêm cả ba vai trò cấp xứ đoàn, còn phép tính hiện nút thì lệch **cả hai** và **không kiểm lớp**, nên một Giáo lý viên đại diện của lớp A **nhìn thấy nút "Khóa bảng điểm" trên lớp B**. `08_ACCEPTANCE_CRITERIA` §5 gọi đây là *"mâu thuẫn chưa giải quyết"* và **từ chối viết tiêu chí nghiệm thu** cho tới khi chủ dự án chốt. Nay cả ba trỏ về **một cái tên** `app.can_lock_gradebook`: đại diện + Giáo lý viên lớp của chính lớp đó, cộng Super Admin làm đường thoát (**D-151**). ⚠️ **SIẾT quyền của người đang dùng — phải báo trước cho Ban điều hành xứ đoàn.** Kèm **AC-10-02**: bấm khóa lần hai không còn đẩy lùi mốc khóa, mà mốc ấy là thứ **duy nhất** trả lời được câu *"bảng điểm chốt lúc nào"*. **(2) 🔴 Xóa một cột tạo nhầm là việc KHÔNG LÀM ĐƯỢC, và câu lỗi NÓI SAI** — đường xóa cũ để **khoá ngoại trả lời hộ**, mà trước M07-A biểu mẫu ghi cả roster nên cột nào cũng có sẵn một dòng rỗng cho mỗi em ⇒ người dùng đọc *"Cột đã có điểm"* trong khi **chưa nhập điểm nào**. Nay cột chưa có điểm → **xóa hẳn** (dọn luôn dòng rác của lỗi cũ, không cần backfill riêng), cột đã có điểm → **ẩn**. 🔴 Và **ẩn phải ẩn ở tầng cơ sở dữ liệu**: mọi truy vấn ứng dụng đã lọc `is_active` từ Phase 5 nhưng **RLS thì không**, nên phụ huynh gọi thẳng Data API vẫn đọc được — một bất biến chỉ đúng ở tầng ứng dụng **không phải bất biến**. **(3) 🔴 Cờ "chỉnh tay" đóng dấu VÔ ĐIỀU KIỆN** lên cả cột chuyên cần, làm cơ chế đề xuất tự động chết hẳn; nay chỉ bật khi giá trị **khác** đề xuất và **tự gỡ** khi trùng lại, kèm **D-153** dọn dấu đặt sai trong dữ liệu hiện có. Con số của nút *"Lấy đề xuất mới"* cũng **đếm gộp cả dòng bị bỏ qua** nên nó nói sai — nay trả **hai** số (**TB-M07-04**). **(4) 🔴 Mức hiển thị nhận xét mặc định là CÔNG KHAI**: viết vội một câu về một em là câu ấy ra thẳng cổng phụ huynh, không một dòng cảnh báo. Nay mặc định **nội bộ** (**BR-M07-32**). Và **bất kỳ ai dạy lớp đều xóa được nhận xét của người khác** trong khi bảng **không có lịch sử** — nay chỉ tác giả · đại diện lớp · cấp xứ đoàn (**D-152**), luật đặt vào **cả sửa lẫn xóa** vì siết mỗi xóa thì sửa nội dung vẫn đi lọt. **(5) Nợ #18** đóng cho cả **bốn** bảng của module, và module này chứa **cả hai ca**: ba bảng chặn được bằng policy, riêng `assessment_scores` chỉ chặn được **trong RPC** vì `authenticated` không có quyền ghi mức bảng và definer bỏ qua RLS. Mở ra **nợ #21** — *"ẩn cột"* là cửa **một chiều**, đã nói thẳng trong câu xác nhận. pgTAP **1115/1115** (trước 1061, **+54**, file `044` toàn bộ **JWT thật của 9 vai trò**) · unit **1210/10 skip** (+25) · lint 0 warning · typecheck ✓ · build 28/28 · **E2E toàn bộ 414/420** (6 đỏ = 1,4 %, **đúng bằng tỷ lệ M07-A**, cả sáu ở vùng nợ #10/#15 đã ghi tên; hai bài `results` rớt ở bước **có trước đợt B**)
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M07-A**, mở **module 10/14 (M07 Bảng điểm**, `NEEDS_IMPROVEMENT`, 58/75, **0 CRITICAL**). Đợt "rẻ nhất, an toàn nhất" theo đúng thứ tự phụ thuộc `07` §7: **0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng**, pgTAP giữ nguyên **1061/1061** sau một lượt `db:reset` sạch. **(1) 🔴 Kiểm soát chống công thức lạ trong file Excel đang được áp dụng NỬA VỜI — và nửa vời tệ hơn không có, vì bảng kiểm ghi là "đã có".** Tên thánh và họ tên đi qua bộ lọc, **tiêu đề cột điểm thì không** — một ô văn bản tự do 120 ký tự do chính Giáo lý viên đặt, và đặt tên cột là `=1+1` là hợp lệ. 5-Whys truy đúng nguyên nhân gốc: *"dữ liệu người dùng"* được hiểu là dữ liệu **đến từ file import**, còn thứ nhân sự tự gõ thì "tin được". **Bài kiểm cũ LÀ MỘT PHẦN của lỗi**: nó gọi hàm lọc **tách rời** rồi đếm số phần tử header, nên xanh vĩnh viễn bất kể hàm dựng bảng có gọi bộ lọc hay không. Bài mới **quét mọi ô văn bản**. **(2) 🔴 Bấm "Lưu điểm" một lần là ghi CẢ ROSTER kể cả ô trống — gốc rễ của BA lỗi khác nhau:** cột nào cũng lập tức có 50 dòng điểm nên **cột tạo nhầm không bao giờ xóa được nữa** (F04, và câu lỗi đọc được là *"Cột đã có điểm"* khi chưa nhập điểm nào) · người lưu sau **ghi đè sạch** điểm người lưu trước, không cảnh báo, không lấy lại được (F06) · một cú bấm đóng dấu *"đang chỉnh tay"* lên **cả 50 em** khiến đề xuất chuyên cần tự động không bao giờ cập nhật được nữa (F07). Nay chỉ gửi **ô đã đổi** — thứ `07` §7 gọi là **điều kiện tiên quyết** cho ba hạng mục của đợt sau. **(3) D-150 — hai tiêu chí trong CÙNG một tài liệu đã duyệt mâu thuẫn nhau**: AC-07-01 đòi hiện *"3/**5** cột"* (5 = tổng số cột của lớp) trong khi AC-02-03 cấm để lộ *"dấu vết cột tồn tại"* và `07` §4 cấm nới quyền đọc của cổng phụ huynh. Chủ dự án chốt: **cả hai con số lấy từ phần đã công bố**. **(4)** Hệ số mặc định đọc từ cấu hình năm học (bảng ấy có thật từ Phase 5 mà biểu mẫu chưa từng đọc) · câu lỗi tiếng Việt cho `ZodError` ở **6 luồng** · **SW-04** (khóa bảng điểm rồi bấm Lưu vẫn báo *"Đã cập nhật"* — `using` của policy lọc dòng **trước khi trigger chạy**) · **nợ #14** · **nợ #20 ĐÓNG HẲN** (chỗ cuối cùng của toàn hệ thống) · phần *"chờ cứng 5 giây"* của **nợ #10**. Unit **1185 pass/10 skip** (trước 1151/10, **+34**) · pgTAP **1061/1061** (**+0**) · lint **0 warning** · typecheck ✓ · build ✓ 28/28 · **E2E toàn bộ 414/420** trên DB vừa `db:reset` + `seed:dev` — 6 đỏ = **1,4 %** (M06-C: 8 đỏ/420 = 1,9 %), và **0 bài nào thuộc bảng điểm**
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M06-C** ⇒ **ĐÓNG MODULE 9 (M06)**, module thứ **9/14**. Đợt cuối là đợt **giao diện thuần: 0 migration · 0 thay đổi phân quyền**, và pgTAP giữ nguyên **1061/1061** chính là bằng chứng của điều đó. **(1) 12 trường đổ thẳng ra giữa trang, nằm TRÊN toàn bộ danh sách bài** — trên 360px người soạn phải cuộn hết một biểu mẫu 12 khối mới tới được bài đầu tiên. Nay biểu mẫu mở trong `Dialog`, trang chỉ còn một nút "Thêm mục giáo án". `Dialog` neo đáy màn hình ở mobile và là hộp giữa màn hình từ `sm` — **đúng "form drawer" của `docs/06` §11, bằng component đã có**. Chủ dự án chọn **một đường đi cho cả ba viewport** (**D-148**): phương án "chỉ mobile mới dùng hộp thoại" đòi đo cỡ màn hình bằng JavaScript, tức nhấp nháy lúc hydrate và mọi bài kiểm phải viết hai nhánh. **(2) 12 ô chia ba nhóm, hai nhóm ít dùng gập sẵn** (**D-149**) — và **điều kiện để được phép gập là tiêu đề nhóm phải ĐẾM số ô đã điền** (*"Nội dung buổi học · đã điền 4/7"*, đếm theo thứ đang gõ dở): gập một nhóm đang có nội dung mà không nói ra là giấu mất đúng thứ người sửa cần soát. 🔴 **Nhóm bắt buộc KHÔNG được gập** vì trình duyệt từ chối lượt gửi kèm một ô `required` đang ẩn, bằng một lỗi mà người dùng chỉ thấy là "bấm Lưu không có gì xảy ra". **(3) Hai `window.confirm` cuối của module** (#9 — **nợ #1**, còn **4** chỗ, tất cả ở M07) thành `ConfirmDialog` nêu hậu quả bằng tên riêng — kể cả điều câu cũ **giấu mất**: xoá mục là **xoá luôn tệp đính kèm** khỏi kho lưu trữ. **(4) Một lỗ D-61 có thật lộ ra khi đọc lại đường đóng biểu mẫu:** lượt sửa thành công đặt câu xác nhận rồi gọi ngay hàm gỡ chính component đang giữ câu ấy ⇒ **sửa xong không có một chữ nào**, đúng hình dạng lỗi M05-B. **(5)** Hai `<select>` trần cuối cùng của module về `Select`, hai ô có ranh giới riêng tư nói ra ai đọc được — và ô đi ra cổng phụ huynh **không phải** ô mà biên bản audit nêu, mà là **"Chuẩn bị"**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M06-B** (module 9/14, đợt 2/3): **đợt DUY NHẤT có migration của module giáo án**, và là đợt trả lời **cả ba** câu `NEEDS_CONFIRMATION` còn mở của `08_ACCEPTANCE_CRITERIA`. **(1) 🔴 D-144 — ba vai trò cấp xứ đoàn đang sửa được giáo án của mọi lớp**, và đó là một **mâu thuẫn giữa hai nguồn sự thật** thuộc đúng loại `AGENTS.md` §3 cấm agent tự chọn: `docs/05` cho Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký ô ✅, còn `docs/03` WF-07 chỉ nêu người làm là **Giáo lý viên đại diện lớp**. Chủ dự án chốt theo WF-07. Quyền **ĐỌC không nhúc nhích**. Super Admin **giữ** quyền ghi (xác nhận 2026-08-05) vì lý do vận hành nặng hơn lý do đối xứng: **lớp chưa phân công đại diện thì không còn tài khoản nào lập được giáo án cho lớp đó**. **(2) D-145 — có người GHI được mà không ĐỌC lại được**: hệ thống mang hai định nghĩa "thuộc lớp", policy đọc dùng cái hẹp còn quyền ghi dùng cái rộng, nên tạo giáo án xong tải lại trang là **trắng**. Nới bằng `or app.is_class_staff(...)` ở **riêng** hai policy của module, **không** sửa `app.can_access_class` (hàm đó đỡ policy của 6 module). Tệp đính kèm **đi theo** (xác nhận 2026-08-05) — nới nội dung mà không nới tệp thì đúng nhóm ấy nhìn thấy tên tệp và nút "Tải xuống" rồi bấm vào bị từ chối. **(3) Nợ #18 — và lời giải NGƯỢC với đợt A của M05**: ở đó ba bảng điểm danh chỉ ghi được qua `security definer` nên hàng rào phải nằm trong RPC; ở đây `authenticated` ghi **thẳng trên bảng** nên đúng khuôn một dòng của M02-C. Đặt ở **cả sáu policy ghi**, kể cả DELETE. **(4) 🔴 D-146 — hai người cùng sửa một mục thì người lưu sau xoá sạch công của người lưu trước**, không cảnh báo và **không có cách lấy lại** vì bảng không có lịch sử. Nay là một phép so-rồi-đổi nguyên tử trên `updated_at`. Cái bẫy nằm ở **độ chính xác**: `timestamptz` là **micro giây**, `Date` của JavaScript chỉ tới **mili giây** — đi qua `Date` một vòng là phép so **không bao giờ khớp**, và hàng rào chống ghi đè biến thành hàng rào chặn chính người đang sửa. 🔴 **Lỗi thật của đợt, lọt qua CẢ BỐN cửa kiểm:** thêm một `export const` chuỗi vào file `"use server"` làm **chết cả trang**, mà `lint`/`typecheck`/`test`/`build` đều xanh — chỉ E2E bắt được. Đã dựng cửa chặn mới `use-server-exports.test.ts`. **1 migration · 1 NỚI · 2 SIẾT · 0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng.** Tiếp theo là **M06-C**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M06-A** (module 9/14, đợt 1/3): nhóm *"S, độc lập"* và *"S, siết an toàn"* của module điểm cao nhất hệ thống (65/75), **0 migration**. Thông báo THÀNH CÔNG hiện màu đỏ kèm `role="alert"` · ô chọn người dạy mời chọn người mà cơ sở dữ liệu chắc chắn từ chối (và cái bẫy khi sửa **nặng hơn lỗi**: `<select>` mất giá trị đang giữ sẽ âm thầm đổi người dạy) · câu lỗi viết kỹ từ Phase 4 **chưa từng hiện ra một lần nào** · trần 5 MB là **lời hứa không thể giữ** vì `bodySizeLimit` của nền tảng là 4,5 MB · phụ huynh gõ thẳng địa chỉ trang quản trị vẫn thấy khung trang với một **lời nói dối** về giáo án rỗng · link tải tệp là action **duy nhất** không kiểm quyền theo lớp. Trả **nợ #14** và **nợ #20**. Unit **1131/10** (**+41**) · pgTAP **1033/1033** (**+0**).
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M05-C** ⇒ **ĐÓNG MODULE 8 (M05)**, module thứ **8/14**. Đợt cuối là đợt **không có migration nào** — cả bốn đối tượng cơ sở dữ liệu của module đã dùng hết ở A và B — và là đợt **duy nhất chạm vào bộ định vị E2E**, thứ mà `07_IMPLEMENTATION_IMPACT` §2.6 gọi là *"chi phí ẩn lớn nhất của U-10"*. **(1) TB-03 — bấm "Hoàn tất" là chốt luôn, không hỏi lại**, trong khi chốt là thao tác **một chiều**: nó đặt mốc khóa và sau đó chỉ Quản trị viên hệ thống mở lại được; tổng kết thì chỉ hiện **sau**, đúng lúc không còn sửa nhẹ nhàng được nữa. Nay có hộp xác nhận với bảng phân bố tính **từ bản nháp phía client** — tách **hai cột** Thánh lễ/Giáo lý vì hai trạng thái độc lập (D-30) và một con số gộp giấu mất đúng thứ cần soát — cộng **tên riêng** những em có đơn xin nghỉ mà vẫn đang để "Có mặt". **(2) TB-05 — bị tiếp quản thì trang ÂM THẦM chuyển chỉ-đọc**: các ô mờ đi, phần đang gõ biến mất, không một chữ nào giải thích. Nay có đồng hồ *"còn khoảng N phút"* lấy từ giá trị **máy chủ trả về** (RPC đã tính từ Phase 3 mà Server Action vứt đi), và khi mất quyền thì băng-rôn `role="alert"` cộng một ô **chép lại được** phần chưa lưu — trang **không** tự gửi gì lên, vì gửi là ghi đè dữ liệu của người đang phụ trách. **(3) 🔴 D-143 — lớp 50 em dài ~9.000px trên máy 360px**, mà việc người điểm danh thật sự làm trước khi chốt là *soát lại mình đã đánh vắng ai*. Hàng gấp lại còn một dòng: **~1.800px**. Ràng buộc bắt buộc: hàng gấp lại **vẫn nói đủ trạng thái cả hai cột** — gấp mà giấu luôn kết quả thì tệ hơn hẳn bản cũ. **(4) 🔴 D-142 — hàng nút BA lựa chọn, không phải hai như tài liệu đề xuất.** Phương án hai nút *"Có mặt · Vắng"* buộc máy chọn hộ một trong hai loại vắng, mà **"Vắng" không phải một trạng thái tồn tại trong hệ thống**: chọn "không phép" thì người đang vội ghi oan cho chính em vừa có đơn xin nghỉ, và con số ấy chảy thẳng vào điểm chuyên cần của M07. **(5) TB-09 · U-11** bộ lọc + tìm không dấu, **thuần client**, và đọc **bản nháp đang gõ** chứ không đọc dữ liệu đã lưu. **(6) U-17** thông báo chuyển vào thanh hành động cạnh nút vừa bấm — trên 360px hai chỗ ấy từng cách nhau hàng nghìn pixel nên bấm Lưu xong được hiểu là *"bấm không ăn"*. 🔴 **Và một lỗi thật của M05-B bắt được nhờ CHẠY:** `AbsenceReviewPanel` trả về trạng thái rỗng **trước khi** dựng dòng thông báo, nên ghi nhận đơn **cuối cùng** thì câu *"Đã ghi nhận đơn của {tên}"* bị **chính lượt làm mới nó vừa kích hoạt** xoá mất — vi phạm D-61 ở ca thường gặp nhất, và trước đó đã bị **ghi nhầm thành nợ #10**. **0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.** Tiếp theo là **M06 Giáo án**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M05-B** (module 8/14, đợt 2/3): **hoàn thiện nghiệp vụ đơn xin nghỉ, và siết ghi chú điểm danh về đúng nghĩa "nội bộ"**. **(1) TB-06 — phụ huynh đang gửi đơn vào một chỗ không ai trả lời.** `acknowledgeAbsenceRequest` viết từ Phase 3 mà **không màn hình nào gọi**, nên trạng thái `acknowledged` và cột `staff_note` **chưa bao giờ đạt tới được** và mọi đơn nằm ở *"Đang chờ"* vĩnh viễn. Tệ hơn: Giáo lý viên chỉ thấy đơn **sau khi** đã mở buổi — tức sau khi đã quá muộn để nó giúp được gì. Nay thẻ **"Đơn xin nghỉ tuần này"** ngay trên `/attendance`, cửa sổ ±7 ngày **nhìn cả về trước**, và nút gợi ý *"Vắng có phép"* trong trang buổi chỉ đổi **bản nháp phía client** (D-36 giữ nguyên). **(2) 🔴 D-75 — cổng phụ huynh đang in thẳng ghi chú nội bộ của Giáo lý viên**, biến một ô ghi nhớ thành kênh nhắn tin mà không ai định vậy. RLS lọc theo **dòng**, không theo **cột** — bức tường y hệt D-67 ở M03-C, nhưng lời giải **phải khác**: ở M03-C Thủ quỹ chưa đọc được dòng nào nên chỉ cần mở cửa sổ hẹp; ở đây phụ huynh **đang** đọc đúng dòng của con mình và phải tiếp tục đọc được (`012:280-308` canh đúng con số 1 dòng), còn thẻ chuyên cần thì cộng qua view `security_invoker` nên cắt dòng là **mất luôn thẻ**. ⇒ Chặn bằng **quyền cột**: `authenticated` mất `select` mức bảng, được cấp lại **từng cột trừ `note`**; nhân sự đọc qua cửa sổ hẹp `attendance_session_notes()`. Ai hỏi thẳng cột nhận `42501`, **không phải một ô trống** trông như "em này không có ghi chú". 🔴 **Bẫy để lại:** quyền cột không tự mở rộng — thêm cột mới mà quên `grant` là cột ấy vô hình với cả ứng dụng; pgTAP `042` có bài đối chiếu và đỏ kèm tên cột bị bỏ quên. **(3) TB-11 / D-141 — đơn cho buổi đã chốt bị từ chối**, nhưng chặn theo **trạng thái buổi** chứ không theo ngày như đề xuất U-09: con ốm sáng Chúa nhật, phụ huynh báo muộn vài giờ mà buổi còn mở thì lý do **vẫn kịp** đổi "vắng không phép" thành "vắng có phép". **(4) Nợ #18 đóng nốt bảng cuối của module** — và đây là chỗ đáng nhớ: `absence_requests` ghi **thẳng qua policy** nên hàng rào đặt được vào policy đúng khuôn M02-C, **ngược hẳn** ba bảng điểm danh ở đợt A vốn chỉ ghi được qua `security definer`. Cùng một món nợ, hai lời giải trái ngược, trong **cùng một module**. **(5)** Năm mã lỗi của module nay có câu tiếng Việt riêng thay cho một câu *"Dữ liệu không hợp lệ"* duy nhất; **nợ #14** trả thêm ở cả ba thao tác đơn xin nghỉ; `acknowledgeAbsenceRequest` hết báo thành công khi RLS chặn (SW-04). **1 migration · 0 `alter table` · 0 backfill · 1 thay đổi phân quyền (SIẾT).** Tiếp theo là **M05-C**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M05-A** (module 8/14, đợt 1/3): **toàn bộ nhóm "đúng đắn dữ liệu" của module điểm danh**, đúng thứ tự ưu tiên mà `07_IMPLEMENTATION_IMPACT` §3 đề xuất. **(1) TB-01 — sáng Chúa nhật form đổ sẵn buổi thứ Năm TUẦN TRƯỚC.** Máy chủ chạy `TZ=UTC`, mà 06:00 sáng Chúa nhật giờ Việt Nam là **23:00 thứ Bảy UTC**. Đây là ca thường gặp chứ không phải ca biên — người điểm danh tới nhà thờ sớm là chuyện bình thường. 🔴 Vì sao không test nào bắt được: E2E **tự sinh ngày rồi `fill` tay vào ô**, nên giá trị mặc định **chưa từng được kiểm**. **(2) TB-02 — cùng một buổi, hai màn hình nói hai điều khác nhau.** Hub in thẳng `session.status`, mà **không code path nào ghi `status='locked'`** (khóa là hàm của thời gian, đúng tinh thần "không cần cron"), nên buổi đã khóa hiện *"Đã chốt"* ở danh sách và *"Đã khóa"* khi mở ra. Nay `deriveSessionState()` là **một chỗ duy nhất**, thêm nhãn **"Đã mở khóa"** mà danh sách chưa từng có. **(3) TB-04 — bấm "Hoàn tất" lần hai báo có người khác phụ trách, trong khi không có ai.** Một điều kiện gộp **ba** tình huống, mà finalize thì **xóa `editing_by`**. Nay ba mã riêng; `ATTENDANCE_ALREADY_CLAIMED` **giữ nguyên** cho đúng ca pgTAP `012` đang canh. **(4) TB-07 — một em rời lớp khóa cứng CẢ BUỔI đã diễn ra**, kèm câu *"Thao tác bị xung đột. Vui lòng thử lại."* — một lời hứa sai khiến người dùng thử lại mãi. **(5) D-140 — em "Tạm nghỉ" ra khỏi danh sách điểm danh** (nợ #19): giữ tên mà mặc định *có mặt* nghĩa là em nghỉ dài ngày được ghi có mặt. 🔴 Cái bẫy nằm ở **chỗ khác**: `roster_size` khi chốt đếm bằng một truy vấn **chép tay** cùng luật — quên sửa là **mọi lớp có một em tạm nghỉ không chốt được buổi nào nữa**. **(6) D-139 — Cha sở và Cha phó xem được điểm danh** (chỉ đọc), Thủ quỹ vẫn không. **(7) Nợ #18 — hàng rào năm học đã đóng**, và ở module này nó **không đặt được vào policy** như M02-C đã làm: mọi đường ghi qua RPC `security definer`, mà definer **bỏ qua RLS**. Kèm **nợ #20** và **nợ #14**. **1 migration toàn `create or replace` · 0 backfill · chữ ký hàm không đổi.** Tiếp theo là **M05-B**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M12-C** ⇒ **ĐÓNG MODULE 7 (M12)**, module thứ **7/14**. Đợt cuối trả nốt ba việc, và **hai trong ba là thứ tài liệu đòi từ Phase 2 mà chưa bao giờ tồn tại**. **(1) TO-BE 5 / AC-22 — tải file lỗi/kết quả.** `docs/09` §9 đòi *"User download được errors"* từ đầu; người **có** dữ liệu còn thiếu là **Giáo lý viên lớp**, nhưng họ **không được vào `/imports`** (SEC-01) — và điều đó đúng. Trước đợt này hệ quả là Thư ký phải **chép tay** từng dòng lỗi ra tin nhắn. Nay `.xlsx` hai sheet `LOI` + `KET_QUA`, **không nới quyền cho ai** (SEC-04b: Giáo lý viên lớp gọi thẳng đường dẫn nhận **403**, không phải một file rỗng hợp lệ). 🔴 **SEC-16 suýt mở lại ở cửa thứ hai**: `errors_json` chứa `sqlerrm` nguyên văn, màn hình đã dịch từ M12-A nhưng file xuất ra đọc thẳng — mà cửa này tệ hơn màn hình vì **tệp đi ra ngoài hệ thống**. **(2) TO-BE 6 / AC-24 — ghi danh bị bỏ qua hết im lặng.** `on conflict do nothing` làm dòng báo `committed` dù em vẫn ở lớp cũ, và đó là **đường đi thường gặp nhất** của module. Nay `commit_import_rows` trả `out_enrollment_created`, dòng mang cảnh báo nêu **đúng tên lớp em đang học**, kết quả ghi đếm con số ấy **riêng**. Migration **drop + create** ⇒ phải **cấp lại `grant execute`**; ba bài đầu của pgTAP `040` canh đúng chỗ đó. **(3) TO-BE 8 / D-137 · D-138 — hai cái trần**, và cái thứ nhất là một **con số sai** chứ không phải hành vi sai: trần cũ 5 MB nằm **trên** giới hạn ~4,5 MB của nền tảng nên câu tiếng Việt chưa từng chạy được, còn `bodySizeLimit: "6mb"` cao hơn cả trần nền tảng. Nay **4 MB** và **1.000 dòng** (SEC-12 trước đây **không có giới hạn nào**), cả hai nói ra **ngay trên ô chọn file**. **1 migration · 0 thay đổi phân quyền.** Đóng luôn **NC-01** và **NC-02**. Tiếp theo là **M05 Điểm danh**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M12-B** (module 7/14, đợt 2/3): **module dùng được ở quy mô thật**. **(1) TO-BE 4 / AC-21** — sổ SYLL của giáo xứ **không có cột giới tính** (83% dòng), mà mỗi dòng là **một lần gửi + một lượt dựng lại cả trang**: tiêu chí *"số bước hợp lý"* chấm **2/5**, thấp nhất module. Nay **một** biểu mẫu mang cả trang dòng, kèm **"Áp dụng Nam/Nữ cho các dòng đang chọn"** — và **không** có nút đoán theo tên đệm (BR-M12-36). **(2) D-136 giữ nguyên D-133** — nút lưu chung cố ý **không** xác nhận hộ dòng trùng chắc chắn; dòng ấy có nút riêng **nằm trong khối đối chiếu phải mở ra mới bấm được**, và lượt lưu chung **nói ra** số dòng nó bỏ qua. **(3) TO-BE 7 / AC-25** — trang chi tiết hết đổ 300–900 dòng vào một lượt dựng: **50 dòng/trang + 6 bộ lọc**; danh sách lần nhập hết `.limit(20)` viết cứng, có phân trang, lọc theo năm học (**D-135**) và trạng thái, và **nói ai tải lên**. 🔴 Cái bẫy của phân trang đã bị bắt: ba con số đầu trang (dòng chờ ghi · chưa xác nhận trùng · thiếu giới tính) nay đếm **trong cơ sở dữ liệu**, không đếm trên trang đang xem — giữ phép đếm cũ thì lần nhập 900 dòng hiện nút *"Ghi 50 dòng"*, sai mà không gì báo là sai. **0 migration · 0 thay đổi phân quyền.** Lần đầu `Pagination` và `FilterBar` của Đợt 0-UI chạy trong trang thật. Tiếp theo là **M12-C**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M12-A** (module 7/14, đợt 1/3): **gỡ CẢ BA lỗi CRITICAL của module trong một đợt** đúng "gói tối thiểu" mà `07_IMPLEMENTATION_IMPACT` §3 khuyến nghị. **(1) 4.1** — cả năm biểu mẫu của module vứt giá trị trả về, nên bấm "Kiểm tra file" xong màn hình **không đổi một chữ nào**; nay ba Client Component dùng `useActionState`, tải lên hỏng thì đọc được **lý do cụ thể** (câu chữ đã có sẵn ở `parse.ts` từ Phase 2 mà chưa ai hiện ra), tải lên xong vào **thẳng** trang lần nhập. **(2) 4.2** — nút "Xoá lần nhập này" xoá được cả lần nhập **đã ghi dữ liệu**, không hỏi lại, cuốn theo mối nối "dòng nào tạo ra em nào"; nay hàng rào nằm ở **cơ sở dữ liệu** (`20260729000100`), huỷ là **đánh dấu** chứ không xoá (**D-131**), và "Xoá dữ liệu thô" là thao tác riêng giữ nguyên mapping (**D-132**). **(3) 4.3** — mọi dòng mặc định "Tạo mới" kể cả dòng trùng gần như chắc chắn; nay mặc định là **Ghép** và dòng trùng chắc chắn **chặn ghi** tới khi người duyệt xác nhận (**D-133**), dò trùng xét cả hồ sơ đã rút. Kèm **Zod ở biên** và **dịch lỗi ghi ra tiếng Việt** (SEC-16 từ "hiện đang vi phạm" thành đúng). **1 migration · 0 nới quyền · 1 siết quyền**, pgTAP `039` **21 bài JWT thật**. Tiếp theo là **M12-B**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M03-C**, **ĐÓNG MODULE 6 (M03)**: **lưu trữ hồ sơ và ghi danh nay đổi trong MỘT giao dịch** (F06 = 42/75, hạng mục rủi ro cao nhất module) và **tiêu chí S-11 từ "hiện đang SAI" thành đúng** — em đã lưu trữ thì Giáo lý viên **mất quyền đọc** hồ sơ lẫn dữ liệu sức khoẻ · **màn hình quản lý người giám hộ lần đầu tồn tại** (F12 = 31/75, thấp nhất module: `updateGuardian` viết từ Phase 2 mà không màn hình nào gọi), kèm đổi người giám hộ có xác nhận nêu **đủ ba cái tên** · **sửa/xoá được bản ghi bí tích** (F08, **D-128**) · **D-127** nới quyền ghi sức khoẻ/bí tích cho vai trò ngành và Giáo lý viên theo đúng `docs/05` §3 · **D-67/D-129** Thủ quỹ hết trang trắng, đọc qua **cửa sổ hẹp** nên bài **S-06 vẫn xanh**. **1 migration · 3 thay đổi NỚI · 1 thay đổi SIẾT**, pgTAP `038` **57 bài JWT thật**. **Ba câu `NEEDS_CONFIRMATION` của M03 đã đóng hết.** Tiếp theo là **M12 Nhập Excel**.
>
> Ghi chú lịch sử: bản trước ghi xong **Đợt M03-B** (module 6, đợt 2/3): **cảnh báo trùng nay che cả hai cửa vào** — luật "thế nào là trùng" chuyển lên `src/lib` dùng chung nên đường gõ tay và đường Excel **không thể lệch mức** (đóng CRITICAL F13 = 29/75, thấp nhất module) · `/students` có **tìm không dấu · lọc ngành/lớp/trạng thái · phân trang**, thay cho ~900 thẻ đổ vào một trang · **tạo hồ sơ và xếp lớp trong một giao dịch** (TB-F02/F09) · **D-63 nới quyền ghi hồ sơ cho Trưởng/Phó ngành** theo đúng ngành, kèm **D-124** cho họ đọc người giám hộ trong ngành. **1 migration, 2 thay đổi NỚI quyền, 0 siết quyền**, pgTAP `037` 38 bài JWT thật. Tiếp theo là **M03-C**.
>
> Ghi chú lịch sử (rút gọn — bản đầy đủ ở §2 của chính file này): **Đợt M03-A** (đợt 1/3): **"Tạm nghỉ" lần đầu tiên chạy được** sau khi chưa từng chạy được lần nào kể từ Phase 2 (TB-F10, lỗi CRITICAL F10 = 35/75) · thêm **"Khôi phục"** (BR-M03-21) · "Kết thúc" có **hộp xác nhận nêu tên em và tên lớp** · **sáu thao tác ghi im lặng** của module nay đều nói ra kết quả, và mọi `update`/`upsert` đều `.select()` nên **RLS chặn không còn báo thành công** (TB-F14) · **D-121** sĩ số tách hai số · **D-122** lý do "Chuyển lớp" nói thẳng nó không chuyển em đi đâu cả. **0 migration, 0 thay đổi phân quyền.** Tiếp theo là **M03-B**.

---

## 0. Tình hình chung

| | |
|---|--:|
| Đợt 0-UI · Mốc 0A | ✅ **6/6 việc** |
| Đợt 0-UI · Mốc 0B | ✅ **3/3 việc** — Đợt 0-UI **ĐÓNG**, mở đường cho module 1 (M14) |
| 14 module | ✅ **12/14 xong · 🔄 M11 MỞ 2026-08-11** (module 13/14, `NEEDS_IMPROVEMENT`, **52/75**, **0 CRITICAL**): **A xong 2026-08-11** — **D-66** tách quyền *xem/tải* khỏi quyền *chốt* (SIẾT — Cha sở · Cha phó · Thủ quỹ mất quyền chốt ở **cả ba** phạm vi, quyền đọc **không nhúc nhích**) · **D-169** ô "Lớp" của trang tổng quan đếm đúng phạm vi người xem · **TB-04/TB-05** ba lý do bảng trống ra ba câu khác nhau, ô chọn phạm vi chỉ liệt kê thứ xem được, tham số URL hỏng **thu hẹp và nói ra** thay vì âm thầm nới về `global`, nút "Chốt" **hỏi luật** thay vì chép lại · **nợ #18 ĐÓNG HẲN** (`report_snapshots` là bảng cuối cùng) · **nợ #14** trả cho `reports`, còn 1 module · **F06** bỏ guard chạy hai lần · **F09** bản chốt hình dạng lạ trả 422 thay vì 500. **1 migration · 0 `alter table` · 0 dòng dữ liệu bị đụng.** 🔴 Đợt này **thừa hưởng một phiên bỏ dở không ghi sổ** và một `src/types/database.ts` bị ghi đè thành một dòng báo lỗi — chi tiết ở đầu file. — **M10 ĐÓNG 2026-08-10** — module 12/14, `CRITICAL` (2) → **0**, điểm audit **61,6/75** (cao thứ nhì trong 2B, mà vẫn có hai luồng hỏng): **A 2026-08-09** — hạng mục 1 của `07` §1, thứ mà tài liệu gọi là *"chênh lệch chi phí/giá trị lớn nhất trong cả dự án"*: **hai dòng `.eq("profile_id", …)` gỡ trọn cả hai lỗi CRITICAL**, kèm AC-02-01/02 và **nợ #14**; bài quét mã nguồn viết cho đợt này tìm ra **chỗ thứ ba ngoài phạm vi audit**, ở `/dashboard`. **0 migration · 0 thay đổi phân quyền.** **B 2026-08-09** — **D-167** nhánh gửi đích danh (sửa ở **cấu trúc** truy vấn, không phải một điều kiện thêm vào) · **D-165** mã chống gửi đúp · `app.notification_audience` làm định nghĩa **dùng chung** cho đếm-trước và chốt-người-nhận (**BR-M10-24**) · **AC-06-01** hộp xem lại · bộ chọn "Một người" (chức năng đã đủ ở CSDL từ Phase 6 mà chưa từng có nút bấm). **1 migration · 0 thay đổi phân quyền · 0 policy bị sửa.** **C 2026-08-10 ⇒ ĐÓNG MODULE** — **D-166** thu hồi mềm và **D-168** hoà giải **hai tài liệu module nói ngược nhau** bằng một cờ nhân bản · mục "Tôi đã gửi" · lọc chưa đọc · phân trang thay `limit 50` cứng (dòng thứ 51 trở đi trước đây **biến mất hoàn toàn**). 🔴 Đợt C lặp lại **đúng BR-M10-20 trong chính lượt sửa nó**, ở bảng thứ hai — bài quét của đợt A không bắt được vì nó chỉ canh một bảng · **M14 ĐÓNG** · **M09 ĐÓNG** (A · B · C) · **M01 ĐÓNG** (A · B · C) · **M04 ĐÓNG** (A · B · C) · **M02 ĐÓNG** (A · B · C) · **M03 ĐÓNG** (A · B · C) · **M12 ĐÓNG** (A · B · C — A 2026-07-29 **gỡ cả ba lỗi CRITICAL**; B 2026-07-29 **dùng được ở quy mô thật**; C 2026-08-03 **tải file kết quả + báo ghi danh bị bỏ qua + hai cái trần**) · **M05 ĐÓNG 2026-08-03** (A **toàn bộ nhóm đúng đắn dữ liệu**, kèm nợ #14 · #18 · #19 · #20; B **màn hình ghi nhận đơn xin nghỉ + D-75 quyền cột + TB-11/D-141**; C **hộp xác nhận trước khi chốt + đồng hồ phiên chỉnh sửa + danh sách cho điện thoại**, D-142/D-143, **0 migration**). **M06 ĐÓNG 2026-08-05** — module 9/14, `PASS_WITH_MINOR_UI_FIX`, **nghiệp vụ GIỮ NGUYÊN**: **A 2026-08-04** (nhóm S độc lập + siết an toàn, 0 migration) · **B 2026-08-05** (D-144 siết · D-145 nới · nợ #18 · D-146 kiểm phiên bản, **1 migration**) · **C 2026-08-05** (biểu mẫu 12 trường vào hộp thoại dạng drawer + ba nhóm trường có bộ đếm + hai `ConfirmDialog` cuối của module, **0 migration**, D-148/D-149). **M07 ĐÓNG 2026-08-06** — module 10/14, `NEEDS_IMPROVEMENT`, 58/75, **0 CRITICAL**: **A xong 2026-08-05**: nhóm rủi ro rất thấp của `07` §7 (làm sạch **mọi** ô xuất bảng tính · **chỉ gửi ô đã đổi** · hệ số mặc định theo cấu hình năm học · chú thích trung bình ở cổng phụ huynh, **D-150**), kèm câu lỗi tiếng Việt cho `ZodError` ở 6 luồng, **SW-04**, **nợ #14**, **nợ #20 ĐÓNG HẲN**, phần "chờ cứng" của **nợ #10**. **0 migration · 0 thay đổi phân quyền.** **B xong 2026-08-05** — **đợt duy nhất có migration của module, và là migration duy nhất của 2B có đụng dữ liệu**: **D-74 + D-151** gom **ba tầng đang nói ba điều khác nhau** về quyền khóa bảng điểm về một cái tên `app.can_lock_gradebook` (SIẾT — ba vai trò cấp xứ đoàn mất quyền, Super Admin được thêm) · **AC-10-02** khóa lần hai không đẩy lùi mốc khóa · **TB-M07-01** xóa cứng cột chưa có điểm / ẩn mềm cột đã có điểm, và **ẩn có hiệu lực ở tầng cơ sở dữ liệu** · **BR-M07-31** cờ "chỉnh tay" chỉ bật khi khác đề xuất, kèm **D-153** dọn dấu đặt sai · **TB-M07-04** hai con số thay cho một số nói sai · **TB-M07-05/BR-M07-32** nhận xét mặc định nội bộ · **D-152** siết quyền sửa/xóa nhận xét · **nợ #18** cho cả bốn bảng, và module này chứa **cả hai ca** (policy ↔ RPC). Mở ra **nợ #21** ("ẩn cột" là cửa một chiều). **C xong 2026-08-06 ⇒ ĐÓNG MODULE** — **migration thứ hai của module** (đính chính câu "duy nhất" của đợt B), **0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng**: **D-154/BR-M07-29** tách "công bố" khỏi "khóa" **cả hai chiều**, ngoại lệ đặt ở **ba** chỗ mà chỗ thứ ba nằm ở **bảng khác** (trigger dòng của `assessment_scores`), policy **giữ nguyên** nên AC-02-02 vẫn đúng với lệnh gửi thẳng vào cơ sở dữ liệu · **D-155/BR-M07-34·35** Top 5 tính lại được **và** bản cũ xuống bảng lịch sử append-only (chủ dự án chọn phương án B, ngược khuyến nghị của tài liệu), kèm siết đường xóa về `published_at is null` · **nợ #1 ĐÓNG HẲN** (4 `window.confirm` cuối cùng của toàn hệ thống, `grep` ra **0**) · **nợ #21 ĐÓNG** (đường hiện lại cột đã ẩn). **M08 MỞ 2026-08-06** — module 11/14, `NEEDS_IMPROVEMENT`, 56/75, **1 `CRITICAL`**: **A xong 2026-08-06** — gói tối thiểu `07` §3 (hạng mục **1** bỏ N+1 + lọc/phân trang/bảng tiến độ, **9** gỡ phụ thuộc chéo sai), kèm **BR-M08-14** chỉ năm hiện hành · **BR-M08-X2** mặc định giữ nhánh A/B · 11 tên luật RPC có câu tiếng Việt riêng · **nợ #14** · **kiểm chéo bàn giao M07-B** (ẩn cột ⇒ đổi điểm trung bình, đo bằng pgTAP). **0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng**. **M08 ĐÓNG 2026-08-08** — module 11/14, `NEEDS_IMPROVEMENT`, 56/75, **1 `CRITICAL`**: **B xong 2026-08-07** — đợt duy nhất có migration của module: **D-156/D-161** cảnh báo bí tích lớp cuối ngành (cột cờ seed từ Phase 2 mà **chưa ai đọc lần nào**; cảnh báo **không** chặn, chỉ buộc nêu ý kiến) · **D-157** bảng nhật ký chỉ-ghi-thêm · **D-158/D-162** bịt đường vòng đóng ghi danh ở **cả hai tầng** · **nợ #18/D-160** hỏi **cả hai** năm học · **D-159** một nút "Chuyển lớp" cho cấp xứ đoàn, **0 thay đổi phân quyền**; quả mìn của đợt là **thứ tự lệnh**. **C xong 2026-08-08 ⇒ ĐÓNG MODULE** — ba nợ cuối, **1 migration là một CỬA SỔ HẸP · 0 thay đổi phân quyền · 0 `alter table` · 0 dòng dữ liệu bị đụng**: **AC-14** nút "Duyệt" lần đầu hỏi lại (nợ mang qua **cả hai** đợt trước, hoãn có chủ ý vì D-159 sẽ đổi nội dung câu hỏi) · **AC-15** từ chối bắt buộc nêu lý do, chặn ở **cả** màn hình lẫn Zod máy chủ, còn nút "Từ chối" **cố ý không** có hộp xác nhận vì nó lùi được · **AC-20/D-164** đề xuất hàng loạt, "Chọn tất cả" lấy **mọi em khớp bộ lọc kể cả trang sau** (chủ dự án chốt, biết trước cái giá; bù lại hộp xem lại liệt kê **đủ tên**) · **hạng mục 8/D-163** hiện tên người đề xuất/người duyệt bằng **cửa sổ hẹp** `list_promotion_actor_names`, vì đo được rằng `profiles` **không** cho Trưởng ngành và GLV đại diện đọc tên ai cả. ⚠️ Cái giá: trang chạm **đúng trần 6 lượt gọi** của AC-13 |
| **Migration do tái thiết kế giao diện** | **0** ✅ (đúng cam kết `11` §7 — Q-01 = một lớp đã loại bỏ nhu cầu migration cho theme) |
| **Migration do sửa nghiệp vụ đã duyệt** | **31** (M11-A một: **hai hàm quyền thay cho một** — `app.can_read_report` mới giữ nguyên **nguyên văn** luật cũ của `app.can_create_report`, còn `app.can_create_report` được `create or replace` cho hẹp lại (**D-66**); policy SELECT chuyển sang hàm rộng, policy INSERT giữ hàm hẹp **và** nhận thêm hàng rào năm học đã đóng (**nợ #18**, ca **policy** vì `authenticated` có `insert` mức bảng và không đường ghi nào đi qua RPC); `public.can_finalize_report` là **cửa sổ để giao diện HỎI luật thay vì chép lại nó** — `revoke … from public, anon`, chỉ trả `boolean` của **chính người gọi**, **0 quyền mới**; `create or replace view public.v_dashboard_summary` thêm mệnh đề phạm vi vào **đúng một CTE** (**D-169**) — danh sách cột không nhúc nhích nên **không** phải `drop … cascade` và **không** phải cấp lại `grant select`. **0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng · 0 policy nào ngoài hai policy của `report_snapshots`.** 🔴 Ba chỗ phải kiểm tay trước khi chạy vì `create or replace` **im lặng từ chối** nếu lệch: tên tham số của `can_create_report` phải khớp bản Phase 6, danh sách/thứ tự/kiểu cột của view phải khớp từng cột, và `default null` của `p_scope_id` là **bắt buộc** — thiếu nó thì bộ sinh kiểu khai tham số không nhận `null` và tầng giao diện không gọi được hàm; M10 hai — và **module CRITICAL duy nhất của 2B mà đợt gỡ lỗi CRITICAL không cần migration nào**: M10-B một (`app.notification_audience` gom mệnh đề *"ai nằm trong phạm vi"* về **một** định nghĩa cho cả đếm-trước lẫn chốt-người-nhận, **BR-M10-24** · nhánh `user` tách thành một nhánh `union` **không đi qua phép nối `role_assignments`**, vì phép nối nằm ở `from` nên nó loại người ta ra **trước khi** `case` được chạy — **D-167** · `public.count_notification_audience` kiểm `app.can_publish_notification` **trước khi đếm**, không thì hàm definer này thành công cụ đếm người của phạm vi mình không được gửi · cột `request_id` + **unique một phần** `where request_id is not null` nên **0 dòng dữ liệu cũ vướng ràng buộc mới, 0 backfill** — **D-165** · `publish_notification` drop+create vì chữ ký đổi, **có cấp lại `grant execute`**. **0 policy bị sửa · 0 quyền mới**); M10-C một (**D-166/D-168** thu hồi mềm: 3 cột + `notifications_retraction_shape` · cờ **nhân bản** `notification_recipients.notification_retracted_at` giữ bằng **trigger** chứ không phải lệnh thứ hai trong RPC · `public.retract_notification` chép lại phép kiểm quyền **trong thân hàm** vì definer bỏ qua hàng rào đọc — bài học D-160/D-163 · **1 policy bị sửa**, `notifications_select_recipient` thêm vế `retracted_at is null` **chỉ ở nhánh người nhận**, giữ nguyên hai nhánh tác giả và quyền-đọc-toàn-cục để mục "Tôi đã gửi" và nhật ký thu hồi còn đọc được. **0 `alter table` trên bảng cũ ngoài 4 cột nullable · 0 backfill · 0 dòng dữ liệu bị đụng · 0 quyền ghi mới cho `authenticated`**); M08-C một: **cửa sổ hẹp `public.list_promotion_actor_names`** — hạng mục 8 của `07`, **D-163**. 🔴 Không phải một lần nới quyền: hàm `security definer` chép **nguyên vị từ** của `promotion_reviews_select_scope` (definer bỏ qua RLS nên phải chép lại — bài học D-160) và chỉ trả về **id → tên hiển thị** của người **đã ra quyết định** trên một đề xuất người gọi đọc được. **0 policy bị sửa · 0 `alter table` · 0 dòng dữ liệu bị đụng**; `revoke … from public, anon` giữ đúng hàng rào của hai RPC ghi. Lý do không nới `profiles`: RLS lọc theo **dòng chứ không theo cột**, thêm một nhánh là mở luôn `username`/`phone`/`email`/`account_status`/`last_login_at` của **mọi** tài khoản cho mọi Giáo lý viên. pgTAP `047` **18 bài JWT thật của 8 vai trò**, trong đó bài quan trọng nhất là bài **canh hiện trạng**: sau migration, GLV đại diện đọc thẳng `public.profiles` vẫn chỉ thấy **đúng một hàng của chính mình**; M07-C một (M07-C một: **hai hạng mục cuối của module bảng điểm, và chúng KHÔNG đụng nhau** — ⓵ **D-154/BR-M07-29** *"khóa"* nay có **đúng một ngoại lệ là cờ công bố**: RPC mới `public.set_assessment_published` (đường công bố duy nhất, chép lại **cả ba** hàng rào vào trong hàm vì definer bỏ qua RLS) · `app.validate_assessment` bỏ kiểm khóa khi lượt UPDATE **chỉ** đổi `is_published`, phép thử so **cả bản ghi** bằng `to_jsonb` chứ không liệt kê tay từng cột (liệt kê tay thì cột thêm về sau lọt qua ngoại lệ **trong im lặng**) · 🔴 `app.sync_assessment_score_keys` — quả mìn nằm ở **bảng khác**, trigger dòng của `assessment_scores` cũng ném `GRADEBOOK_LOCKED` khi trigger đồng bộ cờ chạy; nới an toàn được vì hàm **tự suy lại** `assessment_published` từ chính cột điểm và `authenticated` chỉ có `select` trên bảng ấy. **Policy `assessments_update_grader` KHÔNG đổi một chữ** — đó là điều phương án A đòi; ⓶ **D-155/BR-M07-34·35** bảng mới `public.leaderboard_snapshots` (append-only bằng trigger như `account_audit_events`, chỉ nhân sự phạm vi lớp `select`, **không nhánh phụ huynh**) + `publish_leaderboard` lưu bản đang có **trước** khi xóa, trong **cùng giao dịch** + `app.validate_leaderboard` thêm lưới an toàn `LEADERBOARD_NOT_SNAPSHOTTED` + policy `leaderboards_delete_manager` đổi phép thử sang `published_at is null`. 🔴 **Bảng riêng chứ KHÔNG thêm cột vào `leaderboard_entries`**: bảng ấy là **đúng cái cổng phụ huynh đọc**, chứa nhiều bản trong đó thì phải nới hai `unique` **và** dạy policy chọn bản nào — thứ `07` §4 cấm tuyệt đối. **Không `alter table` trên bảng cũ, không backfill, không đụng một dòng dữ liệu nào**; M07-B một — **migration DUY NHẤT của 2B có đụng dữ liệu**: `app.can_lock_gradebook` mới gom **ba tầng đang lệch nhau** về một cái tên (**D-74 + D-151**, SIẾT — Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký mất quyền khóa, Super Admin được thêm làm đường thoát) · `lock_gradebook` viết lại cho **idempotent thật** (AC-10-02: khóa lần hai không đẩy lùi `locked_at`) · **RPC mới `delete_assessment`** xóa cứng cột chưa có điểm thật và dọn dòng rỗng, cột đã có điểm ném `ASSESSMENT_HAS_SCORES`, cột đang là nguồn Top 5 ném `ASSESSMENT_IS_LEADERBOARD_SOURCE` (BR-M07-26/27) · `assessments_select_scope` thêm `and is_active` ở **nhánh phụ huynh** + `sync_assessment_publication` chạy thêm trên `is_active` + cùng luật vào `sync_assessment_score_keys` ⇒ **"ẩn cột" có hiệu lực ở tầng cơ sở dữ liệu** (BR-M07-28/AC-01-03) · `save_assessment_scores` đổi luật cờ "chỉnh tay" sang `is distinct from` đề xuất (**BR-M07-31**) · `refresh_attendance_assessment_scores` **drop + create** để trả `(out_refreshed, out_skipped_manual)` (TB-M07-04) · `app.can_moderate_student_comment` mới vào **cả hai** policy `update`/`delete` của `student_comments` (**D-152**, SIẾT) · **hàng rào năm học đã đóng cho cả bốn bảng** — policy cho `assessments`/`student_comments`/`leaderboards`, **trong RPC** cho `assessment_scores` (nợ #18) · **`update` gỡ cờ "chỉnh tay" đặt sai** (**D-153**). **Không `alter table`, không backfill cấu trúc, chữ ký hàm chỉ đổi ở đúng một hàm**; 🔴 `assessment_scores` là ca **ngược** với ba bảng kia trong **cùng một module** — `authenticated` chỉ có `select` nên policy đứng ngoài mọi đường ghi; M06-B một: **ba thay đổi phân quyền của module giáo án trong một file** — `create or replace app.can_manage_teaching_plan` bỏ `app.can_global_write()`, giữ `app.is_super_admin() or app.is_class_representative()` (**D-144**, SIẾT); hai policy select thêm `or app.is_class_staff(...)` cộng một nhánh tương ứng trong `app.can_read_teaching_material` (**D-145**, NỚI, tệp đính kèm đi theo giáo án); **hàng rào năm học đã đóng vào cả sáu policy ghi** của `teaching_plans`/`teaching_plan_items` (nợ #18 — bảng này ghi thẳng qua policy nên đúng khuôn M02-C, **ngược hẳn** ba bảng điểm danh của M05-A). **Không `alter table`, không backfill, chữ ký hàm không đổi**; 🔴 `teaching_plan_items` **không có cột năm học** nên hàng rào nằm TRONG `exists (…)` đã có, không phải một điều kiện thứ hai đặt cạnh. **D-146 không sinh migration** — dùng `updated_at` đã có trigger từ Phase 4; M05-B một: **quyền cột cho `student_attendance_records.note` (D-75)** — `revoke select` mức bảng rồi `grant select` **từng cột trừ `note`**, cộng cửa sổ hẹp `public.attendance_session_notes()` mang đúng ba nhánh nhân sự của policy; **`create or replace app.validate_absence_request` chặn đơn cho buổi đã chốt** (TB-11/D-141, chỉ áp INSERT) và **hàng rào năm học đã đóng vào hai policy của `absence_requests`** (nợ #18 — bảng này ghi thẳng qua policy nên đúng khuôn M02-C, ngược hẳn ba bảng điểm danh ở đợt A). **Không `alter table`, không backfill**; 🔴 thứ tự `revoke` mức bảng **trước** `grant` mức cột là bắt buộc — Postgres bỏ qua giới hạn mức cột chừng nào quyền mức bảng còn đó; M05-A một: **bốn hàm điểm danh viết lại bằng `create or replace`** — `app.attendance_roster_enrollments` mới làm **định nghĩa dùng chung** cho seed roster và phép đếm khi chốt (D-140/nợ #19) · `sync_student_attendance_keys` chỉ áp luật "ghi danh còn mở" cho **INSERT** (TB-07) · ba nhánh lỗi phiên chỉnh sửa trong `heartbeat`/`save_and_finalize` (TB-04) · **hàng rào năm học đã đóng đặt TRONG bốn RPC**, không đặt được vào policy vì definer bỏ qua RLS (nợ #18, D-117 miễn cho Super Admin). **Không `alter table`, không backfill, chữ ký hàm không đổi**; M12-C một: **`commit_import_rows` trả thêm `out_enrollment_created`** — `drop function` + `create` + **cấp lại `grant execute`**, không đổi bảng/cột/policy nào (TO-BE 6/AC-24/D-11); M12-A một: **hàng rào xoá lần nhập Excel** — policy `delete` thu về đúng lần nhập chưa ghi ở **cả hai bảng**, `with check` chặn hạ lần nhập đã ghi xuống `cancelled`, cộng **bốn cột nullable** giữ vết huỷ/xoá dữ liệu thô (D-131/D-132); M03-C một: **nới quyền ghi sức khoẻ/bí tích theo phạm vi (D-127)** · **quyền xoá bí tích cho cấp xứ đoàn (D-128)** · **RPC `set_student_status` — đổi hai trục trạng thái trong một giao dịch (TB-F06/D-130)** · **ba trigger lưới an toàn** (BR-M03-N12 · N13 · N17) · **cửa sổ hẹp `list_students_for_fees` cho Thủ quỹ (D-67/D-129)**; M03-B một: **`app.fold_vietnamese()` + cột `students.search_name` (D-126)** · **nới ghi hồ sơ cho vai trò ngành + RPC `create_student_with_enrollment` (D-63/D-123)** · **nới đọc người giám hộ + cửa sổ hẹp `list_guardian_options` (D-124)** · **khung nhìn `student_directory` cho danh sách (TB-F03)**; M02-C ba: **cột `closed_at`/`closed_by`/`close_reason` + RPC `close_academic_year`/`archive_academic_year`/`academic_year_close_checklist`** · **`app.writable_academic_year_ids()` + hàng rào ghi vào policy `enrollments`/`classes`, D-117/D-118** · **`app.own_student_academic_year_ids()` + siết quyền đọc lớp/năm học của phụ huynh–thiếu nhi, D-70**; M02-B một: **cột `academic_years.semester_1_end_date` — mốc kết thúc học kỳ 1, D-71**, nullable + CHECK nằm hẳn trong năm học; M02-A ba: **danh mục tham chiếu vào migration** · **`generate_default_classes` trả `{inserted, expected}` + ném lỗi khi thiếu danh mục** · **quyền năm học về Super Admin, D-112**; M09-A: khoá tổng kho · chặn bản tuần trắng · một Trưởng ban · M09-B: vòng đời kho · M09-C: **D-100 nới quyền đọc hồ sơ cùng Ban** · **ends_on do DB đặt** · M01-A: **`account_audit_events` — nhật ký thao tác tài khoản, D-65** · M01-B: **RPC `assign_primary_role` — đổi vai trò nguyên tử, super-admin-only, trần vai trò** · M01-C: **FK `role_assignments` set null — xóa tài khoản giữ lịch sử vai trò, D-101** · M04-A: **RPC `transfer_class_staff` — chuyển lớp nguyên tử, phạm vi theo ngành, D-105** · M04-B: **RPC `delete_unused_staff_profile` + `staff_profile_delete_blockers` — xóa hồ sơ chưa từng dùng, D-106/D-109**). Đây **không** phải vi phạm `11` §7: cam kết "0 migration" nói về *theme* |
| Kiểm thử đo được | **Đo lại toàn bộ ở M11-A (2026-08-11), trên DB vừa `db:reset`:** unit **1469 pass / 16 skip** (trước 1448/16, **+21** — bộ mới cho bộ lọc báo cáo) · pgTAP **1324/1324** trên **50 file** (trước 1286/1286 trên 49, **+38** = đúng `plan(38)` của `050`) · lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang**. ⚠️ **M11-A KHÔNG chạy E2E** — đúng tiền lệ đợt A của M10/M08 (`AGENTS` §9 đòi E2E khi đổi workflow chính; đợt này đổi cơ sở dữ liệu + phân quyền, phần giao diện thuộc đợt C) và vì `07` §5 ghi **N-6: chưa từng có e2e nào cho `/reports` và `/dashboard`** — dựng bộ ấy là việc của đợt sau, không phải chạy lại bộ cũ. Con số E2E dưới đây **là của M10-C, chưa đo lại**: unit **1448 pass / 16 skip** · pgTAP **1286/1286** · lint **0 warning** · typecheck ✓ · build **28/28 trang** · **E2E toàn bộ 494/507** trên DB vừa `db:reset` + `seed:dev`, **27,3 phút** (13 đỏ, **2,56 %** — **TĂNG** so với 1,85 % của M08-C; mẫu số cũng đổi 486 → 507 vì đợt này thêm **7 bài × 3 viewport**, và **cả 21 bài mới đều xanh, 0 skip**). 🔴 **Không bài đỏ nào thuộc luồng thông báo, và không bài nào nhắc tới chuông/hộp thư** — `grep` toàn bộ nhật ký lỗi ra **0** kết quả cho *notification · thông báo · chuông · hộp thư · thu hồi*. `notifications.spec.ts` **21/21 xanh cả ba viewport**; `committees.spec.ts` — bài thông báo **cũ**, và là bài đã phải sửa vì M10 **cố ý đổi hành vi** (hộp xem lại + câu báo có số người) — cũng **xanh cả ba viewport**. Phân loại 13 bài đỏ: **4 bài** mang đúng câu *"bấm nhiều lần vẫn không có hiệu lực"* ⇒ **nợ #15**; **9 bài** rớt ở `toBeVisible` hết giờ ⇒ hình dạng **nợ #10**. ⚠️ **Giới hạn đã biết của lần phân loại này, ghi ra chứ không giấu:** M08-C phân loại **bằng ảnh chụp lỗi**; ở đây 9 bài kia chỉ được phân loại **bằng hình dạng câu lỗi**, vì lượt chạy cô lập để kiểm chứng đã **ghi đè mất** thư mục `test-results/` của lượt đầy đủ. Hai ảnh còn đọc được đều mang đúng chữ ký nợ #10 (nút *"Đang …"* còn vô hiệu). ✅ **Và lượt cô lập ấy chính là bằng chứng phủ định cho giả thuyết "M10 làm hỏng":** `staff-directory` · `students-directory` · `enrollment-lifecycle` chạy **riêng, trên DB vừa reset + seed, tải nhẹ** vẫn đỏ — nhưng **ở viewport KHÁC** lượt đầy đủ (`staff-directory:124` đỏ cả ba viewport ở lượt đầy đủ, chỉ đỏ `laptop-1366` khi chạy riêng). Phân bố đổi giữa hai lượt là chữ ký của **nhiễu**, không phải của một thay đổi hành vi — thứ sẽ đỏ **cố định** ở mọi viewport, đúng như M08-C đã dặn. Cả ba spec ấy thuộc **M03 · M04**, hai module M10 không đụng tới một dòng nào. ⚠️ pgTAP phải chạy **trước** `seed:dev` — xem ghi chú ở cuối đợt M05-B |

---

## 1. Đợt 0-UI — Nền tảng (chặn mọi module)

**Ước lượng `11` §2: 12–18 ngày.** Chi phí một lần, không nhân theo module.

### Mốc 0A — ✅ XONG (2026-07-23)

| # | Việc | Cỡ | Trạng thái | Kết quả thật |
|---|---|:--:|:--:|---|
| 0.1 | Tải **Be Vietnam Pro** qua `next/font/google` | S | ✅ | 3 weight 400/500/600, subset `vietnamese`+`latin`; build sinh **9 file woff2** |
| 0.2 | Viết lại bộ token (màu · typography · spacing · radius · shadow · z-index · motion) | M | ✅ | `globals.css` + `tailwind.config.ts`; giữ **bí danh token cũ** nên 172 file hiện có không phải đổi tên |
| 0.3 | `sector-palette.ts` + **5 unit test canh màu** | S | ✅ | **35 test xanh** — đọc thẳng `seed.sql`, canh cả 2 điều CẤM ở `09` §4.3 |
| 0.4 | `resolveThemeContext()` + `ThemeScope` + **30 unit test** | L | ✅ | **46 test xanh** — U-01..U-25 + U-26..U-30 + các bước R3 còn lại |
| 0.5 | Sửa **7 component** hiện có sang token mới | M | ✅ | `Button` · `Input` · `Label` · `FormMessage` · `Badge` · `Card` · `LoadingState`→`Skeleton` |
| 0.6 | **8 component ưu tiên** | L | ✅ | `Select` · `Dialog` · `ConfirmDialog` · `Skeleton` · `Alert` · `Textarea` · `BranchChip` · `EmptyState` |
| — | Lint rule chặn cỡ chữ <12px và `window.confirm` | S | ✅ | Bắt được **7 chỗ `window.confirm`** đúng như audit dự đoán |

**Ba lỗi nghiêm trọng đã đóng ở 0A:**

| Lỗi | Trước | Sau |
|---|---|---|
| Font khai tên nhưng **không tải** | rơi về Inter/system-ui | `next/font/google`, 9 woff2 |
| Viền ô nhập **1,2:1** (trượt WCAG 1.4.11) | `--border` | `--border-strong` **3,77:1** |
| 5 cặp màu trượt AA | 2,28–3,73:1 | **16/16 cặp đạt AA** |

### Mốc 0B — ✅ XONG (2026-07-23)

| # | Việc | Cỡ | Trạng thái | Kết quả thật |
|---|---|:--:|:--:|---|
| 0.7 | Sửa a11y vỏ: drawer thành **dialog thật** · **skip link** · thứ bậc heading · breadcrumb | M | ✅ | **20 test mới** (14 a11y vỏ + 6 breadcrumb); `Breadcrumb` của 0.8 làm luôn ở đây vì vỏ cần |
| 0.8 | **Còn lại 13 tên**: `SearchInput` · `Pagination` · `FilterBar` · `DataTable` · `Tabs` · `Dropdown` · `Toast` · `Tooltip` · `Avatar` · `Progress` · `FileUpload` · `SegmentedControl` · `Chart` | L | ✅ | **80 test mới** (45 + 31 + 4). 8/13 component **không cần JS**. Bắt được 3 lỗi thật — xem dưới |
| 0.9 | **6 component theme**: `ContextIndicator` · `ChildSwitcher` · `AcademicYearSwitcher` (viết lại) · `UnassignedBanner` · `ArchivedYearBanner` · `ThemePreviewTable` (Q-12) | M | ✅ | **33 test mới** (387 pass / 9 skip, trước 0.9: 354/9). `AcademicYearSwitcher` là component ĐẦU TIÊN của 2B chạy trong trang thật. E2E **còn nợ** — xem dưới |

> `BranchContextSwitcher` ⏸️ **cố ý không xây** (Q-01 = một lớp). Kiểu dữ liệu
> `availableThemeContexts` vẫn giữ dạng mảng để mở đường sau này — đã cài đúng vậy ở 0.4.
>
> Ghi chú đối chiếu: `11` §2 gọi mục 0.8 là *"13 component còn lại"* nhưng liệt kê **14 tên**.
> `Breadcrumb` là tên thứ 14 và đã làm ở 0.7 (vỏ cần nó mới sửa được a11y header), nên 0.8
> còn đúng 13 tên. **Không sửa `11`** — chỉ ghi lại ở đây.

#### Chi tiết mục 0.7 — bốn lỗi a11y của vỏ đã đóng

| Lỗi | Trước | Sau |
|---|---|---|
| Drawer mobile **không phải dialog** (M14 D3.a) | thiếu cả 5 yêu cầu; lớp phủ là `<button>` phủ kín màn hình nên trình đọc màn hình gặp "một cái nút khổng lồ" | `NavDrawer` có `role="dialog"` + `aria-modal`, focus vào nút Đóng, bẫy focus 2 chiều, `Escape` đóng và **trả focus**, khoá cuộn body, lớp phủ là `div aria-hidden` |
| **Không có skip link** (D3.b) | người dùng bàn phím `Tab` qua tối đa 15 mục sidebar mới tới nội dung | link đầu tiên của vỏ, hiện khi focus, nhảy tới `<main id="main-content" tabindex="-1">` |
| **Hai tiêu đề trùng nguyên văn** (D3.c) | `AppHeader` `<h1>` và `PageHeader` `<h2>` cùng một chuỗi chữ | `AppHeader` hạ xuống `<p>`; `<h1>` **duy nhất** thuộc `PageHeader`, nằm trong `<main>` |
| **Không có breadcrumb thật** (`05` §3.2) | chuỗi tĩnh `"Hệ thống / <tên trang>"`, lại còn `hidden sm:block` nên mobile không thấy | `Breadcrumb` + `buildBreadcrumbTrail()` tối đa 3 cấp, hiện ở **mọi** cỡ màn hình |

**Ba quyết định cài đặt cần nhớ:**

1. **`useModalBehavior` là hook dùng chung** của `Dialog` (0.6) và `NavDrawer` (0.7).
   Drawer không chép lại luật bẫy focus — sửa một lần là cả hai cùng đúng.
   Trong đó có nhánh dự phòng cho `offsetParent`: jsdom không dựng bố cục nên
   `offsetParent` **luôn** null, thiếu nhánh này thì mọi test bàn phím xanh giả.
2. **`PageContainer` không còn là `<main>`.** Mốc `main` duy nhất do `AppShell` giữ,
   vì skip link cần một đích cố định và hai `main` lồng nhau làm sai cấu trúc trang.
3. **Breadcrumb không bao giờ in id bản ghi.** Mọi route chi tiết đều là UUID; in ra
   vừa vô nghĩa vừa rải khoá hồ sơ thiếu nhi lên header của máy dùng chung. Cấp ba
   dùng nhãn loại (*"Hồ sơ thiếu nhi"*, *"Chi tiết lớp"*…), tên riêng nằm ở `<h1>` ngay dưới.
   👉 **Việc để lại cho M14:** thay nhãn loại bằng **tên thật của bản ghi** khi vỏ được
   redesign — lúc đó trang mới có đường truyền dữ liệu lên header.

**Lỗi ngoài dự kiến phát hiện khi kiểm CSS xuất ra:** header dính trên cùng **không có
nền**. `bg-background/95` (nay là `bg-page/95`) **không sinh ra lớp CSS nào** vì token màu
là `var()` trần, Tailwind không gắn được bổ ngữ độ mờ. Đã đổi sang nền đặc `bg-page` và bỏ
`backdrop-blur` (sau nền đặc nó không làm gì). Cùng lỗi này còn ở 18 chỗ khác — xem nợ #5.

**Nghiệm thu 15 mục (`11` §5) cho mục 0.7:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ typecheck ✓ · lint ✓ **0 warning** · **274 pass / 9 skip** · build ✓ |
| E2E responsive 3 viewport, không tràn ngang | ✅ **ĐÃ ĐÓNG ở 0.8** — 90/90 xanh. ~~"Supabase local không bật (`127.0.0.1:54321` không phản hồi)"~~ là **kết luận sai**: `config.toml` đặt API ở cổng **54421** và stack local vẫn chạy suốt. Nguyên nhân thật nằm ở env, xem mục 0.8 |
| Vùng chạm ≥44px | ✅ link breadcrumb `min-h-11 min-w-11`, kèm margin âm để ô bấm 44px không đẩy header cao thêm. **Đã đo bằng E2E ở 0.8** (`responsive.spec.ts` quét `header a[href]`) |
| Không cỡ chữ <12px | ✅ breadcrumb dùng `text-2xs` = 12px, đúng sàn cứng |
| Không màu hardcode khi có token | ✅ |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào (7 nợ cũ giữ nguyên, xem nợ #1) |
| Không `<select>` native mới | ✅ không thêm |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | — không áp dụng: 0.7 không có thao tác ghi |
| Trạng thái rỗng đúng 1 trong 3 loại | — không áp dụng |
| Thao tác nguy hiểm có `ConfirmDialog` | — không áp dụng |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ có test canh cả ba (bẫy focus 2 chiều, `Escape` đóng **và trả focus**) |
| Không dùng màu làm tín hiệu duy nhất | ✅ breadcrumb phân cấp bằng mũi tên + chữ, không dùng màu |
| Siết quyền ⇒ RLS negative bằng JWT thật | — không áp dụng: **0 thay đổi phân quyền, 0 migration** |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md`. `00_SYSTEM_AUDIT_BOARD.md` **không đổi** — nó là biên bản audit Giai đoạn 1 theo module, 0.7 không đóng luồng M14 nào |

> **Mục E2E còn treo của 0.7 nay đã đóng** — xem "Vì sao 0.7 không chạy được E2E" ở mục 0.8.
> Kết quả thật: **90/90 xanh** trên ba viewport 360 · 768 · 1366, trong đó `responsive.spec.ts`
> 3/3 (nó quét mọi `header a[href]` theo ngưỡng 44px, tức là đã **đo thật** vùng chạm của
> link breadcrumb mới, không còn là "đã cài, chưa đo").

#### Chi tiết mục 0.8 — mười ba component

| Nhóm | Component | Ghi chú cài đặt |
|---|---|---|
| Không cần JS (8) | `SearchInput` · `Pagination` · `FilterBar` · `DataTable` · `Avatar` · `Progress` · `SegmentedControl` · `Chart` | Không có `"use client"`. Lọc và tìm kiếm là `<form method="get">`; phân trang là `<Link>` thật nên chép được địa chỉ trang 3 |
| Cần JS (5) | `Tabs` · `Dropdown` · `Toast` · `Tooltip` · `FileUpload` | Mất JS thì `Dropdown` và `FileUpload` vẫn dùng được, chỉ mất phần tiện |

**Bốn quyết định cài đặt cần nhớ:**

1. **`SegmentedControl` là nhóm `<input type="radio">` native, không phải dãy nút.**
   Roster điểm danh có tới 100 control trên một trang (50 em × 2 trạng thái) và gửi bằng
   `<form action={serverAction}>` không cần JS (`09` §11). Nút bấm không gửi được giá trị khi
   JS chưa tải, lại còn bắt React giữ 100 state trên máy phòng học.
2. **`Dropdown` dựng trên `<details>`/`<summary>`.** `05` §3.2 yêu cầu nâng `UserMenu` lên
   `Dropdown` **mà vẫn chạy được không cần JS** — trong menu đó có nút **Đăng xuất**. JS chỉ
   vá thêm `Escape`, bấm-ra-ngoài và phím mũi tên. Hai chỗ lệch có chủ ý so với mẫu ARIA menu:
   mục **vẫn nhận `Tab`** (roving tabindex cần JS mới đặt được), và **không tự đặt
   `aria-expanded`** (HTML-AAM đã lấy trạng thái từ `details.open`; tự đặt theo state React là
   gài sẵn một lời nói dối cho lúc JS chưa tải).
3. **`Toast` có hai vùng phát riêng** — `role="status"` cho thành công, `role="alert"` cho lỗi —
   và cả hai **nằm sẵn trong DOM khi chưa có thông báo nào**. Vùng `aria-live` sinh ra cùng lúc
   với nội dung thì phần lớn trình đọc màn hình bỏ qua lần đầu.
4. **`Progress` và `Pagination` KHÔNG dùng `--theme-primary` làm nền.** Thanh tiến độ không nằm
   trong 12 nơi được phép (`09` §4.4) nên dùng màu trung tính; ô số trang hiện tại dùng
   `tint` + `accent-text` + viền + `aria-current`, tức nơi số 7 "hàng/thẻ đang được chọn".

**Ba lỗi thật bắt được, không phải lỗi tự nghĩ ra:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | `initialsFromName` **rụng dấu** với tên mã hoá Unicode phân rã (`"A"+U+0300` thay vì `"À"`) — avatar của "Àn" hiện thành "A", tức hiện **sai tên người**. Dạng phân rã vào hệ thống qua tệp Excel xuất từ máy Mac | unit test của chính 0.8 | `normalize("NFC")` trước khi cắt |
| 2 | 🔴 **Hai dải lỗi rỗng thường trực trên trang đăng nhập.** Bốn chỗ gọi ở hai màn hình auth bọc câu lỗi trong `<span id>` cho `aria-describedby`, khiến `children` luôn truthy nên nhánh `if (!children) return null` của `FormMessage` không bao giờ chạy. Trước 2B nó vô hình; **từ khi mục 0.5 thêm icon thì thành hai tam giác cảnh báo đỏ**, và trình đọc màn hình đọc "Lỗi:" hai lần ngay khi vừa tải trang | chạy E2E của 0.8 | `FormMessage` nhận thêm prop `id`, chỗ gọi truyền thẳng câu lỗi. Hàng rào: `tests/unit/form-message.test.tsx` |
| 3 | 🔴🔴 **`npm run test:e2e` chạy app trỏ vào Supabase PRODUCTION** | điều tra vì sao 90/90 đỏ | xem ngay dưới |

**Vì sao 0.7 không chạy được E2E — và vì sao đó là một lỗi nghiêm trọng, không phải phiền toái**

Ghi chú của 0.7 nói "Supabase local không bật (`127.0.0.1:54321` không phản hồi)". **Sai cổng:**
`supabase/config.toml` đặt API ở **54421**, và stack local vẫn đang chạy suốt. Bật E2E lên thì lộ
ra nguyên nhân thật:

- `next build`/`next start` chạy ở `NODE_ENV=production`, mà thứ tự nạp env của Next là
  **`.env.production.local` TRƯỚC `.env.local`**.
- Phase 7 tạo `.env.production.local` để chạy `seed:prod`. Kể từ đó, **mọi lượt E2E local dựng
  app trỏ vào dự án Supabase thật**, trong khi Playwright vẫn dựng dữ liệu ở Supabase local.
- Hậu quả đo được: **90/90 đỏ** vì không tài khoản nào đăng nhập được, và mỗi lượt chạy bắn
  hàng trăm lần thử mật khẩu sai vào dự án thật. Không ai thấy vì E2E chưa chạy lại từ Phase 7.
- `NEXT_PUBLIC_*` **bị nhúng cứng lúc build**, nên đặt biến môi trường lúc `start` là quá muộn —
  đã đo: vẫn trỏ production.

`scripts/run-e2e.mjs` nay có ba lớp chặn: `assertLocalSupabase()` dừng ngay nếu URL không phải
máy này; `assertPortFree()` dừng nếu cổng đã bị chiếm (một server cũ còn sót cũng trả 200 cho
`/login`, khiến bộ test âm thầm kiểm **bản build của lần trước** — đã mất một giờ vì đúng cái bẫy
này); và runner **tự `next build`** với env local đã nạp sẵn vào `process.env`.

**Nghiệm thu 15 mục (`11` §5) cho mục 0.8:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · **354 pass / 9 skip** (trước 0.8: 274/9) · build ✓ 27/27 trang |
| E2E responsive 3 viewport, không tràn ngang | ✅ **90/90 xanh** trên 360 · 768 · 1366 (6,3 phút, 1 worker) |
| Vùng chạm ≥44px | ✅ có test canh `min-h-11`/`min-w-11` ở `Pagination` · `SegmentedControl` · `Tooltip` · nút đóng `Toast` · mục `Dropdown` · nút "Chọn tệp" của `FileUpload` (qua `file:min-h-11`) |
| Không cỡ chữ <12px | ✅ bậc nhỏ nhất dùng là `text-2xs` = 12px; lint rule vẫn canh |
| Không màu hardcode khi có token | ✅ grep 13 file mới: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào (7 nợ cũ giữ nguyên, xem nợ #1) |
| Không `<select>` native mới | ✅ `SegmentedControl` dùng radio; `Select` của 0.6 vẫn là thẻ native duy nhất |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | — 0.8 không có thao tác ghi. `Toast` chính là cơ chế cho biểu mẫu dài, module sẽ dùng |
| Trạng thái rỗng đúng 1 trong 3 loại | — `DataTable` nhận prop `empty` và **không tự bịa câu chữ**; loại nào là việc của trang (`09` §9) |
| Thao tác nguy hiểm có `ConfirmDialog` | — không áp dụng |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ có test cho `Tabs` (roving tabindex, mũi tên, Home/End), `Dropdown` (`Escape` đóng **và trả focus**; bấm ra ngoài đóng mà **không** kéo focus về), `Tooltip` (`Escape`, focus/blur) |
| Không dùng màu làm tín hiệu duy nhất | ✅ `SegmentedControl` có dấu ✓ · `Progress` in con số · `Chart` kèm **bảng số liệu `sr-only`** · `DataTable` có `aria-selected` · `Pagination` có `aria-current` · `Toast` có icon riêng từng tone |
| Siết quyền ⇒ RLS negative bằng JWT thật | — không áp dụng: **0 thay đổi phân quyền, 0 migration** |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md`. `00_SYSTEM_AUDIT_BOARD.md` **không đổi** — 0.8 không đóng luồng module nào |

#### Chi tiết mục 0.9 — sáu component theme

| Component | Cài đặt | Nơi sẽ dùng |
|---|---|---|
| `ContextIndicator` | Chữ thuần, **không màu**. Hai kiểu: `viewing` ("Đang xem: Ngành Ấu Nhi · Năm học 2026-2027") và `filtering` (Q-11, `/reports`) | M14 (đầu sidebar) · M11 (`/reports` đã lọc) |
| `ChildSwitcher` | `<form>` + nút `submit` thật, chạy **không cần JS**. Ẩn hoàn toàn khi < 2 con (D-64) | M13 |
| `AcademicYearSwitcher` | **Viết lại**, đã gắn vào thanh đầu trang | M14 hoàn thiện tiếp |
| `UnassignedBanner` | Bốn câu nguyên văn `12` §4.6 + câu bước 0 của R3 | M14 · M13 |
| `ArchivedYearBanner` | Nhãn năm do trang truyền vào | M11 · M13 |
| `ThemePreviewTable` | Bảng + hàm thuần `buildThemePreview` (đếm, phân loại, sắp xếp tất định) | M02 khi xây luồng đóng/mở năm học (M02-F09) |

**Bốn quyết định cài đặt cần nhớ:**

1. **`AcademicYearSwitcher` mặc định là NHÃN TĨNH, không phải bộ chọn.** Hệ thống chưa có
   luồng xem dữ liệu năm cũ (M02-F09 chưa xây), nên một bộ chọn năm sẽ dẫn tới trang không
   tồn tại. Component nhận `others` kèm `href`; **chỉ năm có `href` mới hiện ra**, và khi
   không có năm nào như vậy thì nó là một dòng chữ. Xây sẵn đường, không xây sẵn lời hứa.
2. **Luật kiểm UUID của cookie chọn con nay nằm ở MỘT chỗ** (`src/lib/theme/child-selection.ts`).
   `decideThemeContext` (0.4) và `ChildSwitcher` cùng gọi `isUuid`. Hai bản sao lệch nhau
   nghĩa là bộ chọn ghi được một giá trị mà resolver vứt đi — phụ huynh bấm chọn con, trang
   dựng lại, **màu và nội dung không đổi, không có lời giải thích nào**.
3. **`selectThemeChild` cố ý KHÔNG kiểm em đó có phải con người gọi hay không.** Resolver đã
   xác thực lại đủ bốn bước ở mỗi request trên danh sách con **đã đi qua RLS**; cookie bị sửa
   tay chỉ dẫn tới `SELECTED_CONTEXT_FORBIDDEN` + màu trung tính, không lộ tên, không lộ sự
   tồn tại của hồ sơ nào. Thêm một lần kiểm ở action là tạo bản sao thứ hai của cùng một luật.
4. **Cookie chọn con là cookie PHIÊN** (`httpOnly`, không `maxAge`). Máy phòng học dùng chung —
   lựa chọn "đang xem con nào" của phụ huynh này không được nằm lại cho người đăng nhập kế tiếp.

**Ba lỗi thật đã đóng ở 0.9 (đều nằm ở thanh đầu trang, đều là nói sai với người dùng):**

| # | Lỗi | Trước | Sau |
|---|---|---|---|
| 1 | 🔴 **Năm học trên header là chuỗi viết cứng.** `"Năm học 2026–2027"` nằm thẳng trong mã nguồn, `disabled`. Xứ đoàn sang năm học khác thì nó **vẫn hiện y nguyên** — và người dùng lấy đúng con số này để tin rằng mình đang ghi vào đúng năm | chuỗi cố định | đọc `academic_years` (`status='current'`) ở máy chủ, truyền xuống vỏ; chưa đặt năm thì hiện "Chưa đặt năm học" |
| 2 | **Năm học bị ẩn trên điện thoại** (`hidden sm:flex`), trong khi `13` §6 yêu cầu hiện cả trên mobile | không thấy gì | hiện ở mọi cỡ; dưới `sm` rút gọn còn mã năm + câu đầy đủ cho trình đọc màn hình, để không bóp mất tên trang ở 360px |
| 3 | **Icon lịch tô bằng `text-primary`** = `--theme-primary`, tức nơi **thứ mười ba** dùng token ngành (09 §4.4 chỉ cho 12 nơi) | `text-primary` | token trung tính |

**Nghiệm thu 15 mục (`11` §5) cho mục 0.9:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · **387 pass / 9 skip** (trước 0.9: 354/9) · build ✓ |
| E2E responsive 3 viewport, không tràn ngang | ⏸️ **CHƯA CHẠY — nợ, xem nợ #9.** Stack Supabase local bị dừng để nhường tài nguyên cho dự án khác đúng lúc chạy. **Không được ghi là đạt khi chưa đo** |
| Vùng chạm ≥44px | ✅ nút chọn con `min-h-11` (có test canh); `AcademicYearSwitcher` là `<p>`, **không bấm được** nên không phải vùng chạm — khi có `href` thì nó thành `Dropdown` đã đo ở 0.8 |
| Không cỡ chữ <12px | ✅ bậc nhỏ nhất dùng là `text-2xs` = 12px |
| Không màu hardcode khi có token | ✅ grep 9 file mới/sửa: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào (7 nợ cũ giữ nguyên, xem nợ #1) |
| Không `<select>` native mới | ✅ không thêm |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ `ChildSwitcher` là thao tác ghi duy nhất: sau `selectThemeChild` là `revalidatePath('/', 'layout')`, con đang xem mang `aria-current` + dấu ✓ + chữ "Đang xem". Không có bản ghi nào bị sửa nên không có số dòng để đếm |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ `ThemePreviewTable` rỗng nêu **tên năm học cụ thể** ("Không ai đổi ngành sau khi kích hoạt năm học 2027-2028."), đúng luật "nêu tên phạm vi" của 09 §9 |
| Thao tác nguy hiểm có `ConfirmDialog` | — không áp dụng: 0.9 chỉ **xem trước** việc kích hoạt năm học; nút kích hoạt thật thuộc M02-F09 và ở đó bắt buộc phải có |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đổi con đang xem là **tuỳ chọn hiển thị**, không đọc thêm dữ liệu nào ngoài quyền |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ nút chọn con là `<button>` native; nhánh có nhiều năm dùng lại `Dropdown` (đã có test `Escape` + trả focus ở 0.8) |
| Không dùng màu làm tín hiệu duy nhất | ✅ `ContextIndicator` **toàn chữ**; con đang chọn có ✓ + `aria-current` + chữ "Đang xem"; `ThemePreviewTable` có hẳn cột "Thay đổi" bằng lời |
| Siết quyền ⇒ RLS negative bằng JWT thật | — không áp dụng: **0 migration, 0 thay đổi phân quyền**. `getCurrentAcademicYear` dựa vào policy sẵn có `academic_years_select_authenticated` |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `docs/12` §4b (đổi tên file env). `00_SYSTEM_AUDIT_BOARD.md` **không đổi** — 0.9 không đóng luồng module nào |

---

## 2. Thứ tự 14 module — ✅ **đã đóng đủ 14/14 module** (M13 đóng 2026-08-12)

| # | Module | GĐ1 | Nghiệp vụ | Giao diện | Cỡ | Trạng thái |
|--:|---|---|---|---|:--:|:--:|
| 1 | **M14 Vỏ & Điều hướng** | `CRITICAL` | Sửa | **Redesign** | L | ✅ **XONG** |
| 2 | **M09 Ban & Thiết bị** | `PASS_WITH_MINOR_UI_FIX` | Sửa có giới hạn | Tinh chỉnh | M→**L** | ✅ **XONG** (A · B · C) |
| 3 | **M01 Auth & Tài khoản** | `CRITICAL` (4) | Sửa nhiều | **Redesign** | L | ✅ **XONG** (A · B · C) |
| 4 | **M04 Nhân sự** | `CRITICAL` (5) | Sửa nhiều | **Redesign** | L | ✅ **XONG** (A · B · C) |
| 5 | **M02 Cấu trúc học vụ** | `CRITICAL` (2) | Sửa | Tinh chỉnh | M | ✅ **XONG** (A · B · C) |
| 6 | **M03 Thiếu nhi & Phụ huynh** | `CRITICAL` (2) | Sửa nhiều | **Redesign** | L | ✅ **XONG** (A · B · C) |
| 7 | **M12 Nhập Excel** | `CRITICAL` (3) → **0** | Sửa nhiều | **Redesign** | L | ✅ **XONG** (A · B · C) |
| 8 | **M05 Điểm danh** | `NEEDS_IMPROVEMENT` | Sửa | **Redesign** | L | ✅ **XONG** (A · B · C) |
| 9 | **M06 Giáo án** | `PASS_WITH_MINOR_UI_FIX` | 🔴 **GIỮ NGUYÊN** | Tinh chỉnh | S | ✅ **XONG** (A · B · C) |
| 10 | **M07 Bảng điểm** | `NEEDS_IMPROVEMENT` | Sửa | Tinh chỉnh | M | ✅ **XONG** (A · B · C) |
| 11 | **M08 Chuyển lớp** | `NEEDS_IMPROVEMENT` | Sửa | Tinh chỉnh | M | ✅ **XONG** (A · B · C) |
| 12 | **M10 Thông báo** | `CRITICAL` (2) → **0** | Sửa | Tinh chỉnh | M | ✅ **XONG** (A · B · C) |
| 13 | **M11 Báo cáo & Dashboard** | `NEEDS_IMPROVEMENT` | Sửa | **Redesign** | L | ✅ **XONG** (A · B · C) |
| 14 | **M13 Cổng PH & Thiếu nhi** | `CRITICAL` (3) → **0** | Sửa | **Redesign** | L | ✅ **XONG** (A · B · C) |

**M09 làm sớm và song song** — độc lập nhất trong đồ thị phụ thuộc, dùng để **kiểm chứng
design system trên một module thật** trước khi áp cho các module rủi ro cao.

---

### Module 1 — M14 Vỏ & Điều hướng · chia ba đợt

`07_IMPLEMENTATION_IMPACT.md` §7 ước lượng M14 hết **10–15 ngày công**, nên chia theo đúng
nhóm ưu tiên của chính tài liệu đó thay vì làm một mạch.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M14-A** | Phần **đang thật sự chặn người dùng**: A-03 · A-01 · A-04 · A-06 · A-11 (nhóm P0 + P1) | ✅ **XONG 2026-07-23** |
| **M14-B** | Trạng thái & lối thoát: A-12 (`not-found` trong vỏ) · A-14 (`getPageTitle`) · A-16 (`<Suspense>` cho badge) · A-07 (route mồ côi) | ✅ **XONG 2026-07-23** |
| **M14-C** | **Redesign vỏ** theo `09` + IA: A-08 (tách preset mobile theo `scopeKind`) · A-10 (`/account`) · trả tiếp nợ #7 | ✅ **XONG 2026-07-23** |

> **Module 1 (M14) ĐÓNG.** Cả ba đợt xong; module tiếp theo là **M09 Ban & Thiết bị**.

> **Bốn vấn đề của M14 đã được Đợt 0-UI trả trước, không tính vào ba đợt trên:**
> A-02 (năm học header) xong ở 0.9 · A-05 (drawer thiếu focus trap) xong ở 0.7 ·
> A-09 (7 cặp màu trượt AA) xong ở 0.2 — **nên câu hỏi NC-4 "có được đổi màu thương hiệu
> không" không còn phải hỏi** · A-15 (chữ 10–11px) xong ở 0.7/0.8.

#### Đợt M14-A — ✅ XONG (2026-07-23)

| Mã | Việc | Mức | Kết quả thật |
|---|---|:--:|---|
| **A-03** | `/student/attendance` dùng `requireRouteAccess` | 🔴 `CRITICAL` an ninh | `ROUTE_RULES` khai `/student` chỉ cho vai trò `student` **từ đầu**, nhưng query guard bằng `requireAuthContext` — chỉ hỏi "đã đăng nhập chưa" — nên luật **chưa từng được thi hành**. Sửa **1 dòng**; khoá bằng 3 unit test (duyệt cả 13 vai trò còn lại) + 2 E2E |
| **A-01** | Đăng xuất | 🔴 `CRITICAL` (F07 = **16/75**, thấp nhất toàn audit) | Tính năng **chưa từng tồn tại**. `signOutAction` (Server Action, POST) + nút ở **menu tài khoản** và **chân thanh bên** (thanh bên cũng là nội dung drawer mobile ⇒ đủ cả 360px lẫn 1366px) |
| **A-04** | `?next=` và `?error=` có phía nhận | `NEEDS_IMPROVEMENT` | Người bị khoá tài khoản trước đây bị đá về màn hình đăng nhập **trắng trơn**. Nay có tấm băng giải thích; deep-link giữ nguyên đích đến kể cả phần query |
| **A-06** | Gỡ chữ tạm ở chân thanh bên (**nợ #6**) | `NEEDS_IMPROVEMENT` | Thay bằng nút Đăng xuất. `grep "P0-T3" src/` = **0** |
| **A-11** | Mục `Điểm danh` khai đúng vai trò | `PASS_WITH_MINOR_UI_FIX` | Cha sở · Cha phó · Thủ quỹ không còn thấy mục rồi bị chặn |
| **nợ #9** | E2E của mục 0.9 | — | ✅ **ĐÃ CHẠY** — xem bảng nghiệm thu |

**Năm quyết định cài đặt cần nhớ:**

1. **Guard không được tự gõ chuỗi query.** Gốc rễ của A-04 không phải "quên hiển thị một câu
   chữ" mà là `guards.ts` được viết như một API **phát tín hiệu** — gắn `?error=` vào URL rồi
   coi như xong, trong khi không có phía nhận nào bị bắt buộc tồn tại. Nay mọi URL đi ra đều
   qua `buildLoginUrl()` ở `src/lib/auth/login-redirect.ts`, và hàm đó **chỉ nhận mã nằm trong
   danh sách đã khai**, mỗi mã đều có sẵn câu chữ tiếng Việt. Muốn thêm tín hiệu mới thì phải
   khai vào đó trước ⇒ **không thể phát ra một mã mà `/login` chưa biết đọc**. Cùng mô hình với
   `APP_ERROR_CODES` nhưng tách riêng: đó là lỗi **nghiệp vụ**, đây là **trạng thái chuyển
   tiếp đi qua thanh địa chỉ**.
2. **Layout biết đường dẫn thật nhờ header `x-pathname` do middleware đặt.** Server Component
   không có cách nào khác để biết mình đang dựng cho route nào — bản cũ vì thế gọi
   `requireAuthContext()` không tham số nên `next` **luôn** là `/dashboard`. Middleware dùng
   `headers.set()` chứ không `append()`: người dùng có thể tự gửi kèm `x-pathname`, và
   `sanitizeNextPath` là hàng rào thứ hai.
3. 🔴 **Header chuyển tiếp phải dựng LẠI ở mỗi lần gọi trong `setAll`, không chụp một lần.**
   `request.cookies.set()` ghi đè header `cookie` của chính `request` — đó là cách token vừa
   làm mới đi tiếp tới Server Component. Một bản `Headers` chụp trước lúc đó mang **cookie
   cũ**, và hậu quả là mỗi lần Supabase xoay token thì request đó thấy phiên hết hạn: người
   dùng bị đá về `/login` giữa chừng, ngẫu nhiên, rất khó truy. Đã suýt cài đúng lỗi này.
4. **Đăng xuất là `<form action={serverAction}>`, không phải `<Link>`** (AC-F3). Link GET bị
   trình duyệt tải trước, bị trình quét link trong Zalo/Messenger mở thử, và bị "mở trong tab
   mới" kích hoạt ngoài ý muốn. Dạng form cũng là dạng chạy được khi JS chưa tải (`09` §11).
5. **`UserMenu` nâng lên `Dropdown` của mục 0.8** (`05` §3.2) — trả một phần **nợ #7**. Nút
   Đăng xuất trong menu mang `role="menuitem"`, nên `<form>` bọc nó phải có `role="none"`:
   con trực tiếp của `role="menu"` phải là `menuitem`, một `<form>` còn nguyên vai trò sẽ cắt
   đứt quan hệ đó.

**Hai lỗi thật bắt được khi chạy E2E, cả hai đều nằm ở bộ test chứ không ở ứng dụng:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **`home.spec.ts` đang chốt cứng chính bug A-04 thành đặc tả.** Nó khẳng định `/admin` → `next=%2Fdashboard` là hành vi **đúng** — tức bộ test bảo vệ cái lỗi làm mất mọi deep-link | `07` §5 đã dự đoán trước | Đổi kỳ vọng thành `next=%2Fadmin`, thêm ca giữ nguyên phần query |
| 2 | **Fixture của `results.spec.ts` không tái lập được.** `upsert` chỉ ghi đè cột được liệt kê, mà chính bài test đó kết thúc ghi danh (`status='completed'`, `ended_on=<ngày>`) khi duyệt chuyển lớp. Lượt sau đặt lại `status='active'` trong khi `ended_on` vẫn còn ⇒ vi phạm `enrollments_open_has_no_end` ngay ở bước dựng dữ liệu. Nghĩa là **bộ E2E chỉ chạy được đúng một lần sau mỗi `db:reset`** — đúng loại ma sát khiến nợ #9 kéo dài | 3/3 viewport rớt ở đúng dòng đó | Đặt lại `ended_on: null, previous_enrollment_id: null` tường minh |

**Hệ quả của NC-3 phải ghi lại:** cho `/login` chuyển thẳng vào `/dashboard` khi đã có phiên
nghĩa là **không còn đổi tài khoản bằng cách mở lại `/login`** — phải Đăng xuất rồi đăng nhập.
Chấp nhận được vì nút Đăng xuất vừa có ở A-01 (trước đó **không hề tồn tại**, và đó chính là
lý do 7 spec E2E cũ phải đăng nhập chồng lên nhau). Sáu spec đó nay xoá cookie trước khi mở
`/login`; mỗi context độc lập nên bài tranh chấp/tiếp quản hai phiên vẫn nguyên vẹn.

**Nghiệm thu 15 mục (`11` §5) cho đợt M14-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · **436 pass / 9 skip** (trước M14-A: 387/9, **+49**) · build ✓ 27/27 trang |
| E2E responsive 3 viewport, không tràn ngang | ⚠️ **115/117** (360 · 768 · 1366, 1 worker). Toàn bộ 9 test mới của M14-A xanh; `responsive.spec.ts` 3/3. Hai ca rớt đều ở **M07 bảng điểm**, chập chờn — xem nợ #10 |
| Vùng chạm ≥44px | ✅ nút Đăng xuất `min-h-11` ở **cả hai** kiểu hiển thị (có unit test canh); mục `Dropdown` đã đo ở 0.8 |
| Không cỡ chữ <12px | ✅ `grep -rE "text-\[(8\|9\|10\|11)px\]" src/` = **0** |
| Không màu hardcode khi có token | ✅ grep 5 file mới/sửa: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; đếm lại đúng **7 nợ cũ** (nợ #1) |
| Không `<select>` native mới | ✅ không thêm |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ đăng xuất là thao tác ghi duy nhất: sau nó là `revalidatePath('/', 'layout')` rồi về `/login` kèm tấm băng "Bạn đã đăng xuất." Không bản ghi nào bị sửa nên không có số dòng để đếm |
| Trạng thái rỗng đúng 1 trong 3 loại | — không áp dụng |
| Thao tác nguy hiểm có `ConfirmDialog` | — đăng xuất **không phá huỷ dữ liệu** và hoàn tác được bằng cách đăng nhập lại; chèn một hộp xác nhận vào đúng đường thoát của máy dùng chung là làm khó chính việc cần dễ |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: không đọc thêm dữ liệu nào ngoài quyền |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ menu tài khoản nay là `Dropdown` (đã có test `Escape` đóng **và trả focus** ở 0.8); nút Đăng xuất là `<button type="submit">` native |
| Không dùng màu làm tín hiệu duy nhất | ✅ nút Đăng xuất có **icon riêng + chữ**, không chỉ màu `danger`; tấm băng ở `/login` dùng `Alert` — mỗi tone một icon (09 §3) |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ A-03 **là** một lần siết quyền. Kiểm bằng **JWT thật** qua E2E: phụ huynh `84912000001` và GLV lớp `GLV910` đăng nhập thật rồi gõ thẳng `/student/attendance` → `/access-denied`, trên cả 3 viewport. **0 migration** nên không cần pgTAP mới |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (M14-F07 đóng, M14-F01 đóng phần chặn) |

#### Đợt M14-B — ✅ XONG (2026-07-23)

Bốn việc nhóm P2 của `07_IMPLEMENTATION_IMPACT.md` §1. Ba trong bốn là **cùng một triệu chứng**:
người dùng đứng ở một chỗ mà giao diện không nói được đó là chỗ nào, hoặc không có đường đi tiếp.

| Mã | Việc | Mức | Kết quả thật |
|---|---|:--:|---|
| **A-12** | `not-found` **trong vỏ ứng dụng** | `PASS_WITH_MINOR_UI_FIX` | Chỉ có `src/app/not-found.tsx`, nên mọi `notFound()` của trang chi tiết **thổi bay cả thanh bên lẫn thanh đầu trang**. Nay có `src/app/(dashboard)/not-found.tsx`; E2E mở một UUID không tồn tại và **đo được** breadcrumb + menu tài khoản vẫn còn (AC-C1) |
| **A-14** | `getPageTitle` cho route không có mục điều hướng | `PASS_WITH_MINOR_UI_FIX` | `/access-denied` và `/parent/children/<id>` in **tên ứng dụng** thay vì tên trang. Nay hai hàm `getPageTitle` và `buildBreadcrumbTrail` đọc **chung một bảng tra** (AC-B5) |
| **A-16** | Đếm chưa đọc ra khỏi đường tới hạn | `PASS_WITH_MINOR_UI_FIX` | Truy vấn `count` chạy ở layout trong **mọi** request. Nay nằm trong `<Suspense>`: nút chuông đi ra cùng phần vỏ, con số chảy về sau |
| **A-07** | Route mồ côi `/parent/children/[studentId]` | `NEEDS_IMPROVEMENT` | Trang chạy được, dữ liệu thật, **không một `href` nào** trong `src/` dẫn tới nó — phụ huynh chỉ vào được qua deep-link trong thông báo. Nay có ở **trang chủ** và **trang Đơn xin nghỉ** (AC-B2) |

**Bốn quyết định cài đặt cần nhớ:**

1. **Trang "không tìm thấy" phải nói câu TRUNG TÍNH.** Nó cũng là nơi `/parent/children/<id>`
   của con **người khác** rơi vào — `04_TO_BE_FLOWS.md` chốt `notFound()` thay vì "không có
   quyền" để không lộ sự tồn tại của hồ sơ thiếu nhi (BR-25). Câu chữ vì thế nêu **ba khả năng
   cùng lúc** (chưa từng tồn tại / đã bị xoá / ngoài phạm vi của bạn) và không xác nhận cái nào.
   Cũng vì vậy **không dùng `EmptyState`**: ba loại chuẩn của `09` §9 nói về *dữ liệu rỗng trong
   một phạm vi*, còn đây là *một địa chỉ không dẫn tới đâu* — hai thứ khác nhau.
2. **`getPageTitle` và `buildBreadcrumbTrail` dùng chung `STANDALONE_PAGE_LABELS`.** Gốc rễ của
   A-14 không phải "quên hai dòng" mà là hai bảng tra song song: 0.7 thêm nhãn cho breadcrumb,
   `getPageTitle` không biết. Hai bảng lệch nhau nghĩa là breadcrumb nói "Hồ sơ con" còn dòng
   tiêu đề **ngay dưới nó** nói "Thiếu Nhi Chợ Quán". Có unit test canh đúng bất biến này.
3. 🔴 **`<Suspense>` được vì nút chuông đi xuống dưới dạng `ReactNode`, không phải con số.**
   `AppShell` là client component nên không thể `await` gì; bản cũ vì thế bắt layout `await`
   hộ. Nay layout (server) dựng sẵn `<Suspense><NotificationBell/></Suspense>` rồi truyền
   xuống như một prop. Fallback cố ý **không đoán một con số**: `NotificationButton` không có
   `unreadCount` thì không vẽ badge và nhãn cho trình đọc màn hình chỉ là "Mở thông báo" —
   không nói con số nào còn hơn nói một con số sai rồi lặng lẽ đổi.
4. **Chưa thêm mục "Con của tôi" vào menu** (chủ dự án chốt 2026-07-23). Khuyến nghị B4.2 có
   nêu, nhưng sắp xếp lại menu phụ huynh thuộc **đợt C** và còn chờ **NC-1**. Đổi menu hai lần
   liên tiếp là thứ người dùng ít kinh nghiệm cảm nhận như "hệ thống lại đổi nữa".

**Một quyết định trình bày cần ghi lại:** khối "Con của tôi" chỉ hiện trên `/parent/absence-requests`
khi tài khoản **có** ít nhất một con. Trường hợp chưa gắn hồ sơ đã được thẻ "Gửi đơn mới" ngay bên
dưới nói rồi; nói hai lần cùng một điều trên một màn hình chỉ làm rối. **Trang chủ** mới là nơi giải
thích trường hợp đó, và ở đó dùng `EmptyState variant="not-linked"` đầy đủ — đây cũng là lần đầu
`EmptyState` chạy trong một trang thật (trả một phần **nợ #7**).

**Hai điều đo được, không phải suy đoán:**

| # | Điều | Bằng chứng |
|---|---|---|
| 1 | Trang 404 trong vỏ **thật sự** khác trang 404 toàn màn hình | E2E khẳng định breadcrumb `nav[aria-label="Đường dẫn trang"]` **và** menu tài khoản còn hiện ở `/students/<uuid-không-có>`; `src/app/not-found.tsx` không có cả hai thứ đó |
| 2 | Hai ca chập chờn của **nợ #10** lần này **xanh cả 3 viewport** | 129/129. **Không đóng nợ #10**: lần chạy này nằm trên DB vừa `db:reset`, đúng điều kiện dễ xanh nhất. Nguyên nhân gốc (`window.confirm` trên nút cần JS đã hydrate) vẫn còn nguyên, trả ở M07 |

**Nghiệm thu 15 mục (`11` §5) cho đợt M14-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · **444 pass / 9 skip** (trước M14-B: 436/9, **+8**) · build ✓ 27/27 trang |
| E2E responsive 3 viewport, không tràn ngang | ✅ **129/129** (360 · 768 · 1366, 1 worker, 5,0 phút). 12 test mới của M14-B xanh; `responsive.spec.ts` 3/3. Bốn trang mới/đổi đều có `expectNoHorizontalOverflow` riêng |
| Vùng chạm ≥44px | ✅ hàng "Con của tôi" `min-h-11` (có unit test canh); nút "Về trang chủ" của trang 404 và link "Đơn xin nghỉ" dùng `buttonVariants` = `min-h-control` 44px. Bản cũ của link đó là **một dòng chữ nhỏ màu nhạt**, không đạt |
| Không cỡ chữ <12px | ✅ `grep -rE "text-\[(8\|9\|10\|11)px\]" src/` = **0** |
| Không màu hardcode khi có token | ✅ grep 4 file mới + 6 file sửa: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; đếm lại đúng **7 nợ cũ** (nợ #1) |
| Không `<select>` native mới | ✅ không thêm |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | — không áp dụng: đợt B **không có thao tác ghi nào**, cả bốn việc đều là điều hướng và trình bày |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ `ChildrenLinks` rỗng dùng `not-linked` và nói rõ phải làm gì tiếp ("liên hệ Ban quản trị Xứ đoàn"). Trang 404 **cố ý không** dùng `EmptyState` — xem quyết định 1 |
| Thao tác nguy hiểm có `ConfirmDialog` | — không áp dụng |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: không đọc thêm dữ liệu nào ngoài quyền. `getGuardianChildLinks` guard bằng `/dashboard` và trả mảng rỗng cho vai trò không phải phụ huynh |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không thêm lớp nổi nào; mọi thứ mới đều là `<a>`/`<button>` native. Vỏ vẫn qua đủ 14 test a11y của 0.7 sau khi đổi kiểu prop |
| Không dùng màu làm tín hiệu duy nhất | ✅ hàng "Con của tôi" có **tên em + mũi tên**; trang 404 có **icon + tiêu đề + đoạn giải thích**, không dùng màu để báo lỗi |
| Siết quyền ⇒ RLS negative bằng JWT thật | — không áp dụng: **0 migration, 0 thay đổi phân quyền**. `getGuardianChildLinks` dựa hoàn toàn vào RLS của `students` như phần còn lại của portal |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (M14 sang "đợt A và B xong"; ghi chú vào M13-F01 rằng **phần lối vào** đã trả, **luồng vẫn mở**) |

**Còn nợ lại từ đợt B (đều thuộc đợt C, không giấu):**

- **AC-B6** — "mọi trang chi tiết có đường quay lại cấp cha" mới đúng cho `/parent/children/<id>`.
  Nút quay lại chuẩn ở `PageHeader` (khuyến nghị B7.1) là việc của đợt C.
- **AC-B3** — `Tài khoản` vẫn chỉ có trong bottom nav và `UserMenu`, chưa có trong thanh bên.
- **A-13** (`EmptyState` cho ~9 trang nghiệp vụ) vẫn rải theo từng module, đúng như `07` §3 khuyến cáo.

#### Đợt M14-C — ✅ XONG (2026-07-23) · **đóng module 1**

Chủ dự án chốt **bốn câu NC** trước khi code (D-88…D-91, xem §4). Đợt này làm ba việc của kế hoạch
cộng bốn việc trả nợ đã đến hạn.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **A-08** | Tách preset thanh dưới theo `scopeKind` | Từ **1** preset dùng chung cho 12 vai trò nhân sự thành **7** preset. Cha sở · Cha phó · Thủ quỹ không còn ô `Điểm danh` **chết**; Super Admin có `Quản trị`; Trưởng/Phó ngành có `Lên lớp`; **preset lớp giữ nguyên** (`07` §6 rủi ro số 3) |
| **A-10** | `/account` làm thật | Trang production **cuối cùng** còn dùng trang giữ chỗ. `grep "ModulePlaceholder" src/app/` = **0** ⇒ AC-C6 đạt |
| **Redesign vỏ** | Áp `09` cho thanh bên · thanh đầu trang · thanh dưới | Dải màu ngành 4px (nơi số 1 của `09` §4.4) · mục sidebar đang chọn mang **ba** tín hiệu (nơi số 2) · ô thanh dưới đang chọn có vạch riêng ngoài màu chữ · gỡ bí danh token cũ khỏi 6 file vỏ (trả một phần **nợ #2**) |
| **NC-5** | `AuthContext` → `ShellViewer` | Vỏ là client component nên **mọi** prop của nó đi xuống trình duyệt ở mọi trang. Từ **12 trường** xuống **4** (`displayName` · `role` · `audience` · `scopeKind`); `userId`, `profileId`, `accountStatus`, `academicYearId`, `sectorId`, `classId` không còn được gửi |
| **Nợ #7** | Component chưa trang nào dùng | Thêm `ThemeScope` · `ContextIndicator` · `UnassignedBanner` vào vỏ ⇒ chúng chạy trên **mọi** trang của hệ thống |
| **AC-B6** | Đường quay lại chuẩn | `PageHeader` nhận `backHref`/`backLabel`, nút 44px bên trái tiêu đề |
| **AC-B3** | `Tài khoản` ở cả hai nền tảng | Trước đây chỉ có ở thanh dưới ⇒ desktop và mobile hiện hai tập mục khác nhau |

**Vỏ ứng dụng nay CÓ MÀU NGÀNH — và đây là quyết định cài đặt quan trọng nhất của đợt:**

Vỏ luôn dùng **`scope: PERSONAL`** (`10` §3 bước 6). Màu vỏ trả lời câu *"tôi đang làm việc ở
đâu"* (`10` §10), tức ngữ cảnh của **chính người đang đăng nhập**: ngành của lớp mình phụ trách,
ngành của con mình, hoặc trung tính Huynh Trưởng với vai trò toàn cục. Những trang nói về **một
bản ghi cụ thể** (`/classes/<id>`, `/reports` đã lọc một ngành — `10` §9) sẽ tự khai scope riêng
khi module của chúng được thiết kế lại. Ở đây **không** đoán hộ chúng bằng cách giải mã
`pathname` — đó đúng là lỗi mà `10` §5 cấm và là gốc rễ của F05.

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **Hàm CSS của mục menu phải nằm ngoài module `"use client"`.** Xem lỗi #1 dưới đây. Đây là
   loại bẫy chỉ lộ ra khi một component được dùng lại ở **phía bên kia** ranh giới client/server,
   nên nó sẽ còn quay lại ở các module sau — `dropdown-item.ts` là chỗ đã ghi lại bài học.
2. **`ContextIndicator` và `UnassignedBanner` đi xuống vỏ dưới dạng `ReactNode` dựng sẵn ở máy
   chủ**, cùng khuôn mẫu với nút chuông của A-16. Cả hai đọc `ThemeContext` (10 trường), mà truyền
   nguyên đối tượng đó xuống client là đi ngược lại chính NC-5 vừa làm.
3. **`ContextIndicator` phải có BẢN RIÊNG cho màn hình hẹp.** Thanh bên là `hidden lg:flex`, nên
   nếu dòng ngữ cảnh chỉ nằm trong đó thì ở 360px người dùng **chỉ còn dải màu** — màu thành tín
   hiệu duy nhất, đúng điều `09` §10 điều 5 cấm, và điện thoại lại là thiết bị ưu tiên số 1
   (`05` §2.5). Có unit test canh đúng hai bản.
4. **`/change-password` nay nói hai câu khác nhau cho hai lối vào.** Trang này bị ép vào ở lần
   đăng nhập đầu (nhãn "Bắt buộc" + *"Đây là lần đăng nhập đầu tiên"*), nhưng A-10 vừa mở thêm
   lối vào **tự nguyện** từ `/account`. Giữ nguyên câu cũ nghĩa là nói sai với người dùng đúng lúc
   họ đang cẩn thận nhất. Phân nhánh theo `mustChangePassword`.

**Hai lỗi thật bắt được — cả hai đều do chạy E2E, không phải đọc mã:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴🔴 **Trang `/account` đổ vào error boundary trên CẢ BA viewport.** `dropdown.tsx` mang `"use client"`, nên **mọi** export của nó là *client reference* — gọi trong lúc dựng một Server Component là ném lỗi ngay, kể cả khi đó chỉ là một hàm thuần trả về chuỗi CSS. `SignOutButton` gọi đúng hàm đó. Nó chạy tốt suốt từ đợt A **vì luôn nằm trong thanh bên (cây client)**; đến khi `/account` — Server Component — dùng lại chính component ấy thì cả trang chết. Bẫy phụ thuộc **nơi gọi**, không phụ thuộc mã nguồn, nên đọc diff không thấy | E2E đợt C: `/account` hiện "Đã xảy ra lỗi" | Tách `dropdownItemClassName` sang `src/components/ui/dropdown-item.ts` (không `"use client"`); `dropdown.tsx` **cố ý không xuất lại** để không ai vô tình nhập nhầm |
| 2 | **Ba bài test của chính đợt C rớt oan.** Thanh bên `hidden lg:flex` **vẫn nằm trong DOM** ở 360/768, nên `locator('nav a[href=…]').first()` trúng đúng cái link vô hình và rớt với *"Received: hidden"* trong khi ứng dụng hoàn toàn đúng | 5 test rớt ở 360 và 768 nhưng chỉ 2 test rớt ở 1366 | Thêm `:visible` vào locator điều hướng, gói thành helper `navLink()` kèm chú thích |

**Một lỗ hổng thiết kế tự phát hiện khi soạn E2E** (không phải bug, nhưng đã vá): xem quyết định 3.

**Nghiệm thu 15 mục (`11` §5) cho đợt M14-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · **465 pass / 9 skip** (trước M14-C: 444/9, **+21**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ⚠️ **148/150** (360 · 768 · 1366, 1 worker, 9,5 phút). **Toàn bộ 21 test mới của đợt C xanh**; `responsive.spec.ts` 3/3. Hai ca rớt đều ở spec **Phase 5/6 cũ** — xem nợ #10 |
| Vùng chạm ≥44px | ✅ nút quay lại của `PageHeader` `min-h-11` (có unit test); ô thanh dưới `min-h-16`; mục sidebar `min-h-11`; nút `/account` dùng `buttonVariants` = 44px |
| Không cỡ chữ <12px | ✅ `grep -rE "text-\[(8\|9\|10\|11)px\]" src/` = **0** |
| Không màu hardcode khi có token | ✅ grep 13 file mới/sửa: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; đếm lại đúng **7 nợ cũ** (9 kết quả grep, 2 trong số đó là chú thích ở `dialog.tsx`/`confirm-dialog.tsx`) |
| Không `<select>` native mới | ✅ **0** trong mọi file đợt C đụng tới |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | — đợt C **không có thao tác ghi mới**. Nút Đăng xuất trên `/account` dùng lại đúng `signOutAction` của A-01, không phải bản sao thứ hai |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ `/parent/children` rỗng dùng `not-linked` (dùng lại `ChildrenLinks` của đợt B) |
| Thao tác nguy hiểm có `ConfirmDialog` | — không áp dụng |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: `/account` chỉ in lại thứ đã có trong phiên đăng nhập, **không truy vấn mới** ngoài năm học |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ 14 test a11y của vỏ (mục 0.7) vẫn xanh sau khi đổi kiểu prop; mọi thứ mới đều là `<a>`/`<button>` native, không thêm lớp nổi nào |
| Không dùng màu làm tín hiệu duy nhất | ✅ **đây là trọng tâm của đợt**: sidebar 3 tín hiệu · thanh dưới có vạch + `aria-current` · dải màu ngành **luôn** kèm `ContextIndicator` bằng chữ, ở **cả** màn hình hẹp lẫn rộng (E2E canh ở cả 3 viewport) |
| Siết quyền ⇒ RLS negative bằng JWT thật | — **0 migration, 0 thay đổi phân quyền**. A-08 chỉ **bớt** mục hiển thị; bất biến AC-A3 (14 vai trò × mọi mục) vẫn là hàng rào, và `/parent/children` đi qua luật `/parent` sẵn có |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` + **`docs/06` §5 và §6** (chủ dự án duyệt — D-88, D-89, D-91) |

**Còn nợ lại sau khi M14 đóng:** xem nợ #10 (đã mở rộng), **#11** và **#12** ở §3.

---

### Module 2 — M09 Ban & Thiết bị · chia ba đợt

`07_IMPLEMENTATION_IMPACT.md` §5 ước lượng toàn bộ To-Be của M09 hết **≈11,5 ngày công** — gần gấp
đôi một đợt của M14. Chủ dự án chốt **ba quyết định** trước khi code (D-92…D-94, xem §4), trong đó có
việc **mở rộng phạm vi** sang hai To-Be không nằm trong danh sách của `06_MODULE_UI_REDESIGN_PLAN.md`
§2. Vì vậy M09 chia ba đợt thay vì làm một mạch.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M09-A** | **Chống mất dữ liệu và bịt lỗ:** TB-M09-01 PA A (công việc tuần) · TB-M09-03 PA B (khoá `total_quantity`) · D-78 (một Trưởng ban, phần ràng buộc) · rà `requireRouteAccess` cho mọi action | ✅ **XONG 2026-07-23** |
| **M09-B** | **Vòng đời kho:** TB-M09-02 PA A (trả dần / báo hỏng-mất) · TB-M09-04 (nhập thêm kho) · mở rộng danh sách người mượn (D-94) | ✅ **XONG 2026-07-24** |
| **M09-C** | **Giao diện:** TB-M09-05 (bỏ auto-save chức vụ, xác nhận khi xoá, `ends_on` do DB đặt) · TB-M09-06 (sửa Ban/thông báo/lịch họp + tabs) · áp `09` · hộp thoại bàn giao Trưởng ban · **đóng nợ #13 (D-100)** | ✅ **XONG 2026-07-24** |

> **Module 2 (M09) ĐÓNG.** Cả ba đợt xong; module tiếp theo là **M01 Auth & Tài khoản** (`08` §2).

**Danh sách "không đụng" của M09** (`06` §2, đã đo lại và giữ nguyên ở đợt A): mượn/trả thiết bị có
khoá dòng · trả lại phiếu đã trả là idempotent · người ngoài Ban mở đường dẫn trực tiếp không thấy gì.

#### Đợt M09-A — ✅ XONG (2026-07-23)

| Mã | Việc | Mức | Kết quả thật |
|---|---|:--:|---|
| **F11 / TB-M09-01 PA A** | Công việc tuần ghi đè mất nội dung | 🔴 `CRITICAL` (48/75, thấp nhất M09) | Form nay **nạp sẵn** bản của tuần đang chọn, nhãn nút đổi giữa "Tạo" và "Cập nhật", mỗi bản trong danh sách có nút **Sửa**. Phía server bỏ hẳn `upsert`: INSERT khi chưa có bản, UPDATE **so sánh-và-đổi** trên `updated_at` khi đã có. Thêm CHECK `committee_weekly_plan_not_empty` ở DB |
| **F14 / TB-M09-03 PA B** | `total_quantity` không được bảo vệ gì cả | `NEEDS_IMPROVEMENT` (53/75) | Trigger nay khoá **cả hai** cột sổ kho và thêm nhánh INSERT kiểm `available = total`. `EQUIPMENT_TOTAL_READONLY` và `EQUIPMENT_STOCK_MISMATCH` đều có câu tiếng Việt riêng |
| **D-78** | Mỗi Ban chỉ một Trưởng ban | — | Index một phần `committee_memberships_one_active_leader_idx`. Phó ban **không** giới hạn (có test canh hai Phó ban cùng lúc) |
| **BR-M09-62** | Mọi action của M09 chỉ kiểm "đã đăng nhập chưa" | `Q-M09-09` | 9 action đổi sang `requireRouteAccess("/committees")`, và guard **ra khỏi `try`** — xem quyết định 2 |
| **SEC-M09-14** | Hai phiên cùng mượn cái cuối cùng | 🟠 "lập luận đúng, chưa chứng minh" | ✅ **ĐÃ CHỨNG MINH** — `tests/integration/m09-equipment-concurrency.test.ts`, hai JWT thật gọi RPC đồng thời |

**Năm quyết định cài đặt cần nhớ:**

1. 🔴 **`upsert` là công cụ sai cho "một bản mỗi tuần".** Gốc rễ F11 không phải "quên prefill" mà là
   một câu lệnh **không phân biệt được tạo với ghi đè**. `upsert` ghi mọi cột được liệt kê, nên nó
   còn đè luôn `created_by` — đến dấu vết "ai soạn bản đầu tiên" cũng mất. Đường mới tách hẳn hai
   việc, và phép so sánh `updated_at` nằm **trong mệnh đề `WHERE` của câu UPDATE**, không phải một
   `if` ở tầng ứng dụng: đọc rồi mới ghi là để hở đúng khoảng thời gian mà bài toán này cần đóng.
2. 🔴 **Guard phải gọi NGOÀI `try`.** `redirect()` của Next báo hiệu bằng cách **ném lỗi**. Mọi action
   của M09 đang gọi guard bên trong `try`, nên `catch` nuốt mất tín hiệu chuyển hướng và biến nó
   thành *"Không thể xử lý yêu cầu. Vui lòng thử lại."* — người hết phiên bấm mãi một nút không bao
   giờ chạy, thay vì được đưa về `/login`. Cùng lúc đổi `requireAuthContext` → `requireRouteAccess`:
   `ROUTE_RULES` khai `/committees` chỉ dành cho nhân sự, nhưng luật đó **chưa từng được thi hành ở
   tầng action** — đúng hình dạng lỗi A-03 của M14.
3. **Ô nhập nội dung cố ý là uncontrolled + `key` theo tuần đang nhắm tới.** Đổi tuần thì React dựng
   lại ô (nên prefill đúng), nhưng không giành quyền điều khiển từng phím gõ — thứ mà bảng gõ tiếng
   Việt trên máy phòng học hay vấp. Nút "Sửa" đặt focus **trong `useEffect`**, không phải trong
   `onClick`: gọi thẳng là focus vào node sắp bị thay, và người dùng bàn phím bị bỏ lại cuối trang.
4. **CHECK ở DB chặt hơn bản viết trong `04_TO_BE_FLOWS.md`.** Tài liệu đề xuất
   `content is not null`, nhưng chuỗi rỗng và chuỗi toàn khoảng trắng cũng là bản trắng, mà Zod ở
   tầng trên đã `trim()`. Dùng `btrim(coalesce(content,'')) <> ''` để hai tầng nói **cùng một điều**.
5. 🔴 **Ô ngày phải đọc lại DOM một lần khi vừa hydrate.** Xem lỗi #2 dưới đây. Đây là loại bẫy của
   **mọi** controlled input trong dự án này — máy phòng học tải JS chậm, người dùng chạm vào ô trước
   khi trang kịp hydrate là chuyện thường — nên nó sẽ còn quay lại ở các module sau.

**Hai lỗi thật bắt được khi chạy E2E, không phải đọc mã:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | **Bài E2E của chính đợt A tự xoá mất tình huống cần kiểm.** Kịch bản "người khác vừa cập nhật" ghi đè **thành công** thay vì bị từ chối: `router.refresh()` của lần lưu trước là bất đồng bộ, nó về **sau** khi "người thứ hai" ghi nên form cầm luôn dấu thời gian mới, khớp DB. Cùng loại với bài học `results.spec.ts` ở M14-A: bộ test phải **tái lập được**, nên bài này nay còn dọn bản tuần cũ trước khi chạy | lượt E2E đầu của M09-A, `mobile-360` | Tải lại trang **trước** khi "người thứ hai" ghi, để trang đứng ở một mốc thời gian xác định |
| 2 | 🔴 **Chọn tuần trước khi trang hydrate là chọn vào hư không.** Ô ngày hiện `12/10`, danh sách bên dưới có bản của tuần `12/10`, mà form vẫn nói *"Tuần này chưa có công việc nào"*. Nguyên nhân: React ghi nhớ giá trị **đang có trên DOM** lúc hydrate làm mốc so sánh, nên chọn lại **đúng tuần đó** một lần nữa không sinh ra sự kiện nào — trạng thái kẹt vĩnh viễn. **Không phải lỗi của bộ test**: người dùng máy chậm gặp y hệt | lượt E2E đầy đủ: `tablet-768` và `laptop-1366` cùng rớt ở đúng một dòng, `mobile-360` xanh | `useEffect` đọc lại `input.value` một lần khi vừa hydrate. Sau đó **149/150**, phần M09 xanh cả 3 viewport |

**Ba điều đo được, không phải suy đoán:**

| # | Điều | Bằng chứng |
|---|---|---|
| 1 | 🔴 **`total_quantity` thật sự sửa tay được trước M09-A** | pgTAP `021` mới: câu `update … set total_quantity = 9999` nay ném `EQUIPMENT_TOTAL_READONLY`. Cùng câu đó chạy trên bản trước migration thì **thành công** |
| 2 | **Row lock của `borrow_equipment` chịu được tranh chấp thật** | Hai phiên JWT thật gọi RPC **đồng thời** trên thiết bị còn đúng 1 cái: 1 phiếu được tạo, phiên còn lại nhận `EQUIPMENT_NOT_ENOUGH`, `available_quantity = 0` (không âm), sổ mượn đúng 1 dòng |
| 3 | 🔴 **Danh sách nhân sự Ban hiện "—" thay cho tên người** | Đo bằng JWT thật của GLV909 (Trưởng Ban Sinh hoạt) trên `/committees/<Ban Kỹ thuật>`: 2/3 thành viên trả về `null`. Xem **nợ #13** |

**Một lỗi quy trình đã trả giá, ghi lại để phiên sau không mất công:**
`npm run test:db` phải chạy trên DB **vừa `db:reset`, CHƯA `seed:dev`**. pgTAP đếm dữ liệu seed gốc
("seed đúng 6 Ban", "thành viên chỉ thấy Ban mình"), nên chạy sau `seed:dev` là **18/35 bài của `020`
đỏ oan** cộng một lỗi trùng khoá ở `021` — mất một lượt chạy để nhận ra đó không phải lỗi migration.

**Nghiệm thu 15 mục (`11` §5) cho đợt M09-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **476 pass / 10 skip** (trước M09-A: 465/9, **+11 pass**; skip mới là bài tranh chấp có cổng env) · **pgTAP 561/561** (trước: 547, **+14**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ⚠️ **149/150** (360 · 768 · 1366, 1 worker, 5,2 phút, trên DB vừa `db:reset` + `seed:dev`). **Toàn bộ phần M09 xanh 3/3 viewport**; `responsive.spec.ts` 3/3. Ca rớt duy nhất là `results.spec.ts:201` (**M07 bảng điểm**) — nợ #10, không liên quan M09 |
| Vùng chạm ≥44px | ✅ nút "Sửa"/"Xóa" của mỗi bản tuần dùng `Button size="sm"` = `min-h-control` 44px (WORKLOG Phase 7: `sm` là nút *hẹp ngang*, không phải nút thấp); ô nhập dùng `Textarea` với `min-h-control` |
| Không cỡ chữ <12px | ✅ `grep -rE "text-\[(8\|9\|10\|11)px\]" src/` = **0**; bậc nhỏ nhất dùng trong file mới là `text-2xs` = 12px |
| Không màu hardcode khi có token | ✅ grep file mới `weekly-plan-editor.tsx`: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **7 nợ cũ** (nợ #1). Hộp xác nhận khi xoá nội dung Ban thuộc **đợt M09-C** (TB-M09-05) — không giấu, xem bảng ba đợt |
| Không `<select>` native mới | ✅ không thêm; `WeeklyPlanEditor` chỉ có `Input type="date"` và hai `Textarea` |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ câu báo kết quả nay **nêu tuần cụ thể** và **phân biệt tạo với cập nhật** ("Đã tạo/Đã cập nhật công việc tuần 05/10/2026."), thay cho một câu "Đã lưu công việc tuần." dùng chung cho hai việc khác hẳn nhau. Mỗi thao tác đụng đúng 1 dòng nên không có số dòng để đếm |
| Trạng thái rỗng đúng 1 trong 3 loại | — đợt A giữ nguyên câu rỗng cũ ("Chưa có công việc tuần nào."); chuyển sang `EmptyState` thuộc đợt M09-C |
| Thao tác nguy hiểm có `ConfirmDialog` | — đợt A **không thêm thao tác phá huỷ nào**. Ma sát cho xoá/đổi chức vụ là TB-M09-05, đợt C |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt A không mở thêm đường đọc dữ liệu nào. Nhật ký cho "Báo hỏng/mất" thuộc đợt B (bảng `equipment_loan_events`) |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không thêm lớp nổi; mọi thứ mới là `<input>`/`<textarea>`/`<button>` native. Nút "Sửa" **trả focus về ô nội dung** (có unit test canh) |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái "đang tạo" hay "đang sửa" nói **bằng chữ** trong vùng `role="status"`, và nhãn nút nói lại cùng điều đó. Không dùng màu ở đâu để phân biệt hai trạng thái này |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **có siết quyền**: `total_quantity` từ "ai có UPDATE cũng sửa" thành "chỉ RPC"; D-78 chặn Trưởng ban thứ hai; 9 action siết từ `requireAuthContext` sang `requireRouteAccess`. Kiểm bằng **JWT thật** trong pgTAP `020`/`021` (không service role) + bài tranh chấp hai phiên. **3 migration**, đều chạy sạch từ DB trống |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (M09-F11 đóng). **Không đổi `09`/`10`/`11`** |

**Còn nợ lại từ đợt A (đều có chỗ trả, không giấu):**

- **Câu chữ bàn giao Trưởng ban** (D-78 "Kết thúc nhiệm kỳ của {tên} và bổ nhiệm {tên mới}?") mới
  chỉ là một **câu lỗi nói rõ phải làm gì** ("Ban này đã có Trưởng ban. Hãy đổi chức vụ của Trưởng ban
  hiện tại trước…"). Hộp thoại một-bước thuộc đợt C, nơi ô chọn chức vụ được dựng lại theo TB-M09-05.
- **`Toast`, `Tabs`, `EmptyState`** của `06` §2 vẫn chưa dùng ở M09 — đợt C.
  *(`ConfirmDialog` và `Select` đã trả ở đợt B.)*
- **Nợ #13 mới** (tên nhân sự cùng Ban không đọc được) — xem §3.

#### Đợt M09-B — ✅ XONG (2026-07-24)

Chủ dự án chốt **hai quyết định** trước khi code (D-97, D-98 — xem §4), cả hai đều nảy ra từ
đúng một chỗ: đợt A vừa **khoá** `total_quantity` và đợt B thì cần mở lại vài đường hợp lệ đi
qua nó, nên phải nói rõ đường nào mở cho ai.

| Mã | Việc | Mức | Kết quả thật |
|---|---|:--:|---|
| **F16 / TB-M09-02 PA A** | Trả một phần bị hiểu là mất vĩnh viễn | `NEEDS_IMPROVEMENT` | Phiếu nay mang `outstanding_quantity`. **`receive_equipment`** cộng kho, trừ nợ, **không bao giờ** đụng tổng kho; **`write_off_equipment`** trừ tổng kho, ghi chú **bắt buộc**, có hộp xác nhận đỏ. Phiếu chỉ đóng khi hết nợ. `return_equipment` giữ nguyên chữ ký, nay là **vỏ bọc** của hai RPC trên |
| **F19 / TB-M09-04** | Không có đường nào tăng tổng kho | `NEEDS_IMPROVEMENT` | `adjust_equipment_stock` **hai chiều** (D-98), quyền **chặt hơn mượn/trả** — Trưởng/Phó Ban hoặc global-write. Bảng `equipment_stock_adjustments` ghi ai · bao nhiêu · vì sao · tổng kho sau khi đổi |
| **D-94 / AC-M09-30** | Ô "Người mượn" chỉ có thành viên Ban Kỹ thuật | `Q-M09-05` | `list_equipment_borrower_options` — **cửa sổ hẹp chỉ-tên** (D-97). Chọn cách này thay vì nới `app.can_access_staff` nên **nợ #13 vẫn mở**, xem dưới |
| **D-65 mức module** | Nhận lại / báo hỏng-mất không để lại vết gì | — | `equipment_loan_events`: mỗi lần là một dòng, kèm người thực hiện. Hai bảng nhật ký **chỉ SELECT** với `authenticated` |

**Năm quyết định cài đặt cần nhớ:**

1. 🔴 **Một con số không nói được hai câu khác nhau.** Gốc rễ F16 không phải "thiếu nút" mà là
   ô *"Số lượng trả được"*: điền 3 trên phiếu mượn 5 nghĩa là **"3 cái về kho, 2 cái mất vĩnh
   viễn"** — phiếu đóng ngay và tổng kho tụt 2 mà không hỏi ai. Nhưng điều người trực kho
   thường muốn nói là *"hôm nay mới mang về 3, mai trả nốt"*. Hai câu đó cùng đi qua một ô số,
   nên **mỗi lần trả dần là một lần tài sản bốc hơi khỏi sổ sách** — im lặng, không hoàn tác
   được, và không ai biết để đối chiếu.
2. **`restored_quantity` ĐỔI NGHĨA, và đó là một thay đổi cần nhớ.** Từ *"số cái trả được ở lần
   đóng phiếu"* thành *"tổng số cái đã nhận lại, cộng dồn"*. Kéo theo: nó không còn phải `null`
   khi phiếu đang mở, và `received_by` nay là **người nhận lần gần nhất** chứ không phải người
   đóng phiếu. Hai CHECK cũ phải viết lại; bất biến mới là
   `restored_quantity + outstanding_quantity <= quantity`.
3. **Hai chiều của "đổi tổng kho" là HAI NÚT, không phải một ô số nhận dấu âm.** Người trực kho
   gõ nhầm `-2` thành `2` trên một ô chung là hai cái thiết bị biến mất khỏi sổ mà nhãn nút vẫn
   nói "Nhập thêm". Nhãn nút · danh sách lý do · câu xác nhận đều nói rõ chiều nào.
4. **`describeLoanBalance` nằm ở module KHÔNG có `"use client"`** (`src/features/equipment/loan-balance.ts`).
   Đúng bài học M14-C: mọi export của một file client là *client reference*, gọi từ Server
   Component là ném lỗi kể cả với hàm thuần trả về chuỗi. Hàm này rất dễ bị một trang máy chủ
   gọi lại ở đợt C.
5. **`equipment_stock_adjustments` tham chiếu thiết bị bằng `ON DELETE RESTRICT` — cố ý.** Nhật
   ký kho không được biến mất chỉ vì ai đó xoá thiết bị. Hệ quả: fixture E2E phải dọn bảng này
   **trước** khi xoá thiết bị, nếu không bộ test chỉ chạy được một lần sau mỗi `db:reset` —
   đúng loại bẫy đã mất công ở `results.spec.ts` (M14-A) và bản tuần (M09-A).

**Ba điều đo được, không phải suy đoán:**

| # | Điều | Bằng chứng |
|---|---|---|
| 1 | 🔴 **Trả dần trước M09-B thật sự ăn vào tổng kho** | pgTAP `021` mới: mượn 5, nhận lại 3 ⇒ `available = 3`, `total` **vẫn 5**, phiếu **vẫn mở**, còn nợ 2. Cùng thao tác trên bản trước migration đóng phiếu và `total` tụt còn 3 |
| 2 | **Cửa sổ hẹp đúng là hẹp** | Cùng một JWT thành viên Ban Kỹ thuật, trong cùng một bài: `select` thẳng hồ sơ người Ban Y tế ra **0 dòng**, mà `list_equipment_borrower_options` **có** người đó. Nghĩa là D-94 đạt mà `app.can_access_staff` không bị đụng |
| 3 | **Row lock của `borrow_equipment` vẫn chịu được tranh chấp sau khi RPC bị viết lại** | Chạy lại `tests/integration/m09-equipment-concurrency.test.ts` với hai JWT thật: 1/1 xanh, đúng một phiếu, `available = 0` không âm |

**Nghiệm thu 15 mục (`11` §5) cho đợt M09-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **492 pass / 10 skip** (trước M09-B: 476/10, **+16**) · **pgTAP 599/599** (trước: 561, **+38**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ **150/150 xanh** (360 · 768 · 1366, 1 worker, 9,1 phút, trên DB vừa `db:reset` + `seed:dev`), **0 flaky**. Bài `committees.spec.ts:130` nay đi hết luồng M09-B mới: mượn cho **người ngoài Ban** (D-94) · nhận lại một phần rồi kiểm "Khả dụng 2/3" + "còn nợ 1" · báo hỏng/mất qua hộp xác nhận "giảm từ 3 xuống 2" · Trưởng Ban nhập thêm và đọc được nhật ký tổng kho. ⚠️ **Không đóng nợ #10**: lượt này chạy trên DB vừa reset — đúng điều kiện dễ xanh nhất — và nguyên nhân gốc (khẳng định chờ cứng 5 giây ở M07) chưa hề bị đụng. Một lượt xanh không phải bằng chứng đã sửa |
| Vùng chạm ≥44px | ✅ bốn nút mới (Nhận lại hàng · Báo hỏng/mất · Nhập thêm · Giảm tồn kho) đều dùng `Button size="sm"` = `min-h-control` 44px; có unit test canh cả bốn cộng nút "Ghi nhận nhận lại" |
| Không cỡ chữ <12px | ✅ `grep -rE "text-\[(8\|9\|10\|11)px\]" src/` = **0**; bậc nhỏ nhất trong file là `text-2xs` = 12px (dòng nhật ký sự kiện phiếu) |
| Không màu hardcode khi có token | ✅ grep `equipment/*.ts(x)`: **0** mã hex/rgb/hsl |
| Không `window.confirm` / `window.alert` | ✅ **0** trong `equipment-board.tsx`. Báo hỏng/mất và giảm tồn kho dùng `ConfirmDialog`, không phải `window.confirm` — đúng điều cấm thứ 8. Vẫn đúng **7 nợ cũ** (nợ #1) |
| Không `<select>` native mới | ✅ `equipment-board.tsx` nay dùng `Select` (component bọc 1 thẻ native, D-80) ở **cả 6 chỗ**; `grep "<select"` = **0** |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ mỗi câu báo **nêu tên thiết bị và con số thật** ("Đã nhận lại 3 cái … Phiếu còn nợ 2 cái." · "Tổng kho nay là 4."), phân biệt tạo/nhận/mất/nhập. Mỗi RPC đụng đúng một dòng thiết bị + một dòng nhật ký nên không có số dòng để đếm |
| Trạng thái rỗng đúng 1 trong 3 loại | — đợt B giữ câu rỗng cũ ("Không có thiết bị nào đang được mượn."); chuyển sang `EmptyState` thuộc đợt C. Thẻ "Nhật ký tổng kho" **ẩn hẳn** khi chưa có dòng nào |
| Thao tác nguy hiểm có `ConfirmDialog` | ✅ **trọng tâm của đợt.** "Báo hỏng/mất" và "Giảm tồn kho" đều mở `ConfirmDialog` nêu hậu quả **bằng tên thiết bị + con số** ("Tổng kho của **Bộ dây tín hiệu** giảm từ **5** xuống **3** … không hoàn tác được"). D-93 giữ quyền báo hỏng/mất cho mọi thành viên nên hộp thoại này là hàng rào duy nhất — có unit test canh "chưa xác nhận thì không ghi gì" |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ `equipment_loan_events` (nhận lại / báo hỏng-mất) và `equipment_stock_adjustments` (đổi tổng kho) ghi ai · bao nhiêu · vì sao · lúc nào. Cả hai **chỉ SELECT** với `authenticated`, ghi qua RPC `security definer` — pgTAP canh không INSERT tay được |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ `ConfirmDialog` dùng lại `useModalBehavior` của 0.6/0.7 (bẫy focus, `Escape` đóng **và trả focus**); có unit test canh `Escape` đóng mà không ghi gì. Mọi thứ mới khác là `<input>`/`<button>`/`Select` native |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái phiếu nói **bằng chữ** ("Đã mượn 5 · đã nhận lại 3 · còn nợ 2"); nhật ký tổng kho có **dấu +/- kèm chữ "tăng"/"giảm"**; hộp xác nhận toàn chữ |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration**, chạy sạch từ DB trống. `adjust_equipment_stock` **chặt hơn** mượn/trả (Trưởng/Phó Ban) — pgTAP canh thành viên thường nhận `42501`; `list_equipment_borrower_options` ném `42501` cho người không thao tác được kho; **D-97 canh cửa sổ hẹp không nới `app.can_access_staff`** (thành viên `select` hồ sơ Ban khác vẫn 0 dòng). Tất cả bằng **JWT vai trò thật**, không service role |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (M09-F16/F19) + `docs/02` §11.7–11.8 · `docs/03` WF-13 · `docs/05`. **Không đổi `09`/`10`/`11`** |

**Còn nợ lại từ đợt B (đều thuộc đợt C, không giấu):**

- **Chưa áp `09` cho `equipment-board.tsx`.** File vẫn dùng bí danh token cũ (`border-border`,
  `text-muted-foreground`) như phần còn lại của `/committees` — gỡ ở đợt C cùng nợ #2 và #5.
- **Trạng thái rỗng vẫn là câu chữ thường**, chưa phải `EmptyState` (đợt C, TB-M09-05/06).
  Riêng "Nhật ký tổng kho" thì **ẩn hẳn thẻ khi chưa có dòng nào** — cùng khuôn với "Lịch sử
  mượn/trả" sẵn có, không bịa một câu rỗng cho một cuốn sổ chưa có trang nào.
- **`condition_on_return` của phiếu chỉ giữ giá trị của lần ghi gần nhất.** Lịch sử đầy đủ nằm
  ở `equipment_loan_events`; giao diện đợt C nên đọc từ đó thay vì từ cột trên phiếu.
- **Người mượn đã nghỉ phục vụ hiện không tra được tên.** `list_equipment_borrower_options` chỉ
  trả nhân sự `service_status = 'active'`, nên một phiếu cũ của người đã nghỉ rơi về đường đọc
  `staff_profiles` bình thường và có thể trống. Đóng dứt điểm cùng **nợ #13**.

#### Đợt M09-C — ✅ XONG (2026-07-24) · **đóng module 2**

Chủ dự án chốt **hai quyết định** trước khi code: (1) đóng **nợ #13** ngay trong đợt này bằng cách
cho thành viên cùng Ban đọc **đầy đủ** hồ sơ nhau (**D-100**), (2) **chưa** thêm nhật ký "ai xoá"
cho nội dung Ban — hộp xác nhận là đủ (Q-M09-08 hoãn).

| Mã | Việc | Mức | Kết quả thật |
|---|---|:--:|---|
| **D-100** | Thành viên cùng Ban đọc hồ sơ nhau (nợ #13) | 🔴 thay đổi phân quyền | `app.can_access_staff` thêm nhánh thứ tư `app.shares_active_committee`. Tên thành viên Ban khác lớp không còn hiện `—`. **1 migration**, RLS negative + positive test bằng **JWT thật** (pgTAP `024`, 7 bài) |
| **TB-M09-05** | Ma sát tương xứng | `NEEDS_IMPROVEMENT` (F05/F06/F08/F10/F12) | Ô chức vụ nay **controlled + nút "Lưu chức vụ"** (hết auto-save `onChange`); **mọi** thao tác xoá (thông báo · lịch họp · công việc tuần) và **kết thúc nhiệm kỳ** đi qua `ConfirmDialog` nêu tên riêng; `ends_on` do **DB** đặt (`current_date`) qua trigger, action bỏ trường này. **1 migration** (trigger ngày kết thúc) |
| **TB-M09-06** | Bổ khuyết luồng + tabs | `NEEDS_IMPROVEMENT` (F02/F09/F18) | **Sửa Ban** (`updateCommittee`, dùng policy `committees_update_global_write` đang bỏ không, không cho đổi `code`); **sửa lịch họp** (`saveCommitteeMeeting` nhận `id`, dùng `committee_meetings_update_leaders`); lịch họp tách **"Sắp diễn ra" / "Đã qua"**; trang chi tiết chuyển sang **tabs** (Tổng quan · Thành viên · Thông báo · Lịch họp · Công việc tuần · Thiết bị); thẻ Ban hiện **tên Trưởng/Phó** (nhờ D-100) |
| **Áp `09` + nợ #7** | Token + component | — | Toàn bộ file `committees/` gỡ bí danh token cũ (trả phần **nợ #2**); dùng thật `Tabs`, `EmptyState`, `Select`, `ConfirmDialog`, `Textarea` (trả phần **nợ #7**) |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **D-100 nới quyền đọc DÒNG, không lọc cột.** RLS là row-level nên cho đọc hồ sơ cùng Ban là mở
   **cả dòng** — số điện thoại, ngày sinh, địa chỉ. Đó đúng là điều chủ dự án chọn (thành viên Ban
   cần liên lạc), khác hẳn cửa sổ hẹp chỉ-tên của D-97. `shares_active_committee` dùng lại
   `app.member_committee_ids()` (security definer, không đệ quy vào chính policy `staff_profiles`),
   và nhiệm kỳ đã kết thúc không tính ở **cả hai** phía — có pgTAP canh đúng điều đó.
2. **`ends_on` phải là TRIGGER, không phải cột DEFAULT.** Kết thúc nhiệm kỳ là một UPDATE
   (`is_active` → false), mà DEFAULT chỉ áp khi INSERT. Trigger đặt `ends_on = current_date` bằng
   **đồng hồ của DB** — cùng mốc với `starts_on` — nên không còn cảnh ngày UTC ở trình duyệt nhỏ hơn
   `starts_on` và vi phạm `date_order` (23514) như `08_ACCEPTANCE_CRITERIA` §1 cảnh báo.
3. **Bảng kho đi vào tab "Thiết bị" dưới dạng `ReactNode` dựng sẵn ở máy chủ.** Trang chi tiết
   (server) gọi `getEquipmentBoard` rồi truyền `<EquipmentBoard/>` xuống `CommitteeWorkspace` như một
   prop — cùng khuôn với nút chuông và `ContextIndicator` của M14. Nhờ vậy `EquipmentBoard` chỉ mount
   khi tab được mở, mà `router.refresh()` vẫn cập nhật đúng vì vòng round-trip ở máy chủ không đổi.
4. **Ô chức vụ controlled đồng bộ lại theo props sau `router.refresh()`.** `useEffect` đặt lại state
   theo `member.position`; khi lưu lỗi thì khôi phục giá trị cũ (không refresh nên props không đổi,
   `onError` kéo state về). Đúng yêu cầu "khi lỗi, khôi phục giá trị cũ" của TB-M09-05.

**Một lỗi thật bắt được khi chạy E2E — không phải đọc mã:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **Tên Ban thành tiêu đề TRÙNG.** Tab "Tổng quan" đặt `<CardTitle>{committee.name}</CardTitle>`, mà `PageHeader` đã là `<h1>` cùng tên ngay trên — hai heading trùng nguyên văn, đúng lỗi a11y mà mục 0.7 đã sửa cho vỏ. `main.getByRole("heading", { name: "Ban Sinh hoạt" })` khớp **2 phần tử** ⇒ E2E rớt cả 3 viewport | lượt E2E đầu của M09-C (rớt ở dòng khẳng định heading) | Thẻ Tổng quan mang tiêu đề khác — **"Thông tin Ban"** (`h2`); tên Ban chỉ còn ở `<h1>` |

**Trả một phần nợ #10** (không đóng — vẫn thuộc M07): các khẳng định "hiện sau khi làm mới" của
`committees.spec.ts` (khả dụng/tổng kho, tiêu đề vừa đăng) nay đi qua helper `expectSoon` chờ tới
20 giây thay vì cứng 5 giây. Lý do: câu báo thành công hiện ngay (client state) nhưng con số dẫn
xuất chỉ về sau `router.refresh()`; dưới tải nặng vòng đó vượt 5 giây và bộ test rớt ở **một dòng
khác nhau mỗi lượt** (đo được: 205 → 211 → 322) dù ứng dụng hoàn toàn đúng. Đây là đúng cách trả nợ
#10 mà chính nợ đó đề xuất ("nâng thành helper thay chờ cứng"), áp cho spec này; phần `window.confirm`
ở `results.spec.ts`/M07 vẫn còn.

**Nghiệm thu 15 mục (`11` §5) cho đợt M09-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **498 pass / 10 skip** (trước M09-C: 492/10, **+6**) · **pgTAP 610/610** (trước: 599, **+11**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ **`committees.spec.ts` 9/9 xanh** trên 360 · 768 · 1366 (1 worker, 1,5 phút, lượt cô lập sau khi vá lỗi heading và nới `expectSoon`). Bài chi tiết Ban đi hết luồng tabs mới ở cả 3 viewport, mỗi tab có `expectNoHorizontalOverflow` riêng. ⚠️ Lượt đầy đủ còn rớt ở **`results.spec.ts` (M07 bảng điểm) = nợ #10**, không thuộc M09-C |
| Vùng chạm ≥44px | ✅ nút "Lưu chức vụ"/"Kết thúc"/"Sửa"/"Xóa" dùng `Button size="sm"` = `min-h-control` 44px; tab `min-h-11`; `Select`/`Textarea` `min-h-control` |
| Không cỡ chữ <12px | ✅ `grep -rE "text-\[(8\|9\|10\|11)px\]" src/features/committees` = **0** |
| Không màu hardcode khi có token | ✅ grep `committees/`: **0** mã hex/rgb/hsl; đã gỡ hết bí danh token cũ khỏi khu này |
| Không `window.confirm` / `window.alert` | ✅ **0** trong `committee-workspace.tsx`; mọi xác nhận dùng `ConfirmDialog`. Vẫn đúng **7 nợ cũ** (nợ #1) |
| Không `<select>` native mới | ✅ ba `<select>` trần cũ của `committee-workspace.tsx` nay là `Select`; `grep "<select" src/features/committees` = **0** |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ mỗi câu báo nêu đúng phạm vi ("Đã đổi chức vụ của {tên} thành {chức vụ}.", "Đã cập nhật lịch họp."), phân biệt tạo/cập nhật. Mỗi thao tác đụng đúng một dòng nên không có số dòng để đếm |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ `EmptyState variant="no-data"` cho Ban chưa có nhân sự/thông báo/buổi họp, **nêu tên Ban cụ thể** ("Ban Sinh hoạt chưa đăng thông báo nào.") |
| Thao tác nguy hiểm có `ConfirmDialog` | ✅ xoá thông báo/lịch họp/công việc tuần và kết thúc nhiệm kỳ đều mở `ConfirmDialog` nêu **tên riêng** ("Kết thúc nhiệm kỳ của {tên} tại {Ban}? Lịch sử vẫn được giữ."). Có unit test canh "chưa xác nhận thì không gọi action" |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — đợt C không mở thêm đường đọc dữ liệu nhạy cảm nào. Q-M09-08 (nhật ký xoá nội dung Ban) chủ dự án **hoãn** — hộp xác nhận là đủ |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ `Tabs` roving tabindex + mũi tên + Home/End (test của 0.8); `ConfirmDialog` dùng lại `useModalBehavior` (bẫy focus, `Escape` đóng **và trả focus**); nút "Sửa" chức vụ là `<button>` native |
| Không dùng màu làm tín hiệu duy nhất | ✅ tab đang chọn có **ba** tín hiệu (gạch chân + màu chữ + `aria-selected`); trạng thái Ban nói bằng chữ ("Đang hoạt động"/"Ngưng hoạt động") kèm badge; lịch họp phân nhóm bằng **tiêu đề chữ** "Sắp diễn ra"/"Đã qua" |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **D-100 là một lần NỚI quyền** — kiểm bằng **JWT thật** (pgTAP `024`): A thấy B cùng Ban (kể cả số điện thoại), KHÔNG thấy C khác Ban, nhiệm kỳ đã kết thúc không mở quyền, đối xứng hai chiều. `updateCommittee`/`saveCommitteeMeeting(id)` dựa vào policy sẵn có, RLS là hàng rào cuối. **2 migration**, chạy sạch từ DB trống |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` + `docs/05` (D-100). **Không đổi `09`/`10`/`11`** |

**Còn nợ lại sau khi M09 đóng:** nợ #10 (đã trả phần `committees.spec`, phần `window.confirm` M07 còn) · nợ #11 (chưa chạy `perf:smoke`) · nợ #2/#5 (các module khác) · nợ #7 (`Toast`/`DataTable`/`FilterBar`… chờ module có chỗ dùng). **Nợ #13 ĐÓNG.**

---

### Module 3 — M01 Auth & Tài khoản · chia ba đợt

`07_IMPLEMENTATION_IMPACT.md` §5 xếp TB-01 (cấp tài khoản tại hồ sơ) là cỡ **L** và **chồng lấn
nặng sang M04** ("phải làm cùng lúc, không tách được"), nên M01 chia ba đợt. Chủ dự án chốt **bốn
câu NC (Q1–Q4)** trước khi code, đúng cách M09 đã làm.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M01-A** | **Nhóm bảo mật độc lập, ít rủi ro:** TB-04 (bắt buộc mật khẩu hiện tại khi tự đổi) · nhật ký thao tác tài khoản (D-65) · xóa tài khoản qua hộp thoại gõ lại tên (**nợ #1**) · danh sách tài khoản tìm kiếm/lọc/phân trang + Việt hóa + cờ "chưa đổi MK" · bỏ 'locked' khỏi UI (Q4) · TB-03 hoàn thiện `/account` · guard ngoài `try` cho `auth/server/actions.ts` (**nợ #14**) | ✅ **XONG 2026-07-24** |
| **M01-B** | **Cấp tài khoản tại hồ sơ:** trang `/staff/[id]` + TB-01 + TB-05 (đổi vai trò không mất tài khoản) + **trần vai trò** (Q2/D-102). Chồng lấn M04 | ✅ **XONG 2026-07-24** |
| **M01-C** | **Rủi ro cao:** giữ lịch sử vai trò khi xóa tài khoản (Q3/D-101 — đổi FK `cascade` → `set null`, ảnh hưởng dữ liệu hiện có) | ✅ **XONG 2026-07-24** |

**Bốn quyết định chủ dự án chốt 2026-07-24 (D-101…D-103; Q1 đã nằm trong TB-04):**

| Mã | Câu hỏi (NC) | Chốt | Làm ở |
|---|---|---|---|
| **D-101** (Q3) | Xóa tài khoản có xóa lịch sử vai trò không? | **Giữ lại lịch sử** (đổi cascade → không xóa cứng) | M01-C |
| **D-102** (Q2) | Có chặn tạo Super Admin thứ hai / cấp vai trò ≥ mình? | **Có — thêm trần vai trò** | M01-B |
| **D-103** (Q4) | Trạng thái 'locked' xử lý sao? | **Bỏ khỏi giao diện**, chỉ active/disabled | M01-A |
| — (Q1) | Đổi mật khẩu tự nguyện có cần mật khẩu hiện tại? | **Có** (đã làm ở TB-04) | M01-A |

#### Đợt M01-A — ✅ XONG (2026-07-24)

**Một phần M01 đã trả trước ở M14, không làm lại:** M01-F11 (đăng xuất) xong ở **M14-A** ·
M01-F10 (`/account`) làm mức tối thiểu ở **M14-C**. M01-A hoàn thiện phần còn lại.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **TB-04** | Đổi mật khẩu tự nguyện bắt buộc mật khẩu hiện tại (đóng M01-F02 / 5W-04) | `changeOwnPassword` phân hai chế độ theo `mustChangePassword`: lần đầu giữ form 2 ô; tự nguyện thêm ô "Mật khẩu hiện tại", xác thực lại bằng `signInWithPassword` trên **client dùng-một-lần** (`persistSession:false`, không đụng cookie phiên), và mật khẩu mới phải khác mật khẩu cũ (AC-03.3). Sai → "Mật khẩu hiện tại không đúng.", không đổi |
| **D-65** | Nhật ký thao tác tài khoản | Bảng `account_audit_events` **append-only** (trigger chặn UPDATE/DELETE cho mọi vai trò, kể cả chủ bảng), **chỉ Super Admin đọc**. KHÔNG FK sang `profiles` + ảnh chụp `*_username` để bản ghi sống sót khi tài khoản đích bị xóa. Sáu action tài khoản đều ghi; **xóa** ghi nhật ký TRƯỚC khi xóa (không ghi được thì không xóa) |
| **TB-06 / nợ #1** | Xóa tài khoản qua hộp thoại gõ lại tên | Thay `window.confirm` bằng `Dialog` (bẫy focus, `Escape` trả focus) + ô gõ lại tên đăng nhập; nút xác nhận **khóa tới khi gõ đúng** (AC-05.3). `grep window.confirm src/features/auth` = **0** (còn lại 6 nợ: M07 4 · M06 2) |
| **TB-06** | Danh sách tài khoản (M01-F09) | Tìm kiếm (bỏ dấu tiếng Việt) + lọc theo vai trò/trạng thái + phân trang 8/trang; Việt hóa nhãn trạng thái; cờ "Chưa đổi mật khẩu". Lọc là hàm THUẦN `account-directory.ts` (unit test riêng) |
| **Q4 / D-103** | Bỏ 'locked' khỏi UI | Bộ đặt trạng thái dùng `accountStatusUpdateSchema` chỉ nhận active/disabled; dữ liệu cũ 'locked' vẫn hiện đúng tên. Kèm bù trừ AC-05.1 (khóa Auth hoàn nguyên nếu `profiles` update lỗi) |
| **TB-03** | Hoàn thiện `/account` (M01-F10) | Thêm phạm vi (lớp/ngành) + trạng thái mật khẩu; giữ hai thao tác Đổi mật khẩu · Đăng xuất (AC-M01-06) |
| **Nợ #14** | Guard ngoài `try` | 6 admin action + `changeOwnPassword` tách guard (`requireRouteAccess`/`requireAuthContext`) ra NGOÀI `try` để `catch` không nuốt `redirect()` của Next (D-96). Trả phần `auth/server/actions.ts` của nợ #14 |

**Ba quyết định cài đặt cần nhớ:**

1. **Xác thực mật khẩu hiện tại trên MỘT client dùng-một-lần.** `signInWithPassword` trên client
   phiên hiện tại sẽ ghi đè cookie phiên; dùng client `persistSession:false` để nhập sai mật khẩu
   không làm rớt phiên người đang đăng nhập.
2. **Bảng nhật ký KHÔNG có FK sang `profiles`.** Xóa `auth.users` cascade xóa `profiles`; một FK
   `on delete set null` vừa mất thông tin ai bị xóa, vừa xung đột với trigger append-only (set null
   là một UPDATE → bị chặn → chính lệnh xóa tài khoản sẽ hỏng). Lưu id trần + ảnh chụp tên.
3. **Guard tách hai phần.** Phần có thể `redirect()` (hết phiên / không đủ quyền) ra NGOÀI `try`;
   phần kiểm nghiệp vụ đích (`loadManageableAccount`, ném `AppError`) ở TRONG `try` để trả **kết quả
   lỗi** cho người dùng chứ không chuyển trang.

**Một lỗi bắt được khi chạy E2E — ở bộ test, không ở ứng dụng:** locator `getByLabel("Mật khẩu mới")`
trúng cả ô "Xác nhận mật khẩu mới" (khớp chuỗi con) ⇒ rớt 3 viewport; sửa bằng `{ exact: true }`.

**Nghiệm thu 15 mục (`11` §5) cho đợt M01-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **508 pass / 10 skip** (trước M01-A: 498/10, **+10**) · **pgTAP 618/618** (trước: 610, **+8**: `026` 6 bài + `003` bổ sung 2) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ **27/27 xanh** trên 360 · 768 · 1366 (1 worker): `account-security.spec.ts` 9/9 (TB-04 sai mật khẩu · `/account` · hộp thoại xóa) · `responsive.spec.ts` 9/9 (đo `/account` + `/admin` không tràn ngang) · `security.spec.ts` 9/9. Không chạy lại toàn bộ (module khác không đụng; `results`/`teaching-plan` là nợ #10) |
| Vùng chạm ≥44px | ✅ `responsive.spec` `expectTapTargets` quét `/account` + `/admin` 3 viewport: `Select` lọc = `h-control` 44px · nút phân trang · nút xóa · ô gõ lại tên trong dialog (`Input` `h-control`) |
| Không cỡ chữ <12px | ✅ `grep -rE "text-\[(8\|9\|10\|11)px\]"` file mới/sửa = **0** |
| Không màu hardcode khi có token | ✅ grep hex/rgb/hsl ở `account-admin-panel` · `account-directory` · `/account` · `change-password-form` = **0**; đã đổi `border-warning/40` (nợ #5 hỏng-im-lặng) sang token đặc |
| Không `window.confirm` / `window.alert` | ✅ `grep window.confirm src/features/auth` = **0** (call); nợ #1 còn đúng **6** (M07 4 · M06 2) |
| Không `<select>` native mới | ✅ bộ lọc dùng `Select` (bọc native, D-80); `grep "<select" account-admin-panel` phần list = 0. Form **tạo** tài khoản giữ thẻ native cũ — chuyển ở M01-B khi cấp tài khoản dời sang `/staff/[id]` |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ mỗi action nêu kết quả bằng chữ; mỗi thao tác đụng đúng 1 dòng + 1 dòng nhật ký nên không có số dòng để đếm |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ danh sách rỗng: "Không có tài khoản nào khớp bộ lọc." (no-data nêu phạm vi lọc) |
| Thao tác nguy hiểm có `ConfirmDialog` | ✅ xóa tài khoản: hộp thoại nêu **tên hiển thị + tên đăng nhập**, phải **gõ lại tên** mới bấm được — mạnh hơn một hộp xác nhận thường |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ 6 action tài khoản ghi `account_audit_events` (ai · với ai · thao tác gì · lúc nào); **xóa ghi trước khi xóa**. Không ghi mật khẩu/token |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ hộp thoại xóa dùng lại `useModalBehavior` (bẫy focus, `Escape` đóng **và trả focus**); mọi thứ khác là `Input`/`Select`/`button` native |
| Không dùng màu làm tín hiệu duy nhất | ✅ badge trạng thái có **icon riêng + chữ**; cờ "Chưa đổi mật khẩu" bằng chữ; danh sách lọc phản hồi bằng số đếm |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration** (`account_audit_events`), chạy sạch từ DB trống. pgTAP `026`: **chỉ Super Admin đọc** (Cha sở global-read cũng **0 dòng**), append-only chặn UPDATE/DELETE kể cả chủ bảng. pgTAP `003` bổ sung AC-03.4 (`complete_password_change` disabled → 42501, uid null → 42501). Guard action nay là `requireRouteAccess("/admin")`; `security.spec` non-SA → `/access-denied`. Tất cả bằng **JWT thật**, không service role |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` |

**Còn nợ lại sau đợt M01-A (đều thuộc M01-B/C, không giấu):**

- **M01-F03 tạo tài khoản** (CRITICAL) — trần vai trò (Q2/D-102) và dời form cấp tài khoản sang
  `/staff/[id]` (TB-01) thuộc **M01-B**. Form tạo hiện tại vẫn ở `/admin`, vẫn dùng `<select>` native cũ.
- **M01-F08 xóa tài khoản** — M01-A đã thêm hộp thoại gõ-lại-tên + nhật ký, nhưng **vẫn xóa lịch sử
  vai trò** (cascade). Đóng dứt điểm ở **M01-C** (D-101).
- **M01-F12 đổi vai trò** (`assignPrimaryRole`) — thuộc **M01-B**.
- **Nợ #14** mới trả `auth/server/actions.ts`; 10 file `server/actions.ts` khác vẫn còn.

#### Đợt M01-B — ✅ XONG (2026-07-24)

**Chồng lấn nặng M04 — làm cùng lúc** (đúng `07` §3). Trước khi code, chủ dự án chốt AC-01.7
qua một câu hỏi: trên trang chi tiết mới, **chỉ vai trò quản trị/toàn xứ đoàn** (= `can_global_read`)
thấy trường nhạy cảm (**D-104**) — vì D-100 (cùng Ban đọc đầy đủ hồ sơ) khiến trang này có nguy cơ
thành mặt lộ mới trên máy dùng chung.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **TB-01** | Cấp tài khoản ngay tại `/staff/[id]` (M01-F03) | Trang chi tiết mới 4 khối (hồ sơ · trạng thái phục vụ · phân công lớp · tài khoản). `provisionAccountForStaff` payload GỌN (username/tên suy từ `staff_profiles`, client không gửi). Vai trò lọc theo phân công lớp (capacity → role lớp; chưa có lớp → vai trò toàn cục/ngành). **Pre-check AC-01.3**: role lớp thiếu phân công đúng capacity báo lỗi cụ thể **trước khi** tạo Auth user (BR-A17 ở DB là chốt cuối). Mật khẩu tạm hiện một lần + nút Sao chép |
| **TB-05** | Đổi vai trò giữ đăng nhập (M01-F12) | RPC `assign_primary_role` (**1 migration**): khử active vai trò cũ (`ends_on = greatest(starts_on, startsOn-1)`) rồi chèn vai trò mới, **nguyên tử** trong một hàm `security definer`. Lỗi bước chèn ⇒ rollback ⇒ vai trò cũ vẫn active (AC-04.2). Gọi qua **client người dùng** để RPC tự kiểm `is_super_admin()` theo JWT. Nút "Đổi vai trò" ở khối tài khoản |
| **D-102** | Trần vai trò | `ROLE_RANK` + `canActorAssignRole` (`roles.ts`): không cấp `super_admin`, không cấp vai trò ≥ mình. Áp ở **3 tầng**: Zod (chỉ nhận vai trò gắn hồ sơ GLV), server action (`provisionAccountForStaff` · `assignPrimaryRole` · **cả `adminProvisionAccount` cũ trên `/admin`**), và DB (RPC chặn `super_admin`) |
| **AC-01.7** | Không rò trường nhạy cảm (**D-104**) | `canReadStaffSensitive` = `GLOBAL_ROLES`. `getStaffDetail` **không select** ngày sinh/địa chỉ/email và **không nạp** khối tài khoản khi người xem không đạt `can_global_read` — ẩn ở payload chứ không chỉ ẩn nút |
| **M04-F03/F06** | Sửa hồ sơ · đổi lớp | `updateStaff` (trước là action chết) kích hoạt qua khối "Sửa hồ sơ"; phân công/kết thúc phân công ngay trên trang chi tiết; đổi lớp = kết thúc → phân công mới → "Đổi vai trò" |
| **Nợ #14 (staff)** | Guard ngoài `try` | `requireRouteAccess("/staff")` ra NGOÀI `try` (D-96); quyền ghi hẹp kiểm bằng `assertStaffWrite` TRONG `try`. `*FromForm` hết nuốt lỗi: `createStaff` → redirect `/staff/[id]`, các form khác nêu lỗi qua `?error=` |

**Ba quyết định cài đặt cần nhớ:**

1. **`assign_primary_role` gọi qua CLIENT NGƯỜI DÙNG, không service role.** RPC tự kiểm
   `app.is_super_admin()` theo `auth.uid()`; gọi bằng service role thì `auth.uid()` null ⇒ luôn bị
   từ chối. Cùng khuôn với `end_class_staff_assignment`.
2. **Trần vai trò áp cả ba tầng, kể cả màn hình `/admin` cũ.** Nếu chỉ chặn ở `/staff/[id]` thì
   `adminProvisionAccount` vẫn tạo được Super Admin thứ hai — nên thêm cùng chốt chặn vào đó.
   (Dropdown `/admin` vẫn liệt kê `super_admin` nhưng server từ chối; lọc dropdown để sau, không phải lỗ hổng.)
3. **Trường nhạy cảm ẩn ở PAYLOAD, không chỉ ở giao diện** (AGENTS §5). Đồng nghiệp cùng lớp /
   thành viên cùng Ban đọc được DÒNG qua RLS (kể cả nhánh D-100), nhưng `getStaffDetail` không select
   các cột đó khi người xem không đạt `can_global_read`.

**Nghiệm thu 15 mục (`11` §5) cho đợt M01-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **523 pass / 10 skip** (trước M01-B: 508/10, **+15**) · **pgTAP 634/634** (trước: 618, **+16**: `027`) · build ✓ **28 trang tĩnh + route động `/staff/[staffId]`** |
| E2E responsive 3 viewport, không tràn ngang | ✅ **36/36 xanh** trên 360 · 768 · 1366 (1 worker): `staff-detail.spec.ts` 9/9 (gồm kiểm tràn ngang trang chi tiết bản đầy đủ) · `security.spec.ts` 9/9 (thêm `/staff/<uuid rác>`) · `account-security.spec.ts` 9/9 · `responsive.spec.ts` 9/9 |
| Vùng chạm ≥44px | ✅ `Select`/`Input`/`Button` dùng token `h-control` 44px; `responsive.spec` `expectTapTargets` quét `/staff` |
| Không cỡ chữ <12px | ✅ lint rule canh; không thêm bậc dưới `text-2xs` |
| Không màu hardcode khi có token | ✅ grep hex/rgb/hsl ở file mới (`staff-account-panel`, `staff-profile-editor`, `/staff/[staffId]`) = **0** |
| Không `window.confirm` / `window.alert` | ✅ dùng `Dialog`/`ConfirmDialog`; `grep window.confirm` file mới = 0 |
| Không `<select>` native mới | ✅ dialog cấp/đổi vai trò dùng `Select` (bọc native, D-80); form phân công lớp trên trang chi tiết **tái dùng** `<select>` như trang danh sách hiện có (chạy không cần JS), không phải thẻ trần MỚI ngoài mẫu |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ mọi action nêu kết quả bằng chữ; `updateStaff` kiểm số dòng (0 dòng = `RESOURCE_NOT_FOUND`); provision/assign đụng đúng số dòng cần |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ "Chưa có phân công lớp nào."; "Chưa có tài khoản" |
| Thao tác nguy hiểm có `ConfirmDialog` | ✅ vô hiệu hóa/kích hoạt tài khoản qua `ConfirmDialog` nêu **tên đăng nhập** |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ `provisionAccountForStaff` ghi `provision`; `assignPrimaryRole` ghi **`assign_role`** (giá trị enum mới bổ sung ở migration M01-B) |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ dialog dùng lại `useModalBehavior` (bẫy focus, `Escape` đóng + trả focus) |
| Không dùng màu làm tín hiệu duy nhất | ✅ badge trạng thái tài khoản/phục vụ có chữ; "Đã có tài khoản/Chưa có tài khoản" bằng chữ |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration** (`assign_primary_role`). pgTAP `027` bằng **JWT thật**: non-SA (Cha sở) → `42501`; cấp `super_admin` → `42501`; tự đổi mình / đổi Super Admin khác → `42501`; đổi lớp chưa phân công → `23514` **và vai trò cũ vẫn active** (nguyên tử); BR-A17 chèn trực tiếp thiếu/sai capacity → `23514`. E2E: GLV lớp không thấy trường nhạy cảm/khối tài khoản; non-SA không thấy khối tài khoản; SA thấy |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (đóng M01-F03·F12, M04-F03·F06) |

**Còn nợ lại sau đợt M01-B (không giấu):**

- **M01-F08 / M01-C** — xóa tài khoản vẫn cascade xóa lịch sử vai trò (D-101, đổi FK `set null` +
  cho `profile_id` nullable, ảnh hưởng RLS `role_assignments_select_self_or_global`). **Rủi ro cao, đợt C.**
- **Cảnh báo trùng hồ sơ** (BR-TB-05, cảnh báo mềm khi trùng SĐT/họ tên+ngày sinh) chưa làm — để **M04**.
- **Dropdown vai trò ở `/admin`** vẫn liệt kê đủ 14 vai trò (server đã từ chối `super_admin`); lọc theo
  `assignableRolesForActor` là việc dọn của **M04** khi thu hẹp panel `/admin`.
- **Nợ #14** nay đã trả `auth` + `staff` (+ `committees`/`equipment` ở M09); còn 9 file `server/actions.ts`.

#### Đợt M01-C — ✅ XONG (2026-07-24) · **đóng module 3**

Đợt cuối M01, đúng một việc đã chốt: **D-101 (Q3) — xóa tài khoản GIỮ lịch sử vai trò.**
Bảng `role_assignments` tự đặt tên là *"Primary role history"*, nhưng FK `profile_id ... on
delete cascade` xóa sạch cuốn sổ đó ngay khi tài khoản đăng nhập bị xóa. Chủ dự án chốt: xóa
tài khoản chỉ gỡ khả năng đăng nhập; hồ sơ nghiệp vụ **và** lịch sử vai trò vẫn còn — cùng
khuôn với `staff_profiles`/`guardians`/`students` vốn đã `on delete set null` từ Phase 1.

**Không đụng UI, không đụng code ứng dụng** (file TS duy nhất đổi là `src/types/database.ts` do
regenerate). Đây là một thay đổi thuần **DB + RLS**, nên bằng chứng nằm ở pgTAP xóa tài khoản
thật, không ở E2E.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **D-101 / Q3** | Xóa tài khoản giữ lịch sử vai trò | FK `role_assignments_profile_id_fkey` đổi `on delete cascade` → **`on delete set null`**; `profile_id` thành **nullable**. Xóa `auth.users` nay set-null dòng lịch sử thay vì xóa dây chuyền. **1 migration** (`20260724001000_role_history_preserved_on_delete.sql`) |
| **M01-F08** | Đóng dứt điểm luồng xóa | M01-A đã có hộp thoại gõ-lại-tên + nhật ký; M01-C là mảnh cuối — lịch sử vai trò **không còn bốc hơi** khi xóa. AC-05.3 nay đúng cho **cả** `role_assignments` (trước chỉ đúng cho `staff_profiles`/`guardians`/`students`) |

**Ba quyết định cài đặt cần nhớ:**

1. 🔴 **Hai trigger liên kết chạy `before update OF profile_id` là cái bẫy thật của đợt này.**
   `validate_ownership_role_link` và `validate_staff_role_link` đòi mỗi vai trò active phải có
   `guardians`/`students`/`staff_profiles` khớp `profile_id`. Khi FK set-null ô `profile_id` của
   một dòng vai trò **đang active** (GLV/lãnh đạo/lớp, hoặc phụ huynh/thiếu nhi), `new.profile_id`
   đã là NULL nên `where profile_id = new.profile_id` không khớp gì ⇒ chúng ném `*_PROFILE_REQUIRED`
   và **làm hỏng luôn lệnh xóa tài khoản**. Nếu chỉ đổi FK mà quên hai trigger này thì xóa bất kỳ
   tài khoản GLV/phụ huynh nào cũng thất bại — mà đọc mỗi migration đổi FK thì không thấy. Thêm chốt
   `new.profile_id is not null`: dòng lịch sử mồ côi (đã mất chủ) không cần liên kết nào.
2. **RLS `role_assignments_select_self_or_global` GIỮ NGUYÊN — không rewrite policy đang đúng.**
   `profile_id = auth.uid() or app.can_global_read()`: với `profile_id` NULL, vế `NULL = <uuid>`
   ra NULL (không phải true), nên dòng mồ côi **chỉ nhóm đọc-toàn-cục thấy**, người thường không
   thấy — đúng ý D-101 (giữ lịch sử cho quản trị rà soát, không rò cho người dùng thường). pgTAP
   `028` khóa lại bất biến này bằng JWT thật hai chiều.
3. **KHÔNG ép `is_active = false` cho dòng mồ côi.** Nó không còn khớp `auth.uid()` của ai nên vô
   hại về chức năng (`app.current_role()`/`current_sector_id()`/`current_class_id()` đều lọc
   `profile_id = auth.uid()`), và giữ nguyên thì lịch sử trung thực với thời điểm xóa. Unique index
   `role_assignments_one_active_per_profile_idx` trên `(profile_id) where is_active` cho phép **nhiều
   dòng NULL cùng active** (NULLS DISTINCT), nên nhiều tài khoản bị xóa không đụng nhau — pgTAP `028`
   xóa ba tài khoản active liên tiếp và đo đúng 3 dòng mồ côi active cùng tồn tại.

**Ba điều đo được, không phải suy đoán (pgTAP `028`, xóa `auth.users` thật):**

| # | Điều | Bằng chứng |
|---|---|---|
| 1 | 🔴 **Xóa tài khoản GLV/phụ huynh không còn bị trigger chặn** | `delete from auth.users` cho một thư ký (có staff_profile) và một phụ huynh (có guardians) đều `lives_ok`. Trước khi vá hai trigger, chính hai lệnh này ném `STAFF_PROFILE_REQUIRED`/`GUARDIAN_PROFILE_REQUIRED` |
| 2 | **Lịch sử vai trò sống sót, chỉ mất chủ** | Xóa ba tài khoản: tổng số dòng `role_assignments` **giữ nguyên 6** (không dòng nào biến mất); cả dòng active lẫn dòng lịch sử inactive đều còn với `profile_id IS NULL`. `staff_profiles`/`guardians` cũng còn, chỉ bị bỏ link (AC-05.3) |
| 3 | **Dòng mồ côi fail-closed đúng chiều** | JWT phụ huynh còn sống chỉ thấy **1** vai trò của chính mình (không thấy 4 dòng mồ côi); JWT Cha sở (đọc toàn cục) thấy đủ **4** dòng mồ côi. `app.current_role()` vẫn đúng cho cả hai |

**Nghiệm thu 15 mục (`11` §5) cho đợt M01-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ (đổi `profile_id` sang nullable không phá TS) · unit **523 pass / 10 skip** (không đổi — M01-C là thay đổi DB, bằng chứng ở pgTAP) · **pgTAP 651/651** (trước: 634, **+17**: `028`) · build ✓ **28 trang tĩnh + route động `/staff/[staffId]`** |
| E2E responsive 3 viewport, không tràn ngang | ✅ **27/27 xanh** trên 360 · 768 · 1366 (1 worker): `account-security.spec.ts` 9/9 · `security.spec.ts` 9/9 · `responsive.spec.ts` 9/9. M01-C **không đổi UI** nên không có màn hình mới để đo; chạy lại subset admin/security để chứng minh **không hồi quy** sau khi đổi FK. Không chạy `results`/`teaching-plan` (nợ #10, không liên quan) |
| Vùng chạm ≥44px | — không áp dụng: đợt C không thêm/đổi phần tử giao diện nào |
| Không cỡ chữ <12px | — không áp dụng: 0 file giao diện đụng tới |
| Không màu hardcode khi có token | — không áp dụng: 0 file giao diện |
| Không `window.confirm` / `window.alert` | ✅ không thêm; nợ #1 giữ đúng **6** (M07 4 · M06 2) |
| Không `<select>` native mới | ✅ không thêm |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | — đợt C không thêm thao tác ghi mới. Luồng xóa tài khoản (M01-A) không đổi ở tầng ứng dụng; chỉ hành vi FK dưới DB đổi |
| Trạng thái rỗng đúng 1 trong 3 loại | — không áp dụng |
| Thao tác nguy hiểm có `ConfirmDialog` | ✅ hộp thoại gõ-lại-tên khi xóa (M01-A) vẫn là hàng rào; đợt C **giảm** mức phá huỷ của chính thao tác đó (lịch sử vai trò không còn bị xóa theo) |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ xóa tài khoản vẫn ghi `account_audit_events` TRƯỚC khi xóa (M01-A); bảng nhật ký không FK sang `profiles` nên sống sót — không đụng ở đợt C |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | — không áp dụng: 0 thay đổi giao diện |
| Không dùng màu làm tín hiệu duy nhất | — không áp dụng |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **đây là trọng tâm.** **1 migration**, chạy sạch từ DB trống. pgTAP `028` bằng **JWT thật**: dòng mồ côi fail-closed (người thường 0, đọc-toàn-cục thấy), xóa GLV/phụ huynh không bị hai trigger chặn, lịch sử giữ nguyên. **Chạy lại TOÀN BỘ pgTAP** vì `role_assignments` là nền của mọi RLS qua `app.current_role()` — **651/651 xanh**, không hồi quy policy nào |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (đóng M01-F08). **Không đổi `09`/`10`/`11`** |

**Còn nợ lại sau khi M01 đóng (đều dời sang M04, không giấu):** cảnh báo trùng hồ sơ (BR-TB-05) ·
lọc dropdown vai trò `/admin` theo `assignableRolesForActor` · thu hẹp `AccountAdminPanel` về tra
cứu/ngoại lệ · nợ #14 còn 9 file `server/actions.ts` · nợ #11 (`perf:smoke` chưa đo) · nợ #2/#5/#7/#10.

> **Module 3 (M01) ĐÓNG.** Cả ba đợt xong; module tiếp theo là **M04 Nhân sự** (`11` §3) — đã trả
> trước phần lớn giao diện qua M01-B (`/staff/[id]`, `updateStaff`, phân công lớp).

---

### Module 4 — M04 Nhân sự · chia ba đợt

`07_IMPLEMENTATION_IMPACT.md` §6 xếp TB-M04-00 (phản hồi thao tác ghi) làm **chốt chặn của mọi
việc khác**: không có phản hồi thì không viết được E2E, không xác minh được bất kỳ thay đổi nào
sau đó. Ba đợt vì thế chia theo trục *"chữa cái nói dối trước, làm đẹp sau"*.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M04-A** | **Chuyển lớp một bước** (D-105, đóng M04-F06) · phản hồi thật cho mọi thao tác ghi (TB-M04-00, đóng 5W-05) · hộp xác nhận nói đúng hệ quả (TB-M04-05) · vá 5 lỗ kiểm thử phân quyền S2·S3·S4·S8·S9 | ✅ **XONG 2026-07-24** |
| **M04-B** | Danh sách `/staff` dùng được (TB-M04-04 + **D-108** ẩn người đã nghỉ + **D-110** ba mức hiện tài khoản) · chống trùng hồ sơ (TB-M04-03) · **xóa hồ sơ chưa từng dùng** (**D-106/D-109**) · thay ô chọn thô bằng component đã duyệt | ✅ **XONG 2026-07-25** |
| **M04-C** | Thu hẹp `AccountAdminPanel` ở `/admin` về tra cứu/ngoại lệ · lọc dropdown vai trò theo `assignableRolesForActor` · link từ `/classes/[id]` sang hồ sơ GLV · đóng module | ✅ **XONG 2026-07-25** |

#### Đợt M04-A — ✅ XONG (2026-07-24)

**Bốn quyết định của chủ dự án ngày 2026-07-24 mở đường cho đợt này:** D-105 (chuyển lớp một
bước, Trưởng/Phó ngành dùng được trong ngành mình) · D-106 (xóa hồ sơ chưa từng dùng — **M04-B**) ·
D-107 (bỏ mô tả feature flag khỏi `docs/05`) · D-108 (danh sách ẩn người đã nghỉ — **M04-B**).

| Mã | Việc | Kết quả thật |
|---|---|---|
| **D-105 / TB-M04-02 PA A** | Chuyển lớp nguyên tử | RPC `transfer_class_staff(assignment, lớp mới, capacity, ngày hiệu lực)` — **1 migration**. Bốn bước trong MỘT giao dịch: khử vai trò lớp cũ → đóng phân công cũ → mở phân công mới → cấp lại vai trò lớp. Quyền = `app.can_manage_class` trên **CẢ HAI** lớp ⇒ Xứ đoàn trưởng/Phó · Thư ký · Super Admin toàn xứ đoàn; **Trưởng/Phó ngành chỉ trong ngành mình** |
| **M04-F06** | Đổi lớp giữ tài khoản (chấm **24/75**, thấp gần nhất toàn audit) | Đóng. AC-04.1 kiểm bằng **JWT thật qua giao diện**: Trưởng ngành Ấu Nhi chuyển GLV911, rồi **chính GLV911 đăng nhập lại và điểm danh được lớp mới** — không đổi mật khẩu, không mất quyền |
| **5W-05 / TB-M04-00** | 🔴 Trang chi tiết **nuốt sạch mọi thông báo** | Lỗi thật chưa ai ghi: M01-B điều hướng về `/staff/<id>?created=1` · `?ok=assign` · `?error=end`, nhưng trang **chỉ nhận `params`, không nhận `searchParams`** ⇒ tạo hồ sơ xong, phân công xong, hay phân công **thất bại** đều trông giống hệt nhau. Nay đọc và hiển thị |
| **AC-01.4** | Mã lỗi DB → câu tiếng Việt **nêu tên** | `assignment-messages.ts` (hàm thuần). Thay ba câu gộp kiểu *"…người này đã có lớp đang phục vụ, **hoặc** dữ liệu chưa đúng"* bằng câu nêu tên lớp/tên người + việc phải làm tiếp. Áp cho `assignStaffToClass` · `endClassStaffAssignment` · `transferClassStaff` |
| **AC-03.1 / TB-M04-05** | "Kết thúc phân công" nói đúng hệ quả (M04-F05 chấm **C5 = 1**) | `ConfirmDialog` nêu tên người + tên lớp + **"và vô hiệu hoá vai trò đăng nhập"** + chỉ đường sang "Chuyển lớp". Ô ngày prefill và `min` theo `starts_on` |
| **AC-03.1 (lỗ vòng qua)** | Nút "Kết thúc phân công" **trần** ở `/staff` | **Gỡ khỏi trang danh sách.** Ở đó nó là biểu mẫu không hộp xác nhận, tức một lối đi vòng qua đúng hàng rào vừa dựng. Mọi thao tác trên một hồ sơ nay đi qua `/staff/[id]` |
| **S2·S3·S4·S8·S9** | Năm lỗ kiểm thử phân quyền `08` đánh dấu ❌ *phải thêm* | pgTAP `030` — 12 test. Không sửa gì ở DB: chứng minh lưới an toàn **đang tồn tại** còn nguyên, trước khi M04 dựng thêm giao diện bấm vào đúng những lối đó |
| **TB-M04-04 (một phần)** | Ô chọn lớp lọc theo năm học hiện hành | `getStaffDetail` lọc `academic_year_id` = năm `current`. Phần còn lại của danh sách để **M04-B** |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **Thứ tự bốn bước NGƯỢC với `04_TO_BE_FLOWS.md`, và đây là bắt buộc.** Tài liệu ghi
   *"1. end CSA · 2. end RA"*. Làm đúng như vậy thì hàm **chết ngay ở bước 1**: trigger
   `validate_class_staff_assignment` chạy `before update of is_active` và ném
   `ACTIVE_CLASS_ROLE_EXISTS` nếu hồ sơ còn vai trò lớp đang hiệu lực. Phải khử vai trò TRƯỚC rồi
   mới đóng phân công — đúng thứ tự `end_class_staff_assignment` (Phase 1) đã dùng.
   **Không sửa `04`** (tài liệu audit), chỉ ghi lại ở đây.
2. **Trần vai trò (D-102) ở RPC này MẠNH HƠN một phép so hạng.** Hàm **không có tham số vai trò**;
   vai trò lớp suy thẳng từ `capacity` bằng `case` cứng. Không tồn tại đường gọi nào biến ai đó
   thành `super_admin` hay vai trò toàn cục — không phải nhờ kiểm tra, mà nhờ hình dạng dữ liệu.
3. **Vai trò mới chỉ cấp khi hồ sơ VỐN ĐÃ có vai trò lớp.** Hai trường hợp cố ý không đụng: hồ sơ
   không có tài khoản (BR-S09) và người đang mang vai trò **ngành/toàn cục** mà cũng đứng lớp —
   `role_assignments_one_active_per_profile_idx` chỉ cho một vai trò hiệu lực, hạ họ xuống
   `class_teacher` là lấy mất quyền quản ngành. Có pgTAP canh cả hai.
4. **Quyền theo ngành KHÔNG chép sang TypeScript.** `STAFF_TRANSFER_ROLES` ở tầng ứng dụng chỉ
   quyết định **hiện nút**; ranh giới thật (*"cả lớp cũ lẫn lớp mới đều thuộc ngành mình"*) cần tra
   lớp → cấp → ngành và do `app.can_manage_class` chốt. Trưởng ngành bấm nút cho người ngoài ngành
   vẫn nhận `42501` — E2E kiểm đúng đường đó bằng cách bấm thật vào một lớp ngoài ngành.

**Ba lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **Hộp thoại nói *"hồ sơ này chưa có tài khoản đăng nhập"* về một người đang đăng nhập hằng ngày.** `hasAccount` suy từ `staff.account`, mà khối đó **chỉ nạp cho vai trò đọc-toàn-cục** (D-104) ⇒ Trưởng ngành luôn thấy `null`. Sai ở đúng câu người ta dựa vào để quyết định có bấm hay không | E2E, lượt chạy đầu | `hasAccount` thành trường riêng suy từ `profile_id`. Sự **tồn tại** của tài khoản không nằm trong danh sách nhạy cảm D-104 và `/staff` vốn đã hiện nó. Hàng rào: 2 unit test |
| 2 | **Ngày mặc định điền sẵn một giá trị mà DB chắc chắn từ chối.** Năm học được tạo trước khai giảng nên phân công có `starts_on` **ở tương lai**; điền "hôm nay" là điền sẵn `INVALID_EFFECTIVE_DATE`. Thuộc tính `min` của ô ngày **không** tự sửa giá trị khởi tạo | E2E, lượt chạy thứ hai | `defaultDateFrom()` = `max(hôm nay, starts_on)` cho cả ô kết thúc lẫn ô hiệu lực. Hàng rào: 1 unit test dùng ngày 2099 |
| 3 | **Câu lỗi hiện HAI lần** — một ở đầu khối, một trong hộp thoại ⇒ người dùng tưởng có hai lỗi khác nhau | unit test của chính đợt này | Hộp thoại Chuyển lớp giữ ô đã điền và tự nêu lỗi bên trong ⇒ khối ngoài im khi nó mở; hộp xác nhận Kết thúc **đóng lại** rồi mới nêu lỗi (nó không giữ dữ liệu nhập nào) |

**Hai bẫy của bộ kiểm thử, ghi lại để phiên sau không mất thời gian:**

1. 🔴 **Câu `select` KIỂM CHỨNG trong pgTAP cũng chạy dưới JWT đang đặt.** RLS
   `role_assignments_select_self_or_global` chỉ cho đọc dòng của chính mình hoặc người đọc-toàn-cục
   — Trưởng ngành **không** có quyền đó. Kiểm chứng ngay sau một thao tác của Trưởng ngành mà quên
   `reset role` thì đếm ra 0 và bài test **báo hỏng oan**; tệ hơn, một bài *"không được thấy gì"* sẽ
   **xanh giả**. Quy ước trong `029`/`030`: thao tác chạy dưới JWT, kiểm chứng chạy sau `reset role`.
2. **Ba viewport dùng chung một database.** Một bài chuyển lớp *một chiều* xanh ở lượt đầu rồi đỏ ở
   hai lượt sau vì người ta đã nằm sẵn ở lớp đích. `staff-transfer.spec.ts` vì thế **đọc lớp hiện
   tại rồi chuyển sang lớp còn lại** — mỗi lượt tự trả dữ liệu về trạng thái lượt sau dùng được.
   Cùng họ với nợ #10 nhưng khác gốc: đây là *bài test không tự dọn*, không phải *chờ cứng*.

**Nghiệm thu 15 mục (`11` §5) cho đợt M04-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **551 pass / 10 skip** (trước M04-A: 523/10, **+28**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ `staff-transfer` + `staff-detail` + `responsive` **27/27 xanh** trên 360 · 768 · 1366 (lượt cô lập, DB sạch). Lượt **đầy đủ**: **175/177** — hai ca rớt là `results.spec.ts` (`window.confirm` ở M07) và `committees.spec.ts` ("Khả dụng 4/4" sau thao tác ghi), **cả hai thuộc nợ #10**; chạy cô lập hai spec đó trên DB sạch = **24/24 xanh**, tức nguyên nhân là tải máy chứ không phải M04-A |
| Vùng chạm ≥44px | ✅ nút "Chuyển lớp"/"Kết thúc phân công"/"Xác nhận" đều là `Button` `size="sm"` mang `min-h-control`; `responsive.spec.ts` quét trang `/staff` 3/3 |
| Không cỡ chữ <12px | ✅ bậc nhỏ nhất dùng là `text-2xs` = 12px; lint rule vẫn canh |
| Không màu hardcode khi có token | ✅ grep 6 file mới/sửa: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; đếm lại vẫn đúng **6 nợ cũ** (`grep "NỢ 2B" src/`: M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ hai ô chọn của hộp thoại Chuyển lớp dùng `Select` của mục 0.6; đồng thời **gỡ 2 thẻ `<select>` trần** ở `/staff/[staffId]` |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ ba lối ghi đều trả `{ok, message}` tới người dùng và nêu **tên người + tên lớp**. RPC trả `uuid` phân công mới nên "0 dòng" là không thể im lặng; `updateStaff` vẫn kiểm số dòng. pgTAP `030` ghi lại đúng vì sao phải đếm: RLS `using` **lọc dòng im lặng**, lệnh sửa của Thủ quỹ chạm 0 dòng mà **không** ném lỗi |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ không còn lớp nào để chuyển ⇒ nút khoá + câu nêu **phạm vi cụ thể** ("Chưa có lớp nào khác đang hoạt động để chuyển sang.") |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ cả hai lối: hộp xác nhận Kết thúc nêu tên người + tên lớp + tác dụng phụ lên vai trò đăng nhập; hộp thoại Chuyển lớp **tự nó là lời xác nhận** — câu xem trước nêu tên người, hai tên lớp, hai ngày, và vai trò đăng nhập đi đâu. **8 unit test + 2 E2E** canh đúng câu chữ này |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ chuyển lớp đổi vai trò đăng nhập ⇒ ghi `account_audit_events` action `assign_role`, detail nêu lớp cũ → lớp mới + ngày hiệu lực. Chỉ ghi khi hồ sơ **có** tài khoản (không có thì RPC cũng không đụng vai trò nào) |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ hai lớp nổi đều dựng trên `Dialog` của mục 0.6 ⇒ dùng chung `useModalBehavior` (bẫy focus 2 chiều, `Escape` đóng **và trả focus**, khoá cuộn nền) đã có 14 test từ 0.7 |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái phân công là **chữ** ("Đang phục vụ"/"Đã kết thúc") trong `Badge`; câu xem trước và câu lỗi đều là chữ, không có tín hiệu chỉ-bằng-màu nào |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **đây là trọng tâm.** D-105 là **NỚI** quyền (Trưởng/Phó ngành). **1 migration**, chạy sạch từ DB trống. pgTAP `029` (**25 test**) bằng JWT thật: GLV lớp bị chặn · Trưởng ngành **ngành khác** bị chặn ở **cả hai chiều** (lớp cũ ngoài ngành · lớp mới ngoài ngành) · nguyên tử/rollback khi lỗi ở bước 3 · lịch sử giữ nguyên. pgTAP `030` (**12 test**) canh năm lỗ S2·S3·S4·S8·S9. **Chạy lại TOÀN BỘ pgTAP: 688/688 xanh** (trước M04-A: 651, **+37**), không hồi quy policy nào. Thêm E2E bấm thật vào một lớp ngoài ngành ⇒ đọc được câu từ chối |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + **`docs/05-permission-matrix.md`** (§4.6 ghi phạm vi mới của Trưởng ngành; §7 **bỏ** `sector_leader_can_manage_class_staff` theo D-107). `00_SYSTEM_AUDIT_BOARD.md` cập nhật M04-F06. **Không đổi `09`/`10`/`11`**; **không đổi `04_TO_BE_FLOWS.md`** dù thứ tự bốn bước trong đó sai — nó là tài liệu audit, chỗ sửa là ghi chú ở đây |

---

#### Đợt M04-B — ✅ XONG (2026-07-25)

**Hai quyết định của chủ dự án ngày 2026-07-24 mở đường cho đợt này:** D-109 (ai được xóa hồ sơ
chưa từng dùng — **bốn vai trò ghi toàn xứ đoàn**) · D-110 (ba mức hiển thị tình trạng tài khoản
trên danh sách). Đợt này **đóng năm luồng M04**: F01 · F02 · F04 · F07 · F08.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **TB-M04-04 / M04-F01** | Danh sách `/staff` dùng được | Tìm theo họ tên · tên thánh · mã GLV · SĐT (**không dấu**, `foldVietnamese`), lọc theo **lớp** (mọi lớp · chưa phân lớp · một lớp của năm hiện hành) và **trạng thái phục vụ**, **phân trang** 10 thẻ/trang. Bộ lọc nằm ở query string ⇒ chép/đánh dấu/Back được. Trình độ huấn luyện **tiếng Việt** (hết `NONE`). Toàn bộ luật lọc là hàm thuần `staff-directory.ts` (25 unit test) |
| **D-108** | Mặc định ẩn người "Đã nghỉ" | Bộ lọc mặc định `serving` = **Đang phục vụ + Tạm nghỉ** (ẩn cả "Tạm nghỉ" thì người nghỉ sinh con/đi học xa biến khỏi kế hoạch năm học). Danh sách **ghi rõ "Đang ẩn N người…"** kèm link "Hiện tất cả" — số N tính SAU tìm kiếm + lọc lớp, không phải trên toàn bảng |
| **D-110** | Ba mức hiển thị tài khoản | `staffAccountVisibility`: **`full`** (Super Admin) thấy tên đăng nhập "Đã có GLV045" + cảnh báo "⚠ Chưa gán vai trò" · **`warning`** (5 vai trò đọc-toàn-cục khác) chỉ thấy cảnh báo, KHÔNG thấy tên đăng nhập · **`basic`** (Trưởng ngành, GLV cùng lớp) chỉ "Đã có / Chưa có". Mức `basic` **không chạy truy vấn** `role_assignments`/`profiles` nào ⇒ không có gì để rò |
| **TB-M04-03 / M04-F02** | Chống trùng hồ sơ (cảnh báo MỀM) | Form "Thêm nhân sự" **hai pha** dùng `useActionState` (chạy được **không cần JS**): pha 1 phát hiện trùng **SĐT** (chuẩn hoá bỏ định dạng + `+84`→`0`) hoặc **họ tên + ngày sinh** → hiện danh sách nghi trùng có link mở hồ sơ + giữ nguyên dữ liệu đã gõ; pha 2 "Vẫn tạo hồ sơ mới". **Không** thêm unique constraint (AC-05.2). Nút tự khoá chặn bấm đúp |
| **D-106/D-109 / M04-F07** | Xóa hồ sơ chưa từng dùng | RPC `delete_unused_staff_profile` — đường DUY NHẤT để một dòng `staff_profiles` biến mất (KHÔNG mở policy DELETE). Chặn nếu có tài khoản / phân công / bất kỳ trong **7 bảng** tham chiếu (`staff_profile_delete_blockers` là nguồn sự thật duy nhất, `security definer` nên đếm không bị RLS che). Gõ lại đúng họ tên **kiểm ở DB**. Quyền = `app.can_global_write()`. Nhật ký D-65 (`delete_staff_profile`) |
| **5W-07 / M04-F08** | Trạng thái phục vụ hết bị hardcode | `service_status` nay hiện ở danh sách (Badge) + trang chi tiết, đổi được ở khối "Sửa hồ sơ" (M01-B đã có ô), và là trục của bộ lọc D-108 |
| **Dọn kỹ thuật** | Gom bảng nhãn + phép bỏ dấu | Bốn bảng nhãn (danh xưng · trình độ · trạng thái · vai trò lớp) gom về `staff-directory.ts`; `foldVietnamese` về `lib/text/`. Ba bản sao trước đây **đã lệch thật**: danh sách in `NONE` còn trang chi tiết in "Chưa có" |

**Ba quyết định cài đặt cần nhớ:**

1. **Lọc TRONG BỘ NHỚ, không đẩy xuống SQL — có chủ ý.** `staff_profiles` của một xứ đoàn là
   hàng chục dòng (không phải ~900 như `students`), nên tải hết rồi lọc tốn không đáng kể, đổi lại
   được **tìm không dấu đúng tiếng Việt** (thứ `ilike` không cho) và toàn bộ luật lọc kiểm được
   bằng unit test thường. Bộ test `staff-directory.test.ts` chính là đặc tả nếu sau này phải viết
   lại bằng SQL.
2. **`staff_profile_delete_blockers` do DB đếm, KHÔNG do trang tự đếm.** Đếm ở trang là đếm dưới
   RLS của người xem — một phiếu mượn thiết bị người xem không đọc được sẽ biến khỏi phép đếm, và
   màn hình sẽ hứa "xóa được" trước một RPC chắc chắn từ chối. Hàm chạy `security definer` nên nhìn
   thấy mọi dòng, y như RPC xóa.
3. **`DB_GLOBAL_READ_ROLES` (6 vai trò) ≠ `GLOBAL_ROLES` (7).** `GLOBAL_ROLES` ở TypeScript có cả
   Thủ quỹ vì đó là "nhóm toàn xứ đoàn" theo nghĩa tổ chức; nhưng `app.can_global_read()` phía DB
   **không** tính Thủ quỹ. Dùng nhầm `GLOBAL_ROLES` để quyết "có hiện cảnh báo chưa gán vai trò
   không" thì truy vấn của Thủ quỹ trả 0 dòng ⇒ mọi tài khoản trông như "đã gán vai trò" — một lời
   nói dối im lặng. `staffAccountVisibility` dùng danh sách 6 để hai tầng khớp nhau.

**Ba lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **Hai ô CHỌN âm thầm quay về mặc định sau cảnh báo trùng.** `defaultValue` của `<select>` chỉ có tác dụng lúc gắn DOM; sau pha 1, "Chị" quay về "Anh" và "Cấp II" về "Chưa qua huấn luyện" ⇒ người dùng bấm "Vẫn tạo hồ sơ mới" và hồ sơ được tạo với **danh xưng + trình độ SAI** mà không ai thấy | unit test của chính đợt này | `key` theo giá trị ⇒ chỉ gắn lại khi giá trị thật sự đổi. Hàng rào: `staff-create-form.test.tsx` |
| 2 | 🔴 **Bấm số trang không ăn — trang đứng yên.** Mỗi thẻ nhân sự cho Next **tải trước** trang chi tiết; 10 thẻ ⇒ 10 lượt dựng `/staff/[id]` (mỗi lượt mấy truy vấn + RPC đếm lý do chặn) chen cùng lúc, trình duyệt chỉ mở 6 kết nối ⇒ lượt tải của cú bấm "Trang 2" bị huỷ (`ERR_ABORTED`) | E2E rớt lặp ở 1366px; nhật ký mạng cho thấy đúng 10 lượt `/staff/<uuid>?_rsc=` | `prefetch={false}` trên link thẻ. Người dùng mở nhiều nhất MỘT hồ sơ, tải trước 9 cái còn lại là trả giá để không dùng |
| 3 | **`text[] \|\| 'chuỗi'` literal trần** nổ `22P02 malformed array literal` khi lý do chặn là câu literal chưa định kiểu (các nhánh khác dùng `format()` nên đã có kiểu `text`) | pgTAP `031` | thêm `::text`. **Test bắt trước khi migration được tin là đúng** |

**Nghiệm thu 15 mục (`11` §5) cho đợt M04-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **604 pass / 10 skip** (trước M04-B: 551/10, **+53**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ `staff-directory` + `staff-detail` + `staff-transfer` **48/48 xanh** trên 360 · 768 · 1366; `responsive` + `security` **27/27 xanh** (quét `/staff` không tràn ngang). Lượt cô lập, DB `db:reset` + `seed:dev` |
| Vùng chạm ≥44px | ✅ ô số phân trang `min-h-11 min-w-11`; link "Hiện tất cả" và "Xoá lọc" bọc `min-h-11`; `responsive.spec.ts` quét `/staff` 3/3 |
| Không cỡ chữ <12px | ✅ bậc nhỏ nhất `text-2xs` = 12px; lint rule vẫn canh |
| Không màu hardcode khi có token | ✅ grep các file mới/sửa: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; xóa hồ sơ dùng `ConfirmDialog`. Đếm lại vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ mọi ô chọn (lọc lớp/trạng thái, form tạo, danh xưng/trình độ) dùng `Select` mục 0.6; **gỡ 2 thẻ `<select>` trần** cũ ở `/staff` |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ tạo hồ sơ → redirect + toast; xóa → về danh sách kèm "Đã xóa hồ sơ GLVxxx · Tên". RPC xóa trả `jsonb` danh tính ⇒ "0 dòng" không thể im lặng |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ `EmptyState` `no-data`: lọc không ai khớp → nêu **số hồ sơ xem được** + nút "Xoá lọc"; chưa có hồ sơ nào → câu nêu phạm vi |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ xóa hồ sơ: `ConfirmDialog` nêu **tên người + mã GLV** + "mã không cấp lại" + "không hoàn tác được" + "ghi vào nhật ký"; nút chỉ mở sau khi gõ lại đúng họ tên. **9 unit test + E2E** canh câu chữ |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ xóa hồ sơ ghi `account_audit_events` action `delete_staff_profile`, `target_username` = "GLVxxx · Tên" (ảnh chụp, hồ sơ xóa được thì không có tài khoản). pgTAP `031` canh append-only vẫn nguyên |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ hộp xóa dựng trên `Dialog`/`ConfirmDialog` mục 0.6 ⇒ dùng chung `useModalBehavior` (bẫy focus 2 chiều, `Escape` đóng + trả focus) |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái phục vụ + tài khoản là **chữ** trong Badge; cảnh báo trùng là vùng `role="status"` có chữ; cảnh báo zombie có ký tự "⚠" + chữ |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **trọng tâm.** D-106/D-109 là quyền MỚI (xóa). **1 migration**, chạy sạch từ DB trống. pgTAP `031` (**22 bài**) bằng JWT thật: Trưởng ngành/Thủ quỹ/GLV lớp bị chặn ở cả RPC xóa lẫn hàm đọc lý do; **7 bảng** tham chiếu chặn đúng (kể cả 2 bảng `on delete set null` mà FK KHÔNG chặn thay — dựng "tác giả treo" qua D-101); gõ sai tên bị chặn; không ai DELETE thẳng bảng được. **Chạy lại TOÀN BỘ pgTAP: 710/710** (trước M04-B: 688, **+22**) |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (đóng M04-F01·F02·F04·F07·F08). **Không đổi `09`/`10`/`11`**; **không đổi `04_TO_BE_FLOWS.md`** |

**Còn nợ lại sau M04-B (chuyển sang M04-C, không giấu):** thu hẹp `AccountAdminPanel` ở `/admin` ·
lọc dropdown vai trò theo `assignableRolesForActor` · link từ `/classes/[id]` sang hồ sơ GLV.

---

#### Đợt M04-C — ✅ XONG (2026-07-25) · **đóng module 4**

**Một quyết định của chủ dự án ngày 2026-07-25 mở đường cho đợt này:** **D-111** — chọn phương án
*"mỗi việc một nơi"*: `/admin` **bỏ hẳn** đường cấp tài khoản cho Giáo lý viên, kèm nghĩa vụ bịt lỗ
hổng mà chính lựa chọn đó tạo ra (xem quyết định cài đặt 1). **0 migration, 0 thay đổi phân quyền.**

| Mã | Việc | Kết quả thật |
|---|---|---|
| **D-111 / TB-M01-01 PA A** | Thu hẹp `/admin` về **tra cứu + xử lý ngoại lệ** | Biểu mẫu "Tạo tài khoản" nay chỉ còn **4 vai trò không gắn hồ sơ nhân sự** (Cha sở · Cha phó · Phụ huynh · Thiếu nhi), thay cho **14 vai trò** trước đây. Bốn ô chọn phạm vi (năm học · ngành · lớp · hồ sơ GLV) **gỡ hẳn** vì không vai trò nào còn cần chúng ⇒ `/admin` chạy **3 truy vấn thay vì 7** |
| **D-102 (giao diện)** | Lọc ô chọn vai trò theo `assignableRolesForActor` | Ô chọn cũ liệt kê **cả `super_admin`** trong khi máy chủ **luôn** từ chối (trần vai trò cài từ M01-B) — tức mời người dùng làm một việc chắc chắn hỏng, rồi mới báo lỗi. Danh sách nay do **máy chủ** tính (`adminProvisionableRoles`), không phải mảng viết cứng ở giao diện |
| **Siết ở tầng schema, không chỉ ẩn nút** | `provisionAccountSchema` từ chối mọi vai trò gắn hồ sơ nhân sự | Ẩn khỏi ô chọn mà action vẫn nhận thì đó là **thu hẹp trên giấy** (AGENTS §5). Schema bỏ luôn trường `staffProfileId`, và nhánh liên kết `staff_profiles` **gỡ khỏi `adminProvisionAccount`** thay vì để nằm lại làm bẫy cho phiên sau. Đường cấp tài khoản GLV **duy nhất** là `provisionAccountForStaff` |
| **M04-F09** | Đội ngũ lớp mở thẳng hồ sơ GLV | Điểm trừ **duy nhất** của luồng `PASS` 66/75 (`03_AUDIT_RESULTS.md` §2: *"chưa link được vì `/staff/[staffId]` chưa tồn tại"*). Trang đó có từ M01-B ⇒ nợ chỉ còn một `<Link>`. Nghiệp vụ **giữ nguyên**, đúng luật "PASS thì không sửa" |
| **Vá lỗ hổng do D-111 tạo ra** | Trang hồ sơ cấp được cả vai trò ngành/toàn xứ đoàn | Xem quyết định cài đặt 1 |

**Ba quyết định cài đặt cần nhớ:**

1. 🔴 **Chọn phương án A là tự tạo ra một lỗ hổng, và phải vá trong cùng đợt.** Bản M01-B cho
   trang hồ sơ **chỉ** chọn đúng vai trò lớp suy từ `capacity` khi hồ sơ đang có phân công. Cắt
   nhánh Giáo lý viên khỏi `/admin` mà giữ nguyên luật đó thì một người **vừa đứng lớp vừa làm
   Trưởng ngành** sẽ không cấp được tài khoản **ở đâu cả** — một tính năng biến mất, không ai báo.
   `grantableRolesForStaff` nay trả **vai trò lớp + các vai trò không thuộc lớp**, vai trò lớp đứng
   đầu và **được chọn sẵn** (trường hợp áp đảo không phải tốn thêm thao tác). DB vốn cho phép:
   `validate_role_assignment_scope` chỉ ràng buộc vai trò **lớp**, còn `role_assignments_one_active_per_profile_idx`
   thì `assign_primary_role` đã xử lý nguyên tử từ M01-B. Đây là **sai lệch có chủ ý** so với
   TB-01.3 của `04_TO_BE_FLOWS.md`; **không sửa tài liệu audit**, ghi lại ở đây.
2. **Vai trò lớp KHÔNG bao giờ hiện khi hồ sơ chưa có phân công.** Trigger ném
   `ACTIVE_CLASS_ASSIGNMENT_REQUIRED`, nên đưa nó vào ô chọn là lặp lại đúng cái sai vừa gỡ khỏi
   `/admin` ở một chỗ khác. Chưa có phân công ⇒ chỉ vai trò toàn xứ đoàn/ngành, và **không chọn sẵn
   gì cả** vì không có lựa chọn nào hiển nhiên đúng.
3. **Hai ô chọn hồ sơ ở `/admin` phải `defaultValue=""`.** `Select` (mục 0.6) dựng dòng gợi ý bằng
   `<option value="" disabled>`, mà trình duyệt tự chọn **option đầu tiên không bị disabled** —
   tức là mở biểu mẫu lên đã có sẵn một người được chọn, và `required` không chặn được gì. Một cú
   bấm nhầm là cấp tài khoản cho đúng người không ai định cấp. Đúng mẫu `staff-assignment-panel`
   và `committee-workspace` đang dùng.

**Ba lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | **Nhãn "Vai trò" trùng hai chỗ trên `/admin`** — biểu mẫu tạo tài khoản và ô "Lọc theo vai trò" của danh sách. Phép chọn theo nhãn khớp **cả hai** | E2E rớt `strict mode violation` ở cả 3 viewport | Bài test chỉ đúng ô của biểu mẫu (`exact: true`). Ghi lại vì đây là bẫy cho mọi bài test sau trên trang này |
| 2 | ⚠️ **Bấm thẻ lớp ở `/classes` mất tới ~15–20 giây, và ở viewport chạy đầu tiên có lượt MẤT HẲN cú bấm.** Đo bằng một spec chẩn đoán: sau khi bấm 20 giây thì URL **đã** đổi, tức trang không hỏng mà chậm; nhưng lượt chạy trước đó thì 45 giây vẫn đứng yên | E2E rớt 3/3 viewport, rồi 1/3, rồi 0/3 tuỳ tải máy | Bài test dùng `clickUntil` như `attendance.spec.ts` (bấm lại tối đa 4 lần). **Nguyên nhân gốc CHƯA sửa** — ghi thành nợ #15, thuộc M02 |
| 3 | **`prefetch={false}` cho thẻ lớp: đã thử và ĐÃ HOÀN TÁC.** Giả thuyết ban đầu là lỗi #2 cùng gốc với lỗi phân trang M04-B (10 thẻ tải trước làm nghẽn 6 kết nối) | Đo lại sau khi thêm: vẫn rớt y nguyên ⇒ **giả thuyết sai** | Hoàn tác. Không giữ một thay đổi ở trang thuộc module khác khi **không đo được** nó chữa gì |

**Nghiệm thu 15 mục (`11` §5) cho đợt M04-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **624 pass / 10 skip** (trước M04-C: 604/10, **+20**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ `staff-detail` + `account-security` **24/24 xanh** trên 360 · 768 · 1366; `responsive` + `security` **30/30 xanh** (quét `/admin` và `/classes`). Lượt gộp 5 spec trên DB `db:reset` + `seed:dev`: **69/72** — ba ca rớt đều thuộc `staff-directory.spec.ts` của M04-B (phân trang · D-108), chạy **cô lập trên DB sạch: 30/30 xanh** ⇒ nguyên nhân là dùng chung DB + tải máy (nợ #10), không phải hồi quy |
| Vùng chạm ≥44px | ✅ link tên người trong đội ngũ lớp bọc `min-h-11`; ô chọn dùng `Select` (`h-control`); `responsive.spec.ts` quét `/classes` và `/admin` 3/3 |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới; lint rule vẫn canh |
| Không màu hardcode khi có token | ✅ grep các file sửa: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; đếm lại vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ **giảm 5 thẻ trần**: bốn ô chọn phạm vi bị gỡ hẳn, ô "Vai trò" đổi sang `Select` của mục 0.6. `/admin` nay **không còn thẻ `<select>` trần nào** |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ không đổi lối ghi nào. `adminProvisionAccount` vẫn trả `{ok, message}` + mật khẩu tạm hiện một lần; nhánh liên kết `staff_profiles` bị gỡ nên **bớt đi** một đường ghi, không thêm |
| Trạng thái rỗng đúng 1 trong 3 loại | — không áp dụng: đợt này không thêm danh sách nào |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ hộp xóa tài khoản (M01-A) giữ nguyên, E2E vẫn canh nút khoá tới khi gõ đúng tên |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ `recordAccountAudit` giữ nguyên ở cả hai đường cấp tài khoản còn lại |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không thêm lớp nổi; `Select` là thẻ native nên bàn phím và trình đọc màn hình có sẵn |
| Không dùng màu làm tín hiệu duy nhất | ✅ câu chỉ đường sang `/staff` là **chữ + liên kết gạch chân**, không phải màu; tên người trong đội ngũ lớp là liên kết có gạch chân khi rê chuột, kèm `Badge` chữ cho vai trò |
| Siết quyền ⇒ RLS negative bằng JWT thật | — **0 migration, 0 thay đổi phân quyền.** Ranh giới không đổi: `/admin` vẫn chỉ Super Admin, `provisionAccountForStaff` vẫn `guardAccountAdmin` + trần D-102, RLS y nguyên. **Chạy lại TOÀN BỘ pgTAP để chứng minh: 710/710 xanh**, đúng bằng M04-B |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (M04 đóng, ghi chú M04-F09). **Không đổi `09`/`10`/`11`**; **không đổi `04_TO_BE_FLOWS.md`** dù TB-01.3 nay lệch với cài đặt — ghi chú nằm ở đây |

> **Module 4 (M04) ĐÓNG.** Cả chín luồng đã xử lý xong; module tiếp theo theo `11` §3 là
> **M02 Cấu trúc học vụ**.

---

### Module 5 — M02 Cấu trúc học vụ · chia ba đợt

M02 chứa **luồng chấm thấp nhất toàn hệ thống** (F09 = 21/75) và **đúng sự cố production đã xảy
ra**: bấm "Sinh lớp mặc định" tạo 0 lớp mà vẫn báo thành công (5W-F02). `07_IMPLEMENTATION_IMPACT.md`
§8 xếp thứ tự `I1 → I3 → I2 → …` với lý do rõ: *"làm I2 mà không có I1 thì lỗi mới vẫn bị nuốt y
như cũ"*. Ba đợt chia theo đúng trục đó.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M02-A** | **Hết báo thành công giả**: kênh phản hồi cho cả bốn thao tác ghi (I1/TB-F12) · danh mục tham chiếu đi theo migration (I3) · `generate_default_classes` ném lỗi khi thiếu danh mục và chặn năm đã đóng, trả `{inserted, expected}` (I2/TB-F02) · **D-112** siết quyền năm học về Super Admin (I9) · **D-113** cảnh báo trước khi đặt hiện hành · nhãn tiếng Việt + ngày dd/MM/yyyy (I11) | ✅ **XONG 2026-07-25** |
| **M02-B** | Chi tiết lớp neo vào năm học (I5/TB-F07) · màn hình "Cài đặt lớp" đưa `updateClass` vào dùng (I6/TB-F08) · mốc kết thúc HK1 (**D-71** → **D-115**/**D-116**) · badge trạng thái lớp · nợ #15 **đã ĐO, chưa chữa được** | ✅ **XONG 2026-07-25** |
| **M02-C** | Đóng & lưu trữ năm học (I7/TB-F09, **D-73**) · siết ghi vào năm đã đóng (I8, **D-117**/**D-118**) · siết đọc lớp/năm cho phụ huynh–thiếu nhi (**D-70**) · **D-119** không tự đóng lớp · **D-120** hạn giữ dữ liệu chặn lưu trữ | ✅ **XONG 2026-07-26** |

> **Năm câu hỏi NEEDS_CONFIRMATION của `08_ACCEPTANCE_CRITERIA.md` §4 đã có sẵn quyết định cũ**,
> không hỏi lại chủ dự án: Q-M02-02 → **D-71** · Q-M02-03 → **D-73** · Q-M02-05 → **D-69**
> (Trưởng ngành **được** xem năm cũ ⇒ hạng mục I10 và SEC-M02-08 **bị loại**, không phải lỗ hổng) ·
> Q-M02-06 → **D-70** · Q-M02-07 → **D-72**. Q-M02-01 được chủ dự án chốt hôm nay thành **D-112**.
> Còn **Q-M02-04 · Q-M02-08 · Q-M02-09** — cả ba chỉ chặn **M02-C**, và **đã được chủ dự án chốt
> ngày 2026-07-26**: Q-M02-04 → **D-117** · Q-M02-08 → **D-119** · Q-M02-09 → **D-120**. Kèm một
> câu hỏi phát sinh về phạm vi hàng rào ghi → **D-118**. Cả bốn nằm ở §4 của file này.
> ⇒ **Không còn câu hỏi `NEEDS_CONFIRMATION` nào của M02 để ngỏ.**

#### Đợt M02-A — ✅ XONG (2026-07-25)

**Hai quyết định của chủ dự án ngày 2026-07-25 mở đường cho đợt này:** **D-112** (vòng đời năm học
chỉ còn Super Admin) · **D-113** (đặt hiện hành khi chưa đủ lớp thì **cảnh báo bằng con số thật**
rồi vẫn cho làm, không chặn cứng).

| Mã | Việc | Kết quả thật |
|---|---|---|
| **I3 / AC-M02-12** | Danh mục tham chiếu rời khỏi `seed.sql` | **1 migration** `20260725000100_reference_catalog`: 5 ngành · 13 cấp · 19 mẫu lớp, **giữ nguyên UUID cố định**, `on conflict do nothing` nên môi trường đã có dữ liệu không hề bị đụng. `supabase db push` **không** chạy `seed.sql` (5W-F11) — đó là lý do một project Supabase mới rỗng danh mục và F02 sụp đổ ở nơi rất xa nguyên nhân |
| **I2 / TB-F02 · BR-M02-N01…N04** | `generate_default_classes` hết nói dối | **1 migration** `20260725000200_generate_default_classes_result`: kiểu trả về `integer` → **`jsonb {inserted, expected, already_present}`**. Ném `CLASS_TEMPLATES_EMPTY` khi danh mục rỗng và `ACADEMIC_YEAR_CLOSED` khi năm đã đóng/lưu trữ (cùng mã `23514`, phân biệt bằng **tên luật trong thông điệp** — đúng quy ước `20260724000500`) |
| **I2 (tầng ứng dụng)** | Số 0 mang hai nghĩa | `parseGenerateClassesResult` coi **hình dạng lạ là THẤT BẠI**, không phải `0`. Giao diện nay nói ba câu khác hẳn nhau: *"Đã tạo 19/19 lớp"* · *"đã có đủ 19 lớp từ trước"* · *"chưa có danh mục lớp chuẩn nên không tạo được lớp nào"* |
| **D-112 / I9** | Ba tầng quyền "Năm học" nói ba kiểu (BR-M02-15/16) | **1 migration** `20260725000300_academic_year_super_admin_only`: policy INSERT/UPDATE `academic_years` → `app.is_super_admin()`; `set_current_academic_year` bỏ `group_leader`; RPC sinh lớp cũng SA. `docs/05` §3 + §4.3 + §4.4 + §5 sửa theo. **Đọc không đổi** |
| **D-113** | Đặt hiện hành khi chưa đủ lớp | Hộp xác nhận nêu **con số thật** (`0/19 lớp`) + hệ quả (*"chưa ghi danh hay điểm danh được"*) + **tên năm học sắp bị đóng**. Vẫn cho làm — quyền quyết định ở người phụ trách (`docs/03` §1) |
| **I1 / TB-F12 · AC-M02-04 · 5W-F01** | Bốn thao tác ghi im lặng như nhau | Cả bốn nay nói ra kết quả. Kèm hai vá gốc: `failure()` **nhận diện lỗi Zod** (bản cũ gán mọi lỗi lạ thành `CONFLICT` nên "Ngày kết thúc phải sau ngày bắt đầu" hiện ra là *"Thao tác bị xung đột, vui lòng thử lại"*), và `updateAttendanceSettings`/`updateClass` thêm **`.select("id")`** để 0 dòng không còn báo thành công (SW-04) |
| **D-96 (nợ #14)** | Mẫu guard sai ở `academic-years` | Trả luôn: `academicYearRouteContext()` (`requireRouteAccess`, có thể chuyển hướng) gọi **ngoài `try`**; `assertAcademicYearAdmin()` ném `AppError` **trong `try`**. Module này không nằm trong danh sách 9 module của nợ #14 nhưng mắc đúng bệnh đó |
| **I11** | Trang nói ngôn ngữ của máy | `current`/`draft` → **"Đang áp dụng"/"Nháp"**; ngày ISO → **dd/MM/yyyy**; `19` viết cứng → **số mẫu lớp đang bật đọc từ DB** (`null` thì in `?`, không bịa) |

**Ba quyết định cài đặt cần nhớ:**

1. 🔴 **`redirect()` về CHÍNH ROUTE ĐANG ĐỨNG làm Next 15.5 bỏ luôn lượt dựng lại trang.** D-61 chỉ
   định "chuyển hướng kèm mã kết quả" cho biểu mẫu ngắn, nhưng cả bốn biểu mẫu của M02-A đều nằm
   trên `/admin` và phải quay về `/admin`. Triệu chứng: thanh địa chỉ **đã đổi** sang
   `/admin?done=…`, `<main>` **trắng vĩnh viễn**, không lỗi máy chủ, không lỗi trình duyệt, log
   sạch trơn. Đo trên cùng một bản build: chuyển hướng sang **route khác** dựng xong sau **749 ms**;
   về chính nó **treo quá 120 giây**; thêm `RedirectType.push` chạy được **một lượt (1 279 ms)** rồi
   lại treo ở lượt sau. Cách đã chọn: **`useActionState`** — biểu mẫu vẫn là `<form action={…}>`
   thật nên **giữ chạy-không-JS** (09 §11), server action trả thẳng câu chữ về, dòng thông báo hiện
   **ngay tại chỗ vừa thao tác** thay vì ở đầu trang. Giữ đúng điều D-61 thật sự đòi bằng một cơ
   chế chạy được. Các module trước không vấp vì luôn chuyển hướng sang **trang khác**
   (`/staff` → `/staff/<id>`).
2. **Hộp xác nhận KHÔNG được lấy mất khả năng chạy-không-JS.** `ConfirmSubmitForm` giữ nguyên
   `<form action={…}>` rồi **chỉ chặn khi JS đã chạy**: `onSubmit` chặn cú bấm đầu và mở hộp thoại,
   lần gửi thứ hai đi qua `requestSubmit()`. Không có JS thì bấm là gửi ngay — mất hộp xác nhận
   nhưng **không mất thao tác**. Cờ "đã xác nhận" phải là **`useRef`**, không phải state:
   `requestSubmit()` chạy đồng bộ trong cùng lượt xử lý sự kiện nên `setState` chưa kịp có hiệu lực.
3. **Phạm vi siết quyền cố ý HẸP.** D-112 chỉ đụng bảng `academic_years`; bảng `classes` giữ nguyên
   `app.can_global_write()` vì dòng "Ngành/lớp" của `docs/05` là quyết định khác và màn hình cài đặt
   lớp (M02-B) sẽ cần đúng nhóm đó. `requireAcademicWrite` cũ vì thế tách làm hai:
   `assertAcademicYearAdmin` (SA) và `assertClassWrite` (4 vai trò).

**Ba lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **Trang trắng sau mỗi lượt gửi biểu mẫu** (mục 1 ở trên). Không có lỗi ở bất kỳ đâu — server log sạch, `pageerror` rỗng, `console` rỗng | E2E rớt 3/3 viewport ở đúng các bài **có ghi dữ liệu**; đọc diff không bao giờ thấy | Bỏ `redirect()`, chuyển sang `useActionState`. **Kiểm chứng bằng đo, không bằng suy đoán**: dựng spec chẩn đoán tạm so *biểu mẫu thường* với *biểu mẫu qua hộp xác nhận* (loại trừ `ConfirmSubmitForm`), rồi so *route khác* với *chính route* (khoanh đúng nguyên nhân) |
| 2 | **Nhãn "Tên hiển thị" trùng hai chỗ trên `/admin`** — biểu mẫu tạo năm học và biểu mẫu cấp tài khoản | E2E rớt `strict mode violation` 3/3 viewport | Bài test neo vào đúng biểu mẫu (`form` chứa `#academic-code`). Cùng họ với lỗi "Vai trò trùng hai chỗ" của M04-C — trang `/admin` đông biểu mẫu, mọi bài test sau phải neo phạm vi |
| 3 | **pgTAP đếm số dòng tuyệt đối nên đỏ khi database có dữ liệu mẫu** (`004`, `006`, `009`, `010`) | Chạy `test:db` sau `seed:dev` | Không phải hồi quy và **không sửa test**: các bài đó vốn thiết kế để chạy trên DB vừa `db:reset`. Ghi lại quy trình đúng: `db:reset` → `test:db` → `seed:dev` → E2E |

**Nghiệm thu 15 mục (`11` §5) cho đợt M02-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **641 pass / 10 skip** (trước M02-A: 624/10, **+17**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ `academic-year` **15/15** + `responsive` **9/9** + `security` **9/9** = **33/33 xanh** trên 360 · 768 · 1366, chạy trên DB `db:reset` + `seed:dev` |
| Vùng chạm ≥44px | ✅ hai nút mới dùng `Button size="sm"` sẵn có; `responsive.spec.ts` quét `/admin` 3/3 |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới |
| Không màu hardcode khi có token | ✅ grep các file sửa: **0 mã hex/rgb/hsl**; câu cảnh báo D-113 dùng `text-danger` |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ đợt này không thêm ô chọn nào |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ **đây là trọng tâm của đợt.** Cả bốn thao tác nói ra kết quả; `updateAttendanceSettings` và `updateClass` thêm `.select("id")` ⇒ 0 dòng = thất bại |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ "Chưa có năm học…" giữ nguyên dạng câu chỉ đường sang biểu mẫu bên cạnh |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ cả hai nút: hộp sinh lớp nêu **tên năm + số lớp hiện có**; hộp đặt hiện hành nêu **tên năm mới + tên năm sắp bị đóng** + cảnh báo thiếu lớp (D-113) |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò của ai. `classes.updated_by` vẫn ghi như cũ |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ `ConfirmDialog` (mục 0.6) đã có bẫy focus + `Escape`; hai hộp mới dùng lại nguyên component đó |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái năm học là **chữ tiếng Việt** trong `Badge` (có icon theo variant), không phải chấm màu; cảnh báo thiếu lớp là **câu chữ nêu số**, không phải màu đỏ suông |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **D-112 là siết quyền.** pgTAP `032` — **20 test bằng JWT thật**: Xứ đoàn trưởng · Thư ký · GLV lớp đều `42501` khi sinh lớp; Xứ đoàn trưởng `42501` khi đặt hiện hành; Thư ký **0 dòng** khi `update` thẳng `academic_years`; và **vẫn đọc được** năm học (chứng minh siết ghi không kéo theo siết đọc) |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` + `docs/05-permission-matrix.md` (D-112). **Không đổi `09`/`10`/`11`**; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

---

#### Đợt M02-B — ✅ XONG (2026-07-25)

**Hai quyết định của chủ dự án ngày 2026-07-25 mở đường cho đợt này:** **D-115** (qua mốc kết thúc
học kỳ 1 thì **chỉ cảnh báo**, không tự đóng lớp Dự trưởng) · **D-116** (mốc HK1 **không bắt buộc**
và **sửa được sau**). D-115 trả lời câu hỏi mở số 4 của `06_DECISION_LOG.md`, gắn với D-71.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **I5 / TB-F07 · BR-M02-N09,N10** | Chi tiết lớp không neo vào năm học | Trang mở được cho **mọi** năm học, kể cả năm đã đóng ba năm trước, và ghi danh thêm một em vào đó **vẫn chạy** — không lỗi, không cảnh báo, không dấu hiệu nào cho biết mình đang sửa quá khứ. Nay `getClassDetail` đọc `academic_years(code, name, status, semester_1_end_date)`; phụ đề nói **trạng thái năm học bằng chữ**; năm khác `current` có dải thông báo riêng (`draft` = còn ghi được nhưng chưa áp dụng · `closed`/`archived` = **chỉ đọc**, ẩn mọi biểu mẫu ghi) |
| **I5 (tầng máy chủ)** | Ẩn biểu mẫu không phải authorization | `enrollStudent` **và** `endEnrollment` nay tự kiểm trạng thái năm học (BR-M02-N09 nói "ghi danh **và kết thúc ghi danh**"). Gọi thẳng action thì không đi qua giao diện, và RLS **vẫn chưa** biết trạng thái năm học — đó là I8, đợt M02-C. Ghi thẳng ra điều đó trong `year-lifecycle.ts` để không ai đọc mã rồi tưởng hàng rào đã dựng xong |
| **I6 / TB-F08 · AC-M02-10** | `updateClass` **không có call site nào** | 5W-F08: hàm viết xong từ Phase 1, `docs/11` §3 liệt kê là bắt buộc, mà đóng lớp · tạm ngưng lớp · ghi phòng sinh hoạt · ghi chú **thực tế không làm được**. Nay có thẻ **"Cài đặt lớp"** ở `/classes/[classId]`. Hàm chuyển sang `features/classes/{schemas,server/actions,server/permissions}.ts` cho đúng ranh giới feature |
| **I6 / BR-M02-N11** | Đóng lớp còn em đang sinh hoạt | Hộp xác nhận nêu **tên lớp + số em** và nói thẳng điều dễ hiểu sai nhất: đóng lớp **không** kết thúc ghi danh đang mở (`enrollments_validate` chỉ chặn ghi danh **mới**). Hộp **chỉ mở khi cần** — đổi phòng sinh hoạt thì lưu thẳng; hỏi mọi lượt là cách nhanh nhất để người dùng bấm "Xác nhận" theo phản xạ |
| **BR-M02-N12** | Danh sách lớp không phân biệt lớp lệch chuẩn | `/classes` gắn huy hiệu cho lớp **không** `active`, bằng **chữ tiếng Việt**. Lớp `active` **không** có huy hiệu: 19/19 lớp đều gắn thì huy hiệu mất giá trị báo hiệu đúng lúc cần nhất |
| **D-71 / D-115 / D-116** | `term_scope='semester_1'` là **dữ liệu chết** | **1 migration** `20260725000400_semester_1_end_date`: cột `date` **nullable** + CHECK phải nằm **hẳn bên trong** năm học. Ba tầng kiểm cùng một luật: `min`/`max` của ô ngày → Zod (câu tiếng Việt) → CHECK constraint. Nhập lúc tạo năm **và** sửa/xoá sau ở `/admin` cho năm nháp/hiện hành. Qua mốc: lớp Dự trưởng hiện cảnh báo ở `/classes` và ở trang chi tiết — **không trigger, không tác vụ nền** |
| **09 §4.4 #10** | Thẻ lớp chưa mang màu ngành | `/classes` bọc mỗi nhóm ngành trong `ThemeScope`, thẻ dùng `theme-soft` + viền `theme-pastel-deep` — đúng ô số 10 của bảng 12 nơi được dùng `--theme-*`. Chữ trên nền pastel theo đúng bảng bắt buộc `09` §4.3 (`soft` chỉ đi với `--text`, đo được ≥8,5:1) nên ba dòng phụ đổi từ `text-muted-foreground` sang `text-ink`; thứ bậc thị giác chuyển sang cỡ chữ và độ đậm |
| **Nợ #5** | 2 lớp CSS **không tồn tại trong CSS xuất ra** | Trả phần `classes`: `hover:border-primary/50 hover:bg-accent/40`. Bổ ngữ độ mờ trên token là `var()` trần thì Tailwind **bỏ luôn cả lớp**, nên thẻ lớp **từ trước tới nay không có hiệu ứng hover nào** — hỏng im lặng. Nay `hover:bg-theme-pastel` (token đặc) + vòng focus `theme-ring` |
| **M14-C / AC-B6** | Nút quay lại của trang chi tiết lớp | Đổi liên kết chữ nhỏ ở góc phải sang `backHref` chuẩn của `PageHeader` — bản cũ **không đạt vùng chạm 44px** |
| **Kèm theo** | `new Date().toISOString().slice(0,10)` | Chuỗi đó là ngày **UTC**, nên từ 00:00 tới 07:00 giờ Việt Nam nó trả về **ngày hôm qua** — mặc định của ô "Ngày ghi danh" lệch một ngày trong 7 giờ mỗi ngày. Thêm `todayVi()` vào `lib/dates` và dùng cho cả mặc định biểu mẫu lẫn phép so mốc HK1 |
| **I11 (tiếp)** | `5 ngành` viết cứng cạnh số thật | Đọc `sectors.length`. Cùng họ lỗi mà I11 đã trả với `/19` ở M02-A: ở môi trường thiếu danh mục, trang vẫn dõng dạc "5 ngành" trong khi không có ngành nào hiện ra |

**Ba quyết định cài đặt cần nhớ:**

1. **Trang chi tiết lớp trả về HAI cờ quyền, cố ý không gộp.** `canManage` (ghi danh) là sáu vai trò
   của `ENROLLMENT_WRITE_ROLES`, gồm cả Trưởng/Phó ngành. `canManageClass` (cài đặt lớp) là **bốn**
   vai trò ghi toàn xứ đoàn, khớp `classes_update_global_write`. Gộp làm một thì hoặc Trưởng ngành
   thấy một nút mà RLS sẽ chặn, hoặc họ mất quyền ghi danh. **Cả hai đều bị trạng thái năm học khoá
   lại**, và năm học không đọc được thì coi như **không** ghi được — mở khoá vì thiếu thông tin là
   đúng hướng sai trong một chốt chặn.
2. **Phạm vi của D-112 vẫn HẸP.** Mốc HK1 nằm trên bảng `academic_years` ⇒ chỉ Super Admin. Cài đặt
   lớp nằm trên bảng `classes` ⇒ vẫn bốn vai trò. pgTAP `033` chốt đúng ranh giới đó bằng JWT thật:
   nếu ai đó vô tình siết `classes` về Super Admin thì bài "Thư ký sửa được cài đặt lớp" đỏ ngay.
3. **`updateClass` có từ điển câu chữ RIÊNG, không dùng lại của `/admin`.** Từ điển kia nói *"Vòng
   đời năm học chỉ dành cho Quản trị viên hệ thống"* — đúng cho năm học, **sai** cho lớp. Người bị
   từ chối sẽ đi tìm quyền Super Admin trong khi vấn đề là nhóm ghi toàn xứ đoàn.

**Bốn lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **Nhãn mới là chuỗi BAO CHỨA nhãn cũ nên làm đỏ hai bài test vốn đang xanh.** `getByLabel` khớp theo **chuỗi con**: thêm ô *"Ngày kết thúc học kỳ 1"* vào biểu mẫu tạo năm học làm `getByLabel("Ngày kết thúc")` khớp **hai** phần tử | E2E rớt `strict mode violation` 3/3 viewport ở `academic-year.spec.ts` | `exact: true`. Cùng họ với "Tên hiển thị trùng hai chỗ" (M02-A) và "Vai trò trùng hai chỗ" (M04-C) — nhưng đây là biến thể **mới**: không phải hai nhãn giống nhau, mà một nhãn **chứa** nhãn kia. Mọi đợt sau thêm ô vào biểu mẫu có sẵn phải kiểm lại nhãn cũ |
| 2 | Ô ngày có `min`/`max` thì **trình duyệt chặn trước Zod** | E2E chờ mãi câu lỗi tiếng Việt không hiện | Không phải lỗi sản phẩm mà là bài test sai kỳ vọng: constraint validation của HTML chặn luôn lượt gửi. Bài test đổi sang kiểm **`min`/`max` đọc đúng từ năm học**; câu lỗi Zod kiểm ở unit test, CHECK constraint kiểm ở pgTAP `033` |
| 3 | Vai trò lớp trong pgTAP đòi **một phân công lớp đang hoạt động** | `test:db` rớt `ACTIVE_CLASS_ASSIGNMENT_REQUIRED` | Không phải hồi quy: `app.validate_role_assignment_scope` đòi `class_teacher` phải có `class_staff_assignments` với `capacity='member'`. Thêm dòng phân công vào phần dựng dữ liệu của `033` |
| 4 | Mã năm học xuất hiện **bốn chỗ** trên trang chi tiết lớp | E2E rớt strict mode 3/3 viewport | Thanh đầu trang, breadcrumb và phụ đề đều in mã năm. Bài test neo vào cụm `"Năm học 2026-2027 · Đang áp dụng"` — tức đúng phụ đề, và đồng thời kiểm luôn phần trạng thái năm học |

**Nợ #15 — ĐÃ ĐO, chưa chữa được. Ba giả thuyết, hai bị loại bằng số đo:**

| Giả thuyết | Cách đo | Kết quả |
|---|---|---|
| Cơ sở dữ liệu chậm | `npm run perf:smoke` với **910 thiếu nhi** (gấp ~230 lần dữ liệu mẫu), JWT thật | ❌ **BỊ LOẠI.** Truy vấn trang chi tiết lớp **17 ms**, truy vấn ô chọn thiếu nhi **8 ms**, `/classes` 19 thẻ **21 ms**. Tổng công việc DB của trang ≈ **25 ms**. Điều này cũng **loại luôn cách chữa đang ghi trong nợ #15** (hoãn dựng phần nặng bằng `<Suspense>`) — không có phần nặng nào để hoãn |
| Máy chủ dựng trang chậm | Spec chẩn đoán tạm, 9 lượt `goto` thẳng URL | ❌ **BỊ LOẠI.** 432–1 437 ms, **9/9 không lượt nào treo** |
| Bão nạp trước 19 thẻ làm cạn kết nối trình duyệt | Đo 36 lượt bấm thẻ có nạp trước, rồi 36 lượt với `prefetch={false}` | ❌ **BỊ LOẠI.** 5/36 treo khi có nạp trước, **4/36** khi tắt — trong sai số. Khớp với kết luận của M04-C rằng `prefetch={false}` "không ăn thua"; nay có **số** thay vì cảm nhận. Đã hoàn tác |

**Điều đã khoanh được:** cú bấm **luôn tới đích** (23–123 ms, không lượt nào lỗi), kể cả khi bỏ qua
toàn bộ kiểm tra khả năng bấm của Playwright bằng `dispatchEvent`. Nhưng **~11–14 % lượt (9/72) URL
không bao giờ đổi** trong 45 giây, ở **cả ba viewport**, độc lập với nạp trước. Khi chạy được thì
265–1 269 ms. Trong khi `goto` thẳng **không bao giờ** treo.
⇒ Lỗi nằm hẳn ở **lượt điều hướng phía trình duyệt của Next 15.5** (`router.push` được gọi rồi không
bao giờ chốt), **không** phải ở cơ sở dữ liệu, **không** phải ở máy chủ dựng trang, và **không** phải
lỗi bài test. Đây là một lỗi thật: khoảng **một trong bảy** cú bấm thẻ lớp không dẫn đi đâu cả.

🔴 **Và nó KHÔNG chỉ ở `/classes`.** Lượt chạy toàn bộ bộ E2E cuối đợt (244/246) rớt đúng hai bài
`staff-directory` *"phân trang sang trang 2"* ở mobile-360 và tablet-768, với thông điệp *"Trang 2:
bấm nhiều lần vẫn không có hiệu lực"* — cùng một `clickUntil`, cùng một hình dạng, trên một `<Link>`
**khác route, khác kiểu phần tử** (ô số phân trang của `/staff`, không phải thẻ lớp). Chú thích sẵn
trong `staff-directory.spec.ts` từ M04-B cũng ghi đúng điều đó: *"cùng một bản build, `page.goto`
thẳng tới trang 2 luôn đúng, còn cú bấm đầu tiên có lượt không ăn"*. Ở lượt chạy toàn bộ **trước đó**
(236/246) thì hai bài này xanh mà `class-settings`, `committees`, `results` rớt — tức tập bài đỏ **đổi
chỗ giữa hai lượt**, đúng dấu hiệu một lỗi ngẫu nhiên chung chứ không phải lỗi của từng trang.
⇒ **Nợ #15 được xác nhận là nợ TOÀN HỆ THỐNG, không phải nợ của M02.** Nó cũng là lời giải thích cho
cả họ "E2E chập chờn" đã ghi rải rác ở nợ #10 và ở `attendance.spec.ts`/`staff-directory.spec.ts`:
mọi chỗ đó đều đã phải tự dựng `clickUntil`/`expectSoon` để đi qua **cùng một** triệu chứng.

**Nguyên nhân gốc vẫn CHƯA biết** — chủ dự án chốt phạm vi đợt này là "đo trước, sửa nếu tìm ra
nguyên nhân", nên nợ **giữ nguyên** và các bài E2E vẫn dùng `clickUntil`, tức vẫn đang che triệu chứng.
**Nghi vấn dẫn đầu cho phiên sau, CHƯA kiểm chứng:** `middleware` gọi Supabase làm mới token trên
**mọi** request, kể cả request RSC của lượt điều hướng và của nạp trước. Xoay refresh-token là thao
tác **một-lần-dùng**: hai request cùng lúc cùng xoay thì một trong hai nhận token đã bị thu hồi. Điều
đó khớp cả ba dữ kiện đo được — `goto` (một request đơn độc) **không bao giờ** treo, còn lượt điều
hướng phía trình duyệt (chạy cạnh các request khác) thì thỉnh thoảng treo, và tỷ lệ không đổi khi tắt
nạp trước (vì vẫn còn request của chính lượt điều hướng). Cách kiểm: ghi log thời điểm vào/ra
`updateSession` cùng `sb-*-auth-token` rồi soi đúng lượt treo.

**Nghiệm thu 15 mục (`11` §5) cho đợt M02-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **693 pass / 10 skip** (trước M02-B: 641/10, **+52**) · pgTAP **755/755** (trước: 733/733, **+22**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ `class-settings` **15/15** + `academic-year` **15/15** + `responsive` **12/12** + `security` **9/9** = **51/51 xanh** trên 360 · 768 · 1366. `responsive.spec.ts` thêm bài **trang chi tiết lớp kèm màn hình cài đặt lớp** (`07` §7 đòi khi làm I6) — trang đông ô nhập nhất của M02. **Toàn bộ bộ E2E: 244/246** — hai bài đỏ là `staff-directory` *"phân trang sang trang 2"* ở mobile-360 và tablet-768, **đúng triệu chứng nợ #15 nhưng ở `/staff`**, không phải hồi quy của M02-B (xem §3 nợ #15) |
| Vùng chạm ≥44px | ✅ `Select`/`Input`/`Textarea` đều `h-control`; nút quay lại đổi sang `backHref` (M14-C) nên **hết** liên kết chữ nhỏ không đạt ngưỡng; `responsive.spec.ts` quét `/classes/[classId]` 3/3 |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới |
| Không màu hardcode khi có token | ✅ grep các file sửa: **0 mã hex/rgb/hsl**. Và **trả nợ #5** cho `classes`: 2 lớp có bổ ngữ độ mờ (vốn không tồn tại trong CSS xuất ra) đổi sang token đặc |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ **giảm hai**: hai thẻ `<select>` trần còn lại của trang chi tiết lớp đổi sang component `Select`, và chuỗi class chép tay `selectClassName` bị xoá. Ô chọn trạng thái lớp mới cũng dùng `Select` |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ `updateClass` và `updateSemesterMilestone` đều `.select("id")` ⇒ 0 dòng = thất bại, có câu chữ riêng. Câu thành công **nêu ra trạng thái vừa lưu** chứ không phải "Đã lưu" suông |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ giữ nguyên ba câu chỉ đường có sẵn ("Lớp chưa có thiếu nhi ghi danh", "Chưa phân công nhân sự", "Không còn thiếu nhi nào chưa ghi danh") |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ đóng/tạm ngưng lớp còn em đang sinh hoạt: nêu **tên lớp + số em** + điều dễ hiểu sai nhất (không kết thúc ghi danh). Lớp trống hoặc chỉ đổi phòng sinh hoạt thì **không** hỏi |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò của ai. `classes.updated_by` vẫn ghi như cũ, và RLS bắt buộc `updated_by = auth.uid()` (pgTAP `033` kiểm bằng JWT thật) |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ `ConfirmDialog` (mục 0.6) đã có bẫy focus + `Escape`, hộp mới dùng lại nguyên component đó. Thẻ lớp thêm vòng focus `theme-ring` (09 §4.4 #6) — bản cũ chỉ có hover, mà lớp hover đó lại không tồn tại trong CSS |
| Không dùng màu làm tín hiệu duy nhất | ✅ huy hiệu trạng thái lớp là **chữ tiếng Việt** trong `Badge`; trạng thái năm học là **chữ** trong phụ đề; cảnh báo mốc HK1 là **câu nêu ngày**, không phải màu suông. Thẻ lớp mang màu ngành nhưng **tên ngành vẫn là tiêu đề chữ** của từng khối |
| Nếu siết quyền ⇒ RLS negative bằng JWT thật | ✅ đợt này **không siết quyền mới**, nhưng vẫn kiểm ranh giới bằng JWT thật vì I6 mở một lối ghi mới: pgTAP `033` — **22 test**, trong đó Thư ký **sửa được** cài đặt lớp (chứng minh D-112 không lan sang `classes`), Trưởng ngành và GLV lớp **0 dòng**, mạo danh `updated_by` → `42501`, và cả ba vẫn **đọc được** |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` + `docs/02-database-design.md` (cột mới) + `docs/11-api-and-server-actions.md` + `06_DECISION_LOG.md` (đóng câu hỏi mở số 4). **Không đổi `09`/`10`/`11`**; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

---

#### Đợt M02-C — ✅ XONG (2026-07-26)

**Bốn quyết định của chủ dự án ngày 2026-07-26 mở đường cho đợt này** — đúng ba câu hỏi
`NEEDS_CONFIRMATION` mà M02-B đã hoãn lại, cộng một câu về phạm vi: **D-117** (Q-M02-04 — sau khi
đóng, Super Admin còn ghi được tất cả) · **D-118** (phạm vi hàng rào ghi: ghi danh + lớp trước) ·
**D-119** (Q-M02-08 — đóng năm **không** tự đóng lớp) · **D-120** (Q-M02-09 — `retention_until`
**chặn** lưu trữ trước hạn).

| Mã | Việc | Kết quả thật |
|---|---|---|
| **I7 / TB-F09 · D-73 · BR-M02-N05,N08** | Chốt sổ cuối năm **không có màn hình nào** | 5W-F09 (luồng chấm thấp nhất toàn hệ thống, **21/75**): `docs/03` WF-16 mô tả sáu bước chốt sổ mà hệ thống **chưa cài bước nào**. Năm học chỉ rơi sang `closed` như **tác dụng phụ** của `set_current_academic_year` — nghĩa là người phụ trách không bao giờ được hỏi *"còn 37 em đang ghi danh, chốt sổ luôn chứ?"*, và sáu tháng sau không ai biết năm học bị chốt **lúc nào**, **vì sao**, **do ai**. Nay `/admin` có khối **"Đóng năm học"** với bảng kiểm tiền điều kiện, bắt gõ lại mã năm học, và hộp xác nhận nêu hậu quả bằng tên riêng. **1 migration** `20260726000100`: ba cột `closed_at`/`closed_by`/`close_reason` + RPC `close_academic_year` + `archive_academic_year` + `academic_year_close_checklist` |
| **I7 (bảng kiểm)** | Con số phải do cơ sở dữ liệu đếm | `app.academic_year_open_work()` là **nguồn sự thật duy nhất**, cả giao diện lẫn RPC đều gọi đúng nó — cùng khuôn `staff_profile_delete_blockers` của M04-B. Trang tự đếm là đếm **dưới RLS của người xem**: một buổi điểm danh chưa chốt của lớp mà người xem không được đọc sẽ biến mất khỏi phép đếm, và màn hình sẽ hứa "không còn việc tồn đọng" trước một RPC chắc chắn từ chối. "Bảng điểm chưa khoá" **chỉ đếm lớp đã có bài đánh giá đang dùng** — lớp chưa có bài nào thì không phải "chưa khoá" mà là "chưa có", đếm gộp là mỗi lần chốt sổ đều báo 19 lớp tồn đọng và một con số luôn khác 0 thì người dùng học cách bỏ qua nó |
| **I8 / BR-M02-N06 · D-117 · D-118** | 🔴 Năm đã đóng **vẫn ghi được** | Đây là lỗ hổng nghiêm trọng nhất mà D-73 nêu và tới trước đợt này **vẫn đang mở**. M02-B chỉ dựng chốt chặn ở tầng ứng dụng và đã ghi thẳng trong `year-lifecycle.ts` rằng hàng rào chưa xong: gọi Data API bằng JWT thật vẫn ghi danh được vào một năm đã đóng ba năm trước. **1 migration** `20260726000200`: `app.writable_academic_year_ids()` + hàng rào vào policy INSERT/UPDATE của `enrollments` và `classes`. Super Admin là ngoại lệ duy nhất (D-117) |
| **I8 (cách cài)** | Helper có tham số cột thì gọi lại **từng dòng** | `07_IMPLEMENTATION_IMPACT.md` §2 đề xuất `app.year_is_writable(uuid)`. Không làm theo, và lý do là bài học đã **đo được** của chính repo này (`20260721000200`, `WORKLOG` guardians 79,9 → 8,9 ms): helper `security definer` nhận tham số cột **không inline được**, nên Postgres gọi lại nó cho mỗi dòng của mọi lệnh ghi; bọc `(select …)` cũng không cứu vì biểu thức tham chiếu cột ⇒ subquery **tương quan**, không nâng thành InitPlan. Dạng **mảng không tham số** thì `(select app.writable_academic_year_ids())` chạy **một lần cho cả câu lệnh**. Ngữ nghĩa giữ y nguyên điều TB-F09 mô tả |
| **D-70 / SEC-M02-09 · Q-M02-06** | Phụ huynh đọc được **toàn bộ** 19 lớp và **toàn bộ** năm học | `docs/05` §3 ghi *"lớp con"* / *"lớp mình"* và **❌** ở dòng Năm học, nhưng RLS là `using (app.current_role() is not null)` — cho đọc hết. **1 migration** `20260726000300`: `app.own_student_academic_year_ids()` + hai policy `classes_select_scope`, `academic_years_select_scope`. Phạm vi mới: **mọi lớp mà con/chính mình từng ghi danh** (không chỉ năm hiện hành — em chuyển lớp giữa năm thì cả hai lớp đều là lớp của em) và **năm hiện hành + năm con có ghi danh** |
| **D-70 (không quá tay)** | Bốn đường đi thật đã rà từng cái | D-70 cảnh báo bằng chữ: *"siết quá tay sẽ làm cổng phụ huynh hiện «lớp không xác định»"*. Bốn đường: bộ chọn màu ngành (`enrollments ⟶ classes ⟶ grade_levels ⟶ sectors`) · `/results` phụ huynh (tên lớp + mã năm) · `v_students_at_risk`/`v_upcoming_teaching_items` (`security_invoker`, join `classes` lấy tên lớp) · **thanh đầu trang hiện tên năm học cho MỌI vai trò**. Đường thứ tư là lý do policy năm học có nhánh `status = 'current'`: chặn sạch là cổng phụ huynh hiện *"Chưa đặt năm học"* — một câu **sai**. `sectors`/`grade_levels` **không** bị siết (ghi chú 3 của migration): chúng là danh mục của cả giáo xứ, và siết chúng là lấy mất màu ngành của lớp con — đúng thứ 09 §4.4 #10 vừa dựng |
| **D-120** | Nút "Lưu trữ" phải nghiệm thu được | `seed:dev` nay tạo **hai năm đã đóng khác nhau đúng một điểm**: `2019-2020` (hạn 31/05/2025 — đã qua) và `2024-2025` (hạn 31/05/2030 — chưa tới). Không có chúng thì D-120 không có cách nào nghiệm thu bằng dữ liệu thật, vì một năm đóng hôm nay chỉ lưu trữ được sau 2032. Năm `2019-2020` đồng thời là **đối chứng cho D-70**: con của phụ huynh mẫu không hề học năm đó |
| **Kèm theo (SW-04)** | `endEnrollment` báo thành công khi 0 dòng | Hàm này `update` mà **không** `.select()`. Trước đợt này đó là lỗi tiềm ẩn; từ khi I8 thêm hàng rào vào `enrollments_update_scope` thì nó thành **đường có thật**: RLS chặn bằng cách trả 0 dòng, không lỗi ⇒ người dùng nhận "đã lưu". Nay `.select("id")` + câu nói rõ *"ghi danh có thể thuộc một năm học đã đóng"* |

**Ba quyết định cài đặt cần nhớ:**

1. **`force` KHÔNG nhận từ biểu mẫu, mà suy ra từ việc người dùng có ghi lý do hay không.** Cơ sở
   dữ liệu là chỗ duy nhất biết còn bao nhiêu việc tồn đọng **vào đúng thời điểm bấm nút** — nó đếm
   **sau khi khoá dòng**. Nhận `force` từ client là để giao diện tự quyết một điều nó không có đủ
   thông tin để quyết. Không lý do ⇒ `force = false` ⇒ còn việc dở thì RPC từ chối **và trả về con
   số thật**; có lý do ⇒ `force = true` ⇒ chốt sổ và lưu lý do.
2. **Câu từ chối "còn việc tồn đọng" đi bằng `result.message`, không qua từ điển mã lỗi.** Nó mang
   **con số thật**, đúng khuôn D-113 đã dùng cho *"đặt hiện hành khi chưa đủ lớp"*. Và nó **không**
   đi qua `AppError`: `AppError` chỉ mang mã ổn định (`CONFLICT`) chứ không mang khoá câu chữ, nên
   `failedFromAppError` sẽ suy ngược `CONFLICT` thành *"Mã năm học đã tồn tại"* — một câu vô nghĩa
   ở đây. RPC nhúng chính bảng kiểm nó vừa đếm vào thông điệp lỗi, tầng ứng dụng bóc ra bằng
   `parseOpenWorkFromMessage`; gọi lại bảng kiểm một lượt nữa là mở ra khả năng **hai con số khác
   nhau trên cùng một màn hình**.
3. **Câu thành công phải nói ra hệ quả, không phải "Đã đóng".** Sau khi chốt sổ, hệ thống **không
   còn năm học hiện hành nào** — và người dùng sẽ phát hiện điều đó muộn nhất qua việc thanh đầu
   trang đổi thành *"Chưa đặt năm học"*, lúc đó họ tưởng hệ thống hỏng. Hộp xác nhận nói trước, câu
   thành công nói lại.

**Hai lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | **`getByText("2026-2027").first()` trỏ vào một phần tử ẨN** — mã năm học có mặt ở **ba** chỗ trong vỏ ứng dụng và hai trong số đó ẩn theo cỡ màn hình: `ContextIndicator` ở thanh bên (chỉ hiện từ `lg`), và bản thân thanh năm học có hai biến thể `sm:hidden`/`hidden sm:inline` | E2E rớt ở **mobile-360 và tablet-768** nhưng **xanh ở laptop-1366** — đúng dấu hiệu "phần tử đúng nhưng sai viewport" | Neo vào `<header>` + `toContainText`. Đây là **biến thể thứ ba** của họ lỗi "nhãn trùng nhiều chỗ" (M02-A: hai nhãn giống nhau · M02-B: một nhãn **chứa** nhãn kia · nay: cùng một chuỗi ở nhiều chỗ, **ẩn/hiện theo breakpoint**) |
| 2 | ⚠️ **`pgTAP` có `alike`, không có `like`** — `like` là từ khoá SQL nên pgTAP đặt tên hàm khác | `test:db` rớt `function like(text, unknown, unknown) does not exist`, và **rớt cả plan** (23/37) vì lỗi cắt ngang giữa file | `alike()`. Ghi lại vì nó tốn một lượt chạy: bài kiểm nội dung chuỗi trong pgTAP dùng `alike`/`ialike` (LIKE) hoặc `matches` (regex) |

**Năm bài E2E đỏ ở lượt chạy đầy đủ — phân loại thật, không gộp một câu:**

| Bài đỏ | Đã xác minh chưa | Bằng chứng |
|---|---|---|
| `academic-year:104` *"sinh lớp mặc định"* (laptop-1366), rớt ở lượt hai-spec đầu tiên | ✅ **KHÔNG phải hồi quy** | Chạy lại **không sửa một dòng nào** của đường đi đó ⇒ **33/33 xanh** cả ba viewport. Đúng hình dạng nợ #10 |
| `committees:156` · `staff-directory:71` · `teaching-plan:82` (laptop-1366) | ✅ **KHÔNG phải hồi quy** | Cả ba **xanh ở lượt chạy đầy đủ TRƯỚC ĐÓ** trên cùng bản mã này, và tập bài đỏ **đổi chỗ giữa hai lượt** (lượt trước đỏ `class-settings:163` + `academic-year:104`, lượt sau đỏ ba bài này) — đúng dấu hiệu nợ #10/#15 đã ghi từ M14-C |
| `results:201` (mobile-360 **và** tablet-768) | 🟡 **CHƯA xác minh dứt điểm** | Rớt ở **cả hai lượt đầy đủ**, cùng hai viewport ⇒ không thể gọi là ngẫu nhiên chỉ bằng một lượt. Ba dữ kiện nghiêng về nợ #10: (1) hai lượt rớt ở **hai khẳng định khác nhau** trong cùng một bài (*"Đã lưu 6 dòng điểm"* rồi *nút "Ẩn"*) — không phải hình dạng của một đường bị hỏng hẳn; (2) M02-C **không đụng** bảng nào của đường đi đó (`assessments` · `assessment_scores` · `gradebook_locks` · `leaderboards` đều không có migration mới), và người thao tác trong bài là **Giáo lý viên đại diện** — vai trò nhân sự, không bị D-70 chạm tới; (3) M02-B đã ghi đúng bài này rớt ở **ba dòng khác nhau qua ba lượt** (`:298` · `:307` · `:221`) từ trước khi M02-C tồn tại. **Việc còn thiếu: một lượt chạy CÔ LẬP `results.spec.ts` trên DB sạch** — đúng cách M04-A đã dùng để kết luận. Chưa chạy được vì **Docker Desktop tắt giữa chừng** (bẫy đã biết: stack local hay bị tắt để nhường RAM) |

🔴 **Không ghi bài `results:201` là "đã xác minh".** Phiên sau bật Docker rồi chạy
`npm run db:reset && npm run seed:dev && npm run test:e2e -- tests/e2e/results.spec.ts` là xong —
nếu **24/24 xanh** thì kết luận giống M04-A (biến số chi phối là tải máy); nếu vẫn đỏ ở cùng một
dòng thì đó là **lỗi thật** và phải mở nợ mới.

**Nghiệm thu 15 mục (`11` §5) cho đợt M02-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **729 pass / 10 skip** (trước M02-C: 693/10, **+36**) · pgTAP **810/810** (trước: 755/755, **+55**: `034` 37 + `035` 18) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ **E2E của đợt: `academic-year` 21/21 + `security` 12/12 = 33/33 xanh** trên 360 · 768 · 1366, chạy trên DB vừa `db:reset` + `seed:dev`. ⚠️ **Toàn bộ bộ E2E: 250/255** trên DB sạch (tổng bài tăng 246 → 255 vì đợt này thêm 9 bài = 3 bài × 3 viewport). **Năm bài đỏ nằm ở bốn spec mà M02-C không đụng tới**: `results:201` (mobile-360 + tablet-768) · `committees:156` · `staff-directory:71` · `teaching-plan:82`. Xem dòng cuối bảng để biết phần nào đã xác minh và phần nào **chưa** |
| Vùng chạm ≥44px | ✅ khối mới dùng `Input`/`Textarea`/`Button size="sm"` sẵn có (`h-control`); `responsive.spec.ts` quét `/admin` 3/3 — đây là trang đông biểu mẫu nhất của M02 và nay thêm hai ô nhập |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới |
| Không màu hardcode khi có token | ✅ grep các file sửa: **0 mã hex/rgb/hsl**; cảnh báo trong hộp xác nhận dùng `text-danger` |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ đợt này không thêm ô chọn nào |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ hai thao tác mới đều nói ra kết quả qua `useActionState`; **và trả một nợ tiềm ẩn**: `endEnrollment` thêm `.select("id")` ⇒ 0 dòng = thất bại, có câu nói rõ nguyên nhân có thể là năm học đã đóng |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ bảng kiểm không còn việc tồn đọng thì nói thẳng một câu, không để trống; **không đọc được** bảng kiểm thì nói "chưa đọc được" và **khoá nút** — không bịa số 0 |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ chốt sổ: nêu **tên năm học** + ai còn ghi được (D-117) + **con số việc tồn đọng** + việc hệ thống hết năm hiện hành. Lưu trữ: nêu **tên năm** + ngày hạn + *"một chiều"* + *"dữ liệu không bị xoá"*. Cả hai còn có **ma sát thứ hai**: gõ lại mã năm học, và lý do bắt buộc khi còn việc dở |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ `closed_at` · `closed_by` · `close_reason` nằm ngay trên bản ghi năm học — chốt sổ là thao tác trên **cấu trúc học vụ**, không phải trên tài khoản của ai, nên cố ý **không** dùng `account_audit_events` (bảng đó có phạm vi riêng, D-65). `updated_by` vẫn ghi như cũ |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ `ConfirmDialog` (mục 0.6) đã có bẫy focus + `Escape`; hai hộp mới dùng lại nguyên component đó. Biểu mẫu vẫn là `<form action={…}>` thật nên **chạy được khi chưa có JS** (09 §11): mất hộp xác nhận nhưng hai ma sát còn lại do cơ sở dữ liệu kiểm nên vẫn còn nguyên hiệu lực |
| Không dùng màu làm tín hiệu duy nhất | ✅ bảng kiểm là **danh sách câu chữ nêu số**; trạng thái năm học là **chữ** trong `Badge`; dòng "Lưu trữ được từ sau 31/05/2030" là **câu nêu ngày**, không phải một nút xám không giải thích được gì |
| Nếu siết quyền ⇒ RLS negative bằng JWT thật | ✅ **đợt này có HAI thay đổi siết quyền.** pgTAP `034` (**37 test**): Thư ký và Trưởng ngành `42501` khi đóng/lưu trữ năm; Thư ký `42501` khi ghi danh vào năm đã đóng và **0 dòng** khi sửa lớp/kết thúc ghi danh của năm đó; Trưởng ngành cũng `42501`; **Super Admin vẫn ghi được** (D-117); và **hai bài đối chứng** — Thư ký vẫn ghi danh và sửa lớp được ở năm NHÁP (siết quá tay thì cả hệ thống dừng ghi). pgTAP `035` (**18 test**): phụ huynh chỉ thấy **1** lớp thay vì 3, không đọc được năm con không học; thiếu nhi chỉ thấy lớp mình; **và năm bài "không quá tay"** — năm hiện hành, năm cũ có con học, lớp cũ của con, chuỗi ghi danh⟶lớp⟶cấp⟶ngành, danh mục 5 ngành; cộng **ba bài đối chứng D-69** cho Trưởng ngành (vẫn thấy cả ba lớp và cả ba năm học) |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` + `docs/02-database-design.md` (ba cột mới + vòng đời + hàng rào ghi) + `docs/05-permission-matrix.md` (D-70 + D-117/D-118) + `docs/11-api-and-server-actions.md` (hai action mới) + `06_DECISION_LOG.md` (**D-73 và D-70 đánh dấu ĐÃ CÀI** — D-73 vốn còn câu *"hiện không có chốt chặn nào… lỗi nghiêm trọng đang mở"*, để nguyên là một câu **sai** nằm trong nguồn sự thật). **Không đổi `09`/`10`/`11`**; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |
| — **Việc còn thiếu, ghi rõ thay vì bỏ qua** | 🟡 một lượt chạy **cô lập `results.spec.ts`** trên DB sạch để kết luận dứt điểm bài `results:201`. Chưa chạy được vì Docker Desktop tắt giữa chừng. Lệnh cụ thể nằm ngay dưới bảng "Năm bài E2E đỏ" ở trên |

---

### Module 6 — M03 Thiếu nhi & Phụ huynh · chia ba đợt · ✅ **ĐÓNG 2026-07-28**

M03 là module **điểm thấp nhất trong các module đã chạm tới**: trung bình **49,7/75** trên 13 luồng,
với **hai luồng CRITICAL** — F10 "Kết thúc ghi danh" (**35/75**) và F13 "Cảnh báo trùng" (**29/75**).
`07_IMPLEMENTATION_IMPACT.md` §7 đặt ra một luật thứ tự dứt khoát: *"TB-F14 phải làm trước tiên —
không có kênh phản hồi thì mọi hạng mục sau đều không kiểm chứng được bằng tay"*. Ba đợt chia theo
đúng trục đó.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M03-A** | **Hết ghi im lặng** (TB-F14/BR-M03-N10·N11) · **vòng đời ghi danh**: tạm nghỉ · khôi phục · kết thúc có xác nhận (TB-F10, **D-121**/**D-122**) | ✅ **XONG 2026-07-28** |
| **M03-B** | Cảnh báo trùng dùng chung định nghĩa với đường Excel (TB-F13) · tìm/lọc/phân trang ~900 em (TB-F03) · nối tạo hồ sơ → ghi danh (TB-F02/F09) · **D-63** nới quyền Trưởng/Phó ngành | ✅ **XONG 2026-07-28** |
| **M03-C** | Lưu trữ hồ sơ đồng bộ ghi danh (TB-F06, **rủi ro cao**) · màn hình quản lý người giám hộ (TB-F12) · sửa bản ghi bí tích (TB-F08) · **D-67** mức đọc của Thủ quỹ | ✅ **XONG 2026-07-28** |

> **Ba câu hỏi `NEEDS_CONFIRMATION` của M03 đều chỉ chặn đợt B/C**, không chặn A:
> Q-M03-02 (Trưởng/Phó ngành và GLV có được **ghi** sức khỏe/bí tích không — `docs/05` §3 nói có,
> mã nguồn chỉ cho đọc) · Q-M03-05 (bí tích cho **xoá** hay chỉ cho sửa) · Q-M03-06 (có ghi nhật ký
> khi người dùng bỏ qua cảnh báo trùng không). Q-M03-01 đã có sẵn **D-63**.
> Riêng lưu ý trong D-67 — *Thủ quỹ có được xem ô "hoàn cảnh khó khăn" không* — phải hỏi trước M03-C.
>
> ✅ **CẢ BA ĐÃ CHỐT.** Q-M03-06 = **không lưu vết** (**D-125**, M03-B). Q-M03-02 = **theo đúng bảng
> phân quyền** (**D-127**, M03-C) ⇒ `STUDENT_SENSITIVE_WRITE_ROLES` nay **giao nhau** với
> `STUDENT_WRITE_ROLES` chứ không còn là tập con của nó. Q-M03-05 = **sửa cho mọi người ghi được,
> xoá chỉ cấp xứ đoàn** (**D-128**, M03-C). Lưu ý mở của D-67 = **cho xem** (**D-129**, M03-C).
> **Module M03 không còn câu hỏi nào để ngỏ.**

#### Đợt M03-A — ✅ XONG (2026-07-28)

**Hai quyết định của chủ dự án ngày 2026-07-28 mở đường cho đợt này:** **D-121** (sĩ số **tách hai
số**) · **D-122** (giữ lý do "Chuyển lớp" nhưng **nói thẳng** nó không chuyển em đi đâu cả).

| Mã | Việc | Kết quả thật |
|---|---|---|
| **TB-F10 / AC-F10-01·02·03** | 🔴 **"Tạm nghỉ" chưa từng chạy được lần nào** | Gốc rễ là **một chữ mang hai nghĩa trái ngược ở hai tầng**: cơ sở dữ liệu coi `paused` là trạng thái **MỞ** (nằm trong CHECK `enrollments_open_has_no_end` và trong unique index "một ghi danh mở mỗi năm"), còn ứng dụng xếp nó vào `CLOSE_ENROLLMENT_STATUSES` — danh sách trạng thái **ĐÓNG** — rồi đặt vào ô "Lý do kết thúc", nơi **luôn** gửi kèm một ngày. Mọi lượt "Tạm nghỉ" vì thế vi phạm `23514`, lỗi bị `endEnrollmentFromForm` vứt bỏ, và người dùng thấy trang tải lại với em nằm nguyên trong lớp. Nay ba thao tác **ba biểu mẫu riêng**: `pauseEnrollment`/`resumeEnrollment` **không có ô ngày** ⇒ không còn đường nào tạo ra tình trạng đó |
| **BR-M03-21** | **"Khôi phục" chưa từng tồn tại** | `resumeEnrollment` được `docs/11` §3 yêu cầu từ đầu. Không tạo bản ghi thứ hai: `paused` vốn đã chiếm suất của unique index nên đưa về `active` không thể đụng ràng buộc đó — có pgTAP canh đúng điều này |
| **AC-F10-03 / `11` §5** | Nút "Kết thúc" ghi thẳng, không hỏi (C5 = 1) | `ConfirmDialog` nêu **tên em + tên lớp**. **D-122:** chọn "Chuyển lớp" thì hộp thoại nói *"Thao tác này CHỈ đóng ghi danh ở lớp hiện tại — hệ thống không tự ghi danh em vào lớp mới"*, và **câu thành công cũng nhắc lại** vì người dùng bấm xong là rời trang |
| **D-121** | Sĩ số nói sai | `Sĩ số đang sinh hoạt: N` đếm cả em `paused`. Nay tách: *"Sĩ số 28 · trong đó 2 tạm nghỉ"* ở trang lớp, `· 2 tạm nghỉ` ở thẻ lớp — và **chỉ hiện vế thứ hai khi thật sự có em tạm nghỉ**, để 19 thẻ lớp không mang thêm một dòng "0" |
| **TB-F14 / BR-M03-N10** | **Sáu thao tác ghi im lặng như nhau** | Cả sáu adapter `*FromForm` trả `Promise<void>` — gọi action rồi **vứt kết quả đi** (BR-M03-38). Nay cả sáu đi qua `useActionState` (**D-114**, không dùng `redirect()`): tạo hồ sơ · sửa hồ sơ · sức khỏe · bí tích · tạo giám hộ · bốn thao tác ghi danh |
| **TB-F14 / BR-M03-N11** | 🔴 **Ghi 0 dòng vẫn báo thành công** | `updateStudent`, `saveHealthProfile`, `updateGuardian` đều `.update().eq()` **không kèm `.select()`**. Trong mô hình RLS, **quyền bị từ chối biểu hiện dưới dạng 0 dòng, không phải exception** — nên người không đủ quyền bấm "Lưu thay đổi" và nhận đúng thứ người đủ quyền nhận (5W-F05/F08). Nay 0 dòng là một câu lỗi nêu đúng hai khả năng |
| **AC-F14-01** | Tạo hồ sơ xong không biết mã em là gì | Mã `CQxxxx` do sequence sinh ra nên người nhập **không biết trước**; đây là lần duy nhất nó hiện ra ngay sau khi tạo. Câu thành công nêu **tên em + mã** |
| **AC-F14-03** | Lỗi bắt gõ lại cả hồ sơ | Biểu mẫu "Thêm thiếu nhi" có **mười ô**; nay giữ nguyên toàn bộ khi có lỗi (`create-student-form-state.ts`, cùng khuôn M02-A) |
| **AC-F08-02** | Thêm trùng loại bí tích = "bấm không có gì xảy ra" | Unique index chạy đúng từ đầu (`20260716000100:101-103`), chỉ là mã `23505` bị nuốt. Nay có câu riêng |
| **D-96 / nợ #14** | Mẫu guard sai ở `enrollments` | Trả luôn: `enrollmentRouteContext()` (`requireRouteAccess`, có thể chuyển hướng) gọi **ngoài `try`**; `assertEnrollmentWrite()` ném `AppError` **trong `try`**. Áp cùng khuôn cho `students`/`guardians`. Còn **8 module** |
| **a11y** | Danh sách lớp là một chồng `<div>` | Nay là `<ul>`/`<li>` thật — trình đọc màn hình nghe được "danh sách N mục" trước khi đọc từng em |

**Ba quyết định cài đặt cần nhớ:**

1. 🔴 **MỘT `useActionState` cho cả dòng, không phải ba.** Bản đầu của đợt này dùng ba cái riêng cho
   ba nút rồi hiển thị câu đầu tiên khác `null`. Nhưng `useActionState` **giữ lại** kết quả của lượt
   trước, nên sau khi bấm "Tạm nghỉ" rồi "Khôi phục", dòng thông báo vẫn đứng nguyên ở câu *"Đã
   chuyển … sang Tạm nghỉ"* — tức **nói sai trạng thái hiện tại của em**, đúng loại lỗi cả đợt này
   sinh ra để diệt. Ba biểu mẫu nay cùng gửi vào một adapter, phân nhánh bằng ô ẩn `intent`; ô ẩn
   nên **không có JavaScript vẫn gửi đúng nhánh**.
2. **Một chỗ duy nhất định nghĩa "thế nào là đang mở".** `OPEN_ENROLLMENT_STATUSES` ở
   `enrollment-status.ts` thay cho `OPEN_STATUSES` chép tay trong `classes/server/queries.ts`. Hai
   bản chép tay chính là hình dạng của lỗi F10; để lại bản thứ hai là mời nó quay lại.
3. **Không viết sẵn hàm cho màn hình chưa có.** `updateGuardian` được vá `.select()` nhưng **không**
   thêm `guardianSavedFeedback`, vì màn hình quản lý người giám hộ là TB-F12 của đợt C. Viết trước
   một hàm chưa nơi nào gọi là lặp lại đúng lỗi F12 đang phải chữa: `updateGuardian` viết xong từ
   Phase 2 mà không màn hình nào gọi, nên **không ai phát hiện ra nó trả `ok:true` khi RLS chặn**.

**Ba lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **Câu phản hồi cũ che mất câu mới** (mục 1 ở trên) — lỗi do chính đợt này tạo ra | E2E rớt **3/3 viewport** ở đúng bước "Khôi phục"; unit test không bắt được vì mỗi bài chỉ bấm một nút | Gộp về một `useActionState` + ô ẩn `intent`. Unit test nay canh luôn **ô ẩn có gửi đúng nhánh không** |
| 2 | **pgTAP mới đỏ khi chạy sau `seed:dev`** | Chạy `test:db` lần hai, sau `seed:dev` | Chỉ được tồn tại **một** năm học `current` (`academic_years_one_current_idx`), mà `seed:dev` đã tạo một. Đổi năm của bài test sang `draft` — trạng thái năm học không ảnh hưởng bài nào trong file. **Bớt được một file khỏi danh sách "chỉ chạy được trên DB vừa reset"** mà M02-A đã ghi cho `004`/`006`/`009`/`010` |
| 3 | **Bộ định vị của bài E2E sai, không phải ứng dụng sai** | 12/18 đỏ ở lượt đầu | Hai chỗ: `.locator("div")…last()` rơi vào `<div>` trong cùng (chỉ có tên + huy hiệu, không có nút) ⇒ đổi sang `getByRole("listitem")` sau khi danh sách thành `<ul>` thật; và `getByLabel("Điện thoại")` khớp **hai** ô trên `/students` ⇒ neo phạm vi vào đúng biểu mẫu. Cùng họ lỗi "nhãn trùng hai chỗ" đã gặp ở M02-A, M02-B và M04-C |

**Nghiệm thu 15 mục (`11` §5) cho đợt M03-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **780 pass / 10 skip** (trước M03-A: 729/10, **+51**) · build ✓ **28/28 trang** |
| E2E responsive 3 viewport, không tràn ngang | ✅ `enrollment-lifecycle` **18/18** + `responsive` **12/12** + `security` **12/12** = **42/42 xanh** trên 360 · 768 · 1366, chạy trên DB `db:reset` + `seed:dev` |
| Vùng chạm ≥44px | ✅ ba nút mới dùng `Button size="sm"` sẵn có; `responsive.spec.ts` 12/12 |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới |
| Không màu hardcode khi có token | ✅ grep các file mới: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ và **gỡ được 4 thẻ trần cũ** trên `/students` + `/students/[studentId]` (đổi sang `Select` của Đợt 0-UI khi viết lại biểu mẫu), cùng 5 `<textarea>` trần |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ **đây là trọng tâm của đợt.** Mười thao tác ghi của module nay đều nói ra kết quả, và mọi `update`/`upsert` đều `.select()` ⇒ 0 dòng = thất bại |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ "Lớp chưa có thiếu nhi ghi danh." giữ nguyên dạng câu chỉ đường sang biểu mẫu bên cạnh |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ "Kết thúc ghi danh" nêu **tên em + tên lớp + hệ quả theo từng lý do**. "Tạm nghỉ"/"Khôi phục" **cố ý không hỏi** — hoàn tác được bằng đúng một nút, hỏi ở đây là dạy người dùng bấm "Xác nhận" theo phản xạ |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò của ai. `enrollments.updated_by` vẫn ghi như cũ |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ `ConfirmDialog` (mục 0.6) đã có bẫy focus + `Escape`; danh sách nâng lên `<ul>`/`<li>` nên trình đọc màn hình đọc được cấu trúc |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái ghi danh là **chữ tiếng Việt** trong `Badge`; sĩ số là **câu chữ nêu số**, không phải màu |
| Siết quyền ⇒ RLS negative bằng JWT thật | — **0 thay đổi phân quyền, 0 migration.** Nhưng pgTAP `036` vẫn có **4 bài JWT thật** để chứng minh hàng rào cũ còn đứng sau khi viết lại toàn bộ tầng action: Thủ quỹ đọc `students` và `enrollments` đều **0 dòng** (**S-06**, ca chưa từng có vai này trong bộ kiểm thử), Trưởng ngành quản lý được lớp trong ngành mình |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (đóng M03-F10) + `docs/11-api-and-server-actions.md` §4/§5 (đổi tên action). **Không đổi `09`/`10`/`11`**; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

**Kiểm thử đo được của đợt:** unit **780/10 skip** (**+51**) · pgTAP **831/831** (trước 810, **+21**:
file `036`) · E2E đợt này **42/42** · **toàn bộ E2E 269/273**.

> ⚠️ **Bốn bài đỏ trong lượt E2E toàn bộ** nằm ở `committees.spec.ts:156` · `results.spec.ts:201`
> (hai viewport) · `staff-directory.spec.ts:71` — **ba file đợt này không đụng tới**, và cả bốn đều
> mang đúng hình dạng của **nợ #10** (*"khẳng định sau-thao-tác-ghi chờ cứng, mỏng khi máy chậm"*)
> và **nợ #15** (*"bấm nhiều lần vẫn không có hiệu lực"* — đúng nguyên văn thông điệp của bài
> `staff-directory`). Chạy lại cô lập trên DB sạch: `staff-directory` **xanh**; `committees` và
> `results` thì **không kết luận được** vì chúng đọc dữ liệu do spec chạy TRƯỚC tạo ra — chính là
> **vế (b) của nợ #10** (*"không spec nào tự dọn dữ liệu của mình"*). Đối chiếu: lượt toàn bộ gần
> nhất trước đợt này (M02-B) rớt **2/246**, lượt của M02-C rớt **6 bài ở 5 spec** ⇒ 4/273 không
> phải hồi quy mới. Spec của đợt này chạy **hai lượt trên hai thứ tự khác nhau, 18/18 cả hai lần**.

#### Đợt M03-B — ✅ XONG (2026-07-28)

**Bốn quyết định của chủ dự án ngày 2026-07-28 mở đường cho đợt này:** **D-123** (Trưởng/Phó ngành
tạo hồ sơ **phải chọn lớp trong ngành mình**) · **D-124** (họ đọc được người giám hộ của em trong
ngành mình) · **D-125** (**không** lưu vết việc bỏ qua cảnh báo trùng — Q-M03-06 = không) · **D-126**
(ô tìm kiếm **không dấu**, giống màn hình Nhân sự của M04).

| Mã | Việc | Kết quả thật |
|---|---|---|
| **TB-F13 / AC-F13-01·02·04** | 🔴 **Cảnh báo trùng chỉ che một trong hai cửa vào** | Luồng chấm **29/75 — thấp nhất module**. Nghịch lý: cùng dữ liệu, cùng bảng, nhưng đường **Excel có** dò trùng ba mức còn đường **gõ tay không có gì** — nhập "Maria Nguyễn Thị A, 12/03/2015" hai lần ra hai hồ sơ, hai mã, không một lời cảnh báo. Nguyên nhân gốc: luật dò trùng được viết **thuộc về module Nhập Excel** chứ không thuộc miền `students` (5W-F13). Nay luật nằm ở `src/lib/students/duplicate.ts`, `imports/dedup.ts` chỉ còn là lớp mỏng gọi vào đó ⇒ **hai đường không thể lệch mức**, và có unit test chạy **cùng một cặp dữ liệu qua cả hai đường** để canh đúng điều ấy (AC-F13-04) |
| **AC-F13-03** | Cảnh báo trùng là một cửa rò tiềm năng | Phép dò đọc qua khung nhìn `public.student_directory` khai `security_invoker = true`, tức **chạy bằng quyền người gọi**. Hồ sơ nghi trùng nằm ngoài phạm vi thì người đó không thấy — cảnh báo hụt còn hơn biến chính màn hình cảnh báo thành cửa rò hồ sơ thiếu nhi. Có pgTAP đọc thẳng `pg_class.reloptions` để canh, vì đây là **một thuộc tính có thể mất khi ai đó `create or replace view`** |
| **BR-M03-N09** | Trùng người giám hộ **là chuyện phân quyền**, không phải chuyện gọn gàng | Một gia đình bị nhập thành hai bản ghi mà chỉ một bản có tài khoản ⇒ phụ huynh đăng nhập **chỉ thấy một phần số con của mình** (`app.own_student_ids()` nối theo `guardians.profile_id`), và hệ thống **không có chức năng gộp** để chữa (5W-F01/F02). Nay biểu mẫu giám hộ cũng hai pha, dò theo tên đã bỏ dấu **và** số điện thoại |
| **TB-F03 / AC-F03-01·02** | **~900 em đổ vào một trang, không tìm được** | `getStudentsPageData` trước đợt này **không nhận tham số nào**. Nay có ô tìm · lọc ngành · lọc lớp (kể cả **"Chưa xếp lớp"**) · lọc trạng thái · phân trang 20/trang, **tất cả trong SQL** trên khung nhìn mới. Khác `staff-directory.ts` của M04 (lọc trong bộ nhớ Node) và khác có chủ ý: ở đó vài chục dòng, ở đây ~900 |
| **D-126** | Gõ "tran" không ra "Trần" | `app.fold_vietnamese()` + cột sinh sẵn `students.search_name`. Bản SQL là bản sao chính xác của `foldVietnamese()` bên TypeScript, và **hai bên đều có test canh**: lệch nhau thì ô tìm kiếm **im lặng** không ra kết quả nào. Trong đó có ca chuỗi Unicode **phân rã** (tên vào hệ thống qua tệp Excel xuất từ máy Mac) — thiếu bước `normalize(…, nfc)` thì `translate` không đụng được vào dấu rời |
| **TB-F02/F09 · D-123** | Một hồ sơ có lớp phải đi qua 3–4 màn hình | Ô **"Ghi danh vào lớp"** nằm ngay trên biểu mẫu tạo hồ sơ; hồ sơ và ghi danh sinh ra **trong một giao dịch** (`create_student_with_enrollment`). Em tạo mà chưa xếp lớp thì trang hồ sơ **chủ động mời** ghi danh (BR-M03-N19). Câu thành công nói **cả hai việc** |
| **BR-M03-N20** | Ô chọn em để ghi danh chứa **toàn bộ** bảng `students` | `/classes/[classId]` trước đợt này kéo cả bảng về Node rồi lọc bằng `Set`. Nay lọc trong SQL, **cắt còn 50** và có ô tìm không dấu; **nói ra khi đã cắt** thay vì âm thầm dừng ở 50 dòng |
| **D-63 / D-123** | Trưởng/Phó ngành ghi danh được nhưng **không tạo được hồ sơ** | Mâu thuẫn có từ Phase 2. Nay `students_update_scope` nhận thêm nhánh `app.sector_managed_student_ids()`, và việc tạo đi qua RPC. pgTAP `037` có **bài âm tính đúng như D-63 đòi**: Trưởng ngành Ấu Nhi **không** sửa và **không** tạo được hồ sơ em ngành Thiếu Nhi |
| **D-124** | Trưởng/Phó ngành mở `/students` thấy chỗ phụ huynh là dấu **"—"** | Cùng họ với nợ #13 của M09. `guardians_select_scope` nay có nhánh "người giám hộ của em trong ngành mình", cộng cửa sổ hẹp `list_guardian_options` (chỉ **tên + số điện thoại**) để chọn phụ huynh đã có — cùng khuôn D-97 của M09-B. **Cố ý không dùng** `app.class_scoped_student_ids()` dù nó ngắn hơn: hàm đó gồm cả lớp mình đứng lớp, dùng nó là nới quyền đọc liên lạc phụ huynh cho cả Giáo lý viên — chủ dự án chỉ duyệt cho vai trò **ngành** |
| **nợ #7** | 30/33 component của Đợt 0-UI chưa trang nào dùng | Đợt này đưa **`FilterBar` · `SearchInput` · `Pagination` · `EmptyState` · `BranchChip`** vào trang thật lần đầu. `BranchChip` chạy đúng kịch bản nó được thiết kế cho (`09` §4.4): danh sách nền Huynh Trưởng, **mỗi dòng một chip ngành riêng** |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **HAI cổng quyền, không phải một.** D-63 nới quyền ghi **hồ sơ**, nhưng **Q-M03-02 chưa chốt**
   nên `student_health_*` và `student_sacraments_*` vẫn là `app.can_global_write()`. Gộp một cổng
   là để Trưởng ngành — vốn sửa được hồ sơ ở tab bên cạnh — bấm "Lưu" trên tab Sức khoẻ rồi nhận
   *"0 dòng được cập nhật"*, đúng loại thất bại im lặng M03-A vừa đi diệt. Nên có
   `STUDENT_WRITE_ROLES` và `STUDENT_SENSITIVE_WRITE_ROLES`, `assertStudentWrite` và
   `assertSensitiveWrite`, hai câu từ chối khác nhau, và pgTAP canh đúng chỗ giao nhau.
2. 🔴 **Tạo hồ sơ phải là một HÀM, không phải một `insert`.** Ngành của em suy ra từ lớp em học,
   nên hồ sơ chưa xếp lớp thì "chỉ trong ngành mình" không có gì để kiểm — và tệ hơn, người vừa
   tạo **cũng không đọc lại được** hồ sơ của chính mình (`app.can_access_student` chỉ thấy em qua
   ghi danh), nên `insert … returning` trả 0 dòng và giao diện báo *thất bại* trên một bản ghi đã
   được ghi. Ghi cả hai bảng trong một giao dịch giải quyết cả hai điều cùng lúc. Cùng lý lẽ cho
   `create_guardian_profile`.
3. **Hàm `security definer` bỏ qua RLS, nên hàng rào năm học phải kiểm TAY.** `enrollments_insert_scope`
   — nơi D-117/D-118 đang sống — không chạy bên trong RPC. Bỏ bước ấy là mở lại đúng lỗ hổng M02-C
   vừa bịt; có pgTAP canh ca "năm học đã đóng".
4. **Danh sách lớp KHÔNG gán theo quyền ghi.** Nó phục vụ hai việc: ô chọn của biểu mẫu tạo hồ sơ
   *và* bộ lọc lớp của danh sách. Gộp làm một là để Giáo lý viên mở trang và thấy ô "Lọc theo lớp"
   rỗng trơn — một bộ lọc không lọc được gì. RLS đã giới hạn đúng phạm vi lớp của từng người.

**Bốn lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | **Bộ định vị biểu mẫu tự đánh mất chính nó.** Bài E2E neo biểu mẫu bằng chữ trên nút ("Tạo hồ sơ thiếu nhi"), mà pha hai **đổi chữ nút** thành "Vẫn tạo hồ sơ mới" ⇒ từ pha hai trở đi không còn biểu mẫu nào khớp | E2E rớt 3/3 viewport ở đúng bước xác nhận trùng | Hai biểu mẫu nhận `aria-label` ổn định, bài test neo theo **tên truy cập**. Đây cũng là một cải thiện a11y thật: trình đọc màn hình nay đọc được "biểu mẫu Thêm thiếu nhi" |
| 2 | **`getByRole("listitem").first()` trả về một mục MENU**, không phải em đầu tiên — vỏ ứng dụng cũng có `<li>` | E2E "chip ngành" rớt 3/3 viewport trong khi giao diện đúng | Danh sách nhận `aria-label="Danh sách thiếu nhi"`; bài test neo vào đúng danh sách đó. Cùng họ lỗi "nhãn/vai trò trùng hai chỗ" đã gặp ở M02-A, M02-B, M04-C và M03-A |
| 3 | 🔴 **Spec MỚI của đợt này làm đỏ BỐN bài của M03-A.** Bài tạo hồ sơ ghi danh em vào **Ấu 1A** — lớp duy nhất có thiếu nhi trong `seed:dev`, nên nhiều spec khác **chốt cứng sĩ số của nó**. Ba viewport nối tiếp đẩy sĩ số 2 → 5, và `enrollment-lifecycle.spec.ts:150` khẳng định *"Sĩ số đang sinh hoạt: 2"* rớt theo | lượt E2E **toàn bộ** đầu tiên — chạy riêng spec mới thì 27/27, không thấy gì | Ghi danh vào **Ấu 3B**, lớp không spec nào chốt số. Đây là **vế (b) của nợ #10** (*"không spec nào tự dọn dữ liệu của mình"*) do chính đợt này gây ra, nên phải tự trả chứ không ghi thành nợ. Bài học lặp lại từ M04-A và M02-C: trên một database dùng chung, **một bài test ghi dữ liệu là một bài test sửa hệ thống của bài khác** |
| 4 | 🔴 **`isVisible()` KHÔNG chờ.** Bài test hỏi "có nút xác nhận không" ngay khi Server Action còn đang chạy ⇒ luôn nhận `false`, bỏ qua nút, rồi đứng đợi một câu thành công không bao giờ tới | E2E rớt 3/3 viewport, và **cơ sở dữ liệu thì đã có hàng** | Chờ **một trong hai** kết cục hiện ra (`locator.or()`) rồi mới rẽ nhánh |

**Kiểm thử đo được của đợt:** unit **828 / 10 skip** (**+48**) · pgTAP **869/869** (trước 831,
**+38**: file `037`, toàn bộ bằng JWT thật) · E2E đợt này **27/27** · **toàn bộ E2E 293/300**.

`037` chạy được **cả trên DB vừa `db reset` lẫn sau `seed:dev`** — không thêm file nào vào danh
sách "chỉ chạy được trên DB trắng" mà M02-A đã ghi cho `004`/`006`/`009`/`010`. Bài đếm phạm vi
ban đầu chốt cứng con số 1 và **đỏ ngay khi chạy sau `seed:dev`**; đã đổi sang kiểm **thành viên**
(em này có, em ngành khác không) — điều thật sự cần chứng minh.

⚠️ **Ba lượt E2E toàn bộ, ba tập bài đỏ khác nhau** — và đó chính là kết luận:

| Lượt | Kết quả | Tập bài đỏ |
|---|---|---|
| 1 (trước khi sửa spec) | 293/300 | gồm **4 bài của M03-A** do spec mới ghi danh vào Ấu 1A ⇒ đã tự trả, xem lỗi #3 |
| 2 (sau khi sửa spec) | 294/300 | `results` · `class-settings` ×2 · `committees` · `enrollment-lifecycle:181` · `students-directory` |
| 3 (sau khi nới ngưỡng chờ) | **293/300** | `enrollment-lifecycle` ×2 · `staff-directory` ×2 · `class-settings` · `committees` — **`students-directory` xanh 27/27** |

Không lượt nào rớt cùng một tập, và mọi bài rớt đều mang **một hình dạng duy nhất**: nút còn nguyên
chữ *"Đang lưu…"/"Đang tạo hồ sơ…"* ở trạng thái vô hiệu, hoặc *"bấm nhiều lần vẫn không có hiệu
lực"* (nguyên văn của nợ #15). Đối chiếu: M03-A rớt **4/273**, M02-C rớt **6 bài ở 5 spec** ⇒
7/300 không phải hồi quy mới. Đợt này đóng góp **số đo loại cơ sở dữ liệu khỏi diện nghi vấn** —
xem nợ #10.

**Nghiệm thu 15 mục (`11` §5) cho đợt M03-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **828 pass / 10 skip** (trước M03-B: 780/10, **+48**) · build ✓ **28/28 trang** · pgTAP **869/869** (trước 831, **+38**: file `037`) |
| E2E responsive 3 viewport, không tràn ngang | ✅ `students-directory` **27/27** trên 360 · 768 · 1366, xanh ở **ba lượt** (hai lượt cô lập + lượt toàn bộ cuối cùng) |
| Vùng chạm ≥44px | ✅ không thêm bậc chạm mới: `Pagination` · `SearchInput` · `FilterBar` · `Select` đều là component Đợt 0-UI đã canh 44px bằng test riêng |
| Không cỡ chữ <12px | ✅ bậc nhỏ nhất dùng là `text-2xs` = 12px; lint rule vẫn canh |
| Không màu hardcode khi có token | ✅ grep các file mới: **0 mã hex/rgb/hsl**. Thẻ em đổi `hover:border-primary/50 hover:bg-accent/40` (bổ ngữ độ mờ — **nợ #5**, không sinh ra lớp CSS nào) sang token đặc `hover:border-theme-primary hover:bg-theme-soft` ⇒ **trả thêm 1 chỗ của nợ #5**, và thẻ em **lần đầu tiên có hiệu ứng hover thật** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ mọi ô chọn mới đều dùng `Select` của Đợt 0-UI (D-80) |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ hai thao tác ghi mới (`create_student_with_enrollment`, `create_guardian_profile`) trả **hàng vừa ghi**, nên 0 dòng = thất bại; ghi danh từ trang hồ sơ dùng lại `enrollStudent` đã có `.select()` |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ `EmptyState` loại `no-data`, và **hai câu khác nhau**: *"Chưa có hồ sơ thiếu nhi"* khi không lọc, *"Không có em nào khớp bộ lọc"* + nút Xoá lọc khi đang lọc. Nói sai câu là dẫn người dùng đi tạo lại một em đã có |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | — không áp dụng: đợt này không có thao tác phá huỷ nào. Cảnh báo trùng **cố ý KHÔNG dùng `ConfirmDialog`**: nó không phải xác nhận một hành động nguy hiểm mà là một danh sách để đối chiếu, và người dùng cần **bấm vào tên** để mở hồ sơ đã có |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — **D-125: không lưu vết** việc bỏ qua cảnh báo trùng (Q-M03-06 = không). Đợt này không đụng tài khoản/vai trò của ai |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không có lớp nổi mới; khối cảnh báo trùng là `role="status"` + `aria-live="polite"` nằm trong luồng tài liệu, đọc được bằng bàn phím theo thứ tự tự nhiên |
| Không dùng màu làm tín hiệu duy nhất | ✅ `BranchChip` **luôn có tên ngành bằng chữ** (có bài E2E canh); mức cảnh báo trùng in bằng chữ (*"Gần chắc chắn trùng"*), không bằng màu; "Chưa xếp lớp" là **câu chữ**, không phải ô trống |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration · 2 thay đổi NỚI quyền (D-123, D-124) · 0 siết quyền.** pgTAP `037` **38 bài, toàn bộ bằng JWT thật**, trong đó nhóm âm tính D-63 đòi: Trưởng ngành Ấu Nhi không sửa/không tạo được hồ sơ ngành Thiếu Nhi · không đọc được người giám hộ ngành khác · Giáo lý viên lớp không mở được cửa sổ chọn phụ huynh và không sửa được hồ sơ em lớp mình · **Trưởng ngành không ghi được hồ sơ sức khoẻ** (Q-M03-02 chưa chốt) |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (đóng **M03-F13**) + `docs/11-api-and-server-actions.md` §4. **Không đổi `09`/`10`/`11`**; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

#### Đợt M03-C — ✅ XONG (2026-07-28) · **đóng module 6**

**Bốn quyết định của chủ dự án ngày 2026-07-28 mở đường cho đợt này** — và ba trong bốn là những câu
hỏi `NEEDS_CONFIRMATION` để ngỏ **từ đầu Giai đoạn 2B**: **D-127** (Q-M03-02 = theo đúng bảng phân
quyền `docs/05` §3) · **D-128** (Q-M03-05 = sửa cho mọi người ghi được, **xoá** chỉ cấp xứ đoàn) ·
**D-129** (lưu ý mở của D-67: Thủ quỹ **được** xem dấu "hoàn cảnh khó khăn") · **D-130** (trạng thái
hồ sơ "Tạm nghỉ" **kéo theo** ghi danh).

| Mã | Việc | Kết quả thật |
|---|---|---|
| **TB-F06 / AC-F06-01·02·03** | 🔴 **"Lưu trữ" một em không đóng ghi danh của em** | Luồng chấm **42/75**, và `07_IMPLEMENTATION_IMPACT` xếp **rủi ro cao nhất module**. Gốc rễ là hệ thống có **hai trục trạng thái độc lập** — `students.status` (danh tính) và `enrollments.status` (chỗ trong lớp) — mà **không luật nào ràng buộc chúng**: không trigger, không action gộp, không dòng tài liệu nào nói khi nào chúng phải khớp (5W-F06). Nay `public.set_student_status` đổi **cả hai trong một giao dịch**, và có **hai trigger** làm lưới an toàn chặn tổ hợp vô nghĩa ở cả hai chiều |
| **🔴 S-11** | **Hệ quả PHÂN QUYỀN của F06, và là phần dễ bị bỏ sót nhất** | `08_ACCEPTANCE_CRITERIA` §7 ghi tiêu chí này là *"chưa có — **hiện đang SAI**"*. Vì `app.class_scoped_student_ids()` chỉ nhìn ghi danh còn mở, một em "đã lưu trữ" mà vẫn giữ ghi danh nghĩa là **Giáo lý viên lớp cũ vẫn đọc được hồ sơ và toàn bộ dữ liệu sức khoẻ** của em đã rời đi. Đóng ghi danh cùng lúc là thứ làm tiêu chí ấy đúng — pgTAP `038` có hai bài canh, và hộp xác nhận **nói ra điều đó** vì đây là hệ quả duy nhất người dùng không suy được từ màn hình |
| **TB-F06 / BR-M03-N14** | Ô "Trạng thái" nằm chung nút Lưu với số điện thoại (C5 = 2) | Nay là khối riêng `StudentStatusPanel`, có `ConfirmDialog` nêu **tên em + tên lớp + hệ quả theo từng trạng thái**. 🔴 Gỡ ô khỏi giao diện mà quên gỡ khỏi adapter **nguy hiểm hơn để nguyên**: `formData.get("status") ?? "active"` sẽ âm thầm đặt **mọi em** về "Đang sinh hoạt" mỗi lần ai đó sửa số điện thoại — nên `status` bị loại khỏi cả `updateStudentSchema` lẫn `updateStudentFormAction`, không chỉ khỏi JSX |
| **D-130** | Chữ "Tạm nghỉ" ở **hai trục** nói hai điều khác nhau | Hồ sơ "Tạm nghỉ" ⇒ ghi danh `paused`; "Đang sinh hoạt" ⇒ **khôi phục**. Không có chiều về thì một em đưa sang tạm nghỉ rồi đưa lại sẽ **kẹt**: hồ sơ nói em đi học, sĩ số nói em nghỉ |
| **BR-M03-N13 / AC-F06-04** | Ghi danh được cho em đã rút | Trigger `enrollments_need_active_student`. Ở cơ sở dữ liệu chứ không chỉ ở action vì có **ba** đường ghi vào bảng ấy: biểu mẫu trang lớp · `create_student_with_enrollment` (D-123) · luồng nhập Excel. Kiểm ở một đường là bỏ sót hai |
| **TB-F12 / AC-F12-01** | 🔴 **Không có màn hình nào để sửa người giám hộ** | Luồng chấm **31/75 — thấp nhất module**, và C13/C14 bị chấm **1** với đúng lý do *"không có UI để đánh giá"*. `updateGuardian` viết xong từ **Phase 2** mà không nơi nào gọi ⇒ nhập sai số điện thoại phụ huynh thì không sửa được, mà đó là số gọi khi em ốm giữa buổi học. Hệ quả tinh vi hơn đã ghi ở M03-A: không chỗ gọi nghĩa là **không ai phát hiện ra nó trả `ok:true` khi RLS chặn** suốt hai Phase. Làm theo **phương án B** của `04_TO_BE_FLOWS` (nhúng vào trang chi tiết em); route `/guardians` riêng là phương án A, để dành **M13** — nơi mới thật sự cần "gia đình này có mấy em" |
| **TB-F12 / AC-F12-02 · BR-M03-N16** | Đổi người giám hộ **đổi ngay quyền đọc của hai tài khoản** | `app.own_student_ids()` nối theo `guardians.profile_id`, nên đây là màn hình **duy nhất** trong hệ thống đổi được ai xem được một em — kể cả màn hình tài khoản của M01 cũng không làm được. Vì thế nó là một cửa vào riêng với hộp xác nhận nêu **đủ ba cái tên**, không phải một ô trong biểu mẫu sửa liên lạc. pgTAP canh phụ huynh cũ **mất ngay** quyền đọc (**S-09**) |
| **BR-M03-N17** | Vô hiệu hoá được người giám hộ còn con đang học | Trigger ở cơ sở dữ liệu. `students.guardian_id` là `on delete restrict` — bảng đã tự bảo vệ khỏi **xoá** nhưng chưa có gì bảo vệ khỏi **vô hiệu hoá**, mà hệ quả nghiệp vụ của hai việc là như nhau: `status='inactive'` nghĩa là "đừng gọi số này nữa" |
| **TB-F08 / AC-F08-01** | Nhập sai một lần là **vĩnh viễn** | `docs/11` §3 đòi `upsertStudentSacrament` từ đầu và cơ sở dữ liệu đã cấp sẵn `grant update` từ `20260716000100:176-179` — cái thiếu chỉ là một `id` tuỳ chọn và một nút. Dùng **hai câu lệnh** chứ không phải một `upsert`: `upsert` trên bảng này sẽ đụng unique index `(student_id, sacrament_type)` và biến một lượt **sửa nhầm loại** thành một lượt **ghi đè im lặng** lên bản ghi khác của cùng em |
| **D-128** | Bí tích lỡ thêm vào hồ sơ **nhầm em** | Nay xoá được, nhưng hẹp hơn quyền ghi một bậc và có `ConfirmDialog`. Không phá luật "không hard delete" của `AGENTS` §6: danh sách cấm ở đó là ghi danh · điểm danh · điểm số · báo cáo đã chốt — những thứ **được tham chiếu từ nơi khác**; `student_sacraments` không có bảng nào trỏ tới |
| **D-127** | Sức khoẻ/bí tích chỉ 4 vai trò cấp xứ đoàn ghi được | Nay thêm Trưởng/Phó ngành và Giáo lý viên (đại diện · lớp), **chỉ trong phạm vi mình** — vai trò quyết định "có được bấm không", `app.class_scoped_student_ids()` quyết định "bấm lên em nào". Thiếu vế thứ hai là mở quyền ghi hồ sơ y tế của **cả 900 em** cho một Giáo lý viên dạy 29 em |
| **D-67 / D-129** | 🔴 **Mọi trang của Thủ quỹ đều TRỐNG TRƠN** | Thủ quỹ không nằm trong `app.can_global_read()` nên `/students` của họ không có một dòng nào — đúng như D-67 mô tả. Nay có `public.list_students_for_fees`: tên thánh · họ tên · lớp · ngành · người giám hộ + số điện thoại · dấu hoàn cảnh khó khăn (**D-129**). **Không** ngày sinh, địa chỉ, ghi chú nội bộ, sức khoẻ, bí tích |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **`set_student_status` KHÔNG phải `security definer` — ngược hẳn ba hàm của M03-B.**
   `create_student_with_enrollment` phải là definer vì nó ghi một hồ sơ mà **chính người tạo chưa
   đọc được**. Ở đây ngược lại: em đã tồn tại, đã có lớp, và **mọi hàng rào cần thiết đã nằm trong
   RLS** — `students_update_scope` (phạm vi ngành của D-123) và `enrollments_update_scope` (hàng rào
   năm học đã đóng của D-117/D-118). Viết definer ở đây là **tự tay bỏ qua cả hai** rồi phải chép
   lại chúng bằng tay trong thân hàm. Hai câu lệnh trong một thân hàm vẫn là **một giao dịch**, nên
   tính nguyên tử mà AC-F06-02 đòi không mất gì. pgTAP có bài canh đúng điều này: đóng ghi danh
   thuộc **năm học đã đóng** phải bị từ chối, và cả giao dịch bị huỷ.
2. 🔴 **Cửa sổ hẹp, KHÔNG phải một nhánh trong policy** (D-67). Cách ngắn nhất là thêm `treasurer`
   vào `students_select_scope`, và đó là cách **sai**: RLS lọc theo **DÒNG**, không theo **CỘT**. Mở
   dòng ra là Thủ quỹ đọc được ngày sinh, địa chỉ nhà và ghi chú nội bộ qua Data API bằng chính JWT
   của họ, bất kể giao diện hiện gì — mà D-67 liệt kê đích danh ba thứ đó vào nhóm "KHÔNG được xem".
   Bằng chứng đo được: bài **S-06** ("Thủ quỹ đọc `students` trả 0 dòng") **vẫn xanh** sau đợt này.
3. **Bốn cổng quyền, không cái nào trùng cái nào.** Ghi hồ sơ (D-63) · ghi sức khoẻ/bí tích (D-127) ·
   xoá bí tích (D-128) · lưu trữ hồ sơ (`docs/05` §5). Hai cái đầu **giao nhau chứ không lồng nhau**:
   Giáo lý viên ghi được sức khoẻ nhưng không sửa được ngày sinh; Trưởng ngành làm được cả hai. Gộp
   bất kỳ hai cổng nào là hoặc mở một quyền chưa ai duyệt, hoặc để người dùng bấm một nút rồi nhận
   *"0 dòng được cập nhật"*.
4. **Chọn bản ghi bí tích để sửa bằng ĐƯỜNG DẪN (`?edit=<id>`), không bằng state React.** Nhờ vậy
   nút "Sửa" vẫn chạy khi chưa có JavaScript (`09` §11) — nó là một `<Link>` thật và máy chủ dựng
   sẵn biểu mẫu đã điền. Cùng lý lẽ với ô ẩn `intent` của M03-A.

**Ba lỗi thật bắt được, đều do chạy chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **Biểu mẫu "Cập nhật hồ sơ" vẫn còn ô "Trạng thái" trong khi action đã thôi gửi nó** — một ô bấm vào **không có tác dụng gì**, đúng loại "nút không bao giờ chạy" mà cả module này sinh ra để diệt | E2E rớt 3/3 viewport ở bài đầu tiên (`getByLabel("Trạng thái", { exact: true })` vẫn khớp 1 phần tử) | Gỡ ô khỏi JSX. Bài test giữ nguyên và nay là hàng rào chống việc ai đó thêm lại |
| 2 | **Bộ định vị rơi vào một `<option>` ẩn.** `getByText("Đang sinh hoạt").first()` khớp `<option>` bên trong `<select>` đang đóng ⇒ `toBeVisible` đỏ trong khi giao diện đúng | E2E rớt 2/3 viewport | Kiểm bằng **giá trị của ô chọn** (`toHaveValue`). Cùng họ lỗi "nhãn/vai trò trùng hai chỗ" đã gặp ở M02-A, M02-B, M04-C, M03-A và M03-B |
| 3 | 🔴 **Một bài test ghi dữ liệu rớt giữa chừng làm đỏ NĂM bài sau** | Ba lượt chạy cô lập liên tiếp, mỗi lượt một tập bài đỏ khác nhau | Bài rớt ở **nợ #10** để em nằm lại ở "Tạm nghỉ", mà bộ lọc mặc định của `/students` chỉ hiện em **đang sinh hoạt** ⇒ mọi bài sau không tìm thấy em. Chữa hai lớp: `openStudent` tra với `status=all`, và **ba bài ghi đều bọc `try/finally`** để trả lại trạng thái *kể cả khi chính chúng rớt*. Đây là bài học chung, không riêng đợt này: một lỗi ngẫu nhiên biến thành năm lỗi thì **tập bài đỏ không còn nói lên điều gì** |
| 4 | 🔴 **Link "← Danh sách thiếu nhi" chỉ cao 18px** — dưới ngưỡng vùng chạm 44px của `11` §5. **Lỗi CÓ TỪ PHASE 2**, không phải do đợt này | Bài đo tại chỗ mới viết cho `/students/[studentId]`, đỏ ngay lượt đầu ở cả ba viewport | `inline-flex min-h-11 items-center`. 🔴 Điều đáng ghi lại là **vì sao không ai thấy suốt hai Phase**: `responsive.spec.ts` quét **13 địa chỉ cấp một** và **không có địa chỉ chi tiết nào** — đúng những trang có nhiều điều khiển nhất. Ba trang còn lại cùng lỗi ⇒ **nợ #20** |

**Một khe hở phân quyền tự phát hiện và tự bịt — không có bài test nào bắt được nó:**

Bản đầu của đợt này để luật *"chỉ cấp xứ đoàn được lưu trữ hồ sơ"* (`docs/05` §5) **chỉ nằm ở Server
Action**. Nhưng `students_update_scope` của **D-123** cho vai trò ngành `update` **mọi cột** của em
trong ngành mình — kể cả `status`. Nghĩa là một Trưởng ngành gọi thẳng Data API bằng chính JWT của
mình **vẫn lưu trữ được**, đúng thứ `AGENTS` §5 gọi tên: *"ẩn nút không phải authorization"*. Nay
luật nằm trong trigger `students_status_needs_closed_enrollment`, và pgTAP `038` có **bài âm tính đi
đường vòng** để canh. ⚠️ Nhánh ấy phải kèm `auth.uid() is not null`: mã chạy bằng `service_role`
(script gieo dữ liệu, luồng nhập Excel) **không mang JWT** nên `can_global_write()` trả `false` —
thiếu vế đó là khoá luôn mọi đường quản trị hợp lệ để chặn một đường tấn công.

**Nghiệm thu 15 mục (`11` §5) cho đợt M03-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **891 pass / 10 skip** (trước M03-C: 828/10, **+63**) · build ✓ **28/28 trang** · pgTAP **926/926** (trước 869, **+57**: file `038`) |
| E2E responsive 3 viewport, không tràn ngang | ✅ đo **bốn tab** của `/students/[studentId]` trên 360 · 768 · 1366: `scrollWidth - clientWidth ≤ 1px` ở mọi tổ hợp |
| Vùng chạm ≥44px | ✅ **và đây là lần đầu trang chi tiết được đo**: `responsive.spec.ts` quét 13 địa chỉ cấp một, **không có** `/students/[studentId]`. Bài mới quét `main button, a[href], select, checkbox` — bắt ngay một link **18px** có từ Phase 2 (đã sửa; ba trang cùng lỗi ⇒ **nợ #20**) |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới; lint rule vẫn canh |
| Không màu hardcode khi có token | ✅ grep ba component mới: **0 mã hex/rgb/hsl**, và **0 bổ ngữ độ mờ** trên token màu ⇒ nợ #5 không tăng thêm chỗ nào |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ mọi ô chọn mới dùng `Select` của Đợt 0-UI (D-80) |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ bốn thao tác ghi mới (`setStudentStatus` · `upsertSacrament` · `deleteSacrament` · `changeStudentGuardian`) đều `.select()` hoặc `returning` ⇒ 0 dòng = thất bại. `set_student_status` còn ném lỗi **có tên** cho từng ca (`STUDENT_HAS_OPEN_ENROLLMENT` · `ENROLLMENT_NOT_WRITABLE` · `ARCHIVE_IS_GLOBAL_WRITE` · `STUDENT_NOT_ACTIVE`), mỗi tên một câu tiếng Việt riêng nói ra **việc phải làm trước** |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ tab Bí tích dùng `EmptyState` loại `no-data` thay cho dòng chữ xám *"Chưa có thông tin bí tích."* |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ **ba hộp xác nhận mới**, mỗi hộp nêu đúng thứ người dùng không suy được từ màn hình: đổi trạng thái hồ sơ (**tên em + tên lớp + hệ quả theo từng trạng thái**; ca `archived` nói thêm việc Giáo lý viên **mất quyền đọc**) · xoá bí tích (**tên em + loại bí tích** + *"hệ thống không có thùng rác"*) · đổi người giám hộ (**đủ ba cái tên**: em · người mất quyền · người được quyền) |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò của ai. ⚠️ **Ghi rõ một lựa chọn:** đổi người giám hộ **đổi quyền đọc của hai tài khoản** nhưng **không** vào `account_audit_events` — bảng đó là nhật ký *thao tác tài khoản* (M01-A/D-65), còn đây là sửa một cột của `students`. Vết để lại là `students.updated_by` + `updated_at`. Muốn lưu vết riêng thì đó là một quyết định mới |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ ba hộp thoại mới đều dùng `ConfirmDialog` của mục 0.6 (bẫy focus · `Escape` · trả focus). Danh sách bí tích nâng lên `<ul>`/`<li>` có `aria-label`; ba biểu mẫu mới đều mang `aria-label` ổn định — cũng là cách bài E2E neo vào chúng mà không vỡ khi đổi chữ trên nút (lỗi #1 của M03-B) |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái hồ sơ là **chữ tiếng Việt** trong `Badge`; lớp hiện tại là huy hiệu **mang tên lớp**; "Chưa xếp lớp" là **câu chữ**, không phải ô trống |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration · 3 thay đổi NỚI (D-127 · D-128 · D-67/D-129) · 1 thay đổi SIẾT** (lưu trữ hồ sơ về đúng bốn vai trò xứ đoàn theo `docs/05` §5 — trước đợt này vai trò ngành ghi thẳng cột `status` được). pgTAP `038` **57 bài, toàn bộ bằng JWT thật**, gồm các nhóm âm tính: Dự trưởng phụ tá **không** ghi được sức khoẻ · Giáo lý viên ghi được nhưng **không xoá** được bí tích · Trưởng ngành **không** lưu trữ được kể cả khi ghi thẳng vào bảng · phụ huynh vẫn **không** đọc được sức khoẻ/bí tích (S-01/S-02 giữ xanh) · Thủ quỹ đọc thẳng `students` vẫn **0 dòng** (S-06 giữ xanh) · Giáo lý viên **mất** quyền đọc em đã lưu trữ (**S-11**, trước đợt này đang SAI) · phụ huynh cũ **mất ngay** quyền đọc sau khi đổi giám hộ (**S-09**) |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (đóng **F06 · F08 · F12**, đóng module) + `docs/11-api-and-server-actions.md` §4. **`docs/05-permission-matrix.md` KHÔNG phải sửa dòng nào** — D-127 là mã nguồn đi khớp lại với ma trận, không phải ma trận đổi theo mã nguồn. **Không đổi `09`/`10`/`11`**; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

**Kiểm thử đo được của đợt:** unit **891 / 10 skip** (**+63**) · pgTAP **926/926** (trước 869,
**+57**: file `038`, toàn bộ bằng JWT thật) · E2E đợt này **40/42** · **toàn bộ E2E 328/342**.
Cả hai lượt E2E chạy trên DB vừa `db:reset` + `seed:dev`.

`038` chạy được **cả trên DB vừa reset lẫn sau `seed:dev`** — không thêm file nào vào danh sách
"chỉ chạy được trên DB trắng" mà M02-A đã ghi cho `004`/`006`/`009`/`010`.

⚠️ **Hai bài đỏ của đợt này, và cả hai là CÙNG MỘT BÀI** (`D-130: tạm nghỉ rồi khôi phục`, ở
`mobile-360` và `laptop-1366`) — treo ở **nợ #10**: cơ sở dữ liệu đã ghi xong nhưng câu phản hồi
không về trong 45 giây. Lượt toàn bộ rớt **14/342**, trong đó **8 bài thuộc spec của bốn đợt trước**
(`academic-year` · `class-settings` ×2 · `enrollment-lifecycle` ×3 · `committees` ·
`staff-directory`) và tất cả đều **cùng hình dạng ấy** ⇒ đây không phải hồi quy do M03-C. Đối chiếu:
M03-B rớt 7/300, M03-A rớt 4/273.

🔴 **Số đo có ý nghĩa nhất của đợt này không phải con số đỏ mà là mức độ LAN của nó:**

| Lượt | Bài đỏ trong spec của đợt | Ghi chú |
|---|--:|---|
| 1 (chưa có lớp tự khôi phục) | 6/42 | một bài ghi rớt để em nằm lại ở "Tạm nghỉ" ⇒ năm bài sau đỏ theo |
| 2 (chưa có lớp tự khôi phục) | 9/42 | tập bài đỏ **khác hẳn** lượt 1 |
| 3 (chưa có lớp tự khôi phục) | 7/42 | lại một tập khác |
| 4 (đã có `try/finally` + `status=all`) | **2/42** | **cùng một bài**, và dữ liệu mẫu **sạch hoàn toàn** sau lượt chạy |

Ba lượt đầu có **cùng tần suất treo** như lượt bốn — cái đổi là **thiệt hại lan ra bao xa**. Đó là
điều các module sau nên chép lại: không chữa được nợ #10 thì ít nhất đừng để nó nhân lên.

---

### Module 7 — M12 Nhập Excel · chia ba đợt · ✅ **ĐÓNG 2026-08-03**

`03_AUDIT_RESULTS` chấm module **44/75 — thấp thứ hai toàn hệ thống**, với **3 luồng CRITICAL**.
Nghịch lý của module này đã được chính biên bản audit gọi tên: tầng **parse / normalize / dedup /
RPC / RLS** là *"mức test tốt nhất trong repo"* (C15 = 5, C8 = 5), còn tầng giao diện thì **câm** —
*"mọi thông điệp lỗi được soạn công phu ở tầng dưới đều bị vứt ở tầng trên"*.

`07_IMPLEMENTATION_IMPACT` §3 ước lượng toàn bộ **~9–12 ngày công** và chỉ ra một **gói tối thiểu
(hạng mục 1 + 2 + 3) ≈ 3 ngày gỡ cả ba CRITICAL**. Chia đợt theo đúng gói đó.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M12-A** | **Cả ba lỗi CRITICAL**: phản hồi thật cho mọi thao tác (4.1 / TO-BE 1) · chặn xoá lần nhập đã ghi (4.2 / TO-BE 3) · mặc định an toàn cho dòng trùng (4.3 / TO-BE 2). Kèm Zod ở biên và dịch lỗi ghi ra tiếng Việt | ✅ **XONG 2026-07-29** |
| **M12-B** | Dùng được ở quy mô thật: điền giới tính **hàng loạt** (TO-BE 4 — sổ SYLL thiếu giới tính ở **83% dòng**, mỗi dòng hiện là một lần gửi + tải lại cả trang) · phân trang/lọc dòng và danh sách lần nhập (TO-BE 7) | ✅ **XONG 2026-07-29** |
| **M12-C** | Tải file lỗi/kết quả cho Giáo lý viên bổ sung dữ liệu (TO-BE 5, kèm chống chèn công thức Excel) · migration báo "ghi danh đã bị bỏ qua" (TO-BE 6) · giới hạn dung lượng và số dòng (TO-BE 8, cần NC-01/NC-02) | ✅ **XONG 2026-08-03** ⇒ **M12 ĐÓNG** |

#### Đợt M12-A — ✅ XONG (2026-07-29)

**Ba quyết định của chủ dự án ngày 2026-07-29 mở đường cho đợt này:** **D-131** (huỷ lần nhập chưa
ghi = **đánh dấu**, giữ lại để tra cứu) · **D-132** ("Xoá dữ liệu thô" mở cho **cả bốn vai trò nhập
được**) · **D-133** (dòng trùng **chắc chắn** phải được xác nhận từng dòng mới ghi được).

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 CRITICAL 4.1 / TO-BE 1 / AC-13·14·15** | **Cả năm biểu mẫu của module vứt giá trị trả về** | Bấm "Kiểm tra file" xong màn hình **không đổi một chữ nào** — file hỏng và file tốt trông giống hệt nhau. Gốc rễ (5W §4.1): hai trang là Server Component thuần nên `<form action={…}>` bắt buộc chữ ký `(formData) => Promise<void>`, và quyết định "không client component" được áp **đồng loạt** cho cả màn hình mà phản hồi lỗi là yêu cầu nghiệp vụ. Nay ba Client Component dùng `useActionState` (Phương án A, cùng khuôn **D-114** của `/admin`); câu chữ đã có sẵn ở `parse.ts` **từ Phase 2** nay đến được người đọc. Tải lên thành công thì `redirect` thẳng vào `/imports/<id>` — **route khác**, nên không dính nợ #16 |
| **🔴 CRITICAL 4.2 / TO-BE 3 / AC-16·17** | **Nút "Xoá lần nhập này" xoá được cả lần nhập ĐÃ GHI, không hỏi lại** | Đứng ngay cạnh nút "Ghi", và `import_rows` là nơi **duy nhất** lưu mối nối *"dòng số 5 tạo ra hồ sơ CQ0123"* mà `docs/09` §7 đòi giữ — `on delete cascade` cuốn sạch. Nay tách làm hai theo trạng thái và **không nút nào xoá hàng nữa**: chưa ghi → "Huỷ lần nhập" (**D-131**, đặt `cancelled` + `cancelled_at/by`); đã ghi/đã huỷ → "Xoá dữ liệu thô" (**D-132**, chỉ dọn `raw_json`). Cả ba nút đi qua `ConfirmDialog` nêu **tên file + số dòng** |
| **🔴 Hàng rào nằm ở DB, không chỉ ở Server Action** | Policy `delete` mở cho **mọi** `app.can_global_write()` | Sửa ở tầng ứng dụng là để nguyên một lệnh `DELETE` gọi thẳng Data API bằng JWT thật của Thư ký — đúng bài học M02-B đã ghi và M02-C phải quay lại trả. Migration `20260729000100` thu policy `delete` về **chỉ lần nhập `dry_run` có `committed_rows = 0`** (cả `import_batches` lẫn `import_rows`), và thêm `with check` chặn hạ một lần nhập đã ghi xuống `cancelled`. pgTAP `039` đi **đúng đường vòng đó**, không đi qua giao diện |
| **🔴 CRITICAL 4.3 / TO-BE 2 / AC-18·19·20 / D-133** | **Mọi dòng mặc định "Tạo mới", kể cả dòng trùng gần như chắc chắn** | Bấm thẳng "Ghi" là sinh hồ sơ trùng, mà hệ thống **không có chức năng gộp** hai hồ sơ. Gốc rễ (5W §4.3): giá trị mặc định của **cột trong DB** bị dùng làm mặc định của một **quyết định nghiệp vụ**, và không có trạng thái "chưa quyết định" để ép người dùng chọn. Nay `decideDuplicateRow` đặt mức `high`/`medium` mặc định là **Ghép**, và mức `high` **chặn ghi** cho tới khi người duyệt tự lưu quyết định của dòng đó — cùng khuôn với cách `commitBatch` đang chặn dòng thiếu giới tính. Không thêm cột nào: dấu "chưa quyết định" là một cảnh báo mang trường `duplicate_pending`, gỡ đúng theo cách `setRowGender` gỡ cảnh báo `gender` |
| **AC-20 + BR-M03-N13** | Dò trùng bỏ qua em **không** còn `active` | Em nghỉ rồi quay lại bị tạo hồ sơ thứ hai, mà lịch sử bí tích/sức khoẻ nằm ở hồ sơ cũ. Bỏ bộ lọc `status='active'` — nhưng nếu chỉ làm thế thì sinh ra một mặc định **chắc chắn hỏng**: trigger `enrollments_need_active_student` của **M03-C** từ chối ghi danh cho em không `active`. Nên dòng nào mặc định là Ghép mà hồ sơ đối chiếu đã rút/lưu trữ **cũng bị chặn**, kèm câu nói thẳng việc phải làm: khôi phục hồ sơ ở trang Thiếu nhi trước |
| **AC-18** | Ô chọn "Ghép hồ sơ có sẵn" **không nói ghép vào ai** | Người duyệt được hỏi một câu không có cách nào trả lời đúng. Nay mỗi dòng nghi trùng hiện **mã · họ tên · ngày sinh (dd/MM/yyyy) · SĐT phụ huynh · trạng thái hồ sơ** của hồ sơ đối chiếu, kèm liên kết mở hồ sơ đó |
| **🔴 AC-26 / SEC-16** | **Câu lỗi SQL thô in thẳng ra màn hình** | `[batchId]/page.tsx:90` in nguyên `commit_error`, tức `sqlerrm` — `08_ACCEPTANCE_CRITERIA` §C ghi chỗ này là *"hiện đang vi phạm"*. Nay qua `commitErrorText`: mã đã biết ra câu **nói việc phải làm**, mã lạ rơi vào câu chung, **không nhánh nào** trả lại chuỗi gốc. Câu gốc vẫn nằm trong `import_rows.commit_error` cho quản trị tra. Mã quan trọng nhất là `STUDENT_NOT_ACTIVE` — **mới có từ M03-C**, và `WORKLOG` của đợt đó đã dặn trước rằng M12 phải dịch nó ra |
| **Hạng mục 9 (C6 = 4)** | Bốn thao tác nhận **chuỗi thô** | `setRowAction`/`setRowGender`/`commitBatch`/`deleteBatch` chỉ được kiểm bằng vài câu `if` ở tầng biểu mẫu rồi ném thẳng vào `.eq()` và tham số RPC. Nay có `schemas.ts` (Zod ở boundary, `AGENTS` §7), và `fail()` **nhận ra `ZodError`** nên câu lỗi nói đúng thứ hỏng thay vì nói về *file* |
| **Nợ #14 / D-96 — chỗ chưa ai đếm** | Hàng rào đăng nhập nằm **trong `try`** ở cả năm thao tác | Người hết phiên bấm nút nhận *"Không xử lý được file import. Vui lòng thử lại."* rồi thử lại mãi, vì `fail()` nuốt luôn `redirect()` của Next. Module này **không lọt vào danh sách 8 module của nợ #14** vì nó gọi qua hàm bọc riêng chứ không gọi thẳng `requireAuthContext` — grep tìm nợ đã bỏ sót nó. Nay `importRouteContext()` gọi **ngoài `try`**, `assertImportAccess()` trong `try` |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **Dấu "chưa quyết định" là một CẢNH BÁO, không phải một cột mới.** `04_TO_BE_FLOWS` ghi rõ
   TO-BE 2 *"không đổi schema"*, nhưng AC-19 lại đòi chặn ghi khi *"người duyệt chưa xác nhận"* —
   mà `action` mặc định `merge` thì không phân biệt được "máy đặt" với "người chọn". Cách giải:
   cảnh báo trùng mức `high` mang trường `duplicate_pending`; `setRowAction` đổi nó thành
   `duplicate` (**giữ nguyên câu chữ**, chỉ hết chặn). Đúng cơ chế `setRowGender` đã dùng từ Phase 2
   để gỡ cảnh báo `gender` — không thêm khái niệm mới, không thêm migration.
2. **Migration của đợt này là hàng rào XOÁ, không phải cột mới cho tính năng.** Bốn cột
   `cancelled_at/by` · `raw_purged_at/by` chỉ để giữ vết hai thao tác một chiều — `updated_at` không
   thay được vì nó đổi theo *mọi* lượt cập nhật. `04_TO_BE_FLOWS` đã lường trước phần này
   (*"nếu cần vết đầy đủ thì thêm cột `cancelled_by/cancelled_at`"*).
3. **`redirect()` sau khi tải lên thành công là AN TOÀN vì đích là route khác.** Nợ #16 (D-114) chỉ
   nổ khi chuyển hướng về **chính route đang đứng**. Ở đây `/imports` → `/imports/<id>`, và đó cũng
   chính là điều AC-14 đòi. Ba biểu mẫu còn lại (ghi · huỷ · xoá dữ liệu thô) **không** chuyển hướng
   mà dùng `useActionState` tại chỗ, đúng khuôn D-114.
4. **Nhãn nút xác nhận khác nhãn nút mở** ("Huỷ lần nhập" → "Xác nhận huỷ"). Hai nút cùng tên trong
   một trang là hai thứ trình đọc màn hình đọc lên giống hệt nhau — và cũng là thứ làm bài test
   không neo được vào đúng nút.

**Bốn lỗi thật bắt được, đều do chạy hoặc rà lại chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | **Bài test neo vào `role="alert"` bắt nhầm bộ đọc tên trang của Next** (`__next-route-announcer__` cũng mang `role="alert"`) | E2E đỏ 3/3 viewport với *"strict mode violation: resolved to 2 elements"* — trong khi **sản phẩm đúng**, câu lỗi hiện ra bình thường | Neo **trong biểu mẫu** (`getByRole("form", { name: … })`). Cùng họ lỗi "vai trò trùng hai chỗ" đã gặp ở M02-A, M03-A, M03-B, M03-C |
| 2 | **Đếm `listitem` gộp cả hai tầng danh sách**: mỗi thẻ dòng là `<li>`, mà bên trong nó lại có `<ul>` cảnh báo | E2E đỏ: đợi 2 dòng, nhận 4 | Đếm **con trực tiếp** (`ul[aria-label=…] > li`) |
| 3 | 🔴 **Biểu mẫu có `<input type="file">` KHÔNG gửi được trong jsdom** khi đã chọn tệp — React 19 không chặn kịp, jsdom đi theo đường gửi biểu mẫu gốc | Unit test của `ImportUploadForm` đỏ; dựng lại bằng một biểu mẫu trần **cũng đúng như vậy** ⇒ giới hạn của môi trường kiểm thử, không phải lỗi sản phẩm | Unit test gửi bằng `fireEvent.submit` và **ghi rõ lý do ngay tại chỗ**; đường bấm nút thật do E2E phủ trên trình duyệt thật (AC-13/AC-14 xanh 3/3 viewport) |
| 4 | 🔴 **Lỗi do CHÍNH ĐỢT NÀY gây ra: lần nhập ĐÃ HUỶ vẫn còn nút "Ghi N dòng"** — bấm vào là `commit_import_rows` ném `BATCH_CANCELLED`. Đúng loại "nút không bao giờ chạy" mà cả đợt này sinh ra để diệt | Rà lại luồng sau khi E2E đã xanh: huỷ là **đánh dấu**, nên dòng vẫn ở trạng thái `valid`/`warning` và điều kiện hiện nút (`pendingRows > 0`) vẫn đúng — **D-131 tạo ra một trạng thái mà bản thiết kế nút chưa tính tới** | Nút "Ghi" nay gắn thêm điều kiện `status <> 'cancelled'`, và câu mô tả nói thẳng *"Lần nhập này đã huỷ nên N dòng của nó sẽ không được ghi. Muốn nhập lại thì tải file lên lần nữa."* Thêm **1 bài unit + 1 khẳng định E2E** canh đúng chỗ đó |

**Nghiệm thu 15 mục (`11` §5) cho đợt M12-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **947 pass / 10 skip** (trước M12-A: 891/10, **+56**) · build ✓ **28/28 trang** · pgTAP **947/947** (trước 926, **+21**: file `039`) |
| E2E responsive 3 viewport, không tràn ngang | ✅ bài đo tại chỗ cho `/imports`: `scrollWidth ≤ viewport + 1px` ở 360 · 768 · 1366 |
| Vùng chạm ≥44px | ✅ đo "Kiểm tra file" và "Tải file mẫu" ≥44px ở cả ba viewport. Link "← Danh sách lần nhập" của trang chi tiết dùng `inline-flex min-h-11` ngay từ đầu (nợ #20 không lan sang trang này) |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới |
| Không màu hardcode khi có token | ✅ grep ba component mới + hai trang: **0 mã hex/rgb/hsl**. **Trả một phần nợ #5**: `hover:border-primary/50 hover:bg-accent/40` trên thẻ lần nhập — hai lớp **không tồn tại trong CSS xuất ra**, tức thẻ chưa từng có hiệu ứng hover — đổi sang `hover:border-theme-primary hover:bg-theme-soft` |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ bốn ô chọn của module (lớp đích · giới tính · xử lý dòng) chuyển sang `Select` của Đợt 0-UI (D-80) — **trả nợ #7** cho `imports` |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ **sáu** thao tác ghi đều nói ra kết quả, và `setRowAction`/`setRowGender`/`cancelBatch`/`purgeBatchRawData` đều `.select("id")` ⇒ **0 dòng = thất bại**, không còn báo thành công khi RLS chặn. Kết quả ghi liệt kê **từng dòng lỗi** `#số dòng — lý do` (AC-15), và đếm **riêng** số dòng "Bỏ qua" — gộp nó vào lỗi là vu cho người dùng một lỗi mà chính họ vừa chọn |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ hai chỗ (`chưa có năm học hiện hành`, `chưa có lần nhập nào`) đổi từ dòng chữ xám sang `EmptyState` loại `no-data`, nêu **tên năm học cụ thể** |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ **ba hộp xác nhận mới**, mỗi hộp nêu **tên file + số dòng** và đúng thứ người dùng không suy được từ màn hình: ghi (*hồ sơ đã tạo **không xoá được***) · huỷ (*lần nhập vẫn **được giữ lại***) · xoá dữ liệu thô (*kể đúng những gì mất, và những gì **không** mất*) |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò. Vết của hai thao tác một chiều nằm ở **bốn cột mới** của `import_batches` (D-131/D-132) |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ ba hộp thoại đều dùng `ConfirmDialog` của mục 0.6 (bẫy focus · `Escape` · trả focus). Hai danh sách nâng lên `<ul>`/`<li>` có `aria-label`; biểu mẫu tải lên mang `aria-label` ổn định |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái lần nhập và trạng thái dòng là **chữ tiếng Việt** trong `Badge` (có icon theo tone); dòng chờ xác nhận trùng mang huy hiệu **"Chờ xác nhận trùng"** |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration · 0 thay đổi NỚI · 1 thay đổi SIẾT** (xoá lần nhập thu về đúng lần nhập chưa ghi). pgTAP `039` **21 bài, toàn bộ bằng JWT thật**: Thư ký xoá lần nhập đã ghi ⇒ **0 tác dụng**, mapping `created_student_id` còn nguyên · xoá thẳng `import_rows` của lần nhập đã ghi cũng không được · hạ lần nhập đã ghi xuống "Đã huỷ" ⇒ **42501** · huỷ lần nhập chưa ghi thì **không mất dòng nào** · xoá `raw_json` **không đụng** mapping · đối chứng: Giáo lý viên lớp thấy **0 dòng** và không xoá/đổi được gì |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` + `docs/09-data-import-and-seed.md` §5/§6 (ba ghi chú cập nhật D-131/D-132/D-133). **Không đổi `09`/`10`/`11`** của `ui-redesign`; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

**Kiểm thử đo được của đợt:** unit **947 / 10 skip** (**+56**) · pgTAP **947/947** (**+21**) ·
build ✓ **28/28** · E2E của đợt **15/15** trên 360 · 768 · 1366 · **toàn bộ E2E 351/357**. Cả hai
lượt E2E chạy trên DB vừa `db:reset` + `seed:dev`.

🔴 **Sáu bài đỏ của lượt toàn bộ, và KHÔNG bài nào thuộc M12.** Cả sáu nằm ở spec của **bốn đợt
trước** (`staff-directory` ×2 · `student-lifecycle` · `students-directory` · `class-settings` ·
`enrollment-lifecycle`) và tất cả **cùng một hình dạng** của **nợ #10**: thao tác ghi bấm xong,
trang không kịp hiện trạng thái mới trong 30–45 giây. Đối chiếu với các đợt trước để thấy đây không
phải hồi quy: M03-C **14/342**, M03-B **7/300**, M03-A **4/273**. Lượt này **6/357** — tỷ lệ đỏ thấp
nhất kể từ khi bắt đầu đo (1,7 % so với 4,1 % của M03-C), và toàn bộ 15 bài của module vừa làm đều
xanh ở **cả hai** lượt (lượt toàn bộ, và lượt chạy lại trên bản mã cuối sau khi sửa nút "Ghi" của
lần nhập đã huỷ).

🔴 **Không bài E2E nào bấm "Ghi"**, và đó là chủ ý: ghi là tạo hồ sơ thiếu nhi thật, mà `students`
**không cho xoá**. Ba viewport dùng chung một database (`workers: 1`), nên một bài ghi dữ liệu là
một bài sửa hệ thống của bài khác — bài học đã trả giá ở M04-A, M02-C và M03-B. Đường ghi do pgTAP
`011` (RPC thật, 26 bài) và unit test của `BatchActions` phủ. Mỗi bài tải file lên **tự huỷ lần nhập
của mình trong `finally`**, kể cả khi chính nó rớt (cách chặn thiệt hại M03-C đã dặn).

**Ba việc CỐ Ý không làm ở đợt này** (đều đã có chỗ trong M12-B/M12-C, không phải bỏ quên):

- **Điền giới tính hàng loạt** — mỗi dòng vẫn là một lần gửi. Sổ SYLL thiếu giới tính ở **83% dòng**
  nên đây là việc nặng tay nhất còn lại; nó đi cùng bảng duyệt mới của **M12-B**.
- **Tải file lỗi/kết quả** — `docs/09` §9 đòi, và nó là **cầu nối duy nhất** tới Giáo lý viên lớp
  (người có dữ liệu thiếu nhưng **không có quyền vào `/imports`**). Cần thêm phần chống chèn công
  thức Excel ⇒ **M12-C**.
- **Cảnh báo "ghi danh đã bị bỏ qua"** (`on conflict do nothing`) — cần **đổi kiểu trả về của RPC**,
  tức `drop function` + `create` + cấp lại `grant execute`; `07_IMPLEMENTATION_IMPACT` xếp **rủi ro
  trung bình** và khuyến nghị làm **cuối cùng** ⇒ **M12-C**.

#### Đợt M12-B — ✅ XONG (2026-07-29)

**Ba quyết định của chủ dự án ngày 2026-07-29 mở đường cho đợt này:** **D-134** (bảng trên máy tính,
thẻ trên điện thoại, **một cây DOM**) · **D-135** (danh sách lần nhập mặc định lọc **năm học hiện
hành**) · **D-136** (nút lưu chung gồm cả giới tính lẫn cách xử lý, **trừ** dòng trùng chắc chắn —
tức **D-133 của đợt trước vẫn đứng nguyên**).

**0 migration · 0 thay đổi phân quyền.** Đây là đợt thuần giao diện + truy vấn: mọi hàng rào của
module đã dựng xong ở M12-A.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 TO-BE 4 / AC-21 / BR-M12-36** | **Sổ SYLL thiếu giới tính ở 83% dòng, mà mỗi dòng là một lần gửi** | `03_AUDIT_RESULTS` chấm tiêu chí *"số bước hợp lý"* **2/5** — thấp nhất module — vì mỗi dòng là một `<form>` riêng: chọn xong bấm Lưu, **chờ cả trang dựng lại**, rồi mới tới em tiếp theo. Sổ 30 em = 30 lượt như thế trên một trang đang hiện đủ 30 thẻ; sổ 300 em thì không ai làm nổi. Nay **một** biểu mẫu mang cả trang dòng: chọn liên tục rồi bấm **"Lưu tất cả thay đổi"** một lần. Kèm **"Áp dụng Nam/Nữ cho các dòng đang chọn"** — chép **lựa chọn của con người** xuống nhiều dòng, **không** có nút "Đoán theo tên đệm" (`docs/09` §2b cấm đoán, và BR-M12-36 nói thẳng "không bao giờ tự suy đoán") |
| **🔴 D-136 — thứ KHÔNG được lưu hàng loạt** | Nút lưu chung **bỏ qua** cách xử lý của dòng trùng chắc chắn | Một nút gộp xác nhận được hai chục dòng trùng bằng một cú bấm là đúng thứ **D-133** vừa chốt hôm trước để chặn. Nay dòng ấy có nút **"Xác nhận dòng #N"** của riêng nó, **nằm bên trong khối đối chiếu phải mở ra mới bấm được** — người duyệt nhìn hồ sơ trước, đúng điều D-133 muốn. Và lượt lưu chung **nói ra** số dòng bị bỏ qua kèm số dòng cụ thể, chứ không im lặng: im lặng nghĩa là người duyệt tưởng đã xong rồi mới phát hiện lúc bấm Ghi bị chặn |
| **🔴 TO-BE 7 / AC-25** | **Trang chi tiết đổ TOÀN BỘ dòng vào một lượt dựng** | Một sổ lớp thật là 300–900 dòng. Nay **50 dòng/trang** + bộ lọc *Tất cả / Lỗi / Cảnh báo / Hợp lệ / Đã ghi / Bỏ qua*, dựng bằng `FilterBar` + `Pagination` của Đợt 0-UI — `<form method="get">` và `<Link>` thật, nên **chép được đường dẫn trang 3** và **chạy không cần JS** (`09` §11). Bài E2E canh đúng điều đó: lọc xong mở lại thẳng đường dẫn ấy phải ra đúng kết quả |
| **🔴 Cái bẫy của phân trang, và nó im lặng** | Ba con số ở đầu trang **không** suy ra được từ trang đang xem | Trước đợt này trang đếm `batch.rows.filter(…)` trên **toàn bộ** dòng để ra nút *"Ghi N dòng"* và dải cảnh báo dòng chưa xác nhận. Cắt trang xong mà giữ nguyên phép đếm ấy thì một lần nhập 900 dòng hiện nút **"Ghi 50 dòng"** — một con số sai mà **không có gì báo là sai**. Nay `pendingRows`, `undecidedCount` và `missingGenderCount` đếm **trong cơ sở dữ liệu**, độc lập với trang đang xem, mỗi con số kèm **5 số dòng cụ thể** |
| **TO-BE 7** | Danh sách lần nhập: `.limit(20)` viết cứng, **không nói ai tải lên** | Lần nhập thứ 21 trở đi **không có đường nào mở ra xem**, kể cả khi biết chắc nó tồn tại — mà từ **D-131** ("huỷ" là đánh dấu, không xoá) thì số lần nhập chỉ tăng, không bao giờ giảm. Nay có phân trang, lọc theo **năm học** (mặc định năm hiện hành, D-135) và **trạng thái**, và mỗi thẻ nói **ai tải file lên**. Tài khoản đã xoá để lại `uploaded_by = null` ⇒ in *"người tải lên không còn tài khoản"* chứ **không** in dấu gạch vào chỗ chờ tên người (bài học nợ #13 của M09) |
| **Dọn mã chết** | `setRowAction` · `setRowGender` · `BatchRowCard` đã bị thay | Xoá hẳn thay vì để lại: một Server Action còn `export` **vẫn là một đầu vào còn gọi được** dù không màn hình nào dẫn tới nó nữa. Hai schema Zod của riêng chúng gộp vào `rowEditsSchema` |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **Một cây DOM, hai hình dạng — không phải hai bản ẩn bớt bằng CSS** (D-134). Dựng hai bản
   nghĩa là **hai ô nhập cùng tên** cùng gửi lên; khi JavaScript chưa chạy thì bản đang ẩn vẫn gửi
   giá trị cũ của nó và máy chủ nhận **hai câu trả lời cho một câu hỏi**. Cách đã chọn: mỗi dòng là
   **một `<tbody>` riêng** — dưới `md` là thẻ có viền, từ `md` là một nhóm hàng của bảng thật.
2. **Bản nháp phía trình duyệt phải theo kịp máy chủ.** Sau mỗi lượt lưu, `revalidatePath` đưa dòng
   mới xuống nhưng component **không** bị dựng lại, nên state cũ sẽ tiếp tục hiện thứ người dùng vừa
   chọn — kể cả những dòng máy chủ **cố ý không lưu** (dòng trùng chắc chắn). Đó là một lời nói dối
   im lặng: màn hình bảo "đã Ghép" trong khi cơ sở dữ liệu vẫn để "Tạo mới". Đã đặt một **dấu vân
   tay** của dữ liệu máy chủ; nó đổi thì nháp được đặt lại về đúng sự thật. Có unit test canh.
3. **Hai nút "Áp dụng Nam/Nữ" là nút GỬI thật, không phải nút chỉ chạy bằng JS.** Có JS thì
   `preventDefault()` và điền tại chỗ (không đi vòng máy chủ); chưa có JS thì máy chủ áp đúng những
   dòng đang được đánh dấu. Vì thế chúng **không** được vô hiệu hoá theo số dòng đang chọn — lúc
   chưa hydrate con số ấy luôn bằng 0, vô hiệu hoá theo nó là khoá chết đúng cái đường dự phòng.
4. **Lọc theo `id` dòng phải kèm `batch_id`.** Id dòng đến từ biểu mẫu, nên một `rowId` của lần nhập
   **khác** vẫn là một UUID hợp lệ; thiếu vế `batch_id` thì `revalidatePath` báo đúng trang này
   trong khi dữ liệu vừa đổi ở một lần nhập khác — sai hoàn toàn im lặng.

**Ba lỗi thật bắt được, cả ba đều do CHẠY chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴🔴 **`contains()` trên cột jsonb nhận MẢNG JavaScript thì hỏng — và hỏng IM LẶNG.** supabase-js hiểu mảng là mảng kiểu Postgres nên sinh ra `cs.{[object Object]}`; PostgREST trả *"invalid input syntax for type json"*, nhưng lỗi ấy **không ném ra**: nó nằm trong `error` của kết quả, còn `count` là `null` và `count ?? 0` biến nó thành **số 0 trông rất hợp lý**. Hậu quả đo được: một lần nhập thiếu giới tính **cả ba dòng** hiện màn hình sạch bong, không một dải cảnh báo nào | E2E đỏ 3/3 viewport ở bài AC-21; dựng một kịch bản dò riêng chạy cả ba dạng tham số để khoanh | Truyền **chuỗi JSON** (`JSON.stringify([{ field }])`). Đã đo lại bằng cùng kịch bản: 3/3 dòng khớp |
| 2 | **Ngưỡng 30 giây mặc định của Playwright là TRẦN CỦA CẢ BÀI**, nên mọi `expect(…, { timeout: 45_000 })` viết trong bài đều bị nó cắt trước — kể cả những chỗ M12-A đã viết | Bài AC-25 rớt ở `waitForURL` với đúng thông điệp *"Test timeout of 30000ms exceeded"* trong khi lần nhập **đã nằm trong cơ sở dữ liệu** | `test.setTimeout(90_000)` cho các bài có tải file lên, kèm ghi rõ lý do tại chỗ. Đo được ngay sau đó: một lượt lưu hàng loạt mất **47,9 giây** ở `laptop-1366` — đúng hình dạng nợ #10, và với trần 30 giây thì nó **không bao giờ đo được** |
| 3 | **Liên kết "Xoá lọc" bấm không có hiệu lực** ở `laptop-1366`, trong khi hai viewport kia xanh | Lượt chạy ba viewport đầu tiên của đợt | Bọc `clickUntil` như `attendance.spec.ts`. ⚠️ **Vẫn là che triệu chứng**, nhưng nó đóng góp một dữ kiện mới cho **nợ #15**: đây là một `<Link>` **chỉ đọc**, không ghi gì, không gọi Server Action ⇒ loại nốt giả thuyết "thao tác ghi chậm" |

**Nghiệm thu 15 mục (`11` §5) cho đợt M12-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **970 pass / 10 skip** (trước M12-B: 947/10, **+23** — đã trừ phần xoá theo `BatchRowCard`) · build ✓ **28/28 trang** · pgTAP **947/947** (không đổi: đợt này **0 migration**) |
| E2E responsive 3 viewport, không tràn ngang | ✅ bài đo tại chỗ mới cho **trang chi tiết** `/imports/[batchId]`: `scrollWidth ≤ viewport + 1px` ở 360 · 768 · 1366 — tức bảng sửa dòng mới không làm tràn ngang máy 360px (**trả đúng lời dặn của nợ #20**) |
| Vùng chạm ≥44px | ✅ đo **bốn** điều khiển của bảng: ô chọn giới tính · ô chọn xử lý · nút "Lưu tất cả thay đổi" · link "← Danh sách lần nhập", cả ba viewport. Ô đánh dấu dòng nằm trong `<label>` cao `min-h-11`, không phải ô 20px trần |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới; nhãn cột trong dạng thẻ dùng `text-xs` = 12px, đúng sàn cứng |
| Không màu hardcode khi có token | ✅ grep hai component mới + hai trang: **0 mã hex/rgb/hsl**. **Trả thêm một phần nợ #5** — xem nợ #5 |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ mọi ô chọn mới đều là `Select` của Đợt 0-UI (D-80) — hai ô lọc và hai ô của mỗi dòng |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ lượt lưu hàng loạt nói ra **ba con số khác nhau**: đã lưu · cố ý bỏ qua (dòng trùng, kèm số dòng) · hỏng thật (kèm từng dòng). Con số "đã lưu" đếm bằng **số dòng cơ sở dữ liệu trả về** (`.select("id")`), không phải số dòng gửi lên ⇒ RLS chặn thì **không** báo thành công |
| Trạng thái rỗng đúng 1 trong 3 loại | ✅ hai chỗ mới đều `EmptyState` loại `no-data`, và **nói hai câu khác nhau** cho hai tình huống khác nhau (`09` §9): "không khớp bộ lọc" kèm nút Xoá bộ lọc, khác hẳn "chưa có lần nhập nào" |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | ✅ ba hộp xác nhận của M12-A giữ nguyên. Lưu giới tính/cách xử lý **không** phải thao tác nguy hiểm: chưa ghi gì vào hồ sơ thiếu nhi, sửa lại được tới lúc bấm Ghi |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ mọi ô chọn của bảng mang `aria-label` **nêu số dòng** (`"Giới tính của dòng 12"`), nên trình đọc màn hình biết đang ở dòng nào. Khối chi tiết là `<details>` native — mở/đóng được **không cần JS** và trình đọc màn hình đã hiểu sẵn trạng thái mở (cùng lý lẽ D-82 của `Dropdown`) |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái dòng là **chữ tiếng Việt** trong `Badge`; dòng chờ xác nhận trùng mang huy hiệu **"Chờ xác nhận trùng"**; trong dạng thẻ mỗi ô có **nhãn cột bằng chữ** đứng trước giá trị |
| Siết quyền ⇒ RLS negative bằng JWT thật | — không áp dụng: **0 migration · 0 thay đổi phân quyền**. Hàng rào của module do `20260729000100` (M12-A) và pgTAP `039` giữ, chạy lại **947/947 xanh** |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` + `docs/09-data-import-and-seed.md` §2b (ghi chú TO-BE 4). **Không đổi `09`/`10`/`11`** của `ui-redesign`; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

**Kiểm thử đo được của đợt:** unit **970 / 10 skip** (**+23**) · pgTAP **947/947** (0 migration) ·
lint **0 warning** · typecheck ✓ · build ✓ **28/28** · **toàn bộ E2E 361/372** trên DB vừa
`db:reset` + `seed:dev`.

🔴 **Mười một bài đỏ của lượt toàn bộ, trong đó ĐÚNG MỘT bài thuộc `imports`** — và cả mười một đều
cùng một hình dạng của **nợ #10**: *thao tác ghi bấm xong, câu trả lời không về trong 45 giây*. Mười
bài kia nằm ở spec của các đợt trước (`student-lifecycle` ×3 · `class-settings` ×2 ·
`students-directory` · `teaching-plan` · `committees` · `results`). Đối chiếu: M12-A **6/357** ·
M03-C **14/342** · M03-B **7/300**.

🔴 **Và đây là số đo trung thực hơn con số ấy: bộ `imports` chạy RIÊNG bốn lượt, mỗi lượt trên DB vừa
reset + seed, cho `30/30 · 30/30 · 29/30 · 28/30`.** Ba bài đỏ của hai lượt sau đều mất **46–47 giây**
rồi mới rớt, đều thuộc **luồng huỷ lần nhập của M12-A** (mã không đổi ở đợt này), và **đổi chỗ giữa
các lượt** — không lượt nào rớt cùng một bài trên cùng một viewport. Không bài nào trong số đó thuộc
ba luồng mới của đợt B. Ghi lại nguyên văn thay vì chạy tới khi xanh: theo đúng ghi chú của nợ #10,
**một lượt xanh không phải bằng chứng đã sửa**, mà một lượt đỏ ở ngưỡng 46 giây cũng không phải bằng
chứng có hồi quy. Biến số chi phối đã được khoanh từ M04-A và M02-C là **tải máy**; phiên này chạy
năm lượt E2E đầy đủ liên tiếp trên cùng một máy.

#### Đợt M12-C — ✅ XONG (2026-08-03) ⇒ **M12 ĐÓNG**

**Hai quyết định của chủ dự án ngày 2026-08-03 mở đường cho đợt này, và cả hai là câu trả lời cho
đúng hai mục `NEEDS_CONFIRMATION` mà `08_ACCEPTANCE_CRITERIA` §D treo từ Giai đoạn 1:** **D-137**
(NC-01 — trần dung lượng **4 MB**, cấu hình nền tảng **4,5 MB**) · **D-138** (NC-02 — **1.000 dòng**
một file).

**1 migration · 0 thay đổi phân quyền.** Migration là **drop + create `commit_import_rows`** — chỗ
`07_IMPLEMENTATION_IMPACT` §2.3 xếp rủi ro **trung bình** và khuyến nghị làm **cuối cùng**.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 TO-BE 6 / AC-24 / BR-M12-39** | **Dòng báo "đã ghi" trong khi em KHÔNG được xếp vào lớp** | `enrollments` có unique index *một ghi danh đang mở / một em / một năm* (D-11), nên `insert … on conflict do nothing` **im lặng không làm gì** khi em đã có lớp — dòng vẫn `committed`, người nhập tin rằng lớp trong file đã được áp dụng, còn Giáo lý viên lớp mới thì không bao giờ thấy em. Đây **không phải ca hiếm mà là đường đi thường gặp nhất** của module: nhập lại sổ đầu năm sau khi sửa vài dòng, hoặc một em có tên trong sổ của hai lớp. Nay `returning id into v_enrollment_id`: dòng **vẫn** `committed` (hồ sơ em có thật — nói là lỗi thì sai), nhưng mang cảnh báo `field = enrollment` **nêu đúng tên lớp em đang học**, và cột trả về mới `out_enrollment_created` để lượt ghi đếm riêng con số ấy |
| **🔴 Chỗ rủi ro nhất của cả module, và nó KHÔNG nằm ở phần nghiệp vụ** | `drop function` **mang theo mọi quyền đã cấp** | Đổi `returns table` bắt buộc drop rồi tạo lại. Quên `grant execute … to authenticated` là **gãy toàn bộ luồng nhập** cho mọi người dùng thật, mà triệu chứng — lỗi `42501` — trông **hệt như lỗi RLS**, tức phiên sau sẽ đi tìm ở nhầm chỗ. Ba bài **đầu tiên** của pgTAP `040` canh đúng chỗ đó: hàm còn đúng chữ ký · `authenticated` **có** quyền execute · `anon` **không** có |
| **AC-24 — câu chữ không được nói dối theo hướng ngược lại** | "Lớp khác" khi em đang ở **đúng** lớp trong file | Nếu chỉ dùng nguyên văn câu của AC-24 thì ca em đã ở đúng lớp sẽ nhận câu *"đã có ghi danh ở lớp **khác**"* — vu cho người nhập một lỗi không có. RPC tra lại ghi danh đang mở rồi chọn một trong hai câu; ca "lớp khác" giữ **nguyên văn** câu AC-24 rồi nối thêm tên lớp và việc phải làm |
| **Ba con số, không phải hai** | `enrollmentSkipped` đứng riêng trong `CommitSummary` | Gộp vào `committed` là dựng lại đúng lỗi 4.5 vừa sửa — báo "đã ghi" cho một việc không xảy ra. Gộp vào `failed` thì sai kiểu khác: hồ sơ em **đã** được tạo/ghép thật, và bảo người dùng sửa file rồi tải lại sẽ sinh ra hồ sơ trùng. Lượt ghi trọn vẹn mà vẫn có em không đổi được lớp thì tone đổi từ `success` sang `info` — để `success` là mời người dùng đóng màn hình lại |
| **🔴 TO-BE 5 / AC-22 / BR-M12-38** | **`docs/09` §9 đòi "User download được errors" từ Phase 2, và nó chưa từng tồn tại** | Người **có** dữ liệu còn thiếu là **Giáo lý viên lớp** — họ biết em nào Nam em nào Nữ — nhưng `route-map.ts` không cho họ vào `/imports` (SEC-01), và điều đó **đúng**: nhập Excel tạo hồ sơ hàng loạt. Hệ quả trước đợt này: Thư ký phải **chép tay** từng dòng lỗi ra tin nhắn. Nay `GET /imports/[batchId]/errors` xuất `.xlsx` hai sheet — `LOI` (chỉ dòng **có việc phải làm**) và `KET_QUA` (**đủ mọi dòng**, kèm mã thiếu nhi). Không nới quyền cho ai: Thư ký tải rồi gửi đi |
| **BR-M12-38 — nửa bị bỏ sót của mapping** | Mã thiếu nhi của dòng **đã ghép** không nằm ở `created_student_id` | RPC cố ý để `null` ở cột ấy cho dòng `merge` (nó không *tạo* ra em nào). Chỉ đọc cột đó thì `docs/09` §7 mất đúng nửa số dòng — mà **dòng ghép mới là dòng cần tra ngược nhất**. Nay lấy `created_student_id ?? matched_student_id` cho dòng `merge` |
| **🔴 AC-23 / SEC-13 / BR-M12-37** | Ô Excel do người dùng nhập đi ra ngoài hệ thống | Mọi ô chuỗi đi qua `safeSpreadsheetText`. Bộ chặn dùng chung được mở rộng thêm **`TAB` và `CR`** đúng chữ của TO-BE 5 bước 3 — hai ký tự này lọt lưới cũ vì `trimStart()` **cắt chúng đi trước khi kiểm**. Bài E2E cho một em tên `=cmd\|'/c calc'!A1` đi trọn vòng ô Excel → cơ sở dữ liệu → ô Excel, rồi **mở tệp tải về ra kiểm** |
| **🔴 SEC-16 suýt mở lại ở CỬA THỨ HAI** | `errors_json` chứa `sqlerrm` **nguyên văn** | Hàm RPC ghi cả `commit_error` lẫn một mục `{field:'commit', message: sqlerrm}` vào mảng lỗi của dòng. Màn hình đã dịch nó từ M12-A, nhưng file xuất ra đọc **thẳng** mảng ấy — và cửa này tệ hơn màn hình vì tệp **đi ra ngoài hệ thống**, tới tay Giáo lý viên lớp. Nay `getBatchReport` dịch qua `commitErrorText` trước khi ghi vào ô |
| **🔴 TO-BE 8 / NC-01 / SEC-10 / D-137** | **Trần 5 MB là một con số SAI, không phải một hành vi sai** | Vercel chặn thân request nặng hơn ~4,5 MB **ở tầng hạ tầng**, trước khi mã ứng dụng chạy — nên câu `"File vượt quá 5MB."` chưa từng có cơ hội chạy cho đúng khoảng nó canh: file 4,5–5 MB chết bằng một trang lỗi tiếng Anh. `next.config.mjs` còn tệ hơn: `bodySizeLimit: "6mb"` cao hơn cả trần nền tảng, tức một con số **không có hiệu lực nào** ngoài việc làm người đọc mã tưởng hệ thống nhận được 6 MB. Nay 4 MB / 4,5 MB, và giới hạn **hiện ngay trên ô chọn file** |
| **🔴 TO-BE 8 / NC-02 / SEC-12 / D-138** | **Không có giới hạn số dòng nào — bài SEC-12 trước đây KHÔNG THỂ VIẾT ĐƯỢC** | `08_ACCEPTANCE_CRITERIA` §C xếp SEC-12 vào nhóm *"phải xanh"* kèm ghi chú *"hiện chưa có giới hạn số dòng"*. Giới hạn dung lượng **không thay được** nó: sheet toàn chữ nén rất tốt. Nay 1.000 dòng, kiểm **ngay sau `parseWorkbook`** và **trước mọi truy vấn** — mỗi dòng kéo theo một lượt `buildRow` cộng một lượt dò trùng trên toàn bộ hồ sơ đã có |
| **`maxDuration = 60`** | Trần thời gian của trang cũng là trần của Server Action gửi từ trang đó | Ghi 1.000 dòng là **10 lượt gọi RPC nối đuôi nhau**. 60 giây (trần gói Hobby) **không bảo đảm** xong trong một lượt — và điều đó chấp nhận được vì `commitBatch` chỉ lấy dòng còn `valid`/`warning`: bấm "Ghi" lần nữa **chạy tiếp từ chỗ dừng**, không tạo hồ sơ trùng (AC-05) |
| **SEC-04b — 403, không phải 500** | Route handler **không** đi qua `ROUTE_RULES` của middleware | Hàng rào trong chính route là hàng rào duy nhất ở tầng ứng dụng. Nhưng `requireImportAccess()` ném `AppError`, mà một route handler để lỗi lọt ra thì trả **500** — người bấm nhầm nút tưởng hệ thống hỏng. Nay bắt **đúng `AppError`** và trả 403 kèm câu tiếng Việt; mọi lỗi khác **ném tiếp**, vì `redirect()` của Next cũng báo hiệu bằng cách ném — nuốt nó là biến một lượt chuyển về `/login` thành một câu 403 vô nghĩa (đúng bài học D-96) |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **Phép kiểm dung lượng phải nằm ở CẢ HAI phía, và lý do nằm ở hạ tầng chứ không ở mã.** Với
   file ≥4,5 MB thì hàng rào máy chủ **không bao giờ chạy tới**, nên phép kiểm phía trình duyệt là
   thứ duy nhất còn cứu được lượt đó khỏi một trang lỗi tiếng Anh. Nó **không** thay hàng rào máy
   chủ: người gọi thẳng Server Action không đi qua biểu mẫu. Cả hai phía gọi **cùng một hàm** trong
   `limits.ts` — hai bản chép tay là hai con số sẽ lệch nhau sau vài tháng.
2. **`formatRowCount` tự chèn dấu chấm chứ không dùng `toLocaleString("vi-VN")`.** Kết quả của hàm
   ấy phụ thuộc dữ liệu ICU của môi trường chạy, và khi thiếu nó **lặng lẽ** trả `1,000` — dấu phẩy,
   tức cách viết tiếng Anh — ngay giữa một câu tiếng Việt. Một câu chữ ra màn hình không được đổi
   theo môi trường.
3. **File báo cáo lấy TOÀN BỘ dòng theo lô, không dùng một `range` duy nhất.** Trần `max-rows` của
   PostgREST cắt **im lặng** đúng loại truy vấn này, mà một file báo cáo thiếu dòng còn tệ hơn không
   có file: người nhận không có cách nào biết là nó thiếu.
4. **File báo cáo KHÔNG nhập ngược lại được, và đó là chủ ý được kiểm chứ không phải may.**
   `detectLayout` coi mọi sheet lạ là `template`, nên `LOI` (có cột *Họ tên* và *Lớp*) vẫn qua được
   bước dò dòng tiêu đề — nhưng cả hai sheet đều **không có cột ngày sinh**, mà `REQUIRED_FOR_IMPORT`
   đòi nó, nên `parseWorkbook` từ chối bằng đúng câu *"Sheet chỉ có danh sách tên…"*.

**Ba lỗi thật bắt được, đều do CHẠY chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | **pgTAP `plan(18)` trong khi file có 20 khẳng định** — pgTAP báo *"All 18 subtests passed"* rồi vẫn `Result: FAIL` | Lượt chạy đầu của `040`. ⚠️ Đáng ghi lại vì **thông điệp gây hiểu nhầm theo hướng có lợi**: dòng "All 18 subtests passed" đọc lướt là xanh, chỉ dòng `Bad plan` mới nói thật | `plan(20)`. Bài học: đọc **dòng `Result:`**, không đọc dòng "subtests passed" |
| 2 | 🔴 **`supabase db reset` làm Kong mất đường tới GoTrue** — `seed:dev` chết với `Tạo auth user … thất bại: {}`, một câu lỗi **rỗng** | `curl /auth/v1/health` trả **502** trong khi `docker ps` cho thấy container auth **"Up 3 minutes (healthy)"**. Tức container khoẻ mà cổng vào thì không | `docker restart supabase_kong_…` ⇒ 200 ngay. **Không phải lỗi sản phẩm** mà là bẫy môi trường: Kong "Up 2 hours" giữ địa chỉ upstream cũ sau khi `db reset` dựng lại auth. Ghi lại vì câu lỗi `{}` của `seed-dev.mjs` không chỉ được về phía nào cả |
| 3 | **Nhãn ô chọn file bị cắt thành nhiều nút văn bản** nên `getByText(/tối đa 4 MB và 1\.000 dòng/)` không khớp trong jsdom | Bài unit của biểu mẫu tải lên đỏ ngay lượt đầu sau khi đổi nhãn | Neo bằng `getByLabelText` — nó so trên `textContent` của cả thẻ `<label>` nên không vỡ khi câu chữ có phần nội suy. Bài E2E thì `getByText` vẫn khớp vì trình duyệt thật gộp nút văn bản |

**Nghiệm thu 15 mục (`11` §5) cho đợt M12-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **998 pass / 10 skip** (trước M12-C: 970/10, **+28**) · build ✓ **28/28 trang** · pgTAP **967/967** (trước 947, **+20**: file `040`) |
| E2E responsive 3 viewport, không tràn ngang | ✅ bộ `imports` chạy **riêng**: **42/42** trên 360 · 768 · 1366 (trước đợt này 30 bài, **+12**). Bài đo tại chỗ của M12-B giữ nguyên và vẫn xanh. Lượt **toàn bộ**: **371/384** — xem phân tích 13 bài đỏ ở dưới |
| Vùng chạm ≥44px | ✅ nút mới **"Tải file lỗi / kết quả"** được thêm vào **đúng bài đo sẵn có** của trang chi tiết (`h-control min-h-control`), đo trên cả ba viewport |
| Không cỡ chữ <12px | ✅ không thêm bậc chữ mới; câu giải thích hai sheet dùng `text-xs` = 12px, đúng sàn cứng |
| Không màu hardcode khi có token | ✅ grep file mới + hai trang: **0 mã hex/rgb/hsl**. Đợt này không thêm màu nào |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ đợt này không thêm ô chọn nào |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ lượt ghi nay nói ra **bốn** con số thay vì ba: đã ghi · bỏ qua · lỗi · **và số em không đổi được lớp, kèm số dòng cụ thể**. Con số thứ tư là toàn bộ giá trị của TO-BE 6 |
| Trạng thái rỗng đúng 1 trong 3 loại | — không áp dụng: đợt này không thêm danh sách nào. Lần nhập **không có dòng lỗi** vẫn tải được file, sheet `LOI` chỉ có hàng tiêu đề |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng** | — không áp dụng: tải file là thao tác **chỉ đọc**. Ba hộp xác nhận của M12-A giữ nguyên |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ nút tải file là `<a download>` thật, nhận `Tab` và `Enter` như mọi liên kết; không thêm lớp nổi nào |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái dòng trong file `.xlsx` là **chữ tiếng Việt** (`reportRowStatusText`), không phải mã cơ sở dữ liệu — một tệp không có màu thì đây là dạng duy nhất của tiêu chí ấy |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration · 0 thay đổi phân quyền** (không nới, không siết). pgTAP `040` **20 bài, toàn bộ bằng JWT thật của Thư ký**, trong đó **3 bài canh riêng phần `grant`** — chốt chặn cho rủi ro của chính migration này. Kèm E2E **SEC-04b**: Giáo lý viên lớp `GET /imports/<id>/errors` nhận **403**, không phải một file rỗng hợp lệ |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` + `docs/09-data-import-and-seed.md` §2/§7/§9 (ba ghi chú cập nhật D-137/D-138 · TO-BE 6 · TO-BE 5). **Không đổi `09`/`10`/`11`** của `ui-redesign`; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

**Kiểm thử đo được của đợt:** unit **998 / 10 skip** (**+28**) · pgTAP **967/967** (**+20**) ·
lint **0 warning** · typecheck ✓ · build ✓ **28/28** · bộ `imports` chạy riêng **42/42** trên ba
viewport · **toàn bộ E2E 371/384** trên DB vừa `db:reset` + `seed:dev`.

🔴 **Mười ba bài đỏ của lượt toàn bộ, và KHÔNG bài nào thuộc bốn luồng mới của đợt C.** Ba bài trong
số đó nằm ở bộ `imports` (`AC-21` ×2 viewport · `AC-25` ×1) — cả ba là **bài của M12-A/M12-B, trên mã
đợt C không đụng tới**, và **cả ba xanh 3/3 ở lượt chạy riêng của chính bản mã này** ngay trước đó.
Mười bài còn lại nằm ở spec của các đợt trước (`student-lifecycle` ×3 · `committees` ×2 ·
`enrollment-lifecycle` ×2 · `academic-year` · `staff-directory` · `students-directory`) và **tất cả
cùng một hình dạng** của **nợ #10 / #15**: thao tác ghi bấm xong hoặc liên kết bấm xong, câu trả lời
không về trong 30–45 giây. Ảnh chụp của `students-directory` cho đúng chữ ký đã khoanh từ M03-B —
*"Test timeout of 30000ms exceeded"* trong khi bản thân khẳng định còn ngân sách 45 giây, tức trần
mặc định của Playwright cắt trước (bài học M12-B đã ghi, và bộ ấy **chưa** được nới trần).

Đối chiếu tỷ lệ đỏ qua các đợt: M12-A **6/357 = 1,7 %** · M12-B **11/372 = 3,0 %** · M12-C
**13/384 = 3,4 %** · M03-C **14/342 = 4,1 %**. Ghi lại nguyên văn thay vì chạy tới khi xanh: theo
đúng ghi chú của nợ #10, **một lượt xanh không phải bằng chứng đã sửa**, và một lượt đỏ ở ngưỡng
thời gian cũng không phải bằng chứng có hồi quy. Bằng chứng thật cho "đợt C không gây hồi quy" là
**hai lượt trên cùng một bản mã cho hai kết quả khác nhau ở cùng những bài ấy** — biến số chi phối
vẫn là **tải máy**, đúng kết luận đã khoanh từ M04-A và M02-C.

---

### Module 8 — M05 Điểm danh · chia ba đợt · ✅ **ĐÓNG 2026-08-03**

`03_AUDIT_RESULTS` chấm module **60/75** và **không có luồng nào CRITICAL** — tầng dữ liệu/bảo mật
được chính biên bản gọi là *"chuẩn mực cho các module khác"* (C15 = 5, C8 = 5, C9 = 5): mọi đường
ghi đi qua RPC `security definer` có row lock, `authenticated` **không có** `insert/update` trên cả
ba bảng điểm danh, và pgTAP `012` có 67 khẳng định chạy dưới JWT thật. Toàn bộ vấn đề nằm ở **rõ
ràng trạng thái, thông điệp lỗi, và nghiệp vụ đơn xin nghỉ chưa hoàn chỉnh**.

Đây cũng là module gánh nhiều nợ hệ thống nhất: **#18** (hàng rào năm học đã đóng) · **#19** (em tạm
nghỉ trong danh sách điểm danh) · **#20** (link quay lại 18px) · **#14** (mẫu guard D-96) đều ghi
"trả ở M05".

`07_IMPLEMENTATION_IMPACT` §3 đề xuất **5 đợt ≈ 9–10 ngày**, trong đó *"~2,5 ngày đầu (đợt 1+2) đã
xử lý toàn bộ vấn đề mức HIGH/MED về đúng đắn dữ liệu"*. Gộp thành ba đợt theo khuôn các module
trước, giữ nguyên thứ tự ưu tiên ấy.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M05-A** | Toàn bộ nhóm **đúng đắn dữ liệu**: ngày mặc định theo giờ Việt Nam (TB-01) · trạng thái khóa nhất quán (TB-02) · ba mã lỗi phiên chỉnh sửa (TB-04) · em rời lớp không khóa cứng buổi (TB-07) · báo rõ khi có người giữ (TB-08) · giải thích cửa sổ sau mở khóa (TB-12) · quyền xem cho hai Cha (TB-10/D-139). Kèm **nợ #18 · #19 · #20 · #14** | ✅ **XONG 2026-08-03** |
| **M05-B** | Hoàn thiện nghiệp vụ: **màn hình staff cho đơn xin nghỉ** (TB-06 — `acknowledgeAbsenceRequest` viết từ Phase 3 mà **không màn hình nào gọi**, nên mọi đơn của phụ huynh vĩnh viễn nằm ở "Đang chờ") · chặn đơn cho buổi đã chốt (TB-11) · **D-75** ẩn ghi chú điểm danh khỏi cổng phụ huynh | ✅ **XONG 2026-08-03** |
| **M05-C** | Trạng thái, an toàn thao tác và điện thoại: hộp xác nhận trước khi chốt (TB-03) · đồng hồ phiên chỉnh sửa + bảo vệ bản nháp (TB-05) · badge cảnh báo và bộ lọc roster (TB-09) · U-10/U-11/U-21/U-17/U-18/U-24/U-25 | ✅ **XONG 2026-08-03** |

#### Đợt M05-A — ✅ XONG (2026-08-03)

**Hai quyết định của chủ dự án ngày 2026-08-03 mở đường cho đợt này:** **D-139** (Cha sở và Cha phó
xem điểm danh ở chế độ chỉ đọc; Thủ quỹ giữ nguyên bị chặn) · **D-140** (em đang tạm nghỉ **ra khỏi**
danh sách điểm danh, trang buổi nói ra số em bị loại).

**1 migration · 1 thay đổi phân quyền (NỚI, chỉ đọc) · 1 thay đổi phân quyền (SIẾT, nợ #18).**
Migration toàn bộ là `create or replace` — **không** `alter table`, **không** backfill, chữ ký bốn
hàm giữ nguyên tuyệt đối nên `src/types/database.ts` không phải sinh lại.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 TB-01 / F01-I1 / AC-F01-1** | **Sáng Chúa nhật, form đổ sẵn buổi thứ Năm TUẦN TRƯỚC** | Máy chủ chạy `TZ=UTC`; 06:00 sáng Chúa nhật giờ Việt Nam là **23:00 thứ Bảy UTC**, nên `today.getDay()` thấy thứ Bảy và lùi về thứ Năm. Đây là ca **thường gặp**, không phải ca biên: người điểm danh tới nhà thờ sớm là chuyện bình thường. `mostRecentMeetingDate` nay là **hàm thuần nhận chuỗi ngày**, chỗ gọi truyền `todayVi()` — hàm đã có sẵn ở `src/lib/dates` từ M02-B mà trang này không dùng. 🔴 Vì sao không test nào bắt được: E2E **tự sinh ngày rồi `fill` tay vào ô**, nên giá trị mặc định chưa từng được kiểm; unit test chỉ phủ `meetingTypeForDate` |
| **🔴 TB-02 / F07-I1 / E-09** | **Cùng một buổi, hai màn hình nói hai điều khác nhau** | Hub in thẳng `session.status`, mà **không code path nào ghi `status='locked'`** — khóa là hàm của thời gian (`locked_at` so với `now()`), đúng tinh thần WF-06 "không cần cron". Nên buổi đã khóa hiện *"Đã chốt"* ở danh sách và *"Đã khóa"* khi mở ra: người dùng không biết mình còn sửa được không nếu chưa bấm vào. Nay `deriveSessionState()` là **một chỗ duy nhất**, dùng chung cho cả hai màn hình, và thêm nhãn **"Đã mở khóa"** mà trước đây danh sách không hề có |
| **🔴 TB-04 / F06-I1 / AC-F06-3** | **Bấm "Hoàn tất" lần thứ hai báo "đang có người khác phụ trách" — trong khi không có ai** | Một điều kiện gộp **ba** tình huống khác hẳn nhau, mà finalize thì **xóa `editing_by`** — nên nhấp đúp, mạng chậm hay một lượt thử lại đều rơi vào nhánh ấy và gọi tên một người không tồn tại. Nay ba nhánh, ba mã: `ATTENDANCE_SESSION_NOT_CLAIMED` · `ATTENDANCE_ALREADY_CLAIMED` (**giữ nguyên** cho đúng ca bị tiếp quản mà pgTAP `012:192-199` đang canh) · `ATTENDANCE_LEASE_EXPIRED`. **Không nới một điều kiện ghi nào** — chỉ đổi *thông điệp*, không đổi *quyết định* |
| **🔴 TB-07 / F03-I1 / AC-F06-4** | **Một em rời lớp khóa cứng CẢ BUỔI điểm danh đã diễn ra** | `sync_student_attendance_keys` áp luật *"ghi danh còn mở tại ngày buổi"* cho **cả UPDATE**, mà finalize update **mọi** dòng để đặt `session_finalized_at`. Đóng ghi danh với `ended_on` lùi về trước ngày buổi ⇒ không lưu được, không chốt được. Nay chỉ áp cho **INSERT**: dòng đã tồn tại nghĩa là lúc điểm danh em **đang** thuộc lớp, và một sự kiện của tương lai không được viết lại lịch sử |
| **🔴 TB-07 · nửa còn lại: câu lỗi** | Ba mã trigger **chưa từng có** trong bảng ánh xạ | `ATTENDANCE_ENROLLMENT_NOT_OPEN` · `ATTENDANCE_ENROLLMENT_CLASS_MISMATCH` · `ATTENDANCE_RECORD_IMMUTABLE_KEY` rơi hết vào nhánh mặc định `CONFLICT` ⇒ *"Thao tác bị xung đột. **Vui lòng thử lại**."* Câu ấy **hứa rằng thử lại sẽ được**, nên người dùng thử lại mãi trên một thứ hỏng vĩnh viễn. Nay mỗi mã một câu tiếng Việt nói đúng việc phải làm |
| **🔴 D-140 · nợ #19** | **Em "Tạm nghỉ" vẫn có tên và vẫn được mặc định "Có mặt"** | Từ M03-A trạng thái này mới dùng được, M03-C thêm cửa vào thứ hai (D-130) nên số em sẽ tăng. Ghép với luật *"mặc định có mặt"*, em nghỉ dài ngày **được ghi có mặt** nếu người điểm danh không để ý — chuyên cần của lớp đẹp hơn sự thật, và điểm chuyên cần (M07) sinh ra từ đúng con số sai đó. Nay `app.attendance_roster_enrollments` loại em `paused`, trang buổi ghi *"N em đang tạm nghỉ, không có trong danh sách này"* |
| **🔴 Cái bẫy của D-140, và nó nằm ở CHỖ KHÁC** | `roster_size` khi chốt phải đổi theo, nếu không **hỏng chức năng chốt** | `save_and_finalize_attendance` đếm sĩ số bằng một truy vấn **chép tay** cùng luật. Sửa `seed_attendance_roster` mà quên chỗ này thì `record_size < roster_size` thành đúng, và **mọi lớp có một em tạm nghỉ không chốt được buổi nào nữa** với thông điệp *"Danh sách chưa đủ"* — vô nghĩa với người đọc. Nay hai bên gọi **cùng một hàm**; pgTAP `041` có bài canh riêng đúng chỗ đó |
| **TB-08 / F01-I3 / AC-F01-4** | Mở buổi người khác đang giữ thì **không ai nói gì** | RPC **vẫn luôn trả về** cờ `claimed`, nhưng `openAttendanceSessionFromForm` vứt đi rồi chuyển trang y hệt lúc nhận được quyền sửa. Người bấm phải tự suy ra từ việc thanh nút không xuất hiện. Nay banner ngay đầu trang, nêu tên người đang giữ |
| **TB-12 / F09-I1 / AC-F09-2** | Mở khóa xong, chốt lại là **khóa lại ngay** — không ai giải thích | Mốc khóa tính từ **lần chốt đầu tiên** và cố ý không bị đẩy lùi (`finalized_at` là dấu vết "buổi này chốt lần đầu khi nào"). Luật đúng, nhưng không màn hình nào nói, nên nó trông y hệt một lỗi *"mở khóa không ăn"*. Nay có dòng giải thích kèm **ngày chốt đầu tiên** |
| **🔴 TB-10 / NAV-I1 / U-04 / D-139** | Một route phục vụ **hai quyền khác nhau** | `/attendance` vừa là màn hình ghi vừa là màn hình xem, nên M14 A-11 khoá cả ba vai trò chỉ đọc để dẹp link chết — tức mã nguồn nói **ngược lại** `docs/05` §54 (Cha sở 👁, Cha phó 👁). Nay hai vị vào được ở chế độ chỉ đọc; **không migration**, vì `app.can_global_read()` đã cho họ đọc từ Phase 3. 🔴 **Thủ quỹ vẫn bị chặn**: ô của họ ghi *"👁 báo cáo"*, và `can_global_read()` **không có họ** ⇒ mở route chỉ dẫn tới một trang trắng. `navigation.ts` đọc thẳng `ATTENDANCE_VIEW_ROLES` từ `route-map.ts` nên hai bảng không thể lệch nhau lần nữa — đúng nguyên nhân gốc của NAV-I1 |
| **🔴 Nợ #18 — và hàng rào KHÔNG đặt được vào policy** | Năm học đã đóng vẫn ghi điểm danh được | D-118 dựng hàng rào cho `enrollments`/`classes` bằng một dòng thêm vào policy, và nợ #18 ghi *"mỗi module chỉ cần một dòng"*. **Ở đây thì không.** `authenticated` không có `insert/update` trên ba bảng điểm danh: mọi đường ghi đi qua RPC `security definer`, mà definer **bỏ qua RLS** ⇒ thêm điều kiện vào policy là thêm một dòng **không bao giờ được chạy**, một hàng rào giả. Hàng rào nằm trong chính bốn RPC, dùng đúng helper `app.writable_academic_year_ids()` nên **D-117 vẫn đứng**: Super Admin sửa được năm đã đóng |
| **Nợ #20** | Link "← Danh sách buổi" cao **18px** | `inline-flex min-h-11` + margin âm, đúng khuôn M03-C. Bài E2E **đo tại chỗ** trên cả ba viewport, và đo luôn ba ô chọn của roster — vì `responsive.spec.ts` chỉ quét **13 địa chỉ cấp một**, không có địa chỉ chi tiết nào |
| **Nợ #14 / ACT-I1 / D-96** | Guard sai kiểu **và** sai chỗ | Năm thao tác dùng `requireAuthContext` (chỉ hỏi "đã đăng nhập chưa") **bên trong `try`**. Mà `redirect()` của Next báo hiệu bằng cách **ném**, nên `catch` nuốt mất: người hết phiên đọc *"Không lưu được điểm danh. Vui lòng thử lại."* rồi thử lại mãi thay vì được đưa về `/login`. Nay `requireRouteAccess` gọi **ngoài `try`**. Còn **7 module** mang lỗi này |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **`mostRecentMeetingDate` nhận tham số thay vì tự gọi `new Date()`.** Không phải cho đẹp: một
   hàm đọc đồng hồ hệ thống chỉ test được bằng cách đổi đồng hồ, mà đúng thứ cần chứng minh ở đây
   là *"hàm cư xử thế nào khi máy chủ ở UTC còn người dùng ở Việt Nam"*. Tách ra thì bài test viết
   được cả **cách cũ lẫn cách mới cạnh nhau**, và chênh lệch ba ngày hiện ra thành một con số.
2. **`deriveSessionState` trả `unlocked` — một giá trị KHÔNG có trong enum của cơ sở dữ liệu.**
   Đó là chủ ý: mở khóa giữ nguyên `status='completed'` và chỉ đặt `unlocked_at`, nên nếu kiểu dữ
   liệu của tầng hiển thị bằng đúng enum của DB thì trạng thái ấy **không diễn đạt được**, và màn
   hình buộc phải nói dối là "Đã chốt". Thứ tự nhánh cũng là luật: `unlocked` phải thắng `completed`.
3. **Hàng rào năm học đặt trong RPC, không trong policy** — xem hàng nợ #18 ở bảng trên. Đây là chỗ
   một phiên sau rất dễ làm sai vì khuôn của M02-C nằm sẵn đó để chép.
4. **Migration dùng `create or replace`, không `drop function`.** Bài học M12-C: drop mang theo mọi
   `grant`, và quên cấp lại là gãy toàn bộ luồng với triệu chứng `42501` trông hệt lỗi RLS. Ba bài
   đầu của pgTAP `041` canh đúng chỗ đó, để phiên sau có lưới nếu buộc phải drop.

**Ba lỗi thật bắt được, đều do CHẠY chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | **`plan(26)` trong khi file có 30 khẳng định** — đúng cái bẫy M12-C đã ghi lại, và vẫn vấp | Lượt chạy đầu của `041` báo `Bad plan` | Đếm lại: `plan(31)`. Bài học của M12-C giữ nguyên giá trị: đọc **dòng `Result:`**, không đọc dòng "subtests passed" |
| 2 | **`anon` VẪN có quyền execute trên `public.claim_attendance_session`** — bài canh grant viết theo trực giác thì đỏ | Lượt chạy đầu của `041` | Postgres cấp `EXECUTE` cho `PUBLIC` **mặc định**, và migration gốc chỉ `revoke … from public` trong schema `app`, không trong `public`. **Không phải lỗ hổng** (RPC ném `AUTH_REQUIRED` khi `auth.uid()` null), nhưng bài canh phải nhắm đúng thứ migration này thật sự khoá: `app.attendance_roster_enrollments` |
| 3 | **`STAFF_PROFILE_REQUIRED` khi dựng fixture Thủ quỹ** | Lượt chạy đầu của `041` | `validate_staff_role_link` bắt buộc `treasurer` phải có hồ sơ nhân sự, còn `parish_priest` thì **không** nằm trong danh sách ấy — một khác biệt chỉ lộ ra khi viết test cho đúng hai vai trò này cạnh nhau |

**Nghiệm thu 15 mục (`11` §5) cho đợt M05-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **1014 pass / 10 skip** (trước M05-A: 998/10, **+16**) · build ✓ **28/28 trang** · pgTAP **998/998** (trước 967, **+31**: file `041`) |
| E2E responsive 3 viewport, không tràn ngang | ✅ bộ `attendance` **27/27** trên 360 · 768 · 1366 (trước đợt này 15 bài, **+12**: 4 bài mới × 3 viewport). Lượt **toàn bộ** trên DB vừa reset+seed: **383/396** — **0 trong 13 bài đỏ thuộc điểm danh** |
| Vùng chạm ≥44px | ✅ **nợ #20 đã trả**: link "← Danh sách buổi" từ 18px lên `min-h-11`, có bài E2E **đo bằng `boundingBox()`** trên cả ba viewport, đo luôn ba ô chọn của roster |
| Không cỡ chữ < 12px | ✅ không thêm bậc chữ mới |
| Không màu hardcode khi có token | ✅ đợt này không thêm màu nào; grep hai trang + editor: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ không thêm ô chọn nào. Năm ô `<select>` sẵn có của roster **cố ý giữ nguyên** — thay chúng bằng `SegmentedControl` là U-10, và `07_IMPLEMENTATION_IMPACT` §2.6 gọi chi phí đổi 5 bộ định vị E2E là *"chi phí ẩn lớn nhất"*; gộp vào đợt sửa lỗi dữ liệu là trộn hai loại rủi ro |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ đợt này làm phản hồi **đúng hơn** chứ không thêm thao tác ghi: ba câu lỗi mới thay cho một câu sai, ba câu lỗi trigger thay cho "Thao tác bị xung đột", và banner TB-08 nói ra điều mà cờ `claimed` đã biết từ đầu |
| Trạng thái rỗng dùng đúng 1 trong 3 loại | — không áp dụng: đợt này không thêm danh sách nào |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả bằng tên riêng | — **cố ý hoãn sang M05-C**: hộp xác nhận trước khi chốt là TB-03, và nó cần bảng phân bố 5 trạng thái × 2 cột tính từ draft phía client — một việc của tầng giao diện, không thuộc nhóm đúng đắn dữ liệu của đợt A |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không thêm lớp nổi nào; banner TB-08 và dòng TB-12 là văn bản tĩnh, banner dùng `FormMessage tone="info"` nên có `role="status"` |
| Không dùng màu làm tín hiệu duy nhất | ✅ nhãn trạng thái là **chữ tiếng Việt** đủ nghĩa ("Đã khóa" · "Đã mở khóa"), không phải mã DB; badge số em vắng thêm `aria-label` đầy đủ ("12 em vắng" — U-29) |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration · 1 NỚI (chỉ đọc, D-139) · 1 SIẾT (nợ #18)**. pgTAP `041` **31 bài, toàn bộ bằng JWT thật**: 3 bài canh `grant`, 3 bài canh hàng rào năm học đã đóng cộng 1 bài chứng minh Super Admin vẫn ghi được (D-117), 3 bài chứng minh D-139 **không** nới quyền ghi (Cha sở nhận `FORBIDDEN` ở cả claim lẫn save) và Thủ quỹ vẫn đọc ra **0 dòng**. Kèm E2E cho cả hai chiều |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `docs/03-workflow.md` (WF-05: ghi chú `Locked` là trạng thái suy ra, D-140, TB-01, TB-08) + `docs/05-permission-matrix.md` (ghi chú D-139 dưới bảng) + `docs/11-api-and-server-actions.md` §6 (năm mã lỗi mới). **Không đổi `09`/`10`/`11`** của `ui-redesign`; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md`. `00_SYSTEM_AUDIT_BOARD.md` **không đổi** — M05 chưa đóng |

**Kiểm thử đo được của đợt:** unit **1014 / 10 skip** (**+16**) · pgTAP **998/998** (**+31**) · lint
**0 warning** · typecheck ✓ · build ✓ **28/28** · bộ `attendance` E2E **27/27** trên ba viewport ·
**E2E toàn bộ 383/396** trên DB vừa `db:reset` + `seed:dev`.

**13 bài đỏ của lượt toàn bộ — không bài nào thuộc điểm danh, và cả 13 đều là hai nợ đã ghi sẵn:**

| Bài | Số lượt đỏ | Hình dạng |
|---|--:|---|
| `staff-directory:124` phân trang sang trang 2 | **3/3 viewport** | **Nợ #15** — `<Link>` chỉ đọc, bấm nhiều lần URL không đổi. Đây là bài mà M02-B đã dùng để chứng minh nợ #15 **không phải nợ của `/classes`** |
| `students-directory:154` tạo hồ sơ kèm ghi danh (D-123) | **3/3 viewport** | **Nợ #10** — thao tác ghi, hết 30 giây |
| `enrollment-lifecycle:190` · `:81` · `:141` | 2 + 1 + 1 | **Nợ #10**, và đúng **thiệt hại dây chuyền** mà M03-C đã mô tả: `:190` rớt trước để lại dữ liệu dở dang, hai bài sau của cùng spec đỏ theo trên `laptop-1366` |
| `imports:330` (D-133) · `staff-directory:71` (D-108) · `academic-year:104` | 1 + 1 + 1 | **Nợ #10** — đều là khẳng định sau-thao-tác-ghi |

⚠️ Tỷ lệ đỏ **3,3 %** (13/396), cao hơn lượt của M12-C (11/372 = 3,0 %) nhưng **cùng một tập bài và
cùng hai nguyên nhân**; không có bài nào đỏ vì mã của đợt này. Đáng ghi lại một điều **mới**: ba
viewport cùng rớt `staff-directory:124` và cùng rớt `students-directory:154` — trước nay tập bài đỏ
vẫn **đổi chỗ giữa các lượt**, nên đây là lần đầu hai bài ấy đỏ **đồng loạt cả ba**. Chưa đủ để kết
luận, nhưng nếu lượt sau lặp lại thì hai bài này đã chuyển từ "chập chờn" sang "hỏng thật" và phải
được điều tra riêng thay vì gộp vào nợ #10/#15.

#### Đợt M05-B — ✅ XONG (2026-08-03)

**Một quyết định mới của chủ dự án ngày 2026-08-03 mở đường cho đợt này:** **D-141** (đơn xin nghỉ
chặn theo **trạng thái buổi**, không theo ngày).

**1 migration · 1 thay đổi phân quyền (SIẾT — D-75) · 1 hàng rào năm học (nợ #18) · 0 `alter
table` · 0 backfill.** Chữ ký hàm sẵn có giữ nguyên; `src/types/database.ts` sinh lại **chỉ vì có
thêm một RPC đọc**.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 TB-06 / F13-I2 / AC-F13-1 · AC-F13-2** | **Phụ huynh gửi đơn vào một chỗ không ai trả lời** | `acknowledgeAbsenceRequest` viết từ Phase 3 mà **không màn hình nào gọi** — nên trạng thái `acknowledged` và cột `staff_note` **chưa bao giờ đạt tới được**, mọi đơn nằm ở *"Đang chờ"* vĩnh viễn, và Giáo lý viên chỉ thấy đơn **sau khi** đã mở buổi, tức sau khi đã quá muộn để nó giúp được gì. Nay thẻ **"Đơn xin nghỉ tuần này"** ngay trên `/attendance` (phương án A của `04_TO_BE_FLOWS`, **không** dựng route riêng: ca phổ biến nhất là *xem trước khi điểm danh*, mà route riêng bắt người ta rời màn hình điểm danh để làm đúng việc ấy). Cửa sổ **±7 ngày**, nhìn **cả về trước** — đơn của Chúa nhật vừa rồi chưa ai ghi nhận không được lặng lẽ rơi khỏi màn hình đúng lúc phụ huynh đang chờ |
| **TB-06 · nửa còn lại: ai được bấm** | Danh sách lọc theo lớp ở **một chỗ duy nhất** | Thẻ **không** lọc lớp ở tầng ứng dụng — `absence_requests_select_scope` đã thu về đúng lớp của người đang xem, và lọc thêm lần nữa chỉ tạo ra một định nghĩa *"lớp của tôi"* thứ hai để sau này lệch với cái thứ nhất. Cha sở/Cha phó (D-139) **thấy đơn nhưng không có nút**, kèm câu nói rõ vì sao |
| **TB-06 bước 2 / AC-F13-3 · AC-F13-4** | Gợi ý *"Vắng có phép"* trong trang buổi | Nút chỉ đổi **bản nháp phía client**, đặt **cả hai** cột (đơn khai theo *buổi*: nghỉ Chúa nhật là nghỉ cả Thánh lễ lẫn Giáo lý), và người điểm danh vẫn phải bấm Lưu. Không trigger nào từ `absence_requests` ghi vào điểm danh — **D-36 giữ nguyên**, và migration `20260721000400` đã ghi sẵn *"đừng tối ưu thêm"* |
| **🔴 D-75 · và vì sao lời giải KHÁC D-67** | **Cổng phụ huynh đang in thẳng ghi chú nội bộ của Giáo lý viên** | `attendance-history.tsx:96` in cột `note` ra trang của phụ huynh, biến một ô ghi nhớ nội bộ thành kênh nhắn tin mà không ai định vậy — và gỡ dòng ấy đi thì phụ huynh gọi Data API bằng JWT của chính mình vẫn đọc được. 🔴 **RLS lọc theo DÒNG, không theo CỘT** — bức tường y hệt D-67/D-129 ở M03-C, nhưng lời giải phải khác: ở M03-C Thủ quỹ **chưa** đọc được dòng nào nên chỉ cần mở một cửa sổ hẹp; ở đây phụ huynh **đang** đọc đúng dòng của con mình và **phải tiếp tục đọc được** (AC-F14 ghi rõ *"Portal — giữ nguyên"*, `012:280-308` đang canh đúng con số 1 dòng), còn thẻ tổng kết chuyên cần thì cộng qua view `security_invoker` nên cắt dòng là **mất luôn thẻ**. ⇒ Chặn bằng **quyền cột**: thu `select` mức bảng của `authenticated` rồi cấp lại **từng cột trừ `note`** |
| **D-75 · đường đọc còn lại** | Giáo lý viên vẫn phải đọc được ghi chú | `public.attendance_session_notes(p_session_id)` — cửa sổ hẹp `security definer` mang **đúng ba nhánh nhân sự** của policy hiện hành (`can_global_read` · `scope_class_ids` · `staff_class_ids`) và **không** có nhánh phụ huynh/thiếu nhi. Phạm vi của nhân sự **không đổi một chút nào**; chỉ phía phụ huynh đóng lại. Ai hỏi tới cột nhận `42501`, **không phải một ô trống** trông như "em này không có ghi chú" |
| **🔴 Cái bẫy của quyền cột, để lại cho phiên sau** | Quyền cột **không** tự mở rộng | Thêm cột mới vào `student_attendance_records` mà quên `grant select (cột_mới)` thì cột ấy **vô hình với cả ứng dụng**, và triệu chứng `42501` trông hệt lỗi RLS. pgTAP `042` có một bài **đối chiếu danh sách cột đã cấp với danh sách cột của bảng**, nên quên là đỏ ngay và in ra đúng tên cột bị bỏ quên. Ghi thêm ở `docs/02` §7.2 và `docs/11` §6 |
| **TB-11 / D-141 / AC-F11-3** | **Đơn cho buổi đã chốt là rác** | Trigger `app.validate_absence_request` từ chối bằng mã `ABSENCE_SESSION_ALREADY_FINALIZED`, chỉ áp cho **INSERT** nên đơn cũ không bản ghi nào bị hỏng. 🔴 **Khác đề xuất U-09** của `08_ACCEPTANCE_CRITERIA` (chặn mọi ngày quá khứ ở tầng Zod), và khác có chủ đích — chủ dự án chốt **D-141**: con ốm sáng Chúa nhật, phụ huynh báo muộn vài giờ mà Giáo lý viên còn chưa chốt, lúc ấy lý do **vẫn kịp** đổi *"vắng không phép"* thành *"vắng có phép"*. Tầng Zod không kiểm được điều này — nó không biết buổi đã chốt hay chưa — nên đây là luật chỉ cơ sở dữ liệu nói được |
| **Câu chữ của module đơn xin nghỉ** | Năm mã trigger rơi hết vào **một** câu | `ABSENCE_SESSION_ALREADY_FINALIZED` · `ABSENCE_STUDENT_NOT_ENROLLED` · `ABSENCE_OWNER_CAN_ONLY_CANCEL` · `ABSENCE_OWNER_CANNOT_EDIT` · `ABSENCE_STAFF_CANNOT_CANCEL` trước đây đều hiện *"Dữ liệu không hợp lệ. Vui lòng kiểm tra lại."* — một câu bảo người gửi đi soát lại cái họ vừa gõ, trong khi thứ sai chẳng liên quan gì tới cái họ gõ. Nay mỗi mã một câu nói đúng việc phải làm |
| **🔴 Nợ #18 — bảng cuối của module, và lần này hàng rào ĐẶT ĐƯỢC vào policy** | `absence_requests` vẫn nhận đơn cho năm học đã đóng | Đây là **cùng một món nợ, hai lời giải trái ngược, trong cùng một module**. Ở đợt A hàng rào phải nằm **trong RPC** vì ba bảng điểm danh chỉ ghi được qua `security definer` — mà definer bỏ qua RLS, nên thêm điều kiện vào policy là dựng một hàng rào giả. `absence_requests` thì `authenticated` có `insert`/`update` **thẳng trên bảng**, nên ở đây đúng là khuôn một-dòng của M02-C (D-118). Hàng rào đặt ở **cả `using` lẫn `with check`** của UPDATE theo ghi chú 2 của `20260726000200`: chỉ chặn `with check` thì `update … set status = status` vẫn đi lọt. 🔴 Và `using` **lọc dòng trong im lặng**, không ném lỗi — nên bài pgTAP tương ứng đo **kết quả** chứ không đo ngoại lệ; viết `throws_ok` ở đó là một bài xanh giả, vì UPDATE 0 dòng cũng "không ném" |
| **Nợ #14 / D-96 — lần thứ hai, ở module khác** | Guard sai chỗ trong **cả ba** thao tác đơn xin nghỉ | `requireAuthContext` nằm **trong `try`**, mà `redirect()` của Next báo hiệu bằng cách **ném** ⇒ `catch` nuốt mất: người hết phiên đọc *"Không gửi được đơn. Vui lòng thử lại."* rồi thử lại mãi. Nay `requireRouteAccess` gọi **ngoài `try`**, đúng khuôn M05-A. Còn **6 module** mang lỗi này |
| **SW-04 / bài học TB-F14** | `acknowledgeAbsenceRequest` báo thành công mà không đổi dòng nào | Bản cũ `update` **không** `.select()`, nên RLS chặn xong vẫn trả `error === null` và màn hình báo "Đã ghi nhận". Nay `.select("id")` + **đếm dòng**, và chỉ nhận đơn còn `pending` |

**Ba quyết định cài đặt cần nhớ:**

1. 🔴 **Quyền cột, không phải policy.** Đây là chỗ một phiên sau rất dễ "sửa cho gọn" bằng cách cắt
   nhánh phụ huynh khỏi `student_attendance_records_select_scope` — trông sạch hơn và cùng khuôn
   với M02-C/M03-C. Làm vậy là **gãy cổng phụ huynh**: `v_student_attendance_summary` là
   `security_invoker` nên nó cộng bằng quyền của chính người đang xem, mất dòng là mất thẻ chuyên
   cần. Bài 28 của pgTAP `042` canh đúng chỗ đó.
2. **`absenceReviewWindow` nhận chuỗi ngày thay vì tự gọi `new Date()`** — cùng lý do đã ghi ở
   `mostRecentMeetingDate` (TB-01): máy chủ chạy UTC, người dùng ở Việt Nam, và một hàm đọc đồng hồ
   hệ thống chỉ test được bằng cách đổi đồng hồ.
3. **Migration toàn `create or replace`** cho trigger, và phần quyền cột là `revoke` mức bảng
   **trước** rồi `grant` từng cột. Thứ tự ấy là bắt buộc: Postgres bỏ qua mọi giới hạn mức cột
   chừng nào quyền mức bảng còn đó, nên chỉ `revoke select (note)` là một câu lệnh chạy xong mà
   **không đổi được gì** — và không có gì báo là nó vô hiệu.

**Ba lỗi thật bắt được, đều do CHẠY chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | **`throws_ok(sql, '42501', 'mô tả')` không kiểm mã lỗi như tưởng** — pgTAP đọc tham số thứ ba là *thông điệp kỳ vọng*, nên hai bài của D-75 so câu mô tả tiếng Việt với `permission denied for table…` | Lượt chạy đầu của `042` | `'42501', null, 'mô tả'` — đúng khuôn `012:135-139` đã dùng từ Phase 3 |
| 2 | 🔴 **Một bài xanh vì lý do SAI** | Lượt chạy đầu của `042`: Giáo lý viên lớp khác nhận `RESOURCE_NOT_FOUND` chứ không phải `FORBIDDEN` | Câu `(select id from attendance_sessions where …)` **viết trong bài của họ** chạy dưới RLS của họ ⇒ trả `null`, và hàm báo "không tìm thấy buổi" **trước khi** kịp tới cổng phân quyền. Nay id truyền qua một GUC của giao dịch, nên bài kiểm đúng nhánh định kiểm |
| 3 | **Bộ định vị E2E của Phase 3 gãy vì đổi nhãn** | `input[aria-label^="Ghi chú của"]` không còn khớp sau khi nhãn thành *"Ghi chú nội bộ của …"* | Đổi bộ định vị, và **thêm hai khẳng định D-75 vào chính bài cũ**: Giáo lý viên tải lại trang **vẫn đọc được** ghi chú (chứng minh cửa sổ hẹp chạy trong ứng dụng thật), phụ huynh mở trang con **không thấy** đúng câu ấy |

**Nghiệm thu 15 mục (`11` §5) cho đợt M05-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **1033 pass / 10 skip** (trước M05-B: 1014/10, **+19**) · build ✓ **28/28 trang** · pgTAP **1033/1033** (trước 998, **+35**: file `042`) |
| E2E responsive 3 viewport, không tràn ngang | ✅ bộ `attendance` **33/33** trên 360 · 768 · 1366 (trước đợt này 27 bài, **+6**: 2 bài mới × 3 viewport), **xanh cả hai lượt chạy riêng**. Lượt **toàn bộ** trên DB vừa reset+seed: **390/402** — 12 đỏ, xem bảng dưới |
| Vùng chạm ≥44px | ✅ nút "Ghi nhận" và "Áp dụng gợi ý" đều dùng `Button` — mọi `size` của component này đã cố định `min-h-control` (44px) từ mục 0.5 và nằm trong danh sách **không được đụng** (`09` §11). Bài đo `boundingBox()` của nợ #20 vẫn xanh trên cả ba viewport |
| Không cỡ chữ < 12px | ✅ không thêm bậc chữ mới; thẻ đơn dùng `text-sm`/`text-xs` sẵn có |
| Không màu hardcode khi có token | ✅ grep hai component mới: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ✅ không thêm chỗ nào; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ không thêm ô chọn nào |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ **cả hai đều là việc mới của đợt này**: "Ghi nhận" báo kết quả **bằng tên riêng của em** (trên một danh sách nhiều đơn, câu "Đã ghi nhận đơn" không cho biết đơn nào đã xong), và action `.select()` + đếm dòng nên RLS chặn không còn báo thành công |
| Trạng thái rỗng dùng đúng 1 trong 3 loại | ✅ `EmptyState variant="no-data"`, mô tả **nêu phạm vi cụ thể** (*"các lớp bạn phụ trách"*, *"7 ngày trước và sau hôm nay"*) đúng quy tắc câu chữ ở `09` §9 |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả bằng tên riêng | — không áp dụng: "Ghi nhận" không phá huỷ gì và **không** đổi điểm danh (D-36). Hộp xác nhận trước khi chốt vẫn là TB-03, **hoãn sang M05-C** như đã ghi ở đợt A |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ✅ `reviewed_by`/`reviewed_at` do **trigger** đặt từ phiên đăng nhập, client không đặt được — cột vết đã có sẵn từ Phase 3, đợt này là lần đầu nó được ghi thật. Không đụng tài khoản/vai trò nên không thêm dòng `account_audit_events` |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không thêm lớp nổi nào; thẻ đơn là ô nhập + nút thường, thông báo dùng `FormMessage` nên có `role="status"`/`role="alert"` |
| Không dùng màu làm tín hiệu duy nhất | ✅ trạng thái đơn là **chữ tiếng Việt** ("Đang chờ" · "Đã ghi nhận"), không phải mã DB và không phải màu |
| Siết quyền ⇒ RLS negative bằng JWT thật | ✅ **1 migration · 0 NỚI · 1 SIẾT (D-75)**. pgTAP `042` **35 bài, toàn bộ bằng JWT thật của 5 vai trò**: 7 bài canh riêng phần quyền cột (kể cả bài chống bẫy "thêm cột mới quên grant"), phụ huynh **và** thiếu nhi nhận `FORBIDDEN` ở cửa sổ hẹp và `42501` khi hỏi thẳng cột, Giáo lý viên lớp khác cầm **đúng id buổi** vẫn bị chặn, Cha sở đọc được (D-139), **1 bài chứng minh cổng phụ huynh không gãy**, và 2 bài cho hàng rào năm học của nợ #18. `012` (67 khẳng định của Phase 3) **giữ nguyên màu xanh** — đó là bằng chứng D-75 không lấn sang phạm vi khác |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `docs/02-database-design.md` §7.2/§7.5 (quyền cột `note` và bẫy của nó, TB-11) + `docs/03-workflow.md` (WF-10 bước 5–6 nay có thật) + `docs/05-permission-matrix.md` (ghi chú D-75 và D-141) + `docs/11-api-and-server-actions.md` §6/§11. **Không đổi `09`/`10`/`11`** của `ui-redesign`; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md`. `00_SYSTEM_AUDIT_BOARD.md` sửa **đúng một chỗ**: dòng M13 không còn ghi D-75 là việc chưa bắt đầu |

**Kiểm thử đo được của đợt:** unit **1033 / 10 skip** (**+19**) · pgTAP **1033/1033** (**+35**) ·
lint **0 warning** · typecheck ✓ · build ✓ **28/28** · bộ `attendance` E2E **33/33** trên ba
viewport (**hai lượt chạy riêng, cả hai đều 33/33**) · **E2E toàn bộ 390/402** trên DB vừa
`db:reset` + `seed:dev`.

> ⚠️ **Ghi lại một cái bẫy về THỨ TỰ chạy, gặp thật ở đợt này:** `supabase test db` phải chạy trên
> DB **vừa `db:reset`**, **trước** `seed:dev`. Chạy sau seed thì **57 khẳng định của 8 file cũ đỏ
> hàng loạt** — toàn những bài đếm số tuyệt đối kiểu *"global reader sees all profiles"*. Không bài
> nào trong số đó liên quan tới đợt này; đây là tính chất sẵn có của bộ pgTAP, nhưng nhìn lần đầu
> thì giống hệt một migration vừa phá hỏng cả hệ thống.

**12 bài đỏ của lượt toàn bộ — tỷ lệ 3,0 %, và đây là lần đầu một bài của ĐỢT ĐANG LÀM có tên
trong bảng:**

| Bài | Số lượt đỏ | Hình dạng |
|---|--:|---|
| 🔴 **`attendance:653` TB-06 ghi nhận đơn** (bài **mới của đợt này**) | 2/3 viewport | **Nợ #10.** Đỏ bằng `Test timeout 120000ms`, **không phải một khẳng định sai** — bài đi hết ba lượt đăng nhập và hai thao tác ghi qua Server Action. Bằng chứng là chập chờn chứ không phải hỏng mã: **cùng bản mã, hai lượt chạy riêng bộ `attendance` đều 33/33** (2,7 phút và 4,1 phút), còn `laptop-1366` xanh ngay trong chính lượt toàn bộ này |
| `enrollment-lifecycle:190` | **3/3 viewport** | **Nợ #10** — khẳng định sau-thao-tác-ghi |
| `enrollment-lifecycle:81` · `student-lifecycle:147` · `imports:274` · `imports:330` · `staff-directory:71` · `students-directory:154` | 1 mỗi bài | **Nợ #10** — đều là khẳng định sau-thao-tác-ghi, và **đổi chỗ giữa các lượt** |
| `staff-directory:124` phân trang sang trang 2 | 1 | **Nợ #15** — `<Link>` chỉ đọc |

✅ **Một câu hỏi mở của M05-A đã có câu trả lời.** Đợt A ghi lại rằng `staff-directory:124` và
`students-directory:154` lần đầu đỏ **đồng loạt cả ba viewport**, và cảnh báo: *"nếu lượt sau lặp
lại thì hai bài này đã chuyển từ chập chờn sang hỏng thật và phải điều tra riêng"*. Lượt này **không
lặp lại** — mỗi bài chỉ đỏ **1/3**. Kết luận: vẫn là nợ #10/#15, **không** phải hỏng thật, và không
cần tách ra điều tra riêng.

⚠️ Tỷ lệ đỏ **3,0 %** (12/402), bằng M12-C (11/372) và thấp hơn M05-A (13/396 = 3,3 %).

#### Đợt M05-C — ✅ XONG (2026-08-03) ⇒ **ĐÓNG MODULE 8 (M05)**

**Hai quyết định của chủ dự án ngày 2026-08-03 mở đường cho đợt này:** **D-142** (hàng nút trạng
thái có **ba** lựa chọn, hai lựa chọn còn lại sau nút "…") · **D-143** (hàng thiếu nhi mặc định
**gấp lại một dòng**, chạm để mở).

**0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.** Đợt duy nhất của module không
sinh migration nào — `07_IMPLEMENTATION_IMPACT` §2.3 đã dự trù đúng vậy: cả bốn đối tượng cơ sở dữ
liệu của M05 đã dùng hết ở đợt A và B. Đây cũng là **đợt duy nhất chạm vào bộ định vị E2E**.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 TB-03 / F06 / AC-F06-1** | **Bấm "Hoàn tất" là chốt luôn, không hỏi lại** | Chốt là thao tác **một chiều**: nó đặt mốc khóa, và sau mốc đó chỉ Quản trị viên hệ thống mở lại được. Tổng kết thì chỉ hiện **sau** — đúng lúc không còn sửa nhẹ nhàng được nữa. Nay hộp xác nhận nêu bảng phân bố tính **từ bản nháp phía client**, không có lượt gọi máy chủ nào giữa hai cú bấm. Hai chỗ khác đặc tả `docs/06` §10 và đều có lý do: bảng tách **hai cột** Thánh lễ / Giáo lý (một con số gộp giấu mất đúng thứ cần soát, vì hai trạng thái độc lập — D-30), và hàng nào cả hai cột đều bằng 0 thì **không in ra** |
| **TB-03 · nửa đáng nhớ hơn: cảnh báo bằng TÊN RIÊNG** | Em có đơn xin nghỉ mà vẫn để "Có mặt" | Không phải lỗi — D-36 nói rõ quyết định cuối là của người điểm danh, và bỏ qua đơn là hợp lệ (em vẫn tới). Nhưng đó là chỗ **nhầm nhiều nhất**, nên hộp thoại nêu **đúng tên các em** thay vì một con số đếm: trên danh sách 50 em, *"có 2 em"* không cho biết phải mở em nào ra xem lại. Chỉ nhắc khi **cả hai cột** còn "Có mặt" — sửa một cột nghĩa là đã có quyết định |
| **🔴 TB-05 / F04 / AC-F05-4** | **Không ai biết mình còn giữ quyền sửa bao lâu** | `heartbeat_attendance_session` trả `timestamptz` từ Phase 3, `claim_attendance_session` trả `out_lease_expires_at` từ Phase 3 — **cả hai đều bị Server Action vứt đi**. Nay lên màn hình: *"Bạn đang giữ quyền sửa · còn khoảng N phút"*, `aria-live="polite"`, đổi giọng và giục Lưu nháp khi còn dưới 3 phút. Làm tròn **lên**: còn 30 giây mà hiện "0 phút" là nói sai theo hướng nguy hiểm nhất |
| **🔴 TB-05 / AC-F05-3** | **Bị tiếp quản thì trang ÂM THẦM chuyển chỉ-đọc** | Bản cũ: heartbeat hỏng ⇒ `router.refresh()` ⇒ các ô mờ đi, phần đang gõ biến mất, **không một chữ nào giải thích**. Nay dừng lại, hiện băng-rôn `role="alert"` nêu lý do, và một ô **chép lại được** phần chưa lưu (chỉ liệt kê **ngoại lệ** — chép cả 50 dòng "Có mặt" thì không ai đọc nổi). Trang **không** tự gửi gì lên máy chủ ở thời điểm đó: gửi là ghi đè dữ liệu của người đang phụ trách, đúng thứ mà cả thiết kế lease sinh ra để chống (`04_TO_BE_FLOWS` TB-05 mục "Không làm") |
| **TB-09 / F15-I1** | Danh sách không có bộ lọc, không có tìm kiếm | Thanh lọc **Tất cả · Đang vắng · Có đơn · Cảnh báo** + ô tìm tên bỏ dấu, **thuần client**. Badge cảnh báo chuyên cần đọc bốn cờ của `v_student_attendance_summary`. 🔴 Lọc bằng `(academic_year_id, class_id)` chứ **không** bằng danh sách `student_id`: danh sách ấy chỉ có **sau** khi truy vấn roster về, tức phải nối thêm một vòng gọi nữa vào trang mà người ta mở ngay trước Thánh lễ. View là `security_invoker` nên **không mở thêm cửa nào** |
| **🔴 TB-09 · chỗ dễ cài sai nhất** | Bộ lọc phải đọc **bản nháp đang gõ** | Lọc theo dữ liệu **đã lưu** thì em vừa được đánh vắng **không** xuất hiện trong nhóm "Đang vắng", và người dùng kết luận rằng cú bấm vừa rồi không ăn. Con số trên nhãn nút lọc thì ngược lại — đếm theo **cả buổi**, không theo trang đang xem: người ta đọc con số ấy để quyết định có bấm hay không |
| **🔴 U-10 / D-142** | **Tối thiểu 100 lần bung danh sách thả xuống cho một buổi nhiều ngoại lệ** | 5 trạng thái × 2 cột × ~50 em, và trên iOS mỗi lần mở là một picker toàn màn hình. Nay là hàng nút: **ba** lựa chọn luôn hiện (Có mặt · Có phép · Không phép) + nút "…" mở Đi trễ · Về sớm. Chủ dự án **không chọn** phương án hai nút của `06_UI_UX_RECOMMENDATIONS` — xem D-142. 🔴 Luật bắt buộc: **trạng thái đang chọn luôn có mặt trong hàng nút**, kể cả khi nó thuộc nhóm sau "…"; thiếu nó thì em đang "Đi trễ" mở ra thấy **không ô nào được chọn**, trông hệt như dữ liệu vừa bị mất |
| **🔴 U-21 / D-143** | **Lớp 50 em dài ~9.000px ở màn hình 360px** | Thẻ mỗi em cao ~180px, mà việc người điểm danh thật sự làm trước khi chốt là *"soát lại mình đã đánh vắng ai"* — tức cuộn hết cả trang. Nay hàng gấp lại còn một dòng: **~1.800px**, giảm ~80%. Chi phí đã chấp nhận: sửa một em mất **thêm một cú chạm**. 🔴 Ràng buộc: hàng gấp lại **vẫn nói đủ trạng thái cả hai cột** bằng hai chip — gấp mà giấu luôn kết quả thì tệ hơn hẳn bản cũ |
| **🔴 U-17 / U-18** | **Bấm Lưu ở đáy, lỗi hiện ở đỉnh** | Trên 360px với 50 em, hai chỗ ấy cách nhau **hàng nghìn pixel**, nên bấm xong thấy màn hình không đổi gì được hiểu là *"bấm không ăn"* — và người ta bấm lại. Nay dòng thông báo nằm **trong** thanh hành động dính đáy, cạnh đúng cái nút vừa bấm. `FormMessage` tự đặt `role="alert"` cho lỗi và `role="status"` cho thành công (cơ chế có sẵn từ mục 0.5, nằm trong danh sách KHÔNG ĐƯỢC ĐỤNG của `09` §11) |
| **U-24 / U-25** | Người dùng bàn phím và trình đọc màn hình bị bỏ lại | U-24: vùng đồng hồ lease `aria-live="polite"`, băng-rôn mất quyền `role="alert"`. U-25: sau mỗi lượt ghi, focus **không** rơi về `<body>` nữa — nó về đúng dòng thông báo, vốn nằm ngay trên hai cái nút; bản cũ bắt người dùng bàn phím Tab lại từ đầu qua ~150 điều khiển |
| **D-80 · dọn nốt module** | Hai ô `<select>` trần cuối của module | Ô "Lớp" và ô "Buổi" ở `/attendance` sang component `Select` — đúng khuôn M12-A và M02-B đã làm cho module của họ. `Select` bọc một `<select>` native nên biểu mẫu vẫn gửi được khi JavaScript chưa tải (`09` §11, mạng phòng học). Sau đợt này **module M05 không còn thẻ `<select>` chép tay nào** |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **`SegmentedControl` được mở rộng HAI prop, không sửa hành vi cũ.** `ariaLabel` cho từng ô —
   nhãn nhìn thấy phải rút gọn ("Có phép") cho vừa bề ngang 360px, nhưng trình đọc màn hình phải
   nghe câu đầy đủ ("Vắng có phép"). Và `disabled` cho **cả nhóm** qua `<fieldset disabled>` của
   HTML thay vì rải `disabled` xuống từng ô: trình duyệt tự lan xuống mọi input bên trong, nên
   thêm một lựa chọn mới về sau **không thể quên khoá**.
2. **`leaseStatus` và `buildFinalizePreview` nhận tham số thay vì tự đọc đồng hồ / đọc state.**
   Cùng lý do đã ghi ở `mostRecentMeetingDate` (TB-01) và `absenceReviewWindow` (M05-B). Riêng
   đồng hồ lease còn một ràng buộc nữa: **lease do giờ của cơ sở dữ liệu quyết định** (AC-F05-1
   canh đúng điều đó bằng cách đổi đồng hồ máy khách), nên con số trên màn hình là **ước lượng để
   người dùng biết đường mà bấm Lưu**, và câu chữ không được hứa chắc chắn. Vì vậy khi quá hạn nó
   nói *"người khác **có thể** tiếp quản"*, không nói *"bạn đã mất quyền sửa"* — lease hết hạn
   không tự chuyển quyền cho ai.
3. **`now` khởi tạo là `null`, đặt trong `useEffect`.** `Date.now()` lúc dựng ở máy chủ khác với
   lúc dựng ở trình duyệt, và một con số phút chênh nhau là hydration mismatch. Trước khi trang
   gắn xong thì **không hiện đồng hồ** — đúng hơn là hiện sai.
4. **Hàng gấp lại không dựng điều khiển nào, mà bản nháp vẫn nguyên.** Bản nháp sống ở state của
   `AttendanceEditor`, không sống trong DOM của hàng; đóng hàng lại rồi mở ra vẫn thấy đúng thứ
   vừa chọn. Có bài unit canh riêng chỗ đó.

**Ba lỗi thật bắt được, đều do CHẠY chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **`AbsenceReviewPanel` xoá mất câu xác nhận của chính nó** — lỗi của **M05-B**, và nó đã bị ghi nhầm thành nợ #10 | Lượt E2E đầy đủ đỏ ở bài TB-06; mở `error-context.md` ra đọc thì panel đang hiện *"Chưa có đơn xin nghỉ nào đang chờ"* — tức cú bấm **đã chạy**, chỉ có câu xác nhận là không bao giờ xuất hiện | Component trả về trạng thái rỗng **trước khi** dựng dòng thông báo. Ghi nhận đơn **cuối cùng** đang chờ ⇒ `router.refresh()` làm danh sách rỗng ⇒ câu *"Đã ghi nhận đơn của {tên}"* bị **chính lượt làm mới nó vừa kích hoạt** xoá mất. Vi phạm D-61 ở đúng ca thường gặp nhất. Nay dòng thông báo nằm ngoài nhánh rỗng; có bài unit `rerender` canh riêng |
| 2 | **`clickUntil` treo cứng 120 giây thay vì thăm dò** | Cùng lượt chạy: thông điệp lỗi trỏ vào **cú bấm thứ hai**, không nói ra sự thật | Mọi nút chạy qua Server Action đều `disabled={pending}`; lượt thử lại bấm thẳng vào nút đang khoá thì Playwright **đợi nó mở ra** cho tới khi hết giờ cả bài. Nay có `clickIfEnabled` |
| 3 | **Hai bài mới đẩy buổi của bài TB-02 ra khỏi danh sách** | Lượt chạy đầu của bộ `attendance`: TB-02 đỏ ở 2/3 viewport với *"locator resolved to 0 elements"* | `/attendance` liệt kê **24 buổi gần nhất** theo ngày giảm dần, mà mọi bài của bộ này đặt buổi ở tương lai xa. Hai bài mới dùng số tuần **lớn hơn** các bài cũ nên chúng chen lên trước. Nay số tuần của bài mới đặt **dưới** mốc của TB-02, và lý do ghi ngay tại chỗ |

**Nghiệm thu 15 mục (`11` §5) cho đợt M05-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **1090 pass / 10 skip** (trước M05-C: 1033/10, **+57**) · build ✓ **28/28 trang** · pgTAP **1033/1033** (**không đổi** — đợt này 0 migration) · **E2E toàn bộ 401/408** |
| E2E responsive 3 viewport, không tràn ngang | ✅ bộ `attendance` **39/39** trên 360 · 768 · 1366 (trước đợt này 33 bài, **+6**: 2 bài mới × 3 viewport), **xanh cả hai lượt chạy riêng**. Hai bài mới đều tự đo `scrollWidth`, kể cả **bên trong hộp xác nhận** |
| Vùng chạm ≥44px | ✅ đo bằng `boundingBox()` trên cả ba viewport cho **bốn** loại điều khiển mới: nút gấp/mở hàng · nút trạng thái thiếu nhi · nút điểm danh giáo lý viên · nút lọc danh sách. Đo **chiều cao thật đã dựng**, không kiểm tên lớp CSS — một chuỗi `min-h-11` viết đúng vẫn có thể bị lớp khác đè |
| Không cỡ chữ < 12px | ✅ không thêm bậc chữ mới; chip trạng thái dùng `text-2xs` = 12px, đúng sàn cứng của `09` §2 |
| Không màu hardcode khi có token | ✅ grep sáu file mới/viết lại của đợt: **0 mã hex/rgb/hsl**, và **0 bổ ngữ độ mờ** trên token màu (nợ #5 không phình thêm) |
| Không `window.confirm` / `window.alert` | ✅ đợt này **thêm một hộp xác nhận thật** (`ConfirmDialog`) chứ không thêm `window.confirm`; vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ và hơn thế: đợt này **gỡ nốt hai thẻ `<select>` trần cuối** của module sang `Select` (D-80). Năm ô chọn của roster đã thành hàng nút (U-10) |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ **và đây là chỗ đợt này sửa một lỗi thật của M05-B**: câu xác nhận "Đã ghi nhận đơn của {tên}" trước đó bị xoá mất đúng lúc nó thành sự thật (xem bảng lỗi ở trên). Phía điểm danh: thông báo chuyển vào thanh hành động cạnh nút vừa bấm (U-17), và focus về đúng chỗ đó (U-25) |
| Trạng thái rỗng dùng đúng 1 trong 3 loại | ✅ danh sách lọc ra rỗng **nói đúng thứ đang lọc** (*"Chưa em nào được đánh vắng trong buổi này"* · *"Không có em nào khớp «X» trong nhóm «Cảnh báo»"*) thay vì một câu chung. `EmptyState variant="no-data"` của thẻ đơn xin nghỉ giữ nguyên |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả bằng tên riêng | ✅ **mục cố ý hoãn từ đợt A và B nay đã trả**: `ConfirmDialog` trước khi chốt, nêu hậu quả (*"buổi khóa lại theo số ngày của năm học, chỉ Quản trị viên hệ thống mở khóa được"*) và nêu **tên riêng** những em có đơn xin nghỉ vẫn đang để "Có mặt" |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò và không thêm thao tác ghi nào |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ `ConfirmDialog` dùng `Dialog` của mục 0.6 nên thừa hưởng cả năm yêu cầu (bẫy focus hai chiều, `Escape` đóng và **trả focus**, khoá cuộn nền). Hàng gấp/mở là `<button aria-expanded aria-controls>`; hàng nút là radio native nên có sẵn điều hướng phím mũi tên |
| Không dùng màu làm tín hiệu duy nhất | ✅ chip trạng thái ở hàng gấp lại **luôn có chữ** ("Lễ: Có mặt"), badge cảnh báo mang lý do đầy đủ trong `aria-label` và thành chữ khi mở hàng ra; ô đang chọn của hàng nút có **ba** tín hiệu (nền · chữ đậm · dấu ✓) đúng thiết kế `SegmentedControl` từ mục 0.8 |
| Siết quyền ⇒ RLS negative bằng JWT thật | — **không áp dụng: 0 thay đổi phân quyền, 0 migration.** Đợt này chỉ đọc thêm một view `security_invoker` sẵn có. pgTAP **1033/1033 giữ nguyên** — đó chính là bằng chứng ranh giới không nhúc nhích |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (M05 chuyển sang **XONG**) + `docs/03-workflow.md` (WF-05: hộp xác nhận, đồng hồ lease, hàng nút, bộ lọc) + `docs/06-ui-ux-spec.md` §10 (ba chỗ giao diện thật **khác** đặc tả, có ghi lý do) + `docs/11-api-and-server-actions.md` §6 (hai action trả thêm `leaseExpiresAt`; trang buổi đọc thêm view cảnh báo). **Không đổi `09`/`10`/`11`** của `ui-redesign`; không đổi `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md` |

**Kiểm thử đo được của đợt:** unit **1090 / 10 skip** (**+57**) · pgTAP **1033/1033** (**+0** — đợt
này không có migration) · lint **0 warning** · typecheck ✓ · build ✓ **28/28** · bộ `attendance`
E2E **39/39** trên ba viewport (**hai lượt chạy riêng, cả hai đều 39/39**) · **E2E toàn bộ 401/408**
trên DB vừa `db:reset` + `seed:dev`.

**7 bài đỏ của lượt toàn bộ — tỷ lệ 1,7 %, THẤP NHẤT từ trước tới nay, và 0 bài thuộc điểm danh:**

| Bài | Số lượt đỏ | Hình dạng |
|---|--:|---|
| 🔴 `staff-directory:124` phân trang sang trang 2 | **3/3 viewport** | **Nợ #15** — nguyên văn *"bấm nhiều lần vẫn không có hiệu lực"* trên một `<Link>` **chỉ đọc**. Xem cảnh báo riêng ngay dưới bảng |
| `results:201` công bố bài kiểm tra | 2/3 | **Nợ #10** — khẳng định sau-thao-tác-ghi (nút "Lưu điểm {tên bài}" không kịp hiện). Đây là spec mang **nợ #1** (`window.confirm`), trả ở M07 |
| `committees:156` · `imports:330` | 1 mỗi bài | **Nợ #10** — đều là khẳng định sau-thao-tác-ghi, và **đổi chỗ giữa các lượt** |

🔴 **`staff-directory:124` nay đã đủ ba điểm đo, và kết luận cũ KHÔNG còn đứng vững.** M05-A ghi lại
rằng bài này lần đầu đỏ **đồng loạt cả ba viewport** và cảnh báo: *"nếu lượt sau lặp lại thì nó đã
chuyển từ chập chờn sang hỏng thật và phải được điều tra riêng"*. M05-B chạy lại thấy **1/3** và kết
luận *"không lặp lại, vẫn là nợ #15"*. Lượt này **3/3 lần nữa**. Ba điểm đo: **3/3 · 1/3 · 3/3**.
Với `students-directory:154` thì hình dạng ngược lại — nó đỏ 3/3 ở M05-A, 1/3 ở M05-B và **xanh
hoàn toàn** lượt này, tức bài ấy đúng là chập chờn. Hai bài vì vậy **phải tách ra**: nghi phạm dẫn
đầu của nợ #15 (lượt điều hướng phía trình duyệt của Next 15.5 không bao giờ chốt) khớp với
`staff-directory:124` hơn hẳn cách gọi "chập chờn". ⇒ **Đề nghị cho phiên sau: điều tra riêng bài
này**, đo bằng cách M02-B đã dùng (đếm số lượt `router.push` được gọi so với số lượt URL thật sự
đổi). **Không** sửa ở đợt này: nó nằm ở `/staff` (M04, module đã đóng) và mở rộng phạm vi lặng lẽ là
điều `AGENTS.md` §4 cấm.

---

### Module 9 — M06 Giáo án · chia ba đợt · ✅ **ĐÓNG 2026-08-05**

🔴 **Module này KHÁC bảy module trước: nghiệp vụ GIỮ NGUYÊN.** `11` §3 xếp nó
`PASS_WITH_MINOR_UI_FIX`, cột "Nghiệp vụ" ghi thẳng **GIỮ NGUYÊN**, cỡ UI là **S**. Điểm audit
**65/75** — cao nhất hệ thống — và `07_IMPLEMENTATION_IMPACT` mở đầu bằng câu *"không có việc nào
bắt buộc phải làm ngay để chặn rò rỉ dữ liệu — module đạt toàn bộ kiểm tra bảo mật đặc biệt"*.
Đây là module để **tinh chỉnh**, không phải để thiết kế lại.

Một luồng duy nhất dưới ngưỡng: **F04 Sửa mục / đổi người dạy — 57/75 `NEEDS_IMPROVEMENT`**, vì
`updateTeachingPlanItem` ghi đè mù. Mọi thứ còn lại là điểm trừ lẻ ở thông điệp lỗi, ô chọn, và vỏ
giao diện.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M06-A** | Nhóm **S, độc lập** và **S, siết an toàn** của `07` §2: `FormMessage` thiếu `tone` (#1) · lọc ô chọn người dạy theo ngày (#3 / TB-M06-03) · câu lỗi đúng cho từng ràng buộc, **phần cục bộ** của #2 · kiểm dung lượng tệp ở trình duyệt (#10) · kiểm quyền tường minh cho link tải tệp (#5 / TB-M06-04) · chặn cổng phụ huynh ở route chi tiết + trạng thái rỗng của hub (#6 / TB-M06-05) · phân biệt lỗi RPC với "rỗng" (#11) · E2E chống tràn ngang (#12). Kèm **nợ #14** và **nợ #20** | ✅ **XONG 2026-08-04** |
| **M06-B** | **CÓ MIGRATION.** **D-144** siết quyền sửa về Giáo lý viên đại diện · **D-145** nới quyền đọc cho đội ngũ lớp (TB-M06-06 phương án A) · **nợ #18** hàng rào năm học đã đóng cho `teaching_plans`/`teaching_plan_items` · **D-146** kiểm phiên bản khi sửa mục (#4 / TB-M06-01). Cần `db:reset` + chạy lại **toàn bộ** pgTAP | ✅ **XONG 2026-08-05** |
| **M06-C** | Giao diện: gom lại biểu mẫu 12 trường + drawer trên điện thoại (#8) · thay `window.confirm` bằng `ConfirmDialog` (#9 — **nợ #1**, M06 giữ **2** trong 6 chỗ còn lại). **0 migration** | ✅ **XONG 2026-08-05** ⇒ **ĐÓNG MODULE 9** |

> **Hạng mục #2 phần dùng chung CỐ Ý hoãn sang M07.** `07` §2 khuyên làm tầng `fieldErrors` ở
> `src/lib/errors` **cùng lúc với M07** để khỏi sửa hai lần, và biên bản audit kết luận nguyên nhân
> gốc là **cross-module**. Đợt A chỉ đóng phần nằm gọn trong module — đủ để **TB-03** và **TB-04**
> xanh — và **không đụng một dòng nào** của `src/lib/errors`.

#### Đợt M06-A — ✅ XONG (2026-08-04)

**0 migration · 0 thay đổi phân quyền ở cơ sở dữ liệu · 0 dòng dữ liệu bị đụng.**
pgTAP giữ nguyên **1033/1033** — và đó chính là bằng chứng ranh giới phân quyền không nhúc nhích.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **#1 / UI-02** | **Thông báo THÀNH CÔNG hiện màu đỏ kèm tam giác cảnh báo** | Chỗ gọi `FormMessage` trong thẻ mục quên `tone`, mà mặc định của component là `danger`. Nên câu *"Đã lưu tài liệu vào kho riêng tư."* không chỉ đỏ: `FormMessage` suy `role` **từ** `tone`, nên nó mang `role="alert"` và trình đọc màn hình đọc **"Lỗi:"** trước một thông báo thành công. Thành công và thất bại trông y hệt nhau ở đúng chỗ cần phân biệt nhất. Bài test đọc **`role`**, không đọc tên lớp CSS — vì `role` mới là thứ suy ra từ `tone` |
| **🔴 #3 / TB-M06-03 / TB-05** | **Ô chọn người dạy mời chọn người mà cơ sở dữ liệu chắc chắn từ chối** | Truy vấn chỉ lọc `is_active`, trong khi trigger `validate_teaching_plan_item` đòi `starts_on <= planned_date <= ends_on`. `TeachingPlanStaffOption` **đã mang sẵn** `startsOn`/`endsOn` từ Phase 4 mà màn hình không dùng. Nay `plannedDate` là state, danh sách lọc theo nó, và danh sách rỗng thì nói ra kèm đường đi tiếp tới `/staff` |
| **🔴 Cái bẫy của #3, và nó NẶNG HƠN lỗi đang sửa** | Lọc rồi thôi thì `<select>` **âm thầm đổi người dạy** | `<select>` đang giữ một giá trị mà giá trị ấy biến khỏi danh sách thì trình duyệt nhảy về lựa chọn đầu tiên. Kịch bản thật: mở một mục cũ, **chỉ đổi mỗi ngày** sang tuần sau — nếu phân công của người dạy vừa kết thúc thì ô người dạy tự đổi sang người khác **mà không ai bấm gì**, rồi lượt lưu ghi đè. Nay `partitionTeachingStaff` **tách riêng** người đang được chọn thay vì vứt đi, giữ nguyên trong danh sách kèm chữ *"không phụ trách lớp vào ngày này"* và một dòng cảnh báo. Có bài unit riêng cho đúng ca này |
| **#2 (phần cục bộ) / TB-03** | **Câu lỗi đã viết sẵn từ Phase 4 CHƯA TỪNG hiện ra một lần nào** | `failure()` chỉ giữ `message` của `AppError`, nên mọi `ZodError` rơi vào *"Không thể lưu giáo án. Vui lòng thử lại."* — kể cả câu `"Bài học phải có người dạy."` viết rất kỹ trong `schemas.ts`. Câu ấy **hứa rằng thử lại sẽ được**, trong khi bấm lại y hệt thì hỏng y hệt. Nay `describeZodIssues` gọi tên trường bị sai; câu `custom` của schema giữ **nguyên văn** |
| **#2 / TB-04** | **Câu trả lời đúng cho một câu hỏi khác** | `mapDatabaseError` gán cứng *"Ngày này đã có một mục giáo án."* cho **mọi** mã `23505`. Hai người cùng bấm "Tạo giáo án" cho một lớp thì người sau đọc một câu về **ngày** — trong khi biểu mẫu tạo giáo án **chỉ có đúng một ô tên**, không có ô ngày nào. Nay phân biệt theo **tên ràng buộc**, và ba luật `23514` (`TEACHING_PLAN_DATE_OUTSIDE_YEAR` · `TEACHING_PLAN_TEACHER_OUT_OF_CLASS` · `TEACHING_PLAN_ITEM_CANNOT_MOVE`) có câu riêng nói đúng việc phải làm |
| **🔴 #10 / BR-M06-16** | **Trần 5 MB là một lời hứa KHÔNG THỂ giữ** — đúng cái bẫy M12-C đã trả giá | `next.config.mjs` đặt `bodySizeLimit: "4.5mb"` (**D-137**), mà con số ấy áp cho **MỌI** Server Action — tải tài liệu giáo án cũng là một Server Action. Nên tệp 4,5–5 MB **không bao giờ** tới được mã ứng dụng: nó chết ở tầng hạ tầng bằng một trang lỗi tiếng Anh, và câu *"Tệp phải có dung lượng từ 1 byte đến 5 MB."* viết trong `actions.ts` không có cơ hội chạy. Tệ hơn: dòng chữ *"tối đa 5 MB"* dưới ô chọn tệp **mời** người dùng làm đúng thứ chắc chắn hỏng. Nay trần ứng dụng là **4 MB**, đúng con số D-137 đã chốt cho toàn hệ thống — một sự thật duy nhất chứ không phải hai. Bucket giữ nguyên `file_size_limit = 5242880` (pgTAP `015` canh con số đó): hàng rào **ngoài cùng** rộng hơn hàng rào trong là đúng chiều |
| **#5 / TB-M06-04 / TB-06** | Action **duy nhất** của module không kiểm quyền theo lớp | `createTeachingMaterialUrl` chỉ hỏi *"đã đăng nhập chưa"* rồi dựa hoàn toàn vào RLS. Vẫn an toàn nhờ **hai** lớp RLS (bảng + storage), nhưng `docs/11` §7 đòi kiểm tường minh **trước**, và một điểm gãy một-lớp trên đúng đường sinh link tải tệp là chỗ không nên để. Nay `canReadTeachingClass` từ chối **trước khi chạm Storage API**. Hàm có sẵn nhánh thứ tư "có tên trong đội ngũ lớp" (**D-145**, RLS sẽ theo ở đợt B) — lệch theo chiều này **an toàn**: người thuộc nhánh ấy vẫn bị RLS chặn ở bước đọc dòng ngay sau đó |
| **🔴 #6 / TB-M06-05 / TB-07** | Phụ huynh gõ thẳng địa chỉ trang quản trị vẫn thấy khung trang | `route-map.ts` khai báo `/teaching-plan` không giới hạn vai trò — **đúng**, vì cổng dùng chung địa chỉ gốc cho lịch 7 ngày. Nhưng `/teaching-plan/{classId}` vì thế vẫn dựng ra trang quản trị: tên lớp thật (bảng `classes` đọc rộng), hai nút đổi kiểu hiển thị, và câu *"Giáo án chưa có bài dạy hoặc bài kiểm tra."* — RLS đã lọc sạch dữ liệu nên **không rò rỉ gì**, nhưng câu cuối là một **lời nói dối** về một giáo án đang có đầy bài. Chặn ở tầng truy vấn theo `audience`, đúng ca mà M05-A gặp ở `/attendance` (TB-10). Mô tả đầu trang của cổng nay là *"Lịch học 7 ngày tới của con/của em"* |
| **#6 / TB-08** | Trạng thái rỗng của hub trả thẳng `null` | Trước đợt này là **đúng một khoảng trắng** dưới thẻ "7 ngày sắp tới", không phân biệt được với trang hỏng. Nay dùng `EmptyState` chuẩn. 🔴 **Câu chữ KHÔNG theo nguyên văn tài liệu, và đó là chủ ý** — xem mục "hai chỗ tài liệu audit ghi sai" bên dưới |
| **#11** | *"Không tải được"* và *"không có bài nào"* dùng chung một câu | `catch` của RPC lịch 7 ngày trả về `items: []`, **cùng hình dạng** với "tuần này không có bài". Nên khi hàm hỏng thật, màn hình nói *"Chưa có bài học hoặc bài kiểm tra trong khoảng này."* — một câu bình thản, đúng ngữ pháp, và **sai**: phụ huynh đọc rồi cho con nghỉ, còn Giáo lý viên không có lý do nào để báo hỏng. Nay `failed` là một trường riêng. Ca "sau ngày bế giảng" (AC-14) **cố ý** vẫn là rỗng thật, không phải hỏng |
| **#12 / UI-01** | Bộ E2E giáo án **chưa từng đo tràn ngang** | Thêm `expectNoHorizontalOverflow` cho trang lớp, hub, xem theo tháng và trang cổng, trên cả ba viewport |
| **Nợ #14 / D-96** | Guard sai kiểu **và** sai chỗ, ở **bảy** thao tác | ⚠️ **Đúng cái bẫy M12-A vừa dặn lại:** module gọi `requireAuthContext` qua **ba** hàm bọc (`requireManageClass` · `requireManagePlan` · `requireManageItem`), nên grep tên hàm ở tầng action ra **0 kết quả** cho bốn trong bảy thao tác. Nay `teachingPlanRouteContext()` — `requireRouteAccess` — gọi **ngoài `try`**, ba hàm bọc nhận `context` làm tham số |
| **Nợ #20** | Link "← Danh sách lớp" cao **18px** | `-my-3 inline-flex min-h-11`, đúng khuôn `students/[studentId]` và `attendance/[sessionId]`. Bài E2E **đo bằng `boundingBox()`**, đo luôn hai nút chuyển kiểu hiển thị |
| **C14 / F06 · UI-04** | Ô chọn tệp không có `htmlFor`, không có `aria-describedby`; toggle chỉ khác nhau ở **màu** | Ô chọn tệp nay là `FileUpload` của Đợt 0-UI: mang sẵn nhãn nối đúng, dòng giới hạn làm đích `aria-describedby`, tên tệp đã chọn trong vùng `role="status"`, và nút "Chọn tệp" do trình duyệt vẽ đủ 44px. Vẫn là `input[type=file]` native nên bộ định vị E2E không phải đổi. Toggle nay là `role="group"` có tên + `aria-current="page"` |

**Bốn quyết định cài đặt cần nhớ:**

1. 🔴 **Kiểm tệp đọc từ `input.files`, KHÔNG từ `FormData`.** Ở trình duyệt thật hai đường cho cùng
   một `File`, nhưng `FormData` là bản sao do môi trường dựng. Đo được: trong **jsdom**,
   `new FormData(form).get("file")` trả về một `File` **size 0, mất cả tên lẫn kiểu MIME** — kiểm
   trên nó là kiểm một thứ không tồn tại. Đây là một giới hạn **khác và tệ hơn** cái M12-A ghi lại
   (M12-A: biểu mẫu có tệp thì cú bấm nút không kích hoạt `onSubmit`; cái đó cũng vẫn đúng, nên bài
   test dùng `fireEvent.submit`).
2. **Trần dung lượng là một hàm dùng chung cho cả hai phía, không phải một hằng số chép hai nơi.**
   Cùng khuôn `features/imports/limits.ts` của M12-C. Có bài test **đọc thẳng `next.config.mjs`**
   và khẳng định trần nghiệp vụ nằm dưới `bodySizeLimit` — chép tay con số thì bài test vẫn xanh sau
   khi ai đó hạ `bodySizeLimit`.
3. **`ItemFields` và `FileUpload` dựng lại bằng `key`, không bằng một danh sách `setState`.**
   Từ đợt này ngày dự kiến và người dạy là state có kiểm soát, nên `form.reset()` — vốn chỉ khôi
   phục `defaultValue` — không còn dọn được chúng. Đổi `key` là **một chỗ duy nhất** đặt lại mọi
   giá trị mặc định; một danh sách `setState` là thứ lần thêm trường sau chắc chắn quên cập nhật.
4. **`accept` của ô chọn tệp dùng phần ĐUÔI, allowlist của máy chủ vẫn dùng MIME.** Đưa thẳng danh
   sách MIME vào `accept` thì dòng chú thích hiện nguyên
   `application/vnd.openxmlformats-officedocument.presentationml.presentation` — đúng kỹ thuật, vô
   nghĩa với Giáo lý viên.

**🔴 Hai chỗ tài liệu audit ghi SAI, kiểm chứng bằng mã nguồn — không sửa `03`/`04`/`08`, chỉ ghi lại đây:**

| Chỗ | Tài liệu nói | Mã nguồn nói |
|---|---|---|
| `03` §C08/C09 và **TB-09** | *"nhân sự là đại diện lớp Y qua `class_staff_assignments` nhưng `role_assignments.class_id = X`"* — và đề nghị viết pgTAP dựng đúng fixture ấy | **Cấu hình đó không dựng được.** Trigger `validate_class_staff_assignment` ném `ROLE_CAPACITY_MISMATCH` theo chiều này; trigger BR-A17 ném `ACTIVE_CLASS_ASSIGNMENT_REQUIRED` theo chiều kia. Bài test viết đúng như tài liệu sẽ **chết ở bước dựng dữ liệu**. Lỗ thật hẹp hơn — xem **D-145** |
| `03` §C12 và **TB-08** | *"staff không phụ trách lớp nào không thấy thông báo nào"*, đề nghị câu *"Bạn chưa được phân công lớp nào có giáo án."* | Policy `classes_select_scope` cho **mọi** nhân sự đọc **mọi** lớp (chỉ phụ huynh/thiếu nhi bị thu hẹp — D-70), nên Giáo lý viên không phụ trách lớp nào vẫn thấy đủ thẻ lớp với nhãn "Chỉ xem". Nhánh rỗng chỉ chạy khi **năm học chưa có lớp nào đang hoạt động**. Viết đúng câu của tài liệu ở đây là dựng một lời giải thích **sai** cho một tình huống khác hẳn: người đọc sẽ đi hỏi Ban điều hành về phân công, trong khi việc phải làm là **sinh danh sách lớp** |

**Hai lỗi thật bắt được, cả hai đều do CHẠY chứ không do đọc:**

| # | Lỗi | Cách phát hiện | Đã chữa |
|---|---|---|---|
| 1 | 🔴 **Lỗi do CHÍNH đợt này gây ra:** `FileUpload` giữ tên tệp trong **state của riêng nó**, mà `form.reset()` chỉ dọn giá trị ô nhập — không đụng state React. Lưu xong, dòng *"Đã chọn: giao-an.pdf"* **vẫn nằm đó** cạnh câu "Đã lưu tài liệu…", như thể còn một tệp đang chờ lưu lần nữa | Lượt E2E đầy đủ đầu tiên | Dựng lại `FileUpload` bằng `key`. Thêm **1 khẳng định unit** canh đúng chỗ đó |
| 2 | 🔴 **Bài E2E cũ XANH GIẢ, và chính đợt này làm lộ ra.** `expect(itemCard.getByText(new RegExp(fileName)))` khớp đúng dòng *"Đã chọn: …"* mà `FileUpload` hiện ngay lúc **chọn** tệp — tức **trước** khi bấm Lưu. Bài ấy xanh kể cả khi lượt lưu thất bại hoàn toàn; lượt đỏ đầu tiên rơi ở **bước sau đó** (nút "Tải xuống" của GLV910 không tồn tại), cách chỗ hỏng thật ba thao tác | Lượt E2E đầy đủ đầu tiên đỏ **3/3 viewport** | Khẳng định lại bằng **nút "Gỡ tệp"/"Tải xuống"** — chúng chỉ dựng khi `material_name` đã có trong cơ sở dữ liệu. Kèm hai lượt chờ còn thiếu: `toBeEnabled()` cho nút "Xóa" và cho ô chọn tệp, vì cả thanh nút dùng chung một cờ `pending` của `useTransition` |

**Nghiệm thu 15 mục (`11` §5) cho đợt M06-A:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **1131 pass / 10 skip** (trước M06-A: 1090/10, **+41**) · build ✓ **28/28 trang** · pgTAP **1033/1033** (**+0** — 0 migration) |
| E2E responsive 3 viewport, không tràn ngang | ✅ bộ `teaching-plan` **6/6** trên 360 · 768 · 1366 (trước đợt này 3 bài, **+3**: 1 bài mới × 3 viewport), **hai lượt chạy riêng đều 6/6**. `expectNoHorizontalOverflow` nay phủ 4 màn của module |
| Vùng chạm ≥44px | ✅ **nợ #20 đã trả**: link "← Danh sách lớp" từ 18px lên `min-h-11`, đo bằng `boundingBox()` trên ba viewport; đo luôn hai nút chuyển kiểu hiển thị. Ô chọn tệp đổi sang `FileUpload` nên nút "Chọn tệp" cũng đạt 44px |
| Không cỡ chữ < 12px | ✅ không thêm bậc chữ mới |
| Không màu hardcode khi có token | ✅ đợt này không thêm màu nào; grep hai trang + editor + week-ahead: **0 mã hex/rgb/hsl** |
| Không `window.confirm` / `window.alert` | ⚠️ **không thêm chỗ nào, và cố ý chưa trả 2 chỗ sẵn có** — đó là #9, thuộc **đợt C**, và `07` §3 khuyên sửa đồng thời spec của M05/M06/M07. Vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ không thêm ô chọn nào. **Hai** ô `<select>` sẵn có (Loại mục · Người dạy) **cố ý giữ nguyên** — đổi sang `Select` của design system là một phần của #8 (gom lại biểu mẫu 12 trường), thuộc **đợt C**; gộp vào đợt sửa đúng đắn dữ liệu là trộn hai loại rủi ro, đúng lý lẽ M05-A đã dùng |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ đợt này làm phản hồi **đúng hơn** chứ không thêm thao tác ghi: thông báo thành công hết đỏ, câu lỗi Zod và câu lỗi ràng buộc DB thay cho hai câu chung chung, và lỗi RPC lịch tuần hết bị nhầm thành "rỗng" |
| Trạng thái rỗng dùng đúng 1 trong 3 loại | ✅ hub dùng `EmptyState variant="no-data"` với câu nêu **tên năm học cụ thể** (`09` §9). Xem ghi chú "tài liệu audit ghi sai" về câu chữ |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả bằng tên riêng | — **cố ý hoãn sang đợt C** (#9). Hai chỗ `window.confirm` hiện có **đã nêu tên riêng** (tên mục, tên tệp), nên chỗ thiếu là **dạng hộp thoại**, không phải câu chữ |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không thêm lớp nổi nào. `FileUpload` có `htmlFor` nối đúng nhãn và `aria-describedby` trỏ dòng giới hạn — đúng thiếu sót C14/F06; ô chọn người dạy có `aria-describedby` trỏ dòng cảnh báo khi có |
| Không dùng màu làm tín hiệu duy nhất | ✅ **UI-04 đóng**: toggle "Danh sách/Theo tháng" trước đây chỉ khác nhau ở **màu nút**; nay có `aria-current="page"`, và `<div aria-label>` trần đổi thành `role="group"` (nhãn trên `<div>` không role thì trình đọc màn hình không công bố) |
| Nếu siết quyền ⇒ RLS negative bằng JWT thật | — **không áp dụng cho đợt A: 0 migration, 0 policy đổi, 0 grant đổi.** pgTAP **1033/1033 không đổi một bài nào** chính là bằng chứng. **D-144** (siết) và **D-145** (nới) nằm ở **đợt B** và sẽ có pgTAP bằng JWT thật |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md`. **Không đổi `09`/`10`/`11`**; **không đổi** `03_AUDIT_RESULTS.md`/`04_TO_BE_FLOWS.md`/`08_ACCEPTANCE_CRITERIA.md` của M06 — hai chỗ tài liệu ghi sai được ghi đính chính ở đây. `00_SYSTEM_AUDIT_BOARD.md` **không đổi** — M06 chưa đóng |

**Kiểm thử đo được của đợt:** unit **1131 / 10 skip** (**+41**) · pgTAP **1033/1033** (**+0**) · lint
**0 warning** · typecheck ✓ · build ✓ **28/28** · bộ `teaching-plan` E2E **6/6** trên ba viewport,
**ba lượt chạy riêng đều 6/6**, lượt cuối trên **mã cuối cùng** · E2E toàn bộ **397/411** trên DB
vừa `db:reset` + `seed:dev` — 14 đỏ = **3,4 %**, và **0 bài nào thuộc giáo án**.

**14 bài đỏ của lượt toàn bộ — không bài nào thuộc giáo án, và đều là hai nợ đã ghi sẵn:**
`imports` ×5 · `committees` ×2 · `enrollment-lifecycle` ×2 · `results` ×2 · `attendance` ·
`authenticated-shell` · `student-lifecycle`. Làm đúng lời dặn của M05-C (*"đỏ bằng timeout không tự
động là nợ #10 — phải mở `error-context.md` ra đọc"*), đã soát hai bài đỏ ở nhiều viewport:
`imports:330` là `page.waitForURL` hết 45 giây — **nợ #15**; `committees:156` là khẳng định
*"Khả dụng 2/3"* sau một thao tác ghi — **nợ #10**. Cả hai ở module đã đóng, đợt này không đụng tới.

⚠️ **Một điều phải nói rõ về thứ tự chạy:** lượt E2E **toàn bộ** chạy trên bản build **trước** hai
sửa đổi cuối cùng của đợt — (a) ô "Người dạy" đổi từ `<label>` bọc sang `<Label htmlFor>`, vì dòng
cảnh báo là một `<p>` **chứa liên kết**, mà nội dung tương tác nằm trong `<label>` thì bấm liên kết
cũng bung luôn ô chọn; (b) chặn `formatDateVi("")` in ra *"Invalid Date"* khi ngày còn gõ dở. Cả hai
chỉ đụng `teaching-plan-editor.tsx` (+ một hàm thuần), và **lint · typecheck · unit · build · bộ
`teaching-plan` E2E đã chạy lại đầy đủ trên mã cuối**; 14 bài đỏ kia không có bài nào chạm tới file
đó

#### Đợt M06-B — ✅ XONG (2026-08-05)

**1 migration · 2 thay đổi phân quyền SIẾT (D-144, nợ #18) · 1 NỚI (D-145) · 0 `alter table` ·
0 backfill · 0 dòng dữ liệu bị đụng.** pgTAP **1061/1061** (trước 1033, **+28**).

Đợt duy nhất của module có migration, và là đợt trả lời **cả ba** câu `NEEDS_CONFIRMATION` còn mở
của `08_ACCEPTANCE_CRITERIA` (câu 1 đã đóng bằng **D-147** — không nối giáo án với bảng điểm).

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 D-144** | **Ba vai trò cấp xứ đoàn đang sửa được giáo án của mọi lớp** | Đây là **mâu thuẫn giữa hai nguồn sự thật**, loại `AGENTS.md` §3 cấm agent tự chọn: `docs/05` cho Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký ô ✅, còn `docs/03` WF-07 chỉ nêu người làm là **Giáo lý viên đại diện lớp**. Mã nguồn Phase 4 theo `docs/05` (`app.can_manage_teaching_plan = can_global_write() or is_class_representative()`). Nay `= is_super_admin() or is_class_representative()`. Quyền **ĐỌC không nhúc nhích** — cả ba vẫn đọc đủ qua `app.can_global_read()`, và pgTAP `043` có bài riêng khẳng định điều đó |
| **Ranh giới của D-144** | Super Admin có còn ghi được không? | **Có** — chủ dự án xác nhận 2026-08-05. D-144 nêu **đích danh ba vai trò**, không nhắc Super Admin, và D-117 đã dựng sẵn khuôn "Super Admin là ngoại lệ duy nhất". 🔴 Lý do vận hành nặng hơn lý do đối xứng: **một lớp chưa phân công Giáo lý viên đại diện thì sau D-144 không còn tài khoản nào lập được giáo án cho lớp đó.** Không giữ Super Admin nghĩa là tình huống ấy chỉ sửa được bằng tay trong cơ sở dữ liệu |
| **D-145** | **Có người GHI được giáo án mà không ĐỌC lại được** | Hệ thống mang **hai định nghĩa "thuộc lớp"**: `app.can_access_class` (thẻ đăng nhập + ngành) và `app.is_class_staff` (thêm sổ phân công đội ngũ). Policy đọc dùng cái thứ nhất, quyền ghi dùng cái thứ hai ⇒ tạo giáo án xong, tải lại trang là **trắng**. Nay hai policy select của `teaching_plans`/`teaching_plan_items` có thêm `or app.is_class_staff(...)`. **Không** sửa `app.can_access_class` (phương án B): hàm đó đỡ policy của 6 module, sửa một chỗ là nới phạm vi đọc của tất cả cùng lúc |
| **Ranh giới của D-145** | Tệp đính kèm có đi theo không? | **Có** — chủ dự án xác nhận 2026-08-05. `docs/05` §6 ghi *"Class staff xem **đầy đủ** giáo án"*, mà tệp là một phần của bài. Nới nội dung mà không nới tệp thì đúng nhóm người ấy **nhìn thấy tên tệp và nút "Tải xuống"** rồi bấm vào bị từ chối — đúng loại "nút hứa một đằng làm một nẻo" mà dự án đã sửa nhiều lần. Nhánh nới đặt trong `app.can_read_teaching_material` và dùng **cùng một hàm** `app.is_class_staff` ⇒ **không thêm một ai** ngoài nhóm D-145 vừa cho đọc |
| **🔴 Nợ #18** | Năm học đã đóng vẫn nhận ghi giáo án | Cùng món nợ M05 vừa trả, nhưng **lời giải ngược lại đợt A của M05**: ở đó ba bảng điểm danh chỉ ghi được qua `security definer` (definer bỏ qua RLS ⇒ điều kiện trong policy là hàng rào giả) nên hàng rào phải nằm trong RPC; ở đây `authenticated` có `insert`/`update`/`delete` **thẳng trên hai bảng**, nên đúng khuôn một dòng của M02-C. Dùng lại `app.writable_academic_year_ids()` ⇒ **D-117 vẫn đứng**. Hàng rào đặt ở **cả sáu policy ghi**, kể cả DELETE — xoá là một lượt ghi, và xoá một mục của năm đã đóng thì không có lượt hoàn tác nào |
| **🔴 D-146 / TB-01** | **Hai người cùng sửa một mục thì người lưu sau xoá sạch công của người lưu trước** | `updateTeachingPlanItem` ghi đè cả 12 trường **chỉ theo `id`**: không cảnh báo, và **không có cách nào lấy lại** vì bảng không có lịch sử (phương án B — bảng `revisions` — đã bị loại). Nay lượt sửa mang theo `expectedUpdatedAt` và câu lệnh là `update … where id = ? and updated_at = ?`, tức một phép so-rồi-đổi nguyên tử. **Không migration**: `updated_at` đã có sẵn trigger từ Phase 4 |
| **🔴 Cái bẫy của D-146** | Phiên bản **không được đi qua `Date` của JavaScript** | `updated_at` là `timestamptz` **micro giây**, còn `Date` chỉ tới **mili giây**. Một vòng `new Date(x).toISOString()` cắt mất ba chữ số cuối ⇒ phép so ở cơ sở dữ liệu **không bao giờ khớp**. Hậu quả không phải mất dữ liệu mà tệ theo kiểu khác: **mọi** lượt lưu đều báo xung đột, hàng rào chống ghi đè biến thành hàng rào chặn chính người đang sửa. Có bài unit canh đúng chỗ đó. Kèm: `z.string().datetime()` mặc định **chỉ nhận hậu tố `Z`**, mà PostgREST trả `+00:00` ⇒ thiếu `offset: true` thì mọi lượt sửa hợp lệ chết ngay ở biên |
| **🔴 "0 dòng" có BA nguyên nhân** | Nói sai nguyên nhân còn tệ hơn im lặng | Một câu *"người khác vừa cập nhật"* dán cho mọi ca sẽ bảo người dùng đi tải lại trang — **vô ích** khi sự thật là năm học đã đóng hoặc mục vừa bị xoá. Nên nhánh 0 dòng đọc lại rồi mới trả lời: không còn dòng ⇒ *"Mục giáo án này đã bị xóa."*; `updated_at` đã khác ⇒ đúng là xung đột phiên bản; `updated_at` **vẫn khớp** ⇒ chính RLS lọc dòng trong im lặng, tức hàng rào năm học hoặc quyền vừa đổi |
| **SW-04** | `updateTeachingPlanTitle` báo thành công khi RLS chặn | Từ đợt này **cả hai** policy ghi của `teaching_plans` có thể lọc dòng im lặng (D-144 siết vai trò, nợ #18 chặn năm đã đóng), nên lượt đổi tên không `.select()` sẽ báo *"Đã đổi tên giáo án."* trong khi không dòng nào đổi. Nay đếm dòng thật |
| **Chốt chặn tầng ứng dụng** | RLS từ chối bằng **0 dòng**, không bằng câu chữ | Ba hàm bọc `requireManage*` nay đọc luôn trạng thái năm học và ném câu tiếng Việt nói rõ *"Năm học của lớp này đã đóng…"*. Hai ngoại lệ cố ý: **Super Admin đi qua** (đúng bằng `app.writable_academic_year_ids()`, nếu không thì tầng này chặn đúng thứ RLS cho phép), và **không đọc được trạng thái thì không chặn** — đoán "đã đóng" từ một ô trống là biến lỗi đọc thành lời từ chối sai |

**🔴 Lỗi thật của đợt này, bắt được bằng CHẠY, và nó lọt qua CẢ BỐN cửa kiểm:**

Thêm đúng một dòng `export const TEACHING_PLAN_CLOSED_YEAR_MESSAGE = "…"` vào `server/actions.ts`
làm **chết cả trang** `/teaching-plan/[classId]`:

```text
A "use server" file can only export async functions, found string.
```

`npm run lint` · `npm run typecheck` · `npm test` · `npm run build` **đều xanh**. Next chỉ dựng danh
sách Server Action **lúc trang được render thật**, nên bằng chứng duy nhất là một lượt E2E — thứ đắt
nhất và chạy sau cùng. Đây là **bản sinh đôi của bẫy `"use client"`** dự án đã trả giá một lần.

⇒ Hằng số chuyển sang `db-errors.ts` (file thuần), **và dựng một cửa chặn mới**:
`tests/unit/use-server-exports.test.ts` quét mọi file `"use server"` trong `src/` và đỏ nếu có export
không phải hàm async. Bài này **tự chứng minh**: nó chạy trên một mẫu đúng bằng dòng đã gây sự cố,
cộng bốn mẫu hợp lệ — một cửa chặn viết xong rồi xanh ngay có thể xanh vì **không bắt được gì**.

**Lỗi thứ hai, cũng chỉ CHẠY mới thấy:** nút *"Tải lại mục này"* bấm xong **không lấy về bản mới** —
thẻ mục vẫn in tên cũ. Vì `router.refresh()` được gọi từ **chính component vừa bị gỡ khỏi cây**
(đóng biểu mẫu là unmount `ItemForm`). Nay việc làm mới do `ItemCard` chạy — nó còn sống suốt.

**Ba quyết định cài đặt cần nhớ:**

1. 🔴 **Cố ý KHÔNG gắn `key` của khối trường vào `updatedAt`.** Nghe thì gọn: phiên bản đổi thì tự
   dựng lại các ô. Nhưng `router.refresh()` chạy sau **mọi** thao tác thành công trên trang — kể cả
   tải tài liệu ở chính thẻ đó, hay đổi tên giáo án ở đầu trang — nên dựng lại theo phiên bản sẽ
   **xoá phần người dùng đang gõ dở ở một mục khác**, đúng loại mất dữ liệu mà TB-M06-01 sinh ra để
   chặn. Nút "Tải lại mục này" là một hành động **người dùng chủ động bấm**, và câu thông báo nói
   thẳng *"Hãy chép lại phần bạn đang gõ"* trước.
2. **Cờ `stale` là cờ riêng của module, không phải `code === "CONFLICT"`.** Mã `CONFLICT` còn dùng
   cho *"Ngày này đã có một mục"* và cho nhánh mặc định của `failure()`. Mời người dùng tải lại
   trang khi lỗi là **trùng ngày** thì tải bao nhiêu lần cũng vẫn hỏng y hệt. Cờ đặt trong kiểu trả
   về của module — **không** thêm mã mới vào `src/lib/errors` dùng chung, tầng ấy `07` §2 để dành
   làm cùng M07.
3. **Hàng rào năm học ở `teaching_plan_items` nằm TRONG `exists (…)` đã có**, không phải một điều
   kiện thứ hai đặt cạnh — bảng này không có cột năm học, nó suy qua giáo án cha.

**🔴 Fixture mà `08_ACCEPTANCE_CRITERIA` TB-09 yêu cầu không dựng được — đã đo, không phải suy luận:**

| Bước | Điều đã xảy ra |
|---|---|
| Viết fixture đúng nguyên văn tài liệu | `role_assignments.class_id = X` + `class_staff_assignments.class_id = Y` cho một **Giáo lý viên** — chết ở bước dựng dữ liệu, hai trigger chặn hai chiều |
| Ca thật còn lại | **Trưởng ngành Ấu làm đại diện một lớp Thiếu** và **Thủ quỹ đứng lớp** — vai trò **không phải vai trò lớp** nên hai trigger đứng ngoài, hai quyển sổ lệch nhau hợp lệ. `043` dựng đúng hai ca này |
| Bẫy thứ hai của chính fixture | BR-A17 đòi **phân công đội ngũ có TRƯỚC vai trò lớp**; viết ngược thứ tự thì `ACTIVE_CLASS_ASSIGNMENT_REQUIRED`. Đã đâm vào và ghi lại ngay trong `043` |

**Hai bài của `013` bị D-144 ĐẢO NGƯỢC — đổi kỳ vọng theo quyết định đã duyệt, không phải nới test
cho qua:** trước M06-B, `013` khẳng định Thư ký *"ghi toàn cục tạo giáo án lớp khác"* và *"sửa được
mục giáo án"*. Nay hai bài ấy khẳng định điều ngược lại, **cộng một bài mới** khẳng định quyền ĐỌC
của Thư ký không nhúc nhích (27 → 28 khẳng định). 🔴 Và hai lượt ghi bị chặn theo **hai cách khác
nhau**, bài test phải theo đúng cách ấy: INSERT vi phạm `with check` nên **ném `42501`**, còn UPDATE
thì `using` **lọc dòng trong im lặng** — 0 dòng, không lỗi. Viết `throws_ok` cho lượt UPDATE là một
bài xanh giả.

**Nghiệm thu 15 mục (`11` §5) cho đợt M06-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **1140 pass / 10 skip** (trước M06-B: 1131/10, **+9**) · build ✓ **28/28 trang** · pgTAP **1061/1061** (trước 1033, **+28**) sau `db:reset` sạch từ DB trống |
| E2E responsive 3 viewport, không tràn ngang | ✅ bộ `teaching-plan` **12/12** trên 360 · 768 · 1366 (trước đợt này 6/6, **+6**: 2 bài mới × 3 viewport). Bài D-144 gọi `expectNoHorizontalOverflow` cho trang giáo án ở chế độ chỉ-đọc — trạng thái mà trước đợt này chưa bài nào dựng |
| Vùng chạm ≥44px | ✅ nút "Tải lại mục này" dùng `Button` mặc định của design system, cùng cỡ với "Lưu thay đổi" bên cạnh |
| Không cỡ chữ < 12px | ✅ không thêm bậc chữ mới |
| Không màu hardcode khi có token | ✅ đợt này không thêm màu nào |
| Không `window.confirm` / `window.alert` | ⚠️ **không thêm chỗ nào; 2 chỗ sẵn có vẫn để lại cho đợt C** (#9) đúng kế hoạch. Vẫn đúng **6 nợ cũ** (M07 bốn · M06 hai) |
| Không `<select>` native mới | ✅ không thêm. Hai ô sẵn có vẫn thuộc #8, **đợt C** |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ **đợt này siết đúng chỗ SW-04 còn hở**: `updateTeachingPlanTitle` và `updateTeachingPlanItem` nay đều `.select()` và đếm dòng. Ba nguyên nhân của "0 dòng" được phân biệt bằng ba câu khác nhau |
| Trạng thái rỗng dùng đúng 1 trong 3 loại | — không áp dụng: đợt này không thêm màn hình nào |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả bằng tên riêng | — **cố ý hoãn sang đợt C** (#9), không đổi so với đợt A |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không thêm lớp nổi. Nút "Tải lại mục này" nằm ngay trong thanh nút của biểu mẫu, đi tới được bằng `Tab` theo đúng thứ tự đọc |
| Không dùng màu làm tín hiệu duy nhất | ✅ thông báo xung đột là `FormMessage tone="danger"` — có `role="alert"` và biểu tượng, không chỉ màu |
| **Nếu siết quyền ⇒ RLS negative bằng JWT thật** | ✅ **1 migration · 1 NỚI (D-145) · 2 SIẾT (D-144, nợ #18)**. pgTAP **`043` — 27 bài, toàn bộ bằng JWT thật của 9 tài khoản**: 3 vai trò cấp xứ đoàn mỗi vai trò một bộ đọc-được/ghi-không (siết hụt một vai trò là để nguyên lỗ hổng mà biên bản tưởng đã bịt) · 1 bài chứng minh Super Admin còn ghi được · 5 bài cho hai ca thật của D-145 kể cả tệp đính kèm · 2 bài **TB-10** chứng minh không nới ngoài spec · 4 bài hàng rào năm học **cộng 2 bài D-117**. `014` (15 bài) và `015` (16 bài) **giữ nguyên từng chữ và vẫn xanh** — bằng chứng D-145 không lấn sang phạm vi khác; `013` đổi đúng **3** khẳng định (2 bị D-144 đảo ngược + 1 thêm mới), 25 bài còn lại không đụng. Tổng của module: 58 → **86** |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md`. **Không đổi `09`/`10`/`11`**; **không đổi** `03`/`04`/`08` của M06. `00_SYSTEM_AUDIT_BOARD.md` **không đổi** — M06 chưa đóng, còn đợt C |

**Kiểm thử đo được của đợt:** unit **1140 / 10 skip** (**+9**) · pgTAP **1061/1061** (**+28**) · lint
**0 warning** · typecheck ✓ · build ✓ **28/28** · bộ `teaching-plan` E2E **12/12** trên ba viewport,
chạy trên **mã cuối cùng** · E2E toàn bộ **406/417** trên DB vừa `db:reset` + `seed:dev` — 11 đỏ =
**2,6 %**, và **0 bài nào thuộc giáo án**.

**🔴 Một phát hiện về chính cách đo, đáng ghi lại hơn con số:** đợt này chạy **hai lượt E2E toàn bộ**
và **bộ bài đỏ KHÁC NHAU** (10 đỏ rồi 11 đỏ, chỉ trùng một phần), trong khi mã nguồn không đổi giữa
hai lượt. Nguyên nhân đã xác định: **một số spec TIÊU THỤ dữ liệu seed**. Bằng chứng trực tiếp —
chạy riêng `staff-directory.spec.ts` trên DB đã dùng một lượt thì bài `D-106` đỏ ngay ở dòng
`expect(target, "seed phải còn ít nhất một hồ sơ chưa từng dùng để xoá").not.toBeNull()`: lượt trước
đã **xoá mất** hồ sơ ấy. Cùng hình dạng ở `academic-year:104` (chờ *"đã có đủ 19 lớp từ trước"*) và
`student-lifecycle` (thêm → trùng → xoá một bản ghi bí tích).

⇒ **Hệ quả cho mọi module còn lại:** con số "E2E toàn bộ" chỉ so sánh được giữa hai lượt **cùng
xuất phát từ `db:reset` + `seed:dev`**. Lượt đo đầu tiên của đợt này (**407/417**) đã bị bỏ vì nó
chạy trên DB đã qua hai lượt `teaching-plan` trước đó, và nó làm **4 bài `staff-directory` đỏ oan** —
đúng cái bẫy mà một người đọc vội sẽ ghi thành "hồi quy của M06-B". Con số dùng chính thức là lượt
sạch: **406/417**.

**11 bài đỏ của lượt sạch — không bài nào thuộc giáo án:** `enrollment-lifecycle` ×3 ·
`student-lifecycle` ×3 · `staff-directory` ×2 · `committees` · `academic-year` · `results`. Đã soát
hai bài theo đúng lời dặn của M05-C (*"đỏ bằng timeout không tự động là nợ #10 — phải mở
`error-context.md` ra đọc"*): `academic-year:104` là **seed-dependent** như trên;
`staff-directory:124` ném *"Trang 2: bấm nhiều lần vẫn không có hiệu lực"* — hình dạng **nợ #10**.
Cả hai ở module đã đóng, đợt này không đụng tới.

#### Đợt M06-C — ✅ XONG (2026-08-05) ⇒ **ĐÓNG MODULE 9 (M06)**

**0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.** pgTAP giữ nguyên **1061/1061** sau
một lượt `db:reset` sạch — và đó chính là bằng chứng ranh giới phân quyền của module không nhúc nhích
ở đợt cuối.

Đợt **giao diện thuần**, đúng hai hạng mục còn lại của `07` §2. Cả nghiệp vụ lẫn cơ sở dữ liệu đã
xong ở A và B.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 #8 · phần chính** | **12 trường đổ thẳng ra giữa trang** | `ItemFields` xếp 12 ô vào một lưới hai cột; trên 360px thành **12 khối dọc liên tiếp**, và khối ấy nằm **trên** toàn bộ danh sách bài — người soạn phải cuộn hết biểu mẫu mới tới được bài đầu tiên. Nay biểu mẫu mở trong `Dialog`, và trang chỉ còn một nút **"Thêm mục giáo án"**. `Dialog` neo đáy màn hình ở mobile (`items-end` + `rounded-t-xl` + `max-h-[90vh]`) và là hộp giữa màn hình từ `sm` — tức **đúng "form drawer" mà `docs/06` §11 đòi, bằng component đã có**, không viết thêm lớp nổi nào |
| **🔴 Vì sao MỘT đường đi cho cả ba viewport** (**D-148**) | Không đo cỡ màn hình bằng JavaScript | Phương án "chỉ mobile mới dùng hộp thoại" nghe hợp lý nhưng đòi `matchMedia` trong `useEffect`: lượt dựng đầu **luôn** ra một biến thể rồi nhảy sang biến thể kia sau hydrate, và mọi bài kiểm phải viết **hai nhánh**. `Dialog` đã responsive sẵn ⇒ một cây DOM, ba cỡ máy, cùng một bộ E2E chạy trên cả ba |
| **#8 · gom nhóm** (**D-149**) | Ba nhóm: bắt buộc · nội dung buổi học · ghi chú nội bộ | Nhóm 1 (Loại mục · Ngày · Tên bài · Người dạy) là `<fieldset>/<legend>` **luôn mở**. Hai nhóm còn lại là `<details>` **gập sẵn** — cùng khuôn `<details>` native của `Dropdown` (D-82) và `batch-row-editor`: mở/đóng được **không cần JavaScript** |
| **🔴 Điều kiện để được phép gập** | Tiêu đề nhóm **đếm số ô đã điền** | Gập một nhóm **đang có nội dung** mà không nói ra là giấu mất đúng thứ người sửa cần soát. Tiêu đề đọc *"Nội dung buổi học · đã điền 4/7"*, và con số ấy đếm theo **thứ đang gõ dở**, không đếm theo dữ liệu đã lưu. Nhóm một ô thì bỏ phân số (*"đã điền"* / *"chưa điền"*) — "1/1" là nhiễu |
| **🔴 Vì sao nhóm 1 KHÔNG được gập** | Ràng buộc kỹ thuật, không phải sở thích | Cả ba ô `required` nằm ở nhóm 1. Trình duyệt **từ chối** lượt gửi kèm một ô `required` đang bị ẩn, bằng lỗi `An invalid form control … is not focusable` — người dùng bấm Lưu và **không có gì xảy ra**, không một câu nào giải thích. Có bài unit **và** bài E2E canh đúng chỗ đó |
| **#8 · hai `<select>` trần cuối cùng** | Loại mục · Người dạy | Đổi sang `Select` của design system. ⚠️ **Ô "Người dạy" mang logic thật:** nó lọc theo ngày đang chọn **và** cố ý giữ lại người đang được chọn dù người ấy không còn phụ trách lớp (M06-A). `Select` bọc một `<select>` native (**D-80**) nên nhánh "giữ lại" đi qua nguyên vẹn — bài unit của M06-A **không phải sửa một chữ** và vẫn xanh, đó là bằng chứng |
| **#8 · hai ô có ranh giới riêng tư** | Ô nào ra cổng phụ huynh, ô nào không | `06_UI_UX` §4 chỉ nêu ô **Ghi chú nội bộ** cần chỉ dấu rõ hơn. Nhưng đọc `getWeekAheadTeaching` thì ô đi ra ngoài là **"Chuẩn bị"** — nó in nguyên văn ở thẻ *"7 ngày sắp tới"* của cổng phụ huynh. Nói ra **cả hai chiều**: "Chuẩn bị" ghi *"Phụ huynh và thiếu nhi đọc được ô này"*, "Ghi chú nội bộ" ghi *"Không ra cổng phụ huynh"*. Nói một chiều thì người soạn vẫn không biết mình đang viết cho ai |
| **#8 · bộ đếm ký tự** | `maxLength` cắt input trong **im lặng tuyệt đối** | `06_UI_UX` §4 xếp mức "Thấp", nhưng đây là đợt cuối của module — không làm bây giờ là không bao giờ. Bộ đếm chỉ hiện khi còn **≤200 ký tự**; hiện suốt thì 12 ô mang 12 con số nhiễu. 🔴 **Con số đếm ngược CỐ Ý không phải vùng thông báo sống** (`<p>` thường gắn bằng `aria-describedby`): nó đổi theo **từng phím gõ**, nên `role="status"` ở đây là bắt trình đọc màn hình đọc lại một con số sau mỗi ký tự. Lúc **đã chạm trần** thì ngược lại — đó là trạng thái xảy ra một lần rồi mọi phím gõ bị nuốt im lặng, nên câu ấy là `FormMessage tone="danger"` (`role="alert"`) và vì nội dung không đổi nữa nên nó không lặp |
| **🔴 #9 / nợ #1** | **Hai chỗ `window.confirm` cuối cùng của module** | `ConfirmDialog` cho **xoá mục** và **gỡ tệp**. Nợ #1 còn **4** chỗ, tất cả ở M07 |
| **🔴 Điều `window.confirm` cũ GIẤU MẤT** | *"Xóa “{tên}” khỏi giáo án?"* im lặng về tệp đính kèm | `deleteTeachingPlanItem` **xoá luôn object trong Storage** — E2E đã canh điều đó từ Phase 4. Câu cũ không nhắc một chữ. Nay hậu quả nêu đủ: tên mục · loại · ngày · tên lớp · **tên tệp sẽ mất theo** · và *"giáo án không lưu lịch sử nên không hoàn tác được"*. Hộp gỡ tệp nói thêm điều người dùng hay đoán sai: tệp bị **xoá khỏi kho**, không chỉ gỡ liên kết |

**🔴 Một lỗ D-61 có thật, lộ ra vì đợt này phải đọc lại đường đóng biểu mẫu:**

`ItemForm` cũ đặt `message` thành công rồi gọi ngay `onDone()` — mà `onDone` gỡ **chính component
đang giữ `message`** khỏi cây. Nghĩa là **sửa một mục giáo án xong không có một chữ xác nhận nào**:
biểu mẫu đóng lại, thẻ mục hiện tên mới, hết. Cùng hình dạng với lỗi M05-B (*"đơn cuối cùng biến mất
mà không gì xác nhận"*): thứ vừa xác nhận bị chính lượt đóng nó xoá mất.

⇒ Câu thành công nay do **`ItemCard`** giữ — nó còn sống suốt, đúng cùng lý lẽ đã dựng nút *"Tải lại
mục này"* ở M06-B. Và **hộp thoại THÊM thì ngược lại: cố ý không tự đóng**, vì soạn giáo án là việc
thêm nhiều mục liên tiếp, còn đóng ngay thì lại xoá mất chính câu *"Đã thêm mục giáo án."*.

**Hai thứ của đợt B đợt C phải không được làm hỏng — đã kiểm bằng bài chạy, không bằng mắt:**

| Thứ phải giữ | Bằng chứng |
|---|---|
| Nút *"Tải lại mục này"* do **`ItemCard`** làm mới, không phải `ItemForm` | E2E `D-146 · TB-01` xanh trên cả ba viewport **không sửa một dòng nào** — biểu mẫu chuyển vào hộp thoại nhưng hộp thoại nằm trong cây của `ItemCard`, nên `onReload` vẫn do component còn sống chạy |
| `expectedUpdatedAt` gửi **nguyên văn**, không qua `Date` | Bài unit canh micro giây giữ nguyên và vẫn xanh |
| **Không** gắn `key` khối trường vào `updatedAt` | Giữ nguyên. `router.refresh()` vẫn chạy sau mọi thao tác thành công |

**🔴 Ba điều về môi trường kiểm thử, đáng ghi lại hơn con số:**

1. **jsdom KHÔNG cài hành vi kích hoạt của `<details>`.** Bấm `<summary>` trong unit test **không mở
   gì cả**, nên một bài "gõ vào ô trong nhóm gập" sẽ gõ vào một ô đang ẩn và **vẫn xanh** — xanh vì
   jsdom cũng không thi hành việc ẩn. Bài unit vì vậy đặt thẳng `details.open = true` và **nói rõ
   trong chú thích rằng đường bấm thật do E2E phủ**. Bài E2E khẳng định đúng phần jsdom không làm
   được: `textarea[name="objectives"]` phải `toBeHidden()` khi nhóm còn gập.
2. **`getByText("Ghi chú nội bộ")` khớp BA chỗ** — tiêu đề nhóm, nhãn của chính ô nhập bên trong, và
   một dòng của thẻ mục ở chế độ đọc. Bài test phải tìm thẳng trong các `<summary>`.
3. **Nhãn nút phải phân biệt được với nhãn nút xác nhận.** Nút thẻ là "Xóa" / "Gỡ tệp", nút trong hộp
   thoại là "Xóa mục này" / "Gỡ tài liệu này". Trùng tên là bộ định vị Playwright khớp hai phần tử.

**Nghiệm thu 15 mục (`11` §5) cho đợt M06-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ lint ✓ **0 warning** · typecheck ✓ · unit **1151 pass / 10 skip** (trước M06-C: 1140/10, **+11**) · build ✓ **28/28 trang** · pgTAP **1061/1061** (**+0**) sau `db:reset` sạch từ DB trống |
| E2E responsive 3 viewport, không tràn ngang | ✅ bộ `teaching-plan` **15/15** trên 360 · 768 · 1366 (trước đợt này 12/12, **+3**: 1 bài mới × 3 viewport). Bài mới đo `expectNoHorizontalOverflow` **hai lần khi hộp thoại đang mở** — lúc nhóm còn gập và lúc đã bung 7 ô; đây là trạng thái mà trước đợt này chưa bài nào dựng, và cũng là trạng thái duy nhất có một lớp nổi cao 90 % màn hình trên 360px |
| Vùng chạm ≥44px | ✅ `<summary>` của nhóm gập đo bằng `boundingBox()` trên **cả ba viewport** — `min-h-control` (44px). Nút trong hộp thoại dùng `Button` của design system |
| Không cỡ chữ < 12px | ✅ dòng chỉ dấu riêng tư dùng `text-2xs` = **12px**, đúng sàn cứng của `09` §2. Không thêm bậc mới |
| Không màu hardcode khi có token | ✅ hai chuỗi class chép tay của bản cũ (`selectClassName`, `textareaClassName`) **bị xoá hẳn** — ô chọn và ô nhiều dòng nay dùng `Select`/`Textarea`, tức cùng `inputBaseClassName` với `Input` |
| Không `window.confirm` / `window.alert` | ✅ **hai chỗ cuối của M06 đã trả** (#9). `grep -rn "window.confirm\|window.alert" src/` còn **4**, tất cả ở `gradebook-editor.tsx` (M07). Hai `eslint-disable-next-line no-restricted-syntax` đi theo |
| Không `<select>` native mới | ✅ **và trả luôn hai chỗ cũ**: `Loại mục` · `Người dạy` → `Select`. ⚠️ `grep "<select"` trong `src/features/teaching-plans/` vẫn ra **2 kết quả** — cả hai nằm trong **lời chú thích** kể lại cái bẫy "`<select>` mất giá trị đang giữ" của M06-A, không phải thẻ thật. Đúng cái bẫy đếm mà nợ #14 đã dặn: **phải mở file xem, không đếm bằng số dòng grep** |
| Thao tác ghi có phản hồi (D-61) + đếm dòng (SW-04) | ✅ **đợt này vá đúng chỗ D-61 còn hở**: lượt **sửa** mục nay có câu *"Đã cập nhật mục giáo án."* sống sót qua lượt đóng hộp thoại; lượt **gỡ tệp** có câu riêng thay vì chỉ im lặng đổi màn hình. Phần đếm dòng không đụng (đã xong ở B) |
| Trạng thái rỗng dùng đúng 1 trong 3 loại | — không áp dụng: đợt này không thêm màn hình nào |
| Thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả bằng tên riêng | ✅ **cả hai chỗ**, nêu tên mục · tên lớp · tên tệp. Bài unit đọc **từng tên riêng** trong hộp thoại, không đọc "có hộp thoại hay không" |
| Thao tác nhạy cảm ghi nhật ký (D-65) | — không áp dụng: đợt này không đụng tài khoản/vai trò |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ `Dialog` dùng `useModalBehavior` (bẫy focus · trả focus · khoá cuộn · `Escape`) — cùng hook với drawer điều hướng của mục 0.7. E2E **bấm `Escape` thật** và khẳng định hộp thoại biến mất |
| Không dùng màu làm tín hiệu duy nhất | ✅ nhóm gập nói trạng thái bằng **chữ** (*"đã điền 4/7"* / *"chưa điền"*) cộng tam giác mở/đóng của `<details>`; câu "đã chạm trần" là `FormMessage tone="danger"` — có biểu tượng và `role="alert"`, không chỉ màu |
| **Nếu siết quyền ⇒ RLS negative bằng JWT thật** | — **không áp dụng: 0 thay đổi phân quyền.** pgTAP **1061/1061 không đổi một bài nào** là bằng chứng dương cho điều đó |
| Cập nhật tài liệu + implementation log | ✅ file này + `WORKLOG.md` + `00_SYSTEM_AUDIT_BOARD.md` (M06 đóng). **Không đổi `09`/`10`/`11`**; **không đổi** `03`/`04`/`06`/`07`/`08` của M06 |

**Kiểm thử đo được của đợt:** unit **1151 / 10 skip** (**+11**) · pgTAP **1061/1061** (**+0**) · lint
**0 warning** · typecheck ✓ · build ✓ **28/28** · bộ `teaching-plan` E2E **15/15** trên ba viewport,
chạy trên **mã cuối cùng** · E2E toàn bộ **412/420** trên DB vừa `db:reset` + `seed:dev` — 8 đỏ =
**1,9 %** (M06-B: 11 đỏ / 417), và **0 bài nào thuộc giáo án**.

**8 bài đỏ — không bài nào thuộc giáo án, và không bài nào ở module đang làm:** `staff-directory` ×3
(D-108 đỏ ở **hai** viewport, `:124` một) · `imports` ×2 · `results` · `students-directory` ·
`class-settings`. Cả bốn spec này nằm trong nhóm **tiêu thụ dữ liệu seed** mà M06-B đã khoanh vùng,
và đó cũng là lý do lượt đo này phải xuất phát từ một `db:reset` sạch.

🔴 **Một lưu ý về chính lượt đo, nối tiếp phát hiện của M06-B:** đợt này cũng chạy hai lượt E2E toàn
bộ, và **lượt đầu bị bỏ** — không phải vì DB bẩn mà vì **mã nguồn đã đổi sau khi lượt ấy bắt đầu**
(một chỉnh sửa trợ năng ở bộ đếm ký tự). Một con số đo trên bản build cũ mà ghi vào cột "mã cuối
cùng" là một con số **đúng về hình thức và sai về ý nghĩa**. Lượt dùng chính thức chạy sau khi mọi
thay đổi đã đóng, trên `db:reset` + `seed:dev` sạch.

**⏸️ Một việc của `docs/06` §11 CỐ Ý không làm: "row inline edit trên desktop".** `11` §3 xếp M06 cỡ
UI **S · Tinh chỉnh**, và bảng đợt của module này (`16` §2) chỉ liệt kê *"gom lại biểu mẫu 12 trường
+ drawer trên điện thoại"*. Đổi thẻ mục thành hàng bảng sửa tại chỗ là **redesign**, không phải tinh
chỉnh. Chủ dự án đã chọn phương án hộp thoại cho **cả** hai cỡ máy (D-148), nên đây không phải một
món nợ bỏ quên mà là một nhánh đã cân nhắc và loại.

---

### Module 10 — M07 Bảng điểm · chia ba đợt · ✅ **ĐÓNG 2026-08-06**

`03_AUDIT_RESULTS` chấm module **58/75**, trạng thái `NEEDS_IMPROVEMENT`: **5/18 luồng dưới chuẩn**,
**không có `CRITICAL`** — toàn bộ kiểm tra phân quyền/rò rỉ dữ liệu đều đạt và có test xanh. Đây là
module **đông người dùng nhất còn lại**: mọi Giáo lý viên đều nhập điểm, và ba module chưa làm
(M08 · M11 · M13) đều **tiêu thụ số trung bình** của nó.

`07_IMPLEMENTATION_IMPACT` §1 ước lượng **14–20 ngày-người** nếu làm toàn bộ, và §7 vẽ hẳn đồ thị
phụ thuộc. Bảng dưới đi **đúng** thứ tự đó, không tự sắp lại.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M07-A** | Nhóm **rủi ro rất thấp, 0 migration** của `07` §7 luật 1 — hạng mục **1** (làm sạch mọi ô xuất bảng tính, `07` gọi là *"vấn đề an toàn dữ liệu, nên làm trước nhất"*) · **2** (hệ số mặc định đọc từ cấu hình năm học) · **4** (thống nhất "Trung bình" ở cổng phụ huynh) — cộng **9b** *"chỉ gửi ô đã đổi"*, thứ `07` §7 luật 2 gọi là **điều kiện tiên quyết** cho ba hạng mục sau. Kèm câu lỗi tiếng Việt cho `ZodError`, **SW-04**, **nợ #14**, **nợ #20** và phần *"chờ cứng 5 giây"* của **nợ #10** | ✅ **XONG 2026-08-05** |
| **M07-B** | **CÓ MIGRATION.** **D-74** siết quyền khóa bảng điểm về Giáo lý viên đại diện + Giáo lý viên lớp (**D-151** cho Super Admin làm đường thoát) · TB-M07-01 xóa/ẩn cột điểm · TB-M07-03 bước 6 (cờ "chỉnh tay" chỉ bật khi giá trị **khác** đề xuất) · TB-M07-04 chỉ báo dòng bị bỏ qua · TB-M07-05 nhận xét an toàn mặc định (**D-152**) · **nợ #18** hàng rào năm học đã đóng cho 4 bảng của module. Kèm **D-153** — thay đổi dữ liệu **duy nhất** của cả module | ✅ **XONG 2026-08-05** |
| **M07-C** | **CÓ MIGRATION** (thứ hai của module — xem đính chính ngay dưới). TB-M07-02 tách "công bố" khỏi "khóa" (`07` §7 luật 4 — **làm cuối**, **D-154**) · TB-M07-06 vòng đời Top 5 (**D-155**, chủ dự án chọn **phương án B**) · **4 `window.confirm` cuối cùng của toàn hệ thống** (**nợ #1 ĐÓNG HẲN**) · **nợ #21** đường hiện lại cột đã ẩn (M07-B mở ra) | ✅ **XONG 2026-08-06** |

> ⚠️ **Đính chính bảng đợt B.** Bảng trên và phần tóm tắt của M07-B ghi rằng B là *"đợt duy nhất có
> migration của module"*. Câu ấy **sai**: `07_IMPLEMENTATION_IMPACT` §1 xếp hạng mục **8**
> (TB-M07-02) và **10** (TB-M07-06) đều **có migration**, và luật thứ tự §7 đẩy cả hai xuống đợt C.
> Câu **vẫn đúng** là: migration của M07-B là migration **duy nhất của cả Giai đoạn 2B có đụng dữ
> liệu** (D-153) — `20260806000100` không đụng một dòng nào.

> **🔴 Hạng mục 9a (khoá lạc quan đầy đủ) CỐ Ý chưa xếp vào đợt nào.** `07` §7 luật 3 viết thẳng:
> *"chỉ làm nếu 9b chưa đủ — đo bằng thực tế sử dụng, đừng làm trước"*. Nó đổi **kiểu trả về** của
> `save_assessment_scores` nên bắt buộc `drop function` + `create` và sinh lại `src/types/database.ts`.
> M07-A vừa cài 9b, thứ đã loại bỏ ca thường gặp (**hai người sửa hai ô khác nhau**); phần còn lại
> chỉ là ca **đúng cùng một ô**.

#### Đợt M07-A — ✅ XONG (2026-08-05)

**0 migration · 0 thay đổi phân quyền ở cơ sở dữ liệu · 0 dòng dữ liệu bị đụng.**
pgTAP giữ nguyên **1061/1061** sau một lượt `db:reset` sạch — và đó chính là bằng chứng ranh giới
phân quyền của module không nhúc nhích.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 #1 / TB-M07-08 / S-10 / AC-08-01 · AC-08-02** | **Kiểm soát chống công thức lạ trong file Excel đang được áp dụng NỬA VỜI — và nửa vời tệ hơn không có** | `buildGradebookExportData` bọc `safeSpreadsheetText` cho **tên thánh và họ tên**, nhưng **không** bọc tiêu đề cột điểm — một ô văn bản tự do 120 ký tự do chính Giáo lý viên đặt. Đặt tên cột là `=1+1` là hợp lệ và không có gì chặn. 5-Whys của biên bản audit truy ra nguyên nhân gốc: lúc viết, *"dữ liệu do người dùng nhập"* được hiểu là dữ liệu **đến từ file import**, còn thứ do nhân sự tự gõ thì "nội bộ, tin được". Rủi ro với `.xlsx` thấp (ExcelJS ghi ô chuỗi), nhưng `AGENTS` §5 xếp đây vào **kiểm soát bắt buộc**, và tệp bảng điểm **đi ra ngoài hệ thống** — người nhận thường *"Save as CSV"*, lúc đó khai thác được thật |
| **🔴 Bài kiểm cũ LÀ MỘT PHẦN của lỗi, không chỉ bỏ sót nó** | Bảng kiểm ghi ✅ trong khi lỗ hổng đang mở | 5-Whys dừng ở bước 5 với đúng câu này: *"test viết theo hàm chứ không theo bề mặt tấn công"*. `gradebook-export.test.ts` gọi `safeSpreadsheetText` **tách rời** rồi đếm `headers).toHaveLength(5)` — nên nó xanh vĩnh viễn bất kể hàm dựng bảng có gọi bộ lọc hay không, và **S-10 được ghi là đạt**. Bài mới **quét mọi ô văn bản** mà hàm dựng ra: thêm một ô mới về sau mà quên làm sạch thì bài đỏ, không cần ai nhớ bổ sung ca kiểm |
| **Chi tiết cách bọc — lệch có chủ ý so với `04_TO_BE_FLOWS`** | Bọc **cả ô**, không bọc riêng biến | Tài liệu viết *"bọc `detail.className`"*. Làm đúng y hệt sẽ ra `BẢNG ĐIỂM '=cmd` — một dấu nháy đơn nằm **giữa** chuỗi, tức **không vô hiệu hoá gì cả**: dấu nháy chỉ có tác dụng khi đứng ở **đầu ô**. Nên hàm bọc chuỗi cuối cùng được ghi vào ô, đúng chữ của **BR-M07-36** (*"mọi ô bảng tính…"*). Ô A1 vốn luôn mở đầu bằng tiền tố cố định `"BẢNG ĐIỂM "` nên dấu nháy không xuất hiện — điều phải đúng là **đầu ô an toàn**, và bài kiểm khẳng định đúng điều đó |
| **#1 bước 3** | Route xuất tự viết lại `asciiFilename` / `excelResponse` / `pdfResponse` | Biên bản audit F18 xếp vào phần trừ điểm C10 (*"trùng lặp logic, dễ lệch nhau khi sửa"*) — và **hai bản đã lệch nhau sẵn**: bản cục bộ dùng dải `[̀-ͯ]`, bản chung dùng `\p{Diacritic}`. Bản chung còn có một lưới an toàn bản cục bộ không có: bảng PDF **không dòng nào** (lớp chưa có thiếu nhi) được chèn một dòng `—` thay vì đẩy pdfmake vào bảng rỗng. 🔴 Gộp về bản chung **không được làm hỏng bố cục**: bảng điểm dùng bề rộng `"*"` cho cột điểm và cỡ chữ 7, trong khi mặc định của bản chung là `"auto"` + cỡ 8 — với lớp 8–10 cột và tiêu đề dài, `"auto"` co theo nội dung nên tổng bề ngang **vượt khổ giấy** và pdfmake cắt cụt trong im lặng. Thêm tham số `PdfTableLayout` **có giá trị mặc định** ⇒ hai nơi gọi cũ (`reports`) không đổi một chữ |
| **🔴 9b / TB-M07-01 bước 5 · TB-M07-03 phương án B** | **Bấm "Lưu điểm" một lần là ghi CẢ ROSTER kể cả ô trống** — gốc rễ của **ba** lỗi khác nhau | `ScoreColumnForm` gửi `detail.students.map(...)` không lọc, và RPC upsert **mọi** phần tử. Hệ quả dây chuyền: (1) **F04 (50/75)** — cột nào cũng lập tức có 50 dòng `assessment_scores`, mà khoá ngoại là `on delete restrict` ⇒ **một cột tạo nhầm không bao giờ xóa được nữa**, và câu lỗi người dùng đọc được là *"Cột đã có điểm"* trong khi họ **chưa nhập điểm nào**; (2) **F06 (57/75)** — hai Giáo lý viên cùng mở một cột thì người lưu sau ghi đè **toàn bộ** snapshot cũ, điểm người trước thành `null` **không một lời cảnh báo và không có cách lấy lại**; (3) **F07 (62/75) bị vô hiệu** — RPC đặt `is_manual_override = true` cho **mọi** phần tử nhận được, nên một cú "Lưu điểm" biến **cả 50 em** thành "đang chỉnh tay" và cơ chế đề xuất chuyên cần tự động không bao giờ cập nhật được nữa. Nay chỉ ô có giá trị **khác giá trị đang lưu** mới được gửi |
| **Cái bẫy của 9b** | So chuỗi thì `"9.0"` khác `"9"` | Cơ sở dữ liệu trả `numeric(4,2)`; người dùng gõ lại `9.0` vào ô đang là `9` là **không đổi gì**. So chuỗi ⇒ ô ấy vẫn bị gửi lên, và với cột chuyên cần thì nó bị đóng dấu *"chỉnh tay"* **oan** — đúng cái lỗi đang đi chữa. Phép so làm trên `number \| null` sau khi chuẩn hoá, có bài unit riêng. Ô **rỗng** và điểm **0** vẫn là hai thứ khác nhau ở cả hai chiều (`AGENTS` §8) |
| **Cái bẫy thứ hai của 9b, và nó KHÔNG hiển nhiên** | Ô ghi chú là ô **không kiểm soát** và **không có `key`** | Ô điểm đã có `key` theo giá trị đang lưu từ trước nên nó remount sau mỗi lượt làm mới; ô ghi chú thì không. Trước đợt này hậu quả chỉ là *"ghi chú người khác vừa sửa không hiện lên"* — khó chịu nhưng vô hại, vì lượt lưu ghi đè cả roster. **Từ khi phép so đọc chính ô ấy thì nó thành lỗi mất dữ liệu:** một giá trị cũ kẹt trong DOM sẽ bị tính là *"đã đổi"* và ghi đè đúng thứ vừa được cập nhật. Đã thêm `key` cùng khuôn với ô điểm |
| **#2 / TB-M07-09 / AC-09-01** | **Bảng cấu hình hệ số mặc định có thật, có màn hình, có policy từ Phase 5 — mà biểu mẫu tạo cột không đọc nó** | `DEFAULT_WEIGHTS` nằm cứng trong `gradebook-editor.tsx`, nên Quản trị viên hệ thống đổi hệ số mặc định của năm học thì giao diện **không đổi một chữ**. Giáo lý viên tin con số hiện sẵn ⇒ hệ số sai đi thẳng vào phép tính trung bình. Nay `getGradebookDetail` trả `defaultWeights` đọc từ `assessment_type_settings` của **đúng năm học của lớp**, chỉ lấy loại đang bật. Hằng số cũ giữ lại làm **lưới an toàn** khi một loại bị tắt — chặn tạo cột thuộc loại đã tắt là một thay đổi nghiệp vụ, **không thuộc phạm vi đợt này** |
| **🔴 #4 / TB-M07-07 / AC-07-01 · D-150** | **Cổng phụ huynh và bảng điểm nội bộ nói hai con số trung bình khác nhau, không chỗ nào giải thích** | Cổng tính trong TypeScript chỉ trên cột **đã công bố**; bảng điểm nội bộ dùng `v_student_weighted_average` trên **mọi** cột `is_active`. Phụ huynh đối chiếu ra hai số rồi chất vấn Giáo lý viên (F17 = 64/75). Đợt này **không đổi phép tính** — đổi phép tính là đổi kỳ vọng của người đang dùng — chỉ nói ra mẫu số: *"TB 8.40 · tính trên 2/3 cột đã công bố."* |
| **🔴 Và đây là chỗ hai tiêu chí ĐÃ DUYỆT mâu thuẫn nhau** | AC-07-01 đòi *"3/**5** cột"*, AC-02-03 cấm để lộ *"dấu vết cột tồn tại"* | Con số **5** là **tổng số cột của lớp**, tức nó nói cho phụ huynh biết lớp còn 2 cột chưa công bố. Mà `assessments_select_scope` chỉ cho phụ huynh thấy dòng `is_published`, nên muốn có con số ấy phải **mở thêm một cửa đọc mới** — đúng điều `07_IMPLEMENTATION_IMPACT` §4 cấm tuyệt đối (*"không hạng mục nào được nới policy đọc của cổng phụ huynh"*). Ba câu không thể cùng đúng. Đây là loại mâu thuẫn `AGENTS` §3 cấm agent tự chọn ⇒ **hỏi chủ dự án**. Chốt (**D-150**): **cả hai con số lấy từ phần đã công bố** — mẫu số là số cột em ấy có điểm, tổng là số cột lớp đã công bố (phụ huynh vốn đã nhìn thấy đủ chúng trong bảng ngay bên dưới). Có bài unit canh riêng rằng chuỗi `"/5"` **không tồn tại** trong trang |
| **Câu lỗi tiếng Việt cho `ZodError`** | Một câu duy nhất cho **sáu** luồng | `failure()` chỉ giữ `message` khi lỗi là `AppError`, nên mọi lỗi validation của F02 · F03 · F06 · F09 · F13 · F15 rơi vào *"Không thể lưu bảng điểm. Vui lòng thử lại."* — một câu **hứa rằng thử lại sẽ được**, trong khi bấm lại thì hỏng y hệt và người dùng không có cách nào biết ô nào sai. Câu đúng đã nằm sẵn trong `schemas.ts` từ Phase 5 (*"Điểm chuyên cần phải chọn Thánh lễ hoặc Giáo lý."*, *"Hệ số phải lớn hơn 0."*) và chưa từng hiện ra lần nào |
| **🔴 Và cách nhận ra câu tự viết phải KHÁC khuôn M06** | Kiểm `code === "custom"` sẽ bỏ sót đúng những câu đáng giá nhất | Ở `teaching-plans` mọi câu tự viết đi qua `ctx.addIssue({ code: "custom" })`. Ở module này phần lớn lại nằm ở **tham số thứ hai** của `.min(1, "…")` / `.positive("…")`, mà zod giữ nguyên `code: "too_small"`. Dấu hiệu dùng ở đây: **câu tự viết là tiếng Việt có dấu**, câu zod sinh ra là tiếng Anh thuần ASCII. Ai đó viết câu tự đặt bằng ASCII thuần thì hàm rơi về câu dựng theo nhãn trường — vẫn tiếng Việt, vẫn đúng, chỉ kém cụ thể hơn. Nhãn lấy từ đoạn **cuối** đường dẫn chứ không phải đoạn đầu: một ô sai nằm ở `scores[7].score`, lấy đoạn đầu ra *"Bảng điểm không đúng định dạng"* — đúng mà vô dụng |
| **🔴 SW-04** | **Khóa bảng điểm rồi bấm "Lưu" vẫn báo "Đã cập nhật cột điểm."** | Cả bốn policy ghi mang điều kiện `not app.is_gradebook_locked(...)` ngay trong mệnh đề `using`, mà `using` **lọc dòng trước khi trigger chạy** — nên một lượt UPDATE lên bảng điểm vừa bị người khác khóa **không ném `GRADEBOOK_LOCKED`**, nó chỉ đơn giản đổi **0 dòng**. Giao diện có khoá nút theo `detail.isLocked`, nhưng ai đang mở sẵn trang lúc người khác bấm khóa sẽ nhận một lời báo thành công **sai**. Năm thao tác (`updateAssessment` · `setAssessmentPublished` · `deleteAssessment` · `deleteStudentComment` · `unpublishLeaderboard`) nay đều `.select()` và đếm dòng |
| **Nợ #14 / D-96** | Guard nấp trong **ba** hàm bọc | Grep `requireAuthContext` ở tầng action chỉ thấy **5** trong **15** thao tác — đúng cái bẫy M12-A đã dặn (*"đọc cả hàm bọc, đừng chỉ grep tên hàm"*). Nay `assessmentsRouteContext()` gọi `requireRouteAccess` **ngoài `try`**. Còn **5 module**: `theme` · `absence-requests` · `promotions` · `reports` · `notifications` |
| **Nợ #20** | **Chỗ CUỐI CÙNG** của món nợ vùng chạm 44px | Link *"← Danh sách lớp"* ở `/results/[classId]` cao **18px**. Bài E2E đo bằng `boundingBox()` — **chiều cao thật đã dựng**, không kiểm tên lớp CSS, vì một chuỗi `min-h-11` viết đúng vẫn có thể bị lớp khác đè và bài kiểm tên lớp sẽ **xanh giả** |
| **Nợ #10 (phần "chờ cứng")** | Trả đúng chỗ bảng nợ đã hẹn | 9 khẳng định *"hiện sau khi làm mới"* của `results.spec.ts` nay dùng `expectSoon` (20 giây, cùng mốc `committees.spec.ts` dùng từ M09-C) thay ngưỡng mặc định 5 giây. **Đây là che triệu chứng, không phải chữa** — xem phần đo bên dưới |

**Bằng chứng mới cho nợ #10, và nó chắc hơn mọi lượt trước.** Đợt này bắt được **hai** lượt rớt và
cả hai đều đo được **cả hai đầu**:

- Lượt 1 — rớt ở dòng *"thẻ Top 5 vừa tạo"*: `psql` cho thấy **cả hai bản ghi đã nằm trong bảng
  `leaderboards`**, câu *"Đã tạo bảng Top 5"* **đã hiện**, mà nút thì vẫn kẹt ở
  **"Đang tạo…" `[disabled]`**.
- Lượt 2 — rớt ở dòng *"Đã công bố"*: bảng Top 5 trong cơ sở dữ liệu **đã `is_published = true` với
  đủ 5 vị trí**, câu *"Đã công bố 5 vị trí."* **đã hiện**, mà hai nút vẫn `[disabled]` và nhãn vẫn
  là *"Bản nháp"*.

⇒ Ghi vào được, **câu trả lời không về** — đúng kết luận M03-C đã đo, **không phải lỗi của mã ứng
dụng**. Và đúng dấu hiệu phân biệt mà M05-C dặn: *nợ #10 để lại nút còn nguyên chữ "Đang lưu…" ở
trạng thái vô hiệu; lỗi thật để lại một màn hình đã đổi xong mà thiếu đúng thứ bài test đang chờ.*
Bài đỏ **đổi viewport giữa các lượt** (laptop-1366 → mobile-360 + tablet-768 → tablet-768).

🔴 **Một số đo phụ, đáng ghi vì nó định lượng lời cảnh báo của M02-C về dữ liệu bẩn:** cùng một bộ
`results.spec.ts`, cùng một bản build — chạy trên DB đã tích tụ dữ liệu của 3 lượt trước mất
**4,5 phút**, chạy ngay sau `db:reset` + `seed:dev` mất **60 giây**. Spec này **cộng thêm 2 cột
điểm vào lớp mỗi lượt chạy**, và trang bảng điểm dựng mỗi cột thành hai bản (máy tính + điện
thoại). Con số E2E của module này **chỉ có nghĩa khi đi kèm câu "chạy trên DB vừa reset + seed"**.

**Số kiểm thử thật của đợt A:**

| | |
|---|---|
| `npm test` | **1185 pass / 10 skip** (trước 1151/10 ⇒ **+34**), 91 file pass / 3 skip |
| `npm run test:db` | **1061/1061**, 43 file — **+0**, đúng như một đợt 0-migration phải ra |
| `npm run lint` | **0 warning 0 error** |
| `npm run typecheck` | ✓ |
| `npm run build` | ✓ **28/28 trang** |
| `npm run test:e2e` (toàn bộ) | **414/420** trên DB vừa `db:reset` + `seed:dev` — 6 đỏ = **1,4 %** (M06-C: 8 đỏ/420 = **1,9 %**). **`results.spec.ts` xanh cả ba viewport**; 6 bài đỏ nằm ở `authenticated-shell` · `committees` · `staff-directory` ×2 · `class-settings` · `students-directory`, **tất cả đều là chỗ nợ #10/#15 đã ghi tên từ các đợt trước** |
| `results.spec.ts` chạy riêng | **2/3** ở hai lượt trước khi nới ngưỡng chờ — xem phần bằng chứng nợ #10 ngay trên |

**⏸️ Ba việc CỐ Ý chưa làm ở đợt A, kèm lý do:**
1. **Tầng `fieldErrors` dùng chung ở `src/lib/errors`** — M06-A hoãn sang M07 vì `07` §2 của **M06**
   khuyên vậy. Nhưng `07_IMPLEMENTATION_IMPACT` của **chính M07 không liệt kê hạng mục ấy**, và
   `src/lib/errors` đỡ **cả 14 module**: sửa nó là mở rộng phạm vi ra ngoài đợt đã chốt
   (`AGENTS` §4). Đợt này đóng phần nằm gọn trong module, **không đụng một dòng nào** của tầng chung.
2. **Chặn tạo cột thuộc loại đã tắt** (`assessment_type_settings.is_active = false`) — là một thay
   đổi nghiệp vụ, không nằm trong TB-M07-09.
3. **Hạng mục 9a** — xem ghi chú ở bảng đợt.

#### Đợt M07-B — ✅ XONG (2026-08-05)

**1 migration (`20260805000200`) · 4 thay đổi phân quyền (3 SIẾT + 1 làm rõ) · 0 `alter table` ·
0 backfill cấu trúc · 1 lượt cập nhật dữ liệu (D-153).**
Đây là đợt **duy nhất có migration** của module bảng điểm, và là **thay đổi dữ liệu duy nhất** của
cả module — mọi đợt khác đều 0 dòng bị đụng.

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 D-74 + D-151 / TB-M07-10 / AC-10-01** | **Ba tầng nói ba điều khác nhau về "ai khóa được bảng điểm"** | `08_ACCEPTANCE_CRITERIA` §5 gọi thẳng đây là *"mâu thuẫn chưa giải quyết"* và **không viết tiêu chí nghiệm thu** cho tới khi chủ dự án chốt: `docs/05` §5 ghi *"chỉ Giáo lý viên đại diện"* · RPC `lock_gradebook` cho cả `can_global_write` (thêm Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký) · `canLock` ở `queries.ts` liệt kê tay **năm** vai trò và **không kiểm lớp** — nên một Giáo lý viên đại diện của lớp A **nhìn thấy nút "Khóa bảng điểm" trên lớp B**. Nay cả ba trỏ về **một cái tên**: `app.can_lock_gradebook`. Phạm vi chốt: **đại diện + Giáo lý viên lớp** của chính lớp đó, cộng **Super Admin** (D-151). ⚠️ **SIẾT quyền của người đang dùng — phải báo trước cho Ban điều hành xứ đoàn** |
| **AC-10-02** | **Khóa lần thứ hai đẩy lùi mốc khóa** | `on conflict do update set locked_at = now()` **vô điều kiện**. Hai người cùng bấm "Khóa" cách nhau một giờ thì mốc nhảy theo người bấm sau — mà mốc ấy là thứ **duy nhất** trả lời được câu *"bảng điểm chốt lúc nào"*, và bảng này không có lịch sử. Nay chỉ đặt mốc khi bảng đang **mở**; `locked_by` cũng vậy |
| **🔴 TB-M07-01 / AC-01-01 · AC-01-02** | **Xóa một cột tạo nhầm là việc KHÔNG LÀM ĐƯỢC, và câu lỗi nói sai** | Đường xóa cũ là một `delete` trần nên nó để **khoá ngoại trả lời hộ**: `assessment_scores` là `on delete restrict`, mà trước M07-A biểu mẫu ghi cả roster ⇒ cột nào cũng có sẵn **một dòng rỗng cho mỗi em**. Người dùng đọc *"Cột đã có điểm"* trong khi **chưa nhập điểm nào** (F04 = 50/75). RPC mới `delete_assessment` đếm đúng dòng `score is not null`, dọn các dòng rỗng rồi mới xóa, và trả về **số dòng đã dọn** — tức **dữ liệu rác của lỗi cũ tự biến mất đúng lúc người dùng bấm xóa**, không cần backfill riêng |
| **🔴 Cửa thứ hai, KHÔNG có trong `04_TO_BE_FLOWS`** | Cột đang là **nguồn của một bảng Top 5** | `leaderboards.source_assessment_id` cũng là khoá ngoại `on delete restrict`, và ca này thường gặp đúng ở tình huống *"tạo nhầm rồi tạo Top 5 nhầm theo"*. Không chặn trong RPC thì Postgres ném `23503`, mà `23503` được bộ dịch lỗi đưa về *"Không tìm thấy dữ liệu liên quan"* — **sai hẳn nghĩa**, và người dùng đi tìm sai chỗ. Nay có mã riêng `ASSESSMENT_IS_LEADERBOARD_SOURCE` |
| **🔴 TB-M07-01 / AC-01-03** | **"Ẩn cột" phải ẩn THẬT, không chỉ ẩn trên màn hình** | `assessments.is_active` có từ Phase 5 nhưng là **cột chết** — không đường nào đặt nó `false`, nên chưa ai phải hỏi *"ẩn rồi thì phụ huynh còn thấy không"*. Mọi truy vấn của ứng dụng đã lọc `is_active`, `v_student_weighted_average` cũng vậy — **nhưng RLS thì không**. Một bất biến chỉ đúng ở tầng ứng dụng **không phải bất biến**. Hai chỗ sửa: `assessments_select_scope` thêm `and is_active` ở **nhánh phụ huynh/thiếu nhi**, và trigger `sync_assessment_publication` (nay `after update of is_published, is_active`) hạ `assessment_scores.assessment_published`. Cùng luật ấy vào `sync_assessment_score_keys` cho đường ghi từng dòng — thiếu nó thì lưu một ô vào cột đã ẩn sẽ **bật lại** cờ công bố cho đúng dòng ấy. pgTAP `044` đo bằng **JWT của phụ huynh**, không đo bằng truy vấn của ứng dụng |
| **🔴 TB-M07-03 bước 6 / BR-M07-31 / AC-03-03** | **Cờ "chỉnh tay" đặt vô điều kiện cho mọi ô của cột chuyên cần** | Một cú bấm "Lưu điểm" biến **cả 50 em** thành *"đang chỉnh tay"*, và cơ chế đề xuất tự động chết hẳn từ đó (F07 = 62/75). M07-A đã chặn phần lớn bằng cách chỉ gửi ô đã đổi, **nhưng luật vẫn sai**: gõ trả lại đúng con số máy đề xuất vẫn bị đóng dấu. Nay cờ bật khi giá trị **khác** đề xuất và **tự gỡ** khi trùng lại — luật đọc **giá trị**, không đọc lịch sử thao tác. 🔴 Phép so là `is distinct from` chứ không phải `<>`: `<>` với `null` ra `null`, tức "không đúng cũng không sai", và `case … then` rơi vào nhánh sai |
| **🔴 D-153 — thay đổi dữ liệu DUY NHẤT của module** | Dấu "chỉnh tay" đặt sai trong dữ liệu **hiện có** | Sửa luật cho tương lai **không gỡ được** những dấu đã đặt: nút "Lấy đề xuất mới" sẽ vĩnh viễn bỏ qua chúng, và con số `skipped_manual` vừa thêm sẽ hiện **một số to giả ngay từ ngày đầu**. Migration gỡ cờ ở **đúng** những ô mà `score is not distinct from system_suggested_score` — không có bàn tay người nào trong đó. Mọi ô có điểm **khác** đề xuất **giữ nguyên** dấu, kể cả khi bị đặt oan, vì ở đó không phân biệt được "người sửa thật" với "người trùng số". Chủ dự án loại phương án *"gỡ sạch mọi dấu của cột chuyên cần"*: nó để máy ghi đè lại đúng những em được sửa tay **có lý do**, và không có cách lấy lại |
| **TB-M07-04 / AC-04-01** | **Con số cũ đếm gộp, nên nó NÓI SAI** | `refresh_attendance_assessment_scores` đếm **mọi** dòng nó chạm tới, kể cả dòng bị bỏ qua vì đang chỉnh tay ⇒ màn hình báo *"Đã cập nhật 50 đề xuất"*, người dùng mở bảng ra thấy **không ô nào đổi**, không gì giải thích. Ghép với lỗi đóng dấu ở trên thì đó là trạng thái **thường gặp**, không phải ca hiếm. Nay trả `(out_refreshed, out_skipped_manual)` — đổi kiểu trả về nên **bắt buộc `drop` + `create`**, cấp lại `grant execute` và sinh lại `src/types/database.ts`. Câu mới kèm **đường đi tiếp**, không để người dùng đoán |
| **🔴 TB-M07-05 / BR-M07-32 / AC-05-01** | **Mức hiển thị nhận xét mặc định là CÔNG KHAI** | Viết vội một câu về một em rồi bấm Thêm là câu ấy **ra thẳng cổng phụ huynh**, không một dòng cảnh báo. Nay mặc định **nội bộ**; chọn công khai hiện câu *"Nội dung này sẽ hiện trên cổng phụ huynh/thiếu nhi."* Ca nguy hiểm cần một hành động **có ý thức**, ca an toàn vẫn là một cú bấm. Sắc thái dùng `info` chứ không `danger`: công bố một nhận xét là việc **hợp lệ**, tô đỏ kèm `role="alert"` sẽ đọc thành *"bạn vừa làm sai"* mỗi lần người ta chọn đúng thứ họ định chọn |
| **🔴 TB-M07-05 / BR-M07-33 / D-152** | **Bất kỳ ai dạy lớp đều xóa được nhận xét của người khác** | Kể cả Dự trưởng phụ tá khi năm học bật cờ, và bảng **không có lịch sử** nên xóa là mất hẳn — không ai biết đã từng có gì. `07_IMPLEMENTATION_IMPACT` §3.3 ghi rõ đây là **giảm quyền của người đang dùng** và *"phải chốt nghiệp vụ trước"*, đúng loại `AGENTS` §3 cấm agent tự chọn. Chủ dự án chốt **D-152**: tác giả **+ Giáo lý viên đại diện của chính lớp đó** + nhóm cấp xứ đoàn — người chịu trách nhiệm về bảng điểm lớp (cũng là người được khóa nó ở D-74) xử lý được ngay tại lớp, thay vì phải nhờ cấp xứ đoàn xóa hộ một câu viết sai về một em nhỏ |
| **🔴 Và luật ấy phải vào CẢ hai cửa** | Siết mỗi DELETE là để nguyên lỗ hổng | Đợt này thêm đường **sửa** nhận xét (TB-M07-05 bước 2). Nếu chỉ siết `delete` thì ai bị chặn vẫn **sửa nội dung thành bất cứ thứ gì** — cùng một thiệt hại, đi qua một cái cửa khác, và lần này còn **giữ nguyên tên tác giả cũ**. pgTAP `044` canh cả hai |
| **🔴 Nợ #18 — và module này chứa CẢ HAI ca cùng lúc** | Bốn bảng, **hai chỗ đặt hàng rào trái ngược** | `assessments` · `student_comments` · `leaderboards` có `insert/update/delete` mức bảng ⇒ hàng rào vào **policy**, đúng khuôn M02-C. `assessment_scores` thì `authenticated` **chỉ có `select`** (`20260722000400:488`): mọi đường ghi đi qua RPC `security definer`, mà definer **bỏ qua RLS** ⇒ một điều kiện thêm vào policy **không bao giờ được chạy**. Hàng rào của bảng ấy nằm **trong bốn RPC** (`save_assessment_scores` · `refresh_attendance…` · `reset_attendance…` · `delete_assessment` mới), cộng `publish_leaderboard` vì nó ghi `leaderboard_entries` bằng definer. Đúng bài học M05-A, và lần này **cả hai ca ở cùng một module**. D-117 giữ nguyên: Super Admin ngoại lệ |
| **D-61 — một lỗ hổng phản hồi lộ ra khi đọc lại đường xóa cột** | Xóa/ẩn cột xong **không có một chữ nào** | Bản cũ đặt `setMessage(result.ok ? null : …)` — tức **cố ý không nói gì** sau một thao tác không hoàn tác được. Và kể cả có đặt câu, nó vẫn chết: thẻ cột **biến mất** ở lượt `router.refresh()` kế tiếp, mang theo state của chính nó. Đúng hình dạng lỗi M05-B đã trả giá. Nay câu ấy do **trang** giữ, đặt trong thẻ trạng thái đầu trang — vùng **duy nhất luôn tồn tại**; khối "Cấu hình cột điểm" thì không, vì xóa cột cuối cùng là cả khối biến mất |
| **Ba luật thuần tách khỏi `server/permissions.ts`** | `import "server-only"` chặn vitest | `canLockGradebook` · `canModerateComment` · `hasGlobalResultWrite` sang `gradebook-permissions.ts`, đúng khuôn `score-diff.ts` (M07-A) và `review-window.ts` (M05-B). 🔴 Phải `import` rồi mới `export`, **không** dùng `export … from` một dòng: dạng ấy **không tạo ràng buộc cục bộ** nên `canGradeClass` ngay bên dưới sẽ không gọi được `hasGlobalResultWrite` |

**⏸️ Ba việc CỐ Ý chưa làm ở đợt B, kèm lý do:**
1. **Bốn `window.confirm` (nợ #1)** — `11` §4 bước 3 buộc sửa nghiệp vụ **trước**, giao diện sau.
   Đợt này viết lại **nội dung câu hỏi** cho khớp nghiệp vụ mới (xóa hẳn ↔ ẩn, nêu số điểm đang
   có, nói ra "không lưu lịch sử"); đổi sang `ConfirmDialog` thuộc **M07-C**.
2. **Hàng rào năm học cho `gradebook_locks`** — bảng này **không** nằm trong danh sách bốn bảng của
   nợ #18. Và nó không nên có: khóa một bảng điểm của năm đã đóng là thao tác **vô hại và có ích**
   (nó chỉ siết thêm), còn ghi thì đã bị bốn bảng kia chặn rồi.
3. **Hạng mục 9a (khoá lạc quan đầy đủ)** — giữ nguyên lý do ở bảng đợt.

⚠️ **Một cánh cửa MỘT CHIỀU do chính đợt này mở ra, ghi lại để không ai phát hiện bằng cách vấp
phải nó.** `04_TO_BE_FLOWS` TB-M07-01 chỉ mô tả đường **ẩn**, không mô tả đường **hiện lại** — và
mọi truy vấn của module đều lọc `is_active = true`, nên một cột đã ẩn **không còn bề mặt nào để
bấm vào**. Dữ liệu điểm còn nguyên vẹn, nhưng ẩn nhầm thì phải nhờ Quản trị viên hệ thống can
thiệp ở tầng cơ sở dữ liệu. Hai lý do **không** làm ngay ở đợt này: (1) dựng đường hiện lại đòi
một bề mặt mới liệt kê cột đã ẩn — tức thêm việc ngoài phạm vi đã chốt (`AGENTS` §4); (2) nó thuộc
đúng nhóm *"vòng đời"* mà `07` §7 luật 4 xếp làm **cuối**, cùng chỗ với TB-M07-02 và TB-M07-06.
Đợt này **nói thẳng điều đó ra trong câu xác nhận** thay vì để người dùng tự phát hiện. Ghi vào
nợ kỹ thuật **#21**.

**Số kiểm thử thật của đợt B:**

| | |
|---|---|
| `npm run test:db` | **1115/1115**, 44 file (trước 1061/1061 ⇒ **+54**) — chạy trên DB vừa `db:reset` sạch, **trước** `seed:dev`. File mới `044_gradebook_scope_and_year_gate_test.sql` **54 khẳng định, toàn bộ bằng JWT thật của 9 vai trò**; `017` sửa 3 chỗ vì RPC đổi kiểu trả về |
| `npm test` | **1210 pass / 10 skip** (trước 1185/10 ⇒ **+25**), 92 file pass / 3 skip. Mới: `gradebook-permissions.test.ts` (14) · `gradebook-editor.test.tsx` (+11) |
| `npm run lint` | **0 warning 0 error** |
| `npm run typecheck` | ✓ |
| `npm run build` | ✓ **28/28 trang** |
| `npm run test:e2e` (toàn bộ) | **414/420** trên DB vừa `db:reset` + `seed:dev`, 20,9 phút — 6 đỏ = **1,4 %**, **đúng bằng tỷ lệ của M07-A** (6/420). Tập đỏ: `results` ×2 · `staff-directory` ×3 (nợ #15) · `imports` ×1 |

🔴 **Hai bài `results.spec.ts` đỏ, và tôi đã mở ảnh chụp CẢ HAI trước khi gán — đúng lời dặn của
M05-C rằng "đỏ bằng timeout KHÔNG tự động là nợ #10".** Cả hai đều mang đúng chữ ký của nợ #10, và
quan trọng hơn: **cả hai rớt ở bước đã có TRƯỚC đợt này**, không phải ở phần M07-B thêm vào.

| Viewport | Rớt ở | Ảnh chụp cho thấy |
|---|---|---|
| `mobile-360` | dòng 265 — **tạo cột điểm đầu tiên**, tức lượt ghi **thứ nhất** của cả bài | `status: "Thành công: Đã thêm cột điểm."` **đã hiện**, mà nút vẫn là `"Đang thêm…" [disabled]` |
| `laptop-1366` | dòng 276 — **lưu 6 ô điểm**, lượt ghi thứ hai | `status: "Thành công: Đã lưu 6 ô điểm."` **đã hiện**, nút vẫn `"Đang lưu…" [disabled]` |

⇒ Ghi vào được, **câu trả lời không về** — không phải mã ứng dụng, và không phải phần đợt này thêm
(khối xóa cột nằm ở dòng 311 trở đi, chưa chạy tới).

🔴 **Một khuyết điểm CỦA CHÍNH BỘ TEST lộ ra ở lượt laptop, đáng ghi lại cho M07-C.** Thông điệp
thất bại nói *"element(s) not found"* trong khi câu *"Đã lưu 6 ô điểm."* **đang nằm trong ảnh
chụp**. Lý do: bộ định vị neo vào `getByRole("button", { name: "Lưu điểm <tên cột>" })` rồi mới đi
lên `ancestor::form` — mà khi lượt ghi còn treo, **nhãn nút đổi thành "Đang lưu…"**, nên chính cái
neo tan biến và Playwright báo sai chỗ hỏng. Cùng họ với bài học `clickIfEnabled` của M05-C. Cách
trả: neo vào `<caption>` của bảng (*"Nhập điểm <tên cột>"*) — chuỗi này **không đổi theo trạng thái
pending**. Chưa sửa ở đợt B: nó không đổi kết quả xanh/đỏ, chỉ đổi chất lượng thông điệp, và mỗi
lần đo lại tốn ~21 phút.

🔴 **Một điều phải nói thẳng về D-153: trên máy này nó chạm 0 dòng, và con số ấy KHÔNG có nghĩa là
nó vô dụng.** Migration chạy **trước** `seed:dev`, mà bộ seed dev không sinh ô điểm chuyên cần nào
— đo lại sau khi seed cho `flagged = 0`. Trên dữ liệu thật của giáo xứ, mỗi lần một Giáo lý viên
bấm "Lưu điểm" trên cột chuyên cần trước M07-A là **cả roster** bị đóng dấu, nên con số ở đó sẽ
khác 0. Vì không đo được bằng dữ liệu, **vị từ được kiểm riêng bằng bốn ca dựng tay** (psql, trong
một giao dịch `rollback`):

| Ca | `is_manual_override` trước | sau |
|---|:--:|:--:|
| Dấu đặt oan — điểm **bằng** đề xuất | ✔ | ✘ **gỡ** |
| Sửa tay thật — điểm **khác** đề xuất | ✔ | ✔ **giữ** |
| Ô rỗng, chưa có đề xuất (`null` ↔ `null`) | ✔ | ✘ **gỡ** |
| Không mang dấu | ✘ | ✘ |

Ca thứ ba là chỗ `is not distinct from` khác hẳn `=`: `null = null` ra `null` nên câu lệnh sẽ **bỏ
sót** đúng những ô chưa ai chấm — thứ chắc chắn không phải "chỉnh tay".

**Nghiệm thu 15 mục (`11` §5) cho đợt M07-B:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ build **28/28** · lint **0 warning** · typecheck ✓ · unit **1210/10 skip** |
| E2E responsive 3 viewport, không tràn ngang | ✅ `results.spec.ts` giữ `expectNoHorizontalOverflow` ở ba mốc (bảng điểm đã khóa · cổng phụ huynh · cổng thiếu nhi); đợt này **không thêm khối bố cục mới**, chỉ đổi nhãn nút và thêm một badge đếm |
| Mọi vùng chạm ≥44px | ✅ hai nút mới (`Sửa`/`Xóa` nhận xét) dùng `Button size="sm"`, vốn đã đạt 44px từ Đợt 0-UI; nợ #20 của module đã đóng hẳn ở M07-A và đo bằng `boundingBox()` |
| Không cỡ chữ < 12px | ✅ lint rule chặn, 0 vi phạm |
| Không màu hardcode khi có token | ✅ không thêm màu mới; `FormMessage`/`Badge`/`Select`/`Textarea` đều là component token |
| Không `window.confirm` / `window.alert` | ⏸️ **4 chỗ, giữ nguyên có chủ ý** — nợ #1, trả ở **M07-C** đúng `11` §4 bước 3. Đợt này chỉ viết lại **nội dung câu hỏi** cho khớp nghiệp vụ mới |
| Không `<select>` native mới | ✅ hai ô chọn mức hiển thị (biểu mẫu thêm **và** biểu mẫu sửa) dùng component `Select`; **không** thêm thẻ trần nào |
| Mọi thao tác ghi có phản hồi (D-61) **và kiểm số dòng** (SW-04) | ✅ `archiveAssessment` · `updateStudentComment` đều `.select()` + `assertRowsAffected`; `deleteAssessment` đi qua RPC nên có ngoại lệ thật. 🔴 Đợt này **đóng một lỗ D-61 có thật**: xóa/ẩn cột trước đây `setMessage(null)` khi thành công, và kể cả có câu thì nó cũng chết cùng thẻ vừa biến mất |
| Trạng thái rỗng dùng đúng 1 trong 3 loại chuẩn | ✅ không đổi — *"Lớp chưa tạo cột điểm…"* và *"Chưa có nhận xét."* giữ nguyên |
| Thao tác nguy hiểm nêu hậu quả **bằng tên riêng** | ✅ cả ba câu hỏi mới đều nhắc **tên cột** hoặc nói ra hậu quả cụ thể (*"mất luôn, không lấy lại được"* · *"điểm được giữ nguyên, nhưng cột biến khỏi bảng điểm, bản xuất, điểm trung bình, Top 5 và cổng phụ huynh"* · *"hệ thống không lưu lịch sử"*) — dù vỏ vẫn là `window.confirm` cho tới M07-C |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ⏸️ không phát sinh — D-65 phạm vi là thao tác **tài khoản**; module này không đụng |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ không thêm lớp nổi nào; biểu mẫu sửa nhận xét là **inline**, mọi điều khiển là `Button`/`Select`/`Textarea` chuẩn |
| Không dùng màu làm tín hiệu duy nhất | ✅ badge đếm điểm mang **chữ** (*"Chưa có điểm"* / *"N điểm đã nhập"*); cảnh báo công khai là **câu văn**, `FormMessage` luôn kèm icon + nhãn cho trình đọc màn hình |
| Nếu siết quyền: **kiểm thử phân quyền âm tính bằng JWT thật của từng vai trò** | ✅ pgTAP `044` — **54 khẳng định, 9 vai trò**, gồm cả `throws_ok` cho đường gọi thẳng RPC (AC-10-01) và phép đo bằng **JWT của phụ huynh** cho AC-01-03 |
| Cập nhật tài liệu và implementation log | ✅ `docs/02` §9.2 · §9.4 · `docs/03` WF-08 · `docs/05` §5 + bảng đầu file · `docs/11` §8 · file này · `00_SYSTEM_AUDIT_BOARD.md` · `WORKLOG.md` |

#### Đợt M07-C — ✅ XONG (2026-08-06) ⇒ **ĐÓNG MODULE 10 (M07)**

**1 migration (`20260806000100`) · 0 thay đổi phân quyền · 0 `alter table` trên bảng cũ ·
0 backfill · 0 dòng dữ liệu bị đụng.**

| Mã | Việc | Kết quả thật |
|---|---|---|
| **🔴 TB-M07-02 / AC-02-01 · AC-02-02 · AC-02-03 / BR-M07-29 / D-154** | **"Khóa bảng điểm" và "công bố kết quả cho phụ huynh" là HAI việc, mà hệ thống buộc chung làm một** | `07_IMPLEMENTATION_IMPACT` §1 chấm hạng mục này **rủi ro CAO** — cao nhất module — và §7 xếp **làm cuối** vì nó *"đụng ngữ nghĩa khóa"*. Luật cũ dễ giải thích (*"khóa rồi thì không đổi được gì"*) nhưng đắt: muốn công bố thêm một cột sau khi đã khóa thì phải nhờ Quản trị viên hệ thống **mở khóa cả bảng điểm**, tức mở luôn quyền sửa điểm và hệ số của cả lớp, **đúng lúc điểm vừa được chốt**. Chủ dự án chốt tách ra 2026-08-06, **cả hai chiều** bật và tắt. 🔴 **Ai được công bố thì KHÔNG đổi** (`app.can_grade_class`, y như policy cũ) — chỉ đổi *lúc nào* công bố được, nên đợt này **0 thay đổi phân quyền** |
| **🔴 Quả mìn của TB-M07-02 nằm ở BẢNG KHÁC** | Nới hai lớp kiểm mà quên lớp thứ ba thì thao tác vẫn hỏng, với **đúng mã lỗi cũ** | Đường công bố đi qua **ba** lớp: policy `assessments_update_grader` · trigger `app.validate_assessment` · và 🔴 trigger `app.sync_assessment_score_keys` **trên `assessment_scores`**. Đổi `assessments.is_published` làm `assessments_sync_publication` chạy một lệnh UPDATE lên bảng điểm số để đồng bộ cờ phi chuẩn hoá — mà trigger dòng của bảng ấy **cũng** ném `GRADEBOOK_LOCKED`. Người đọc diff của *"công bố cột điểm"* không có lý do nào để mở file ấy ra. Nới an toàn được vì hàm **tự suy lại** `assessment_published` từ chính cột điểm ở cuối thân hàm ⇒ một lượt UPDATE chỉ đổi mỗi cờ ấy **không mang theo giá trị nào của người dùng**; và `authenticated` chỉ có `select` trên `assessment_scores` nên không có đường gọi trực tiếp |
| **🔴 Ngoại lệ phải SO CẢ BẢN GHI, không liệt kê tay từng cột** | Liệt kê tay là để ngoại lệ **rộng ra trong im lặng** | `04_TO_BE_FLOWS` viết *"`new.* is not distinct from old.*` cho mọi cột khác"*. Cách rẻ là liệt kê chín cột nghiệp vụ — và cột thứ mười thêm vào năm sau sẽ **lọt qua ngoại lệ mà không ai biết**, tức hàng rào "khóa" tự nới ra theo thời gian. Phép thử dùng ở đây: `to_jsonb(new) = to_jsonb(old)` sau khi trừ đúng ba khoá `is_published`/`updated_at`/`updated_by`. Phải trừ hai khoá cuối vì `assessments_set_updated_at` chạy **trước** `assessments_validate` (Postgres gọi trigger theo thứ tự tên) nên `new.updated_at` đã là `now()` khi hàm nhìn thấy nó |
| **🔴 Policy GIỮ NGUYÊN — và đó là điều quan trọng nhất của cả hạng mục** | Ngoại lệ chỉ sống bên trong RPC | `04_TO_BE_FLOWS` phương án A đòi *"`authenticated` vẫn không được UPDATE trực tiếp khi khóa"*. Nên `assessments_update_grader` **không đổi một chữ**, và đường công bố duy nhất của ứng dụng là RPC `security definer` mới. Hệ quả đo được: gửi thẳng `update … set is_published` vào cơ sở dữ liệu khi đã khóa vẫn **đổi 0 dòng** (pgTAP `045`) |
| **Ba hàng rào chép vào RPC** | `security definer` bỏ qua RLS — bài học M05-A, và module này đã vấp một lần ở đợt B | `set_assessment_published` tự kiểm **quyền** (`app.can_grade_class`), **hàng rào năm học đã đóng** (nợ #18, D-117 miễn Super Admin) và **luật cột ẩn**. Thiếu cái thứ hai thì TB-M07-02 mở lại đúng lỗ hổng mà M07-B vừa bịt |
| **`ASSESSMENT_INACTIVE`** | Công bố một cột đang bị **ẩn** là thao tác không có kết quả nhìn thấy được | Cột ẩn đã biến khỏi bảng điểm, bản xuất, trung bình và cổng phụ huynh từ M07-B (BR-M07-28). Đổi cờ rồi im lặng thì người dùng đi tìm xem điểm hiện ra ở đâu. Nay trả lời thẳng, kèm việc phải làm trước: *"Hãy hiện lại cột ở mục **Cột đã ẩn**, rồi công bố."* |
| **🔴 TB-M07-06 / AC-06-01 · AC-06-02 / BR-M07-34 · BR-M07-35 / D-155** | **Ẩn một bảng Top 5 rồi bấm công bố lại là ÂM THẦM TÍNH LẠI** | F16: `publish_leaderboard` **xóa sạch** entries cũ rồi dựng lại theo điểm mới nhất. Em đứng hạng 5 hôm trước biến khỏi bảng, **không ai được báo**, và bản cũ **không còn ở đâu**. Nhãn *"Ẩn khỏi portal"* không hề nói ra rằng bấm hiện lại sẽ xếp hạng lại (`06_UI_UX` §3). `04_TO_BE_FLOWS` khuyến nghị **phương án A** (chốt một lần, cấm tính lại); **chủ dự án chọn phương án B** — giữ khả năng tính lại, nhưng bản đang có phải **xuống lịch sử** trước khi bị thay |
| **🔴 Bảng lịch sử đứng RIÊNG, không thêm cột vào `leaderboard_entries`** | `07` §4 cấm tuyệt đối mọi thay đổi nới quyền đọc của cổng phụ huynh | `leaderboard_entries` **là đúng cái bảng cổng phụ huynh đọc**. Chứa nhiều bản trong đó thì hai `unique` của nó (`leaderboard_id, rank` và `leaderboard_id, enrollment_id`) phải nới ra **và** policy phải học cách chọn bản nào để hiện — tức sửa **cả ràng buộc lẫn policy** của bề mặt nhạy cảm nhất module. Tách ra thì `leaderboard_entries` **không đổi một chữ**: cổng luôn chỉ thấy bản đang có, và không cần ai chọn hộ nó |
| **Hình dạng bảng lịch sử** | Append-only tuyệt đối · chỉ nhân sự phạm vi lớp đọc | Trigger chặn UPDATE/DELETE cho **mọi** vai trò kể cả chủ bảng và `service_role`, cùng khuôn `account_audit_events` (D-65) — một bản lịch sử sửa được thì nó không còn là lịch sử. **Không có nhánh phụ huynh/thiếu nhi** trong policy: WF-09 nói cổng hiển thị Top 5 **đang** công bố, còn bảng này là bản **đã bị gỡ xuống**. `entries_json` theo tiền lệ `report_snapshots` — dữ liệu đông cứng, không ai truy vấn quan hệ vào nó |
| **🔴 BR-M07-35 — phép thử xóa cũ SAI đúng hình dạng F04** | `not is_published` ↔ `published_at is null` | Sau một lượt "Ẩn khỏi cổng" thì `is_published` về `false`: policy cũ **cho qua**, rồi khoá ngoại `on delete restrict` của `leaderboard_entries` **trả lời hộ** bằng `23503` — mà bộ dịch lỗi biến `23503` thành *"Không tìm thấy dữ liệu liên quan"*, một câu sai hẳn nghĩa. Đây là **cùng một lỗi** mà đợt B vừa chữa ở cột điểm, ở một bảng khác. `published_at` không bao giờ bị xóa đi nên nó là phép thử đúng cho *"đã từng công bố"* |
| **Và một đường KHÔNG có trong tài liệu: *"Hiện lại bản đang có"*** | Phương án B mà chỉ có đường tính lại thì một cú bấm nhầm vẫn mất bản cũ | `04_TO_BE_FLOWS` không mô tả đường này vì nó viết cho phương án A. Nhưng với B, nếu *"công bố lại"* là **đường duy nhất** thì một lượt "Ẩn khỏi cổng" bấm nhầm sẽ kéo theo một lượt tính lại — danh sách có thể đổi, và bản cũ tuy còn trong lịch sử nhưng **không còn là bản đang hiển thị**. Hai đường tách bạch, và **nhãn nút là toàn bộ khác biệt** người dùng có để quyết định. Kèm lưới an toàn ở cơ sở dữ liệu: bật cờ công bố trên bảng **chưa từng chốt** ném `LEADERBOARD_NOT_SNAPSHOTTED`, nếu không cổng phụ huynh nhận một bảng Top 5 **rỗng** |
| **Ba trạng thái, không phải hai** | Trước đợt này *"bản nháp"* và *"đã chốt nhưng đang ẩn"* đội **chung một nhãn** | Mà một cái xóa được còn cái kia thì không; một cái chưa có gì còn cái kia đang giữ đúng danh sách phụ huynh vừa xem. Nay: **Bản nháp** (xem trước · công bố · **xóa**) · **Đã chốt · đang ẩn** (hiện lại · chốt lại · **không xóa được**) · **Đang công bố** (ẩn khỏi cổng). Thẻ hiện luôn *"N bản trước trong lịch sử"* |
| **🔴 Nợ #1 — ĐÓNG HẲN** | **4 chỗ `window.confirm` cuối cùng của TOÀN HỆ THỐNG** | `grep -rn "window.confirm\|window.alert" src/` nay ra **0** (chỉ còn hai dòng chú thích trong `dialog.tsx`/`confirm-dialog.tsx` nói rằng chúng thay cho nó). Bốn chỗ: xóa/ẩn cột · xóa nhận xét · công bố Top 5 · khóa và mở khóa bảng điểm. Đợt A và B **cố ý hoãn** vì `11` §4 bước 3 buộc sửa nghiệp vụ trước, mà nội dung câu hỏi đổi hẳn sau TB-M07-01/02/06 — làm sớm là làm hai lần, và đúng như dự đoán: cả bốn câu nay khác hẳn bản của đợt B |
| **Cái bẫy khi bỏ `window.confirm` ở nút công bố Top 5** | `event.currentTarget.form` sau đó là `null` | Nút *"Công bố snapshot"* đọc `FormData` từ biểu mẫu chứa nó. Với `window.confirm` thì lời hỏi **chặn luồng đồng bộ**, nên đọc form ngay trong `onClick` luôn đúng. Với hộp thoại thật thì cây DOM dựng lại giữa lúc hỏi và lúc xác nhận ⇒ phải chụp `FormData` **trước khi** mở hộp thoại. Đây là loại lỗi typecheck không bắt được và chỉ hỏng ở đúng nguồn `custom_competition` |
| **Nợ #21 — ĐÓNG** | Cột đã ẩn có đường hiện lại, ngay trên màn hình bảng điểm | Món nợ do **chính M07-B mở ra ba ngày trước**: đợt ấy biến `is_active` thành cột nghiệp vụ nhưng chỉ mở một chiều. Mục *"Cột đã ẩn"* gập sẵn (trang này vốn đã rất dài), cùng nhóm người được chấm điểm lớp, cùng hàng rào khóa — **0 thay đổi cơ sở dữ liệu**, policy `assessments_update_grader` đã cho sẵn. Hộp xác nhận nói riêng cho ca đáng lo: cột đang ở trạng thái *"Đã công bố"* thì hiện lại là **phụ huynh thấy lại điểm ngay lập tức** |
| **`06_UI_UX` §3 — nút công bố nhẹ nhất về thị giác** | Đổi `ghost` → `outline` | Biên bản ghi thẳng: thao tác *"có tác động ra ngoài tổ chức"* lại là thứ mờ nhất trong hàng nút. Nay nó cũng là **nút duy nhất của thẻ còn sống sau khi khóa**, nên nhấn mạnh thêm một bậc là đúng cả hai lý do |

**Số kiểm thử thật của đợt C:**

| | |
|---|---|
| `npm run test:db` | **1158/1158**, 45 file (trước 1115 ⇒ **+43**, file mới `045`) trên DB vừa `db:reset` |
| `npm test` | **1224 pass / 10 skip** (trước 1210/10 ⇒ **+14**), 92 file pass / 3 skip |
| `npm run lint` | **0 warning 0 error** |
| `npm run typecheck` | ✓ |
| `npm run build` | ✓ **28/28 trang** |
| `grep -rn "window.confirm\|window.alert" src/` | **0 lời gọi** (chỉ còn hai dòng chú thích ở `dialog.tsx`/`confirm-dialog.tsx`) — nợ #1 đóng hẳn |
| `npm run test:e2e` (toàn bộ) | **410/420** trên DB vừa `db:reset` + `seed:dev`, 21,9 phút — **10 đỏ = 2,4 %** (M07-A và M07-B: 6 đỏ = 1,4 %). ⚠️ **Tỷ lệ đỏ TĂNG, và phải nói ra chứ không giấu sau chữ "đã biết"** — xem phần đo ngay dưới |

**🔴 Tỷ lệ E2E đỏ tăng từ 1,4 % lên 2,4 %, và đây là những gì đo được về nó.**

**Bốn trong mười bài rớt ở `page.waitForURL`** — *bấm một `<Link>`, thanh địa chỉ không đổi trong
20–30 giây*. Đó là **chữ ký đúng nguyên văn của nợ #15**, món nợ toàn hệ thống mà M02-B đã khoanh
vùng bằng số (≈11–14 % cú bấm, tái lập ở cả `/classes` lẫn `/staff`, đã loại cơ sở dữ liệu · máy
chủ dựng trang · nạp trước · lỗi bài test). Sáu bài còn lại rớt ở *"thứ dẫn xuất từ dữ liệu máy chủ
chưa hiện sau `router.refresh()`"* — chữ ký của **nợ #10**. Không bài nào rớt ở một khẳng định về
nghiệp vụ.

🔴 **Hai bài `results.spec.ts` đỏ (mobile-360 · tablet-768) rớt ở bước CÓ TRƯỚC M07-C** — một ở
*"thẻ cột tạo nhầm biến mất sau khi xóa"* (bước của M07-B), một ở *"nút Lưu điểm của cột nháp vừa
thêm hiện ra"* (bước của Phase 5). Tức trên hai viewport ấy, **các bước mới của M07-C chưa từng
được chạy tới**. Trên `laptop-1366` thì `results.spec.ts` **xanh trọn vẹn**, gồm cả bốn bước mới:
hộp xác nhận thật thay `window.confirm` · vòng ẩn → hiện lại một cột đã công bố · **công bố một cột
sau khi đã khóa** · và tắt công bố lại ngay sau đó.

⚠️ **Điều KHÔNG kết luận được từ số này:** rằng M07-C vô can. Đợt này **cộng thêm khoảng sáu lượt
`router.refresh()`** vào `results.spec.ts`, mà mỗi lượt là một lần rút thăm với nợ #10/#15 — spec
dài ra thì xác suất một bài rớt ở đâu đó **tăng theo**, kể cả khi mọi bước mới đều đúng. Hai chiều
này chưa tách được bằng dữ liệu hiện có, nên ghi lại nguyên trạng thay vì chọn một chiều.

**Nghiệm thu 15 mục (`11` §5) cho đợt M07-C:**

| Mục | Kết quả |
|---|---|
| `build` · `lint` · `type-check` · `test` xanh | ✅ build **28/28** · lint **0 warning** · typecheck ✓ · unit **1224/10 skip** · pgTAP **1158/1158** |
| E2E responsive 3 viewport, không tràn ngang | ✅ `results.spec.ts` giữ nguyên ba mốc `expectNoHorizontalOverflow` (bảng điểm đã khóa · cổng phụ huynh · cổng thiếu nhi); mục *"Cột đã ẩn"* là danh sách một cột, không có bảng ngang mới. ⚠️ Ba mốc ấy **chỉ chạy tới trên `laptop-1366`** ở lượt này — hai viewport kia rớt sớm hơn ở vùng nợ #10/#15, xem phần đo bên dưới |
| Mọi vùng chạm ≥44px | ✅ mọi nút mới (`Hiện lại` · `Xem N cột đã ẩn` · `Hiện lại bản đang có` · `Chốt lại danh sách` · `Xóa bản nháp`) dùng component `Button`, vốn `min-h-11` từ Đợt 0-UI; nút trong `ConfirmDialog` cũng vậy |
| Không cỡ chữ < 12px | ✅ lint rule chặn, 0 vi phạm |
| Không màu hardcode khi có token | ✅ không thêm màu mới; `Badge`/`Button`/`FormMessage`/`ConfirmDialog` đều là component token |
| Không `window.confirm` / `window.alert` | ✅ **ĐÓNG HẲN — `grep -rn` trong `src/` ra 0.** Đây là mục **duy nhất trong 15 mục** còn ⏸️ suốt 14 đợt trước |
| Không `<select>` native mới | ✅ không thêm ô chọn nào |
| Mọi thao tác ghi có phản hồi (D-61) **và kiểm số dòng** (SW-04) | ✅ `restoreAssessment` · `republishLeaderboard` · `deleteLeaderboard` đều `.select()` + `assertRowsAffected`. ⚠️ **`setAssessmentPublished` cố ý KHÔNG assert 0 dòng** — RPC ném ngoại lệ ở **mọi** đường từ chối, nên `changed = 0` chỉ còn nghĩa *"người khác vừa bấm"*; gọi đó là lỗi thì hai người cùng bấm sẽ có một người đọc câu báo hỏng cho một việc **đã thành**. Màn hình nói ra bằng sắc thái `info` |
| Trạng thái rỗng dùng đúng 1 trong 3 loại chuẩn | ✅ không đổi; mục *"Cột đã ẩn"* **không hiện** khi rỗng (không dựng một trạng thái rỗng thừa cho một khối phụ) |
| Thao tác nguy hiểm nêu hậu quả **bằng tên riêng** | ✅ cả **sáu** hộp thoại: tên cột + tên lớp (xóa/ẩn/hiện lại cột) · tên em + tên người viết + ngày (xóa nhận xét) · tên bảng + tên lớp (Top 5) · tên lớp + số cột + số thiếu nhi (khóa bảng điểm) |
| Thao tác nhạy cảm ghi nhật ký (D-65) | ⏸️ không phát sinh — D-65 phạm vi là thao tác **tài khoản**. `leaderboard_snapshots` **không phải** nhật ký D-65 mà là bản sao dữ liệu nghiệp vụ, dù nó dùng chung khuôn append-only |
| `Tab` đi hết · focus thấy được · `Escape` đóng lớp nổi | ✅ sáu hộp thoại đều là `ConfirmDialog` → `Dialog` → `useModalBehavior`: bẫy focus hai chiều, `Escape` đóng **và trả focus** về nút vừa rời đi, khoá cuộn body. Đây chính là thứ `window.confirm` không có (`06_UI_UX` §7 xếp vào ✖) |
| Không dùng màu làm tín hiệu duy nhất | ✅ ba trạng thái Top 5 mang **chữ** (*"Bản nháp"* / *"Đã chốt · đang ẩn"* / *"Đã công bố"*), không phải ba sắc badge; số bản lịch sử cũng là chữ |
| Nếu siết quyền: **kiểm thử phân quyền âm tính bằng JWT thật của từng vai trò** | ✅ **0 thay đổi phân quyền ở đợt này**, nhưng D-154 **nới một hàng rào** nên pgTAP `045` đo **cả hai chiều** bằng JWT thật của 5 vai trò: 1 khẳng định cho chiều nới (AC-02-01) và **6** cho chiều giữ (AC-02-02), cộng ba hàng rào của RPC (không quyền · năm học đã đóng · cột đã ẩn) và D-117 cho Super Admin |
| Cập nhật tài liệu và implementation log | ✅ `docs/02` §9.2 (ngoại lệ khóa, ba chỗ đặt) · §9.8 + **§9.9 mới** · `docs/03` WF-08 + WF-09 · `docs/05` bảng thao tác (3 dòng) · file này · `00_SYSTEM_AUDIT_BOARD.md` · `WORKLOG.md` |

**⏸️ Hai việc CỐ Ý chưa làm ở đợt C, kèm lý do:**
1. **Hạng mục 9a — khoá lạc quan đầy đủ (TB-M07-03 phương án A).** `07` §7 luật 3 viết thẳng:
   *"chỉ làm nếu 9b chưa đủ — đo bằng thực tế sử dụng, đừng làm trước"*. 9b đã làm ở M07-A. Đây là
   thứ duy nhất còn để ngỏ của module, và nó **cố ý** để ngỏ.
2. **Màn hình đọc lại lịch sử Top 5.** Bảng `leaderboard_snapshots` có dữ liệu, có policy và có
   bài kiểm; **chưa có màn hình**. Cố ý: `04_TO_BE_FLOWS` không mô tả màn hình nào cho phương án B,
   và dựng thêm một màn hình là mở rộng phạm vi ra ngoài đợt đã chốt (`AGENTS` §4). Thẻ Top 5 đã
   nói ra **số bản** đang nằm trong lịch sử, nên người dùng biết nó tồn tại. Ghi thành **nợ #22**.

---

### Module 11 — M08 Chuyển lớp · chia ba đợt · ✅ **ĐÓNG 2026-08-08**

`03_AUDIT_RESULTS` chấm module **56/75**, trạng thái `NEEDS_IMPROVEMENT`, **1 luồng `CRITICAL`**. Biên
bản audit nói rất rõ chỗ mạnh và chỗ yếu, và hai chỗ ấy **không nằm cùng một tầng**:

> *"Lõi cơ sở dữ liệu của module này rất tốt — nguyên tử, idempotent, phân quyền chặt, có test.
> Vấn đề nằm ở **tầng truy vấn (hiệu năng)**, **tầng giao diện (không dùng được ở quy mô thật)** và
> **một quy tắc nghiệp vụ bị bỏ (bí tích lớp cuối ngành)**."*

Đó là lý do bảng dưới **không** đụng vào hai RPC `propose_promotion` / `approve_promotion_review`
ở đợt A — `04_TO_BE_FLOWS` xếp chúng vào mục *"Không đưa vào To-Be (giữ nguyên vì đã đúng)"*.

`07_IMPLEMENTATION_IMPACT` §3 ước lượng **~7–9 ngày-người** nếu làm đủ, **~2 ngày** cho gói tối
thiểu (hạng mục 1 + 2), và xếp sẵn thứ tự. Bảng dưới đi **đúng** thứ tự đó.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M08-A** | Gói tối thiểu của `07` §3 — hạng mục **1** (bỏ N+1 · lọc · phân trang · bảng tiến độ theo lớp; `07` gọi đây là *"chặn mọi thứ khác vì giao diện mới dựa trên đó"*) và hạng mục **9** (gỡ phụ thuộc chéo sai giữa hai feature). Kèm **BR-M08-14** (chỉ năm học hiện hành), **BR-M08-X2** (mặc định giữ nhánh A/B), câu lỗi tiếng Việt cho 11 tên luật, **nợ #14**, và **kiểm chéo bàn giao từ M07-B**. **0 migration** | ✅ **XONG 2026-08-06** |
| **M08-B** | **CÓ MIGRATION.** Hạng mục **3** (cảnh báo bí tích lớp cuối ngành — **D-156**, chủ dự án chốt *"theo từng ngành"*; phạm vi chính xác chốt tiếp ở **D-161**) · hạng mục **5** (nhật ký quyết định — **D-157**, chủ dự án chọn **bảng riêng append-only**, ngược khuyến nghị "cột `history` jsonb" của tài liệu) · hạng mục **6** (bịt đường vòng đóng ghi danh — **D-158**, chủ dự án chốt **cả hai tầng**; phạm vi chốt ở **D-162**) · **nợ #18** hàng rào năm học đã đóng cho bảng của module (**D-160** — hỏi **cả hai** năm) · **D-159** một nút "Chuyển lớp" cho cấp xứ đoàn, làm **nguyên tử trong cơ sở dữ liệu** | ✅ **XONG 2026-08-07** |
| **M08-C** | Giao diện + thao tác nguy hiểm: hạng mục **2** (`ConfirmDialog` trước khi Duyệt + bắt buộc lý do khi Từ chối — AC-14/AC-15) · hạng mục **4** (đề xuất hàng loạt — AC-20) · phần còn lại của **7**/**8** (hiện người đề xuất/người duyệt) · điện thoại 360px. ⚠️ **Đợt này CÓ migration, ngược dự đoán ghi ở WORKLOG của M08-B** (*"giao diện thuần, không migration"*) — hạng mục 8 hoá ra không làm được nếu không mở một cửa sổ hẹp; xem **D-163** | ✅ **XONG 2026-08-08** ⇒ **đóng module 11** |

#### Bốn quyết định chủ dự án chốt 2026-08-06, trước khi mở module

Cả bốn thuộc đợt **B**, ghi lại ở đây vì chúng đã định hình bảng trên.

| Mã | Câu hỏi | Chốt |
|---|---|---|
| **D-156** | `docs/03` WF-11 nói *"chỉ lớp cuối ngành xét điều kiện bí tích"* nhưng **không nói xét bí tích nào** — `07` §3 ghi *"cần user xác nhận quy tắc chính xác"* | **Theo từng ngành.** Chiên Con 2 xét Rửa Tội · Ấu 3 xét Xưng tội lần đầu + Rước lễ lần đầu · Thiếu 3 xét Thêm Sức · Nghĩa 3 và Hiệp 2 **không có bí tích mới**, chỉ nhắc lại những bí tích ngành trước còn thiếu. Vẫn là **cảnh báo, không hard-block** (BR-M08-18) |
| **D-157** | Gửi lại một đề xuất bị từ chối **ghi đè sạch** ai từ chối, lúc nào, vì sao (`03_AUDIT_RESULTS` §4.3) | **Bảng lịch sử riêng, chỉ ghi thêm** — ngược khuyến nghị của `04_TO_BE_FLOWS` (phương án A: cột `history jsonb`). Cùng khuôn `leaderboard_snapshots` mà chủ dự án đã chọn ở M07-C, và cùng lý do: lịch sử nằm chung dòng với trạng thái hiện tại thì không tách ra báo cáo được |
| **D-158** | Ghi danh đang có đề xuất **chờ duyệt** vẫn đóng được bằng luồng thủ công ở `/classes/[classId]`, để lại một đề xuất mồ côi (`03_AUDIT_RESULTS` §4.5) | **Chặn ở CẢ HAI tầng** — ngược khuyến nghị *"phương án A cho v1"* của `04_TO_BE_FLOWS`. Câu lỗi rõ ở ứng dụng **cộng** một lưới an toàn trong cơ sở dữ liệu, đúng bài học M07-B: *"một điều chỉ đúng trên màn hình không phải một bảo đảm"* |
| **D-159** | **BR-M08-Y1** — bốn vai trò cấp xứ đoàn vừa tạo đề xuất vừa tự bấm Duyệt cho chính đề xuất mình vừa tạo; `05_BUSINESS_RULES` hỏi *"có phải chủ ý không"* | **Không siết, mà BỎ BỚT MỘT BƯỚC.** Bốn vai trò ấy có **một nút "Chuyển lớp"** duy nhất, hỏi lại một lần rồi xong. 🔴 **0 thay đổi phân quyền** — đúng bốn vai trò ấy hôm nay đã làm được việc này, chỉ là phải diễn qua hai biểu mẫu. Bắt buộc làm **nguyên tử trong một RPC**: hai lệnh nối nhau mà lệnh sau hỏng sẽ để lại **đúng cái đề xuất mồ côi** mà D-158 vừa được chốt để diệt |

#### Đợt M08-A — chi tiết

**Phạm vi: 0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.**

1. 🔴 **Hạng mục 1 — lỗi `CRITICAL` duy nhất của module (M08-F01, 38/75) là một phép nhân.**
   `getPromotionsPageData` cũ gọi `canProposeForClass` — **hai truy vấn** — cho **mỗi** ghi danh
   trong một `Promise.all` (`queries.ts:98-101`), và đọc **mọi năm học**, không lọc, không phân
   trang (`:83-93`). Với ~900 em toàn xứ đoàn: **~1.800 lượt đi về cơ sở dữ liệu cho một lượt mở
   trang**. Nay `getRepresentativeClassIds` hỏi **một lần cho cả trang** — *"tôi là đại diện của
   những lớp nào"* — và cả trang dùng **3–5 lượt gọi cố định** (AC-13 đòi ≤ 6): năm học hiện hành
   (`React.cache`, vỏ ứng dụng đã gọi nên thường tốn **0**) · lớp đang hoạt động · ghi danh của năm
   · đề xuất của năm · cộng hai lượt tra phân công **chỉ với người không thuộc cấp xứ đoàn ghi
   được**.
   ⚠️ **Lọc và cắt trang làm trong Node, không trong SQL — và đó là lựa chọn có lý do, không phải
   lười.** Phép lọc theo trạng thái hỏi *"ghi danh này CÓ dòng đề xuất nào không"*, một phép nối
   trái mà PostgREST không diễn đạt được kèm `range()` trong một lượt gọi; cách duy nhất làm ở tầng
   cơ sở dữ liệu là gửi vài trăm UUID trong chuỗi truy vấn, thứ vỡ ở giới hạn độ dài URL. Điều
   AC-13 thật sự đòi — *"số truy vấn ≤ 6, **không phụ thuộc số dòng**"* — vẫn đúng nguyên vẹn.
2. **Bảng tiến độ theo lớp lần đầu tồn tại** (TO-BE 1 bước 1 / AC-12): `Lớp · Sĩ số · Chưa đề xuất
   · Chờ duyệt · Đã duyệt · Từ chối`. `06_UI_UX_RECOMMENDATIONS` §1 chấm đây là khoảng trống lớn
   nhất của trang. **Mỗi con số là một liên kết** dẫn thẳng vào đúng lớp ở đúng trạng thái — và đó
   cũng là cách **BR-M08-15** (*"mặc định lọc `pending` cho người duyệt"*) được đáp ứng mà **không**
   làm cùng một đường dẫn mang nghĩa khác nhau với hai người khác nhau, thứ sẽ phá đúng tính chất
   *"chia sẻ được"* mà TO-BE 1 bước 2 đòi. 🔴 Phép đếm chạy **trên cả phạm vi, không trên trang
   đang xem** — đúng cái bẫy M12-B đã vấp và ghi lại; ở đây hậu quả nặng hơn vì bảng tiến độ là thứ
   **duy nhất** trả lời được câu *"còn bao nhiêu em nữa thì xong"*.
3. **BR-M08-14 — chỉ ghi danh của năm học hiện hành.** Bản cũ đọc **mọi** năm (BR-M08-Y3), nên đề
   xuất đã duyệt của các năm trước tích tụ mãi trên cùng màn hình với việc đang phải làm. Phạm vi
   được **nói thẳng ra trên trang**, không im lặng (bài học D-108).
4. 🔴 **BR-M08-X2 — `docs/03` WF-11 đòi *"mặc định giữ nhánh A/B"* từ đầu, và hệ thống chưa bao giờ
   làm.** Ô lớp đích lấy **phần tử đầu** danh sách đã sắp theo tên (`promotion-board.tsx:52`), nên
   mọi em lớp **Ấu 1B** đều được đề xuất sẵn sang **Ấu 2A**. Hệ quả thứ hai nặng hơn hệ quả thứ
   nhất: ô ấy **tự chọn sẵn một giá trị hợp lệ**, nên một cú bấm "Lưu đề xuất" ra một đề xuất trông
   hoàn chỉnh mà người dùng **chưa thực sự quyết định** — đúng điều `03_AUDIT_RESULTS` tiêu chí 5
   trừ điểm. Lớp không chia nhánh (Thiếu 3 → Nghĩa 1) rơi về phần tử đầu, đúng, vì ở đó không có gì
   để *"giữ"*.
5. 🔴 **Mười một tên luật của RPC đi qua đúng HAI câu tiếng Việt.** `20260722000700_promotions.sql`
   có **14** lời `raise exception` mang **11** tên luật khác nhau; `actions.ts` cũ ánh xạ chúng qua
   **5** mã `SQLSTATE`, riêng `23514` gánh **sáu** tên và trả một câu duy nhất *"Lớp đích hoặc trạng
   thái chuyển lớp không hợp lệ."*. Ca tệ nhất là `ENROLLMENT_NOT_OPEN`: câu ấy chỉ thẳng vào ô
   "Lớp đích", nhưng lớp đích **không phải chỗ hỏng** — ghi danh đã đóng thì không đề xuất nào hợp
   lệ, nên người dùng đổi lớp đích, bấm lại, và hỏng y hệt. Kèm: ba câu `schemas.ts` **tự viết từ
   Phase 5** (*"Vui lòng chọn lớp đích."* · *"Đề xuất Dự trưởng không chọn lớp đích."* · *"Trạng
   thái này không có lớp đích."*) **chưa từng hiện ra một lần nào**, vì `failure()` đổi mọi
   `ZodError` thành *"Không thể xử lý chuyển lớp. Vui lòng thử lại."* — một câu vừa vô dụng vừa
   **nói sai**, vì *"thử lại"* là lời hứa rằng bấm lại sẽ được.
6. **Hạng mục 9 — gỡ một phụ thuộc chéo SAI NGỮ NGHĨA giữa hai feature.** `promotions/server/permissions.ts`
   import `hasGlobalResultWrite` từ `@/features/assessments/server/permissions`: quyền chuyển lớp
   không phải một loại quyền chấm điểm, và mọi lượt sửa luật khoá bảng điểm về sau sẽ **lặng lẽ đổi
   luôn ai được đề xuất chuyển lớp**. Định nghĩa dời về `@/lib/permissions/roles` cạnh `GLOBAL_ROLES`
   / `SECTOR_ROLES` / `CLASS_ROLES`; tên cũ giữ làm bí danh nên **không bài kiểm nào của M07 phải
   sửa một chữ**.
7. **Nợ #14 — trả cho `promotions`.** Guard nay gọi **ngoài `try`** và bằng `requireRouteAccess`, nên
   luật *"Thủ quỹ không vào `/promotions`"* (BR-M08-23 / SEC-01) được thi hành ở **cả hai** tầng, và
   người vừa hết phiên được đưa về `/login` thay vì đọc một câu mời họ thử lại đúng thứ vừa hỏng.
   ⚠️ **Đính chính danh sách nợ:** mục #14 ghi `absence-requests` là còn nợ — **sai**, M05-B đã trả
   rồi (`parentRouteContext()` gọi `requireRouteAccess` ngoài `try`). Còn đúng **3 module**:
   `theme` · `reports` (M11) · `notifications` (M10).
8. ✅ **Kiểm chéo bàn giao từ M07-B — ĐÃ ĐO, không chỉ đọc code.** `07_IMPLEMENTATION_IMPACT` của
   M07 §8 gọi đây là *"cảnh báo, không phải tùy chọn"*: từ M07-B một cột điểm **ẩn được**, và ẩn
   một cột là **đổi con số trung bình có trọng số** mà M08 đọc để cảnh báo. Kết quả: khung nhìn
   `v_student_weighted_average` **đã có** `and assessment.is_active` ngay trong mệnh đề `join` từ
   Phase 5, nên hai bên vốn đã nhất quán. 🔴 **Nhưng một điều đúng khi đọc không phải một điều đã
   được đo** — và đây đúng loại bất biến hỏng im lặng: ai đó viết lại khung nhìn mà quên vế ấy thì
   bảng điểm hiện một số, đề xuất chuyển lớp chụp một số khác, không màn hình nào báo sai, và người
   duyệt quyết định trên số cũ. pgTAP `019` nay có **4 bài** đo hai con số thật: hai cột hệ số 1,
   điểm 10 và 4 ⇒ **7,00**; ẩn cột 4 điểm ⇒ **10,00**.
9. **Nghiệm thu 15 mục (`11` §5) — phần đợt này chạm tới.** Bốn `<select>` trần cuối của module về
   `Select`; hai ô chọn chính có `id` + `htmlFor` thật (trước chỉ có `<span>` trong `<label>` bọc);
   thông báo kết quả đi qua `FormMessage` nên tự mang `role="alert"`/`role="status"`; ô tick "Dự
   trưởng" từ ~13–16px lên vùng chạm đạt chuẩn; hai ô ghi chú 1.000 ký tự đổi từ `<Input>` một dòng
   sang `Textarea`. Trạng thái rỗng dùng đúng loại chuẩn — và câu chữ **cố ý không khẳng định**
   *"bạn chưa phụ trách lớp nào"*, vì bảng tiến độ rỗng ở **hai** tình huống khác hẳn nhau (chưa
   được phân công lớp ↔ có lớp nhưng lớp chưa có em nào ghi danh); chọn một rồi nói chắc là dẫn
   người dùng đi sai chỗ.
10. ⚠️ **Ô *"Lớp đích khi duyệt"* từng là một ô `required` RỖNG KHÔNG GIẢI THÍCH.** Khi năm học kế
    tiếp chưa có lớp nào đúng cấp, ô ấy không có `<option>` nào; người duyệt bấm "Duyệt", trình
    duyệt chặn im lặng, và không một chữ nào nói vì sao (`06_UI_UX_RECOMMENDATIONS` §4). Nay chỗ đó
    là một câu chỉ đường: *"Năm học kế tiếp chưa có lớp nào đúng cấp để nhận em này…"*.
11. 🔴 **`results.spec.ts` phải viết lại, và điều đó làm lộ ra một sự thật đáng ghi:** bài ấy là bài
    E2E **duy nhất** chạy hết đường **ghi** của module chuyển lớp — AC-01 (đề xuất) → AC-04 (duyệt
    nguyên tử) rồi đọc thẳng cơ sở dữ liệu để chứng minh giao dịch. Nó làm được vì fixture **tự dựng
    thêm** năm học 2027-2028 và một lớp đích cho mỗi viewport; `seed:dev` **không có năm kế tiếp
    nào**, nên `promotions.spec.ts` mới **không thể** lặp lại đường ghi ấy và cố ý không lặp — nó lo
    phần TO-BE 1 mà bài kia không chạm tới, và **không ghi một dòng nào** (bảng `promotion_reviews`
    không có đường xoá — BR-M08-Y2 — nên một bài ghi ở đây là không dọn lại được, đúng bẫy nợ #10
    vế (b)).

**Đo được:** unit **1282 pass / 10 skip** (trước 1224, **+58**) · pgTAP **1162/1162** (trước 1158,
**+4**) · lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang** · `promotions.spec.ts` **48/48
xanh cả ba viewport** · **E2E toàn bộ 463/468** trên DB vừa `db:reset` + `seed:dev`, 21,7 phút.

⚠️ **Năm bài đỏ = 1,07 %**, thấp hơn 2,4 % của M07-C — nhưng **mẫu số cũng đổi** (420 → 468 vì
`promotions.spec.ts` là spec mới), nên hai tỷ lệ không so sánh trực tiếp được. Ba bài rớt ở *"ghi
xong, trạng thái mới chưa hiện"* (chữ ký **nợ #10**), hai bài rớt ở `page.waitForURL` (chữ ký **nợ
#15**). **Không bài nào rớt ở một khẳng định về nghiệp vụ, và không bài nào thuộc luồng chuyển
lớp.** `results.spec.ts` xanh ở `tablet-768` và `laptop-1366` **gồm cả phần đề xuất/duyệt vừa viết
lại**; riêng `mobile-360` rớt ở bước **thẻ Top 5 của M07**, tức **trước** phần chuyển lớp, nên trên
viewport ấy các bước mới chưa được chạy tới.

⏸️ **Cố ý CHƯA làm ở đợt A, và lý do:**

- **Hạng mục 2** (`ConfirmDialog` cho "Duyệt" + bắt buộc lý do khi "Từ chối") — `07` §3 xếp nó
  **thứ hai**, ngay sau hạng mục 1, và nó **rẻ**. Hoãn sang đợt C là một quyết định có giá phải
  trả: **nút "Duyệt" hôm nay vẫn không hỏi lại**, trong khi duyệt là thao tác đóng ghi danh cũ và
  mở ghi danh mới **không có đường lùi**. Lý do hoãn: `11` §4 bước 3 buộc sửa nghiệp vụ trước rồi
  mới sửa giao diện, mà **D-159** sẽ **đổi hẳn nội dung câu hỏi** cho bốn vai trò cấp xứ đoàn (một
  nút "Chuyển lớp" thay cho hai biểu mẫu) — làm hộp xác nhận bây giờ là làm hai lần, đúng bài học
  nợ #1 ở M07.
- **Đề xuất hàng loạt** (hạng mục 4) — `07` §1 ghi rõ nó **phụ thuộc hạng mục 1** vì cần bảng có ô
  đánh dấu. Bảng đã có ở đợt này; phần chọn nhiều dòng thuộc đợt C.
- **Nợ #18** cho bảng của module — thuộc đợt B vì cần migration. 🔴 Trước khi viết phải xác định
  bảng ghi qua đâu: `promotion_reviews` chỉ có `grant select` cho `authenticated`
  (`…promotions.sql:342`) và **mọi** đường ghi đi qua RPC `security definer` ⇒ điều kiện thêm vào
  policy **không bao giờ chạy**. Đây là ca **RPC**, khuôn M05-A, **không** phải khuôn M02-C.

> **Đợt M08-B không có mục "chi tiết" riêng ở đây** — phiên ấy ghi toàn bộ vào ghi chú đầu file
> (`Cập nhật lần cuối`) và vào `00_SYSTEM_AUDIT_BOARD.md` dòng `M08-F03/F10`. Ghi lại đường đi để
> người đọc sau không tưởng là thiếu.

#### Đợt M08-C — chi tiết ⇒ **ĐÓNG MODULE 11 (M08)**

**Phạm vi: 1 migration · 0 thay đổi phân quyền · 0 `alter table` · 0 dòng dữ liệu bị đụng.**

Ba nợ cuối của module, và cả ba đều đã được **hai đợt trước ghi ra và cố ý hoãn**.

1. 🔴 **AC-14 — nút "Duyệt" lần đầu hỏi lại, sau khi mang nợ qua CẢ HAI đợt trước.**
   `06_UI_UX_RECOMMENDATIONS` §3 xếp mục này mức **Cao**: *"nút 'Duyệt' không có xác nhận, dù nó
   đóng ghi danh cũ và tạo ghi danh mới không lùi được"*. Lý do hoãn vẫn đúng khi nhìn lại —
   **D-159** ở đợt B đã đổi hẳn nội dung câu hỏi cho bốn vai trò cấp xứ đoàn — nhưng cái giá là
   thật: suốt hai đợt, một cú bấm nhầm là một ghi danh bị đóng không có đường lùi.
   ⚠️ **Hộp này KHÔNG phải bản sao của hộp "Chuyển lớp" (D-159), và chỗ khác nhau quyết định câu
   chữ:** ở đường một bước, người bấm xác nhận **quyết định của chính mình**; ở đây họ thi hành
   **quyết định của người khác** — một đại diện đã đề xuất từ nhiều ngày trước. Vì thế câu hậu quả
   in **lớp đang sắp ghi vào**, không in lại lớp trong đề xuất, và **nói ra khi hai thứ đó khác
   nhau** (*"đại diện lớp đề nghị Ấu 2B, bạn đang chọn Ấu 2A"*) — ô "Lớp đích khi duyệt" là một
   `<Select>` sửa được, và một cú lăn chuột đủ để đổi giá trị mà không ai bấm gì.
2. **AC-15 — từ chối bắt buộc nêu lý do, chặn ở CẢ HAI tầng.** AC-15 viết thẳng *"hiện lỗi **và**
   server cũng từ chối (Zod), không chỉ chặn ở client"*. Luật nằm trong `promotionReviewSchema` chứ
   không trong action, và đó là một lựa chọn có lý do: nó chỉ nhìn vào **chính đầu vào** nên đặt
   được ở chỗ mọi đường gọi đều phải đi qua; luật bí tích (AC-16 vế ba, M08-B) thì phải đọc
   `warning_snapshot` của hàng review nên buộc ở lại tầng action.
   ⏸️ **Nút "Từ chối" cố ý KHÔNG có hộp xác nhận**, và `04_TO_BE_FLOWS` TO-BE 6 cũng chỉ đòi hộp cho
   "Duyệt": từ chối **lùi được** (đại diện sửa rồi gửi lại — BR-M08-16), và từ M08-B lần từ chối ấy
   còn nằm lại vĩnh viễn trong nhật ký (D-157). Chồng cả hai lên nhau là dạy người dùng bấm "Xác
   nhận" theo phản xạ, thứ làm hộp của "Duyệt" mất tác dụng.
3. 🔴 **AC-20 — đề xuất hàng loạt, và chủ dự án chốt phạm vi NGƯỢC với phương án an toàn nhất
   (D-164).** `04_TO_BE_FLOWS` TO-BE 2 đo cái giá của bản cũ: **30 em × 3 thao tác = 90 lượt** so
   với **4 lượt**. Câu hỏi phải quyết là *"Chọn tất cả" chọn tới đâu* — chỉ 25 em đang hiện trên
   trang, hay mọi em khớp bộ lọc kể cả trang sau. Chủ dự án chọn **kể cả trang sau**, đúng nguyên
   văn AC-20 (*"lớp Ấu 1A có 28 em"*), và **biết trước cái giá**: người bấm xác nhận một danh sách
   dài hơn thứ họ đang nhìn. Hai điều bù lại là bắt buộc — hộp xem lại **liệt kê đủ tên từng em**
   (`11` §5), và con số nói ra **ngay trên nút** cộng một dòng *"trong đó N em ở trang khác"*.
   ⚠️ **Danh sách chọn KHÔNG dựng từ `roster`** — `roster` đã bị cắt về 25 dòng của trang đang xem,
   nên dựng từ đó là bỏ quên em thứ 26 trở đi, tức bỏ đúng điều vừa được chốt. Nó dựng từ tập **đã
   lọc, chưa cắt trang**, và **không tốn thêm một truy vấn nào** vì tập ấy đã nằm sẵn trong bộ nhớ.
4. 🔴 **"Chọn tất cả" trên bộ lọc *"Tất cả lớp"* là một cái bẫy, và nó được chặn TRƯỚC khi gửi.**
   Một lượt như thế gom em của Ấu 1, Thiếu 2 và Nghĩa 3 vào cùng một danh sách, mà **không lớp đích
   nào đúng cho cả ba** — `propose_promotion` sẽ ném `PROMOTION_TARGET_INVALID` cho hầu hết. Gửi đi
   rồi mới báo là bắt người dùng ngồi đợi 60 lượt gọi để nhận về 55 dòng đỏ. Nay `batchTargetScope`
   nhận ra lượt chọn trộn nhiều cấp và nói thẳng trên biểu mẫu, nút bị khoá; hai trạng thái **không
   có lớp đích** ("Tạm nghỉ" · "Rút học") vẫn chạy bình thường vì chúng không có gì để sai.
   Trần **60 em** một lượt (`04_TO_BE_FLOWS` TO-BE 2) được thi hành ở **cả** giao diện lẫn Zod, và
   phần bị cắt **được nói ra** — cắt im lặng là đúng cái bẫy M12-B đã ghi lại.
5. 🔴 **Hạng mục 8 — và phụ thuộc mà M08-B để ngỏ hoá ra là một câu TRẢ LỜI KHÔNG.** `07` §2.4 ghi
   một điều kiện chưa ai đo: *"cần xác nhận RLS `profiles` cho phép staff đọc `display_name` của
   staff khác"*. Đo rồi: `profiles_select_self_or_global` chỉ mở cho **chính mình** hoặc
   `app.can_global_read()` — sáu vai trò cấp xứ đoàn — và **hai người dùng chính của trang này**
   (Trưởng ngành duyệt · GLV đại diện đề xuất) **không nằm trong sáu**. Làm hạng mục 8 bằng một phép
   nhúng `profiles(display_name)` sẽ cho họ một cột `null` **trong im lặng**: tính năng có trong mã
   nguồn mà vắng mặt đúng ở người cần nó nhất, và biên bản audit chấm mục này mức **Cao** với lý do
   *"người duyệt cần biết nguồn"*.
   **D-163 — chủ dự án chốt mở một CỬA SỔ HẸP, không nới `profiles`.** Cùng khuôn D-97 (ô "Người
   mượn" của kho thiết bị) và D-129 (Thủ quỹ), và cùng một lý do đã ghi ở D-129: **RLS lọc theo
   DÒNG, không theo CỘT** — thêm một nhánh vào `profiles` là mở luôn `username` · `phone` · `email`
   · `account_status` · `last_login_at` của **mọi** tài khoản cho mọi Giáo lý viên, để đổi lấy đúng
   một cột tên. `list_promotion_actor_names` chép **nguyên vị từ** của `promotion_reviews_select_scope`
   (definer bỏ qua RLS nên phải chép lại — bài học D-160) và chỉ trả về người **đã ra quyết định**:
   nó **không phải một cuốn danh bạ**, và pgTAP `047` có bài canh riêng ca ấy bằng một tài khoản có
   thật chưa từng thao tác gì.
   ⚠️ **Bài quan trọng nhất của `047` là bài CANH HIỆN TRẠNG:** sau migration, GLV đại diện đọc
   thẳng `public.profiles` **vẫn chỉ thấy đúng một hàng** — hàng của chính mình. Đó là thứ phân biệt
   "một cửa sổ hẹp" với "một lần nới quyền", và nó là cùng hình dạng bài S-06 của D-129.
6. ⚠️ **Cái giá đo được của D-163: trang chạm ĐÚNG TRẦN 6 lượt gọi của AC-13.** Bản M08-A dùng
   **3–5**; đợt này thêm lượt gọi cửa sổ hẹp thành **4–6**, và 6 là ca người **không** thuộc cấp xứ
   đoàn ghi được. AC-13 cho trần đúng 6, nên **hạng mục nào sau này cần đọc thêm bất cứ thứ gì trên
   trang này sẽ VƯỢT** — phải gộp vào một trong sáu lượt đang có, không được thêm lượt thứ bảy. Ghi
   ra đây vì đây là loại ràng buộc chỉ lộ khi có người vô tình phá.
7. **Nghiệm thu 15 mục (`11` §5) — phần đợt này chạm tới.** Ô tick chọn hàng loạt đạt vùng chạm
   44px ở **mọi** cỡ màn (không chỉ điện thoại) và mang `aria-label` **nêu tên em** — 25 ô tick
   giống hệt nhau thì trình đọc màn hình không nói được ô nào của ai; hai `Select` mới có `id` +
   `htmlFor` thật; thông báo kết quả đi qua `FormMessage` nên tự mang `role="alert"`/`role="status"`;
   hai `ConfirmDialog` mới **nêu hậu quả bằng tên riêng** (hộp hàng loạt liệt kê đủ tên từng em, kèm
   huy hiệu *"đã có đề xuất"* cho em sẽ bị ghi đè); `grep` `<select` trần trong module ra **0**.
8. 🔴 **MỘT LỖI THẬT VÀ MỘT LỖI BUILD LỌT QUA, và cách chúng bị bắt là hai chuyện khác nhau.**
   **(a)** Lượt E2E đầy đủ đầu tiên đỏ **15 bài**, trong đó `promotions.spec.ts` và `results.spec.ts`
   đỏ ở **cả ba viewport** — và *đỏ đều ở mọi viewport* chính là chữ ký phân biệt một **thay đổi
   hành vi** với nợ #10 (vốn đổi chỗ giữa các lượt). Hai nguyên nhân, cả hai đều là **bộ test chưa
   theo kịp mã**, không phải mã sai: `results.spec.ts` bấm "Duyệt" rồi đọc thẳng cơ sở dữ liệu, nên
   khi AC-14 thêm hộp xác nhận thì ghi danh vẫn `active`; và `getByRole("button", {name: "Lọc"})`
   khớp **hai** nút vì phép so tên của Playwright mặc định là **chứa chuỗi**, mà nút mới tên là
   *"Chọn tất cả N em khớp bộ lọc"*. Đã sửa cả hai ở tầng **bộ test** (thêm bước xác nhận thật ·
   `exact: true`), **không** đổi câu chữ giao diện để né bộ định vị.
   **(b)** Một chú thích JSX đặt sai chỗ (`{/* … */}` ngay sau `? (` trong biểu thức ba ngôi) làm
   `next build` **hỏng cú pháp** — và nó lọt qua vì tôi sửa **sau** lượt `build`/`typecheck` đã
   chạy. Bài học đúng một câu: **lượt kiểm cuối phải chạy trên đúng bản mã cuối**; đã chạy lại đủ
   `typecheck` · `lint` · `test` · `build` sau khi sửa.

**Đo được:** pgTAP **1233/1233** (trước 1215, **+18**, file mới `047` toàn bộ **JWT thật của 8 vai
trò**) · unit **1385 pass / 10 skip** (trước 1322, **+63**) · lint **0 warning** · typecheck ✓ ·
build ✓ **28/28 trang** · **E2E toàn bộ 477/486** trên DB vừa `db:reset` + `seed:dev`, **22,7 phút** ·
`promotions.spec.ts` **60/60 xanh cả ba viewport** (trước 57/57).

⚠️ **9 đỏ = 1,85 %, TĂNG so với 1,68 % của M08-B, và tôi không giấu con số đó** (mẫu số cũng đổi
477 → 486 vì đợt này thêm 3 bài × 3 viewport, và cả 9 bài mới đều xanh). Phân loại bằng **ảnh chụp
lỗi**, không bằng phỏng đoán — đúng bài học M05-C:

- **6 bài** để lại nút *"Đang lưu…" / "Đang tạo…" / "Đang thêm…" / "Đang mở…"* ở trạng thái vô hiệu
  ⇒ chữ ký **nợ #10** (`class-settings` · `results` ×2 · `student-lifecycle` ×2 · `teaching-plan`).
- **1 bài** rớt ở `page.waitForURL` với **0** nút vô hiệu ⇒ chữ ký **nợ #15** (`authenticated-shell`).
- **2 bài** `committees` **không mang chữ ký nào trong hai** — màn hình đã dựng xong mà thiếu đúng
  con số bài test chờ, tức đúng hình dạng mà M05-C dặn là **có thể là lỗi thật**. Đã kiểm chứ không
  đoán: chạy **cô lập trên DB vừa reset + seed**, `committees.spec.ts` + `promotions.spec.ts`
  **75/75 xanh** (2,3 phút). ⇒ Biến số chi phối là **tải máy**, đúng kết luận M04-A đã đo, và
  `committees` **xanh ở cả hai lượt đầy đủ trước đó** của cùng vùng mã.

**Không bài nào rớt ở một khẳng định nghiệp vụ, và không bài nào thuộc luồng chuyển lớp.**

✅ **Và có một bằng chứng dương tính cho AC-14, không chỉ là "không bài nào đỏ":** `results.spec.ts`
— bài E2E **duy nhất** chạy hết đường ghi của module — **xanh trọn vẹn trên `mobile-360`**, tức hộp
xác nhận mới **đã được bấm qua** và giao dịch duyệt vẫn đúng (ghi danh nguồn `completed`, ghi danh
mới `active`, `ended_on` đúng ngày). Trên `tablet-768` và `laptop-1366` nó rớt ở bước **công bố Top
5 của M07**, tức **trước** phần chuyển lớp.

---

### Module 12 — M10 Thông báo · chia ba đợt · ✅ **ĐÓNG 2026-08-10**

`03_AUDIT_RESULTS` chấm module **61,6/75** — điểm trung bình cao thứ nhì trong 2B — nhưng **2 luồng
`CRITICAL`**, và khoảng cách ấy chính là chuyện đáng ghi của module này. Bảy trong chín luồng `PASS`
với điểm rất cao (F04 đạt **74/75**); hai luồng còn lại hỏng vì **một dòng mã vắng mặt**, lặp lại ở
hai chỗ.

`07_IMPLEMENTATION_IMPACT` §1 gọi hạng mục 1 là *"chênh lệch chi phí/giá trị lớn nhất trong cả dự
án"*: **nửa ngày công, gỡ trọn cả hai lỗi CRITICAL, không migration, không đụng phân quyền.**

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M10-A** | Hạng mục **1** — gỡ **cả hai** lỗi CRITICAL bằng hai dòng `.eq("profile_id", …)`. Kèm **AC-02-01/02** (nói ra số người nhận thật, cảnh báo khi gửi vào hư không) và **nợ #14** (mẫu guard D-96). **0 migration · 0 thay đổi phân quyền** | ✅ **XONG 2026-08-09** |
| **M10-B** | **CÓ MIGRATION.** **D-165** mã chống gửi đúp · **D-167** sửa nhánh gửi đích danh · hàm dùng chung `app.notification_audience` cho phép đếm trước khi gửi (**BR-M10-24**) · **AC-06-01** hộp xem lại · **TB-M10-03** bộ chọn "Một người". **0 thay đổi phân quyền** | ✅ **XONG 2026-08-09** |
| **M10-C** | **CÓ MIGRATION, và là migration DUY NHẤT của module có đụng hàng rào đọc.** **D-166** thu hồi mềm · **AC-07-01** mục "Tôi đã gửi" · **TB-M10-06** lọc chưa đọc · chip phạm vi · phân trang | ✅ **XONG 2026-08-10** ⇒ **đóng module 12** |

#### Bốn quyết định chủ dự án chốt trước và trong lúc làm

| Mã | Câu hỏi | Chốt |
|---|---|---|
| **D-165** (Q-1) | `07` §6 ghi *"khoá chống trùng là gì?"* — `docs/11 §18` mới **liệt kê** yêu cầu idempotency mà chưa định nghĩa khoá | **Mã yêu cầu do giao diện sinh.** Chặn được cả ba đường: bấm hai lần · mạng gửi lại · hai tab. Hai phương án kia bị loại có lý do: chặn ở giao diện không chống được retry mạng; chặn theo "cùng tiêu đề + cùng phạm vi + vài phút" **chặn nhầm** người cố ý gửi lại |
| **D-166** (Q-2) | Có làm chức năng thu hồi không, và thu hồi là *ẩn* hay *giữ kèm nhãn*? | **Thu hồi mềm**, **tác giả + bốn vai trò cấp xứ đoàn**, **không giới hạn thời gian**, **lý do bắt buộc**, **người nhận vẫn thấy dòng ấy kèm nhãn "Đã thu hồi"**. Lý lẽ của chủ dự án về vế thời gian đáng ghi nguyên văn: *"biện pháp an toàn không phải đồng hồ mà là nhật ký"* — sai sót thường bị phát hiện muộn, một phụ huynh nhắn lại sau hai tiếng thì cửa 15 phút đã đóng |
| **D-167** (Q-3) | Người chưa có phân công vai trò có nên nhận được thông báo gửi đích danh không? Hiện là *"không"*, **và không ai biết** | **Phải nhận được.** Tình huống thật hay gặp nhất đúng là nó: vừa tạo tài khoản cho một anh/chị mới, muốn nhắn hướng dẫn đăng nhập **trước khi** phân công |
| **D-168** | 🔴 **Mâu thuẫn giữa hai tài liệu module, phát hiện lúc thiết kế đợt C.** `07` §4 đòi hàng rào đọc **loại trừ** bản đã thu hồi ⇒ nó biến mất; `04_TO_BE_FLOWS` TB-M10-05 đòi hộp thư **hiển thị** *"Thông báo này đã được thu hồi"* ⇒ nó ở lại. **Hai điều không thể cùng đúng** | **Cả hai, bằng một cờ nhân bản.** Hàng rào đọc giấu hẳn bản ghi khỏi người nhận (đúng `07` §4) nên nội dung sai không đọc tiếp được kể cả gọi thẳng Data API; cờ `notification_recipients.notification_retracted_at` do trigger giữ đồng bộ là thứ họ vẫn đọc được, nên nhãn dựng được (đúng TB-M10-05). Chủ dự án chốt vế người dùng: **ở lại kèm nhãn**, vì *"họ CÓ THỂ đã đọc rồi"* |

#### Đợt M10-A — chi tiết

**Phạm vi: 0 migration · 0 thay đổi phân quyền · 0 dòng dữ liệu bị đụng.**

1. 🔴 **Cả hai lỗi CRITICAL là MỘT lỗi, và nó là một dòng VẮNG MẶT.**
   `getUnreadNotificationCount` (`queries.ts:42-49`) và truy vấn hộp thư (`:111-115`) đều thiếu
   `.eq("profile_id", …)`. Với 8/14 vai trò thì **không sao** — hàng rào của cơ sở dữ liệu vốn đã
   lọc đúng cho họ. Với 6 vai trò cấp xứ đoàn, policy có thêm nhánh `or app.can_global_read()` để
   phục vụ **mục đích quản trị**, nên hai truy vấn ấy trả về **toàn hệ thống**: chuông đếm chưa đọc
   của cả xứ đoàn (*"99+"* và **không bao giờ về 0**), hộp thư cá nhân là *"50 dòng người-nhận mới
   nhất của toàn hệ thống"* — kể cả **nội dung thư riêng gửi cho người khác** — nhãn "Mới" lấy
   `read_at` của người khác, nút "Đánh dấu đã đọc" **bấm mãi không tắt**, và thông báo thật sự dành
   cho họ **bị đẩy khỏi 50 dòng đầu** ⇒ bỏ lỡ thông báo.
   Sửa ở **truy vấn**, không sửa ở policy — `07` §4 nói thẳng: nhánh `can_global_read` vẫn cần cho
   màn hình quản trị, và bài học 5 Whys là *"hàng rào bảo mật trả lời **được phép** thấy gì, truy
   vấn phải trả lời **muốn** thấy gì"*. Ghi thành **BR-M10-20**.
2. 🔴 **Bài quét mã nguồn tìm ra CHỖ THỨ BA, ngoài phạm vi audit — và ở một trang nặng hơn.**
   Lỗi này không cửa kiểm nào bắt được: mã hợp lệ về kiểu, lint xanh, build xanh, và pgTAP chạy
   bằng phiên của **chính 6 vai trò ấy** cũng xanh vì cơ sở dữ liệu **cố ý** cho họ đọc mọi dòng.
   Bài kiểm duy nhất đúng tầng là quét **văn bản mã nguồn** — cùng khuôn `use-server-exports.test.ts`
   của M06-B. Nó đỏ ngay lượt đầu ở `features/dashboard/server/queries.ts`, **hai chỗ**: ô *"Thông
   báo mới nhất"* của `/dashboard` cũng đọc `notification_recipients` không lọc, tức trang **ai
   cũng đổ vào ngay sau khi đăng nhập** đang hiện tiêu đề thư riêng của người khác cho 6 vai trò
   ấy. Ô đó thuộc **M11** theo `11` §3; đã sửa tại chỗ vì là rò rỉ **cùng loại** với thứ M10-A sinh
   ra để đóng, chỉ tốn một dòng, và chỉ **siết** phạm vi dữ liệu. **Đã bàn giao cho M11.**
3. **AC-02-01/AC-02-02 — SW-04 cho đường ghi nặng nhất của module, và KHÔNG cần migration.**
   `07` §3 ghi hạng mục 2 *"có migration — đổi kiểu trả về RPC"*. Đo lại thì không cần: cột
   `notifications.recipient_count` **đã tồn tại từ Phase 6** và được `materialize` ghi trong cùng
   giao dịch, còn policy đã mở cho `author_profile_id = auth.uid()` — tác giả đọc lại được ngay.
   Trước đợt này câu trả lời luôn là *"Đã gửi thông báo."*, **kể cả khi nó tới không một ai**.
4. **Nợ #14 (D-96) — module này mắc CẢ HAI vế**: guard nằm **trong** `try` nên `catch` nuốt mất
   `redirect()` của Next (người hết phiên đọc *"Không thể xử lý thông báo. Vui lòng thử lại."* —
   một câu **mời họ thử lại đúng thứ vừa hỏng**), và dùng `requireAuthContext` thay
   `requireRouteAccess`. Nay `notificationsRouteContext()` gọi **ngoài `try`** ở cả ba thao tác.

**Số kiểm thử thật của đợt A:** unit **1402 pass / 16 skip** (trước 1385/10) · lint 0 warning ·
typecheck ✓ · build ✓ 28/28 trang · integration `m10-inbox-scope` **6/6 bằng JWT thật** của Thư ký
và Giáo lý viên lớp.

#### Đợt M10-B — chi tiết

**Phạm vi: 1 migration · 0 thay đổi phân quyền · 0 policy bị sửa · 0 dòng dữ liệu bị đụng.**

1. 🔴 **D-167 nằm ở CẤU TRÚC của truy vấn, không phải ở một điều kiện thêm vào.**
   Bản cũ có **một** mệnh đề `from` dùng chung cho cả 7 phạm vi, trong đó phép nối bắt buộc với
   `role_assignments … is_active` (`20260723000400:127-128`). Phép nối ấy **đúng cho 6 phạm vi
   nhóm** — muốn lọc theo `role`/`sector_id`/`class_id` thì phải có nó — nhưng **sai cho phạm vi cá
   nhân**. Thêm `or` vào mệnh đề `case` **không sửa được**: phép nối nằm ở `from`, tức nó đã loại
   người ta ra **trước khi** `case` được chạy. Nhánh `user` vì thế đứng thành một nhánh `union`
   riêng, không đi qua phép nối.
2. **BR-M10-24 — mệnh đề "ai nằm trong phạm vi" tách thành một hàm dùng chung**
   (`app.notification_audience`), để phép đếm trước khi gửi và phép chốt danh sách người nhận
   **không thể trôi khỏi nhau**. Bài pgTAP quan trọng nhất của việc này là bài **so hai con số với
   nhau**, không phải so từng con số với một phép đếm chép tay — chép tay thì hai bên cùng trôi mà
   bài kiểm vẫn xanh.
3. 🔴 **Phép đếm phải kiểm quyền TRƯỚC khi đếm.** `count_notification_audience` là
   `security definer` nên nó bỏ qua mọi hàng rào đọc; thiếu vế kiểm quyền thì nó thành công cụ đếm
   số phụ huynh của **lớp bất kỳ** cho **bất kỳ ai** — một cửa hậu rò rỉ quy mô tổ chức, mở ra để
   đổi lấy một con số tiện lợi. pgTAP `048` có 4 bài chối bằng JWT thật.
4. **D-165 — đường tắt idempotent phải dừng TRƯỚC bước chốt danh sách người nhận.** Cái bẫy đo
   được: `unique (notification_id, profile_id)` chặn dòng trùng, nên nếu lượt lặp vẫn chạy
   `materialize` thì `row_count` về **0** và `recipient_count` bị ghi đè thành 0 — thông báo tới đủ
   người mà báo cáo là *"chưa tới ai"*. pgTAP có bài canh đúng điều đó.
5. **AC-06-01 — hộp xem lại**, nêu phạm vi **bằng tên riêng**, số người nhận dự kiến, nội dung sắp
   gửi, kèm cảnh báo không lùi được. Con số cũng nói ra **ngay trên nút gửi**. Ca *"chưa đếm được"*
   **không bịa một con số** — người dùng sắp bấm "Xác nhận" dựa vào câu ấy.
6. **TB-M10-03 — phạm vi "Một người" cuối cùng có đường vào.** Chức năng này đã đủ ở cơ sở dữ liệu
   từ Phase 6 nhưng `availableTargets` chưa bao giờ đẩy `"user"` vào danh sách, nên nó trôi trong
   vùng xám giữa *"đã làm"* và *"chưa làm"* suốt hai giai đoạn. Bộ chọn trả tối đa 20 dòng, đòi ít
   nhất 2 ký tự, và **không cần nới một quyền nào**: hàng rào đọc `profiles` mở cho 6 vai trò cấp
   xứ đoàn, mà 4 vai trò gửi được thư riêng đều nằm trong 6.

**Số kiểm thử thật của đợt B:** pgTAP **1259/1259** (trước 1233, **+26**, file mới `048` toàn bộ
JWT thật) · unit **1422 pass / 16 skip** · lint 0 warning · typecheck ✓ · build ✓ 28/28 trang.

#### Đợt M10-C — chi tiết

**Phạm vi: 1 migration · 0 thay đổi phân quyền · 1 policy bị sửa (hàng rào đọc) · 0 dòng dữ liệu bị
đụng · 0 quyền ghi mới cho `authenticated`.**

1. **D-166/D-168 — cờ thu hồi được nhân bản xuống bảng người-nhận, và đó là thứ hoà giải hai tài
   liệu.** Hàng rào đọc giấu hẳn bản đã thu hồi khỏi người nhận ⇒ phép nhúng trả về **rỗng** ⇒ giao
   diện **không còn cách nào** phân biệt *"đã thu hồi"* với *"lỗi dữ liệu"*. Cờ ở bảng người-nhận
   là thứ họ vẫn đọc được. Nó còn gánh việc thứ hai: phép đếm chưa đọc chạy ở **vỏ ứng dụng, trên
   mọi trang**, nên có cờ tại chỗ thì nó vẫn là một lượt đếm **một bảng**. Khuôn này repo đã dùng —
   `sync_assessment_publication` của M07-B, đúng hai lý do trên. Giữ bằng **trigger** chứ không
   phải một lệnh thứ hai trong RPC: đường nào sửa `retracted_at` cũng phải kéo theo cờ.
2. **Tác giả và cấp có quyền đọc toàn cục VẪN thấy bản đã thu hồi** — giấu khỏi cả tác giả thì mục
   "Tôi đã gửi" trống và **nhật ký thu hồi không ai đọc được, tức vô dụng**.
3. 🔴 **BR-M10-20 lặp lại TRONG CHÍNH LƯỢT SỬA NÓ, ở bảng thứ hai.** Bản nháp đầu của
   `getSentNotifications` không có `.eq("author_profile_id", …)`. Cùng một policy có ba nhánh —
   tác giả · **quyền đọc toàn cục** · người nhận — nên với 6 vai trò cấp xứ đoàn, mục nhan đề *"Tôi
   đã gửi"* sẽ liệt kê thông báo **của cả xứ đoàn**, và 4 trong 6 vai trò ấy còn bấm được nút "Thu
   hồi" trên đó. Bài quét của đợt A **không bắt được** vì nó chỉ canh `notification_recipients`.
   Nay nó canh **cả hai bảng**, mỗi bảng một cột chủ sở hữu, kèm **đúng một ngoại lệ có tên**: truy
   vấn ghim vào `.eq("id", …)` trả tối đa một dòng đã biết trước id nên không phải danh sách "của
   tôi". **Bài học: một bài kiểm chỉ bảo vệ đúng phạm vi nó quét.**
4. **TB-M10-06 — `range` thay cho `limit` cứng.** Bản cũ lấy 50 dòng đầu và hết: thông báo **thứ 51
   trở đi biến mất hoàn toàn** mà không có gì trên màn hình cho biết là còn nữa. Bộ lọc và số trang
   đi qua `searchParams` nên chép được đường dẫn — cùng lý lẽ với `Pagination` ở `09` §11.
5. **Chip phạm vi mang tên phạm vi bằng chữ**, không phải một mảng màu — `11` §5 cấm dùng màu làm
   tín hiệu duy nhất.

**Số kiểm thử thật của đợt C:** pgTAP **1286/1286** (trước 1259, **+27**, file mới `049` toàn bộ
JWT thật của 4 vai trò) · unit **1448 pass / 16 skip** · lint 0 warning · typecheck ✓ · build ✓
28/28 trang · **E2E toàn bộ 494/507**, `notifications.spec.ts` **21/21 xanh cả ba viewport, 0 skip**
— xem §0 cho phân loại 13 bài đỏ.

#### 🔴 Bốn thứ chỉ lộ ra ở lượt kiểm cuối, và không cửa kiểm nào trước đó bắt được

Ghi lại vì cả bốn đều là **lỗi thật**, không phải chuyện gọt bộ test cho xanh.

1. **Bộ chọn người của đợt B là một `<select>` trần với chuỗi class chép tay** — đúng thứ
   `11` §5 cấm (*"không `<select>` native mới"*). Nay cả **bốn** ô đi qua component `Select`, và
   `<textarea>` qua `Textarea`. Chuỗi class cũ còn viết `border-border`/`bg-card`, tức **bí danh
   token từ trước mục 0.2**.
2. 🔴 **Mọi câu lỗi tiếng Việt của module CHƯA TỪNG hiện ra một lần nào.** `failure()` chỉ giữ
   `message` của `AppError`, nên *"Vui lòng nhập tiêu đề."* · *"Vui lòng chọn đối tượng nhận."* ·
   *"Vui lòng nêu lý do thu hồi."* đều bị nuốt thành *"Không thể xử lý thông báo. Vui lòng thử
   lại."* — một câu **mời người dùng thử lại đúng thứ vừa hỏng**. Đây là **bản sinh đôi** của lỗi
   M07-A đã sửa cho module bảng điểm; lint · typecheck · build · unit đều xanh vì mã **chạy đúng,
   chỉ nói sai**. Thứ tìm ra nó là bài E2E của D-166 bấm "Thu hồi" với ô lý do bỏ trống.
3. **Câu lỗi của bước thu hồi hiện ở ĐẦU TRANG trong khi hộp thoại đang che** — tức một câu lỗi
   người dùng **không nhìn thấy**; họ bấm lại và hỏng y nguyên. Nay nó nằm trong hộp thoại, gắn
   `aria-describedby` vào đúng ô, và hộp thoại **ở lại mở** giữ nguyên chữ đã gõ.
4. **Trạng thái rỗng là một dòng chữ xám**, không phải một trong ba loại chuẩn (`11` §5). Nay dùng
   `EmptyState` loại `no-data`, và **hai ca rỗng nói hai câu khác nhau** — *"đã đọc hết"* và
   *"chưa có gì"* là hai tình huống khác hẳn nhau với người dùng.

#### 🔴 Một cái XANH GIẢ trong bài E2E của chính đợt này

Bài D-166 chờ chuỗi `/Đã thu hồi/` chung chung. Nó khớp **ngay** dòng đã thu hồi của **lượt viewport
trước** nằm trong mục "Tôi đã gửi" — nên bài xanh **trong khi lệnh thu hồi còn đang bay**, rồi bài
điều hướng sang tài khoản khác và **giết luôn thao tác đang được kiểm**. Phát hiện bằng cách hỏi
thẳng cơ sở dữ liệu: `select retracted_at ... where title like 'E2E thu hồi%'` cho **1 dòng đã thu
hồi trên 3 lượt**. Nay khẳng định mang **đúng tiêu đề của lượt đó**, và nội dung thư cũng mang tiêu
đề để chuỗi *"nội dung đã biến mất"* không bị lượt trước làm nhiễu.

⚠️ **Bài học chung với bài AC-01-06:** nó có nhánh `test.skip` khi hộp thư rỗng và vì thế **skip
trên cả ba viewport** — một tiêu chí nghiệm thu **chưa bao giờ chạy một lần nào**, trong khi *"nút
bấm mãi không tắt"* đúng là một trong sáu triệu chứng của CRIT-M10-02. Nay bài **tự dựng dữ liệu
của mình** (Thư ký tự gửi cho chính mình) và chạy thật ở cả ba viewport.

#### Nợ #18 (hàng rào năm học đã đóng) — **KHÔNG áp cho module này**

Đo chứ không đoán: `grep academic_year_id` trên **cả ba** migration của M10 trả về **0 kết quả**.
Không bảng nào của module mang cột năm học, nên không có bề mặt nào để dựng hàng rào — và đúng về
nghiệp vụ: gửi một thông báo trong lúc năm học đã đóng là thao tác bình thường (*"năm học đã kết
thúc, sau đây là việc tiếp theo"*). Dòng nợ #18 ghi *"còn 2 bảng / 2 module: `report_snapshots`
(M11) và bảng của M10"* — vế sau **không tồn tại**. Còn đúng **1 bảng / 1 module**.

---

### Module 13 — M11 Báo cáo & Dashboard · chia ba đợt · ✅ **ĐÓNG 2026-08-12**

`03_AUDIT_RESULTS` chấm module **52/75** ở mức module và **57/75** trung bình 15 luồng — **không luồng
nào `CRITICAL`**, và biên bản nói thẳng vì sao: *"toàn bộ yêu cầu bảo mật của WF-15 đều ĐẠT; các điểm
trừ nằm ở nhất quán số liệu, phân biệt rỗng vs bị chặn và trải nghiệm"*. Hai tiêu chí thấp nhất là
**#5 khó thao tác nhầm (2/5)** và ba tiêu chí 3/5 (#2 dễ hiểu · #7 trạng thái rõ ràng · #9 dữ liệu
nhất quán) — tức module này không hỏng ở chỗ *cho phép sai*, nó hỏng ở chỗ **nói sai**.

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M11-A** | **CÓ MIGRATION.** **D-66** tách quyền *xem/tải* khỏi quyền *chốt* (thay đổi phân quyền thứ **3/6** của `11` §6, **SIẾT**) · **D-169/TB-01** ô "Lớp" của `/dashboard` đếm đúng phạm vi · **TB-04/TB-05** phân biệt ba lý do bảng trống, phạm vi mặc định theo vai trò, nút chốt hỏi luật thay vì chép lại · **nợ #18** (`report_snapshots` — **bảng cuối cùng**) · **nợ #14** (`reports`) · **F06** · **F09** | ✅ **XONG 2026-08-11** |
| **M11-B** | **CÓ MIGRATION.** **D-170** Thủ quỹ đọc số gộp theo lớp bằng **cửa sổ hẹp** (trả nốt nửa còn lại của **D-67** — thay đổi phân quyền thứ **2/6** của `11` §6, **NỚI**) · **D-173** cửa sổ ấy phủ **cả ba chỗ**: bảng báo cáo · kho bản chốt · trang tổng quan · **D-171/TB-08B** ép kỳ = năm học cho báo cáo Kết quả · **D-172 + AC-B09** hộp xác nhận trước khi chốt, nhận ra bản chốt trùng · **D-174** hộp ấy nêu **tên** người chốt qua cửa sổ hẹp thứ hai | ✅ **XONG 2026-08-12** |
| **M11-C** | **CÓ MIGRATION.** **TB-03** dashboard theo `audience` (phụ huynh/thiếu nhi hết gặp ngõ cụt `/access-denied`) · **TB-06** kho bản chốt có lọc/phân trang + trang xem lại · redesign `/reports` theo `09` · **N-2** · **F05** · **F12** · **AC-B15** a11y · **N-6** dựng bộ E2E đầu tiên cho `/reports` và `/dashboard` | ✅ **XONG 2026-08-12** |

#### 🔴 Đợt này thừa hưởng một phiên bỏ dở — và bài học không nằm ở phần mã nguồn

Phiên trước viết xong **migration `20260811000100` · pgTAP `050` · 8 file mã nguồn** (dấu thời gian
17:02 → 21:53) nhưng **không ghi một dòng nào** vào file 16 · `WORKLOG` · `00_SYSTEM_AUDIT_BOARD`
(cả ba dừng ở 16:36). Phiên này phải dựng lại hiện trạng bằng **dấu thời gian của file** thay vì
bằng nhật ký — thứ mà `CLAUDE.md` §8 tồn tại để tránh.

Nặng hơn: **`src/types/database.ts` bị ghi đè thành đúng một dòng**

```
{"_tag":"Error","error":{"code":"LegacyPgDeltaSslProbeError","message":"connect ECONNREFUSED 127.0.0.1:54422"}}
```

vì `npm run db:types` chạy trong lúc Postgres cục bộ đang tắt, và script ấy là
`supabase gen types … > src/types/database.ts` — **dấu `>` cắt trắng file đích TRƯỚC khi lệnh chạy**,
nên lệnh thất bại vẫn phá được file. Hệ quả đo được: `tsc` đỏ ngay **dòng 1**, `next build` không
chạy được ⇒ **cả đợt A chưa từng qua một cửa kiểm nào**. Cách làm đúng, đã dùng ở phiên này: sinh ra
**file tạm**, kiểm nó có phải TypeScript thật không, rồi mới chép đè.

⚠️ **Và nguyên nhân gốc của cả hai không nằm trong repo:** Windows tự giữ chỗ dải cổng **54336–54935**
cho Hyper-V (`netsh interface ipv4 show excludedportrange`), mà **toàn bộ** cổng Supabase của dự án
(54420–54429) nằm gọn trong dải đó ⇒ Docker không mở được cổng nào, kể cả những container báo *"Up"*.
Chủ dự án phải chạy `net stop winnat` / `net start winnat` bằng quyền Administrator rồi
`supabase stop` + `supabase start`. Ghi lại ở đây vì nó sẽ tái phát sau mỗi lần khởi động máy.

#### Đợt M11-A — chi tiết

**Phạm vi: 1 migration · 1 thay đổi phân quyền (`11` §6 D-66, SIẾT) · 0 `alter table` · 0 backfill ·
0 dòng dữ liệu bị đụng.**

1. 🔴 **D-66 — một hàm đang gánh hai câu hỏi, và siết nó là lấy luôn thứ D-66 muốn giữ.**
   `app.can_create_report` từ Phase 6 được dùng cho **cả** `report_snapshots_select_scope` lẫn
   `report_snapshots_insert_scope` (`20260723000500:265,268`). D-66 chỉ bỏ quyền **chốt** của Cha
   sở/Cha phó và **giữ nguyên** quyền xem/tải, nên sửa thẳng hàm ấy là vi phạm chính quyết định
   đang thi hành. Nay hai câu hỏi có hai cái tên: `app.can_read_report` (rộng — chép **nguyên văn**
   luật cũ) và `app.can_create_report` (hẹp — `can_global_write()` · vai trò ngành đúng ngành mình ·
   nhân sự lớp đúng lớp mình).
   **Delta đo được, không suy đoán:** liệt kê lại **14 vai trò × 3 phạm vi** thì mất quyền chốt đúng
   **ba cái tên** — Cha sở · Cha phó · Thủ quỹ. Mọi vai trò khác đứng yên, kể cả ca dễ nhầm nhất là
   Giáo lý viên đại diện ở phạm vi **ngành**: họ **vốn đã không** chốt được, vì `app.can_access_sector`
   so `app.current_sector_id()` — cột `role_assignments.sector_id`, **null** với vai trò cấp lớp.
2. 🔴 **Cái bẫy khi siết, và nó sẽ cho một bộ pgTAP XANH GIẢ.**
   Không được viết hàm hẹp bằng `app.can_access_sector`/`app.can_access_class`: **hai hàm ấy tự gọi
   `app.can_global_read()` bên trong** (`20260715000100:189,199`). Một bản siết chỉ đổi nhánh
   `global` vẫn cho Cha sở chốt ở phạm vi **ngành** và **lớp** — siết đúng **một nhánh trong ba** —
   và một bộ kiểm chỉ đo nhánh `global` sẽ **xanh trọn vẹn** trong khi hai cánh cửa còn mở. pgTAP
   `050` vì thế đo **cả ba nhánh cho từng vai trò**, và có hai bài `throws_ok` **gọi thẳng `insert`
   vào cơ sở dữ liệu** — vì đo hàm không phải đo đường ghi.
3. **D-169/TB-01 — bốn con số nằm cạnh nhau đang nói hai chuyện khác nhau.**
   CTE `classed` đếm trên toàn bộ `public.classes`, mà `classes_select_authenticated` **cố ý** cho
   mọi tài khoản đọc mọi lớp (danh mục lớp là cấu trúc công khai, phục vụ dropdown và điều hướng).
   Vì vậy `security_invoker` **không** thu hẹp con số đó: Giáo lý viên lớp Ấu 1 thấy **19** trong khi
   `student_count`, `staff_count` và tỷ lệ chuyên cần cạnh nó đều đã đúng phạm vi. Gốc rễ đúng như
   `03_AUDIT_RESULTS` §4.1: **view trộn nguồn có RLS phạm vi với bảng danh mục mở mà không có mệnh
   đề phạm vi ở chính view** — nên lời giải là **viết mệnh đề ấy ra**, không phải siết policy của
   `classes` (dropdown vẫn cần nó mở). Mọi lời gọi hàm phạm vi bọc `(select …)` để planner nâng
   thành InitPlan — bài học `20260721000200`; viết trần thì hàm chạy lại trên **từng dòng** `classes`.
4. **TB-04/TB-05 — trang báo cáo hết nói dối về phạm vi.** Năm thứ, cùng một gốc rễ:
   *"không có bước xác thực phạm vi **trước** khi truy vấn"* (`03_AUDIT_RESULTS` §4.4).
   · **Ba lý do bảng trống ra ba câu khác nhau** — bản cũ gộp *rỗng thật* · *ngoài phạm vi* ·
   *chưa buổi nào được chốt* vào **một** câu, nên người chọn nhầm một lớp ngoài phạm vi đọc **đúng
   câu** mà người có lớp trống cũng đọc, và thử lại mãi một việc không bao giờ chạy được.
   · **Ô chọn ngành/lớp chỉ liệt kê thứ người đó xem được** — bản cũ đổ thẳng 19 lớp cho cả Giáo lý
   viên có đúng một lớp; khi chỉ còn một lựa chọn thì hiện **nhãn tĩnh**, không phải một ô chọn.
   · 🔴 **Tham số URL hỏng THU HẸP và NÓI RA** — bản cũ đặt lại toàn bộ bộ lọc về `global` **trong im
   lặng**, tức âm thầm **nới rộng** phạm vi người dùng vừa yêu cầu. Phân biệt *"URL không nói gì"*
   với *"URL nói sai"* là bắt buộc: không có nó thì **mọi** lượt mở `/reports` trần của Trưởng ngành
   và Giáo lý viên lớp đều hiện một dải cảnh báo — và một cảnh báo luôn hiện là một cảnh báo không
   ai đọc nữa.
   · **Phạm vi mặc định suy từ vai trò** — bản cũ mặc định `global` cho **mọi** người, nên trạng thái
   *mặc định* của Trưởng ngành và Giáo lý viên lớp luôn là trạng thái sẽ lỗi.
   · **Nút "Chốt báo cáo" HỎI luật thay vì chép lại nó** (bài học **D-151** của M07-B, nơi *"ai được
   khoá bảng điểm"* từng có **ba tầng nói ba điều khác nhau**). `app.can_create_report` nằm ở schema
   `app` mà PostgREST không phơi ra, nên cần đúng một hàm bọc mỏng `public.can_finalize_report`.
   Hai câu hỏi khác nhau ⇒ hai cách hiển thị: vai trò **không bao giờ** chốt được thì **không thấy
   nút**; người chốt được nhưng đang đứng ở phạm vi rộng hơn phần mình phụ trách thì thấy nút **vô
   hiệu kèm lý do** — ẩn nút với họ là giấu mất chính chức năng họ vào trang để dùng.
5. **Nợ #18 ĐÓNG HẲN — `report_snapshots` là bảng cuối cùng.**
   Ca **policy**, khuôn M02-C (không phải khuôn RPC của M05-A/M07-B/M08-B): `authenticated` có
   `insert` ở **mức bảng** (`20260723000500:262`) và mọi đường ghi đi thẳng qua policy. Không mâu
   thuẫn WF-16: bước 3 (*chốt báo cáo năm*) đứng **trước** bước 4 (*đặt năm học `closed`*), và bước 5
   nói thẳng *"không cho ghi mới trừ Super Admin"*. D-117 giữ nguyên. Quyền **xem** và **tải** báo
   cáo của năm đã đóng **không bị đụng** — pgTAP `050` có bài đo riêng vế đó.
6. **Nợ #14 (D-96)** — `reports` mắc **cả hai** vế: guard nằm trong `try` (nên `catch` nuốt mất
   `redirect()` của Next) **và** dùng `requireAuthContext` thay `requireRouteAccess`. Nay
   `reportsRouteContext()` gọi **ngoài `try`** ở **cả bốn** cửa vào — trang · Server Action · route
   tải file báo cáo · route tải bản chốt. Còn đúng **1 module**: `theme`.
7. **F06 + F09 — hai thứ nhỏ, một trong hai là một trang 500.**
   F06: `getReportsPageData` chạy `requireRouteAccess("/reports")` **hai lần** cho một lượt dựng
   trang (N-1) — nay `buildReport` **nhận** `context` làm tham số. F09: `getReportSnapshot` trả
   `headers: []` khi `payload_json` có hình dạng lạ, và pdfmake **ném lỗi** khi bảng không có cột nào
   ⇒ trang **500**; nay **422** kèm câu tiếng Việt, không dùng 404 vì 404 giấu mất sự tồn tại của một
   bản chốt người dùng **đọc được**.
8. 🔴 **Bốn chỗ hỏng trong phần phiên trước để lại, tìm ra khi rà — cả bốn đều không có bài kiểm nào canh.**
   ⓵ `tests/unit/report-filters.test.ts` **vẫn gọi `parseReportFilter` theo chữ ký cũ** ⇒ nó sẽ đỏ
   ngay lượt chạy đầu (`07` §2.3 đã dự báo đúng: *"đổi kiểu trả về là breaking change nội bộ"*). Nay
   **30 bài** thay cho 9. ⓶ Câu *"vì sao bảng trống"* hỏi **cả xứ đoàn** rồi trả lời cho **một ngành**
   — ngành Ấu trống trong khi ngành Thiếu còn buổi chưa chốt là một câu trả lời **sai có thể xảy ra
   thật**; nay hỏi đúng tập lớp của phạm vi đang chọn. ⓷ Gõ tay `?scopeType=sector` làm ô chọn phạm
   vi hiện **ô trống** (`value` không khớp option nào) — người dùng đọc là *"hỏng"* trong khi bảng
   bên dưới đã nói đúng lý do. ⓸ F09 ở trên.
9. 🔴 **Một lỗi thật mà CHỈ `typecheck` bắt được — và chỉ bắt được sau khi `database.ts` sinh lại.**
   Bộ sinh kiểu của Supabase khai mọi tham số **không có mặc định** thành bắt buộc **và không nhận
   `null`** (`p_scope_id: string`), trong khi phạm vi `global` đúng nghĩa là *không có id*. Sửa ở
   **migration** chứ không ở chỗ gọi — thêm `default null` cho `p_scope_id` ⇒ kiểu sinh ra là
   `p_scope_id?: string` và chỗ gọi truyền `?? undefined`, đúng khuôn `propose_promotion` của M08
   (`20260722000700:130`). Sửa thẳng migration là hợp lệ vì file này **chưa từng áp production**
   (`AGENTS` §6 cấm sửa migration **đã** áp).

**Số kiểm thử thật của đợt A** (trên DB vừa `db:reset`, pgTAP chạy **trước** `seed:dev`):
pgTAP **1324/1324** trên **50 file** (trước 1286/1286 trên 49 — **+38**, đúng `plan(38)` của file mới
`050`, toàn bộ bằng **JWT thật của 9 vai trò**: Quản trị viên · Cha sở · Cha phó · Thư ký · Thủ quỹ ·
Trưởng ngành · hai Giáo lý viên đại diện khác ngành · Phụ huynh) · unit **1469 pass / 16 skip**
(trước 1448/16 — **+21**) · lint **0 warning** · typecheck ✓ · build ✓ **28/28 trang**.
⚠️ **Không chạy E2E ở đợt này** — đúng tiền lệ đợt A của M10 và M08, và vì `07` §5 ghi **N-6: chưa
từng có e2e nào cho `/reports` và `/dashboard`**; dựng bộ ấy là việc của **M11-C**, không phải chạy
lại bộ cũ.

#### Đợt M11-B — chi tiết

**Phạm vi: 1 migration (`20260812000100`) · 1 thay đổi phân quyền (`11` §6 D-67, **NỚI**) ·
0 `alter table` · 0 backfill · 0 dòng dữ liệu bị đụng · 1 policy đổi vị từ (quyền **đọc** bản chốt).**

1. 🔴 **D-170 — "đọc được số gộp" là một câu hỏi CHƯA TỪNG CÓ TÊN, và hiện trạng là NÓI SAI chứ
   không phải nói thiếu.** `03_AUDIT_RESULTS` §4.2 truy tới gốc: hệ thống chỉ có **nhị phân**
   `app.can_global_read()` hoặc không có gì, mà hàm ấy liệt kê cứng sáu vai trò và **không có Thủ
   quỹ** (`20260715000100:164`). Đo trên cơ sở dữ liệu thật bằng JWT của Thủ quỹ `GLV904` **trước**
   đợt này: `v_dashboard_summary` → `student_count 0 · staff_count 0 · class_count 0 · mass_rate
   null`; `report_attendance_rows` → **0 dòng**; `report_results_rows` → **0 dòng**. Tức trang tổng
   quan báo với một chức việc cấp xứ đoàn rằng xứ đoàn có **0 thiếu nhi và 0 lớp**, còn trang Báo
   cáo thì mời họ vào rồi cho một bảng trống hoàn toàn.
   **Không nới bằng cách thêm `treasurer` vào `can_global_read()`** — cùng lý lẽ D-129: hàm ấy đứng
   trong policy của hàng chục bảng, thêm một cái tên là mở luôn sức khoẻ · bí tích · ghi chú nội bộ
   · điểm từng em, đúng danh sách `docs/05` §4.5 xếp vào nhóm "Cấm". Nên có **một cái tên thứ hai**:
   `app.can_read_aggregate()` = `can_global_read() or role = 'treasurer'`, và nó **chỉ** được dùng ở
   những đường trả về số gộp.
2. **D-173 — cửa sổ hẹp phủ ĐÚNG BA CHỖ** (chủ dự án chốt 2026-08-12, chọn phương án rộng nhất
   trong ba). Loại phương án "chỉ trang Báo cáo" vì nó **lặp lại đúng vấn đề đang chữa** ở hai chỗ
   khác: mục "Báo cáo đã chốt" mà Thủ quỹ nhìn thấy nhưng không bao giờ có gì trong đó, và trang
   tổng quan vẫn hiện bốn số 0.
   · **Bảng báo cáo:** `report_attendance_rows_for_treasurer` / `report_results_rows_for_treasurer`
     — hai hàm `security definer` **gọi thẳng** hai RPC gốc chứ không chép lại một dòng SQL nào.
     🔴 Chép ra một bản thứ hai "cho Thủ quỹ" là dựng sẵn hai con số sẽ lệch nhau vào một ngày không
     ai nhớ nổi, tức phá D-52 ngay tại chỗ nó được sinh ra để bảo vệ. Gọi được vì "invoker" bên
     trong một hàm definer chính là **chủ sở hữu hàm**, và chủ sở hữu bảng được miễn RLS (không bảng
     nào của dự án bật `force row level security` — đã kiểm).
   · **Kho bản chốt:** `app.can_read_report` đổi sang `can_read_aggregate()`. Nội dung `payload_json`
     **đúng bằng** cái bảng gộp hai hàm trên vừa cho phép xem, nên chặn ở đây là chặn một thứ họ đã
     xem được ở dạng sống. `docs/05` ô của họ ghi *"👁/export giới hạn"* — vế `export` chính là đây.
   · **Trang tổng quan:** `dashboard_summary_for_treasurer`.
   🔴 **Cố ý KHÔNG sửa `v_dashboard_summary`.** Cách rẻ là đổi mệnh đề phạm vi của CTE `classed`
   (viết hôm qua cho D-169) sang `can_read_aggregate()`. Nó sai theo một kiểu rất khó thấy: bốn con
   số của view lấy từ **bốn nguồn khác nhau**, ba nguồn kia lọc bằng RLS của bảng gốc nên với Thủ
   quỹ vẫn là 0, riêng `class_count` lọc bằng **vị từ viết tay trong view** nên sẽ nhảy lên 19 —
   một hàng KPI có 1 số đúng và 3 số sai, **đúng cái bệnh D-169 vừa chữa hôm trước**, chỉ đổi vai
   người mắc. pgTAP `051` có bài canh riêng: Thủ quỹ đọc **thẳng** view vẫn ra 0.
3. 🔴 **Giao diện phải đổi theo, nếu không nới số sẽ sinh ra một câu nói sai THỨ HAI.**
   `warned_student_count` là số gộp nên nó lên số thật, trong khi danh sách tên bên dưới vẫn rỗng
   vì RLS (đúng như D-67 muốn) và bản cũ in *"Không có em nào cần lưu ý trong phạm vi của bạn"* —
   hai câu ngược nhau trong cùng một thẻ. Vì vậy `aggregateOnly` không chỉ đổi **nguồn số**, nó đổi
   cả **những thẻ được hiện**: các thẻ chỉ chứa tên người biến mất thay vì hiện "chưa có gì".
4. **D-171 — một cái nhãn nói sai nội dung, không phải một tính năng còn thiếu.**
   `report_results_rows` chỉ nhận `p_academic_year_id` và **bỏ qua hoàn toàn khoảng ngày**
   (`20260723000500:322`), nên chọn "Tháng 09" cho ra số của **cả năm** dưới nhãn một tháng — và
   bản chốt ghi lại đúng cái nhãn sai ấy, **vĩnh viễn**, vì snapshot không sửa được. Ép ở **một hàm
   thuần duy nhất** rồi gọi từ cả ba cửa vào (trang · route tải file · Server Action): mỗi cửa tự ép
   lấy thì đủ để một cửa quên, và cửa quên ấy chính là cửa **ghi bản chốt**. Ép **không** ghi vào
   `invalidKeys` — đổi loại báo cáo là thao tác chính đáng, báo nó như lỗi là dạy người dùng bỏ qua
   dải cảnh báo.
5. **D-172 / AC-B09 — hộp xác nhận, và chữ "ai" là chỗ khó.**
   `report_snapshots` chỉ có `grant select, insert`: một cú bấm nhầm để lại một hàng mà **kể cả
   Quản trị viên hệ thống cũng không xoá được**. 🔴 **D-174** (chủ dự án chốt 2026-08-12): hộp phải
   nêu **tên** người chốt bản trùng — và đó là **bản sinh đôi của cái bẫy M08-C đã vấp** (D-163):
   `profiles_select_self_or_global` chỉ mở cho chính mình hoặc sáu vai trò cấp xứ đoàn, mà **hai
   nhóm chốt báo cáo nhiều nhất — Trưởng ngành và Giáo lý viên đại diện — không nằm trong sáu**.
   Nhúng thẳng `profiles(display_name)` là một ô `null` **trong im lặng**: tính năng có mặt trong mã
   nguồn mà vắng mặt đúng ở người cần nó. Nên `find_report_snapshot_duplicate` là một cửa sổ **hẹp
   hơn cả** `list_promotion_actor_names`: trả tối đa **một** hàng, chỉ khi người gọi **vốn đã** đọc
   được bản chốt ấy (vị từ là lời gọi thẳng `app.can_read_report`, không phải bản chép tay của nó —
   bài học D-160), và về người thì **không có gì ngoài `display_name`**.
   `count(*) over ()` chạy **trước** `limit` nên hộp nói được *"đã có 2 bản"*, một câu khác hẳn
   *"đã có 1 bản"*.
6. **Luật "thế nào là trùng" nằm ở tầng ứng dụng, không sinh `unique`** — đúng D-172: nó là một
   **câu hỏi**, không phải một hàng rào. Bộ ba: cùng loại · cùng phạm vi · cùng khoảng ngày.
7. ⚠️ **Một giới hạn cố ý, ghi ra chứ không giấu:** với Thủ quỹ, câu *"vì sao bảng trống"* luôn là
   câu chung (`empty`), không bao giờ là *"chưa có buổi nào được chốt"* — `resolveEmptyReason` đếm
   `attendance_sessions` dưới RLS của người gọi và Thủ quỹ đọc bảng ấy ra 0 dòng. Sửa cho đúng cần
   một cửa sổ hẹp **thứ tư** cho đúng một câu chữ; không đáng, nhưng phải nói ra.

**Số kiểm thử thật của đợt B** (trên DB vừa `db:reset` từ trống): pgTAP **1372/1372** trên **51 file**
(trước 1324/50 — **+48**, đúng `plan(48)` của file mới `051`) · unit **1498 pass / 16 skip** (trước
1469/16 — **+29**) · lint **0 warning 0 error** · typecheck ✓ · build ✓ **28/28 trang**.

🔴 **pgTAP `051` đo HAI VẾ, và vế thứ hai mới là vế phân biệt "mở một ô cửa" với "mở toang cánh
cửa":** 6 bài đo cửa sổ **có mở** đúng số gộp, và **6 bài đo ranh giới cũ KHÔNG nhúc nhích** — Thủ
quỹ gọi thẳng hai RPC gốc vẫn 0 dòng · đọc thẳng `students` vẫn 0 dòng (bài canh hiện trạng của
D-129 giữ nguyên) · đọc thẳng bảng điểm danh từng em và bảng điểm từng em vẫn 0 dòng ·
`app.can_global_read()` vẫn không có họ. **Một bản cài đặt lười thêm `treasurer` vào
`can_global_read()` sẽ làm 6 bài đầu xanh y hệt và 6 bài sau đỏ hết.** Kèm 4 bài `throws_ok` chứng
minh **không vai trò nào khác** đi qua được cửa sổ ấy, và 1 bài `throws_ok` gửi thẳng lệnh chốt vào
cơ sở dữ liệu để đo **đường ghi** chứ không chỉ đo hàm.

#### Đợt M11-C — chi tiết

**Phạm vi: 1 migration (`20260813000100`) · 0 thay đổi phân quyền trong danh sách `11` §6 ·
0 `alter table` · 0 policy bị sửa · 0 backfill · 0 dòng dữ liệu bị đụng.**

1. 🔴 **TB-03 — ngõ cụt, và nó nằm ở thẻ mà không ai bọc cờ.** Bản cũ bọc đúng **ba** thẻ bằng
   `isStaff` và **bỏ sót thẻ "Cần quan tâm"**, nên phụ huynh mở trang chủ, thấy tên con mình đang bị
   cảnh báo chuyên cần, bấm vào — và bị đá sang `/access-denied` vì liên kết trỏ `/students/<id>`,
   route chỉ dành cho nhân sự. Từ đó **không còn đường nào khác** (`03_AUDIT_RESULTS` §4.3). Gốc rễ
   là *"dashboard được thiết kế như MỘT màn hình dùng chung với vài chỗ ẩn/hiện"* trong khi
   `docs/06` §7 đã tách sẵn bốn bố cục. Nay đích đến của một cái tên **suy từ `audience` ở một chỗ
   duy nhất**: nhân sự → `/students/<id>` · phụ huynh → `/parent/children/<id>` · thiếu nhi →
   `/student/attendance`. Kèm AC-B03: nhãn KPI mang đúng nghĩa người xem ("Con của tôi", "Tỷ lệ dự
   lễ của con"), và thiếu nhi **không có ô đếm thiếu nhi** — đếm chính mình là một con số vô nghĩa.
2. **TB-06 — kho 5 năm lần đầu có cửa.** Trước đợt này, đường vào duy nhất là 20 dòng mới nhất nằm
   dưới cùng `/reports`, không lọc, không phân trang, và tiêu đề chỉ gồm loại + khoảng ngày ⇒ hai
   bản chốt cùng tháng của **hai lớp khác nhau** hiện ra **giống hệt nhau**; bản cũ hơn 20 dòng thì
   không có đường vào nào cả (`03_AUDIT_RESULTS` §4.6: dữ liệu đúng, giao diện không phơi bày).
   Nay có `/reports/snapshots` (lọc năm học · loại · phạm vi, phân trang 20/trang) và
   `/reports/snapshots/[id]` (xem lại bảng từ `payload_json`, **không tính lại** — D-51 — kèm
   băng-rôn bất biến và checksum đầy đủ). Tiêu đề lúc chốt nay chứa **phạm vi**; đó là thứ không sửa
   được nên đây là chỗ duy nhất còn kịp.
3. 🔴 **Và TB-06 kéo theo cái bẫy `profiles` LẦN THỨ HAI trong cùng một module.** AC-B10 đòi mỗi
   dòng nói ra **người chốt**, mà `find_report_snapshot_duplicate` của đợt B tra **một** bộ và trả
   **một** hàng — dùng nó cho danh sách là 20 lượt gọi cho một lượt dựng trang. Nên
   `list_report_snapshot_actors()` ra đời, đúng khuôn `list_promotion_actor_names` (D-163): hai cột,
   vị từ là lời gọi thẳng `app.can_read_report`, và **không phải danh bạ** — người chưa từng chốt
   báo cáo nào mà người gọi đọc được thì không bao giờ xuất hiện. pgTAP `052` đo cả vế đóng: Trưởng
   ngành Ấu nhận được tên người chốt bản **lớp mình** nhưng **không** nhận được tên người chốt bản
   **toàn xứ đoàn**, và đọc thẳng `public.profiles` vẫn 0 dòng.
4. **Redesign `/reports` theo `09`** — ba `<select>` trần thay bằng `Select`; bảng thay bằng
   `DataTable` (có `<caption>`, `scope="col"`, cột đầu dính, chỉ báo cuộn ngang); ba lý do bảng
   trống nay ra **ba trạng thái rỗng chuẩn** (`11` §5) thay vì ba dòng chữ xám giống nhau, và câu mô
   tả **nêu tên phạm vi cụ thể**. AC-B15: thêm vùng `aria-live` nói ra loại · kỳ · khoảng ngày ·
   phạm vi · **số dòng** — đổi bộ lọc là một lượt dựng lại trang, nên không có dòng này thì người
   dùng trình đọc màn hình không có cách nào biết kết quả đã đổi.
5. **Sửa nhỏ §6 của `04_TO_BE_FLOWS`:** **N-2** bảy truy vấn dashboard hết bỏ qua `error` — hỏng thì
   nói ra ở **đầu trang**, vì người dùng không có cách nào biết thẻ nào lẽ ra có dữ liệu · **F05**
   thẻ "chưa có năm học" hết dẫn **mọi** vai trò vào `/admin` (route chỉ Quản trị viên hệ thống) ·
   **F12** bản chốt lần đầu có nút PDF, route đã hỗ trợ từ Phase 6 mà chưa nút nào gọi.
6. 🔴 **N-6 — và dựng bộ E2E ấy lộ ngay một khoảng trống của chính bộ dữ liệu mẫu.** `seed:dev` tạo
   lớp, thiếu nhi và nhân sự nhưng **không tạo một buổi điểm danh đã chốt nào** — đã đo:
   `report_attendance_rows` trả **0 dòng** cho cả vai trò toàn cục. Với 0 dòng thì nút "Chốt báo
   cáo" **luôn `disabled`**, tức đường ghi của module — thao tác **không lùi được** và là thứ nguy
   hiểm nhất ở đây — sẽ không bao giờ được chạy tới. **Một bộ E2E xanh mà chưa từng bấm nút nguy
   hiểm nhất là một bộ E2E nói dối**, nên spec tự dựng dữ liệu qua service role thay vì mượn tác
   dụng phụ của spec khác. Mỗi viewport dùng **một tháng riêng**: bản trùng nhận diện theo (loại ·
   phạm vi · kỳ), nên ba viewport dùng chung một kỳ sẽ khiến bài *"chưa có bản trùng"* của lượt thứ
   hai xanh/đỏ tuỳ thứ tự chạy — đúng loại xanh giả M10-C đã vấp.
7. ⚠️ **Hai bài học về chính bộ E2E, ghi ra vì nó sẽ tái phát ở M13:**
   ⓵ Vỏ ứng dụng có **hai** thanh điều hướng và cả hai chứa chữ "Lớp", "Thiếu nhi", "Con của tôi" —
   một bài đo ô KPI bằng `getByText` trần có thể **xanh vì trúng một mục menu**. Mọi phép đo KPI nay
   đi qua vùng `Chỉ số năm học`.
   ⓶ Hàm `login` chép từ `notifications.spec.ts` đặt `page.goto("/login")` ở nhánh `catch`, nên khi
   lượt điều hướng trước còn đang bay thì lượt goto mới bị huỷ với `net::ERR_ABORTED` và bài đỏ vì
   **hạ tầng đăng nhập**, không vì thứ nó đang đo. Spec này đăng nhập ~18 lượt mỗi viewport với sáu
   tài khoản nên nó chạm cái bẫy ấy thường xuyên hơn hẳn; vòng thử lại nay bọc **cả** lượt `goto`.

**Số kiểm thử thật của đợt C** (trên DB vừa `db:reset` từ trống, pgTAP chạy **trước** `seed:dev`):
pgTAP **1385/1385** trên **52 file** (sau đợt B là 1372/51 — **+13**, đúng `plan(13)` của file mới
`052`) · unit **1531 pass / 16 skip** (sau đợt B là 1498/16 — **+33**) · lint **0 warning 0 error** ·
typecheck ✓ · build ✓ **29/29 trang** (trước 28 — hai trang mới của TB-06, và `/reports/snapshots`
gộp vào cùng nhánh) · `tests/e2e/reports.spec.ts` **18/18 xanh** khi chạy riêng trên `laptop-1366`.

🔴 **Số E2E TOÀN BỘ của đợt này KHÔNG dùng làm số nghiệm thu, và lý do phải ghi ra.**
Giữa phiên **Docker Desktop hỏng hai lần** — engine trả `500 Internal Server Error` cho **mọi** lệnh,
và một truy vấn Supabase đơn giản đo được **445 giây** trước khi trả lời. Lượt chạy toàn bộ rơi đúng
vào cửa sổ ấy, nên các bài đỏ mang chữ ký **hạ tầng** chứ không mang chữ ký hành vi:
`page.goto: Target page, context or browser has been closed` và `Test timeout` ở những spec đợt này
**không đụng một dòng nào** (`authenticated-shell` · `class-settings` · `enrollment-lifecycle`).
Con số đo được của lượt chạy ấy nói ra mức độ hỏng rõ hơn mọi lời giải thích: **3,6 giờ** cho một bộ
test bình thường mất **~25 phút** (M10-C: 27,3 phút · M08-C: 22,7 phút), và nó **bị cắt ngang** —
**107 bài xanh, 46 bài KHÔNG ĐƯỢC CHẠY**. Một lượt chạy không đi hết bộ test thì không có mẫu số,
nên nó không so được với 494/507 của M10-C.
Số đo **dùng được** cho M11 là lượt chạy cô lập `reports.spec.ts`: **18/18** trên `laptop-1366`, và
**44/48** trên cả ba viewport ở lượt trước đó (4 bài đỏ đều là `page.goto` / `locator.fill` hết giờ,
0 bài đỏ ở một khẳng định nghiệp vụ). ⚠️ **Phải chạy lại `npm run test:e2e` đầy đủ khi môi trường
ổn** — dịch vụ `com.docker.service` đang ở trạng thái **Stopped** và cần quyền Administrator để bật
lại; đây là bản sinh đôi của cái bẫy `winnat` mà M11-A đã ghi.

#### Nợ mang sang các module sau — ghi ra chứ không giấu

| Nợ | Vì sao còn |
|---|---|
| **TB-07** chọn năm học cho báo cáo · **N-3** `AcademicYearSwitcher` vẫn là nút giả hardcode | `07` §4 xếp TB-07 **cuối cùng** vì nó *"đụng nhiều module, nên đi cùng M02-ACADEMIC-STRUCTURE"* — thêm `academicYearId` vào `ReportFilter` đổi `filter_json` của snapshot và đụng cả bộ chọn năm ở vỏ ứng dụng. Hệ quả đang phải chịu: **chốt báo cáo cho năm cũ (WF-16 bước 3) vẫn chưa làm được từ giao diện** |
| **TB-08A** lọc thật theo `assessment_date` cho báo cáo Kết quả | D-171 chọn phương án (b) và **không chặn đường làm (a) về sau**. (a) đòi `drop function` + `create` để đổi chữ ký RPC **và** đòi chốt thêm một luật chưa ai hỏi: *bài kiểm tra không ghi ngày thì tính vào kỳ nào?* |
| **N-5** thêm một loại báo cáo mới vẫn phải sửa 4 chỗ rời rạc | Không có luồng nào của `04_TO_BE_FLOWS` đòi loại báo cáo mới; làm registry bây giờ là mở rộng phạm vi (`AGENTS` §4) |
| **N-4** cột `report_snapshots.file_path` khai báo mà chưa bao giờ ghi | Bản chốt sinh lại từ `payload_json` mỗi lượt tải nên cột này chưa có việc; xoá nó là một migration đụng bảng đang chạy để đổi lấy 0 hành vi |
| **Nợ #22** lịch sử Top 5 có dữ liệu mà chưa có màn hình đọc lại | Dòng nợ ghi *"M11 hoặc bất cứ lúc nào chủ dự án yêu cầu"*; **không** nằm trong `04_TO_BE_FLOWS` của M11 nên thêm vào là mở rộng phạm vi — chờ chủ dự án gọi tên |
| ⚠️ **Thủ quỹ: câu "vì sao bảng trống" luôn là câu chung** | Xem đợt B mục 7. Cần một cửa sổ hẹp **thứ tư** cho đúng một câu chữ |

---

### Module 14 — M13 Cổng Phụ huynh & Thiếu nhi · chia ba đợt · ✅ **ĐÓNG 2026-08-12**

Đối chiếu mã hiện tại cho thấy M14, M11, M07 và M05 đã trả trước phần lớn lối vào/giao diện:
menu **Con của tôi**, link từ dashboard, breadcrumb/back, tiêu đề route, chú thích trung bình đã công
bố và việc bỏ ghi chú điểm danh nội bộ. Vì vậy không làm lại những phần ấy; M13 chia theo phần còn
thiếu thật:

| Đợt | Nội dung | Trạng thái |
|---|---|:--:|
| **M13-A** | Lớp nền `CRITICAL`: TB-M13-01 · TB-M13-02 · TB-M13-05; D-25 · D-64; rà D-70/D-75 trên màn hình mới; kiểm thử hành trình thật | ✅ **XONG 2026-08-12** |
| **M13-B** | TB-M13-03 + TB-M13-04: phân biệt trạng thái rỗng ở toàn cổng; hoàn thiện chữ, cảnh báo, bảng và khả năng đọc trên 360px | ✅ **XONG 2026-08-12** |
| **M13-C** | TB-M13-06 + nghiệm thu đóng module: đối chiếu route/tài liệu, kiểm chéo kết quả/giáo án/thông báo và chạy bộ an ninh/E2E cuối | ✅ **XONG 2026-08-12** |

#### Đợt M13-A — ✅ XONG (2026-08-12)

**Quy trình 9 bước (`11` §4) đã đi đủ:** đọc `03`/`04` và toàn bộ tài liệu module; xác định nghiệp vụ
cần sửa; sửa lớp auth/query/route trước; giữ nguyên design system `09`; đồng bộ ba kích thước; chạy
đủ cổng kiểm; rà accessibility; cập nhật file 16 + audit board + WORKLOG; rồi mới chuyển sang M13-B.

**Những gì đã làm:**

1. 🔴 **Đóng mặc định `/student/*`.** Thêm layout gọi `requireRouteAccess("/student")`; trang điểm
   danh vẫn giữ lớp guard riêng. `getSelfStudent(profileId)` lọc chính em bằng `students.profile_id`,
   không còn lấy phần tử `[0]` của một danh sách có ngữ nghĩa khác.
2. 🔴 **Ba câu hỏi có ba hàm.** `getAccessibleStudents()` phục vụ luồng nhân sự nộp đơn hộ;
   `getMyChildren()` lọc tường minh qua `guardians.profile_id`; `getSelfStudent()` chỉ lấy chính em.
   RLS vẫn là hàng rào cuối — không policy nào bị sửa.
3. 🔴 **D-25 không còn chỉ nằm trên giấy.** Phiên đăng nhập chỉ đưa xuống vỏ một cờ boolean
   `hasGuardianProfile`; GLV đồng thời là phụ huynh thấy **Con của tôi** trong sidebar/drawer, nhưng
   id người giám hộ và id con không đi qua client. GLV thường không mọc thêm hai mục portal; thanh
   dưới năm ô của nhân sự đứng lớp giữ nguyên.
4. **D-64:** đúng một con thì `/parent/children` chuyển thẳng vào hồ sơ; nhiều con ở lại danh sách
   chọn. E2E đi từ đăng nhập bằng giao diện, không gõ UUID.
5. **Rà D-70:** danh sách và trang chi tiết đều bắt đầu từ `getMyChildren`; một tài khoản toàn cục
   không thể biến portal thành danh sách thiếu nhi thứ hai. URL con của phụ huynh khác trả 404 và
   không lộ tên. **Rà D-75:** kiểu trả về và câu truy vấn portal không có `note`; pgTAP quyền cột vẫn
   xanh. **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi quyền.**
6. Thêm 5 bài unit/kiến trúc và một spec E2E 5 hành trình × 3 viewport: một con · nhiều con ·
   GLV-phụ huynh · truy cập chéo · vai trò sai/thiếu nhi đúng. Lượt E2E đầu 9/15 vì bài đo bắt URL
   danh sách trước redirect và dò menu trước khi dashboard dựng xong; sửa phép đo, lượt cuối
   **15/15**. Đây là lỗi của test, không phải che một lỗi sản phẩm.

**Số kiểm thử thật** — DB vừa `db:reset` từ trống; pgTAP chạy **trước** `seed:dev`:

- `npm run test:db`: **1385/1385**, **52/52 file**.
- `npm test`: **1536 pass / 16 skip**, **109 file pass / 4 file skip** (+5 pass so với M11-C).
- `tests/e2e/portal.spec.ts`: **15/15 pass** — 5 hành trình trên `mobile-360`, `tablet-768`,
  `laptop-1366`; các trang portal được đo không tràn ngang.
- `npm run lint`: **0 warning · 0 error**; `npm run typecheck`: **xanh**.
- `npm run build`: **xanh 29/29 trang**. Runner E2E cũng tự build sạch và xanh trước Playwright.
- Không chạy toàn bộ E2E ở đợt nền; **M13 chưa đóng**. Bộ toàn hệ thống là gate của M13-C.

**Nghiệm thu 15 mục (`11` §5) cho phạm vi M13-A:**

| # | Tiêu chí | Kết quả |
|--:|---|---|
| 1 | build · lint · typecheck · test xanh | ✅ số thật ở trên |
| 2 | E2E 360/768/1366, không tràn ngang | ✅ 15/15 |
| 3 | Vùng chạm ≥44px | ✅ dùng link/nav/button chuẩn hiện có; không thêm control nhỏ |
| 4 | Không chữ <12px | ✅ không thêm cỡ chữ; portal dùng thang đã duyệt |
| 5 | Không màu hardcode khi có token | ✅ không thêm màu |
| 6 | Không `window.confirm` / `window.alert` | ✅ grep toàn `src` giữ 0 |
| 7 | Không `<select>` native mới | ✅ không thêm biểu mẫu |
| 8 | Ghi có phản hồi + kiểm số dòng | — portal đợt này thuần đọc |
| 9 | Empty state đúng 1/3 loại chuẩn | 🟡 danh sách giữ `not-linked`; phân biệt đủ nguyên nhân là M13-B |
| 10 | Thao tác nguy hiểm có `ConfirmDialog` | — không có thao tác ghi/nguy hiểm |
| 11 | Thao tác nhạy cảm có audit | — không có thao tác ghi |
| 12 | Tab/focus/Escape | ✅ không thêm lớp nổi; vỏ/focus giữ bộ test hiện có |
| 13 | Không dùng màu làm tín hiệu duy nhất | ✅ không thêm tín hiệu màu; link có chữ/icon |
| 14 | Siết quyền có test âm tính JWT thật | — không đổi quyền; pgTAP 1385 giữ xanh + E2E route sai bị chặn |
| 15 | Tài liệu + implementation log | ✅ file này + audit board + WORKLOG |

#### Đợt M13-B + M13-C — ✅ XONG, ĐÓNG MODULE VÀ ĐÓNG PHẦN TRIỂN KHAI 2B (2026-08-12)

**Quy trình 9 bước (`11` §4) đã đi đủ:** đối chiếu `03`/`04`/`05`/`06`/`07`/`08` của M13 và ba
tài liệu đã duyệt; sửa query/trạng thái dữ liệu trước; dùng lại design system; đồng bộ ba viewport;
chạy unit/pgTAP/E2E; rà accessibility; đối chiếu route; cập nhật ba sổ; rồi mới kết luận đóng module.
Không sửa `09`/`10`/`11`.

**Những gì đã làm:**

1. Thêm mô hình trạng thái dùng chung `not_linked` · `no_children` · `no_enrollment` · `no_data`.
   Query lỗi vẫn ném lỗi hệ thống, không bị đổi tên thành “chưa có dữ liệu”. Các trang con, chuyên
   cần, xin nghỉ và kết quả dùng chung `PortalEmptyState`; câu chữ nêu đúng đối tượng/năm học và
   bước tiếp theo.
2. Gắn `data-density="comfortable"` cho cả `/parent/*` và `/student/*`: cỡ chữ nền 17px, cỡ nhỏ
   nhất 14px, điều khiển 48px. Cảnh báo chuyên cần có icon + chữ, `role="status"`, `aria-live` và
   đường liên hệ Giáo lý viên; không dùng màu làm tín hiệu duy nhất.
3. Bảng chuyên cần có `caption`, `scope` cho tiêu đề, vùng cuộn ngang nhận focus bằng bàn phím và
   chiều rộng tối thiểu để không ép chữ ở 360px. Không đưa `note` nội bộ trở lại portal.
4. Đối chiếu ba màn hình dùng chung: Kết quả, Giáo án và Thông báo đều dùng mật độ portal cho cả
   phụ huynh lẫn thiếu nhi. Bài M13-C tự dựng hai cột điểm công bố, kiểm TB = tổng cột đang hiện /
   số cột đang hiện, ẩn một cột rồi tải lại để chứng minh mẫu số đổi thật trên đường portal.
5. Rà route theo D-91: bổ sung `/reports/snapshots` đang tồn tại và bỏ ghi chú nợ cũ về
   `/staff/[staffId]` đã được M04 trả; không tạo bản sao `/student/results` hay
   `/student/teaching-plan`. **0 migration · 0 đổi RLS · 0 đổi dữ liệu · 0 đổi quyền.**

**Số kiểm thử thật trên DB sạch:**

- `npm run db:reset` ✓; `npm run test:db`: **1385/1385**, **52/52 file**; `npm run seed:dev`: **19 lớp**.
- `npm test`: **1545 pass / 16 skip**, **111 file pass / 4 file skip**.
- `tests/e2e/portal.spec.ts`: **24/24 pass** — 8 hành trình trên 360 · 768 · 1366.
- `npm run lint`: **0 warning · 0 error**; `npm run typecheck`: ✓; `npm run build`: ✓ **29/29 trang**.
- `npm run test:e2e` toàn hệ thống đã chạy đủ **585 bài trong 36,9 phút: 561 pass · 24 fail**.
  Cả **9 bài mới M13-B/C** xanh. Tám bài M13-A cũ đỏ trong lượt chia sẻ DB do stream/redirect chậm
  và dữ liệu con do spec khác thêm; sau reset, toàn bộ module xanh 24/24. Mười sáu bài đỏ còn lại
  nằm ở các module cũ và cùng chữ ký nợ #10: Server Action kẹt `pending`, response/stream chậm hoặc
  fixture dùng chung làm bẩn trạng thái. Đây là nợ chất lượng phát hành, không phải hạng mục M13
  còn thiếu; không che số toàn bộ bằng số chạy riêng.

**Nghiệm thu 15 mục (`11` §5) cho M13-B/C:**

| # | Tiêu chí | Kết quả |
|--:|---|---|
| 1 | build · lint · typecheck · test xanh | ✅ số thật ở trên |
| 2 | E2E 360/768/1366, không tràn ngang | ✅ module 24/24; toàn hệ thống 561/585, 24 nợ đã phân loại |
| 3 | Vùng chạm ≥44px | ✅ portal comfortable 48px; control cũ giữ ≥44px |
| 4 | Không chữ <12px | ✅ cỡ nhỏ nhất trong portal comfortable là 14px |
| 5 | Không màu hardcode khi có token | ✅ không thêm màu hardcode |
| 6 | Không `window.confirm` / `window.alert` | ✅ toàn `src` giữ 0 lời gọi |
| 7 | Không `<select>` native mới | ✅ không thêm; ô lọc có sẵn dùng lớp input dùng chung |
| 8 | Ghi có phản hồi + kiểm số dòng | — M13-B/C thuần đọc; luồng xin nghỉ ghi có sẵn không đổi |
| 9 | Empty state đúng 1/3 loại chuẩn | ✅ bốn nguyên nhân dữ liệu ánh xạ vào ba biến thể chuẩn; lỗi quyền đi route riêng |
| 10 | Thao tác nguy hiểm có `ConfirmDialog` | — không có thao tác nguy hiểm mới |
| 11 | Thao tác nhạy cảm có audit | — không có thao tác ghi/đổi quyền mới |
| 12 | Tab/focus/Escape | ✅ bảng cuộn nhận focus; caption/scope đủ; không thêm lớp nổi |
| 13 | Không dùng màu làm tín hiệu duy nhất | ✅ cảnh báo có icon + chữ + bước tiếp theo |
| 14 | Siết quyền có test âm tính JWT thật | — không đổi quyền; pgTAP 1385/1385 và route chéo giữ chặn |
| 15 | Tài liệu + implementation log | ✅ file này + audit board + WORKLOG; `09/10/11` không đổi |

> **Kết luận audit Giai đoạn 2B:** đủ **14/14 dòng module** trong `11` §3 đã hoàn thành. Các mục
> TB-07/TB-08A/N-3/N-4/N-5, nợ Top 5, nợ kỹ thuật và P7-T7 là backlog/việc triển khai sản xuất đã
> được ghi rõ, không phải đợt A/B/C còn sót của M13. Vì bộ E2E toàn hệ thống còn 24 bài đỏ, kết luận
> này là **đóng phạm vi triển khai đã duyệt**, chưa phải tuyên bố “sẵn sàng phát hành”.

---

### Sáu thay đổi phân quyền gắn vào module (`11` §6)

Đều cần sửa cơ sở dữ liệu và **đều phải kiểm thử bằng JWT thật của từng vai trò**.

| # | Mã | Thay đổi | Hướng | Module | Trạng thái |
|---|---|---|---|---|:--:|
| 1 | D-63 | Trưởng/Phó ngành tạo hồ sơ trong ngành mình | Nới | M03 | ✅ **XONG 2026-07-28** (M03-B, **D-123**) — `20260728000100`, pgTAP `037` **38 bài JWT thật**. Nới đúng hai chỗ: `students_update_scope` nhận thêm nhánh ngành, và việc **tạo** đi qua `create_student_with_enrollment` vì ngành của em suy ra từ lớp nên hồ sơ chưa xếp lớp **không kiểm được** "trong ngành mình". Kèm **D-124** nới quyền đọc người giám hộ trong ngành — không có nó thì họ tạo hồ sơ mà không chọn được phụ huynh đã có. **Không** nới sức khoẻ/bí tích (Q-M03-02 chưa chốt) |
| 2 | D-67 | Thủ quỹ có mức đọc riêng | Nới | M03/M11 | ✅ **XONG 2026-07-28** (M03-C, **D-129**) — `20260728000200`, pgTAP `038`. 🔴 **Nới bằng một CỬA SỔ HẸP, không bằng một nhánh trong policy:** RLS lọc theo **dòng**, không theo **cột**, nên thêm `treasurer` vào `students_select_scope` là mở luôn ngày sinh · địa chỉ · ghi chú nội bộ qua Data API — đúng ba thứ D-67 liệt kê vào nhóm "KHÔNG được xem". Hệ quả đo được: bài canh hiện trạng **S-06 vẫn xanh** sau đợt này (Thủ quỹ đọc thẳng `students` vẫn 0 dòng); ranh giới cũ không nhúc nhích, chỉ có thêm một ô cửa có kích thước đo được. **D-129** mở thêm đúng một cột `hardship_flag`. ✅ **Nửa M11 XONG 2026-08-12 (M11-B, D-170 + D-173)** — `20260812000100`, pgTAP `051` **48 bài JWT thật**. Chủ dự án chọn **cửa sổ hẹp**, đúng khuôn M03-C, **không** chọn phương án A của `04_TO_BE_FLOWS` (chuyển hai RPC báo cáo sang `security definer` — thứ `07` §2.1 tự xếp là **điểm nguy hiểm nhất của cả module**, vì mất lớp bảo vệ tự động và *"một `where` thiếu là rò toàn bộ số liệu xứ đoàn"*). 🔴 **Hiện trạng trước khi nới đã ĐO, không suy đoán:** Thủ quỹ thấy `0 thiếu nhi · 0 giáo lý viên · 0 lớp` trên trang tổng quan và **0 dòng** ở cả hai bảng báo cáo — đó là **nói sai**, không phải nói thiếu. **D-173**: cửa sổ phủ **ba chỗ** (bảng báo cáo · kho bản chốt · bốn ô số tổng quan), vì chỉ mở trang Báo cáo là lặp lại đúng vấn đề đang chữa ở hai chỗ còn lại. 🔴 **Ranh giới cũ không nhúc nhích, có 6 bài canh riêng:** gọi thẳng hai RPC gốc vẫn 0 dòng · đọc thẳng `students` · `student_attendance_records` · `assessment_scores` vẫn 0 dòng · `app.can_global_read()` vẫn không có họ · và **vẫn không chốt được ở cả ba phạm vi**, đo cả bằng hàm lẫn bằng một lệnh `insert` thẳng vào cơ sở dữ liệu |
| 3 | D-66 | Cha sở/Cha phó **không** chốt báo cáo | **Siết** | M11 | ✅ **XONG 2026-08-11** (M11-A) — `20260811000100`, pgTAP `050` **38 bài JWT thật của 9 vai trò**. 🔴 **Siết bằng cách TÁCH MỘT HÀM LÀM HAI, không bằng cách sửa hàm đang có:** `app.can_create_report` từ Phase 6 phục vụ **cả** policy SELECT lẫn policy INSERT của `report_snapshots`, nên sửa thẳng nó là **lấy luôn quyền xem/tải** của hai Cha — trái đúng câu chữ D-66. Nay `app.can_read_report` giữ **nguyên văn** luật cũ, `app.can_create_report` hẹp lại. 🔴 **Và cái bẫy thứ hai sẽ cho pgTAP xanh giả:** không được viết hàm hẹp bằng `app.can_access_sector`/`app.can_access_class` vì **hai hàm ấy tự gọi `can_global_read()` bên trong** — một bản siết chỉ đổi nhánh `global` vẫn cho Cha sở chốt ở phạm vi ngành và lớp, tức siết **một nhánh trong ba**, và bộ kiểm chỉ đo nhánh `global` sẽ xanh trọn vẹn. **Delta đo bằng cách liệt kê 14 vai trò × 3 phạm vi: đúng ba cái tên mất quyền chốt** — Cha sở · Cha phó · Thủ quỹ; **không ai mất quyền đọc**, có bài pgTAP canh riêng vế đó. ⚠️ **Siết quyền của người đang dùng — phải báo trước cho Cha sở và Cha phó**, nếu không hai vị mở trang Báo cáo, thấy mất nút "Chốt báo cáo", và kết luận hệ thống hỏng |
| 4 | D-70 | Phụ huynh/Thiếu nhi chỉ thấy lớp mình | **Siết** | M02/M13 | ✅ **XONG 2026-07-26** (M02-C) — `20260726000300`, pgTAP `035` 18 test bằng JWT thật. ✅ **RÀ LẠI 2026-08-12 (M13-A)** cho màn hình mới: danh sách + chi tiết dùng `getMyChildren(profileId)`; E2E URL con người khác trả 404, không lộ tên; pgTAP toàn bộ **1385/1385** giữ xanh |
| 5 | D-74 | Khoá bảng điểm về GLV đại diện + GLV lớp | **Siết** | M07 | ✅ **XONG 2026-08-05** (M07-B, kèm **D-151**) — `20260805000200`, pgTAP `044` **54 bài JWT thật**. 🔴 **Ba tầng đang nói ba điều khác nhau, và `08_ACCEPTANCE_CRITERIA` §5 từ chối viết tiêu chí nghiệm thu cho tới khi chủ dự án chốt:** `docs/05` §5 *"chỉ đại diện"* · RPC `lock_gradebook` cho cả `can_global_write` · `canLock` ở `queries.ts` liệt kê tay năm vai trò và **không kiểm lớp** (đại diện lớp A thấy nút "Khóa" trên lớp B). Nay cả ba trỏ về **một cái tên** `app.can_lock_gradebook`. Kèm **AC-10-02**: khóa lần hai không đẩy lùi `locked_at` — mốc ấy là thứ duy nhất trả lời được *"bảng điểm chốt lúc nào"* và bảng không có lịch sử. ⚠️ **Siết quyền của người đang dùng — phải báo trước cho Ban điều hành xứ đoàn**, nếu không họ mở bảng điểm ra, thấy mất nút "Khóa", và kết luận là hệ thống hỏng |
| 6 | D-75 | Ẩn ghi chú điểm danh khỏi cổng phụ huynh | **Siết** | M05/M13 | ✅ **XONG 2026-08-03** (M05-B) — `20260803000300`, pgTAP `042` **35 bài JWT thật**. 🔴 **Siết bằng QUYỀN CỘT, không bằng một nhánh trong policy** — và khác cả cách D-67 đã dùng: ở M03-C Thủ quỹ chưa đọc được dòng nào nên chỉ cần mở một cửa sổ hẹp; ở đây phụ huynh **đang** đọc đúng dòng của con mình và phải tiếp tục đọc được (AC-F14 *"Portal — giữ nguyên"*), còn thẻ chuyên cần thì cộng qua view `security_invoker` nên cắt dòng là mất luôn thẻ. Vì vậy `authenticated` mất `select` **mức bảng** và được cấp lại **từng cột trừ `note`**; nhân sự đọc qua `attendance_session_notes()` mang đúng ba nhánh nhân sự của policy. Hệ quả đo được: `012:280-308` **vẫn xanh** (phụ huynh vẫn đúng 1 dòng), thẻ chuyên cần vẫn cộng đủ, mà cột ghi chú thì **không ai** đọc thẳng được nữa. Phần M13 (giao diện cổng) chờ tới lượt module đó và **phải rà lại** vì nó thêm màn hình mới |

> ⚠️ **Bốn thay đổi siết quyền làm giảm quyền của người đang dùng** — phải báo trước,
> nếu không họ tưởng hệ thống hỏng. Riêng D-70 phải **rà lại toàn bộ cổng phụ huynh**.

---

## 3. Nợ kỹ thuật đang mở

| # | Nợ | Chỗ | Trả ở đâu |
|---|---|---|---|
| 1 | ✅ **ĐÃ TRẢ HẾT ở M07-C (2026-08-06).** `grep -rn "window.confirm\|window.alert" src/` = **0** — trong `src/` chỉ còn hai dòng **chú thích** ở `dialog.tsx`/`confirm-dialog.tsx` ghi rằng chúng thay cho nó. Bốn chỗ cuối: xóa/ẩn cột · xóa nhận xét · công bố Top 5 · khóa và mở khóa bảng điểm; cả bốn nay nêu hậu quả **bằng tên riêng** (tên cột · tên lớp · tên em · tên người viết · số bản lịch sử). 🔴 **Cái bẫy khi gỡ**: nút "Công bố snapshot" đọc `event.currentTarget.form` ngay trong `onClick` — đúng với `window.confirm` vì lời hỏi **chặn luồng đồng bộ**, sai với hộp thoại thật vì cây DOM dựng lại giữa hai lượt; phải chụp `FormData` **trước khi** mở hộp thoại. ~~**4 chỗ `window.confirm`** còn lại (M01-A trả 1, **M06-C trả 2**)~~ | M07 (4) — cả bốn ở `gradebook-editor.tsx` | **M07-C** — cố ý **không** trả ở đợt A: `11` §4 bước 3 buộc sửa nghiệp vụ/phân quyền **trước** rồi mới sửa giao diện, mà hai trong bốn chỗ ấy (xóa cột · công bố Top 5) sẽ **đổi hẳn nội dung câu hỏi** sau TB-M07-01 và TB-M07-06 ở đợt B/C — làm bây giờ là làm hai lần. Mỗi chỗ đã có chú thích `NỢ 2B` + `eslint-disable-next-line` — grep `NỢ 2B` ra hết. **Đếm lại ở M07-A: `grep -rn "window.confirm\|window.alert" src/` vẫn ra đúng 4, tất cả cùng một file**<br><br>**Cập nhật M07-B — vẫn đúng 4 chỗ, nhưng NỘI DUNG CÂU HỎI đã đổi hết**, và đó chính là lý do đợt A/B cố ý hoãn: nút xóa cột nay hỏi **hai câu khác nhau** tùy cột đã có điểm hay chưa (*"mất luôn, không lấy lại được"* ↔ *"điểm được giữ nguyên, nhưng cột biến khỏi bảng điểm, bản xuất, điểm trung bình, Top 5 và cổng phụ huynh"*), còn câu xóa nhận xét nay nói ra điều bản cũ giấu: **hệ thống không lưu lịch sử nên không lấy lại được**. Làm `ConfirmDialog` ở đợt A hay B là làm hai lần |
| 2 | **Bí danh token cũ** trong `tailwind.config.ts` (`primary`, `card`, `muted`…) | toàn hệ thống | Gỡ dần khi từng module được redesign |
| 3 | `accent-check.mjs` còn giá trị Nghĩa Sĩ cũ `#825600` (đo 4,49 — **trượt**) | script | Cập nhật script thành `#815600` (đo 4,51 — đạt) như bảng `09` §4.1. **Code đã dùng giá trị đúng.** |
| 4 | ✅ **ĐÃ TRẢ ở M13-B (2026-08-12).** `data-density="comfortable"` được gắn ở cả hai layout portal; nền chữ 17px, chữ nhỏ 14px, control 48px | `/parent/*`, `/student/*` | **M13-B** |
| 5 | 🔴 **Bổ ngữ độ mờ trên token màu không sinh CSS** (`border-success/30`, `bg-warning/10`, `hover:bg-accent/40`, `bg-secondary/45`, `text-primary-foreground/85`…). Các đợt M02/M03/M12 đã trả phần module của mình; **M13-B trả `attendance-history`** bằng viền semantic đặc. Quét mã cuối M13 còn đúng **14 vị trí thật**: `alert` 4 · `badge` 4 · `(auth)/layout` 4 · `gradebook-editor` 1 · `promotion-board` 1 | ~~`classes`~~ · ~~`students` (danh sách)~~ · ~~`imports`~~ · ~~`attendance-history`~~ · `badge` · `alert` · `(auth)/layout` · `gradebook-editor` · `promotion-board` | Đúng module/component đó. Token là `var()` trần nên Tailwind bỏ lớp màu có bổ ngữ. Cách trả: dùng token đặc có sẵn (`*-subtle`) hoặc thêm token mới ở `09` §3 |
| 6 | ~~`AppSidebar` còn chữ tạm và chưa có nút Đăng xuất~~ | — | ✅ **ĐÃ TRẢ ở M14-A.** Chân thanh bên nay là nút Đăng xuất; `grep "P0-T3" src/` = **0** (AC-B1) |
| 7 | **30/33 component đã dựng nhưng chưa trang nào dùng.** Đúng thiết kế của Đợt 0-UI (`11` §2: "chi phí một lần, không nhân theo module"), nhưng nghĩa là chúng mới chỉ được kiểm bằng unit test, **chưa chạy trong một trang thật**. Đã dùng thật: `AcademicYearSwitcher` (0.9) · `Dropdown` (M14-A) · `Alert` (M14-A) · `EmptyState` (M14-B) · **`ThemeScope` · `ContextIndicator` · `UnassignedBanner` (M14-C — chạy trên MỌI trang vì nằm trong vỏ)** · **`Textarea` (M09-A — `WeeklyPlanEditor` là trang nghiệp vụ đầu tiên dùng nó thay cho chuỗi class chép tay)**. · **`Select` · `Dialog` · `ConfirmDialog` (M09-B — `/committees/<id>` là trang thật đầu tiên dùng cả ba; `equipment-board.tsx` không còn thẻ `<select>` trần nào)**. **M09-C thêm: `Tabs` · `EmptyState` (trang chi tiết Ban là chỗ đầu tiên dùng thật).** **M12-A thêm: `Select` · `ConfirmDialog` · `EmptyState` · `Badge` vào `/imports` — bốn ô chọn trần cuối của module (lớp đích · giới tính · xử lý dòng) không còn thẻ `<select>` nào chép tay.** **M02-B thêm: `ThemeScope` dùng ở mức `themeKey` (thẻ lớp mang màu ngành, 09 §4.4 #10 — trước đó `ThemeScope` chỉ được dùng một lần cho cả vỏ ứng dụng); `Select`/`Textarea` vào `/classes/[classId]`, xoá hai `<select>` trần cuối của trang.** **M12-B thêm hai tên KHÓ nhất và là lần đầu chúng chạy thật: `Pagination` và `FilterBar`** — cả hai vào **cả hai** trang của module (`/imports` lọc theo năm học + trạng thái, `/imports/[batchId]` lọc theo trạng thái dòng, 50 dòng/trang). Đây là hai component `05` §3.3 đòi từ đầu mà **không trang nào trong hệ thống dùng** cho tới nay; `/students` của M03-B tự dựng phân trang riêng. `DataTable` vẫn **chưa** dùng và có lý do đo được: nó là bảng **chỉ đọc** khung sườn cố định, không xếp lại được thành thẻ theo bề ngang, nên bảng sửa dòng của M12-B phải viết tay (**D-134**). **M05-C thêm hai tên nữa, và một trong hai là tên được dựng RIÊNG cho màn hình này: `SegmentedControl`** — chú thích đầu file của nó viết từ Đợt 0-UI đã nêu đúng con số *"hai `<select>` cho mỗi em, nhân 50 em một lớp"*, nhưng tới M05-C nó mới chạy ở đúng chỗ ấy; kèm **`SearchInput`** vào ô tìm tên của roster (trước đó chỉ `/imports` dùng). Đợt này mở rộng `SegmentedControl` **hai prop cộng thêm, không đổi hành vi cũ**: `ariaLabel` cho từng ô (nhãn nhìn thấy phải rút gọn vì bề ngang 360px, nhưng trình đọc màn hình phải nghe câu đầy đủ) và `disabled` cho **cả nhóm** qua `<fieldset disabled>` — lan xuống mọi ô là việc của trình duyệt, nên thêm một lựa chọn mới về sau **không thể quên khoá**. Còn lại chủ yếu là `Toast` · `FileUpload` · `Tooltip` — chờ module có biểu mẫu dài | toàn hệ thống | Từng module. `Toast` chưa dùng ở M09 (giữ `FormMessage role=status` sẵn có cho phản hồi ghi) — chờ module có biểu mẫu dài |
| 8 | ~~`.env.production.local` bị Next nạp trước `.env.local`~~ — ✅ **ĐÃ TRẢ ở 0.9.** File đổi tên thành **`.env.production.deploy`** (chủ dự án duyệt 2026-07-23, D-85). Next chỉ tự nạp bốn tên `.env` · `.env.local` · `.env.<NODE_ENV>` · `.env.<NODE_ENV>.local`, nên tên mới không bao giờ được nạp; `seed:prod` vẫn chạy vì gọi qua `node --env-file=` tường minh. Đã sửa `package.json`, `scripts/seed-production.mjs`, `scripts/run-e2e.mjs`, `docs/12` §4b. **Hai chốt chặn của runner E2E vẫn giữ** để bắt trường hợp ai đó tạo lại file tên cũ | — | xong |
| 9 | ~~**E2E của mục 0.9 chưa chạy.**~~ | — | ✅ **ĐÃ TRẢ ở M14-A.** `responsive.spec.ts` **3/3 xanh** trên 360 · 768 · 1366 — tức thanh đầu trang có thêm năm học **không** làm tràn ngang ở 360px, và vùng chạm của nó vẫn đạt ngưỡng 44px |
| 10 | ⚠️ **Hai ca E2E chập chờn ở M07 bảng điểm.** Chỗ rớt: sau khi bấm **"Mở khóa"** thì chữ "Đang mở" không kịp hiện (`results.spec.ts:298`). **Không phải hỏng do M14-A**, và đây là bằng chứng chứ không phải suy đoán: *cùng một bản build*, `laptop-1366` **xanh** ở lượt chạy đầy đủ rồi **đỏ** ở lượt chạy lại, còn `tablet-768` thì ngược lại; `teaching-plan.spec.ts` cũng đỏ một lượt rồi xanh 3/3 lượt sau. Hai nghi phạm: (a) nút đó là `window.confirm` gốc trình duyệt trên một nút cần JS đã hydrate — bộ test **không** có vòng thử lại như helper đăng nhập vẫn làm, (b) ba viewport dùng chung một database. Cách trả dứt điểm: **thay `window.confirm` bằng `ConfirmDialog`** — đã nằm sẵn trong nợ #1. ⚠️ **Lượt chạy của M14-B xanh cả 3 viewport (129/129) nhưng nợ VẪN MỞ**: lượt đó chạy trên DB vừa `db:reset` + `seed:dev`, tức đúng điều kiện dễ xanh nhất, và nguyên nhân gốc chưa hề được đụng tới. Một lượt xanh không phải bằng chứng đã sửa.<br><br>**Cập nhật M14-C — nợ này RỘNG HƠN "hai ca ở M07":** lượt đầy đủ của đợt C rớt 2 ca, một ở `results.spec.ts:307` (laptop-1366) và một ở `committees.spec.ts:200` (mobile-360). Chạy lại riêng hai spec đó trên DB sạch: `committees` **xanh**, `results` rớt lại nhưng ở **dòng 221** — tức **ba lượt chạy rớt ở ba dòng khác nhau** (298 · 307 · 221). Cả bốn chỗ rớt đều cùng một hình dạng: *"ghi xong, trang không kịp hiện trạng thái mới trong 5 giây"*. Lượt cô lập đó mất **1,6 giờ cho 12 test** trong khi cùng bộ vừa chạy 9,5 phút ⇒ **máy đang bị tải nặng**, và đó là biến số chi phối. Đổi tên nợ: không phải "hai ca ở M07" mà là **"khẳng định sau-thao-tác-ghi chờ cứng 5 giây, đủ mỏng để rớt khi máy chậm"** <br><br>**Cập nhật M03-B — lần đầu KHOANH ĐƯỢC bằng số đo rằng cơ sở dữ liệu VÔ CAN, và nhìn thấy nợ này trên luồng `useActionState`.** Ba lượt chạy khác nhau bắt được **cùng một hình dạng**, và nó cụ thể hơn "khẳng định chờ cứng": ảnh chụp lỗi cho thấy nút vẫn mang chữ **"Đang lưu…" / "Đang tạo hồ sơ…" ở trạng thái vô hiệu**, tức **vòng gọi Server Action chưa về** — không phải trang dựng sai, cũng không phải bộ định vị sai. Số đo loại cơ sở dữ liệu khỏi diện nghi vấn: `perf:smoke` với **909 thiếu nhi** cho truy vấn nặng nhất của `/students` **52 ms**, đếm tổng **13 ms**, tìm không dấu **14 ms**, dò trùng **10 ms**, `list_guardian_options` **47 ms** đo thẳng bằng JWT thật trong psql. Quy luật quan sát được: **bài rớt gần như luôn là thao tác GHI ĐẦU TIÊN của lượt chạy** (viewport `mobile-360` chạy trước), và **bài nào rớt thì đổi giữa các lượt**; chạy lại spec đó thì xanh (`students-directory` **27/27** hai lượt liên tiếp). Nghi phạm mới, chưa kiểm chứng: **thư mục dự án nằm trong OneDrive**, nên lượt nạp mô-đun đầu tiên của một Server Action đọc rất nhiều tệp qua trình lọc đồng bộ. Đã nới ngưỡng chờ của **ba khẳng định sau-thao-tác-ghi** ở `enrollment-lifecycle.spec.ts` từ 20 lên **45 giây** và ghi rõ lý do ngay tại chỗ — **đây là che triệu chứng, không phải chữa**, nguyên nhân gốc vẫn mở || `results.spec.ts` · `committees.spec.ts` · `gradebook-editor.tsx` | **M07** trả phần `window.confirm`; phần chờ cứng 5 giây nên nâng thành helper `clickUntil` như `attendance.spec.ts` đã làm.<br><br>**Cập nhật M09-C:** đã trả phần này **cho riêng `committees.spec.ts`** — helper `expectSoon` chờ tới 20 giây cho đúng loại khẳng định "hiện sau khi làm mới" (con số khả dụng/tổng kho, tiêu đề vừa đăng). Sau đó `committees.spec.ts` **9/9 xanh** cả 3 viewport ở lượt cô lập. Phần `results.spec.ts` (`window.confirm` + chờ cứng ở M07) **vẫn mở**, trả ở M07.<br><br>**Cập nhật M04-A — 20 giây VẪN CHƯA ĐỦ khi máy tải nặng.** Lượt đầy đủ của đợt A rớt 2 ca: `results.spec.ts:259` (nhánh `window.confirm`) và `committees.spec.ts:353` ("Khả dụng 4/4" sau thao tác ghi — chính chỗ `expectSoon` 20 giây đã canh). Chạy **cô lập** hai spec đó trên DB sạch ngay sau đó: **24/24 xanh**. Đây là bằng chứng thứ ba cho cùng một kết luận — biến số chi phối là **tải máy**, không phải mã ứng dụng. Ghi nhận thêm một họ hàng của nợ này do đợt A tự gây ra và **đã trả ngay**: bài test *một chiều* không tự dọn dữ liệu nên xanh ở viewport đầu rồi đỏ ở hai viewport sau (ba viewport chung một DB); `staff-transfer.spec.ts` nay đọc trạng thái hiện tại rồi **chuyển qua chuyển lại** giữa hai lớp.<br><br>**Cập nhật M02-C — bằng chứng thứ tư, và lần này khoanh thêm được một biến số THỨ HAI.** Lượt đầy đủ của đợt C rớt 6 ca ở 5 spec khác nhau (`class-settings:163`, `results:201` ×2 viewport, `teaching-plan:82`, `staff-directory` phân trang, `academic-year:104`), **tất cả cùng một hình dạng**: *"ghi xong, trang không kịp hiện trạng thái mới trong 5–20 giây"*. Chạy lại `class-settings` cô lập: bài `:163` **xanh**, nhưng bài `:102` **rớt** — tức lại **đổi dòng** lần nữa. Đọc ảnh chụp lỗi của `:102` cho ra điều mới: **hộp xác nhận ĐANG MỞ**, nghĩa là lớp "Hiệp 1" đã có thiếu nhi ghi danh trong khi bài test giả định nó trống (BR-M02-N11). Không phải lỗi thời gian mà là **dữ liệu bị spec khác làm bẩn trong lượt chạy trước**. ⇒ Nợ này thực ra là **hai nợ chồng nhau**: (a) khẳng định sau-thao-tác-ghi chờ cứng, mỏng khi máy chậm; (b) **các spec dùng chung một database và không spec nào tự dọn dữ liệu của mình**, nên chạy lại mà không `db:reset` + `seed:dev` là chạy trên một hệ thống khác. Điều (b) giải thích luôn vì sao "tập bài đỏ đổi chỗ giữa hai lượt" — và nó nói rằng **mọi con số E2E chỉ có nghĩa khi đi kèm câu "chạy trên DB vừa reset + seed"**<br><br>🔴 **Cập nhật M03-C — bằng chứng thứ năm, và lần này khoanh được thêm một điều CỤ THỂ: thao tác ghi ĐÃ VÀO cơ sở dữ liệu, chỉ có câu trả lời là không về.** Các đợt trước mới chỉ thấy "nút còn nguyên chữ *Đang lưu…*". Đợt này đo được cả hai đầu: ngay khi bài test hết 45 giây chờ, `psql` cho thấy `students.status` và `enrollments.status` **đã đổi đúng như thao tác yêu cầu**, còn trình duyệt vẫn ở trạng thái `pending`. ⇒ Loại thêm ba nghi phạm: **không** phải RPC treo, **không** phải RLS từ chối, **không** phải bộ định vị sai. Cái hỏng nằm ở **vòng trả lời của Server Action** (Next 15.5 trên máy này), đúng như M02-B đã nghi. Tần suất đo được ở ba lượt chạy cô lập liên tiếp của cùng một spec: **5 lần treo trên khoảng 20 vòng ghi** — cao hơn hẳn "thỉnh thoảng". <br><br>**Và đây là thiệt hại thật của nợ này, quan trọng hơn con số đỏ:** một bài ghi rớt giữa chừng **để lại dữ liệu ở trạng thái dở dang**, nên **năm bài sau đỏ theo** dù chúng không có lỗi gì — em nằm lại ở "Tạm nghỉ" mà bộ lọc mặc định của `/students` chỉ hiện em *đang sinh hoạt*. Cách chặn thiệt hại (M03-C đã làm, **các module sau nên làm theo**): (1) mọi bài E2E **ghi** dữ liệu phải bọc `try/finally` và trả lại trạng thái **kể cả khi chính nó rớt**; (2) helper mở bản ghi phải tra với bộ lọc **rộng nhất** (`status=all`), không dựa vào bộ lọc mặc định. Không có hai lớp đó thì một lỗi ngẫu nhiên biến thành năm lỗi và **tập bài đỏ không còn nói lên điều gì**<br><br>🔴 **Cập nhật M05-C — và đây là cập nhật QUAN TRỌNG NHẤT của nợ này: một bài từng bị gán cho nó hoá ra là LỖI THẬT.** Bài `attendance` TB-06 đỏ 2/3 viewport ở M05-B và được ghi là *"đỏ bằng timeout, bằng chứng là chập chờn chứ không phải hỏng mã"*. Đợt C mở ảnh chụp lỗi ra đọc thì thấy panel đang hiện **"Chưa có đơn xin nghỉ nào đang chờ"** — tức cú bấm **đã chạy**, đơn đã được ghi nhận, chỉ có câu xác nhận là không bao giờ xuất hiện. Nguyên nhân nằm trong mã ứng dụng: `AbsenceReviewPanel` trả về trạng thái rỗng **trước khi** dựng dòng thông báo, nên ghi nhận đơn **cuối cùng** đang chờ thì `router.refresh()` làm danh sách rỗng và câu *"Đã ghi nhận đơn của {tên}"* **bị chính lượt làm mới nó vừa kích hoạt xoá mất**. Vi phạm D-61 ở đúng ca thường gặp nhất, và **không bài unit nào bắt được** vì mọi bài đều dựng lại với danh sách **không đổi**. Đã sửa ở M05-C, có bài `rerender` canh riêng. ⚠️ **Bài học cho các module sau: một bài E2E đỏ bằng timeout KHÔNG tự động là nợ #10 — phải mở ảnh chụp/`error-context.md` ra đọc trước khi gán.** Hai dấu hiệu phân biệt: nợ #10 để lại nút còn nguyên chữ *"Đang lưu…"* ở trạng thái vô hiệu; lỗi thật để lại một màn hình đã đổi xong mà thiếu đúng thứ bài test đang chờ.<br><br>**Cập nhật M05-C, phần thứ hai — một khuyết điểm của chính bộ test đã sửa.** `clickUntil` bấm thẳng vào nút `disabled={pending}` ở lượt thử lại, mà Playwright thì **đợi nút mở ra** thay vì bỏ qua ⇒ một thao tác ghi chậm biến thành **cú treo cứng hết 120 giây** thay vì một vòng thăm dò, và thông điệp thất bại trỏ vào cú bấm thứ hai chứ không nói ra sự thật. Nay có `clickIfEnabled`; cửa sổ chờ mỗi lượt nới 6 → 12 giây (tổng ~48 giây, cùng cỡ mốc 45 giây M03-C đã đặt) và trần mỗi bài 120 → 180 giây. Căn cứ đo được: TB-06 chạy **16,5 giây** trên `laptop-1366` mà vẫn xanh trong khi `tablet-768` đỏ ở mốc 6 giây × 4 lượt<br><br>🔴 **Cập nhật M07-A — phần "chờ cứng" của `results.spec.ts` ĐÃ TRẢ, và đợt này đo được CẢ HAI ĐẦU ở hai lượt rớt khác nhau.** Lượt 1 rớt ở dòng *"thẻ Top 5 vừa tạo"*: `psql` cho thấy **cả hai bản ghi đã nằm trong `leaderboards`**, câu *"Đã tạo bảng Top 5"* đã hiện, nút vẫn kẹt **"Đang tạo…" `[disabled]`**. Lượt 2 rớt ở dòng *"Đã công bố"*: bảng Top 5 **đã `is_published = true` với đủ 5 vị trí**, câu *"Đã công bố 5 vị trí."* đã hiện, hai nút vẫn `[disabled]` và nhãn vẫn là *"Bản nháp"*. ⇒ **Ghi vào được, câu trả lời không về** — nguyên nhân gốc **vẫn mở**, không phải mã ứng dụng. 9 khẳng định *"hiện sau khi làm mới"* nay dùng `expectSoon` (20 giây, cùng mốc `committees.spec.ts` từ M09-C); phần `window.confirm` thuộc **M07-C**. 🔴 **Một số đo phụ định lượng được lời cảnh báo của M02-C về dữ liệu bẩn:** cùng một bộ spec, cùng một bản build — chạy trên DB đã tích tụ dữ liệu 3 lượt trước mất **4,5 phút**, chạy ngay sau `db:reset` + `seed:dev` mất **60 giây**; `results.spec.ts` **cộng thêm 2 cột điểm vào lớp mỗi lượt** |
| 11 | ⚠️ **Đợt C thêm MỘT truy vấn `resolveThemeContext` vào mọi lần dựng trang, và CHƯA ĐO chi phí đó.** Không có bằng chứng nào nói nó gây ra hai ca rớt ở nợ #10 (ba lượt rớt ở ba dòng khác nhau, `committees` xanh khi chạy lại, máy đang tải nặng) — nhưng **cũng chưa có bằng chứng loại trừ**, nên không được ghi là vô can. Truy vấn có `React.cache()` nên đúng 1 lần/request | `src/app/(dashboard)/layout.tsx` | Chạy `npm run perf:smoke` **khi máy rảnh** rồi so với số của Phase 7 (`/dashboard` 13 ms · `/students` 65 ms) ghi ở `WORKLOG.md`. Nếu vượt ngưỡng thì gộp năm học + theme vào một truy vấn |
| 14 | **Mẫu guard sai còn ở 9 file `server/actions.ts` khác.** M09-A sửa hai điều (D-96): guard gọi **ngoài `try`** để `catch` không nuốt `redirect()` của Next, và dùng `requireRouteAccess` thay `requireAuthContext`. Đã trả: `committees` · `equipment` (M09-A) · `auth` (M01-A) · **`staff` (M01-B)** · **`enrollments` + `students` + `guardians` (M03-A)**. Còn ở `theme` · `absence-requests` · `assessments` · `attendance` · `teaching-plans` · `promotions` · `reports` · `notifications` — **8 module**. **M04-A không đụng file nào trong số đó** — `transferClassStaff` viết theo đúng mẫu D-96 ngay từ đầu (guard `requireStaffAccess()` ngoài `try`, quyền hẹp `STAFF_TRANSFER_ROLES` trong `try`). **Không phải lỗ hổng hôm nay** — RLS vẫn chặn ở DB — nhưng nghĩa là luật `ROUTE_RULES` chỉ được thi hành ở tầng trang, và người hết phiên nhận một câu lỗi vô nghĩa thay vì được đưa về `/login`. Grep `requireAuthContext` trong `src/features/*/server/actions.ts` ra hết. **M03-B không đụng file nào trong số 8 module còn lại** — ba file của module này (`enrollments`, `students`, `guardians`) đã trả ở M03-A.<br><br>🔴 **Cập nhật M12-A — nợ này TỪNG BỎ SÓT MỘT MODULE, và cách grep là lý do.** `imports` mắc **đúng cả hai lỗi** của D-96 ở cả **năm** thao tác, nhưng không có tên trong danh sách vì nó gọi qua hàm bọc riêng (`requireImportAccess`) chứ không gọi thẳng `requireAuthContext` — grep theo tên hàm không thấy. Triệu chứng ở đây nặng hơn mức trung bình: `fail()` của module gói **mọi** lỗi lạ thành *"Không xử lý được file import. Vui lòng thử lại."*, nên người hết phiên đăng nhập đọc một câu **mời họ thử lại đúng thứ vừa hỏng**. Đã trả ở M12-A (`importRouteContext` ngoài `try`, `assertImportAccess` trong `try`). ⚠️ **Bài học cho các module sau: grep `requireAuthContext` là chưa đủ — phải đọc cả hàm bọc của từng module**<br><br>✅ **M05-A trả `attendance`** (audit gọi đúng tên lỗi này ở `ACT-I1`): năm thao tác nay gọi `attendanceRouteContext()` — `requireRouteAccess` — **ngoài `try`**. Còn **7 module**: `theme` · `absence-requests` · `assessments` · `teaching-plans` · `promotions` · `reports` · `notifications`. `absence-requests` thuộc **M05-B**<br><br>✅ **M06-A trả `teaching-plans`** — và **đúng cái bẫy M12-A vừa dặn**: module này gọi `requireAuthContext` qua **ba** hàm bọc (`requireManageClass` · `requireManagePlan` · `requireManageItem`), nên grep tên hàm ở tầng action ra **0 kết quả** cho bốn trong bảy thao tác. Nay `teachingPlanRouteContext()` gọi ngoài `try`, ba hàm bọc nhận `context` làm tham số và chỉ còn lo phần quyền theo lớp. Còn **6 module**: `theme` · `absence-requests` · `assessments` · `promotions` · `reports` · `notifications`.<br><br>✅ **M07-A trả `assessments`** — và **lại đúng cái bẫy M12-A dặn**: `requireAuthContext` nấp trong **ba** hàm bọc (`requireGradeClass` · `requireGradeAssessment` · `requireManageLeaderboard`), nên grep tên hàm ở tầng action chỉ thấy **5** trong **15** thao tác. Nay `assessmentsRouteContext()` gọi `requireRouteAccess("/results")` ngoài `try` ở cả 13. Còn **5 module**: `theme` · `absence-requests` · `promotions` · `reports` · `notifications`.<br><br>✅ **M08-A trả `promotions`** — module này gọi **thẳng** `requireAuthContext` nên grep thấy được, ngược hẳn ba lần trước; phần nấp là **quyền theo lớp/ngành** trong `canProposeForClass` / `canReviewSector`, và hai hàm đó phải **ở lại trong `try`** vì chúng ném `AppError` chứ không chuyển hướng. 🔴 **Đính chính danh sách trên: `absence-requests` KHÔNG còn nợ** — M05-B đã trả (`parentRouteContext()` gọi `requireRouteAccess` ngoài `try`), nhưng dòng nợ này chưa được sửa nên nó nằm trong danh sách suốt ba đợt. Còn đúng **3 module**: `theme` · `reports` (M11) · `notifications` (M10) — và hai module sau mắc **cả hai** vế (guard trong `try` **và** dùng sai hàm), còn `theme` chỉ mắc vế thứ hai.<br>⚠️ **Và cách đếm cũng phải đổi:** grep `requireAuthContext` trong `src/features/*/server/actions.ts` nay trả về cả `teaching-plans`, `attendance`, `auth`, `committees`, `enrollments`, `equipment` — tất cả đều **đã trả nợ**, chuỗi khớp nằm trong **lời chú thích** kể lại lỗi cũ. Đếm bằng grep thô từ nay sẽ đếm dư; phải mở file xem lời gọi thật<br><br>✅ **M10-A trả `notifications`** — module này mắc **cả hai** vế đúng như dòng trên dự đoán, ở cả **ba** thao tác. Nay `notificationsRouteContext()` gọi `requireRouteAccess("/notifications")` **ngoài `try`**; ba thao tác mới của đợt B/C (`previewNotificationAudience` · `searchNotificationRecipients` · `retractNotification`) viết theo đúng mẫu ấy ngay từ đầu. Còn đúng **2 module**: `theme` (chỉ mắc vế thứ hai) · `reports` (**M11**, mắc cả hai)<br><br>✅ **M11-A trả `reports`** — mắc **cả hai** vế đúng như dòng trên dự đoán. Điểm riêng của module này: guard phải gọi ở **bốn** cửa vào chứ không phải một — trang `/reports` · Server Action `createReportSnapshot` · route tải file báo cáo · route tải **bản đã chốt** — và cửa thứ tư là cửa dễ sót nhất, vì trước đây nó dựa vào `getReportSnapshot` tự gọi guard bên trong; bỏ lời gọi ấy đi (để hàm dùng lại được từ nhiều nơi) mà quên khai ở cửa vào là **mở một route tải file không có guard**. Nay `reportsRouteContext()` gọi `requireRouteAccess("/reports")` **ngoài `try`** ở cả bốn — và **M11-C thêm hai cửa nữa** (`/reports/snapshots` và `/reports/snapshots/[id]`), cả hai khai guard ngay dòng đầu, thành **sáu**. Còn đúng **1 module**: `theme` — và nó **chỉ mắc vế thứ hai** (dùng sai hàm), không mắc vế `catch` nuốt `redirect()` | ~~2 module~~ → **1 module** (`theme`) | Đúng module đó, khi tới lượt nó trong 2B |
| 13 | ✅ **ĐÃ TRẢ ở M09-C (D-100, 2026-07-24).** `app.can_access_staff` nay có nhánh thứ tư `app.shares_active_committee`: thành viên cùng một Ban đang hoạt động đọc được **đầy đủ** hồ sơ nhau. Tên thành viên Ban khác lớp không còn hiện `—`; thẻ Ban hiện được tên Trưởng/Phó. Kiểm bằng JWT thật (pgTAP `024`). ~~🔴 **Danh sách nhân sự Ban hiện "—" thay cho tên người.**~~ `app.can_access_staff` cho đọc hồ sơ nhân sự khi: quyền toàn cục · chính mình · **cùng lớp**. Nó **không có nhánh "cùng Ban"**, nên một Trưởng ban mở Ban của mình chỉ thấy tên những người tình cờ cùng lớp với mình. Đo bằng JWT thật của GLV909 trên `/committees/<Ban Kỹ thuật>`: Trưởng ban → `—`, một Thành viên → `—`, chỉ chính GLV909 hiện tên. **Không phải lỗi do M09-A gây ra** — nó có từ Phase 6 và chỉ lộ ra khi đợt A cần hiện "bản tuần này do ai lưu". `WeeklyPlanEditor` đã xử lý bằng cách **bỏ hẳn phần tên** khi không đọc được (không in `—` vào chỗ chờ tên người). Cách trả dứt điểm là **nới quyền đọc** `staff_profiles` sang "cùng Ban đang hoạt động" ⇒ là một thay đổi phân quyền, **phải có RLS negative test bằng JWT thật** và cần chủ dự án duyệt.<br><br>**Cập nhật M09-B — nợ này VẪN MỞ, nhưng ô "Người mượn" đã hết bị nó chặn.** D-94 (mọi nhân sự xứ đoàn đều mượn được) không cài được nếu tên người không đọc ra; chủ dự án chọn **D-97 — cửa sổ hẹp chỉ-tên** (`public.list_equipment_borrower_options`) thay vì nới `app.can_access_staff`. Có pgTAP canh đúng **hai điều cùng lúc**: thành viên Ban Kỹ thuật `select` thẳng hồ sơ người Ban Y tế vẫn ra **0 dòng**, mà danh sách người mượn thì **có** người đó. Danh sách thành viên Ban ở `committee-workspace.tsx` **vẫn hiện `—`** | `app.can_access_staff` · `committee-workspace.tsx` · `weekly-plan-editor.tsx` | **M09-C** (hoặc M04 nếu gộp vào đợt rà quyền nhân sự) |
| 15 | ⚠️ **Bấm một thẻ lớp ở `/classes` có ~11–14 % lượt KHÔNG dẫn đi đâu cả.** **M02-B đã ĐO (2026-07-25) và khoanh xong vùng lỗi, nhưng chưa tìm ra nguyên nhân gốc.** Ba giả thuyết, hai bị loại bằng số: **(a) cơ sở dữ liệu — LOẠI:** `perf:smoke` với 910 thiếu nhi cho truy vấn trang chi tiết lớp **17 ms** + ô chọn **8 ms** + `/classes` **21 ms**, tổng ≈25 ms ⇒ **cách chữa cũ ghi ở đây (hoãn dựng bằng `<Suspense>`) là vô nghĩa, không có phần nặng nào để hoãn**; **(b) máy chủ dựng trang — LOẠI:** 9 lượt `goto` thẳng URL đo 432–1 437 ms, **9/9 không treo**; **(c) bão nạp trước 19 thẻ — LOẠI:** 5/36 treo khi có nạp trước so với 4/36 khi `prefetch={false}` (trong sai số) ⇒ xác nhận kết luận "không ăn thua" của M04-B bằng số đo, đã hoàn tác. **Đã khoanh được:** cú bấm **luôn tới đích** (23–123 ms, kể cả khi bỏ qua kiểm tra khả năng bấm bằng `dispatchEvent`) nhưng **9/72 lượt URL không đổi trong 45 giây**, ở cả ba viewport; khi chạy được thì 265–1 269 ms ⇒ lỗi nằm ở **lượt điều hướng phía trình duyệt của Next 15.5** (`router.push` được gọi rồi không bao giờ chốt), **không** phải DB, **không** phải máy chủ, **không** phải lỗi bài test. Bài E2E vẫn dùng `clickUntil`, tức vẫn **che triệu chứng**.<br><br>**Cập nhật M12-B — bằng chứng mới, và nó KHÔNG phải nút bấm hay thao tác ghi.** Lượt chạy đầu của đợt B rớt đúng một bài: liên kết **"Xoá lọc"** của `FilterBar` ở `laptop-1366` (`imports.spec.ts` — bấm xong danh sách vẫn còn nguyên bộ lọc cũ), trong khi **mobile-360 và tablet-768 xanh** ở đúng bài đó. Đây là một `<Link>` **chỉ đọc**: không ghi gì, không gọi Server Action, không hộp thoại — nên nó loại nốt giả thuyết "thao tác ghi chậm" khỏi nợ này và chỉ còn đúng một nghi phạm: **lượt điều hướng phía trình duyệt của Next 15.5**. Đã bọc `clickUntil` (vẫn là che triệu chứng) | 🔴 **Toàn hệ thống**, không phải riêng `/classes`: lượt chạy toàn bộ E2E cuối đợt (244/246) rớt đúng hai bài **`staff-directory` "phân trang sang trang 2"** với cùng thông điệp *"bấm nhiều lần vẫn không có hiệu lực"* — `<Link>` khác route, khác kiểu phần tử. Lượt trước đó (236/246) thì hai bài đó xanh mà `class-settings`/`committees`/`results` rớt ⇒ tập bài đỏ **đổi chỗ giữa hai lượt** | **Nghi vấn dẫn đầu (CHƯA kiểm chứng):** `middleware` làm mới token Supabase trên **mọi** request kể cả request RSC; xoay refresh-token là thao tác **một-lần-dùng** nên hai request cùng lúc thì một cái nhận token đã thu hồi. Khớp cả ba dữ kiện: `goto` (request đơn độc) không bao giờ treo · lượt điều hướng (chạy cạnh request khác) thỉnh thoảng treo · tắt nạp trước không đổi tỷ lệ. Cách kiểm: log thời điểm vào/ra `updateSession` + `sb-*-auth-token`, soi đúng lượt treo. **Không còn là nợ của M02** |
| 16 | ⚠️ **`redirect()` về CHÍNH ROUTE ĐANG ĐỨNG là một quả mìn im lặng trong toàn hệ thống** (D-114). M02-A đo được: thanh địa chỉ đổi, `<main>` trắng vĩnh viễn, **không lỗi ở bất kỳ log nào**. Các module đã đóng chưa vấp vì chúng luôn chuyển hướng sang **trang khác** (`/staff` → `/staff/<id>`), nhưng đó là may chứ không phải thiết kế — grep `redirect("/` trong `src/features/*/server/actions.ts` rồi đối chiếu với trang chứa biểu mẫu. Không sửa gì ở đợt này ngoài phạm vi M02 | `src/features/*/server/actions.ts` | Đúng module đó khi tới lượt. Cách trả: đổi sang `useActionState` như M02-A |
| 17 | **6 Ban mặc định vẫn nằm ở `seed.sql`**, không đi theo migration như danh mục 19 lớp vừa chuyển ở M02-A (I3). Nghĩa là một project Supabase mới vẫn cần bước nạp seed thủ công của `docs/12` §4a — chỉ khác là quên bước đó nay **không còn giết cơ cấu lớp**, mà chỉ làm rỗng phần Ban/kho thiết bị. Cố ý **không** gộp vào M02-A: bảng `committees` thuộc M09, module đã đóng, và mở rộng phạm vi lặng lẽ là điều `AGENTS.md` §4 cấm | `supabase/seed.sql:62-70` | Bất cứ lúc nào chủ dự án đồng ý — cùng khuôn `20260725000100_reference_catalog` |
| 18 | 🔴 **Hàng rào "năm học đã đóng thì không ghi được" mới chỉ có ở HAI bảng** — `enrollments` và `classes` (**D-118**, chủ dự án chốt 2026-07-26). Điểm danh · bảng điểm · Top 5 · chuyển lớp · báo cáo · giáo án · xin phép vắng **vẫn ghi được** vào một năm đã đóng nếu gọi thẳng Data API bằng JWT thật, với mọi vai trò có quyền trên bảng đó. Đây **không** phải sơ suất mà là phạm vi đã chốt: các bảng còn lại thuộc 5 module chưa được thiết kế lại và chưa audit chéo, và `07_IMPLEMENTATION_IMPACT.md` xếp I8 **rủi ro cao** vì đánh dấu sai một năm là dừng khả năng ghi của cả phần đó. Cách trả: thêm `and academic_year_id = any ((select app.writable_academic_year_ids())::uuid[])` vào policy INSERT/UPDATE của từng bảng — helper đã có sẵn, mỗi module chỉ cần một dòng cộng pgTAP negative bằng JWT thật. Grep `academic_year_id uuid` trong `supabase/migrations` ra hết danh sách bảng 🔴 **Cập nhật M05-A — hai bảng điểm danh ĐÃ TRẢ, và cách trả KHÁC hẳn cách ghi ở đây.** Dòng "mỗi module chỉ cần một dòng thêm vào policy" **đúng với `enrollments`/`classes` nhưng SAI với điểm danh**, và một phiên sau chép khuôn M02-C sẽ dựng một hàng rào giả: `authenticated` **không có** `insert/update` trên ba bảng điểm danh (`20260721000300:283-285`), mọi đường ghi đi qua RPC `security definer`, mà definer **chạy dưới quyền chủ hàm nên bỏ qua RLS** ⇒ điều kiện thêm vào policy **không bao giờ được chạy**. Hàng rào của M05-A nằm **trong bốn RPC** (`claim` · `takeover` · `heartbeat` · `save_and_finalize`), dùng đúng helper `app.writable_academic_year_ids()` nên **D-117 vẫn đứng**: Super Admin sửa được năm đã đóng. pgTAP `041` có 3 bài chặn cộng 1 bài chứng minh ngoại lệ. ⚠️ **Bài học cho sáu module còn lại: xem bảng đó ghi bằng policy hay bằng RPC TRƯỚC khi chọn chỗ đặt hàng rào.** `absence_requests` **chưa** trả — nó ghi thẳng qua policy nên đúng khuôn M02-C, và thuộc phạm vi **M05-B**<br><br>🔴 **Cập nhật M07-B — bốn bảng của module bảng điểm ĐÃ TRẢ, và module này chứa CẢ HAI ca cùng lúc.** `assessments` · `student_comments` · `leaderboards` có `insert/update/delete` mức bảng ⇒ hàng rào vào **policy**, đúng khuôn M02-C. `assessment_scores` thì `authenticated` **chỉ có `select`** (`20260722000400:488`): mọi đường ghi qua RPC `security definer`, mà definer bỏ qua RLS ⇒ điều kiện thêm vào policy **không bao giờ chạy**. Hàng rào của bảng ấy nằm **trong bốn RPC** — `save_assessment_scores` · `refresh_attendance_assessment_scores` · `reset_attendance_score_override` · `delete_assessment` (mới) — cộng `publish_leaderboard`, vì nó ghi `leaderboard_entries` **và** cập nhật `leaderboards` bằng definer nên cả hai policy vừa sửa đều đứng ngoài. pgTAP `044` đo **hai cơ chế bằng hai cách**: policy `using` lọc dòng trong im lặng ⇒ đo **kết quả**; RPC có ngoại lệ thật ⇒ đo `throws_ok`. Đo nhầm cơ chế là dựng một bài kiểm **xanh vĩnh viễn**. D-117 giữ nguyên. ⏸️ `gradebook_locks` **cố ý không đóng**: nó không nằm trong danh sách bốn bảng, và khóa một bảng điểm của năm đã đóng là thao tác vô hại (chỉ siết thêm) trong khi mọi đường **ghi** đã bị bốn bảng kia chặn. Còn **4 bảng / 3 module**<br><br>📌 **Ghi trước cho M08-B (đã xác định ở M08-A, chưa làm):** bảng của module chuyển lớp là `promotion_reviews`, **không** phải một bảng tên `promotions` như dòng "Trả ở đâu" đang ghi. Nó chỉ có `grant select` cho `authenticated` (`20260722000700_promotions.sql:342`) và **mọi** đường ghi đi qua RPC `security definer` ⇒ đây là ca **RPC**, khuôn **M05-A**, **không** phải khuôn M02-C; điều kiện thêm vào policy sẽ **không bao giờ chạy**. Hàng rào phải nằm trong `propose_promotion` và `approve_promotion_review`. ⚠️ Và ở module này câu hỏi *"năm nào phải mở"* có **hai** câu trả lời khả dĩ — năm nguồn hay năm đích — vì một đề xuất chuyển lớp bắc qua **hai** năm học; chọn sai vế là chặn đúng thao tác cuối năm mà module sinh ra để làm<br><br>✅ **M08-B ĐÃ TRẢ cho `promotion_reviews` (2026-08-07), và lời ghi trước ở trên đúng cả hai vế.** Ca **RPC**, khuôn M05-A: hàng rào nằm trong `propose_promotion` và `approve_promotion_review`, không đụng policy nào. Câu hỏi *"năm nào phải mở"* được chủ dự án trả lời ở **D-160: cả hai** — đề xuất đòi **năm nguồn** còn ghi được (bước ấy chưa chạm năm đích), duyệt đòi **cả hai** (đóng ghi danh cũ ở năm nguồn **và** tạo ghi danh mới ở năm đích). 🔴 **Vế năm đích là vế dễ quên nhất và cũng là vế nguy hiểm nhất:** policy `enrollments_insert_scope` đã mang đúng điều kiện ấy từ M02-C (`20260726000200:72`), nhưng RPC chạy `security definer` nên **bỏ qua policy** — bỏ vế này là mở một đường vòng đi xuyên qua chính hàng rào M02-C vừa dựng. D-117 giữ nguyên (pgTAP `046` có bài chứng minh Super Admin vẫn đề xuất được trong năm đã đóng). Còn **2 bảng / 2 module**: `report_snapshots` (M11) và bảng của M10<br><br>🔴 **Đính chính M10 — vế "bảng của M10" KHÔNG TỒN TẠI.** Đo chứ không đoán: `grep academic_year_id` trên **cả ba** migration của module thông báo (`20260723000400` · `20260809000100` · `20260810000100`) trả về **0 kết quả**. Cả `notifications` lẫn `notification_recipients` đều **không** mang cột năm học, nên không có bề mặt nào để dựng hàng rào — và đúng cả về nghiệp vụ: gửi một thông báo trong lúc năm học đã đóng là thao tác bình thường (*"năm học đã kết thúc, sau đây là việc tiếp theo"*), khác hẳn việc ghi một điểm số vào năm đã chốt sổ. ⚠️ **Bài học: danh sách nợ này được lập bằng cách liệt kê module, không phải bằng cách liệt kê bảng có cột năm học — nên nó ghi dư một module suốt bốn đợt.** Còn đúng **1 bảng / 1 module**: `report_snapshots` (M11)<br><br>✅ **M11-A TRẢ NỐT — NỢ #18 ĐÓNG HẲN (2026-08-11).** `report_snapshots` là ca **policy**, khuôn M02-C: `authenticated` có `insert` ở **mức bảng** (`20260723000500:262`) và **không** đường ghi nào đi qua RPC, nên điều kiện thêm vào `with check` là chỗ đúng — ngược hẳn bốn ca RPC trước đó (M05-A · M07-B · M08-B). Đúng như bài học M05-A đã dặn: **xem bảng đó ghi bằng policy hay bằng RPC TRƯỚC khi chọn chỗ đặt hàng rào.** Không mâu thuẫn WF-16 vì bước 3 (*chốt báo cáo năm*) đứng **trước** bước 4 (*đặt năm học `closed`*), và bước 5 nói thẳng *"không cho ghi mới trừ Super Admin"*. D-117 giữ nguyên — pgTAP `050` có bài chứng minh Super Admin vẫn chốt bù được cho năm đã đóng, và một bài nữa chứng minh **quyền xem/tải bản chốt của năm đã đóng không bị đụng**: hàng rào chỉ chặn **tạo** bản mới. 🔴 **Tổng kết món nợ mở từ M02-C (D-118): 10 bảng qua 6 module, và nó chứa CẢ HAI cơ chế — 4 bảng ghi qua policy, 6 bảng ghi qua RPC `security definer` bỏ qua RLS.** Đặt nhầm chỗ ở nhóm thứ hai là dựng một hàng rào **không bao giờ được chạy**, và một bộ kiểm đo nhầm cơ chế sẽ **xanh vĩnh viễn** | ~~`attendance_sessions`~~ · ~~`student_attendance_records`~~ · ~~`absence_requests`~~ · ~~`assessments`~~ · ~~`assessment_scores`~~ · ~~`student_comments`~~ · ~~`leaderboards`~~ · ~~`promotion_reviews`~~ · `report_snapshots` · ~~`teaching_plans`~~ | ~~M05-B~~ · ~~**M07-B**~~ · ~~**M08-B**~~ · **M11** (`report_snapshots`) · ~~M10 — không áp dụng~~ |
| 19 | ⚠️ **Em `paused` (tạm nghỉ) VẪN CÒN TÊN trong danh sách điểm danh** — hệ quả đã biết và đã chấp nhận của **D-121**. Từ M03-A, "Tạm nghỉ" mới thật sự dùng được, nên đây là lần đầu tiên trạng thái này xuất hiện trên dữ liệu thật. Ghép với luật *"điểm danh mặc định có mặt"* (`AGENTS` §8), một em nghỉ dài ngày sẽ được **đánh dấu có mặt** nếu người điểm danh không để ý ⇒ tỷ lệ chuyên cần của lớp đẹp hơn sự thật. **Không phải sơ suất mà là phạm vi đã chốt:** đường (c) của D-121 — loại em tạm nghỉ khỏi sĩ số và khỏi danh sách điểm danh — đụng hai module chưa tới lượt thiết kế lại và làm lệch số liệu báo cáo cũ. Cách trả: khi làm M05, hoặc lọc em `paused` khỏi roster điểm danh, hoặc giữ tên nhưng **mặc định để trống thay vì có mặt** và gắn nhãn "Tạm nghỉ" ngay trên dòng<br><br>🔴 **Cập nhật M03-C — nợ này nay LỚN HƠN.** **D-130** cho trạng thái hồ sơ "Tạm nghỉ" **kéo theo** ghi danh sang `paused`, nên từ đợt này có **hai** cửa vào sinh ra em `paused` (nút ở trang lớp của M03-A, và khối trạng thái hồ sơ của M03-C) thay vì một. Số em ở trạng thái ấy sẽ tăng, và cùng với nó là số lượt điểm danh có thể ghi sai. Phạm vi trả **không đổi** (M05), nhưng mức ưu tiên thì nên xem lại khi tới lượt.<br><br>✅ **ĐÃ TRẢ ở M05-A (D-140, chủ dự án chốt 2026-08-03).** Chọn đường **loại em `paused` khỏi danh sách điểm danh** (không chọn đường "để trống thay vì có mặt" — mặc định `present` nằm trong danh sách KHÔNG ĐƯỢC ĐỔI của `06_UI_UX_RECOMMENDATIONS` §10, và để trống sẽ sinh cảnh báo chuyên cần giả cho chính những em xứ đoàn ĐÃ BIẾT là đang nghỉ). Luật nằm ở `app.attendance_roster_enrollments`; trang buổi ghi *"N em đang tạm nghỉ, không có trong danh sách này"*. 🔴 **Chỗ suýt hỏng không phải chỗ sửa:** `roster_size` khi chốt là một truy vấn **chép tay** cùng luật ở `save_and_finalize_attendance` — giữ nguyên nó thì `record_size < roster_size` thành đúng và **mọi lớp có một em tạm nghỉ không chốt được buổi nào nữa**, với thông điệp *"Danh sách chưa đủ"* vô nghĩa. Hai bên nay gọi cùng một hàm, có pgTAP `041` canh riêng | ~~`attendance` roster~~ · `M05` | ✅ **xong ở M05-A** |
| 20 | ✅ **ĐÃ TRẢ HẾT ở M07-A** — chỗ cuối cùng là `results/[classId]`, bài E2E đo bằng `boundingBox()` ngay đầu luồng bảng điểm. ~~⚠️ **Link "← Danh sách …" trên bốn trang chi tiết chỉ cao 18px**~~ — dưới ngưỡng vùng chạm 44px của `11` §5. **M03-C đã trả chỗ của mình** (`/students/[studentId]`); ba chỗ còn lại thuộc module chưa tới lượt. 🔴 Điều đáng ghi lại không phải lỗi mà là **vì sao không ai thấy nó suốt từ Phase 2**: `responsive.spec.ts` quét **13 địa chỉ cấp một** và **không có địa chỉ chi tiết nào** — mà đúng những trang ấy mới là nơi có nhiều điều khiển nhất. Bài đo tại chỗ của M03-C bắt được ngay lượt chạy đầu. ⇒ **Mỗi module sau nên tự đo trang chi tiết của mình**, đừng chờ `responsive.spec.ts`. ✅ **M12-B đã làm đúng lời dặn đó**: bài đo tại chỗ mới cho `/imports/[batchId]` quét `scrollWidth` và đo bốn điều khiển của bảng sửa dòng (ô chọn giới tính · ô chọn xử lý · nút Lưu · link quay lại) trên cả ba viewport — xanh ngay lượt đầu, tức bảng mới **không** làm tràn ngang máy 360px. ✅ **M05-A trả chỗ thứ ba** (`attendance/[sessionId]`), và làm đúng lời dặn: bài đo tại chỗ dùng `boundingBox()` đo **chiều cao thật đã dựng** chứ không kiểm tên lớp CSS — một chuỗi `min-h-11` viết đúng vẫn có thể bị lớp khác đè, và bài kiểm tên lớp sẽ xanh giả. Đo luôn ba ô chọn của roster trên cả ba viewport. ✅ **M06-A trả chỗ thứ tư** (`teaching-plan/[classId]`) và đo thêm **hai nút chuyển kiểu hiển thị** — chúng dùng `buttonVariants size="sm"`, tức đã đạt 44px từ Đợt 0-UI, nhưng chưa từng có bài nào chứng minh điều đó ở trang này. **Còn một chỗ** | ~~`teaching-plan/[classId]` (M06)~~ · ~~`results/[classId]` (M07)~~ · ~~`attendance/[sessionId]` (M05)~~ | ✅ **xong ở M07-A** |
| 21 | ✅ **ĐÃ TRẢ ở M07-C (2026-08-06)** — mục *"Cột đã ẩn"* gập sẵn trong trang bảng điểm, mỗi cột một nút *"Hiện lại"*, cùng nhóm người được chấm điểm lớp và cùng hàng rào khóa với đường ẩn. **0 thay đổi cơ sở dữ liệu** — policy `assessments_update_grader` đã cho sẵn đường ghi ấy. Hộp xác nhận nói riêng cho ca đáng lo: cột đang ở trạng thái *"Đã công bố"* thì hiện lại là **phụ huynh thấy lại điểm ngay lập tức**. Món nợ này mở ra và đóng lại cách nhau **ba ngày**. ~~⚠️ **"Ẩn cột điểm" là cánh cửa MỘT CHIỀU — không có đường hiện lại trên giao diện**~~ (mở ra ở M07-B). Dữ liệu điểm còn nguyên vẹn: `is_active = false` chỉ đổi khả năng nhìn thấy, và `delete_assessment` vẫn từ chối xóa cứng cột có điểm. Nhưng **mọi truy vấn của module đều lọc `is_active = true`**, nên cột đã ẩn không còn bề mặt nào để bấm vào; ẩn nhầm thì phải nhờ Quản trị viên hệ thống can thiệp ở tầng cơ sở dữ liệu. **Không phải sơ suất mà là phạm vi đã chốt:** `04_TO_BE_FLOWS` TB-M07-01 chỉ mô tả đường ẩn, và dựng đường hiện lại đòi **một bề mặt mới** liệt kê cột đã ẩn. Đợt B **nói thẳng điều đó trong câu xác nhận** thay vì để người dùng tự phát hiện. Cách trả: một mục *"Cột đã ẩn"* gập sẵn trong khối "Cấu hình cột điểm", đọc `is_active = false`, mỗi dòng một nút "Hiện lại" — cùng khuôn nhóm gập của M06-C (D-149), và **cùng nhóm "vòng đời"** mà `07` §7 luật 4 xếp làm cuối | `gradebook-editor.tsx` · `assessments/server/queries.ts` | **M07-C** (cùng đợt với TB-M07-02 và TB-M07-06) |
| 22 | ⚠️ **Lịch sử Top 5 có dữ liệu nhưng CHƯA CÓ MÀN HÌNH đọc lại** (mở ra ở M07-C, D-155). Bảng `leaderboard_snapshots` giữ đủ mọi bản đã bị thay — thứ tự, điểm, tên em, ai thay và lúc nào — có policy (chỉ nhân sự phạm vi lớp) và có pgTAP. Thẻ Top 5 **đã nói ra số bản** đang nằm trong lịch sử nên người dùng biết nó tồn tại, nhưng muốn xem nội dung thì phải nhờ Quản trị viên hệ thống truy vấn. **Không phải sơ suất mà là phạm vi:** `04_TO_BE_FLOWS` không mô tả màn hình nào cho phương án B (nó khuyến nghị phương án A), và dựng thêm một màn hình là mở rộng phạm vi ra ngoài đợt đã chốt (`AGENTS` §4) | `src/features/assessments/` | M11 (Báo cáo) hoặc bất cứ lúc nào chủ dự án yêu cầu — dữ liệu đã sẵn, chỉ thiếu bề mặt |
| 12 | **Hai component trang giữ chỗ nay không nơi nào dùng** (`shared/module-placeholder.tsx`, `shared/protected-module-placeholder.tsx`). Chúng in câu *"sẽ được triển khai ở Phase 1"* — để lại trong repo là một cái bẫy cho phiên sau. Cố ý **không xoá trong đợt C**: xoá file không nằm trong phạm vi đã chốt với chủ dự án | `src/components/shared/` | Xoá khi module M01 dọn phần Auth & Tài khoản, hoặc bất cứ lúc nào chủ dự án đồng ý |

---

## 4. Quyết định phát sinh trong lúc triển khai

> ⚠️ **Đổi mã số.** Phiên trước đặt quyết định `Select` là "D-76", nhưng **D-61…D-79 đã dùng hết**
> trong `06_DECISION_LOG.md` (`AGENTS.md` §13) và D-76 ở đó là *"Trả thiết bị một phần = còn nợ"*.
> Bốn quyết định của Đợt 0-UI nay mang mã **D-80…D-83**; 0.9 thêm **D-84** và **D-85**;
> M14-A thêm **D-86** và **D-87**; M14-C thêm **D-88…D-91**; M09-A thêm **D-92…D-96**;
> M09-B thêm **D-97…D-99**; M09-C thêm **D-100**; M01-A thêm **D-101…D-103**; M01-B thêm **D-104**;
> M04-A thêm **D-105…D-108**; M04-B thêm **D-109** và **D-110**; M04-C thêm **D-111**;
> M02-A thêm **D-112**, **D-113** và **D-114**; M02-B thêm **D-115** và **D-116**;
> M02-C thêm **D-117**, **D-118**, **D-119** và **D-120**; M03-A thêm **D-121** và **D-122**;
> M03-B thêm **D-123**, **D-124**, **D-125** và **D-126**;
> M03-C thêm **D-127**, **D-128**, **D-129** và **D-130**;
> M12-A thêm **D-131**, **D-132** và **D-133**;
> M12-B thêm **D-134**, **D-135** và **D-136**;
> M12-C thêm **D-137** và **D-138**;
> M05-A thêm **D-139** và **D-140**; M05-B thêm **D-141**; M05-C thêm **D-142** và **D-143**;
> M06 (A/B) thêm **D-144…D-147**; M06-C thêm **D-148** và **D-149**;
> M07-A thêm **D-150** và **D-151**. M07-B thêm **D-152** và **D-153**. M07-C thêm **D-154** và **D-155**.
> **M08 (trước khi mở module) thêm D-156…D-159; M08-B thêm D-160, D-161 và D-162;
> M08-C thêm D-163 và D-164.**
> **M10 (trước khi mở module) thêm D-165, D-166 và D-167; M10-C thêm D-168.**
> **M11-A thêm D-169; M11 (trước đợt B) thêm D-170, D-171 và D-172; M11-B thêm D-173 và D-174.**
> Mã tiếp theo còn trống là **D-175**.

| Mã | Quyết định | Lý do | Cần chủ dự án |
|---|---|---|:--:|
| **D-80** | `Select` **bọc một `<select>` native** thay vì listbox tự dựng | `09` §10 cấm "`<select>` native MỚI", nhưng `09` §11 đặt "form chạy được **không cần JS**" vào danh sách KHÔNG ĐƯỢC ĐỤNG (máy yếu, mạng phòng học kém). Listbox tự dựng cần JS mới gửi được giá trị ⇒ phá ràng buộc thứ hai. Cách đã chọn: hết thẻ trần rải rác (đúng tinh thần điều cấm), giữ chạy-không-JS, sẵn hỗ trợ bàn phím/trình đọc màn hình | ✅ **CÓ** |
| **D-81** | `SegmentedControl` dùng **radio native**, `Dropdown` dựng trên **`<details>`** | Cùng một lý do với D-76 và cùng một ràng buộc `09` §11. Riêng `Dropdown` còn có `05` §3.2 nói thẳng "giữ khả năng chạy không cần JS" vì menu đó chứa nút Đăng xuất | ❌ (áp lại D-76 đã duyệt) |
| **D-82** | `Dropdown` **không tự đặt `aria-expanded`**; mục menu **vẫn nhận `Tab`** | Lệch có chủ ý so với mẫu ARIA menu. HTML-AAM đã lấy trạng thái mở từ `details.open`; đặt thêm theo state React thì khi JS chưa tải thuộc tính kẹt ở `false` trong lúc menu đang mở. Roving tabindex cũng cần JS mới đặt được `tabindex` | ❌ |
| **D-83** | `run-e2e.mjs` **tự build** và **từ chối chạy** nếu Supabase không phải local hoặc cổng đã bị chiếm | Không phải lựa chọn thẩm mỹ mà là vá một lỗi đang chảy máu: E2E local đang chạy app trỏ vào dự án production (xem mục 0.8). Chi phí: mỗi lượt E2E lâu thêm ~20 giây vì build lại | ❌ (sửa lỗi) |
| **D-84** | `AcademicYearSwitcher` **hiện năm thật nhưng chưa cho đổi năm** | Nút cũ nói sai (chuỗi viết cứng) nên phải thay ngay; nhưng luồng xem dữ liệu năm cũ thuộc M02-F09 và chưa tồn tại, nên một bộ chọn năm sẽ dẫn tới trang không có. Chọn: sửa cái nói sai, giữ nguyên phạm vi. Component nhận sẵn danh sách năm + `href`, bật lên khi M02-F09 xong | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-85** | Đổi tên `.env.production.local` → **`.env.production.deploy`** | Next tự nạp `.env.production.local` **trước** `.env.local` ở `NODE_ENV=production`, nên chỉ cần file đó nằm trong thư mục gốc là mọi lượt `npm run build && npm run start` chạy tay ở máy lập trình đều nối thẳng vào **dự án thật**. Tên mới không nằm trong bốn tên Next nạp; `seed:prod` không cần đúng tên vì gọi qua `--env-file=`. Chi phí: sửa `package.json` + `docs/12` | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-86** | Đăng xuất chỉ đóng phiên **trên thiết bị đang dùng** (`signOut({ scope: "local" })`), không đóng mọi thiết bị | Câu hỏi NC-7 của `08_ACCEPTANCE_CRITERIA.md`. `global` nghe an toàn hơn cho máy phòng học, nhưng một Giáo lý viên bấm Đăng xuất ở máy phòng học sẽ bị văng luôn khỏi điện thoại riêng — người dùng ít kinh nghiệm sẽ hiểu là hệ thống lỗi. Chọn cách khớp với điều mọi ứng dụng khác đang làm | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-87** | Đã có phiên hợp lệ thì `/login` **chuyển thẳng vào `/dashboard`** | Câu hỏi NC-3. `manifest.start_url` là `/login`, nên bản cũ bắt người dùng nhìn màn hình đăng nhập mỗi lần mở app đã cài. Hiện lại biểu mẫu **không bảo vệ được gì**: phiên vẫn hiệu lực, ai cầm máy cũng chỉ cần gõ `/dashboard`. Hệ quả phải chấp nhận: đổi tài khoản nay là **Đăng xuất rồi đăng nhập**, dùng được vì A-01 vừa tạo ra nút đó. Tài khoản **bị khoá** cố ý không đi theo nhánh này — họ phải ở lại đọc lời giải thích | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-88** | **Menu phụ huynh có "Con của tôi"; thiếu nhi giữ "Điểm danh"** (NC-1) | `docs/06` §5 đòi "Con của tôi" từ đầu và nó chưa từng tồn tại — đó là gốc của route mồ côi A-07. Nhưng KHÔNG làm đúng y hệt đặc tả: "Xin nghỉ" giữ chỗ vì đó là việc phụ huynh làm thường xuyên nhất, và "Lịch học" của thiếu nhi chỉ là giáo án lớp trong khi "Điểm danh của em" là sổ của chính em. Đặc tả được cập nhật theo, có ghi lý do | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 (chọn từ bản vẽ 3 phương án) |
| **D-89** | **Giữ nút ba gạch, KHÔNG làm menu "Thêm"** (NC-2) | `docs/06` §5 nói "các module còn lại trong menu `Thêm`". Nút ba gạch đã được nâng thành hộp thoại đúng chuẩn ở mục 0.7 (bẫy focus, `Escape` đóng và trả focus, khoá cuộn nền, 14 test bảo vệ). Thêm menu "Thêm" ở ô thứ 5 là dựng lại cùng một thứ ở chỗ thứ hai và cho người dùng **hai cửa cho cùng một việc** | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-90** | **`/account` làm thật ở mức tối thiểu** (A-10) | Trang này là ô thứ 5 của **cả bảy** preset thanh dưới, tức mọi vai trò mọi thiết bị đều chạm vào, mà nội dung là một placeholder ghi "sẽ triển khai ở Phase 1" trong khi dự án đã ở Phase 7. Mức tối thiểu: danh tính · vai trò · năm học · đổi mật khẩu · đăng xuất — **không truy vấn mới** ngoài năm học. Phần sâu hơn thuộc M01 | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-91** | **`docs/06` §6 đã cũ: cập nhật, giữ đúng 1 mục nợ** (NC-6) | 10 địa chỉ trong đặc tả không tồn tại trong mã nguồn. Rà lại: 9/10 là **gộp trang có chủ đích** (`/equipment` → trong `/committees/[id]`; 4 trang `/admin/*` → một trang `/admin` + `/imports`; `/student/*` dùng chung `/results`, `/teaching-plan` vì RLS đã lọc và hai bản sao là hai chỗ để lệch nhau). Chỉ `/staff/[staffId]` là nợ thật ⇒ ghi vào **M04** | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-92** | **M09 chia BA đợt, và làm thêm hai To-Be ngoài danh sách của `06` §2** | `06` §2 chốt cho M09 bốn việc nghiệp vụ (F11 · D-76 · D-78 · bỏ auto-save chức vụ), nhưng `07` §5 ước lượng toàn bộ To-Be là **≈11,5 ngày** — gần gấp đôi một đợt của M14. Chủ dự án chốt làm thêm **TB-M09-04** (nhập thêm kho) và **TB-M09-06** (sửa Ban/thông báo/lịch họp). Lý do TB-M09-04 quan trọng: sau khi M09-A khoá `total_quantity` và M09-B cho phép "báo hỏng/mất" trừ kho, hệ thống sẽ **không còn đường hợp lệ nào để tăng tổng kho** — mua thêm loa cũng phải bịa một mã thiết bị mới | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-93** | **"Báo hỏng/mất" vẫn là quyền của MỌI thành viên Ban Kỹ thuật** | Trả lời câu hỏi mở số 5 của `06_DECISION_LOG.md` (gắn với D-76) và Q-M09-07. `04_TO_BE_FLOWS.md` khuyến nghị nâng lên Trưởng/Phó Ban vì thao tác này giảm tài sản vĩnh viễn; chủ dự án chọn **giữ nguyên** để người trực kho xử lý dứt điểm tại chỗ, không phải chờ ai. Hàng rào vì thế **dồn hết vào hộp xác nhận đỏ nêu rõ tổng kho sẽ giảm bao nhiêu** (AC-M09-26) — đợt M09-B bắt buộc phải có, không được bỏ | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-94** | **Danh sách "Người mượn" mở sang MỌI nhân sự xứ đoàn** | Q-M09-05 và AC-M09-30. DB đã cho phép (`borrower_staff_id` trỏ `staff_profiles` bất kỳ), chỉ UI tự thu hẹp về thành viên Ban Kỹ thuật. Thực tế người mượn loa thường là GLV một lớp ⇒ người trực kho phải chọn đại một thành viên Ban KT, và **sổ mượn ghi sai tên người đang giữ đồ** — đúng thứ mà cả cuốn sổ sinh ra để tránh | ✅ **CÓ** — chủ dự án duyệt 2026-07-23 |
| **D-95** | **D-78 tách làm hai đợt: ràng buộc DB ở M09-A, hộp thoại bàn giao ở M09-C** | D-78 kèm yêu cầu hỏi *"Kết thúc nhiệm kỳ của {tên} và bổ nhiệm {tên mới}?"* thay vì báo lỗi khô khan. Nhưng ô chọn chức vụ **sẽ bị dựng lại** ở TB-M09-05 (bỏ auto-save, thêm nút Lưu) — làm hộp thoại trên ô cũ là làm hai lần. Đợt A vì thế chỉ đóng lỗ dữ liệu và dịch lỗi thành **một câu nói rõ phải làm gì tiếp** ("Ban này đã có Trưởng ban. Hãy đổi chức vụ của Trưởng ban hiện tại trước…"), không phải "Dữ liệu này đã tồn tại." | ❌ (cài đặt) |
| **D-96** | **Guard của Server Action gọi NGOÀI `try`, và dùng `requireRouteAccess`** | Hai lỗi cùng một chỗ. (1) `redirect()` của Next báo hiệu bằng cách **ném lỗi**, nên guard nằm trong `try` là `catch` nuốt mất chuyển hướng — người hết phiên bấm mãi một nút không chạy thay vì được đưa về `/login`. (2) `requireAuthContext` chỉ hỏi "đã đăng nhập chưa": luật `ROUTE_RULES` khai `/committees` chỉ dành cho nhân sự **chưa từng được thi hành ở tầng action** (Q-M09-09 / BR-M09-62), đúng hình dạng lỗi A-03 của M14. Áp cho **9 action** của `committees` + `equipment` | ❌ (sửa lỗi) |
| **D-97** | **Danh sách "Người mượn" đi qua một CỬA SỔ HẸP CHỈ-TÊN, không nới quyền đọc hồ sơ nhân sự** | D-94 đòi ô "Người mượn" mở sang mọi nhân sự xứ đoàn, nhưng `app.can_access_staff` không có nhánh "cùng Ban" (**nợ #13**) nên đọc thẳng `staff_profiles` chỉ ra được người cùng lớp — D-94 **không thể cài** nếu không đụng phân quyền. Ba đường: (a) RPC riêng chỉ trả **họ tên + mã GLV** của nhân sự đang hoạt động, chỉ cho ai thao tác được kho của Ban đó; (b) nới hẳn `staff_profiles` cho mọi nhân sự đọc hồ sơ nhau — đạt D-94 **và** đóng nợ #13, nhưng mở điện thoại/ngày sinh/địa chỉ của mọi Giáo lý viên trên máy dùng chung; (c) hoãn D-94. Chủ dự án chọn **(a)**: `public.list_equipment_borrower_options`. Hệ quả phải ghi rõ — **nợ #13 VẪN MỞ**, trả ở M09-C/M04 | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-98** | **`adjust_equipment_stock` làm CẢ HAI CHIỀU; giao diện có nút "Giảm tồn kho"** | `04_TO_BE_FLOWS.md` đặt tên việc là "Nhập thêm", nhưng chính RPC nó mô tả đã nhận `delta < 0`. Sau M09-A (khoá `total_quantity`) và `write_off_equipment` (chỉ chạy trên phiếu mượn đang mở), thiết bị hỏng **khi đang nằm trong kho** không còn đường nào ghi giảm ⇒ sổ sách nói kho nhiều hơn thực tế và không ai sửa được. Hai chiều là **hai nút riêng** chứ không phải một ô số nhận dấu âm: gõ nhầm "-2" thành "2" là hai cái thiết bị bốc hơi khỏi sổ. Chiều giảm bắt buộc ghi chú + hộp xác nhận đỏ, và chỉ giảm tới mức `available` còn lại | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-99** | **`receive_equipment` nhận thêm `p_condition` so với chữ ký trong `04_TO_BE_FLOWS.md`** | Tài liệu ghi `receive_equipment(p_loan_id, p_quantity, p_note)`. Làm đúng y hệt là **lấy mất một khả năng đang có**: bản cũ cho người trả ghi luôn tình trạng thiết bị khi mang về, mà `condition` trong danh mục thì chỉ Trưởng/Phó Ban sửa được — thành viên thường nhận về một cái loa còn nguyên nhưng rè sẽ không có chỗ nào nói điều đó. Chữ ký mới là **tập cha** của chữ ký trong tài liệu, và xếp cùng thứ tự với `write_off_equipment`/`return_equipment` | ❌ (cài đặt) |
| **D-100** | **Thành viên cùng một Ban đang hoạt động đọc được ĐẦY ĐỦ hồ sơ nhau** (nợ #13) | Trước đây `app.can_access_staff` chỉ có ba nhánh (toàn cục · chính mình · cùng lớp), nên Trưởng ban mở Ban của mình chỉ thấy tên người tình cờ cùng lớp; người khác hiện `—`. Ba đường: (a) cửa sổ hẹp chỉ-tên như D-97 — đóng được danh sách nhưng thẻ "Trưởng ban" của TB-M09-06 vẫn trống với phần lớn người xem; (b) nới thẳng `can_access_staff` sang "cùng Ban" — đọc được **cả** số điện thoại/ngày sinh/địa chỉ; (c) hoãn sang M04. Chủ dự án chọn **(b)** với phạm vi **đầy đủ hồ sơ**: thành viên Ban cần liên lạc và phối hợp. RLS là row-level nên nới quyền đọc dòng là mở cả dòng — chấp nhận có chủ ý. Nhánh mới `app.shares_active_committee`; nhiệm kỳ đã kết thúc không tính; bắt buộc RLS negative + positive test bằng JWT thật (pgTAP `024`). Đóng nợ #13 | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-101** | **Xóa tài khoản GIỮ LẠI lịch sử vai trò** (M01, Q3) | Hiện `role_assignments.profile_id ... on delete cascade` xóa sạch lịch sử vai trò khi xóa tài khoản — chính bảng được đặt tên "role history" (M01-F08, C9=1). Chủ dự án chọn **giữ lại lịch sử**: xóa tài khoản chỉ gỡ khả năng đăng nhập, hồ sơ nghiệp vụ + lịch sử vai trò vẫn còn. Cần đổi FK (`set null` + cho `profile_id` nullable) ⇒ ảnh hưởng RLS `role_assignments_select_self_or_global` và dữ liệu hiện có ⇒ **rủi ro cao**, xếp vào **M01-C**, làm với pgTAP đầy đủ | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-102** | **Thêm "trần vai trò" khi cấp/đổi tài khoản** (M01, Q2) | `adminProvisionAccount` hiện tạo được Super Admin thứ hai và không giới hạn vai trò theo vai trò người thao tác (M01-F03). Chủ dự án chọn **thêm rào**: không cấp/nâng lên `super_admin` qua màn hình cấp tài khoản; không ai cấp vai trò cao hơn hoặc ngang mình. Áp ở **M01-B** (cùng lúc dời form cấp tài khoản sang `/staff/[id]` và làm `assignPrimaryRole`), kèm pgTAP/RLS negative cho từng vai trò bị từ chối | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-103** | **Bỏ trạng thái 'locked' khỏi giao diện** (M01, Q4) | Enum `account_status` có ba giá trị (`active`/`locked`/`disabled`) nhưng UI chỉ dùng hai, và 'locked' không có nghĩa khác 'disabled' cũng không có màn hình nào dùng. Chủ dự án chọn **bỏ 'locked' khỏi UI**: bộ đặt trạng thái (`accountStatusUpdateSchema`) chỉ nhận active/disabled; **giữ enum ở DB** để dữ liệu cũ không vỡ (bản ghi 'locked' vẫn hiện đúng tên). Làm ở **M01-A** | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-104** | **Trên `/staff/[id]`, chỉ vai trò quản trị/toàn xứ đoàn thấy trường nhạy cảm** (M01-B, AC-01.7) | AC-01.7 đòi ẩn ngày sinh/địa chỉ/email/trạng thái tài khoản khỏi người xem không phải quản trị. Nhưng **D-100** (24/07) vừa cho thành viên cùng Ban đọc đầy đủ hồ sơ nhau ở tầng DB — hai quyết định đã duyệt lệch nhau khi đặt lên trang chi tiết mới. Chủ dự án chọn **chỉ `can_global_read`** (Super Admin, Cha sở/phó, Xứ đoàn trưởng/Phó, Thư ký, Thủ quỹ) thấy trường nhạy cảm; đồng nghiệp cùng lớp / cùng Ban chỉ thấy tên + danh xưng + mã + lớp. Trang không trở thành mặt lộ mới trên máy dùng chung; thông tin liên lạc của bạn Ban vẫn xem ở trang Ban. Ẩn ở PAYLOAD (`getStaffDetail` không select), không chỉ ẩn nút | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-105** | **Đổi lớp cho GLV là MỘT thao tác**, và **Trưởng/Phó ngành dùng được trong ngành mình** | Chủ dự án hỏi thẳng: *"tôi nghĩ đơn giản chỉ là đổi GLV này sang lớp khác thôi mà sao lại rắc rối đến vậy"* — và đúng: audit chấm M04-F06 **24/75**. Gốc rễ là sự việc "anh A dạy lớp X" nằm ở **hai bảng không tự đồng bộ** (`class_staff_assignments` = sổ phân công; `role_assignments` = thẻ ra vào mà phần mềm thật sự đọc). Phase 1 khoá cả bảng thứ hai về Super Admin vì nó chứa lẫn dòng *"ai là Super Admin"*. **Cái khoá thô đó nay đã thừa:** D-102 (M01-B) đã lắp trần vai trò ngay trong DB. RPC `transfer_class_staff` vì thế chỉ sinh **vai trò lớp** suy từ `capacity` — không có tham số vai trò nào để truyền vào. Phạm vi = `app.can_manage_class` trên **cả hai** lớp, cùng khuôn đã dùng cho ghi danh/chuyển lớp thiếu nhi | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-106** | **Cho xóa hẳn hồ sơ nhân sự CHƯA TỪNG DÙNG** (M04-F07, Q5) | Tạo nhầm hai hồ sơ cho cùng một người thì hiện **không có cách nào dọn**: RLS không có policy DELETE và 8 bảng khác tham chiếu `on delete restrict`. Nguyên tắc "giữ lịch sử mục vụ" là đúng nhưng thiếu cặp bù trừ. Chủ dự án chọn xóa cứng **chỉ khi** hồ sơ chưa phân công, chưa có tài khoản, và không bản ghi nào tham chiếu — kèm hộp gõ-lại-tên + ghi nhật ký. Làm ở **M04-B** (cần migration policy DELETE + pgTAP canh không xóa nhầm hồ sơ đã dùng) | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-107** | **Bỏ mô tả feature flag `sector_leader_can_manage_class_staff` khỏi `docs/05`** (Q7) | `docs/05` §7 khai một công tắc mặc định `false` cho phép Trưởng ngành phân công GLV. Công tắc đó **chưa từng tồn tại** trong mã nguồn lẫn DB; hành vi thật bằng đúng trạng thái tắt nên **không phải lỗ hổng**, nhưng để lại là hứa một tính năng không có. Nhu cầu đứng sau nó được D-105 giải theo cách **hẹp hơn**: chỉ *chuyển* người **đã ở trong ngành**, không *kéo* người ngoài ngành vào và không phân công người chưa có lớp — đúng phạm vi chủ dự án nêu. `docs/05` §4.6 ghi phạm vi mới; §7 gỡ dòng công tắc | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-108** | **Danh sách `/staff` mặc định ẩn người "Đã nghỉ"** | Ba trạng thái phục vụ (`active`/`paused`/`inactive`) sắp sống lại ở M04-B (hiện `service_status` bị hardcode `'active'` — 5W-07). Hiện tất cả thì sau vài năm người đang phục vụ lẫn giữa người đã nghỉ; ẩn cả "Tạm nghỉ" thì người nghỉ sinh con/đi học xa biến mất khỏi kế hoạch năm học. Chọn: mặc định hiện **Đang phục vụ + Tạm nghỉ**, có bộ lọc bật lại, và **ghi rõ số người đang bị ẩn** để không ai tưởng hồ sơ biến mất. Làm ở **M04-B** | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-109** | **Ai được XÓA HẲN hồ sơ nhân sự chưa từng dùng** (D-106) | D-106 chốt *có cho xóa* nhưng để ngỏ *ai xóa*. Hai đường: (a) **bốn vai trò ghi toàn xứ đoàn** (Super Admin · Xứ đoàn trưởng/Phó · Thư ký) — trùng đúng nhóm đang TẠO được hồ sơ, nên ai tạo nhầm thì dọn được ngay; (b) chỉ Super Admin. Chủ dự án chọn **(a)**: rủi ro thấp vì hồ sơ xóa được là hồ sơ chưa gắn với dữ liệu nào — lỡ xóa nhầm chỉ mất công nhập lại 7 ô, không mất lịch sử của ai; còn (b) thì hồ sơ rác nằm lại vì người hay tạo nhầm (Thư ký) ngại đi nhờ. Cài bằng `app.can_global_write()`; pgTAP `031` canh Trưởng ngành/Thủ quỹ/GLV lớp bị chặn bằng JWT thật | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |
| **D-111** | **`/admin` chỉ còn cấp tài khoản cho người KHÔNG có hồ sơ Giáo lý viên** (M04-C) | M01-B đã đưa việc cấp tài khoản GLV về `/staff/[staffId]`, nơi trang biết sẵn mã GLV, lớp và phân công. Để `/admin` giữ luôn đường cũ là **hai cửa cho cùng một việc** — và cửa cũ còn liệt kê đủ 14 vai trò kể cả `super_admin` mà máy chủ luôn từ chối. Ba đường: (a) **mỗi việc một nơi** — `/admin` chỉ còn Cha sở · Cha phó · Phụ huynh · Thiếu nhi; (b) giữ nhánh GLV nhưng gập vào mục "ngoại lệ"; (c) bỏ hẳn biểu mẫu — **không được**, vì phụ huynh/thiếu nhi chưa có màn hình nào khác cấp tài khoản (M03/M13 chưa làm). Chủ dự án chọn **(a)**, kèm nghĩa vụ đã nêu rõ khi hỏi: phải **mở rộng trang hồ sơ** để người vừa đứng lớp vừa giữ vai trò ngành/toàn xứ đoàn vẫn cấp được tài khoản — nếu không, phương án (a) tự tay xoá mất một trường hợp có thật. Siết ở **schema**, không chỉ ẩn ô chọn | ✅ **CÓ** — chủ dự án duyệt 2026-07-25 |
| **D-112** | **Vòng đời NĂM HỌC chỉ còn Super Admin** (M02-A, Q-M02-01) | Ba tầng đang nói ba kiểu về cùng một việc (BR-M02-15/16): `docs/05` §3 ghi ✅ cho Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký; nhưng `/admin` — nơi **duy nhất** có biểu mẫu năm học — chỉ mở cho Super Admin, nên ba vai trò kia **chưa bao giờ dùng được trên thực tế**; còn RLS thì lại chặn Thư ký/Phó sửa năm đang chạy. Ba đường: (a) **thu về Super Admin** cho khớp thực tế đang chạy, sửa `docs/05`; (b) mở cho 4 vai trò, **tách trang riêng** để không vô tình trao luôn quyền cấp tài khoản (trái D-62) — đúng bảng phân quyền nhưng tốn thêm ~nửa buổi; (c) mở 4 vai trò nhưng giữ chung `/admin` — **không được**, vì đó chính là trao thêm quyền cấp tài khoản. Chủ dự án chọn **(a)**. Đổi lại: mỗi đầu năm học, việc tạo năm và sinh lớp phải nhờ đúng một người. **Đọc năm học không đổi**; bảng `classes` **không** bị siết | ✅ **CÓ** — chủ dự án duyệt 2026-07-25 |
| **D-113** | **Đặt năm hiện hành khi chưa đủ lớp: CẢNH BÁO bằng con số thật rồi vẫn cho làm** | Nửa sau của sự cố production: năm học được đặt hiện hành trong khi chưa có lớp nào ⇒ không ghi danh, không điểm danh, nhập Excel hỏng hàng loạt vì không ánh xạ được tên lớp — và **không màn hình nào nói ra điều đó** (WF-01 bước 8 đòi tiền kiểm nhưng chưa cài). Ba đường: (a) hộp xác nhận nêu *"Năm học 2027-2028 mới có 0/19 lớp…"* rồi vẫn cho đặt; (b) **chặn cứng** khi chưa đủ 19 lớp — an toàn nhất nhưng là một luật cứng: sau này xứ đoàn cố ý gộp bớt lớp (D-72 nói 19 là **mặc định**, không phải tối đa) thì không đặt được năm hiện hành nữa; (c) không kiểm gì. Chủ dự án chọn **(a)** — quyền quyết định mục vụ ở người phụ trách (`docs/03` §1) | ✅ **CÓ** — chủ dự án duyệt 2026-07-25 |
| **D-114** | **Bốn biểu mẫu của `/admin` dùng `useActionState`, KHÔNG dùng `redirect()`** | D-61 chỉ định "chuyển hướng kèm mã kết quả, hiện thông báo ở đầu trang" cho biểu mẫu ngắn. Cách đó **không chạy được ở đây** và đây là lỗi đo được chứ không phải sở thích: cả bốn biểu mẫu đều nằm trên `/admin` và phải chuyển hướng về **chính route đang đứng**, mà Next 15.5 khi gặp `redirect()` về đúng route hiện tại thì đổi thanh địa chỉ rồi **bỏ luôn lượt dựng lại trang** — `<main>` trắng vĩnh viễn, log máy chủ sạch, không lỗi trình duyệt. Đo trên cùng bản build: sang route khác **749 ms**; về chính nó **treo quá 120 giây**; `RedirectType.push` chạy được một lượt rồi lại treo. `useActionState` giữ đúng điều D-61 thật sự đòi (*mọi thao tác ghi phải nói ra kết quả*) **và** giữ ràng buộc 09 §11 (biểu mẫu chạy khi chưa có JS); khác biệt duy nhất là dòng thông báo hiện **ngay tại chỗ vừa thao tác** thay vì ở đầu trang | ❌ (cài đặt — lệch **cách làm** của D-61, không lệch **mục tiêu**) |
| **D-110** | **Ba mức hiển thị tình trạng tài khoản trên `/staff`** | Danh sách cần cho biết một tài khoản đã có chưa và đã gán vai trò chưa (cảnh báo "zombie" của 5W-06), nhưng **tên đăng nhập** là nửa bộ thông tin để thử mật khẩu, và D-104 vừa chốt trường nhạy cảm chỉ cho vai trò quản trị. Chủ dự án chốt **ba mức**: **Super Admin** thấy tên đăng nhập + cảnh báo chưa gán vai trò · **các vai trò đọc-toàn-cục khác** chỉ thấy cảnh báo, KHÔNG thấy tên đăng nhập của người khác · **còn lại** chỉ "Đã có / Chưa có". Mức thấp nhất **không chạy truy vấn** `role_assignments`/`profiles` nào ⇒ ẩn ở tầng dữ liệu, không phải giấu nút | ✅ **CÓ** — chủ dự án duyệt 2026-07-24 |

| **D-115** | **Qua mốc kết thúc học kỳ 1, lớp Dự trưởng CHỈ hiện cảnh báo — hệ thống KHÔNG tự đóng lớp** | Trả lời câu hỏi mở số 4 của `06_DECISION_LOG.md` (gắn với D-71). Hai đường: (a) tự động chuyển lớp Dự trưởng sang `closed` khi qua mốc; (b) chỉ cảnh báo, để người phụ trách tự quyết. Chọn **(b)** — đúng đề xuất sẵn có trong chính D-71 và đúng nguyên tắc *"không tự động quyết định mục vụ thay người phụ trách"* (`docs/03` §1). Đường (a) đóng lớp **sau lưng** người dùng: mọi ghi danh mới bị chặn kể cả khi sinh hoạt còn kéo dài thêm vài buổi, muốn mở lại phải sửa tay, và cần thêm một cơ chế chạy nền mà hệ thống hiện không có. Hệ quả cài đặt: cột `semester_1_end_date` **không có trigger, không có tác vụ nền, không policy nào đọc** — nó thuần là một mốc dữ liệu để giao diện so ngày | ✅ **CÓ** — chủ dự án duyệt 2026-07-25 |
| **D-117** | **Sau khi đóng năm học, Super Admin còn ghi được TẤT CẢ trong năm đó** (M02-C, Q-M02-04) | Q-M02-04 để ngỏ *phạm vi ngoại lệ* của hàng rào ghi. Ba đường: (a) **Super Admin là ngoại lệ duy nhất và ghi được tất cả** — đúng điều `docs/03` WF-16 bước 5 và tiêu chí **AC-M02-07** đã viết sẵn (*"khi `super_admin` thực hiện cùng thao tác ⇒ thành công"*); (b) **không ai ghi, kể cả Super Admin** — muốn sửa phải MỞ LẠI năm học, mà hệ thống chưa có luồng đó nên phải xây thêm, và nó trái ngược với AC-M02-07 đang viết; (c) Super Admin chỉ sửa hồ sơ/ghi danh, **không** sửa điểm và điểm danh — kết quả học tập bất khả xâm phạm sau khi chốt, nhưng mỗi bảng một luật riêng nên rất khó giải thích cho người bị từ chối. Chủ dự án chọn **(a)**. Hệ quả phải chấp nhận: năm đã đóng **không** phải "đóng băng thật" — vẫn còn đúng một người sửa được | ✅ **CÓ** — chủ dự án duyệt 2026-07-26 |
| **D-118** | **Hàng rào ghi theo trạng thái năm học chỉ áp cho GHI DANH và LỚP ở đợt này** | I8 xếp **rủi ro cao** vì đánh dấu sai một năm là dừng khả năng ghi của cả phần đó. Hai đường: (a) **ghi danh + lớp trước**, còn điểm danh · bảng điểm · Top 5 · chuyển lớp · báo cáo siết sau khi tới lượt module đó (M05/M07/M08/M11) — đúng khuyến nghị nằm sẵn trong `04_TO_BE_FLOWS.md` TB-F09 (*"A cho enrollments + classes trước"*); (b) khoá cả 15+ bảng có gắn năm học ngay bây giờ — bịt kín lỗ hổng trong một đợt nhưng đụng **5 module chưa được thiết kế lại và chưa audit chéo**, phải chạy lại toàn bộ pgTAP, và một chỗ sai là người dùng mất khả năng ghi ở đúng năm đang chạy. Chủ dự án chọn **(a)**. Hệ quả phải ghi rõ và **đã ghi thành nợ #18**: trong thời gian chờ, năm đã đóng **vẫn ghi được** điểm danh/điểm số nếu gọi thẳng Data API | ✅ **CÓ** — chủ dự án duyệt 2026-07-26 |
| **D-119** | **Đóng năm học KHÔNG tự chuyển lớp của năm đó sang `closed`** (M02-C, Q-M02-08) | Q-M02-08 hỏi thẳng: đóng năm thì 19 lớp có tự đóng theo không. Hai đường: (a) **không** — trạng thái NĂM HỌC là chốt chặn duy nhất, trạng thái từng lớp giữ nguyên như lúc đang chạy; (b) có — cập nhật cả 19 dòng `classes`. Chủ dự án chọn **(a)**, cùng nguyên tắc đã chốt ở D-115 (*"không tự động quyết định mục vụ thay người phụ trách"*, `docs/03` §1). Ba lý do cụ thể: một cú bấm sửa 19 dòng dữ liệu quá khứ; danh sách lớp của **mọi** năm cũ đều đầy huy hiệu "Đã đóng" nên huy hiệu mất giá trị báo hiệu; và không có đường quay lại — muốn sửa phải đổi tay từng lớp. Hệ quả phải chấp nhận: mở một lớp của năm 2020 vẫn thấy huy hiệu "Đang hoạt động", người dùng phải đọc **dòng trạng thái năm học ngay bên trên** (đã có từ M02-B) mới hiểu | ✅ **CÓ** — chủ dự án duyệt 2026-07-26 |
| **D-120** | **`retention_until` CHẶN lưu trữ trước hạn** (M02-C, Q-M02-09) | Q-M02-09 để ngỏ cột `retention_until` (ngày kết thúc năm + 5 năm) dùng để làm gì ở v1 — `docs/03` §340 chỉ nói "không tự động xóa ở v1". Ba đường: (a) **chặn lưu trữ trước hạn**, đúng luật BR-M02-N07 và bước 7 của TB-F09; (b) chỉ để ghi nhận, lưu trữ được ngay sau khi đóng; (c) chặn mặc định nhưng cho Super Admin ghi đè. Chủ dự án chọn **(a)**, và hệ quả đã được nêu rõ khi hỏi: năm `2026-2027` kết thúc giữa 2027 nên **chỉ lưu trữ được từ khoảng 2032** — trên dữ liệu thật nút này gần như không xuất hiện trong 5 năm tới. Đó là hàng rào cố ý: lưu trữ là thao tác **một chiều** và hệ thống **chưa có luồng bỏ lưu trữ**. Nghiệm thu vì thế cần **một năm học cũ dựng riêng**: `seed:dev` nay tạo hai năm đã đóng khác nhau đúng một điểm — hạn giữ dữ liệu | ✅ **CÓ** — chủ dự án duyệt 2026-07-26 |
| **D-116** | **Mốc kết thúc học kỳ 1 KHÔNG bắt buộc, và sửa được sau** | D-71 chốt *thêm trường ngày* nhưng để ngỏ *bắt buộc hay không* và *nhập ở đâu*. Chọn **không bắt buộc + sửa được sau**, vì năm học `2026-2027` **đang chạy** được tạo ra trước khi có trường này: bắt buộc thì nó không có cách nào hợp lệ hoá được, và mọi bản ghi cũ hoá thành dữ liệu sai. Cột `nullable`, `null` nghĩa là *"chưa khai báo"* ⇒ **không cảnh báo gì** (cảnh báo bịa còn tệ hơn không cảnh báo). Ô nhập có mặt ở **cả hai chỗ**: biểu mẫu tạo năm học, và một biểu mẫu sửa/xoá riêng trong thẻ của từng năm nháp/hiện hành ở `/admin` — chỉ cho nhập lúc tạo là để năm đang chạy vĩnh viễn không có mốc | ✅ **CÓ** — chủ dự án duyệt 2026-07-25 |
| **D-121** | **Sĩ số của lớp TÁCH HAI SỐ khi có em tạm nghỉ** (M03-A) | Trước đợt này trang lớp in *"Sĩ số đang sinh hoạt: N"* mà N đếm **cả** em `paused` — câu đó nói sai, vì em tạm nghỉ thì không sinh hoạt. Ba đường đặt lên bàn: (a) giữ nguyên, chỉ thêm một nhãn trên từng dòng — rẻ nhất nhưng con số vẫn nói sai; (b) **tách hai số** (*"Sĩ số 28 · trong đó 2 tạm nghỉ"*), em vẫn nằm trong danh sách điểm danh; (c) loại hẳn em tạm nghỉ khỏi **cả** sĩ số **và** danh sách điểm danh — đúng nghĩa "tạm nghỉ" nhất nhưng đụng **M05 Điểm danh** và **M07 Bảng điểm**, hai module CHƯA tới lượt thiết kế lại, phải chạy lại toàn bộ kiểm thử của chúng và làm lệch số liệu báo cáo cũ. Chủ dự án chọn **(b)**. Hệ quả phải ghi rõ và **đã ghi thành nợ #19**: em tạm nghỉ **vẫn còn tên trong danh sách điểm danh**, và với luật "mặc định có mặt" (`AGENTS` §8) thì em nghỉ dài ngày sẽ được đánh dấu có mặt nếu người điểm danh không để ý | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-122** | **Giữ lý do "Chuyển lớp" khi kết thúc ghi danh, nhưng NÓI THẲNG nó không chuyển em đi đâu cả** (M03-A) | Chọn "Chuyển" chỉ **đóng** ghi danh ở lớp cũ: không tạo ghi danh ở lớp mới, và không ghi `previous_enrollment_id` (cột có từ `20260716000500:13`, **chưa bao giờ mang giá trị** — BR-M03-22). Người dùng dễ tưởng em đã sang lớp mới. Ba đường: (a) **giữ và nói rõ hậu quả trong hộp xác nhận**; (b) tạm ẩn lựa chọn cho tới khi **M08 Chuyển lớp** làm luồng thật (WF-11: đóng cũ + mở mới trong một RPC nguyên tử); (c) làm luôn luồng đầy đủ ngay ở đợt này — lấn phạm vi đã chốt của M08, trái `AGENTS` §4. Chủ dự án chọn **(a)**: ẩn đi thì người đang **thật sự** chuyển em sang lớp khác buộc phải chọn "Rút", tức **ghi sai lý do vào hồ sơ** — sai dữ liệu tệ hơn thiếu tiện lợi. Câu nhắc xuất hiện **hai lần**: trong hộp xác nhận và trong câu thành công, vì người dùng bấm xong là rời trang | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-123** | **Trưởng/Phó ngành tạo hồ sơ thiếu nhi thì BẮT BUỘC chọn lớp trong ngành mình** (M03-B) | D-63 nói họ tạo được hồ sơ "chỉ trong ngành mình", nhưng **ngành của một em suy ra từ LỚP em học** — hồ sơ vừa tạo thì chưa có lớp nào, nên lúc bấm nút hệ thống chưa biết em thuộc ngành nào để mà kiểm. Ba đường: (a) **tạo hồ sơ kèm chọn lớp, hai việc trong một giao dịch**; (b) cho tạo hồ sơ "chưa xếp lớp" — nhưng khi ấy phải cho **mọi** Trưởng ngành đọc và sửa **mọi** hồ sơ chưa xếp lớp của cả xứ đoàn, tức nới quyền đọc rộng hơn D-63; (c) chỉ cho **sửa**, không cho tạo — mới làm một nửa D-63 và để nguyên mâu thuẫn cũ. Chủ dự án chọn **(a)**. Hệ quả tốt kèm theo: không có đường nào sinh ra "hồ sơ lơ lửng" mà **chính người tạo cũng không đọc lại được** (`app.can_access_student` chỉ thấy em qua ghi danh) | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-124** | **Trưởng/Phó ngành đọc được người giám hộ của em trong ngành mình, và tra được tên + số điện thoại để CHỌN người đã có** (M03-B) | Trước đợt này chỉ 6 vai trò cấp xứ đoàn đọc được bảng `guardians`, nên Trưởng ngành mở `/students` thấy chỗ phụ huynh là dấu **"—"** (cùng họ với nợ #13 của M09). Nếu D-63 mở quyền tạo hồ sơ mà không mở đường chọn, họ sẽ tạo phụ huynh **mới** cho một gia đình đã có ⇒ nhân bản đúng lỗi F01, mà hệ thống **không có chức năng gộp**. Nới hẹp bằng hai thứ: nhánh RLS "người giám hộ của em trong ngành mình", và cửa sổ **chỉ-tên** `list_guardian_options` (cùng khuôn D-97 của M09-B) — hồ sơ giám hộ có địa chỉ nhà và liên kết tài khoản, việc cần làm chỉ là "đừng tạo trùng" | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-125** | **KHÔNG lưu vết việc người dùng bỏ qua cảnh báo trùng** (Q-M03-06 = không, M03-B) | Hệ thống hiện chỉ có một bảng nhật ký và nó dành riêng cho thao tác **tài khoản** (D-65). Dựng thêm một bảng chỉ để ghi một loại sự kiện, rồi lại phải dựng thêm một màn hình để xem nó — nếu không thì lưu xong không ai đọc — là quá tay ở đợt này. Bản thân hai hồ sơ trùng vẫn nhìn thấy được trên màn hình. Thêm sau nếu thực tế cần | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-126** | **Ô tìm kiếm trên trang Thiếu nhi tìm được khi gõ KHÔNG DẤU** (M03-B) | Màn hình Nhân sự của M04 đã tìm không dấu; để hai trang hành xử khác nhau là bắt người dùng nhớ trang nào gõ kiểu nào. Quan trọng hơn: người nhập liệu quen bỏ dấu sẽ **không tìm thấy em đã có** rồi tạo hồ sơ trùng — đúng thứ TB-F13 của cùng đợt này đang đi diệt. Chi phí: một hàm `app.fold_vietnamese()` bất biến + một cột sinh sẵn `students.search_name`. Khác M04 ở chỗ lọc chạy **trong SQL** chứ không trong bộ nhớ Node, vì ~900 dòng chứ không phải vài chục | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-127** | **Trưởng/Phó ngành và Giáo lý viên GHI được hồ sơ sức khoẻ và bí tích, trong phạm vi mình** (M03-C, **Q-M03-02 chốt**) | Câu hỏi này để ngỏ từ đầu Giai đoạn 2B: `docs/05` §3 cho bốn vai trò ấy quyền ✅📍 trên cả hai dòng "Sức khỏe" và "Bí tích", còn mã nguồn từ Phase 2 chỉ cho **đọc** — hướng an toàn hơn matrix, nên biên bản audit không hạ điểm C8 mà ghi lại thành câu hỏi. Chủ dự án chốt **theo matrix**, với hai lý lẽ: (1) người biết "em này dị ứng đậu phộng" là Giáo lý viên đứng lớp hằng tuần, không phải Thư ký ngồi bàn giấy — bắt họ nhắn tin cho Thư ký để ghi một dòng dị ứng là cách chắc chắn nhất để dòng đó **không bao giờ được ghi**; (2) bốn vai trò này **đã đọc được** hai mục ấy từ trước, nên đây là mở quyền GHI chứ không mở thêm dữ liệu ra cho ai. 🔴 **Dự trưởng phụ tá KHÔNG được nới** — `docs/05` §3 cho họ 👁📍 ở đúng hai dòng này, và họ là vai trò duy nhất của nhóm lớp bị giữ lại. Đây là **thay đổi phân quyền thứ 7**, ngoài sáu thay đổi đã duyệt ở `11` §6 | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-128** | **Bản ghi bí tích SỬA được cho mọi người ghi được, nhưng XOÁ chỉ cho bốn vai trò xứ đoàn** (M03-C, **Q-M03-05 chốt**) | `04_TO_BE_FLOWS` khuyến nghị *không cho xoá* ("dữ liệu bí tích là hồ sơ"). Nhưng có một ca không sửa nổi: một bí tích lỡ thêm vào hồ sơ **NHẦM EM** thì không có đường nào chuyển nó sang em đúng — nó nằm trên hồ sơ em vô can vĩnh viễn, và người dùng sẽ đổi nó thành một loại bí tích khác để "dọn", tức làm hỏng dữ liệu theo kiểu khó phát hiện hơn. Chủ dự án chọn **có nút xoá nhưng hẹp hơn quyền ghi một bậc**, kèm `ConfirmDialog` nêu tên em và loại bí tích. Không phá luật "không hard delete" của `AGENTS` §6: danh sách cấm ở đó là ghi danh · điểm danh · điểm số · báo cáo đã chốt — những thứ được tham chiếu từ nơi khác; `student_sacraments` không có bảng nào trỏ tới | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-129** | **Thủ quỹ ĐƯỢC xem dấu "hoàn cảnh khó khăn"** (M03-C, lưu ý mở của **D-67**) | D-67 xếp ô này vào nhóm "không cho xem" vì là thông tin riêng tư của gia đình, nhưng ghi kèm một lưu ý: *"nếu nghiệp vụ thu phí thực sự cần, báo lại để mở riêng ô này"*. Chủ dự án xác nhận việc xét miễn/giảm phí ở xứ đoàn **do Thủ quỹ làm**. Bắt họ hỏi người khác mỗi lần là đẩy họ đi lập một danh sách riêng ngoài hệ thống — chỗ đó không có RLS nào cả. Phạm vi mở đúng **một ô** (`hardship_flag`, một dấu Có/Không), không mở phần mô tả hoàn cảnh nào | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |
| **D-131** | **Huỷ một lần nhập chưa ghi là ĐÁNH DẤU, không xoá** (M12-A) | Nút cũ *"Xoá lần nhập này"* làm hai việc sai cùng lúc: không hỏi lại, và **xoá được cả lần nhập đã ghi dữ liệu** — cuốn theo `import_rows`, nơi duy nhất lưu mối nối *"dòng số 5 tạo ra hồ sơ CQ0123"* mà `docs/09` §7 đòi giữ. Chặn lần nhập đã ghi là điều bắt buộc; câu để ngỏ là **lần nhập chưa ghi thì sao**. Hai đường: (a) đánh dấu `cancelled`, **giữ nguyên hàng** trong danh sách — còn tra được ai từng tải file gì lên, đúng BR-M12-35; (b) xoá hẳn nhưng có hộp xác nhận — danh sách gọn hơn, đổi lại không còn dấu vết nào về những file đã tải lên rồi bỏ. Chủ dự án chọn **(a)**. Hệ quả phải chấp nhận: danh sách dài dần theo thời gian ⇒ bộ lọc và phân trang là việc của **M12-B** | ✅ **CÓ** — chủ dự án duyệt 2026-07-29 |
| **D-132** | **"Xoá dữ liệu thô" mở cho CẢ BỐN vai trò nhập được, không chỉ Super Admin** (M12-A) | `raw_json` là bản chép nguyên văn các ô Excel — họ tên, ngày sinh, địa chỉ, số điện thoại, ghi chú sức khoẻ của trẻ (SEC-15). `docs/09` §6 nói nên dọn sau thời hạn ngắn, nhưng hệ thống **không có cơ chế chạy nền** (cùng ràng buộc đã ghi ở D-115) nên chỉ còn đường bấm tay. `04_TO_BE_FLOWS` gợi ý *"cân nhắc chỉ `super_admin`"*. Ba đường: (a) **cả bốn vai trò nhập được** — họ vốn đã ĐỌC được dữ liệu ấy nên cho xoá **không mở thêm gì cho ai**, và người lỡ tải nhầm dọn được ngay (cùng lý lẽ D-109); (b) chỉ Super Admin — nghe chặt hơn nhưng thực tế thành không ai dùng, vì Thư ký là người tải file nhiều nhất lại phải đi nhờ; (c) chưa làm. Chủ dự án chọn **(a)**. Mapping `created_student_id`/`created_guardian_id` **luôn** được giữ, và có `raw_purged_at/by` ghi vết | ✅ **CÓ** — chủ dự án duyệt 2026-07-29 |
| **D-133** | **Dòng trùng CHẮC CHẮN phải được xác nhận từng dòng mới ghi được; dòng chỉ NGHI thì không cản** (M12-A) | Trước đợt này mọi dòng mặc định `create`, kể cả dòng trùng cả **tên + ngày sinh + SĐT phụ huynh** ⇒ một cú bấm sinh hồ sơ trùng, mà hệ thống **không có chức năng gộp**. Đổi mặc định sang "Ghép" là điều hiển nhiên; câu để ngỏ là **cản tới mức nào**. Ba đường: (a) chỉ mức `high` phải bấm xác nhận, mức `medium` mặc định Ghép nhưng không cản — đúng BR-M12-31/32 và AC-18/19 đã viết; (b) cả hai mức đều phải xác nhận — an toàn nhất nhưng nhập lại một sổ lớp cũ 30 em là 30 lần bấm; (c) không cản, chỉ đổi mặc định — nhanh nhất, nhưng máy so khớp sai thì em **mới** không có hồ sơ còn em **cũ** bị ghi danh nhầm lớp, sai hoàn toàn im lặng. Chủ dự án chọn **(a)**. Kèm một mở rộng hẹp có lý do đo được: dòng nào mặc định là Ghép mà **hồ sơ đối chiếu không còn sinh hoạt** cũng phải xác nhận, vì trigger `enrollments_need_active_student` của M03-C chắc chắn từ chối nó | ✅ **CÓ** — chủ dự án duyệt 2026-07-29 |
| **D-140** | **Em đang "Tạm nghỉ" RA KHỎI danh sách điểm danh** (M05-A — trả **nợ #19**) | Từ M03-A trạng thái này mới thật sự dùng được, và M03-C thêm cửa vào thứ hai (**D-130**) nên số em sẽ tăng. Ghép với luật *"điểm danh mặc định có mặt"* (D-31, nằm trong danh sách **KHÔNG ĐƯỢC ĐỔI** của `06_UI_UX_RECOMMENDATIONS` §10), một em nghỉ dài ngày **được ghi có mặt** nếu người điểm danh không để ý — chuyên cần của lớp đẹp hơn sự thật, và điểm chuyên cần của M07 sinh ra từ đúng con số sai đó. Ba đường đưa lên bàn: (a) **loại khỏi danh sách**, trang buổi nói ra số em bị loại; (b) giữ tên nhưng mặc định **"Vắng có phép"** kèm nhãn "Tạm nghỉ" — lịch sử liền mạch, đổi lại mỗi buổi cộng thêm một lượt vắng cho lớp và bộ cảnh báo *"vắng 3 Chúa nhật liên tiếp"* sẽ kêu cho **chính những em xứ đoàn ĐÃ BIẾT là đang nghỉ**, tức cảnh báo thừa làm người ta quen bỏ qua cảnh báo thật; (c) giữ nguyên, chỉ thêm nhãn — rẻ nhất nhưng rủi ro không đổi. Chủ dự án chọn **(a)**. Hệ quả phải chấp nhận: lịch sử điểm danh của em có **khoảng trống** đúng thời gian tạm nghỉ — đúng sự thật, nhưng khác với hôm nay. 🔴 Điều bắt buộc đi kèm: `roster_size` khi chốt phải đếm bằng **cùng một hàm** với lúc nạp danh sách, nếu không lớp có em tạm nghỉ **không chốt được buổi nào nữa** | ✅ **CÓ** — chủ dự án duyệt 2026-08-03 |
| **D-139** | **Cha sở và Cha phó XEM được điểm danh; Thủ quỹ thì không** (M05-A — trả lời **TB-10/NAV-I1/U-04**) | Một route đang phục vụ **hai quyền khác nhau**: `/attendance` vừa là màn hình ghi vừa là màn hình xem. M14 A-11 đóng một lỗi thật (ba vai trò thấy mục điều hướng rồi bấm vào bị chặn) bằng cách khoá cả ba — nhưng như thế mã nguồn nói **ngược lại** `docs/05-permission-matrix.md:54`, nơi ghi Cha sở 👁 và Cha phó 👁 từ đầu. Ba đường: (a) mở chế độ **chỉ đọc** cho hai Cha, giữ chặn Thủ quỹ; (b) giữ nguyên chặn cả ba và **sửa `docs/05`** cho khớp — hai vị muốn biết lớp nào đã điểm danh xong phải chờ trang Báo cáo (M11, chưa tới lượt); (c) mở cho cả ba. Chủ dự án chọn **(a)**. Vì sao **không** (c): `app.can_global_read()` **không có** Thủ quỹ, nên mở route cho họ chỉ dẫn tới **một trang trắng**; muốn họ thấy thật thì phải **nới quyền đọc ở cơ sở dữ liệu** — thêm migration, thêm bộ kiểm phân quyền, và mở dữ liệu chuyên cần của từng em cho một vai trò lo về tiền. Ô của họ trong bảng ghi *"👁 báo cáo"*, tức xem qua báo cáo tổng hợp. **Không migration** cho (a): quyền đọc của hai Cha đã có từ Phase 3, đợt này chỉ mở cửa route — và pgTAP `041` chứng minh quyền **ghi** không nhúc nhích | ✅ **CÓ** — chủ dự án duyệt 2026-08-03 |
| **D-138** | **Một file nhập tối đa 1.000 dòng** (M12-C — trả lời **NC-02**, đóng **SEC-12**) | Trước đợt này **không có giới hạn số dòng nào**, và `08_ACCEPTANCE_CRITERIA` §C xếp SEC-12 (*"upload file có 100.000 dòng"*) vào nhóm **phải xanh** kèm ghi chú *"hiện chưa có giới hạn số dòng"*. Giới hạn dung lượng **không thay được** nó: một sheet toàn chữ nén rất tốt nên 4 MB `.xlsx` vẫn chứa được hàng trăm nghìn dòng, mà mỗi dòng kéo theo một lượt `buildRow` cộng một lượt dò trùng trên **toàn bộ** hồ sơ đã có. Bốn đường đưa lên bàn kèm số đo thật: (a) 1.000 — đủ cho một file gộp cả xứ đoàn (~900 em); (b) 500 — bảo đảm lượt ghi không chạm trần 60 giây nhưng chặn file gộp; (c) 2.000 — rộng rãi nhưng một file sát trần gần như chắc chắn phải bấm "Ghi" vài lượt; (d) không giới hạn, tức để SEC-12 đỏ. Chủ dự án chọn **(a)**. Căn cứ đo được: sổ lớp **đông nhất của giáo xứ là 75 dòng**, tức trần này rộng gấp hơn 13 lần. Phép kiểm đặt **ngay sau `parseWorkbook`**, trước mọi truy vấn cơ sở dữ liệu | ✅ **CÓ** — chủ dự án duyệt 2026-08-03 |
| **D-137** | **Trần dung lượng file hạ từ 5 MB xuống 4 MB** (M12-C — trả lời **NC-01**, đóng **SEC-10**) | 🔴 Đây là một **con số sai**, không phải một hành vi sai — nên không bài test hành vi nào bắt được nó. Vercel (`docs/12` §1) chặn thân request nặng hơn ~4,5 MB **ở tầng hạ tầng**, tức **trước khi** mã ứng dụng chạy một dòng nào. Trần cũ 5 MB nằm **trên** con số ấy, nên câu tiếng Việt `"File vượt quá 5MB."` chưa từng có cơ hội chạy cho đúng khoảng nó sinh ra để canh: file 4,5–5 MB chết bằng một trang lỗi tiếng Anh. `next.config.mjs` còn tệ hơn — `bodySizeLimit: "6mb"` là một con số không có hiệu lực nào ngoài việc làm người đọc mã tưởng hệ thống nhận được 6 MB. Ba đường: (a) 4 MB ứng dụng + 4,5 MB cấu hình; (b) 2 MB; (c) giữ nguyên. Chủ dự án chọn **(a)**. Căn cứ: 21 file Excel thật của giáo xứ, **nặng nhất 860 KB** ⇒ còn dư gần 5 lần. Kèm hai điều: giới hạn **hiện ngay trên ô chọn file** (bản cũ chỉ báo sau khi tải xong — mạng phòng học chậm, chờ hết một lượt tải để biết là vô ích), và một phép kiểm **phía trình duyệt** vì với file ≥4,5 MB thì hàng rào máy chủ không bao giờ chạy tới | ✅ **CÓ** — chủ dự án duyệt 2026-08-03 |
| **D-136** | **"Lưu tất cả thay đổi" lưu cả giới tính lẫn cách xử lý — TRỪ dòng trùng chắc chắn** (M12-B) | `04_TO_BE_FLOWS` TO-BE 4 chỉ nói tới giới tính, nhưng chính **D-133** vừa chốt hôm trước đã tạo ra một loại lặp thứ hai: dòng trùng chắc chắn phải bấm xác nhận từng dòng. Ba đường: (a) chỉ giới tính lưu hàng loạt — đúng nguyên văn tài liệu, nhưng bỏ qua 30 dòng đã nhập tay vẫn là 30 lần bấm; (b) cả hai, **trừ** dòng trùng chắc chắn; (c) cả hai không trừ gì — nhanh nhất nhưng một cú bấm xác nhận được hai chục dòng trùng mà người duyệt chưa chắc đã mở ra nhìn, tức **đảo ngược một phần D-133** vừa chốt. Chủ dự án chọn **(b)**. Cài đặt: nút lưu chung **không** mang cờ xác nhận nên máy chủ bỏ qua đúng những dòng ấy **và nói ra số dòng**; nút "Xác nhận dòng #N" nằm **bên trong** khối đối chiếu phải mở ra mới bấm được — tức người duyệt nhìn hồ sơ trước, đúng điều D-133 muốn | ✅ **CÓ** — chủ dự án duyệt 2026-07-29 |
| **D-135** | **Danh sách lần nhập mặc định lọc theo NĂM HỌC HIỆN HÀNH** (M12-B) | Bản cũ `.limit(20)` viết cứng, không lọc, không sang trang: lần nhập thứ 21 trở đi không có đường nào mở ra xem — mà từ **D-131** ("huỷ" là đánh dấu, không xoá) thì số lần nhập chỉ tăng. Hai đường: (a) mặc định năm hiện hành, có bộ lọc mở sang năm khác; (b) mặc định mọi năm, mới nhất trước. Chủ dự án chọn **(a)**: mọi lần nhập đều ghi danh vào năm đang chạy nên lần nhập của năm cũ chỉ còn giá trị tra cứu. Hai điều bắt buộc đi kèm: phạm vi đang xem **nói thẳng trên màn hình** (bài học D-108 — danh sách tự ẩn bớt mà im lặng thì người dùng tưởng dữ liệu mất), và mặc định lưu bằng **chữ `current`** chứ không bằng id một năm cụ thể, để dấu trang cũ của ai đó không khoá họ vào năm 2026 mãi mãi | ✅ **CÓ** — chủ dự án duyệt 2026-07-29 |
| **D-134** | **Dòng của lần nhập: BẢNG trên máy tính, THẺ trên điện thoại — trong MỘT cây DOM** (M12-B) | `04_TO_BE_FLOWS` TO-BE 4 nói "bảng dòng có cột Giới tính"; `09` §11 nói thẻ trên điện thoại. Chủ dự án chọn làm cả hai thay vì giữ dạng thẻ như M12-A: thẻ cao ~150px nên một màn hình máy tính chỉ chứa 4–5 em, mà việc của người duyệt là quét mắt xuống **một cột** và chọn liên tục. 🔴 Điều đáng ghi lại là **cách cài**: không dựng hai bản rồi ẩn bớt bằng CSS, vì hai bản nghĩa là **hai ô nhập cùng tên** cùng gửi lên — và khi JavaScript chưa chạy thì bản đang ẩn vẫn gửi giá trị cũ, máy chủ nhận hai câu trả lời cho một câu hỏi. Cách đã chọn: mỗi dòng là **một `<tbody>` riêng**, dưới `md` là thẻ có viền, từ `md` là một nhóm hàng của bảng thật. `DataTable` của Đợt 0-UI không dùng được vì nó là bảng **chỉ đọc** khung sườn cố định | ✅ **CÓ** — chủ dự án duyệt 2026-07-29 (chọn từ hai bản vẽ) |
| **D-142** | **Hàng nút trạng thái điểm danh có BA lựa chọn, hai lựa chọn còn lại nằm sau nút "…"** (M05-C — cách thi hành **U-10**) | `06_UI_UX_RECOMMENDATIONS` U-10 đề xuất **hai** nút *"Có mặt · Vắng"* với lý do ">90% thao tác thực tế là chuyển giữa hai giá trị". Đúng về tần suất, nhưng nó bỏ qua một điều: **"Vắng" không phải một trạng thái tồn tại trong hệ thống** — có `excused_absence` và `unexcused_absence`, và máy buộc phải chọn hộ một trong hai. Ba đường đưa lên bàn kèm bản vẽ: (a) **ba nút** Có mặt · Vắng có phép · Vắng không phép, "…" mở Đi trễ · Về sớm; (b) hai nút như tài liệu, bấm "Vắng" ghi mặc định **vắng không phép**; (c) cả năm nút luôn hiện. Chủ dự án chọn **(a)**. Vì sao **không** (b): dù chọn mặc định nào cũng sai với một nửa số ca — chọn "không phép" thì người đang vội ghi oan cho **chính em vừa có đơn xin nghỉ**, mà con số ấy chảy thẳng vào điểm chuyên cần của M07; chọn "có phép" thì kỷ luật của lớp biến mất khỏi sổ. Vì sao **không** (c): ở 360px năm nút xuống 2–3 hàng cho **mỗi cột**, tức đi ngược đúng mục tiêu giảm cuộn của cùng đợt này. Nhãn trên nút rút gọn ("Có phép") cho vừa bề ngang; trình đọc màn hình nghe câu đầy đủ qua `ariaLabel` của từng ô. 🔴 Luật bắt buộc đi kèm: **trạng thái đang chọn luôn có mặt trong hàng nút**, kể cả khi nó thuộc nhóm sau "…" — thiếu điều này thì em đang "Đi trễ" mở ra thấy **không ô nào được chọn**, trông hệt như dữ liệu vừa bị mất | ✅ **CÓ** — chủ dự án duyệt 2026-08-03 (chọn từ ba bản vẽ) |
| **D-143** | **Hàng thiếu nhi mặc định GẤP LẠI một dòng, chạm để mở ra sửa** (M05-C — cách thi hành **U-21**) | Đo thật: thẻ mỗi em cao ~180px nên lớp 50 em dài **~9.000px** ở màn hình 360px, và việc người điểm danh thật sự làm trước khi chốt là *"soát lại mình đã đánh vắng ai"* — tức cuộn hết cả trang. Hai đường: (a) **gấp một dòng**, tên + hai chip trạng thái, chạm mới mở nút bấm ra (**~1.800px**, giảm ~80%); (b) giữ mở sẵn nhưng thu khoảng cách còn ~90px mỗi thẻ (**~4.500px**, giảm ~50%, không thêm cú chạm nào). Chủ dự án chọn **(a)**. Chi phí phải nói thẳng: **sửa một em mất thêm một cú chạm** — chấp nhận được vì mô hình của module là *"mặc định có mặt, chỉ sửa ngoại lệ"*, tức phần lớn hàng không bao giờ cần mở. 🔴 Ràng buộc bắt buộc: hàng gấp lại **vẫn phải nói đủ trạng thái cả hai cột**. Gấp mà giấu luôn kết quả thì người dùng buộc phải mở từng em ra để kiểm — tệ hơn hẳn bản cũ, và đúng cái bẫy mà một bản cài đặt "cho gọn" sẽ rơi vào | ✅ **CÓ** — chủ dự án duyệt 2026-08-03 (chọn từ hai bản vẽ) |
| **D-144** | 🔴 **SIẾT: Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký chỉ được XEM giáo án, không sửa** (M06, thi hành ở **đợt B**) | Trả lời câu `NEEDS_CONFIRMATION` số 2 của `08_ACCEPTANCE_CRITERIA` — và đây là một **mâu thuẫn giữa hai nguồn sự thật**, đúng loại `AGENTS.md` §3 cấm agent tự chọn: bảng phân quyền `docs/05` ghi Giáo án = ✅ cho ba vai trò này, còn `docs/03` WF-07 chỉ nêu người làm là **Giáo lý viên đại diện lớp**. Mã nguồn theo `docs/05` (`app.can_manage_teaching_plan` = `can_global_write() or is_class_representative()`). Chủ dự án chốt theo WF-07: trách nhiệm giáo án thuộc về đúng một người mỗi lớp. ⚠️ **Đây là siết quyền với người ĐANG dùng** — phải báo trước cho Ban điều hành xứ đoàn, nếu không họ tưởng hệ thống hỏng (`11` §6). Kèm migration + kiểm thử phân quyền âm tính bằng JWT thật.<br><br>**Ranh giới hỏi thêm khi thi hành (2026-08-05): Super Admin GIỮ quyền ghi.** D-144 nêu **đích danh ba vai trò** và không nhắc Super Admin; D-117 đã dựng sẵn khuôn "Super Admin là ngoại lệ duy nhất". 🔴 Đường còn lại — không ai ngoài Giáo lý viên đại diện — bám nguyên văn WF-07 hơn, nhưng **một lớp chưa phân công đại diện sẽ kẹt hoàn toàn**: không tài khoản nào trong hệ thống lập được giáo án cho lớp đó, kể cả khi cần chữa cháy gấp. Chủ dự án chọn **giữ Super Admin** | ✅ **CÓ** — chủ dự án duyệt 2026-08-04, ranh giới Super Admin xác nhận 2026-08-05 |
| **D-145** | **NỚI: đội ngũ lớp đọc được giáo án lớp mình — sửa cho RIÊNG giáo án, không sửa định nghĩa dùng chung** (M06, thi hành ở **đợt B**) | Chọn **phương án A** của TB-M06-06. Lỗi thật đang có: hệ thống mang **hai định nghĩa "thuộc lớp"** — `app.can_access_class` (thẻ đăng nhập + ngành) và `app.is_class_staff` (sổ phân công đội ngũ) — nên có người **ghi được mà không đọc lại được**: tạo giáo án xong, tải lại trang là trắng.<br><br>🔴 **Phạm vi thật HẸP HƠN biên bản audit mô tả, và điều đó đã được kiểm chứng bằng mã nguồn.** `03_AUDIT_RESULTS` §C08/C09 và **TB-09** dựng ví dụ *"`role_assignments.class_id = X` nhưng `class_staff_assignments.class_id = Y`"*. Cấu hình ấy **không dựng được**: trigger `validate_class_staff_assignment` ném `ROLE_CAPACITY_MISMATCH` theo chiều này, và trigger BR-A17 ném `ACTIVE_CLASS_ASSIGNMENT_REQUIRED` theo chiều kia. Với Giáo lý viên mang **vai trò lớp**, hai quyển sổ **không thể lệch nhau**. Cả hai trigger chỉ kiểm khi vai trò là vai trò lớp ⇒ lỗ còn lại đúng hai ca: **Trưởng/Phó ngành được xếp đứng lớp thuộc ngành KHÁC**, và **Thủ quỹ đứng lớp** (`can_global_read()` không có `treasurer`). Cả hai đều là chuyện có thật ở xứ đoàn thiếu người. **D-144 làm ca này nặng thêm**, vì sau khi siết thì người ghi được giáo án đúng là "đại diện đội ngũ lớp".<br><br>Không chọn phương án B (sửa `app.can_access_class`): hàm ấy đang được 6 module dùng, sửa một chỗ là nới phạm vi đọc của tất cả cùng lúc. ⚠️ **Bài kiểm thử TB-09 phải viết lại fixture** — fixture tài liệu đề nghị sẽ chết ngay ở bước dựng dữ liệu. **Không sửa `03`/`04`/`08` của module** (tài liệu audit), chỉ ghi lại ở đây.<br><br>**Ranh giới hỏi thêm khi thi hành (2026-08-05): tệp đính kèm ĐI THEO giáo án.** D-145 không nói rõ, mà mỗi bài có thể đính một tệp và policy Storage dùng `app.can_access_class` — tức định nghĩa hẹp. Nới nội dung mà không nới tệp thì **đúng nhóm người vừa được cho đọc** sẽ nhìn thấy tên tệp và nút *"Tải xuống"*, bấm vào bị từ chối — đúng loại "nút hứa một đằng làm một nẻo". `docs/05` §6 ghi *"Class staff xem **đầy đủ** giáo án"*. Chủ dự án chọn **cho tải**; nhánh nới dùng **cùng một hàm** `app.is_class_staff` nên không thêm một ai | ✅ **CÓ** — chủ dự án duyệt 2026-08-04, ranh giới tệp đính kèm xác nhận 2026-08-05 |
| **D-146** | **Chống ghi đè khi hai người cùng sửa một mục giáo án bằng KIỂM PHIÊN BẢN, không lưu lịch sử** (M06, thi hành ở **đợt B**) | Chọn **phương án A** của TB-M06-01, trả lời câu `NEEDS_CONFIRMATION` số 3. Hiện `updateTeachingPlanItem` ghi đè toàn bộ 12 trường theo `id`, không so `updated_at`: người lưu sau xoá sạch thay đổi của người lưu trước, **không cảnh báo và không có cách lấy lại** (`teaching_plan_items` không có bảng lịch sử). Phương án B (bảng `teaching_plan_item_revisions` + trigger) bị loại: thêm bảng, thêm RLS, dung lượng tăng theo số lần sửa, mà chính tài liệu khuyên chỉ làm nếu người dùng thật sự cần truy vết. Không migration — dùng `updated_at` đã có sẵn trigger | ✅ **CÓ** — chủ dự án duyệt 2026-08-04 |
| **D-147** | **Mục "Kiểm tra" trong giáo án KHÔNG sinh cột điểm ở Bảng điểm — hai module giữ độc lập** (M06/M07) | Trả lời câu `NEEDS_CONFIRMATION` số 1. Giáo án là **kế hoạch**, bảng điểm là **kết quả**; nối tự động nghĩa là sửa hoặc xoá một mục giáo án sẽ đụng tới cột điểm **đã chấm**, và phải trả lời một loạt câu chưa ai hỏi (xoá mục đã có điểm thì làm gì, đổi ngày thì cột điểm có đổi theo không, ai được sửa). `07_IMPLEMENTATION_IMPACT` xếp việc nối là cỡ **L** và đụng cả hai module; WF-07 §5 lẫn WF-08 đều không nêu ràng buộc nào. **Không làm** — ghi lại để phiên sau không mở lại | ✅ **CÓ** — chủ dự án duyệt 2026-08-04 |
| **D-148** | **Biểu mẫu soạn bài mở trong HỘP THOẠI cho cả ba viewport — không có nhánh riêng cho điện thoại, và KHÔNG làm "row inline edit trên desktop"** (M06-C, cách thi hành **#8**) | `docs/06` §11 đòi hai thứ khác nhau cho hai cỡ máy: *"row inline edit trên desktop"* và *"mobile dùng form drawer"*. Ba đường: (a) hai biến thể theo cỡ màn hình — nghe đúng đặc tả nhất nhưng đòi `matchMedia` trong `useEffect`, nên lượt dựng đầu **luôn** ra một biến thể rồi nhảy sang biến thể kia sau hydrate (nhấp nháy), và **mọi bài kiểm phải viết hai nhánh**; (b) một hộp thoại duy nhất — `Dialog` của mục 0.6 **đã** neo đáy màn hình ở mobile (`items-end` + `rounded-t-xl` + `max-h-[90vh]`) và là hộp giữa màn hình từ `sm`, tức nó **đã là** form drawer trên điện thoại mà không cần viết gì thêm; (c) không dùng lớp nổi, chỉ gom nhóm tại chỗ — trang trên 360px vẫn dài y như cũ. Chọn **(b)**. Phần "inline edit trên desktop" là **redesign**, mà `11` §3 xếp M06 cỡ UI **S · Tinh chỉnh** và bảng đợt ở `16` §2 không liệt kê nó | ✅ **CÓ** — chủ dự án chọn 2026-08-05 |
| **D-149** | **Hai nhóm trường ít dùng GẬP SẴN, và tiêu đề nhóm phải đếm số ô đã điền** (M06-C, cách thi hành **#8**) | `06_UI_UX` §4 nêu khuyết điểm *"không có nhóm, không thu gọn phần ít dùng"*. Hai đường: (a) chia nhóm nhưng mở sẵn cả ba — không giấu gì, nhưng biểu mẫu vẫn dài đúng như cũ, tức chỉ giải quyết một nửa vấn đề; (b) gập hai nhóm ít dùng. Chọn **(b)**, kèm **một điều kiện bắt buộc**: 🔴 gập một nhóm **đang có nội dung** mà không nói ra là giấu mất đúng thứ người sửa cần soát, nên tiêu đề nhóm đọc *"Nội dung buổi học · đã điền 4/7"* và con số ấy đếm theo **thứ đang gõ dở**, không đếm theo dữ liệu đã lưu. Nhóm bắt buộc **không gập được** — ràng buộc kỹ thuật, xem đợt C | ✅ **CÓ** — chủ dự án chọn 2026-08-05 |
| **D-150** | **Chú thích điểm trung bình ở cổng phụ huynh chỉ dùng số cột ĐÃ CÔNG BỐ — không nói tổng số cột của lớp** (M07-A, TB-M07-07) | 🔴 **Đây là chỗ hai tiêu chí trong CÙNG một tài liệu đã duyệt mâu thuẫn nhau**, đúng loại `AGENTS` §3 cấm agent tự chọn. `08_ACCEPTANCE_CRITERIA` AC-07-01 đòi hiện *"tính trên 3/**5** cột đã công bố"*, trong đó **5 là tổng số cột của lớp**; nhưng AC-02-03 của cùng tài liệu đòi phụ huynh *"không thấy dấu vết cột tồn tại"*, và `07_IMPLEMENTATION_IMPACT` §4 ghi *"không hạng mục nào được nới policy đọc của cổng phụ huynh/thiếu nhi"*. Ba câu không thể cùng đúng: `assessments_select_scope` chỉ cho phụ huynh thấy dòng `is_published`, nên muốn có con số 5 thì phải mở thêm một cửa đọc mới — tức thêm migration, thêm kiểm thử phân quyền bằng JWT thật, và **nói cho phụ huynh biết lớp còn cột chưa công bố**. Hai đường đặt lên bàn: (a) cả hai con số lấy từ phần đã công bố (*"tính trên 2/3 cột đã công bố"* — 3 là số cột lớp đã công bố, phụ huynh vốn đã thấy đủ chúng ở bảng ngay bên dưới; 2 là số cột em ấy có điểm, tức đúng mẫu số của phép trung bình); (b) đúng nguyên văn AC-07-01. Chủ dự án chọn **(a)**. Có bài unit canh riêng rằng chuỗi `"/5"` **không tồn tại** trong trang | ✅ **CÓ** — chủ dự án chốt 2026-08-05 |
| **D-151** | **Super Admin ĐƯỢC khóa bảng điểm, làm đường thoát** (M07, thi hành ở **đợt B**) | Trả lời câu hỏi mở số 3 của `06_DECISION_LOG.md` (*"Super Admin có được khóa bảng điểm như phương án dự phòng không?"*), câu duy nhất còn để ngỏ của **D-74**. Bảng D-74 chốt quyền khóa về **Giáo lý viên đại diện + Giáo lý viên lớp** và **siết** ba vai trò cấp xứ đoàn (Xứ đoàn trưởng · Phó Xứ đoàn · Thư ký) — nhưng chính ghi chú của D-74 nêu hệ quả: cuối năm nếu cả đại diện lẫn các Giáo lý viên của một lớp đều không thao tác kịp thì **không còn ai khóa hộ được**, mà bảng điểm chưa khóa thì điểm còn sửa được. Hai đường: (a) cho Super Admin khóa; (b) đúng nguyên văn bảng D-74, không ngoại lệ. Chủ dự án chọn **(a)** — cùng khuôn với ngoại lệ Super Admin của **D-144** ở M06-B (*"lớp chưa phân công đại diện thì không còn tài khoản nào lập được giáo án"*) và **D-117** ở M02-C. ⚠️ **Đây vẫn là một đợt SIẾT quyền của người đang dùng: phải báo trước cho Ban điều hành xứ đoàn**, nếu không họ mở bảng điểm ra, thấy mất nút "Khóa", và kết luận là hệ thống hỏng | ✅ **CÓ** — chủ dự án chốt 2026-08-05 |
| **D-152** | **Sửa/xóa một nhận xét = tác giả + Giáo lý viên ĐẠI DIỆN lớp đó + nhóm cấp xứ đoàn** (M07, thi hành ở **đợt B**) | Trả lời câu `07_IMPLEMENTATION_IMPACT` §3.3 để ngỏ (*"Giáo lý viên đại diện có được xóa nhận xét do Giáo lý viên khác viết không?"*), đúng loại `AGENTS` §3 cấm agent tự chọn vì nó là **giảm quyền của người đang dùng**. Hiện trạng: **bất kỳ ai nhận xét được lớp** đều xóa được bài của người khác — kể cả Dự trưởng phụ tá khi năm học bật cờ — và bảng **không có lịch sử** nên xóa là mất hẳn. Ba đường đặt lên bàn: (a) tác giả + đại diện lớp + cấp xứ đoàn; (b) đúng nguyên văn `04_TO_BE_FLOWS` — chỉ tác giả + `can_global_write`, khi đó đại diện thấy một nhận xét sai trong chính lớp mình cũng phải nhờ cấp xứ đoàn xóa hộ, và nếu người viết đã nghỉ thì càng chậm; (c) không siết, chấp nhận tiêu chí **S-12** đỏ khi đóng module. Chủ dự án chọn **(a)** 2026-08-05: vẫn là siết thật (một Giáo lý viên thường hoặc Dự trưởng phụ tá không còn đụng được bài của đồng nghiệp), nhưng người chịu trách nhiệm về lớp — cũng là người được khóa bảng điểm ở D-74 — xử lý được ngay tại lớp. 🔴 Luật đặt vào **cả `update` lẫn `delete`**: siết mỗi `delete` thì ai bị chặn vẫn sửa nội dung thành bất cứ thứ gì | ✅ **CÓ** — chủ dự án chốt 2026-08-05 |
| **D-153** | **DỌN dấu "chỉnh tay" đặt sai trong dữ liệu hiện có, ở đúng những ô chắc chắn không có bàn tay người** (M07-B) | Lỗi cũ đóng dấu `is_manual_override` cho **mọi** phần tử của cột chuyên cần, mà biểu mẫu gửi cả roster ⇒ một cú bấm "Lưu điểm" đánh dấu cả lớp. Sửa luật cho tương lai **không gỡ được** dấu đã đặt: nút "Lấy đề xuất mới" vĩnh viễn bỏ qua chúng, và con số `skipped_manual` mới thêm sẽ hiện **một số to giả ngay từ ngày đầu**. Ba đường: (a) gỡ cờ ở đúng những ô mà `score is not distinct from system_suggested_score` — tức điểm đang lưu **bằng đúng** đề xuất, không có bàn tay người nào trong đó; (b) không dọn, chỉ đúng từ nay, ai muốn gỡ phải bấm tay từng em; (c) gỡ sạch mọi dấu của cột chuyên cần rồi làm lại. Chủ dự án chọn **(a)** 2026-08-05. **(c) bị loại vì nó phá dữ liệu**: những em được sửa tay **có lý do** (đi trại thay vì vắng) sẽ bị máy ghi đè ở lần lấy đề xuất kế tiếp, và không có cách lấy lại. Ô có điểm **khác** đề xuất **giữ nguyên** dấu kể cả khi bị đặt oan — ở đó không phân biệt được "người sửa thật" với "người trùng số". 🔴 Đây là **thay đổi dữ liệu duy nhất** của cả module M07 | ✅ **CÓ** — chủ dự án chốt 2026-08-05 |
| **D-154** | **Bảng điểm đã khóa VẪN bật/tắt được công bố kết quả — cả hai chiều** (M07, thi hành ở **đợt C**) | `07_IMPLEMENTATION_IMPACT` §1 chấm TB-M07-02 **rủi ro CAO** — cao nhất module — và §3.2 ghi rõ đây là *"hạng mục rủi ro cao nhất về mặt nghiệp vụ"* vì nó **đụng ngữ nghĩa khóa**: luật hiện hành rất đơn giản và dễ giải thích, *"khóa rồi thì không đổi được gì nữa"*. Cái giá của sự đơn giản ấy: muốn công bố thêm một cột cho phụ huynh sau khi đã khóa thì phải nhờ Quản trị viên hệ thống **mở khóa cả bảng điểm** — tức mở luôn quyền sửa điểm, sửa hệ số, thêm/xóa cột cho cả lớp — **đúng vào lúc điểm vừa được chốt**. Ba đường: (a) tách ra, cho **cả bật lẫn tắt**; (b) tách ra nhưng **chỉ cho bật**, đã công bố thì không rút lại được; (c) giữ nguyên. Chủ dự án chọn **(a)** 2026-08-06. **(b) bị loại vì công bố nhầm một cột là không sửa được nếu không mở khóa** — đúng cái vòng luẩn quẩn đang chữa. **Ai được công bố thì KHÔNG đổi** (`app.can_grade_class`, y nguyên nhóm của policy cũ): D-154 đổi *lúc nào* công bố được, không đổi *ai*, nên đợt C có **0 thay đổi phân quyền**. Ngoại lệ đặt bên trong RPC `security definer`; **policy giữ nguyên** nên lệnh gửi thẳng vào cơ sở dữ liệu khi đã khóa vẫn bị từ chối, kể cả lệnh chỉ đổi mỗi cờ công bố (AC-02-02, pgTAP `045` đo bằng 6 khẳng định) | ✅ **CÓ** — chủ dự án chốt 2026-08-06 |
| **D-155** | **Top 5: cho TÍNH LẠI, nhưng bản đang có phải xuống LỊCH SỬ trước khi bị thay** (M07, thi hành ở **đợt C**) | 🔴 **Đây là chỗ chủ dự án chọn NGƯỢC với khuyến nghị của tài liệu**, và lý do đáng ghi lại. Hiện trạng (F16): "Ẩn khỏi portal" rồi bấm công bố lại thì hệ thống **âm thầm tính lại** theo điểm mới nhất — em đứng hạng 5 hôm trước biến khỏi bảng, không ai được báo, bản cũ không còn ở đâu, và nhãn nút không hề nói ra điều đó. Hai đường của `04_TO_BE_FLOWS`: (A, **khuyến nghị**) chốt **một lần duy nhất**, ẩn/hiện chỉ đổi khả năng nhìn thấy, muốn xếp hạng lại thì tạo bảng Top 5 mới; (B) cho tính lại nhưng **lưu lịch sử mọi lần chốt**, tài liệu chê là *"phức tạp hơn nhu cầu WF-09"* (+1 bảng, +RLS, +portal phải chọn bản nào). Chủ dự án chọn **(B)** 2026-08-06. Cách cài đặt đã **né được hai trong ba nhược điểm** mà tài liệu nêu: bảng lịch sử đứng **riêng** và **không** có nhánh đọc cho cổng phụ huynh, nên `leaderboard_entries` không đổi một chữ và **cổng không phải chọn bản nào** — nó luôn chỉ thấy bản đang có. Kèm hai thứ tài liệu không viết vì chúng chỉ cần cho phương án B: đường *"Hiện lại bản đang có"* (không tính lại — thiếu nó thì một cú ẩn nhầm vẫn kéo theo lượt tính lại) và lưới an toàn `LEADERBOARD_NOT_SNAPSHOTTED` | ✅ **CÓ** — chủ dự án chốt 2026-08-06 |
| **D-160** | **Hàng rào "năm học đã đóng" của module chuyển lớp hỏi CẢ HAI VẾ** (M08-B) | Nợ #18 ghi trước ở M08-A rằng câu hỏi *"năm nào phải mở"* có **hai** câu trả lời khả dĩ, vì một đề xuất chuyển lớp bắc qua hai năm học, và *"chọn sai vế là chặn đúng thao tác cuối năm mà module sinh ra để làm"*. Ba đường: (a) hỏi cả hai — đề xuất cần **năm nguồn** mở, duyệt cần **cả hai** mở; (b) chỉ hỏi năm nguồn; (c) chỉ hỏi năm đích. Chủ dự án chọn **(a)**. Lý do loại (b): duyệt **tạo một ghi danh mới** ở năm đích, và policy `enrollments_insert_scope` đã đòi năm đó còn ghi được từ M02-C — nhưng RPC chạy `security definer` nên **bỏ qua policy**, tức bỏ vế này là mở một đường vòng qua đúng hàng rào M02-C vừa dựng. Lý do loại (c): đóng ghi danh cũ là một lượt **ghi vào năm nguồn**, trái BR-M02-N09. Trong thực tế cuối năm hai vế đều mở (năm nguồn `current`, năm sau `draft`) nên (a) **không** chặn thao tác thật; D-117 giữ nguyên, Super Admin là ngoại lệ duy nhất | ✅ **CÓ** — chủ dự án chốt 2026-08-07 |
| **D-161** | **Cấp cuối một ngành xét đúng bí tích RIÊNG của ngành đó; ngành không có bí tích riêng mới nhắc lại các ngành trước** (M08-B) | D-156 liệt kê danh sách theo ngành và kết bằng câu *"Nghĩa 3 và Hiệp 2 không có bí tích mới, chỉ nhắc lại những bí tích ngành trước còn thiếu"*. Câu ấy đọc được hai kiểu, và hai kiểu cho hai kết quả khác nhau **ngay trên màn hình người duyệt**: một em ở **Ấu 3** chưa có Rửa Tội thì bản "cộng dồn" nhắc **ba** bí tích, bản "chỉ của ngành mình" nhắc **hai**. Chủ dự án chọn **chỉ bí tích riêng của ngành**. Hệ quả đã nói rõ khi chốt và **cố ý chấp nhận**: một em thiếu Rửa Tội sẽ không được nhắc lại từ sau Chiên Con 2 cho tới tận Nghĩa 3. Cài đặt: `app.sector_own_sacraments` (bảng ánh xạ 3 ngành) + `app.required_sacraments_for_grade` (rơi về "gom của mọi ngành trước" chỉ khi ngành hiện tại rỗng) — nằm trong migration của M08, **không** thêm cột vào `sectors`/`grade_levels` của M02 | ✅ **CÓ** — chủ dự án chốt 2026-08-07 |
| **D-162** | **Đề xuất chờ duyệt chỉ chặn "Kết thúc ghi danh", KHÔNG chặn "Tạm nghỉ"/"Khôi phục"** (M08-B) | Phạm vi cụ thể của D-158. BR-M08-20 viết *"không được **đóng** bằng luồng thủ công"*, và `paused` là trạng thái **mở**: nó không đóng ghi danh nên không sinh đề xuất mồ côi. Đường chặt hơn (chặn mọi thay đổi trạng thái) đã cân nhắc và loại: nó chặn một việc chính đáng — em ốm dài ngày đúng lúc đề xuất cuối năm đang nằm chờ Trưởng ngành — bằng một nút "không ăn" mà người dùng không có cách nào hiểu. Thi hành ở **cả hai tầng** với **cùng một danh sách bốn trạng thái đóng**: `completed` · `repeating` · `transferred` · `withdrawn` | ✅ **CÓ** — chủ dự án chốt 2026-08-07 |
| **D-163** | **Hiện tên người đề xuất/người duyệt bằng một CỬA SỔ HẸP, không nới `profiles`** (M08-C) | `07_IMPLEMENTATION_IMPACT` §2.4 để lại một điều kiện chưa ai đo cho hạng mục 8: *"cần xác nhận RLS `profiles` cho phép staff đọc `display_name` của staff khác"*. Đo rồi: **KHÔNG** — `profiles_select_self_or_global` chỉ mở cho chính mình hoặc `app.can_global_read()`, tức sáu vai trò cấp xứ đoàn, mà hai người dùng chính của trang này là **Trưởng ngành** (người duyệt) và **GLV đại diện** (người đề xuất), **không ai trong sáu**. Ba đường đặt lên bàn: (a) cửa sổ hẹp, (b) không đụng cơ sở dữ liệu và chấp nhận hai vai trò ấy thấy dấu `—`, (c) hoãn hạng mục 8 thành nợ. Chủ dự án chọn **(a)**. Lý do loại (b): biên bản audit chấm mục này mức **Cao** với đúng một câu — *"người duyệt cần biết nguồn"* — nên làm xong mà đúng người duyệt không thấy gì là làm cho có. Lý do **không** nới policy: RLS lọc theo **dòng chứ không theo cột** (bài học D-129), nên thêm một nhánh vào `profiles` là mở luôn `username` · `phone` · `email` · `account_status` · `last_login_at` của **mọi** tài khoản, để đổi lấy đúng một cột tên. Hàm `list_promotion_actor_names` chép **nguyên vị từ** của `promotion_reviews_select_scope` và chỉ trả về người **đã ra quyết định** — không phải một cuốn danh bạ. Cái giá: **M08-C có migration**, ngược dự đoán *"giao diện thuần"* ghi ở WORKLOG của M08-B; và trang chạm **đúng trần 6 lượt gọi** của AC-13 | ✅ **CÓ** — chủ dự án chốt 2026-08-08 |
| **D-164** | **"Chọn tất cả" của đề xuất hàng loạt lấy MỌI em khớp bộ lọc, kể cả em ở trang sau** (M08-C) | AC-20 viết nguyên văn *"lớp Ấu 1A có 28 em chưa đề xuất… chọn tất cả… tạo 28 review"*, trong khi trang chia **25 dòng**. Hai đường: (a) chỉ chọn các em đang hiện trên trang — an toàn nhất vì không ai xác nhận một danh sách mình chưa nhìn thấy; (b) chọn cả trang sau — đúng chữ AC-20 và ít thao tác hơn. Chủ dự án chọn **(b)**, biết trước cái giá: người bấm xác nhận một danh sách **dài hơn** thứ họ đang nhìn. Hai điều bù lại là **bắt buộc**, không phải tuỳ chọn: hộp xác nhận liệt kê **đủ tên từng em** (`11` §5 — nêu hậu quả bằng tên riêng), và con số nói ra **ngay trên nút** trước khi bấm, cộng một dòng riêng đếm *"trong đó N em ở trang khác"*. Trần một lượt vẫn là **60** (`04_TO_BE_FLOWS` TO-BE 2), và phần bị cắt **được nói ra** chứ không cắt im lặng | ✅ **CÓ** — chủ dự án chốt 2026-08-08 |
| **D-165** | **Chống gửi đúp bằng MÃ YÊU CẦU do giao diện sinh** (M10-B) | `07_IMPLEMENTATION_IMPACT` §6 Q-1 chặn hẳn hạng mục 3 cho tới khi có câu trả lời: `docs/11 §18` **liệt kê** yêu cầu idempotency mà **chưa định nghĩa khoá**, và *"cùng tiêu đề, cùng phạm vi, cách nhau vài phút **có thể là chủ ý**"*. Ba đường: (a) mã ngẫu nhiên sinh một lần mỗi lượt soạn, (b) chỉ vô hiệu nút lúc đang gửi, (c) bộ ba tiêu đề + phạm vi + khoảng thời gian. Chủ dự án chọn **(a)**. Loại (b): không chống được retry mạng và không chống được hai tab — hai đường mà người dùng **không hề biết** mình vừa đi qua. Loại (c): nó **chặn nhầm** người cố ý gửi lại cùng một thông báo, và họ không có cách nào hiểu vì sao. Mẫu idempotent đã có sẵn trong repo (`return_equipment` của M09) nên chi phí nhận thức thấp. 🔴 Cái bẫy cài đặt: đường tắt idempotent phải dừng **trước** bước chốt danh sách người nhận — `unique (notification_id, profile_id)` chặn dòng trùng nên `row_count` về **0** và `recipient_count` bị ghi đè thành 0, tức thông báo tới đủ người mà báo cáo là *"chưa tới ai"* | ✅ **CÓ** — chủ dự án chốt 2026-08-09 |
| **D-166** | **Thu hồi MỀM: tác giả + bốn vai trò cấp xứ đoàn, KHÔNG giới hạn thời gian, lý do BẮT BUỘC** (M10-C) | `07` §6 Q-2 chặn hạn mục 8. Ba vế đều do chủ dự án chốt, và vế thời gian có lý lẽ đáng ghi nguyên văn: *"biện pháp an toàn không phải đồng hồ mà là nhật ký"* — sai sót thường bị phát hiện **muộn**, một phụ huynh nhắn lại sau hai tiếng thì cửa 15 phút đã đóng, còn phương án *"chỉ khi chưa ai đọc"* thì với thông báo gửi 300 người chỉ cần **một** người mở trong vài giây là cửa đóng hẳn. Đổi lại, lý do là **bắt buộc** và chặn ở **cả hai tầng** (Zod máy chủ **và** RPC), vì `authenticated` gọi thẳng RPC được. Vế "ai": chỉ tác giả là **quá chặt** — họ có thể đi vắng, tài khoản có thể bị khoá, và đôi khi chính họ là người không nhận ra mình gửi sai; nhóm mở rộng đúng bằng `app.can_global_write()`, tức **0 thay đổi phân quyền**. 🔴 Ràng buộc tuyệt đối của `08_ACCEPTANCE_CRITERIA` §4 giữ nguyên: thu hồi làm bằng **cột trạng thái + RPC**, `authenticated` **không** được thêm một quyền ghi nào | ✅ **CÓ** — chủ dự án chốt 2026-08-09 |
| **D-167** | **Gửi đích danh PHẢI tới được người chưa có phân công vai trò** (M10-B) | `07` §6 Q-3. Hiện trạng là *"không"* — và `03_AUDIT_RESULTS` §4.5 xếp nó là **hố đen**: người nhận không bao giờ thấy gì, **và người gửi cũng không được báo**. Gốc rễ là một mệnh đề `from` dùng chung cho 7 phạm vi có ngữ nghĩa khác nhau: điều kiện *"phải có vai trò đang hoạt động"* đúng cho 6 phạm vi **nhóm** nhưng sai cho phạm vi **cá nhân** — gửi cho một người là gửi cho *chính người đó*, không phải cho *vai trò của họ*. Chủ dự án chốt **phải nhận được**, với lý do là tình huống thật hay gặp nhất: vừa cấp tài khoản cho một anh/chị mới, muốn nhắn hướng dẫn đăng nhập **trước khi** phân công. Kèm **BR-M10-23**: người nhận phải là tài khoản **đang hoạt động**, và lần gửi cho tài khoản đã khoá bị từ chối **trước khi ghi** thay vì ghi xong rồi lặng lẽ ra 0 người | ✅ **CÓ** — chủ dự án chốt 2026-08-09 |
| **D-168** | **Sau khi thu hồi, người nhận VẪN thấy dòng ấy kèm nhãn "Đã thu hồi"** (M10-C) | 🔴 **Quyết định này ra đời vì hai tài liệu module NÓI NGƯỢC NHAU**, phát hiện lúc thiết kế đợt C: `07_IMPLEMENTATION_IMPACT` §4 đòi hàng rào đọc **loại trừ** bản đã thu hồi ⇒ nó **biến mất** khỏi hộp thư; `04_TO_BE_FLOWS` TB-M10-05 đòi hộp thư **hiển thị** *"Thông báo này đã được thu hồi"* thay cho nội dung ⇒ nó **ở lại**. Không thể cùng đúng, và `AGENTS.md` §3 cấm tự chọn. Chủ dự án chốt **ở lại kèm nhãn**, lý do: người nhận **có thể đã đọc** nội dung sai rồi — cho nó biến mất không dấu vết là để họ tưởng mình nhớ nhầm, hoặc tệ hơn là **cứ làm theo** một thông báo đã bị huỷ. Cài đặt hoà giải được **cả hai** vế: hàng rào đọc **vẫn** giấu hẳn bản ghi khỏi người nhận (đúng `07` §4 — nội dung sai không đọc tiếp được kể cả gọi thẳng Data API), còn nhãn dựng từ một **cờ nhân bản** xuống bảng người-nhận do trigger giữ đồng bộ, thứ họ vẫn đọc được. Cờ ấy gánh thêm việc thứ hai: phép đếm chưa đọc chạy ở **vỏ ứng dụng trên mọi trang**, có cờ tại chỗ thì nó vẫn là một lượt đếm **một bảng** | ✅ **CÓ** — chủ dự án chốt 2026-08-10 |
| **D-169** | **Ô "Lớp" của trang tổng quan đếm theo phạm vi người xem, sửa TRONG VIEW** (M11-A) | `04_TO_BE_FLOWS` TB-01 đưa hai đường và **tự khuyến nghị A**: (a) thêm mệnh đề phạm vi vào CTE `classed`; (b) ẩn hẳn ô "Lớp" với vai trò không toàn cục. Chọn **(a)**. Loại (b) vì con số sai **vẫn nằm trong view** nên module sau dùng lại là tái phát, và vì `docs/06` §7 đòi dashboard của Trưởng ngành phải cho biết **số lớp ngành mình** — ẩn đi là bỏ mất một thông tin họ cần. Hệ quả phải nói rõ: đây là **siết** phạm vi đọc — Giáo lý viên lớp trước thấy 19 nay thấy 1 — nhưng không ai **mất** thông tin nào của mình, và policy của `classes` **không đụng tới** nên dropdown/điều hướng giữ nguyên | ⚠️ **KHÔNG** — chọn đúng phương án tài liệu đã khuyến nghị, nằm trong phạm vi `11` đã duyệt |
| **D-170** | **Thủ quỹ đọc được SỐ GỘP THEO LỚP, làm bằng CỬA SỔ HẸP** (M11-B) | Trả nốt nửa còn nợ của **D-67** (`11` §6). Hiện trạng là thứ `03_AUDIT_RESULTS` §4.2 gọi đúng tên: *"bị cấm toàn bộ ở cơ sở dữ liệu nhưng được mời vào ở giao diện"* — Thủ quỹ có mục "Báo cáo" trên thanh điều hướng, bấm vào thì vào được trang và thấy **bảng trống hoàn toàn**. Ba đường đưa cho chủ dự án: (a) cửa sổ hẹp — một hàm riêng chỉ trả số gộp theo lớp, **không đụng** hai RPC báo cáo đang chạy; (b) đúng phương án A của `04_TO_BE_FLOWS` — chuyển hai RPC ấy sang `security definer`; (c) bỏ mục "Báo cáo" khỏi menu Thủ quỹ. Chủ dự án chọn **(a)**. Loại (b) vì `07` §2.1 **tự xếp nó là điểm nguy hiểm nhất của cả module**: hai RPC ấy đang là `invoker` nên RLS của người gọi tự bảo vệ, đổi sang definer là **đổi mô hình bảo mật** và *"một `where` thiếu là rò toàn bộ số liệu xứ đoàn"* — cái giá ấy trả cho **một** vai trò là không đáng, trong khi khuôn cửa sổ hẹp đã chạy thật ở M03-C (`list_students_for_fees`) và M08-C (`list_promotion_actor_names`). Loại (c) vì nó đi **ngược D-67** mà chính chủ dự án duyệt 2026-07-23, và Phase 8 (học phí/biên lai) sẽ phải mở lại | ✅ **CÓ** — chủ dự án chốt 2026-08-11 |
| **D-171** | **Báo cáo "Kết quả học tập" LUÔN là cả năm học; ẩn ô chọn kỳ** (M11-B) | `07` §6 Q-2. Đây là một cái **nhãn nói sai nội dung**, không phải một thiếu sót tính năng: `report_results_rows` **bỏ qua** khoảng ngày, nên chọn "Tháng 09" ra số liệu **cả năm** trong khi bản chốt vẫn dán nhãn `period_start/end = 01/09–30/09`. Hai đường: (a) cho lọc thật theo `assessment_date`; (b) ép `periodType = "year"` cho loại báo cáo này ở **cả** giao diện lẫn máy chủ. Chủ dự án chọn **(b)**. Loại (a) không phải vì khó — nó **đúng kỳ vọng nghiệp vụ hơn** — mà vì nó đòi `drop function` + `create` để đổi chữ ký RPC **và** đòi chốt thêm một luật chưa ai hỏi: *bài kiểm tra không ghi ngày thì tính vào kỳ nào?*. (b) làm nhãn nói đúng **ngay**, không migration, và không chặn đường làm (a) về sau | ✅ **CÓ** — chủ dự án chốt 2026-08-11 |
| **D-172** | **Chốt trùng thì CHO, nhưng phải hỏi lại và nêu bản chốt đã có** (M11-B) | `07` §6 Q-3. Bản chốt **không sửa và không xóa được** (`grant select, insert` — `20260723000500:262`), nên câu hỏi này quyết định một thứ không lùi được. Ba đường: (a) chặn hẳn bằng `unique` trên (loại · phạm vi · kỳ); (b) cho trùng nhưng hộp xác nhận **nói ra** bản đã có — ngày nào, ai chốt; (c) cho trùng tự do như hiện nay. Chủ dự án chọn **(b)**. Loại (a) vì nó chặn đúng một việc chính đáng và hay xảy ra: điểm danh bổ sung muộn, điểm nhập sót — sửa xong thì **không chốt lại được nữa**, và bản sai nằm lại vĩnh viễn vì snapshot cũng không xóa được. Loại (c) vì chốt báo cáo là thao tác **chậm** (tính lại toàn bộ số liệu), người dùng tưởng chưa ăn nên bấm lại, và kho lưu 5 năm đầy bản trùng không phân biệt được. **Không sinh migration** — luật "thế nào là trùng" nằm ở tầng ứng dụng, đúng chỗ vì nó là một câu hỏi chứ không phải một hàng rào | ✅ **CÓ** — chủ dự án chốt 2026-08-11 |
| **D-173** | **Cửa sổ hẹp của Thủ quỹ phủ CẢ BA chỗ: bảng báo cáo · kho bản chốt · trang tổng quan** (M11-B) | D-170 chốt *cách* nới nhưng chưa chốt *tới đâu*. Ba đường: (a) cả ba chỗ; (b) bỏ trang tổng quan; (c) chỉ trang Báo cáo. Chủ dự án chọn **(a)**. 🔴 Lý lẽ đến từ **số đo, không từ suy đoán**: trước đợt này Thủ quỹ thấy `0 thiếu nhi · 0 giáo lý viên · 0 lớp` trên trang chủ — đó **không phải "chưa biết", đó là NÓI SAI**, và nói sai với một chức việc cấp xứ đoàn ngay màn hình đầu tiên sau khi đăng nhập. Loại (c) vì nó **lặp lại đúng vấn đề đang chữa** ở hai chỗ khác: mục "Báo cáo đã chốt" mà họ nhìn thấy nhưng không bao giờ có gì trong đó, và bốn số 0 kia. Loại (b) cùng lý do. Khớp `docs/05` §4.5 (*"Dashboard tổng hợp"* + *"Báo cáo tổng hợp"*) và ô ma trận *"👁/export giới hạn"*. Cái giá đã biết: nhiều việc nhất trong ba, và phải đụng lại phần trang tổng quan vừa sửa hôm trước cho D-169 — nên **không sửa view**, đi qua một hàm riêng (xem `16` §2 đợt B mục 2) | ✅ **CÓ** — chủ dự án chốt 2026-08-12 |
| **D-174** | **Hộp xác nhận NÊU TÊN người đã chốt bản trùng, qua một cửa sổ hẹp thứ hai** (M11-B) | D-172 đòi hộp *"nêu bản đã có — ngày nào, ai chốt"*, và chữ **"ai"** hoá ra không miễn phí. 🔴 **Bản sinh đôi của cái bẫy M08-C đã vấp** (`07` §2.4 → D-163): `profiles_select_self_or_global` chỉ mở cho chính mình hoặc `app.can_global_read()` — sáu vai trò cấp xứ đoàn — mà **hai nhóm chốt báo cáo nhiều nhất, Trưởng ngành và Giáo lý viên đại diện, không nằm trong sáu**. Nhúng thẳng `profiles(display_name)` cho họ một ô `null` **trong im lặng**: tính năng có mặt trong mã nguồn mà vắng mặt đúng ở người cần nó. Hai đường: (a) mở cửa sổ hẹp; (b) chỉ nêu ngày giờ. Chủ dự án chọn **(a)**. Loại (b) vì người bấm không biết bản cũ là **của mình hay của người khác** — tức thiếu đúng dữ kiện để quyết định có chốt đè thêm hay không. Cửa sổ này hẹp hơn cả `list_promotion_actor_names`: trả tối đa **một** hàng, chỉ khi người gọi **vốn đã** đọc được bản chốt ấy, và về người thì không có gì ngoài `display_name`. **0 policy bị nới** — pgTAP `051` và `052` đều có bài canh: đọc thẳng `public.profiles` vẫn 0 dòng | ✅ **CÓ** — chủ dự án chốt 2026-08-12 |
| **D-130** | **Trạng thái hồ sơ "Tạm nghỉ" KÉO THEO ghi danh sang "Tạm nghỉ"; "Đang sinh hoạt" khôi phục lại** (M03-C) | Gốc của lỗi F06 là hai trục trạng thái không luật nào ràng buộc, và cả hai đều có một giá trị đọc lên nghe giống nhau — `students.temporarily_inactive` và `enrollments.paused` cùng hiện chữ "Tạm nghỉ". Ba đường đã đặt lên bàn: (a) chỉ "Đã rút"/"Lưu trữ" mới đụng ghi danh, (b) "Tạm nghỉ" hồ sơ kéo theo ghi danh, (c) bỏ hẳn "Tạm nghỉ" khỏi trạng thái hồ sơ. Chủ dự án chọn **(b)**: để một chữ nói hai điều khác nhau ở hai màn hình là dựng lại đúng loại nhầm lẫn đã sinh ra lỗi CRITICAL F10. Hệ quả: cần cả **chiều về** — không có nhánh khôi phục thì một em đưa sang "Tạm nghỉ" rồi đưa lại "Đang sinh hoạt" sẽ **kẹt ở ghi danh tạm nghỉ**: hồ sơ nói em đi học, sĩ số nói em nghỉ | ✅ **CÓ** — chủ dự án duyệt 2026-07-28 |

---

## 5. Quy trình bắt buộc cho mỗi module (`11` §4)

1. Đọc `03_AUDIT_RESULTS.md` và `04_TO_BE_FLOWS.md` của module đó.
2. Xác định nghiệp vụ `PASS` hay cần sửa.
3. **Nếu cần sửa: sửa cơ sở dữ liệu / domain / API / phân quyền TRƯỚC, rồi mới sửa giao diện.**
4. Áp design system đã duyệt (`09`).
5. Đồng bộ desktop và mobile.
6. Chạy build · lint · type-check · test.
7. Kiểm accessibility.
8. Cập nhật file này + `00_SYSTEM_AUDIT_BOARD.md` + `WORKLOG.md` với **số kiểm thử thật**.
9. Sang module tiếp theo.
