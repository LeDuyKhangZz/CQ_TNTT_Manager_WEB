import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        <div className="space-y-6">
          {data.portal.length > 0 ? <section className="space-y-3"><h2 className="text-lg font-semibold">Kết quả của con</h2><PublishedResultsPortal results={data.portal} status={data.portalStatus} audience={data.audience} yearCode={data.year.code} /></section> : null}
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Bảng điểm phụ trách</h2>
            {data.classes.length === 0 ? <Card><CardContent className="pt-6 text-sm text-muted-foreground">Bạn chưa có lớp nào trong phạm vi kết quả.</CardContent></Card> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{data.classes.map((item) => (
            <Link key={item.id} href={`/results/${item.id}`} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <Card className="h-full transition-colors hover:border-primary">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3"><CardTitle>{item.displayName}</CardTitle><Badge variant={item.isLocked ? "warning" : "success"}>{item.isLocked ? "Đã khóa" : "Đang mở"}</Badge></div>
                  <CardDescription>{item.assessmentCount} cột điểm</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">{item.canGrade ? "Có quyền nhập điểm" : "Chỉ xem"}</CardContent>
              </Card>
            </Link>
          ))}</div>}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
