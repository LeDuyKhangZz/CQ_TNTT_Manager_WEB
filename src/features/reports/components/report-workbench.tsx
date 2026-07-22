"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  REPORT_PERIODS,
  REPORT_PERIOD_LABELS,
  REPORT_SCOPES,
  REPORT_SCOPE_LABELS,
  REPORT_TYPES,
  REPORT_TYPE_LABELS,
  reportFilterToSearchParams,
  type ReportPeriod,
  type ReportScope,
  type ReportType,
} from "../filters";
import { createReportSnapshot } from "../server/actions";
import type { ReportsPageData } from "../server/queries";

const selectClassName = "h-11 min-h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
type Message = { tone: "success" | "danger"; text: string } | null;

export function ReportWorkbench({ data }: { data: ReportsPageData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const [reportType, setReportType] = useState<ReportType>(data.filter.reportType);
  const [periodType, setPeriodType] = useState<ReportPeriod>(data.filter.periodType);
  const [scopeType, setScopeType] = useState<ReportScope>(data.filter.scopeType);

  const scopeOptions = scopeType === "sector"
    ? data.sectors.map((sector) => ({ id: sector.id, label: sector.name }))
    : scopeType === "class"
      ? data.classes.map((item) => ({ id: item.id, label: item.name }))
      : [];

  function applyFilter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = reportFilterToSearchParams({
      reportType,
      periodType,
      anchorDate: String(formData.get("anchorDate") ?? data.filter.anchorDate),
      scopeType,
      scopeId: scopeType === "global" ? null : String(formData.get("scopeId") ?? "") || null,
    });
    router.push(`/reports?${params.toString()}`);
  }

  function snapshot() {
    setMessage(null);
    startTransition(async () => {
      const result = await createReportSnapshot(data.filter);
      setMessage(result.ok
        ? { tone: "success", text: "Đã chốt báo cáo. Bản chốt không đổi khi dữ liệu thay đổi về sau." }
        : { tone: "danger", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  const exportParams = reportFilterToSearchParams(data.filter);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bộ lọc</CardTitle>
          <CardDescription>File tải về và bản chốt dùng đúng bộ lọc đang hiển thị.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={applyFilter} className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-2">
              <span className="text-sm font-medium">Loại báo cáo</span>
              <select
                className={selectClassName}
                value={reportType}
                onChange={(event) => setReportType(event.target.value as ReportType)}
              >
                {REPORT_TYPES.map((value) => (
                  <option key={value} value={value}>{REPORT_TYPE_LABELS[value]}</option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Kỳ báo cáo</span>
              <select
                className={selectClassName}
                value={periodType}
                onChange={(event) => setPeriodType(event.target.value as ReportPeriod)}
              >
                {REPORT_PERIODS.map((value) => (
                  <option key={value} value={value}>{REPORT_PERIOD_LABELS[value]}</option>
                ))}
              </select>
            </label>
            <div className="space-y-2">
              <Label htmlFor="anchor-date">Ngày trong kỳ</Label>
              <Input id="anchor-date" name="anchorDate" type="date" defaultValue={data.filter.anchorDate} />
            </div>
            <label className="space-y-2">
              <span className="text-sm font-medium">Phạm vi</span>
              <select
                className={selectClassName}
                value={scopeType}
                onChange={(event) => setScopeType(event.target.value as ReportScope)}
              >
                {REPORT_SCOPES.map((value) => (
                  <option key={value} value={value}>{REPORT_SCOPE_LABELS[value]}</option>
                ))}
              </select>
            </label>
            {scopeType !== "global" ? (
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Chọn {scopeType === "sector" ? "ngành" : "lớp"}</span>
                <select name="scopeId" required defaultValue={data.filter.scopeId ?? ""} className={selectClassName}>
                  <option value="">Chọn phạm vi</option>
                  {scopeOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="md:col-span-2 xl:col-span-4">
              <Button type="submit">Xem báo cáo</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{data.title}</CardTitle>
              <CardDescription>
                {data.academicYear ? `Năm học ${data.academicYear.code} · ` : ""}
                {formatDateVi(data.from)} – {formatDateVi(data.to)}
                {data.filter.reportType === "results" ? " (kết quả tính cho cả năm học)" : ""}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                href={`/reports/export?${exportParams.toString()}&format=xlsx`}
              >
                Tải Excel
              </a>
              <a
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                href={`/reports/export?${exportParams.toString()}&format=pdf`}
              >
                Tải PDF
              </a>
              {data.canSnapshot ? (
                <Button size="sm" disabled={pending || data.rows.length === 0} onClick={snapshot}>
                  {pending ? "Đang chốt…" : "Chốt báo cáo"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {data.rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Không có dữ liệu trong phạm vi và khoảng thời gian này.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {data.headers.map((header) => (
                      <th key={header} className="px-3 py-2 font-medium">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.classId} className="border-b border-border/60">
                      <td className="px-3 py-2">{row.className}</td>
                      {row.values.map((value, index) => (
                        <td key={`${row.classId}-${index}`} className="px-3 py-2">{value ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Báo cáo đã chốt</CardTitle>
          <CardDescription>Bản chốt giữ nguyên số liệu và bộ lọc tại thời điểm chốt.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.snapshots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có báo cáo nào được chốt.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.snapshots.map((snapshotRow) => (
                <li key={snapshotRow.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{snapshotRow.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Chốt lúc {formatDateTimeVi(snapshotRow.generatedAt)} · mã kiểm tra{" "}
                      {snapshotRow.checksum.slice(0, 12)}…
                    </p>
                  </div>
                  <a
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    href={`/reports/snapshots/${snapshotRow.id}/export?format=xlsx`}
                  >
                    Tải bản chốt
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
