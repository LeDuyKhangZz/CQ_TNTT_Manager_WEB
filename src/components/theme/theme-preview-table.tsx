import { Alert } from "@/components/ui/alert";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { BranchChip } from "@/components/theme/branch-chip";
import type {
  ThemePreview,
  ThemePreviewChange,
  ThemePreviewKind,
  ThemePreviewRow,
} from "@/lib/theme/theme-preview";

/**
 * Màn hình xem trước theme trước khi kích hoạt năm học — Q-12, 15 §4 bước 1.6.
 *
 * Chỉ trình bày; toàn bộ phép đếm nằm ở `buildThemePreview` (hàm thuần, có test).
 *
 * 🔴 Bảng chỉ liệt kê người **có thay đổi**. Không tô màu suông: mỗi ô ngành là
 * một `BranchChip` có **tên ngành bằng chữ**, và có hẳn một cột "Thay đổi" nói
 * thành lời — người không phân biệt được màu vẫn đọc được toàn bộ hậu quả
 * (09 §10 điều 5).
 *
 * 🔴 Người thiếu dữ liệu hiện đúng chữ "Chưa phân công" / "Chưa xếp lớp", không
 * bị gán đại một ngành cho bảng đỡ trống (15 §4 bước 3.2).
 */

const CHANGE_LABEL: Record<ThemePreviewChange, string> = {
  CHANGED: "Đổi ngành",
  BECOMES_UNASSIGNED: "Mất ngành",
  BECOMES_ASSIGNED: "Có ngành mới",
  STAYS_UNASSIGNED: "Vẫn chưa có",
  UNCHANGED: "Không đổi",
};

const KIND_LABEL: Record<ThemePreviewKind, string> = {
  STAFF: "Giáo lý viên",
  STUDENT: "Thiếu nhi",
};

/** Người chưa có ngành: nhân sự thì "chưa phân công", thiếu nhi thì "chưa xếp lớp". */
function missingLabel(kind: ThemePreviewKind): string {
  return kind === "STAFF" ? "Chưa phân công" : "Chưa xếp lớp";
}

function BranchCell({
  branch,
  kind,
}: {
  branch: ThemePreviewRow["current"];
  kind: ThemePreviewKind;
}) {
  if (!branch) {
    return <span className="text-sm text-ink-muted">{missingLabel(kind)}</span>;
  }
  return <BranchChip themeKey={branch.themeKey} branchName={branch.branchName} />;
}

const COLUMNS: readonly DataTableColumn<ThemePreviewRow>[] = [
  {
    key: "name",
    header: "Họ tên",
    cell: (row) => <span className="font-medium">{row.name}</span>,
  },
  {
    key: "kind",
    header: "Nhóm",
    hideBelowSm: true,
    cell: (row) => KIND_LABEL[row.kind],
  },
  {
    key: "current",
    header: "Hiện tại",
    cell: (row) => <BranchCell branch={row.current} kind={row.kind} />,
  },
  {
    key: "next",
    header: "Sau khi kích hoạt",
    cell: (row) => <BranchCell branch={row.next} kind={row.kind} />,
  },
  {
    key: "change",
    header: "Thay đổi",
    cell: (row) => CHANGE_LABEL[row.change],
  },
];

function CountLine({
  total,
  unit,
  changed,
  changedUnit,
}: {
  total: number;
  unit: string;
  changed: number;
  changedUnit: string;
}) {
  return (
    <li className="text-sm text-ink">
      <span className="font-semibold tabular-nums">{total}</span> {unit}
      {" · "}
      <span className="font-semibold tabular-nums">{changed}</span> {changedUnit}
    </li>
  );
}

export function ThemePreviewTable({
  preview,
  academicYearLabel,
  className,
}: {
  preview: ThemePreview;
  /** Năm học **sắp kích hoạt**, ví dụ "2027-2028". */
  academicYearLabel: string;
  className?: string;
}) {
  const { staff, students, rows } = preview;

  return (
    <section className={className} aria-labelledby="theme-preview-heading">
      <h3 id="theme-preview-heading" className="text-base font-semibold text-ink">
        Sau khi kích hoạt năm học {academicYearLabel}
      </h3>

      <ul className="mt-3 space-y-1">
        <CountLine
          total={staff.total}
          unit="Giáo lý viên"
          changed={staff.changed}
          changedUnit="người đổi ngành"
        />
        <CountLine
          total={students.total}
          unit="thiếu nhi"
          changed={students.changed}
          changedUnit="em đổi ngành"
        />
      </ul>

      {staff.unassignedAfter > 0 ? (
        <Alert tone="warning" className="mt-3">
          {staff.unassignedAfter} Giáo lý viên chưa có phân công — sẽ mất màu
          ngành và hiện “Chưa phân công”.
        </Alert>
      ) : null}

      {students.unassignedAfter > 0 ? (
        <Alert tone="warning" className="mt-3">
          {students.unassignedAfter} thiếu nhi chưa xếp lớp — sẽ hiện “Chưa xếp
          lớp”.
        </Alert>
      ) : null}

      <DataTable
        className="mt-4"
        caption={`Những người đổi ngành sau khi kích hoạt năm học ${academicYearLabel}`}
        columns={COLUMNS}
        rows={rows}
        getRowKey={(row) => row.id}
        minWidthClassName="min-w-[720px]"
        empty={
          <p className="text-sm text-ink-muted">
            Không ai đổi ngành sau khi kích hoạt năm học {academicYearLabel}.
          </p>
        }
      />
    </section>
  );
}
