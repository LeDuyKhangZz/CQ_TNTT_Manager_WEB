import { DataTable } from "@/components/ui/data-table";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { ThemeScope } from "@/components/theme/theme-scope";
import { formatDateVi, todayVi } from "@/lib/dates";
import { FALLBACK_THEME_KEY, themeKeyFromSectorCode } from "@/lib/theme/sector-palette";
import {
  classStatusBadgeVariant,
  classStatusLabel,
  needsStatusBadge,
  semester1Notice,
} from "@/features/classes/class-status";
import { getClassesPageData, type ClassCard } from "@/features/classes/server/queries";

/** Keep each branch's theme while making class counts and assignments comparable. */
function ClassDirectory({ items, label }: { items: ClassCard[]; label: string }) {
  return (
    <DataTable caption={label} hideCaption density="compact" rows={items}
      getRowKey={(item) => item.id} rowHref={(item) => `/classes/${item.id}`} rowActionLabel="Xem lớp học"
      minWidth="640px" mobileRow={{ titleKey: "class", trailingKey: "count", metaKeys: ["representative", "staff"] }}
      columns={[
        { key: "class", header: "Lớp", cell: (item) => <div className="flex flex-wrap items-center gap-2"><span className="font-semibold text-ink">{item.displayName}</span>{needsStatusBadge(item.status) ? <Badge variant={classStatusBadgeVariant(item.status)}>{classStatusLabel(item.status)}</Badge> : null}</div> },
        { key: "count", header: "Sĩ số", numeric: true, cell: (item) => <><span className="text-xs text-ink-muted md:hidden">Sĩ số: </span>{item.studentCount}{item.pausedCount > 0 ? <span className="block text-xs text-ink-muted">{item.pausedCount} tạm nghỉ</span> : null}</> },
        { key: "representative", header: "GLV đại diện", cell: (item) => item.representative },
        { key: "staff", header: "GLV/Dự trưởng", numeric: true, cell: (item) => item.staffCount },
      ]}
    />
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
            <p className="text-sm text-ink-muted">
              Chưa có năm học hiện hành. Vào trang Quản trị để đặt năm học hiện hành và sinh lớp mặc định.
            </p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  // D-115 — chủ dự án chốt 2026-07-25: qua mốc kết thúc học kỳ 1 thì hệ thống **chỉ
  // cảnh báo**, KHÔNG tự đóng lớp Dự trưởng. Theo nguyên tắc "không tự động quyết
  // định mục vụ thay người phụ trách" (`docs/03` §1).
  const traineeNotice = semester1Notice(year.semester_1_end_date, todayVi(), formatDateVi);

  return (
    <PageContainer data-density="compact">
      {/* Số ngành đọc từ dữ liệu thật. Chuỗi `5 ngành` viết cứng cạnh một con số thật
          là đúng họ lỗi mà I11 đã trả ở M02-A với `/19`: ở môi trường thiếu danh mục,
          trang vẫn dõng dạc "5 ngành" trong khi không có ngành nào hiện ra. */}
      <PageHeader
        title="Lớp học"
        description={`Năm học ${year.code} · ${sectors.length} ngành${trainees.length > 0 ? " và lớp Dự trưởng" : ""}.`}
      />
      <div className="space-y-4">
        {sectors.map((sector) => (
          <section key={sector.sectorId} className="space-y-2">
            <div className="flex items-center gap-2">
              <ThemeScope themeKey={themeKeyFromSectorCode(sector.code)}>
                <h2 className="rounded-sm bg-theme-tint px-2 py-1 text-sm font-semibold text-theme-accent-text">{sector.name}</h2>
              </ThemeScope>
              <span className="text-sm text-ink-muted">{sector.classes.length} lớp</span>
            </div>
            <ThemeScope
              themeKey={themeKeyFromSectorCode(sector.code)}
              className="overflow-hidden rounded-md border border-line bg-surface"
            >
              <ClassDirectory items={sector.classes} label={`Lớp ngành ${sector.name}`} />
            </ThemeScope>
          </section>
        ))}

        {trainees.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">Dự trưởng</h2>
              <Badge variant="warning">Học kỳ 1</Badge>
            </div>
            {traineeNotice ? (
              <Alert tone="warning" title={traineeNotice.title}>
                {traineeNotice.detail}
              </Alert>
            ) : null}
            {/* Lớp Dự trưởng không thuộc ngành nào (`grade_level_id IS NULL`) nên lấy
                theme mặc định Huynh Trưởng — đúng nhánh dự phòng của 10 §3. */}
            <ThemeScope
              themeKey={FALLBACK_THEME_KEY}
              className="overflow-hidden rounded-md border border-line bg-surface"
            >
              <ClassDirectory items={trainees} label="Lớp Dự trưởng" />
            </ThemeScope>
          </section>
        ) : null}

        {sectors.length === 0 && trainees.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Chưa có lớp</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-ink-muted">
                Năm học này chưa có lớp. Dùng chức năng “Sinh lớp mặc định” trong trang Quản trị.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </PageContainer>
  );
}
