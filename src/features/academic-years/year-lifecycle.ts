/**
 * Trạng thái năm học quyết định **được ghi hay không** — M02-B, TB-F07,
 * BR-M02-N09/N10.
 *
 * Trước đợt này không chỗ nào trong ứng dụng hỏi câu đó. Trang chi tiết lớp mở
 * được cho **mọi** năm học, kể cả năm đã đóng từ ba năm trước, và ghi danh thêm
 * một em vào lớp của năm đó vẫn chạy — không lỗi, không cảnh báo, không dấu hiệu
 * nào cho biết mình đang sửa quá khứ. Trang cũng không nói lớp thuộc năm nào cho
 * đủ rõ: chỉ có mã năm nằm lẫn trong dòng phụ đề.
 *
 * ✅ **M02-C đã dựng xong hàng rào ở tầng cơ sở dữ liệu** (I8 / BR-M02-N06):
 * `app.writable_academic_year_ids()` + policy INSERT/UPDATE của `enrollments` và
 * `classes` (`20260726000200`). Gọi thẳng Data API bằng JWT thật nay **không** ghi
 * được vào năm đã đóng nữa; Super Admin là ngoại lệ duy nhất (**D-117**). Các kiểm
 * tra ở tầng này **vẫn giữ** và vẫn cần: chúng cho người dùng một câu tiếng Việt nói
 * rõ vì sao bị từ chối, còn RLS thì từ chối bằng cách trả 0 dòng (SW-04).
 *
 * ⚠️ **Phạm vi hàng rào cố ý HẸP** (**D-118**): chỉ `enrollments` và `classes`.
 * Điểm danh, bảng điểm, Top 5, chuyển lớp, báo cáo **CHƯA** bị khoá theo trạng thái
 * năm học — chúng thuộc M05/M07/M08/M11, những module chưa được thiết kế lại và chưa
 * audit chéo. Nói thật ra ở đây để không ai đọc mã rồi tưởng năm đã đóng là bất khả
 * xâm phạm.
 *
 * File thuần, không import gì, không đụng máy chủ ⇒ kiểm được bằng unit test mà
 * không phải dựng cả trang Server Component. Cùng khuôn với `admin-feedback.ts`.
 */

/** Hai trạng thái còn cho ghi. `closed`/`archived` là quá khứ, chỉ đọc. */
export const WRITABLE_ACADEMIC_YEAR_STATUSES = ["draft", "current"] as const;

export function isAcademicYearWritable(status: string | null | undefined): boolean {
  return status === "draft" || status === "current";
}

export interface AcademicYearNotice {
  tone: "info" | "warning";
  title: string;
  detail: string;
}

/**
 * Dải thông báo "bạn đang xem năm nào" cho trang chi tiết lớp (BR-M02-N10).
 *
 * Trả `null` cho năm **đang áp dụng**: đó là trường hợp thường ngày, thêm một dải
 * thông báo vào mọi trang lớp chỉ làm người dùng học cách phớt lờ nó — rồi phớt lờ
 * luôn cái dải thật sự quan trọng.
 *
 * `draft` **vẫn ghi được** nhưng vẫn phải nói ra: người dùng cần biết mình đang
 * chuẩn bị cho một năm chưa áp dụng, nếu không họ ghi danh cả buổi rồi mới phát
 * hiện hệ thống đang chạy năm khác.
 */
export function academicYearNotice(
  status: string,
  yearLabel: string,
): AcademicYearNotice | null {
  if (status === "current") return null;
  if (status === "draft") {
    return {
      tone: "info",
      title: `${yearLabel} chưa được đặt hiện hành`,
      detail:
        "Đây là năm học nháp — vẫn ghi danh và cài đặt lớp được, nhưng nó chưa áp dụng cho toàn hệ thống.",
    };
  }
  return {
    tone: "warning",
    title: `${yearLabel} đã ${status === "archived" ? "lưu trữ" : "đóng"} — chỉ đọc`,
    detail:
      "Bạn đang xem dữ liệu của một năm học đã kết thúc. Không ghi danh, không kết thúc ghi danh và không sửa cài đặt lớp trong năm này.",
  };
}

// ---------------------------------------------------------------------------
// I7 / TB-F09 — bảng kiểm tiền điều kiện và luật lưu trữ.
// ---------------------------------------------------------------------------

/** Ba con số của `app.academic_year_open_work()` (WF-16 bước 1–3). */
export interface AcademicYearOpenWork {
  openEnrollments: number;
  unlockedGradebooks: number;
  openSessions: number;
}

export function totalOpenWork(work: AcademicYearOpenWork): number {
  return work.openEnrollments + work.unlockedGradebooks + work.openSessions;
}

/**
 * Bảng kiểm thành câu tiếng Việt — chỉ nêu **mục còn tồn đọng**.
 *
 * Không in ba dòng "0 …" khi mọi thứ đã xong: một bảng kiểm luôn có ba dòng thì
 * người dùng phải đọc số để biết có việc gì, còn một câu chỉ nêu cái còn dở thì đọc
 * là biết. Mảng rỗng nghĩa là **không còn việc tồn đọng**.
 */
export function openWorkPhrases(work: AcademicYearOpenWork): string[] {
  return [
    work.openEnrollments > 0 ? `${work.openEnrollments} ghi danh đang mở` : null,
    work.unlockedGradebooks > 0 ? `${work.unlockedGradebooks} bảng điểm chưa khoá` : null,
    work.openSessions > 0 ? `${work.openSessions} buổi điểm danh chưa chốt` : null,
  ].filter((value): value is string => value !== null);
}

/**
 * **D-120 / BR-M02-N07** — lưu trữ được hay chưa.
 *
 * Chủ dự án chốt 2026-07-26: `retention_until` (ngày kết thúc năm học + 5 năm)
 * **chặn** lưu trữ trước hạn. Hệ quả đã nêu rõ khi hỏi: một năm học đóng hôm nay
 * chỉ lưu trữ được sau 5 năm, nên trên dữ liệu thật nút này gần như không xuất hiện
 * — và đó là chủ ý, vì lưu trữ là thao tác **một chiều** (hệ thống chưa có luồng bỏ
 * lưu trữ).
 *
 * So sánh ở đây chỉ để **hiện/ẩn nút**; chốt chặn thật là `archive_academic_year`,
 * nơi dùng `current_date` của máy chủ cơ sở dữ liệu.
 */
export function canArchiveAcademicYear(
  status: string,
  retentionUntil: string | null,
  today: string,
): boolean {
  if (status !== "closed" || !retentionUntil) return false;
  return today > retentionUntil;
}
