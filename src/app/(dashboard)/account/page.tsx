import Link from "next/link";
import { KeyRound } from "lucide-react";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentAcademicYear } from "@/features/academic-years/server/queries";
import { getAccountScopeLabel } from "@/features/auth/server/queries";
import { getOwnStaffContact } from "@/features/staff/server/queries";
import { OwnContactForm } from "@/features/staff/components/own-contact-form";
import { requireRouteAccess } from "@/lib/auth/guards";
import { ROLE_LABELS } from "@/lib/permissions/roles";
import { cn } from "@/lib/utils";

/**
 * Trang Tài khoản — M14 A-10, khuyến nghị B3.1.
 *
 * Trước đây là trang giữ chỗ (`shared/protected-module-placeholder`) in câu
 * *"sẽ được triển khai ở Phase 1"* trong khi dự án đã ở Phase 7 — và nó là **ô
 * thứ 5 của mọi preset thanh dưới**, tức mọi người dùng, mọi vai trò, mọi thiết
 * bị đều chạm vào một trang trống. Đây là trang production **cuối cùng** còn
 * dùng trang giữ chỗ, nên AC-C6 nay đạt.
 *
 * Cố ý viết tên component ở dạng đường dẫn tệp: AC-C6 nghiệm thu bằng `grep`
 * trên `src/app/`, một chú thích cũng làm kết quả khác 0 — đúng bài học của
 * AC-B1 với chuỗi "P0-T3".
 *
 * Mức tối thiểu đã chốt với chủ dự án 2026-07-23: danh tính · vai trò · năm học
 * · đổi mật khẩu · đăng xuất. **Không truy vấn mới ngoài năm học**: mọi thứ còn
 * lại đã nằm sẵn trong phiên đăng nhập. Phần sâu hơn (ảnh đại diện, tuỳ chọn
 * hiển thị) thuộc module M01.
 */

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-line py-3 last:border-b-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className="text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

export default async function AccountPage() {
  const context = await requireRouteAccess("/account");
  const [academicYear, scopeLabel, ownContact] = await Promise.all([
    getCurrentAcademicYear(),
    getAccountScopeLabel(context),
    // IMP-BULK-002 — `null` cho tài khoản không gắn hồ sơ nhân sự (phụ huynh,
    // thiếu nhi): khối bổ sung bên dưới biến mất hẳn thay vì hiện một biểu mẫu
    // không lưu được vào đâu.
    getOwnStaffContact(),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Tài khoản"
        description="Thông tin đăng nhập của bạn và hai thao tác cần dùng nhất."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Thông tin đăng nhập</CardTitle>
            <CardDescription>
              Cần đổi họ tên hoặc vai trò thì liên hệ Ban quản trị Xứ đoàn — bạn không tự sửa được.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl>
              <Field label="Họ và tên" value={context.displayName} />
              <Field label="Tên đăng nhập" value={context.username} />
              <Field
                label="Vai trò"
                value={context.role ? ROLE_LABELS[context.role] : "Chưa được gán vai trò"}
              />
              {scopeLabel ? <Field label="Phạm vi" value={scopeLabel} /> : null}
              <Field
                label="Năm học đang làm việc"
                value={academicYear ? academicYear.name : "Chưa đặt năm học"}
              />
              <Field
                label="Mật khẩu"
                value={
                  context.mustChangePassword
                    ? "Cần đổi ở lần đăng nhập tới"
                    : "Đã đặt mật khẩu riêng"
                }
              />
            </dl>
          </CardContent>
        </Card>

        {ownContact ? (
          <Card>
            <CardHeader>
              <CardTitle as="h2">Thông tin liên lạc của bạn</CardTitle>
              <CardDescription>
                Đây là phần bạn tự sửa được. Hồ sơ nhập từ sổ của xứ đoàn thường còn trống một
                vài ô — điền vào đây là đủ, không cần nhờ ai.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OwnContactForm contact={ownContact} />
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle as="h2">Bảo mật</CardTitle>
            <CardDescription>
              Máy trong phòng học là máy dùng chung. Xong việc thì đăng xuất.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link
              href="/change-password?next=%2Faccount"
              className={cn(buttonVariants({ variant: "outline" }), "w-full")}
            >
              <KeyRound className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
              Đổi mật khẩu
            </Link>
            {/* Cùng một `SignOutButton` với menu tài khoản và chân thanh bên:
                đăng xuất chỉ có MỘT chỗ cài đặt (form POST + Server Action). */}
            <SignOutButton variant="panel" className="w-full" />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
