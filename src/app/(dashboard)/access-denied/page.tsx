import { PageContainer } from "@/components/layout/page-container";
import { PermissionDenied } from "@/components/shared/permission-denied";
import { requireAuthContext } from "@/lib/auth/guards";
import { ROLE_LABELS } from "@/lib/permissions/roles";

export default async function AccessDeniedPage() {
  // `requireAuthContext` chứ không phải `requireRouteAccess`: đây là trang mà
  // người **vừa bị từ chối** được đưa tới, nên nó chỉ hỏi "đã đăng nhập chưa"
  // (AC-A1 nêu đúng ngoại lệ này). `getAuthContext` đã `cache()` theo request
  // nên lần gọi này không thêm truy vấn nào so với layout.
  const context = await requireAuthContext("/access-denied");
  return (
    <PageContainer>
      <PermissionDenied
        roleLabel={context.role ? ROLE_LABELS[context.role] : "Chưa được gán vai trò"}
      />
    </PageContainer>
  );
}
