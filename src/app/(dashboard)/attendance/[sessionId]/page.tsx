import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AttendanceEditor } from "@/features/attendance/components/attendance-editor";
import { MEETING_TYPE_LABELS, SESSION_STATUS_LABELS } from "@/features/attendance/constants";
import { unlockAttendanceSessionFromForm } from "@/features/attendance/server/actions";
import { getAttendanceSessionDetail } from "@/features/attendance/server/queries";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";

export default async function AttendanceSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { sessionId } = await params;
  const { error } = await searchParams;
  const { detail } = await getAttendanceSessionDetail(sessionId);
  if (!detail) notFound();

  return (
    <PageContainer>
      <PageHeader
        title={`${detail.className} — ${MEETING_TYPE_LABELS[detail.meetingType]}`}
        description={`Ngày ${formatDateVi(detail.attendanceDate)}`}
        action={
          <Link href="/attendance" className="text-sm text-muted-foreground hover:text-foreground">
            ← Danh sách buổi
          </Link>
        }
      />

      <FormMessage>{error}</FormMessage>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={detail.status === "completed" ? "success" : "secondary"}>
              {SESSION_STATUS_LABELS[detail.isLocked ? "locked" : detail.status]}
            </Badge>
            {detail.finalizedAt ? (
              <span className="text-xs text-muted-foreground">
                Chốt lúc {formatDateTimeVi(detail.finalizedAt)}
                {detail.lockedAt ? ` · khóa lúc ${formatDateTimeVi(detail.lockedAt)}` : ""}
              </span>
            ) : null}
            {detail.unlockedAt ? (
              <Badge variant="warning">Đang mở khóa — chỉ Quản trị viên sửa được</Badge>
            ) : null}
          </div>
          {detail.canUnlock ? (
            <form action={unlockAttendanceSessionFromForm}>
              <input type="hidden" name="sessionId" value={detail.id} />
              <Button type="submit" variant="outline" size="sm">Mở khóa</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>

      {detail.isLocked && !detail.canEdit ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Buổi này đã khóa. Chỉ Quản trị viên hệ thống mở khóa và sửa được.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <AttendanceEditor
        sessionId={detail.id}
        roster={detail.roster}
        staff={detail.staff}
        isEditor={detail.isEditor && detail.canEdit}
        canTakeover={detail.canTakeover}
        editorName={detail.editorName}
        leaseMinutes={detail.leaseMinutes}
        isFinalized={detail.finalizedAt !== null}
      />
    </PageContainer>
  );
}
