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
        action={
          /*
            Nợ #20 — link cũ cao **18px**, chưa bằng nửa ngưỡng chạm 44px của
            `11` §5. `inline-flex min-h-11` + margin âm để không đẩy phần đầu
            trang cao thêm, đúng khuôn `students/[studentId]` và
            `attendance/[sessionId]`. Có bài E2E **đo bằng `boundingBox()`** —
            đo chiều cao ĐÃ DỰNG, không kiểm tên lớp CSS.
          */
          <Link
            href="/teaching-plan"
            className="-my-3 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Danh sách lớp
          </Link>
        }
      />
      {/*
        UI-04 — `aria-label` trên một `<div>` trần không được trình đọc màn hình
        công bố; và mục đang chọn chỉ khác nhau ở **màu nút**, tức màu là tín
        hiệu duy nhất (điều cấm thứ 5 của `11` §5). Nay là `role="group"` có tên
        và `aria-current="page"` trên mục đang xem.
      */}
      <div className="mb-5 flex gap-2" role="group" aria-label="Kiểu hiển thị">
        <Link href={`/teaching-plan/${classId}?view=list`} aria-current={view === "list" ? "page" : undefined} className={cn(buttonVariants({ variant: view === "list" ? "primary" : "outline", size: "sm" }))}>Danh sách</Link>
        <Link href={`/teaching-plan/${classId}?view=calendar`} aria-current={view === "calendar" ? "page" : undefined} className={cn(buttonVariants({ variant: view === "calendar" ? "primary" : "outline", size: "sm" }))}>Theo tháng</Link>
      </div>
      <TeachingPlanEditor detail={detail} view={view} />
    </PageContainer>
  );
}
