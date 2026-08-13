import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AbsenceRequestPanel } from "@/features/absence-requests/components/absence-request-panel";
import { ChildrenLinks } from "@/features/portal/components/children-links";
import { getAbsenceRequestsPageData } from "@/features/portal/server/queries";

export default async function AbsenceRequestsPage() {
  const { context, children, status, requests } = await getAbsenceRequestsPageData();

  return (
    <PageContainer>
      <PageHeader
        title="Đơn xin nghỉ"
        description="Báo trước cho giáo lý viên khi con không đến được. Đơn là lời báo, giáo lý viên vẫn là người điểm danh."
      />
      {/* M14 A-07 — đường vào hồ sơ từng con. Chỉ hiện khi có con: trường hợp
          tài khoản chưa gắn hồ sơ đã được thẻ "Gửi đơn mới" bên dưới nói rồi,
          và nói hai lần cùng một điều trên một màn hình chỉ làm rối. Trang chủ
          mới là nơi giải thích trường hợp đó bằng trạng thái rỗng đầy đủ. */}
      {children.length > 0 ? (
        <div className="mb-5">
          <ChildrenLinks students={children} status={status} />
        </div>
      ) : null}
      <AbsenceRequestPanel
        students={children}
        requests={requests}
        childrenStatus={status}
        audience={context.audience}
      />
    </PageContainer>
  );
}
