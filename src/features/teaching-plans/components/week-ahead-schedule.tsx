import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
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
          <p className="text-sm text-ink-muted">Chưa có bài học hoặc bài kiểm tra trong khoảng này.</p>
        ) : (
          <DataTable
            caption={`Lịch học từ ${formatDateVi(data.startDate)} đến ${formatDateVi(data.endDate)}`}
            hideCaption
            rows={data.items}
            getRowKey={(item) => item.itemId}
            minWidth="680px"
            mobileRow={{ titleKey: "lesson", trailingKey: "date", metaKeys: ["class", "teacher", "preparation"] }}
            columns={[
              { key: "lesson", header: "Bài học · kiểm tra", cell: (item) => <span className="font-medium">{item.itemType === "assessment" ? "Kiểm tra" : item.title}</span> },
              { key: "date", header: "Ngày", cell: (item) => <span className="whitespace-nowrap tabular-nums">{formatDateVi(item.plannedDate)}</span> },
              { key: "class", header: "Lớp", cell: (item) => item.className },
              { key: "teacher", header: "Người phụ trách", cell: (item) => item.teacherName ?? "Chưa phân công" },
              { key: "preparation", header: "Chuẩn bị", cell: (item) => <span className="whitespace-pre-wrap break-words">{item.preparation ?? "Không có yêu cầu"}</span> },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}
