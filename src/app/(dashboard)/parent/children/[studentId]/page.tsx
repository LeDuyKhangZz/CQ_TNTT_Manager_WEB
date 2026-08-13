import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { buttonVariants } from "@/components/ui/button";
import { AttendanceHistory } from "@/features/portal/components/attendance-history";
import { getChildAttendancePageData } from "@/features/portal/server/queries";
import { cn } from "@/lib/utils";

export default async function ParentChildPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const { context, student, status, yearCode, summary, rows } = await getChildAttendancePageData(studentId);
  // RLS đã lọc; không đọc được nghĩa là không phải con mình — trả 404 chứ không
  // báo "không có quyền", để không lộ sự tồn tại của hồ sơ (AGENTS §5).
  if (!student) notFound();

  return (
    <PageContainer>
      <PageHeader
        title={student.label}
        description="Điểm danh Thánh lễ và Giáo lý của con."
        // AC-B6 — đường lùi về trang cha, vùng chạm 44px. Đợt B mới nối được
        // đường VÀO trang này; đợt C thêm đường RA đúng chuẩn.
        backHref="/parent/children"
        backLabel="Con của tôi"
        action={
          <Link
            href="/parent/absence-requests"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Đơn xin nghỉ
          </Link>
        }
      />
      <AttendanceHistory
        summary={summary}
        rows={rows}
        status={status}
        audience={context.audience}
        yearCode={yearCode}
      />
    </PageContainer>
  );
}
