import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateVi } from "@/lib/dates";
import { ASSESSMENT_KIND_LABELS } from "../constants";
import type { PublishedPortalResult } from "../server/queries";

export function PublishedResultsPortal({ results }: { results: PublishedPortalResult[] }) {
  if (results.length === 0) {
    return <Card><CardContent className="pt-6 text-sm text-muted-foreground">Chưa có kết quả nào được công bố.</CardContent></Card>;
  }
  return (
    <div className="space-y-5">
      {results.map((result) => (
        <Card key={result.enrollmentId}>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><CardTitle>{result.studentName}</CardTitle><CardDescription>{result.className} · {result.academicYearCode}</CardDescription></div>
              <Badge variant="success">TB {result.weightedAverage ?? "—"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <section>
              <h2 className="mb-2 font-semibold">Điểm đã công bố</h2>
              {result.assessments.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có cột điểm được công bố.</p> : (
                <div className="overflow-x-auto rounded-md border border-border">
                  <table className="w-full min-w-[520px] text-sm">
                    <thead className="bg-muted text-left"><tr><th className="p-3">Cột điểm</th><th className="p-3">Loại</th><th className="p-3">Hệ số</th><th className="p-3">Điểm</th></tr></thead>
                    <tbody>{result.assessments.map((assessment) => <tr key={assessment.id} className="border-t border-border"><td className="p-3 font-medium">{assessment.title}</td><td className="p-3">{ASSESSMENT_KIND_LABELS[assessment.kind]}</td><td className="p-3">{assessment.weight}</td><td className="p-3">{assessment.score === null ? "—" : `${assessment.score}/${assessment.maxScore}`}</td></tr>)}</tbody>
                  </table>
                </div>
              )}
            </section>
            {result.comments.length > 0 ? <section><h2 className="mb-2 font-semibold">Nhận xét của lớp</h2><div className="space-y-2">{result.comments.map((comment) => <div key={comment.id} className="rounded-md bg-muted p-3 text-sm"><p>{comment.content}</p><p className="mt-1 text-xs text-muted-foreground">{comment.authorName} · {formatDateVi(comment.commentDate)}</p></div>)}</div></section> : null}
            {result.leaderboards.length > 0 ? <section><h2 className="mb-2 font-semibold">Top 5 của lớp</h2><div className="grid gap-3 lg:grid-cols-2">{result.leaderboards.map((leaderboard) => <div key={leaderboard.id} className="rounded-md border border-border p-3"><h3 className="font-medium">{leaderboard.title}</h3><ol className="mt-2 space-y-1 text-sm">{leaderboard.entries.map((entry) => <li key={`${leaderboard.id}-${entry.rank}`} className="flex justify-between gap-3"><span>#{entry.rank} · {entry.saintName} {entry.fullName}</span><span>{entry.score ?? "—"}</span></li>)}</ol></div>)}</div></section> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
