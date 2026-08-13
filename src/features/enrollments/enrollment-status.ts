/**
 * Vòng đời ghi danh — M03-A, TB-F10 / BR-M03-N01…N04, D-121 / D-122.
 *
 * 🔴 **Đây là chỗ chữa lỗi CRITICAL F10 (35/75, thấp thứ hai toàn hệ thống).**
 * Trước đợt này, `paused` bị **hai tầng định nghĩa trái ngược nhau**:
 *
 *   · Cơ sở dữ liệu coi `paused` là trạng thái **MỞ** — nó nằm trong unique index
 *     "một ghi danh mở mỗi năm" và trong CHECK `enrollments_open_has_no_end`
 *     (`20260716000500:19-20`) buộc `ended_on IS NULL`.
 *   · Ứng dụng xếp `paused` vào `CLOSE_ENROLLMENT_STATUSES` — danh sách trạng thái
 *     **ĐÓNG** — rồi đưa vào ô "Lý do kết thúc", nơi luôn gửi kèm một `ended_on`.
 *
 * Kết quả: chọn "Tạm nghỉ" **luôn** vi phạm CHECK (`23514`), lỗi bị nuốt ở adapter
 * `endEnrollmentFromForm`, và người dùng thấy trang tải lại với em vẫn nằm nguyên
 * trong lớp — **không một dấu hiệu nào**. Một chức năng chưa từng chạy được lần nào.
 *
 * File thuần, không import gì ⇒ kiểm được bằng unit test. Cùng khuôn với
 * `classes/class-status.ts` và `academic-years/year-lifecycle.ts`.
 */

export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: "Đang học",
  paused: "Tạm nghỉ",
  completed: "Hoàn thành",
  repeating: "Học lại",
  transferred: "Chuyển lớp",
  withdrawn: "Đã rút",
};

/** Nhãn tiếng Việt; giá trị lạ trả nguyên văn thay vì bịa ra một cái tên. */
export function enrollmentStatusLabel(status: string): string {
  return ENROLLMENT_STATUS_LABELS[status] ?? status;
}

/**
 * BR-M03-N01 — hai trạng thái **mở**, đúng bằng những gì cơ sở dữ liệu hiểu.
 *
 * Danh sách này phải trùng khít với partial unique index
 * `enrollments_one_open_per_year` (`20260716000500:24-26`). Lệch một giá trị là lặp
 * lại đúng lỗi F10 ở một chỗ khác.
 */
export const OPEN_ENROLLMENT_STATUSES = ["active", "paused"] as const;

export function isOpenEnrollmentStatus(status: string): boolean {
  return (OPEN_ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

export type EnrollmentBadgeVariant = "success" | "warning" | "secondary";

export function enrollmentStatusBadgeVariant(status: string): EnrollmentBadgeVariant {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  return "secondary";
}

/**
 * **D-121 — sĩ số tách hai số** (chủ dự án chốt 2026-07-28).
 *
 * Trước đợt này trang lớp in `Sĩ số đang sinh hoạt: {roster.length}`, mà `roster`
 * gồm cả em `paused`. Câu đó **nói sai**: em tạm nghỉ thì không sinh hoạt. Ba đường
 * đã đặt lên bàn — (a) giữ nguyên, (b) tách hai số, (c) loại hẳn em tạm nghỉ khỏi sĩ
 * số và khỏi danh sách điểm danh. Chủ dự án chọn **(b)**: đường (c) đụng M05 Điểm
 * danh và M07 Bảng điểm — hai module **chưa tới lượt thiết kế lại** — nên sẽ phải
 * chạy lại toàn bộ kiểm thử của chúng và làm lệch số liệu báo cáo cũ.
 *
 * Hệ quả phải ghi rõ: em tạm nghỉ **vẫn còn tên trong danh sách điểm danh**. Đó là
 * nợ để lại cho M05, không phải sơ suất.
 */
export interface RosterSummary {
  /** Tổng số ghi danh đang mở — `active` + `paused`. */
  total: number;
  paused: number;
  /** Câu chữ hoàn chỉnh cho phụ đề thẻ. */
  text: string;
}

export function rosterSummary(statuses: readonly string[]): RosterSummary {
  const open = statuses.filter(isOpenEnrollmentStatus);
  const paused = open.filter((status) => status === "paused").length;
  return {
    total: open.length,
    paused,
    // Không có em nào tạm nghỉ là chuyện thường ngày ⇒ giữ câu ngắn. Thêm "· 0 tạm
    // nghỉ" vào 19 thẻ lớp là làm loãng đúng thông tin cần nổi bật.
    text:
      paused === 0
        ? `Sĩ số đang sinh hoạt: ${open.length}`
        : `Sĩ số ${open.length} · trong đó ${paused} tạm nghỉ`,
  };
}

/**
 * BR-M03-N02 — trạng thái **đóng**, bắt buộc có `ended_on`. **Không chứa `paused`.**
 *
 * Đây chính là dòng sửa lỗi F10: bản cũ để `paused` trong danh sách này.
 */
export const CLOSE_ENROLLMENT_REASONS = [
  "withdrawn",
  "completed",
  "transferred",
  "repeating",
] as const;

export type CloseEnrollmentReason = (typeof CLOSE_ENROLLMENT_REASONS)[number];

export function isCloseEnrollmentReason(value: string): value is CloseEnrollmentReason {
  return (CLOSE_ENROLLMENT_REASONS as readonly string[]).includes(value);
}

/**
 * **D-122 — giữ lý do "Chuyển lớp", nhưng nói thẳng nó KHÔNG chuyển em đi đâu cả**
 * (chủ dự án chốt 2026-07-28).
 *
 * Chọn "Chuyển" hiện chỉ đóng ghi danh ở lớp cũ: **không** tạo ghi danh ở lớp mới và
 * **không** ghi `previous_enrollment_id` (cột có từ `20260716000500:13`, chưa bao giờ
 * mang giá trị). Luồng chuyển lớp thật — đóng cũ + mở mới trong một RPC nguyên tử —
 * là WF-11, thuộc **M08 Chuyển lớp**, chưa tới lượt.
 *
 * Hai đường đã đặt lên bàn: tạm ẩn lựa chọn này, hoặc giữ và nói rõ hậu quả. Chủ dự
 * án chọn **giữ**: ẩn đi thì người đang thật sự chuyển em sang lớp khác buộc phải
 * chọn "Rút", tức **ghi sai lý do vào hồ sơ** — sai dữ liệu tệ hơn thiếu tiện lợi.
 *
 * Câu chữ trả về nêu **tên em và tên lớp**, đúng yêu cầu "hậu quả bằng tên riêng"
 * của tiêu chí nghiệm thu chung (`11` §5).
 */
export function closeReasonConsequence(
  reason: string,
  studentName: string,
  className: string,
): string {
  const base = `Kết thúc ghi danh của ${studentName} ở lớp ${className} với lý do "${enrollmentStatusLabel(reason)}".`;
  if (reason === "transferred") {
    return `${base} Thao tác này CHỈ đóng ghi danh ở lớp hiện tại — hệ thống không tự ghi danh em vào lớp mới. Bạn phải sang trang lớp mới và ghi danh cho em ở đó.`;
  }
  return `${base} Em sẽ rời khỏi sĩ số lớp. Muốn em quay lại thì phải ghi danh mới.`;
}
