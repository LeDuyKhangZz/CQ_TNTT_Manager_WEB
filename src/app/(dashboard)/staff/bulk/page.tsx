import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { createClient } from "@/lib/supabase/server";
import { requireRouteAccess } from "@/lib/auth/guards";
import { todayVi } from "@/lib/dates";
import { StaffBulkForm } from "@/features/staff/bulk/components/staff-bulk-form";

/**
 * Nhập hàng loạt huynh trưởng / dự trưởng — IMP-BULK-001.
 *
 * Cùng trần thời gian với `/imports`: một lượt ghi ~90 dòng là ~90 lượt `insert`
 * hồ sơ cộng ~90 lượt `insert` phân công, mỗi lượt qua RLS. Mặc định của nền
 * tảng ngắn hơn nhiều so với việc đó.
 */
export const maxDuration = 60;

export default async function StaffBulkPage() {
  await requireRouteAccess("/staff/bulk");
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("id, code, name, status")
    .in("status", ["draft", "current"])
    .order("code", { ascending: false });
  const years = data ?? [];
  const defaultYearId = years.find((year) => year.status === "current")?.id ?? years[0]?.id ?? "";

  return (
    <PageContainer>
      <PageHeader
        title="Nhập hàng loạt nhân sự"
        description="Dán danh sách huynh trưởng, dự trưởng và trợ tá để tạo hồ sơ kèm phân công lớp trong một lượt."
      />

      {years.length === 0 ? (
        <EmptyState
          variant="no-data"
          title="Chưa có năm học nào phân công được"
          description="Phân công lớp phải thuộc một năm học đang áp dụng hoặc ở trạng thái nháp. Hãy tạo năm học ở trang Quản trị trước."
          action={
            <Link
              href="/admin"
              className={buttonVariants({ variant: "outline" })}
            >
              Mở trang Quản trị
            </Link>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Dán danh sách</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffBulkForm
              years={years}
              defaultYearId={defaultYearId}
              defaultStartsOn={todayVi()}
            />
          </CardContent>
        </Card>
      )}

      <p className="text-sm text-ink-muted">
        Cần sửa từng người hoặc kết thúc một phân công cũ?{" "}
        <Link href="/staff" className="font-medium underline underline-offset-4">
          Mở trang Nhân sự
        </Link>
        .
      </p>
    </PageContainer>
  );
}
