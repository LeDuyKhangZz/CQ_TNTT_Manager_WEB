import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { WeekAheadSchedule } from "@/features/teaching-plans/components/week-ahead-schedule";
import { getTeachingPlanPageData, getWeekAheadTeachingData } from "@/features/teaching-plans/server/queries";

export default async function TeachingPlanPage() {
  const [data, weekAhead] = await Promise.all([getTeachingPlanPageData(), getWeekAheadTeachingData()]);
  return (
    <PageContainer>
      <PageHeader title="Giáo án" description={data.year ? `Kế hoạch giảng dạy năm học ${data.year.code}` : "Kế hoạch giảng dạy theo lớp"} />
      <WeekAheadSchedule data={weekAhead} />
      {!data.year ? (
        <Card className="mt-5"><CardContent className="pt-6 text-sm text-muted-foreground">Chưa có năm học hiện hành.</CardContent></Card>
      ) : data.classes.length === 0 ? (
        null
      ) : (
        <section className="mt-7 space-y-4">
          <h2 className="text-xl font-semibold">Giáo án theo lớp</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.classes.map((item) => (
              <Link key={item.id} href={`/teaching-plan/${item.id}`} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                <Card className="h-full transition-colors hover:border-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3"><CardTitle>{item.displayName}</CardTitle><Badge variant={item.planId ? "success" : "secondary"}>{item.planId ? `${item.itemCount} mục` : "Chưa tạo"}</Badge></div>
                    <CardDescription>{item.planTitle ?? "Chưa có kế hoạch giảng dạy"}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">{item.canManage ? "Bạn có quyền chỉnh sửa" : "Chỉ xem"}</CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
