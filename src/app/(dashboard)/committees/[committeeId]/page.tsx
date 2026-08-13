import { notFound } from "next/navigation";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { CommitteeWorkspace } from "@/features/committees/components/committee-workspace";
import { getCommitteeDetail } from "@/features/committees/server/queries";
import { EquipmentBoard } from "@/features/equipment/components/equipment-board";
import { getEquipmentBoard } from "@/features/equipment/server/queries";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CommitteeDetailPage({
  params,
}: {
  params: Promise<{ committeeId: string }>;
}) {
  const { committeeId } = await params;
  // UUID sai định dạng phải là 404, không phải lỗi 500 (AGENTS §5).
  if (!UUID_PATTERN.test(committeeId)) notFound();

  const detail = await getCommitteeDetail(committeeId);
  if (!detail) notFound();

  // Ban Kỹ thuật: thành viên Ban mượn/trả được, Trưởng/Phó ban sửa danh mục.
  // TB-M09-06: bảng kho đi vào tab "Thiết bị" của vỏ nội dung, dựng sẵn ở máy chủ
  // rồi truyền xuống như một `ReactNode` (cùng khuôn với vỏ ứng dụng ở M14-C).
  const equipment = detail.committee.managesEquipment ? await getEquipmentBoard(committeeId) : null;
  const canOperateEquipment = detail.committee.myPosition !== null || detail.canManageMembers;

  return (
    <PageContainer>
      <PageHeader
        title={detail.committee.name}
        description={detail.committee.description ?? undefined}
        backHref="/committees"
        backLabel="Danh sách Ban"
      />
      <CommitteeWorkspace
        detail={detail}
        equipmentSlot={
          equipment ? (
            <EquipmentBoard
              committeeId={committeeId}
              board={equipment}
              canManageCatalog={detail.canWriteContent}
              canOperate={canOperateEquipment}
            />
          ) : null
        }
      />
    </PageContainer>
  );
}
