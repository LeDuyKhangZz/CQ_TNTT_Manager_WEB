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
        action={<Link href="/results" className="text-sm text-muted-foreground hover:text-foreground">← Danh sách lớp</Link>}
      />
      <GradebookEditor detail={detail} />
    </PageContainer>
  );
}
