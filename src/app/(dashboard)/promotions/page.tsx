import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { PromotionBoard } from "@/features/promotions/components/promotion-board";
import { getPromotionsPageData } from "@/features/promotions/server/queries";

export default async function PromotionsPage() {
  const data = await getPromotionsPageData();
  return (
    <PageContainer>
      <PageHeader title="Lên lớp và chuyển lớp" description="Đại diện lớp đề xuất; trưởng ngành duyệt và hệ thống cập nhật ghi danh trong một giao dịch." />
      <PromotionBoard roster={data.roster} targets={data.targets} />
    </PageContainer>
  );
}

