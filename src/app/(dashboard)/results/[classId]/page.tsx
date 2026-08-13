import Link from "next/link";
import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { GradebookEditor } from "@/features/assessments/components/gradebook-editor";
import { getGradebookDetail } from "@/features/assessments/server/queries";

export default async function GradebookPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const detail = await getGradebookDetail(classId);
  if (!detail) notFound();
  return (
    <PageContainer>
      <PageHeader
        title={`Bảng điểm ${detail.className}`}
        description={`Năm học ${detail.academicYearCode} · ${detail.canGrade ? "Có quyền nhập điểm" : "Chỉ xem"}`}
        action={
          /*
            Nợ #20 — **chỗ cuối cùng** của món nợ này trong toàn hệ thống. Link cũ
            cao **18px**, chưa bằng nửa ngưỡng chạm 44px của `11` §5.
            `inline-flex min-h-11` + margin âm để không đẩy phần đầu trang cao
            thêm, đúng khuôn `students/[studentId]` · `attendance/[sessionId]` ·
            `teaching-plan/[classId]`. Bài E2E đo bằng `boundingBox()` — **chiều
            cao thật đã dựng**, không kiểm tên lớp CSS: một chuỗi `min-h-11` viết
            đúng vẫn có thể bị lớp khác đè, và bài kiểm tên lớp sẽ xanh giả.
          */
          <Link
            href="/results"
            className="-my-3 inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← Danh sách lớp
          </Link>
        }
      />
      <GradebookEditor detail={detail} />
    </PageContainer>
  );
}
