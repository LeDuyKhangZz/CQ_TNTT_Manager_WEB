import { ProtectedModulePlaceholder } from "@/components/shared/protected-module-placeholder";

export default function AttendancePage() {
  return <ProtectedModulePlaceholder route="/attendance" title="Điểm danh" description="Điểm danh Thánh lễ và Giáo lý theo từng buổi." phase="Phase 3" />;
}
