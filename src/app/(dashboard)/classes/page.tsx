import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { getClassesPageData, type ClassCard } from "@/features/classes/server/queries";

function ClassCardLink({ item }: { item: ClassCard }) {
  return (
    <Link
      href={`/classes/${item.id}`}
      className="block rounded-lg border border-border p-4 transition-colors hover:border-primary/50 hover:bg-accent/40"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{item.displayName}</p>
        {item.sectionCode ? <Badge variant="outline">{item.sectionCode}</Badge> : null}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Sĩ số: {item.studentCount}</p>
      <p className="text-sm text-muted-foreground">GLV đại diện: {item.representative}</p>
      <p className="text-sm text-muted-foreground">Số GLV/Dự trưởng: {item.staffCount}</p>
    </Link>
  );
}

export default async function ClassesPage() {
  const { year, sectors, trainees } = await getClassesPageData();

  if (!year) {
    return (
      <PageContainer>
        <PageHeader title="Lớp học" description="Danh sách lớp giáo lý theo năm học và ngành." />
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Chưa có năm học hiện hành. Vào trang Quản trị để đặt năm học hiện hành và sinh lớp mặc định.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="Lớp học" description={`Năm học ${year.code} · 5 ngành và lớp Dự trưởng.`} />
      <div className="space-y-6">
        {sectors.map((sector) => (
          <section key={sector.sectorId} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{sector.name}</h3>
              <Badge variant="secondary">{sector.classes.length} lớp</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {sector.classes.map((item) => (
                <ClassCardLink key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}

        {trainees.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Dự trưởng</h3>
              <Badge variant="warning">Học kỳ 1</Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {trainees.map((item) => (
                <ClassCardLink key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : null}

        {sectors.length === 0 && trainees.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Chưa có lớp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Năm học này chưa có lớp. Dùng chức năng “Sinh lớp mặc định” trong trang Quản trị.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageContainer>
  );
}
