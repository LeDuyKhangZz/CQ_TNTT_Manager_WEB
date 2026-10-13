import type { ReactNode } from "react";
import { BarChart, LineChart, type ChartPoint } from "./chart";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Skeleton } from "./skeleton";
import { FormMessage } from "./form-message";

/** chart.tsx owns both the SVG and its equivalent screen-reader data table. */
export function ChartCard({ title, data, valueLabel, kind = "bar", loading = false, error, retry, emptyMessage, formatValue }: {
  title: string; data: readonly ChartPoint[]; valueLabel: string; kind?: "bar" | "line";
  loading?: boolean; error?: string; retry?: ReactNode; emptyMessage: string; formatValue?: (value:number) => string;
}) {
  const Chart = kind === "bar" ? BarChart : LineChart;
  return <Card><CardHeader><CardTitle as="h2">{title}</CardTitle></CardHeader>
    <CardContent aria-busy={loading || undefined}>
      {loading ? <div role="status"><span className="sr-only">Đang tải {title}</span><Skeleton className="h-40 w-full" /></div>
        : error ? <div className="space-y-2"><FormMessage tone="danger">{error}</FormMessage>{retry}</div>
        : data.length === 0 ? <p className="py-4 text-sm text-ink-muted">{emptyMessage}</p>
        : <Chart title={title} hideTitle data={data} valueLabel={valueLabel} formatValue={formatValue} className="[&_svg]:max-h-64" />}
    </CardContent>
  </Card>;
}
