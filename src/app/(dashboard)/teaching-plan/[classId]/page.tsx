import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { TeachingPlanEditor } from "@/features/teaching-plans/components/teaching-plan-editor";
import { getTeachingPlanDetail } from "@/features/teaching-plans/server/queries";
import { cn } from "@/lib/utils";

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
        action={<Link href="/teaching-plan" className="text-sm text-muted-foreground hover:text-foreground">← Danh sách lớp</Link>}
      />
      <div className="mb-5 flex gap-2" aria-label="Kiểu hiển thị">
        <Link href={`/teaching-plan/${classId}?view=list`} className={cn(buttonVariants({ variant: view === "list" ? "primary" : "outline", size: "sm" }))}>Danh sách</Link>
        <Link href={`/teaching-plan/${classId}?view=calendar`} className={cn(buttonVariants({ variant: view === "calendar" ? "primary" : "outline", size: "sm" }))}>Theo tháng</Link>
      </div>
      <TeachingPlanEditor detail={detail} view={view} />
    </PageContainer>
  );
}
