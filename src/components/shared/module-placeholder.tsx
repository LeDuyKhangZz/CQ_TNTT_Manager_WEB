import { EmptyState } from "./empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export function ModulePlaceholder({ title, description, phase }: { title: string; description: string; phase: string }) {
  return (
    <PageContainer>
      <PageHeader title={title} description={description} />
      <EmptyState title="Nền giao diện đã sẵn sàng" description={`Dữ liệu và nghiệp vụ của mục này sẽ được triển khai ở ${phase}.`} />
    </PageContainer>
  );
}
