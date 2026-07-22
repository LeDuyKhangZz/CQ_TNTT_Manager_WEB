import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationCenter } from "@/features/notifications/components/notification-center";
import { getNotificationsPageData } from "@/features/notifications/server/queries";

export default async function NotificationsPage() {
  const data = await getNotificationsPageData();
  return (
    <PageContainer>
      <PageHeader
        title="Thông báo"
        description="Danh sách người nhận được chốt ngay khi gửi, nên số chưa đọc không đổi khi bạn chuyển lớp hay đổi vai trò."
      />
      <NotificationCenter data={data} />
    </PageContainer>
  );
}
