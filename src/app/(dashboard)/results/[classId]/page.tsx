import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { EntityHeader } from "@/components/layout/entity-header";
import { GradebookEditor } from "@/features/assessments/components/gradebook-editor";
import { getGradebookDetail } from "@/features/assessments/server/queries";

export default async function GradebookPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const detail = await getGradebookDetail(classId);
  if (!detail) notFound();
  return (
    <PageContainer className="detail-workspace">
      <EntityHeader
        title={`Bảng điểm ${detail.className}`}
        description={`Năm học ${detail.academicYearCode} · ${detail.canGrade ? "Có quyền nhập điểm" : "Chỉ xem"}`}
        backHref="/results"
        backLabel="Danh sách lớp"
      />
      <GradebookEditor detail={detail} />
    </PageContainer>
  );
}
