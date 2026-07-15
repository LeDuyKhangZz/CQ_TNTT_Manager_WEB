import { ProtectedModulePlaceholder } from "@/components/shared/protected-module-placeholder";

export default function StudentsPage() {
  return <ProtectedModulePlaceholder route="/students" title="Thiếu nhi" description="Quản lý hồ sơ và theo dõi hành trình của các em." phase="Phase 2" />;
}
