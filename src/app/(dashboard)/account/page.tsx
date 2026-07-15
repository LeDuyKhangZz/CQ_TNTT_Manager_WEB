import { ProtectedModulePlaceholder } from "@/components/shared/protected-module-placeholder";

export default function AccountPage() {
  return <ProtectedModulePlaceholder route="/account" title="Tài khoản" description="Thông tin cá nhân và các thiết lập tài khoản." phase="Phase 1" />;
}
