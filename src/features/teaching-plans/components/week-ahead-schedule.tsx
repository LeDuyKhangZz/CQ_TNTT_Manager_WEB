import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Panel } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { formatDateVi } from "@/lib/dates";
import type { WeekAheadTeachingData } from "../server/queries";

export function WeekAheadSchedule({ data }: { data: WeekAheadTeachingData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>7 ngày sắp tới</CardTitle>
        <CardDescription>{formatDateVi(data.startDate)} – {formatDateVi(data.endDate)}</CardDescription>
      </CardHeader>
      <CardContent>
        {/*
          Hạng mục #11 — **"không tải được" khác hẳn "không có bài nào"**, và
          trước đợt này hai thứ ấy dùng chung đúng một câu. Xem `failed` ở
          `server/queries.ts`.
        */}
        {data.failed ? (
          <FormMessage tone="danger">
            Không tải được lịch 7 ngày tới. Đây là lỗi của hệ thống, không phải lớp chưa có bài — hãy
            tải lại trang, nếu vẫn vậy thì báo cho Ban điều hành xứ đoàn.
          </FormMessage>
        ) : data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có bài học hoặc bài kiểm tra trong khoảng này.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((item) => (
              <Panel as="article" key={item.itemId} padding="md">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{formatDateVi(item.plannedDate)}</span>
                  {item.itemType === "assessment" ? <Badge variant="warning">Kiểm tra</Badge> : <Badge variant="secondary">Bài học</Badge>}
                </div>
                <h3 className="font-semibold">{item.itemType === "assessment" ? "Kiểm tra" : item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.className}</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div><dt className="text-muted-foreground">Người phụ trách</dt><dd>{item.teacherName ?? "Chưa phân công"}</dd></div>
                  <div><dt className="text-muted-foreground">Chuẩn bị</dt><dd>{item.preparation ?? "Không có yêu cầu"}</dd></div>
                </dl>
              </Panel>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
