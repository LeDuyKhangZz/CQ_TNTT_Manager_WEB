import { getHeaderNotificationState } from "@/features/notifications/server/queries";
import { NotificationButton } from "./notification-button";

/**
 * Phần **đếm** của chuông thông báo — M14 A-16.
 *
 * Tách khỏi `layout.tsx` để bọc được trong `<Suspense>`: bản cũ `await` truy vấn
 * đếm ngay trong layout, nên **mọi** lần điều hướng đều phải chờ xong một truy
 * vấn `count` rồi mới được vẽ trang. `/reports` vốn đã nặng phải gánh thêm.
 *
 * Cái chuông (và link tới `/notifications`) vẫn hiện ngay lập tức qua fallback;
 * chỉ con số chưa đọc là tới sau. Fallback cố ý **không** đoán một con số:
 * `NotificationButton` không có `unreadCount` thì không vẽ badge và nhãn cho
 * trình đọc màn hình chỉ là "Mở thông báo" — không nói một con số nào cả còn hơn
 * nói một con số sai rồi lặng lẽ đổi.
 */
export async function NotificationBell() {
  // M10-A: đi qua `getHeaderNotificationState` chứ không gọi thẳng phép đếm —
  // hàm đó biết người đang đăng nhập là ai, và con số phải là **của người ấy**
  // (CRIT-M10-01). Trước M10-A cái chuông này đếm chưa đọc của cả xứ đoàn với
  // 6 vai trò cấp xứ đoàn, và nó chạy ở vỏ nên sai trên **mọi** trang.
  const { unreadCount } = await getHeaderNotificationState();
  return <NotificationButton unreadCount={unreadCount} />;
}
