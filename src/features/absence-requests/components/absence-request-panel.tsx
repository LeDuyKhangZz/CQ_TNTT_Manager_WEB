"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, panelClassName } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { MEETING_TYPE_LABELS } from "@/features/attendance/constants";
import { PortalEmptyState } from "@/features/portal/components/portal-empty-state";
import { formatDateVi } from "@/lib/dates";
import type { AppAudience } from "@/lib/permissions/roles";
import type { PortalAbsenceRequest, PortalChild } from "@/features/portal/server/queries";
import type { PortalChildrenStatus } from "@/features/portal/status";
import { ABSENCE_REQUEST_STATUS_LABELS } from "../schemas";
import { cancelAbsenceRequest, createAbsenceRequest } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Gửi/hủy đơn chạy qua client component thay vì `<form action={serverAction}>`.
 * Lý do: trang này đọc `searchParams` nên là trang động, và sau một Server
 * Action gọi từ form thuần thì router phía client vẫn giữ bản cũ — phụ huynh
 * bấm gửi xong không thấy đơn của mình cho tới khi tự tải lại trang.
 * `router.refresh()` sau khi action trả về là cách khắc phục đang dùng ở trang
 * điểm danh. Lỗi cũng hiện ngay tại chỗ thay vì nhét qua query string.
 */
const statusVariants = {
  pending: "warning",
  acknowledged: "success",
  cancelled: "outline",
} as const;

export function AbsenceRequestPanel({
  students,
  requests,
  childrenStatus,
  audience,
}: {
  students: readonly PortalChild[];
  requests: readonly PortalAbsenceRequest[];
  childrenStatus: PortalChildrenStatus;
  audience: AppAudience | null;
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [absenceDate, setAbsenceDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);

  const submit = useCallback(() => {
    setError(null);
    startTransition(async () => {
      const result = await createAbsenceRequest({ studentId, absenceDate, reason });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setAbsenceDate("");
      setReason("");
      router.refresh();
    });
  }, [absenceDate, reason, router, studentId]);

  const cancel = useCallback(
    (requestId: string) => {
      setError(null);
      startTransition(async () => {
        const result = await cancelAbsenceRequest(requestId);
        if (!result.ok) {
          setError(result.message);
          return;
        }
        router.refresh();
      });
    },
    [router],
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(18rem,0.6fr)_minmax(0,1.4fr)]">
      {students.length === 0 ? (
        <PortalEmptyState
          reason={childrenStatus === "no_children" ? "no_children" : "not_linked"}
          audience={audience}
          className="min-h-full"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Gửi đơn mới</CardTitle>
            <CardDescription>Xứ đoàn sinh hoạt thứ Năm và Chúa nhật.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="absence-student">Thiếu nhi</Label>
                <Select
                  id="absence-student"
                  name="studentId"
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                >
                  {students.map((child) => (
                    <option key={child.id} value={child.id}>{child.label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="absence-date">Ngày nghỉ</Label>
                <DateField
                  id="absence-date"
                  name="absenceDate"
                  required
                  value={absenceDate}
                  onChange={(event) => setAbsenceDate(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="absence-reason">Lý do</Label>
                <Input
                  id="absence-reason"
                  name="reason"
                  maxLength={500}
                  required
                  placeholder="Ví dụ: cháu về quê"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
              <FormMessage>{error}</FormMessage>
              <Button className="w-full" onClick={submit} disabled={pending}>
                Gửi đơn
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {requests.length === 0 ? (
        <PortalEmptyState
          reason="no_data"
          audience={audience}
          title="Chưa có đơn xin nghỉ nào"
          description="Chưa có đơn xin nghỉ nào trong phạm vi tài khoản này. Đơn mới gửi sẽ xuất hiện tại đây."
          className="min-h-full"
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Đơn đã gửi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {requests.map((request) => (
              // data-absence-date là móc ổn định cho E2E: bám vào cây div lồng
              // nhau thì test gãy mỗi lần đổi layout.
              <div
                key={request.id}
                data-absence-date={request.absenceDate}
                className={panelClassName()}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{request.studentLabel}</p>
                    <p className="text-xs text-muted-foreground">
                      {MEETING_TYPE_LABELS[request.meetingType]} · {formatDateVi(request.absenceDate)}
                    </p>
                  </div>
                  <Badge variant={statusVariants[request.status]}>
                    {ABSENCE_REQUEST_STATUS_LABELS[request.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-sm">{request.reason}</p>
                {request.staffNote ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Giáo lý viên: {request.staffNote}
                  </p>
                ) : null}
                {request.status === "pending" ? (
                  <Button
                    className="mt-2"
                    variant="outline"
                    size="sm"
                    onClick={() => cancel(request.id)}
                    disabled={pending}
                  >
                    Hủy đơn
                  </Button>
                ) : null}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
