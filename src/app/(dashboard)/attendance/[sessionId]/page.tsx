import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { FormPendingBridge } from "@/components/loading/form-pending-bridge";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { AttendanceEditor } from "@/features/attendance/components/attendance-editor";
import { MEETING_TYPE_LABELS, SESSION_STATE_LABELS } from "@/features/attendance/constants";
import { unlockAttendanceSessionFromForm } from "@/features/attendance/server/actions";
import { getAttendanceSessionDetail } from "@/features/attendance/server/queries";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";

export default async function AttendanceSessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { sessionId } = await params;
  const { error, notice } = await searchParams;
  const { detail } = await getAttendanceSessionDetail(sessionId);
  if (!detail) notFound();

  return (
    <PageContainer>
      <PageHeader
        title={`${detail.className} — ${MEETING_TYPE_LABELS[detail.meetingType]}`}
        description={`Ngày ${formatDateVi(detail.attendanceDate)}`}
        backHref="/attendance"
        backLabel="Danh sách buổi"
      />

      {/* R1.5 (redesign 2C, UX-09): các khối anh em từng đứng sát nhau 0px —
          `space-y-5` cho cả trang một nhịp dọc thống nhất. */}
      <div className="space-y-3">
      <FormMessage>{error}</FormMessage>
      {/* TB-08 — người mở buổi mà không nhận được quyền sửa phải được nói ngay,
          không phải tự suy ra từ việc thanh nút không xuất hiện. */}
      {notice ? <FormMessage tone="info">{notice}</FormMessage> : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={detail.state === "completed" ? "success" : "secondary"}>
              {SESSION_STATE_LABELS[detail.state]}
            </Badge>
            {detail.unlockedAt ? (
              <Badge variant="warning">Đang mở khóa — chỉ Quản trị viên sửa được</Badge>
            ) : null}
          </div>
          {detail.canUnlock ? (
            <form action={unlockAttendanceSessionFromForm}>
              <FormPendingBridge />
              <input type="hidden" name="sessionId" value={detail.id} />
              <Button type="submit" variant="outline" size="sm">Mở khóa</Button>
            </form>
          ) : null}
        </div>

      {detail.finalizedAt ? <details className="text-xs text-ink-muted">
        <summary className="w-fit cursor-pointer py-3">Thời gian chốt và khóa</summary>
        <p>Chốt lúc {formatDateTimeVi(detail.finalizedAt)}{detail.lockedAt ? ` · Khóa lúc ${formatDateTimeVi(detail.lockedAt)}` : ""}</p>
      </details> : null}

      {detail.isLocked && !detail.canEdit ? (
            <p className="text-sm text-ink-muted">
              Buổi này đã khóa. Chỉ Quản trị viên hệ thống mở khóa và sửa được.
            </p>
      ) : null}

      {/* TB-12 — mốc khóa tính từ LẦN CHỐT ĐẦU TIÊN và cố ý không bị đẩy lùi.
          Hệ quả với người mở khóa: chốt lại xong là khóa lại ngay lập tức. Đó
          là luật đúng, nhưng trước đợt này không màn hình nào nói ra, nên nó
          trông y hệt một lỗi "mở khóa không ăn". */}
      {detail.unlockedAt && detail.finalizedAt ? (
            <p className="text-sm text-ink-muted">
              Buổi này đang mở khóa cho Quản trị viên. Sau khi chốt lại, buổi sẽ khóa lại ngay vì mốc
              khóa tính từ lần chốt đầu tiên ({formatDateTimeVi(detail.finalizedAt)}).
            </p>
      ) : null}

      <AttendanceEditor
        sessionId={detail.id}
        roster={detail.roster}
        pausedCount={detail.pausedCount}
        staff={detail.staff}
        isEditor={detail.isEditor && detail.canEdit}
        canTakeover={detail.canTakeover}
        editorName={detail.editorName}
        leaseMinutes={detail.leaseMinutes}
        leaseExpiresAt={detail.leaseExpiresAt}
        isFinalized={detail.finalizedAt !== null}
      />
      </div>
    </PageContainer>
  );
}
