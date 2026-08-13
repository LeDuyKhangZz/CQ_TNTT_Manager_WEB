# M10 — THÔNG BÁO · Business Rules

> Quy tắc **trích từ code đang chạy**. Cột "Nơi enforce" cho biết luật giữ ở đâu — luật chỉ nằm ở giao diện
> là luật có thể bị lách.

Ký hiệu: `UI` · `Zod` · `RPC` (hàm `security definer`) · `CHECK`/`UNIQUE` · `RLS` · `grant`.

---

## 1. Quyền công bố theo phạm vi

| Mã | Phát biểu | Nơi enforce | file:line | Đối chiếu docs |
|---|---|---|---|---|
| BR-M10-01 | Phạm vi **toàn hệ thống / tất cả phụ huynh / tất cả thiếu nhi / một người**: chỉ nhóm global-write | `RPC` | `20260723000400:74-104` | ✅ `docs/05 §6` |
| BR-M10-02 | Phạm vi **ngành**: Trưởng/Phó chính ngành đó, hoặc global-write | `RPC` | `20260723000400:74-104` | ✅ |
| BR-M10-03 | Phạm vi **lớp**: Đại diện chính lớp đó, Trưởng/Phó ngành của lớp đó, hoặc global-write | `RPC` | `20260723000400:74-104` | ✅ |
| BR-M10-04 | Phạm vi **Ban**: Trưởng/Phó chính Ban đó, hoặc global-write | `RPC` | `20260723000400:74-104` | ✅ |
| BR-M10-05 | Kiểm quyền nằm trong RPC `security definer`, **không** dựa vào RLS ⇒ không lách được bằng thao tác bảng | `RPC` | `20260723000400:74-104,186` | ✅ AGENTS §5 |
| BR-M10-06 | Không role nào công bố vượt phạm vi của mình | `RPC` | pgTAP `022:81-98,133-135,153-156` | ✅ **6 hướng chối đã có test** |

## 2. Tính bất biến của bản ghi

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M10-07 | `authenticated` **chỉ có quyền đọc** `notifications` và `notification_recipients` | `grant` | `20260723000400:260` |
| BR-M10-08 | Không tồn tại policy INSERT/UPDATE/DELETE ⇒ mọi thay đổi bắt buộc qua RPC | `RLS` (thiếu policy = chặn) | `20260723000400` |
| BR-M10-09 | Thông báo đã công bố **không ai sửa/xóa được** qua luồng người dùng | `grant` + không có RPC | `20260723000400:260-261` |
| BR-M10-10 | Đúng một cột đích khác `null` — không có trạng thái nửa vời | `CHECK` `notifications_target_shape` | `20260723000400:48-56` |

## 3. Chốt danh sách người nhận

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M10-11 | Danh sách người nhận được dựng **trong cùng giao dịch** với việc công bố | `RPC` | `20260723000400:224` |
| BR-M10-12 | Người vào lớp **sau** khi công bố **không** nhận ngược thông báo cũ | (hệ quả BR-M10-11, không có job dựng lại) | `20260723000400` |
| BR-M10-13 | Người rời lớp **vẫn giữ** thông báo đã nhận; số chưa đọc không nhảy | (hệ quả BR-M10-11) | pgTAP `022:110-126` |
| BR-M10-14 | Một người thuộc nhiều nhánh chỉ nhận **một** bản (ví dụ Giáo lý viên kiêm phụ huynh — D-25) | `distinct` + `UNIQUE (notification_id, profile_id)` | `20260723000400:67,125,178` |
| BR-M10-15 | ⚠️ Người **chưa có phân công vai trò đang hoạt động** không bao giờ nhận được thông báo, kể cả khi gửi đích danh | `RPC` (join bắt buộc) | `20260723000400:127-128` |
| BR-M10-16 | ⚠️ Người công bố **không được báo** khi số người nhận bằng 0 | — | *(thiếu)* |

## 4. Đọc và đánh dấu đã đọc

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M10-17 | `read_at` luôn gắn với `auth.uid()`; client **không** truyền được người khác | `RPC` | `20260723000400:237,251` |
| BR-M10-18 | Chỉ đọc được thông báo mà mình nằm trong danh sách nhận, hoặc mình là tác giả, hoặc có quyền đọc toàn cục | `RLS` | `20260723000400:271-282` |
| BR-M10-19 | Người thường không thấy dòng người nhận của người khác | `RLS` | `20260723000400:283-285` |
| BR-M10-20 | 🔴 **VI PHẠM:** hộp thư và badge **không lọc theo người đang đăng nhập** ⇒ 6 vai trò global-read thấy dữ liệu của cả hệ thống | *(thiếu ở tầng truy vấn)* | `notifications/server/queries.ts:42-49,111-115` |

## 5. Liên kết sâu (deep-link)

| Mã | Phát biểu | Nơi enforce | file:line |
|---|---|---|---|
| BR-M10-21 | Đường dẫn kèm theo chỉ được trỏ tới route **đã tồn tại**; cơ sở dữ liệu từ chối đường dẫn lạ | `CHECK` + hàm immutable | `20260723000400:15-31,47` |
| BR-M10-22 | Danh sách route hợp lệ được kiểm ở **cả** cơ sở dữ liệu **và** tầng ứng dụng | `CHECK` + `Zod` | `20260723000400:47`; `notifications/schemas.ts:21-23` |
| BR-M10-23 | Có unit test so **từng route và cả số lượng** giữa hai nơi ⇒ thêm ở một bên mà quên bên kia là test đỏ | test | `tests/unit/notification-schemas.test.ts:24-39` |

## 6. Phạm vi ngoài luồng

| Mã | Phát biểu | Trạng thái |
|---|---|---|
| BR-M10-24 | Không lên lịch gửi, không nhắn tin ngoài hệ thống (SMS/Zalo/email), không chat | ✅ đúng D-50 |
| BR-M10-25 | Phạm vi "một người" **có ở cơ sở dữ liệu nhưng không có giao diện** | ⚠️ chưa dùng được |
| BR-M10-26 | Công bố hai lần tạo hai thông báo — **không có cơ chế chống trùng** | ⚠️ `docs/11 §18` yêu cầu, chưa thiết kế khóa |

---

## 7. Bảng quy tắc bị VI PHẠM hoặc THIẾU

| Mã | Luật cần có | Hiện trạng | Mức |
|---|---|---|---|
| BR-M10-20 | Màn hình "của tôi" chỉ hiện dữ liệu của tôi | Thiếu lọc `profile_id` ở 2 truy vấn | **CRITICAL** |
| BR-M10-16 | Người gửi phải biết thông báo tới được bao nhiêu người | Không báo, kể cả khi bằng 0 | NEEDS_IMPROVEMENT |
| BR-M10-25 | Gửi được cho một người cụ thể | Không có giao diện chọn người | NEEDS_IMPROVEMENT |
| BR-M10-26 | Bấm gửi hai lần không tạo hai thông báo | Không có khóa chống trùng | NEEDS_IMPROVEMENT |
| BR-M10-27 | Gửi nhầm phải có đường sửa sai | Không có khái niệm "thu hồi" | NEEDS_CONFIRMATION |

---

## 8. Nhận định

**Tầng cơ sở dữ liệu của module này là một trong những phần viết chuẩn nhất repo.** Ba điểm đáng học và
nhân rộng sang module khác:

1. **Kiểm quyền đặt trong RPC, tách khỏi RLS** (BR-M10-05). RLS trả lời "được phép *thấy* gì";
   RPC trả lời "được phép *làm* gì". Tách hai câu hỏi làm cho việc công bố không thể lách được.
2. **Chốt danh sách người nhận ngay trong giao dịch công bố** (BR-M10-11). Không có khoảng thời gian nào
   mà thông báo tồn tại nhưng chưa có người nhận, và số chưa đọc không bao giờ nhảy khi ai đó đổi lớp.
3. **Danh sách đường dẫn hợp lệ được canh bằng test so số lượng hai chiều** (BR-M10-23). Đây là mẫu chống
   trôi lệch tốt nhất trong toàn bộ dự án — nên áp dụng cho mọi cặp hằng số song song giữa TypeScript và SQL.

**Toàn bộ vấn đề của module nằm ở đúng hai dòng truy vấn thiếu điều kiện lọc** (BR-M10-20). Bài học gốc:
*RLS là hàng rào bảo mật, không phải bộ lọc nghiệp vụ.* Khi một policy có thêm nhánh `or can_global_read()`
để phục vụ quản trị, mọi màn hình "của tôi" dựa vào policy đó để lọc sẽ **sai ngay** với người có quyền rộng.
Truy vấn phải tự nói rõ mình muốn thấy gì.
