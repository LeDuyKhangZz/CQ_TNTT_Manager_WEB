import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ReportWorkbench } from "@/features/reports/components/report-workbench";
import { invalidFilterMessage, parseReportFilter } from "@/features/reports/filters";
import { getReportsPageData, reportsRouteContext } from "@/features/reports/server/queries";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await reportsRouteContext();
  // Bộ lọc nằm trên URL: link tải Excel/PDF dùng lại chính chuỗi query này nên
  // file tải về luôn khớp bản đang xem (D-52). Tham số hỏng thì rơi về phạm vi
  // của CHÍNH người đăng nhập, không rơi về "toàn xứ đoàn" (TB-04/TB-05).
  const { filter, invalidKeys } = parseReportFilter(await searchParams, context);
  const data = await getReportsPageData(filter, context);
  return (
    <PageContainer>
      <PageHeader
        title="Báo cáo"
        description="Xem theo tuần, tháng hoặc năm học; xuất Excel/PDF và chốt bản không đổi để lưu 5 năm."
      />
      <ReportWorkbench data={data} filterWarning={invalidFilterMessage(invalidKeys)} />
    </PageContainer>
  );
}
