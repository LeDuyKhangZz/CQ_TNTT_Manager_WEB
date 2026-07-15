import { ProtectedModulePlaceholder } from "@/components/shared/protected-module-placeholder";

export default function DashboardPage() {
  return <ProtectedModulePlaceholder route="/dashboard" title="Tổng quan" description="Thông tin nổi bật của năm học hiện tại sẽ xuất hiện tại đây." phase="các phase nghiệp vụ tiếp theo" />;
}
