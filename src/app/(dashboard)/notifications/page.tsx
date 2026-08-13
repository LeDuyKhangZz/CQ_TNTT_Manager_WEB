import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import { getNotificationsPageData } from "@/features/notifications/server/queries";

/**
 * M10-C — bộ lọc và số trang đi qua `searchParams`, không qua state của trình
 * duyệt: người dùng phải chép được đường dẫn *"hộp thư của tôi, chỉ chưa đọc,
 * trang 3"*, mở tab mới và bấm Back — cùng lý lẽ với `Pagination` ở `09` §11.
 */
export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; page?: string }>;
}) {
  const params = await searchParams;
  const data = await getNotificationsPageData(params);
  return (
    <PageContainer
      data-density={data.audience === "guardian" || data.audience === "student" ? "comfortable" : undefined}
    >
      <PageHeader
        title="Thông báo"
        description="Danh sách người nhận được chốt ngay khi gửi, nên số chưa đọc không đổi khi bạn chuyển lớp hay đổi vai trò."
      />
      <NotificationCenter data={data} />
    </PageContainer>
  );
}
