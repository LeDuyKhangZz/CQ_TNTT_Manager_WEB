# M10 — THÔNG BÁO · 01. MODULE DISCOVERY

> Giai đoạn 1 — Audit nghiệp vụ (read-only).
> Nguồn sự thật: `docs/03-workflow.md` **WF-14**, `docs/02-database-design.md` §12,
> `docs/05-permission-matrix.md` §6 Notification, `docs/06-ui-ux-spec.md` §14,
> `docs/11-api-and-server-actions.md` §13 và §18.

## 1. Phạm vi module

Thông báo **trong web** (D-50): không chat, không SMS/email/Zalo, không hẹn giờ.

| Khối | Nội dung |
|---|---|
| Soạn & publish | Chọn phạm vi được phép, nhập tiêu đề/nội dung, deep-link tuỳ chọn, publish ngay |
| Materialize người nhận | Chốt danh sách người nhận **trong cùng giao dịch** với publish |
| Hộp thư | Danh sách thông báo dành cho tôi, trạng thái đã đọc/chưa đọc |
| Read state | `read_at` theo từng người; đánh dấu một bản hoặc tất cả |
| Badge | Số chưa đọc ở header, hiện trên mọi trang dashboard |

## 2. Bảy phạm vi gửi

| `target_type` | Nhãn | Ai được gửi (theo `docs/05 §6`) |
|---|---|---|
| `all` | Toàn hệ thống | global-write |
| `guardians` | Tất cả phụ huynh | global-write |
| `students` | Tất cả thiếu nhi | global-write |
| `user` | Một người | global-write |
| `sector` | Theo ngành | Trưởng/Phó chính ngành đó, hoặc global-write |
| `class` | Theo lớp | Đại diện chính lớp đó, Trưởng/Phó ngành của lớp đó, hoặc global-write |
| `committee` | Theo Ban | Trưởng/Phó chính Ban đó, hoặc global-write |

Nguồn: `src/features/notifications/constants.ts:1-20`; enum DB `public.notification_target_type`.

## 3. Bản đồ file

### 3.1 UI

| File | Vai trò |
|---|---|
| `src/app/(dashboard)/notifications/page.tsx:1-17` | Trang hộp thư (server component) |
| `src/features/notifications/components/notification-center.tsx:1-206` | Form gửi + danh sách hộp thư + đánh dấu đã đọc |
| `src/components/layout/notification-button.tsx:1-24` | Chuông + badge số chưa đọc, `data-testid="unread-notification-badge"` |
| `src/app/(dashboard)/layout.tsx:7-9` | Nạp `unreadCount` cho **mọi** trang dashboard |
| `src/components/layout/app-header.tsx:7,19` | Truyền `unreadCount` xuống chuông |
| `src/config/navigation.ts:53` | Mục "Thông báo", nhóm "Chung", audience `staff`/`guardian`/`student` |

### 3.2 Server

| File | Vai trò |
|---|---|
| `src/features/notifications/server/actions.ts:41-92` | `publishNotification`, `markNotificationRead`, `markAllNotificationsRead` — cả 3 đều gọi RPC |
| `src/features/notifications/server/queries.ts:42-49` | `getUnreadNotificationCount` |
| `:51-105` | `getPublishOptions` — dựng danh sách ngành/lớp/Ban được phép gửi |
| `:107-136` | `getNotificationsPageData` |
| `:139-142` | `getHeaderNotificationState` (hiện **không** được dùng ở đâu) |
| `src/features/notifications/schemas.ts:1-30` | `publishNotificationSchema`, `markNotificationReadSchema` |
| `src/features/notifications/constants.ts:1-58` | 7 target type, 17 route hợp lệ cho deep-link, `isKnownNotificationLink` |

### 3.3 DB — `supabase/migrations/20260723000400_notifications.sql`

| Đối tượng | Dòng |
|---|---|
| `app.notification_link_is_valid(text)` — immutable, allowlist 17 route | `:15-31` |
| Bảng `notifications` (+ CHECK `notifications_link_known_route`, CHECK `notifications_target_shape`) | `:33-57` |
| Bảng `notification_recipients` (+ unique `(notification_id, profile_id)`) | `:61-71` |
| `app.can_publish_notification(target_type, target_id)` | `:74-104` |
| `app.materialize_notification_recipients(uuid)` — SECURITY DEFINER | `:109-184` |
| `public.publish_notification(...)` — SECURITY DEFINER | `:186-227` |
| `public.mark_notification_read(uuid)` — SECURITY DEFINER | `:229-238` |
| `public.mark_all_notifications_read()` — SECURITY DEFINER | `:240-255` |
| GRANT: `authenticated` chỉ có **SELECT** trên cả 2 bảng | `:260-267` |
| Policy `notifications_select_recipient` | `:271-281` |
| Policy `notification_recipients_select_self` | `:283-285` |

**Không có** policy/grant INSERT, UPDATE, DELETE cho `authenticated` trên cả hai bảng — mọi ghi đi qua RPC.

### 3.4 Test

| File | Bao phủ |
|---|---|
| `supabase/tests/022_notifications_test.sql` (31 assert) | Không INSERT thẳng; phụ huynh/GLV thường không publish; đại diện không gửi sang lớp khác; deep-link lạ bị chặn; materialize đúng người; trưởng ngành/Trưởng ban đúng phạm vi; read state theo từng người |
| `tests/unit/notification-schemas.test.ts` (6 case) | Allowlist deep-link, **đồng bộ danh sách route TS ↔ migration**, ràng buộc target/targetId |
| `tests/e2e/committees.spec.ts:208-244` | Đại diện lớp gửi → phụ huynh nhận, badge hiện, đánh dấu đã đọc, GLV lớp khác không thấy |

## 4. Vai trò tham gia

| Actor | Gửi được | Nhận | Ghi chú |
|---|---|---|---|
| `super_admin`, `group_leader`, `deputy_group_leader`, `secretary` | Cả 7 phạm vi | Có | `app.can_global_write()` |
| `parish_priest`, `chaplain` | **Không** | Có | Có `can_global_read()` → **đọc được mọi thông báo**, kể cả thông báo riêng tới một người |
| `sector_leader`, `sector_deputy` | `sector` (ngành mình), `class` (lớp thuộc ngành mình) | Có | `notifications.sql:85-99` |
| `class_representative` | `class` (lớp mình) | Có | `app.is_class_representative` |
| Trưởng/Phó Ban | `committee` (Ban mình) | Có | `app.is_committee_leader_or_deputy` — **dùng chung với M09** |
| `class_teacher`, `trainee_assistant`, `treasurer` | Không | Có | `docs/05:205` có ghi "teacher nếu flag" — flag **chưa tồn tại** |
| `guardian`, `student` | Không | Có | Vào `/notifications` được (`route-map.ts:23`) |

## 5. Quyết định thiết kế đã ghi trong repo

- **D-50**: chỉ trong web; có read state; không chat/SMS/email/Zalo/schedule.
- **WF-14**: publish ngay → materialize ngay trong cùng giao dịch → mở thông báo set `read_at` → badge đếm chưa đọc.
- Người nhận **chốt tại thời điểm publish**: người vào lớp sau không nhận ngược, người rời lớp vẫn giữ
  thông báo cũ, số chưa đọc không nhảy (`docs/03-workflow.md` WF-14; `notifications.sql:6-9,292-293`).
- **AGENTS §8**: không tạo deep-link tới route chưa tồn tại; DB từ chối đường dẫn lạ.

## 6. Điểm cần soi kỹ (đầu vào cho bước 02–03)

1. Ai publish được phạm vi nào — có role nào vượt phạm vi không.
2. Người nhận có thật sự chốt tại thời điểm publish không (3 kịch bản: vào lớp sau, rời lớp, count unread).
3. `read_at` có đúng per-user không.
4. Badge count: có N+1 không, có leak count của người khác không.
5. Deep-link validation nằm ở DB constraint hay chỉ Zod.
6. Sửa/xoá thông báo đã publish có được không.
7. Thông báo tới "một người" có rò danh tính người nhận khác không.
