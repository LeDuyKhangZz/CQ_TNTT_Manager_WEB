import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { redirect } from "next/navigation";
import { ChildrenLinks } from "@/features/portal/components/children-links";
import { getChildrenPageData } from "@/features/portal/server/queries";

/**
 * Danh sách con — M14 A-08, đích của mục điều hướng "Con của tôi".
 *
 * `docs/06` §5 đòi mục này ở vị trí thứ 2 của thanh dưới cho phụ huynh ngay từ
 * đầu dự án, nhưng cả mục lẫn trang đều chưa từng tồn tại; hệ quả là
 * `/parent/children/<id>` sống bảy phase mà không có đường vào (M14 A-07).
 */
export default async function ParentChildrenPage() {
  const { children, status } = await getChildrenPageData();

  // D-64: một con thì không bắt phụ huynh đi qua một màn hình chỉ có đúng
  // một lựa chọn. Nhiều con mới ở lại danh sách để chọn.
  if (children.length === 1) {
    redirect(`/parent/children/${children[0].id}`);
  }

  return (
    <PageContainer>
      <PageHeader
        title="Con của tôi"
        description="Chọn một em để xem điểm danh Thánh lễ và Giáo lý."
      />
      <ChildrenLinks students={children} status={status} hideHeading />
    </PageContainer>
  );
}
