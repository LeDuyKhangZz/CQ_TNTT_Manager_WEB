import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PortalChild } from "../server/queries";
import type { PortalChildrenStatus } from "../status";
import { PortalEmptyState } from "./portal-empty-state";

/**
 * Đường vào hồ sơ từng con — M14 A-07, khuyến nghị B4.1.
 *
 * M14 đã nối route chi tiết vào dashboard và mục "Con của tôi". M13-A hoàn
 * thiện hành vi D-64 (một con đi thẳng, nhiều con mới hiện danh sách) và D-25
 * (nhân sự đồng thời là phụ huynh vẫn tới được cổng).
 */
export function ChildrenLinks({
  students,
  status,
  /**
   * Tắt tiêu đề thẻ khi khối này là **nội dung chính** của trang — trang
   * `/parent/children` đã có `<h1>Con của tôi</h1>`, in lại nguyên văn ở đây là
   * hai heading trùng chữ trên một trang (AC-D5).
   */
  hideHeading = false,
}: {
  students: readonly PortalChild[];
  status: PortalChildrenStatus;
  hideHeading?: boolean;
}) {
  if (students.length === 0) {
    return (
      <PortalEmptyState
        reason={status === "no_children" ? "no_children" : "not_linked"}
        audience="guardian"
      />
    );
  }

  return (
    <Card>
      {hideHeading ? null : (
        <CardHeader>
          <CardTitle as="h2">Con của tôi</CardTitle>
          <CardDescription>Mở hồ sơ để xem điểm danh Thánh lễ và Giáo lý của từng em.</CardDescription>
        </CardHeader>
      )}
      <CardContent className={hideHeading ? "pt-4 sm:pt-5" : undefined}>
        <ul className="divide-y divide-line">
          {students.map((child) => (
            <li key={child.id}>
              {/* `min-h-11`: hàng này là vùng chạm thật trên máy 360px (AGENTS §8). */}
              <Link
                href={`/parent/children/${child.id}`}
                className="flex min-h-11 items-center justify-between gap-3 rounded-md px-2 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
              >
                <span className="min-w-0 truncate">{child.label}</span>
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
