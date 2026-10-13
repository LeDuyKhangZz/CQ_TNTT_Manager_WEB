import { TabNav } from "@/components/ui/tab-nav";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { TeachingPlanEditor } from "@/features/teaching-plans/components/teaching-plan-editor";
import { getTeachingPlanDetail } from "@/features/teaching-plans/server/queries";

export default async function TeachingPlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>;
  searchParams: Promise<{ view?: string }>;
}) {
  const [{ classId }, query] = await Promise.all([params, searchParams]);
  const detail = await getTeachingPlanDetail(classId);
  if (!detail) notFound();
  const view = query.view === "calendar" ? "calendar" : "list";

  return (
    <PageContainer>
      <PageHeader
        title={`Giáo án ${detail.className}`}
        description={`Năm học ${detail.academicYearCode} · ${detail.canManage ? "Có quyền chỉnh sửa" : "Chỉ xem"}`}
        backHref="/teaching-plan"
        backLabel="Danh sách lớp"
      />
      <TabNav label="Kiểu hiển thị" activeKey={view} className="mb-5" items={[
        {key:"list", label:"Danh sách", href:`/teaching-plan/${classId}?view=list`},
        {key:"calendar", label:"Theo tháng", href:`/teaching-plan/${classId}?view=calendar`},
      ]} />
      <TeachingPlanEditor detail={detail} view={view} />
    </PageContainer>
  );
}
