"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/empty-state";
import { MEETING_TYPE_LABELS } from "@/features/attendance/constants";
import type { PendingAbsenceRequest } from "@/features/attendance/server/queries";
import { formatDateVi } from "@/lib/dates";
import { acknowledgeAbsenceRequest } from "../server/actions";

/**
 * TB-06 / AC-F13-1 · AC-F13-2 — màn hình Giáo lý viên cho đơn xin nghỉ.
 *
 * Trước đợt M05-B **không màn hình nào gọi** `acknowledgeAbsenceRequest`, nên
 * mọi đơn phụ huynh gửi nằm ở *"Đang chờ"* vĩnh viễn: phụ huynh gửi vào một
 * chỗ không ai trả lời, và Giáo lý viên chỉ thấy đơn **sau khi** đã mở buổi —
 * tức là sau khi đã quá muộn để nó giúp được gì.
 *
 * Phương án A của `04_TO_BE_FLOWS` §TB-06: panel ngay trên `/attendance`, không
 * dựng route riêng. Ca phổ biến nhất là *xem trước khi điểm danh*, và một route
 * riêng bắt người ta rời màn hình điểm danh để làm đúng việc ấy.
 *
 * 🔴 Ghi nhận đơn **không** đụng vào điểm danh (D-36 / AC-F13-3). Đơn là lời
 * báo; quyết định vẫn của người điểm danh.
 */
export function AbsenceReviewPanel({
  requests,
  canReview,
}: {
  requests: readonly PendingAbsenceRequest[];
  /** Vai trò chỉ đọc (Cha sở, Cha phó — D-139) thấy đơn nhưng không ghi nhận. */
  canReview: boolean;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const acknowledge = useCallback(
    (request: PendingAbsenceRequest) => {
      setMessage(null);
      startTransition(async () => {
        const result = await acknowledgeAbsenceRequest({
          requestId: request.id,
          staffNote: notes[request.id]?.trim() || null,
        });
        if (!result.ok) {
          setMessage({ tone: "danger", text: result.message });
          return;
        }
        // D-61: nói ra kết quả, và nói bằng TÊN RIÊNG — "Đã ghi nhận đơn" thì
        // người vừa bấm trên một danh sách nhiều đơn không biết đơn nào đã xong.
        setMessage({
          tone: "success",
          text: `Đã ghi nhận đơn của ${request.studentLabel}. Phụ huynh thấy nhãn “Đã ghi nhận”.`,
        });
        router.refresh();
      });
    },
    [notes, router],
  );

  /**
   * 🔴 M05-C — dòng thông báo phải nằm NGOÀI nhánh rỗng.
   *
   * Bản M05-B đặt `FormMessage` bên trong thẻ danh sách và trả về trạng thái
   * rỗng **trước** đó. Hệ quả ở đúng ca thường gặp nhất — ghi nhận đơn **cuối
   * cùng** đang chờ: bấm xong, `router.refresh()` làm danh sách rỗng, component
   * đi vào nhánh rỗng và câu *"Đã ghi nhận đơn của {tên}"* **bị xoá bởi chính
   * lượt làm mới mà nó vừa kích hoạt**. Người bấm thấy thẻ biến mất mà không
   * một chữ nào xác nhận — đúng thứ D-61 sinh ra để cấm.
   *
   * Không bài nào bắt được vì mọi bài unit đều dựng lại với danh sách **không
   * đổi**; E2E thì bắt được, nhưng bằng một lượt đỏ trông y hệt nợ #10.
   */
  const feedback = message ? (
    <FormMessage tone={message.tone}>{message.text}</FormMessage>
  ) : null;

  if (requests.length === 0) {
    return (
      <div className="space-y-3">
        {feedback}
        <EmptyState
          variant="no-data"
          title="Chưa có đơn xin nghỉ nào đang chờ"
          description="Trong khoảng 7 ngày trước và sau hôm nay, các lớp bạn phụ trách chưa có đơn xin nghỉ nào cần xem."
        />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Đơn xin nghỉ tuần này</CardTitle>
        <CardDescription>
          {requests.length} đơn đang chờ trong khoảng 7 ngày trước và sau hôm nay. Đơn chỉ là lời
          báo của phụ huynh — bạn vẫn là người điểm danh.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {feedback}
        {requests.map((request) => (
          // data-absence-request là móc ổn định cho E2E, cùng lý do đã ghi ở
          // `absence-request-panel.tsx`.
          <div
            key={request.id}
            data-absence-request={request.id}
            className="rounded-md border border-border p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{request.studentLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {request.className} · {MEETING_TYPE_LABELS[request.meetingType]} ·{" "}
                  {formatDateVi(request.absenceDate)}
                </p>
              </div>
              <Badge variant="warning">Đang chờ</Badge>
            </div>
            <p className="mt-2 text-sm">{request.reason}</p>
            {canReview ? (
              <div className="mt-3 space-y-2">
                <Label htmlFor={`absence-note-${request.id}`}>
                  Lời nhắn cho phụ huynh (không bắt buộc)
                </Label>
                <Input
                  id={`absence-note-${request.id}`}
                  maxLength={500}
                  placeholder="Ví dụ: Dạ em nắm rồi ạ."
                  value={notes[request.id] ?? ""}
                  onChange={(event) =>
                    setNotes((current) => ({ ...current, [request.id]: event.target.value }))
                  }
                />
                <Button size="sm" onClick={() => acknowledge(request)} disabled={pending}>
                  Ghi nhận
                </Button>
              </div>
            ) : (
              <p className="mt-2 text-xs text-muted-foreground">
                Bạn đang xem ở chế độ chỉ đọc. Việc ghi nhận đơn thuộc về giáo lý viên của lớp.
              </p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
