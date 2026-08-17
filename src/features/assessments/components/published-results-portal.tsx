import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Panel } from "@/components/ui/card";
import { formatDateVi } from "@/lib/dates";
import type { AppAudience } from "@/lib/permissions/roles";
import { PortalEmptyState } from "@/features/portal/components/portal-empty-state";
import type { PortalDataStatus } from "@/features/portal/status";
import { ASSESSMENT_KIND_LABELS } from "../constants";
import type { PublishedPortalResult } from "../server/queries";
import { tableScrollFrameClassName } from "@/components/ui/data-table";

/**
 * M07-A · **TB-M07-07 phương án A / AC-07-01** — nói ra con số trung bình được
 * tính trên cái gì.
 *
 * 🔴 Biên bản audit F17 (64/75): cổng phụ huynh và bảng điểm nội bộ **tính trung
 * bình theo hai cách khác nhau** (cổng chỉ trên cột đã công bố, nội bộ trên mọi
 * cột đang dùng) và **không chỗ nào chú thích**, nên phụ huynh đối chiếu ra hai
 * con số rồi chất vấn Giáo lý viên. Đợt này **không đổi phép tính** — đổi phép
 * tính là đổi kỳ vọng của người đang dùng — chỉ nói ra mẫu số.
 *
 * Cả hai con số đều lấy từ cột **đã công bố** (chủ dự án chốt 2026-08-05): xem
 * chú thích dài ở `PublishedPortalResult` trong `server/queries.ts` để biết vì
 * sao **không** hiện tổng số cột của lớp.
 */
function averageNote(result: PublishedPortalResult): string {
  if (result.publishedCount === 0) return "Lớp chưa công bố cột điểm nào.";
  if (result.weightedAverage === null) {
    return `Chưa có điểm ở cột nào trong ${result.publishedCount} cột đã công bố.`;
  }
  return `Tính trên ${result.scoredCount}/${result.publishedCount} cột đã công bố.`;
}

export function PublishedResultsPortal({
  results,
  status,
  audience,
  yearCode,
}: {
  results: PublishedPortalResult[];
  status: PortalDataStatus;
  audience: AppAudience | null;
  yearCode: string | null;
}) {
  if (results.length === 0 || status === "no_data") {
    const reason = status === "ok" ? "no_data" : status;
    return (
      <PortalEmptyState
        reason={reason}
        audience={audience}
        yearCode={yearCode}
        title={reason === "no_data" ? "Chưa có kết quả học tập được công bố" : undefined}
        description={
          reason === "no_data"
            ? `Năm học ${yearCode ?? "hiện hành"} chưa có điểm, nhận xét hoặc bảng xếp hạng nào được công bố cho hồ sơ này.`
            : undefined
        }
      />
    );
  }
  return (
    <div className="space-y-5">
      {results.map((result) => (
        <Card key={result.enrollmentId}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle>{result.studentName}</CardTitle><CardDescription>{result.className} · {result.academicYearCode}</CardDescription></div>
              <div className="flex flex-col items-start gap-1 sm:items-end">
                <Badge variant="success">TB {result.weightedAverage ?? "—"}</Badge>
                <p className="text-xs text-ink-muted">{averageNote(result)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <section>
              <h2 className="mb-2 font-semibold">Điểm đã công bố</h2>
              {result.assessments.length === 0 ? <p className="text-sm text-ink-muted">Chưa có cột điểm được công bố.</p> : (
                <div
                  className={tableScrollFrameClassName}
                  tabIndex={0}
                  aria-label={`Bảng điểm đã công bố của ${result.studentName}, có thể cuộn ngang`}
                >
                  <table className="w-full min-w-[520px] text-sm">
                    <caption className="sr-only">Điểm đã công bố của {result.studentName}</caption>
                    <thead className="bg-surface-muted text-left"><tr><th scope="col" className="p-3">Cột điểm</th><th scope="col" className="p-3">Loại</th><th scope="col" className="p-3">Hệ số</th><th scope="col" className="p-3">Điểm</th></tr></thead>
                    <tbody>{result.assessments.map((assessment) => <tr key={assessment.id} className="border-t border-line"><th scope="row" className="p-3 text-left font-medium">{assessment.title}</th><td className="p-3">{ASSESSMENT_KIND_LABELS[assessment.kind]}</td><td className="p-3">{assessment.weight}</td><td className="p-3">{assessment.score === null ? "—" : `${assessment.score}/${assessment.maxScore}`}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>
            {result.comments.length > 0 ? <section><h2 className="mb-2 font-semibold">Nhận xét của lớp</h2><div className="space-y-2">{result.comments.map((comment) => <div key={comment.id} className="rounded-md bg-surface-muted p-3 text-sm"><p>{comment.content}</p><p className="mt-1 text-xs text-ink-muted">{comment.authorName} · {formatDateVi(comment.commentDate)}</p></div>)}</div></section> : null}
            {result.leaderboards.length > 0 ? <section><h2 className="mb-2 font-semibold">Top 5 của lớp</h2><div className="grid gap-3 lg:grid-cols-2">{result.leaderboards.map((leaderboard) => <Panel key={leaderboard.id}><h3 className="font-medium">{leaderboard.title}</h3><ol className="mt-2 space-y-1 text-sm">{leaderboard.entries.map((entry) => <li key={`${leaderboard.id}-${entry.rank}`} className="flex justify-between gap-3"><span>#{entry.rank} · {entry.saintName} {entry.fullName}</span><span>{entry.score ?? "—"}</span></li>)}</ol></Panel>)}</div></section> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
