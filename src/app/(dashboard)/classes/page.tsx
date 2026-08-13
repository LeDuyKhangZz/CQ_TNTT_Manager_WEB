import Link from "next/link";
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

/**
 * Thẻ lớp — **09 §4.4 #10**: nền `theme-soft`, viền `theme-pastel-deep`. Màu ngành
 * do `ThemeScope` bọc ngoài từng nhóm ngành bơm vào, đúng cách `theme-scope.tsx`
 * đã dự tính từ Đợt 0-UI ("trang `/classes` … mỗi thẻ tự bọc `ThemeScope` của
 * ngành mình").
 *
 * 🔴 **Đây cũng là chỗ trả nợ #5** — bản cũ dùng `hover:border-primary/50
 * hover:bg-accent/40`. Bổ ngữ độ mờ trên một token là `var()` trần thì Tailwind
 * **bỏ luôn cả lớp**: hai lớp đó **không tồn tại trong CSS xuất ra**, nên thẻ lớp
 * từ trước tới nay **không có hiệu ứng hover nào** — hỏng im lặng, không ai thấy.
 *
 * Chữ trên nền pastel theo đúng bảng bắt buộc 09 §4.3: `soft`/`pastel` chỉ đi với
 * `--text` (đo được ≥8,5:1). Vì vậy ba dòng phụ đổi từ `text-muted-foreground` sang
 * `text-ink` — thứ bậc thị giác chuyển sang cỡ chữ và độ đậm, không dựa vào màu
 * nhạt nữa. `--text-muted` trên nền pastel **không** có trong bảng đã đo.
 */
function ClassCardLink({ item }: { item: ClassCard }) {
  return (
    <Link
      href={`/classes/${item.id}`}
      className="block rounded-lg border border-theme-pastel-deep bg-theme-soft p-4 text-ink transition-colors duration-fast hover:bg-theme-pastel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium">{item.displayName}</p>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {/* BR-M02-N12 — huy hiệu CHỈ hiện cho lớp không `active`. Gắn cả 19 lớp thì
              huy hiệu mất giá trị báo hiệu đúng lúc cần nó nhất: một lớp bị tạm ngưng
              nằm lẫn giữa 18 lớp đang chạy. Nhãn là **chữ tiếng Việt**, không phải
              chấm màu (11 §5 — không dùng màu làm tín hiệu duy nhất). */}
          {needsStatusBadge(item.status) ? (
            <Badge variant={classStatusBadgeVariant(item.status)}>
              {classStatusLabel(item.status)}
            </Badge>
          ) : null}
          {item.sectionCode ? <Badge variant="outline">{item.sectionCode}</Badge> : null}
        </div>
      </div>
      {/* D-121 — em tạm nghỉ vẫn thuộc lớp nên vẫn nằm trong sĩ số, nhưng phải đếm
          riêng: một con số gộp nói rằng cả 28 em đang sinh hoạt. Chỉ hiện vế thứ hai
          khi thật sự có em tạm nghỉ, để 19 thẻ lớp không mang thêm một dòng "0". */}
      <p className="mt-1 text-sm">
        Sĩ số: {item.studentCount}
        {item.pausedCount > 0 ? ` · ${item.pausedCount} tạm nghỉ` : ""}
      </p>
      <p className="text-sm">GLV đại diện: {item.representative}</p>
      <p className="text-sm">Số GLV/Dự trưởng: {item.staffCount}</p>
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
    <PageContainer>
      {/* Số ngành đọc từ dữ liệu thật. Chuỗi `5 ngành` viết cứng cạnh một con số thật
          là đúng họ lỗi mà I11 đã trả ở M02-A với `/19`: ở môi trường thiếu danh mục,
          trang vẫn dõng dạc "5 ngành" trong khi không có ngành nào hiện ra. */}
      <PageHeader
        title="Lớp học"
        description={`Năm học ${year.code} · ${sectors.length} ngành${trainees.length > 0 ? " và lớp Dự trưởng" : ""}.`}
      />
      <div className="space-y-6">
        {sectors.map((sector) => (
          <section key={sector.sectorId} className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">{sector.name}</h3>
              <Badge variant="secondary">{sector.classes.length} lớp</Badge>
            </div>
            <ThemeScope
              themeKey={themeKeyFromSectorCode(sector.code)}
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {sector.classes.map((item) => (
                <ClassCardLink key={item.id} item={item} />
              ))}
            </ThemeScope>
          </section>
        ))}

        {trainees.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Dự trưởng</h3>
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
              className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            >
              {trainees.map((item) => (
                <ClassCardLink key={item.id} item={item} />
              ))}
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
