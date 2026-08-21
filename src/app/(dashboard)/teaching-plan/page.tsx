import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { WeekAheadSchedule } from "@/features/teaching-plans/components/week-ahead-schedule";
import { getTeachingPlanPageData, getWeekAheadTeachingData } from "@/features/teaching-plans/server/queries";

export default async function TeachingPlanPage() {
  const [data, weekAhead] = await Promise.all([getTeachingPlanPageData(), getWeekAheadTeachingData()]);
  const isPortal = data.audience === "guardian" || data.audience === "student";

  return (
    <PageContainer data-density={isPortal ? "comfortable" : undefined}>
      {/*
        TB-M06-05 — cổng phụ huynh/thiếu nhi dùng CHUNG địa chỉ này cho lịch 7
        ngày, nên tiêu đề *"Kế hoạch giảng dạy năm học 2026-2027"* hứa một thứ
        họ không bao giờ thấy: khối "Giáo án theo lớp" bên dưới chỉ dựng cho
        nhân sự.
      */}
      <PageHeader
        title="Giáo án"
        description={
          isPortal
            ? data.audience === "student"
              ? "Lịch học 7 ngày tới của em"
              : "Lịch học 7 ngày tới của con"
            : data.year
              ? `Kế hoạch giảng dạy năm học ${data.year.code}`
              : "Kế hoạch giảng dạy theo lớp"
        }
      />
      <WeekAheadSchedule data={weekAhead} />
      {isPortal ? null : !data.year ? (
        <Card className="mt-5"><CardContent className="pt-6 text-sm text-ink-muted">Chưa có năm học hiện hành.</CardContent></Card>
      ) : data.classes.length === 0 ? (
        /*
          TB-08 — trước đợt này nhánh này trả thẳng `null`: **đúng một khoảng
          trắng** dưới thẻ "7 ngày sắp tới", không một chữ nào nói vì sao, không
          phân biệt được với một trang hỏng.

          🔴 **Câu chữ ở đây KHÔNG theo nguyên văn tài liệu, và đó là chủ ý.**
          `03_AUDIT_RESULTS` §C12 và `08_ACCEPTANCE_CRITERIA` TB-08 mô tả nhánh
          này là *"staff không phụ trách lớp nào"* và đề nghị câu *"Bạn chưa
          được phân công lớp nào có giáo án."* Đọc mã thì tiền đề ấy không đúng:
          policy `classes_select_scope` cho **mọi** nhân sự đọc **mọi** lớp
          (chỉ phụ huynh/thiếu nhi mới bị thu hẹp — D-70), nên một Giáo lý viên
          không phụ trách lớp nào vẫn thấy đủ 19 thẻ lớp với nhãn "Chỉ xem".
          Nhánh rỗng này chỉ chạy khi **năm học chưa có lớp nào đang hoạt động**.
          Viết đúng câu của tài liệu ở đây là dựng một lời giải thích sai cho
          một tình huống khác hẳn — người đọc sẽ đi tìm Ban điều hành để hỏi về
          phân công, trong khi việc phải làm là sinh danh sách lớp.
        */
        <EmptyState
          className="mt-5"
          title="Năm học chưa có lớp nào đang hoạt động"
          description={`Năm học ${data.year.code} chưa có lớp nào ở trạng thái đang hoạt động, nên chưa có giáo án nào để mở. Hãy sinh danh sách lớp ở trang Cấu trúc học vụ trước.`}
        />
      ) : (
        <section className="mt-7 space-y-4">
          <h2 className="text-xl font-semibold">Giáo án theo lớp</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.classes.map((item) => (
              <Link key={item.id} href={`/teaching-plan/${item.id}`} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-ring focus-visible:ring-offset-2">
                <Card className="h-full transition-colors hover:border-theme-primary">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3"><CardTitle>{item.displayName}</CardTitle><Badge variant={item.planId ? "success" : "secondary"}>{item.planId ? `${item.itemCount} mục` : "Chưa tạo"}</Badge></div>
                    <CardDescription>{item.planTitle ?? "Chưa có kế hoạch giảng dạy"}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-sm text-ink-muted">{item.canManage ? "Bạn có quyền chỉnh sửa" : "Chỉ xem"}</CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
}
