import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { getResultsPageData } from "@/features/assessments/server/queries";
import { PublishedResultsPortal } from "@/features/assessments/components/published-results-portal";
import { PortalEmptyState } from "@/features/portal/components/portal-empty-state";

export default async function ResultsPage() {
  const data = await getResultsPageData();
  return (
    <PageContainer
      data-density={data.audience === "guardian" || data.audience === "student" ? "comfortable" : undefined}
    >
      <PageHeader title="Kết quả học tập" description={data.year ? `Bảng điểm năm học ${data.year.code}` : "Bảng điểm và đánh giá theo lớp"} />
      {!data.year ? (
        <PortalEmptyState
          reason="no_data"
          audience={data.audience}
          title="Chưa có năm học hiện hành"
          description="Xứ đoàn chưa thiết lập năm học hiện hành nên chưa thể hiển thị kết quả học tập."
        />
      ) : data.audience === "guardian" || data.audience === "student" ? (
        <PublishedResultsPortal
          results={data.portal}
          status={data.portalStatus}
          audience={data.audience}
          yearCode={data.year.code}
        />
      ) : (
        <div className="space-y-4">
          {data.portal.length > 0 ? <section className="space-y-3"><h2 className="text-lg font-semibold">Kết quả của con</h2><PublishedResultsPortal results={data.portal} status={data.portalStatus} audience={data.audience} yearCode={data.year.code} /></section> : null}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Bảng điểm phụ trách</h2>
            {data.classes.length === 0 ? <Card><CardContent className="pt-4 text-sm text-ink-muted">Bạn chưa có lớp nào trong phạm vi kết quả.</CardContent></Card> : (
              <DataTable
                caption={`Bảng điểm phụ trách · năm học ${data.year.code}`}
                hideCaption
                density="compact"
                rows={data.classes}
                rowHref={(item) => `/results/${item.id}`}
                getRowKey={(item) => item.id}
                minWidth="560px"
                mobileRow={{ titleKey: "class", trailingKey: "status", metaKeys: ["assessments", "access"] }}
                columns={[
                  { key: "class", header: "Lớp", cell: (item) => <span className="font-semibold text-ink">{item.displayName}</span> },
                  { key: "assessments", header: "Cột điểm", numeric: true, cell: (item) => item.assessmentCount },
                  { key: "status", header: "Trạng thái", cell: (item) => <Badge variant={item.isLocked ? "secondary" : "outline"}>{item.isLocked ? "Đã khóa" : "Đang mở"}</Badge> },
                  { key: "access", header: "Quyền thao tác", cell: (item) => <span className="text-ink-muted">{item.canGrade ? "Có quyền nhập điểm" : "Chỉ xem"}</span> },
                ]}
              />
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
