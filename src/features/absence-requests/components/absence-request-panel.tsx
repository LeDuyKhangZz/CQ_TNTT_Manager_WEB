"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MEETING_TYPE_LABELS } from "@/features/attendance/constants";
import { formatDateVi } from "@/lib/dates";
import type { PortalAbsenceRequest, PortalChild } from "@/features/portal/server/queries";
import { ABSENCE_REQUEST_STATUS_LABELS } from "../schemas";
import { cancelAbsenceRequest, createAbsenceRequest } from "../server/actions";

/**
 * Gửi/hủy đơn chạy qua client component thay vì `<form action={serverAction}>`.
 * Lý do: trang này đọc `searchParams` nên là trang động, và sau một Server
 * Action gọi từ form thuần thì router phía client vẫn giữ bản cũ — phụ huynh
 * bấm gửi xong không thấy đơn của mình cho tới khi tự tải lại trang.
 * `router.refresh()` sau khi action trả về là cách khắc phục đang dùng ở trang
 * điểm danh. Lỗi cũng hiện ngay tại chỗ thay vì nhét qua query string.
 */
const selectClassName = "h-11 w-full rounded-md border border-border bg-card px-3 text-sm";

const statusVariants = {
  pending: "warning",
  acknowledged: "success",
  cancelled: "outline",
} as const;

export function AbsenceRequestPanel({
  students,
  requests,
}: {
  students: readonly PortalChild[];
  requests: readonly PortalAbsenceRequest[];
}) {
  const router = useRouter();
  const [studentId, setStudentId] = useState(students[0]?.id ?? "");
  const [absenceDate, setAbsenceDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
      <Card>
        <CardHeader>
          <CardTitle>Gửi đơn mới</CardTitle>
          <CardDescription>Xứ đoàn sinh hoạt thứ Năm và Chúa nhật.</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Tài khoản của bạn chưa gắn với hồ sơ thiếu nhi nào.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="absence-student">Thiếu nhi</Label>
                <select
                  id="absence-student"
                  name="studentId"
                  className={selectClassName}
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                >
                  {students.map((child) => (
                    <option key={child.id} value={child.id}>{child.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="absence-date">Ngày nghỉ</Label>
                <Input
                  id="absence-date"
                  name="absenceDate"
                  type="date"
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đơn đã gửi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có đơn nào.</p>
          ) : (
            requests.map((request) => (
              // data-absence-date là móc ổn định cho E2E: bám vào cây div lồng
              // nhau thì test gãy mỗi lần đổi layout.
              <div
                key={request.id}
                data-absence-date={request.absenceDate}
                className="rounded-md border border-border p-3"
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
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
