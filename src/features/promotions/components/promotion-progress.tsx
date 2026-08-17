import Link from "next/link";
import { cn } from "@/lib/utils";
import { promotionCellHref, type PromotionClassProgress } from "../promotion-directory";
import { tableScrollFrameClassName } from "@/components/ui/data-table";

/**
 * Bảng tiến độ theo lớp — **M08-A, TO-BE 1 bước 1 / AC-12**.
 *
 * 🔴 `06_UI_UX_RECOMMENDATIONS` §1 chấm đây là khoảng trống lớn nhất của trang:
 * *"Không có bảng tiến độ ('đã đề xuất 12/28') ⇒ người duyệt không biết còn
 * thiếu bao nhiêu, nên không biết khi nào xong."* Với một Trưởng ngành có 8 lớp,
 * đó là khác biệt giữa *"cuộn hết trang rồi đoán"* và *"nhìn một bảng rồi bấm
 * đúng ô còn việc"*.
 *
 * Mỗi con số **là một liên kết** dẫn thẳng tới đúng lớp ở đúng trạng thái. Đây
 * cũng là cách BR-M08-15 (*"mặc định lọc `pending` cho người duyệt"*) được đáp
 * ứng mà **không** làm cùng một đường dẫn có nghĩa khác nhau với hai người khác
 * nhau — thứ sẽ phá đúng tính chất *"chia sẻ được"* mà TO-BE 1 bước 2 đòi.
 *
 * Server Component: không state, không JS. Dạng bảng từ `sm` trở lên, dạng thẻ
 * ở dưới — cùng khuôn `BatchRowEditor` (M12-B, **D-134**: `DataTable` không dùng
 * được vì nó là bảng chỉ-đọc khung cố định, không xếp lại được theo bề ngang).
 */

const CELL = "block px-0 py-1 sm:table-cell sm:px-3 sm:py-2 sm:align-middle";
const MOBILE_LABEL = "mr-2 inline-block min-w-28 text-xs font-medium text-ink-muted sm:hidden";

function CountCell({
  classId,
  status,
  count,
  label,
  emphasis,
}: {
  classId: string;
  status: "not_proposed" | "pending" | "approved" | "rejected";
  count: number;
  label: string;
  emphasis?: boolean;
}) {
  return (
    <td className={CELL}>
      <span className={MOBILE_LABEL}>{label}</span>
      {count === 0 ? (
        // Số 0 **không** là liên kết: một ô rỗng dẫn tới một trang rỗng là một
        // cú bấm phí. Vẫn giữ chỗ trong bảng để cột không lệch.
        <span className="text-ink-muted" data-numeric>
          0
        </span>
      ) : (
        <Link
          href={promotionCellHref(classId, status)}
          className={cn(
            "inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-2 text-sm hover:bg-surface-muted",
            emphasis ? "font-semibold text-ink" : "text-ink",
          )}
          data-numeric
        >
          {count}
        </Link>
      )}
    </td>
  );
}

export function PromotionProgress({
  progress,
  activeClassId,
}: {
  progress: readonly PromotionClassProgress[];
  activeClassId: string;
}) {
  if (progress.length === 0) return null;

  const total = progress.reduce(
    (sum, entry) => ({
      rosterSize: sum.rosterSize + entry.rosterSize,
      notProposed: sum.notProposed + entry.notProposed,
      pending: sum.pending + entry.pending,
      approved: sum.approved + entry.approved,
      rejected: sum.rejected + entry.rejected,
    }),
    { rosterSize: 0, notProposed: 0, pending: 0, approved: 0, rejected: 0 },
  );

  return (
    <section aria-labelledby="promotion-progress-heading" className="space-y-3">
      <h2 id="promotion-progress-heading" className="text-lg font-semibold">
        Tiến độ theo lớp
      </h2>

      <div className={tableScrollFrameClassName}>
        <table className="w-full border-collapse text-sm sm:min-w-[40rem]">
          <caption className="sr-only">
            Số thiếu nhi theo từng trạng thái đề xuất chuyển lớp, tính trên toàn bộ phạm vi bạn phụ
            trách. Bấm vào một con số để mở đúng lớp ở đúng trạng thái đó.
          </caption>
          <thead className="hidden sm:table-header-group">
            <tr className="border-b border-line bg-surface-muted text-left">
              <th scope="col" className="px-3 py-2 font-semibold">
                Lớp
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Sĩ số
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Chưa đề xuất
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Chờ duyệt
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Đã duyệt
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Từ chối
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {progress.map((entry) => (
              <tr
                key={entry.classId}
                className={cn(
                  "block px-4 py-3 sm:table-row sm:px-0 sm:py-0",
                  entry.classId === activeClassId && "bg-theme-tint",
                )}
              >
                <td className={cn(CELL, "font-medium")}>
                  <span className={MOBILE_LABEL}>Lớp</span>
                  {entry.classId === activeClassId ? (
                    <span aria-current="true">{entry.className}</span>
                  ) : (
                    <Link
                      href={promotionCellHref(entry.classId, "all")}
                      className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-theme-accent-text"
                    >
                      {entry.className}
                    </Link>
                  )}
                </td>
                <td className={CELL}>
                  <span className={MOBILE_LABEL}>Sĩ số</span>
                  <span data-numeric>{entry.rosterSize}</span>
                </td>
                <CountCell
                  classId={entry.classId}
                  status="not_proposed"
                  count={entry.notProposed}
                  label="Chưa đề xuất"
                  emphasis
                />
                <CountCell
                  classId={entry.classId}
                  status="pending"
                  count={entry.pending}
                  label="Chờ duyệt"
                  emphasis
                />
                <CountCell
                  classId={entry.classId}
                  status="approved"
                  count={entry.approved}
                  label="Đã duyệt"
                />
                <CountCell
                  classId={entry.classId}
                  status="rejected"
                  count={entry.rejected}
                  label="Từ chối"
                />
              </tr>
            ))}
          </tbody>
          {progress.length > 1 ? (
            <tfoot className="border-t border-line-strong bg-surface-muted font-medium">
              <tr className="block px-4 py-3 sm:table-row sm:px-0 sm:py-0">
                <td className={CELL}>Tổng {progress.length} lớp</td>
                <td className={CELL}>
                  <span className={MOBILE_LABEL}>Sĩ số</span>
                  <span data-numeric>{total.rosterSize}</span>
                </td>
                <td className={CELL}>
                  <span className={MOBILE_LABEL}>Chưa đề xuất</span>
                  <span data-numeric>{total.notProposed}</span>
                </td>
                <td className={CELL}>
                  <span className={MOBILE_LABEL}>Chờ duyệt</span>
                  <span data-numeric>{total.pending}</span>
                </td>
                <td className={CELL}>
                  <span className={MOBILE_LABEL}>Đã duyệt</span>
                  <span data-numeric>{total.approved}</span>
                </td>
                <td className={CELL}>
                  <span className={MOBILE_LABEL}>Từ chối</span>
                  <span data-numeric>{total.rejected}</span>
                </td>
              </tr>
            </tfoot>
          ) : null}
        </table>
      </div>
    </section>
  );
}
