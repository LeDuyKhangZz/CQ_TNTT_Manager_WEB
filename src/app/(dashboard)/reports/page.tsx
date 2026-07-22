import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ReportWorkbench } from "@/features/reports/components/report-workbench";
import { parseReportFilter } from "@/features/reports/filters";
import { getReportsPageData } from "@/features/reports/server/queries";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Bộ lọc nằm trên URL: link tải Excel/PDF dùng lại chính chuỗi query này nên
  // file tải về luôn khớp bản đang xem (D-52).
  const filter = parseReportFilter(await searchParams);
  const data = await getReportsPageData(filter);
  return (
    <PageContainer>
      <PageHeader
        title="Báo cáo"
        description="Xem theo tuần, tháng hoặc năm học; xuất Excel/PDF và chốt bản không đổi để lưu 5 năm."
      />
      <ReportWorkbench data={data} />
    </PageContainer>
  );
}
