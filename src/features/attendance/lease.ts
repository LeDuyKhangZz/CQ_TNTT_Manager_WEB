/**
 * Đồng hồ phiên chỉnh sửa — M05-C / TB-05, AC-F05-4.
 *
 * 🔴 Nhận **mốc hết hạn do máy chủ trả về** và **mốc "bây giờ" truyền vào**, chứ
 * không tự gọi `new Date()`. Cùng một lý do đã ghi ở `mostRecentMeetingDate`
 * (TB-01) và `absenceReviewWindow` (M05-B): một hàm đọc đồng hồ hệ thống chỉ
 * test được bằng cách đổi đồng hồ.
 *
 * Nhưng ở đây còn một lý do nặng hơn: **lease do giờ của cơ sở dữ liệu quyết
 * định** (BR-M05-06/07, và AC-F05-1 canh đúng điều đó bằng cách đổi đồng hồ
 * máy khách). Con số hiện trên màn hình là *ước lượng để người dùng biết đường
 * mà bấm Lưu*, không phải nguồn sự thật — nên nó phải bắt nguồn từ giá trị máy
 * chủ trả về, và câu chữ không được hứa chắc chắn.
 */

/** Dưới mốc này thì đổi giọng và giục lưu nháp (TB-05 bước 3). */
export const LEASE_WARNING_MS = 3 * 60_000;

export type LeaseTone = "info" | "warning" | "expired";

export interface LeaseStatus {
  tone: LeaseTone;
  /** Câu đọc được cho cả người nhìn màn hình lẫn trình đọc màn hình. */
  text: string;
  remainingMs: number;
}

/** Còn lại bao nhiêu mili giây; `null` nghĩa là chưa biết mốc hết hạn. */
export function leaseRemainingMs(expiresAt: string | null, now: number): number | null {
  if (!expiresAt) return null;
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return null;
  return expiry - now;
}

export function leaseStatus(expiresAt: string | null, now: number): LeaseStatus | null {
  const remainingMs = leaseRemainingMs(expiresAt, now);
  if (remainingMs === null) return null;

  if (remainingMs <= 0) {
    return {
      tone: "expired",
      remainingMs,
      // Không nói "bạn đã mất quyền sửa": lease hết hạn KHÔNG tự chuyển quyền
      // cho ai. Chừng nào chưa có người tiếp quản thì lượt lưu tiếp theo vẫn
      // đi lọt. Câu chữ phải nói đúng mức độ đó, không dọa quá.
      text: "Phiên chỉnh sửa đã quá hạn. Người khác có thể tiếp quản buổi này bất cứ lúc nào — bấm Lưu nháp ngay.",
    };
  }

  // Làm tròn LÊN: còn 30 giây mà hiện "còn 0 phút" thì con số nói sai theo
  // hướng nguy hiểm nhất — người ta tưởng đã mất và bỏ dở.
  const minutes = Math.ceil(remainingMs / 60_000);

  if (remainingMs <= LEASE_WARNING_MS) {
    return {
      tone: "warning",
      remainingMs,
      text: `Bạn đang giữ quyền sửa · còn khoảng ${minutes} phút. Nên bấm Lưu nháp ngay.`,
    };
  }

  return {
    tone: "info",
    remainingMs,
    text: `Bạn đang giữ quyền sửa · còn khoảng ${minutes} phút.`,
  };
}

/**
 * Bản nháp đang gõ, viết ra chữ để người bị tiếp quản **chép lại được** (TB-05
 * bước 4). Chỉ liệt kê em khác mặc định — chép cả 50 dòng "Có mặt" là không ai
 * đọc nổi, mà đúng thứ họ vừa mất công gõ là những dòng ngoại lệ.
 */
export interface DraftLine {
  label: string;
  massLabel: string;
  catechismLabel: string;
  note: string;
  isException: boolean;
}

export function buildDraftHandoffText(lines: readonly DraftLine[]): string {
  const exceptions = lines.filter((line) => line.isException);
  if (exceptions.length === 0) return "Không có ngoại lệ nào chưa lưu.";
  return exceptions
    .map((line) => {
      const note = line.note.trim();
      const suffix = note === "" ? "" : ` — ${note}`;
      return `${line.label}: Thánh lễ ${line.massLabel}, Giáo lý ${line.catechismLabel}${suffix}`;
    })
    .join("\n");
}
