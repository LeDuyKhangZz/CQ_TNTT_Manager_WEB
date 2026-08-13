/**
 * Câu chữ phản hồi của luồng nhập Excel — M12-A, **TO-BE 1 / BR-M12-30 / D-61**,
 * đóng lỗi CRITICAL 4.1.
 *
 * 🔴 Gốc rễ của lỗi ấy không phải là thiếu câu chữ — **câu chữ đã có sẵn từ
 * Phase 2 và viết rất kỹ** (`parse.ts:199-204`: *"Sheet chỉ có danh sách tên,
 * thiếu ngày sinh nên không đủ để import…"*). Cái thiếu là **người nhận**: cả
 * năm biểu mẫu của module đều `await` rồi **vứt** giá trị trả về, vì hai trang
 * là Server Component thuần nên `<form action={…}>` bắt buộc chữ ký
 * `(formData) => Promise<void>`. Người dùng bấm "Kiểm tra file" xong nhìn thấy
 * **đúng trang cũ**, không biết đã xong hay chưa.
 *
 * Vì thế đợt này đổi mô hình sang `useActionState` (Phương án A của TO-BE 1,
 * cùng khuôn D-114 đã dùng cho `/admin`) — và file này là nơi chứa **mọi** câu
 * chữ đi ra màn hình, tách khỏi tầng server để kiểm được bằng unit test thường.
 *
 * ⚠️ Không dùng lại `students/student-feedback.ts`: nhóm quyền khác nhau (nhập
 * Excel chỉ mở cho **bốn vai trò ghi toàn xứ đoàn**), nên câu từ chối phải kể
 * đúng danh sách ấy. Dùng chung từ điển là nói sai sự thật với người bị từ chối.
 *
 * File thuần, không import gì từ tầng server ⇒ kiểm được bằng unit test.
 */

export type ImportFeedbackTone = "success" | "danger" | "info";

export interface ImportFeedback {
  tone: ImportFeedbackTone;
  text: string;
  /** Từng dòng ghi hỏng — AC-15 đòi liệt kê `#số dòng — lý do`, không chỉ đếm. */
  failures?: { rowNumber: number; message: string }[];
}

export const IMPORT_FORBIDDEN_TEXT =
  "Bạn không có quyền nhập dữ liệu Excel. Việc này dành cho Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký và Quản trị viên hệ thống.";

/** Ghi 0 dòng vẫn báo thành công là lỗi kinh điển của mô hình RLS (SW-04). */
export const IMPORT_NO_CHANGE_TEXT =
  "Không có gì thay đổi. Có thể lần nhập này vừa được người khác xử lý — hãy tải lại trang.";

export function uploadFailureFeedback(message: string): ImportFeedback {
  return { tone: "danger", text: message };
}

/**
 * Kết quả một lượt ghi — AC-15.
 *
 * Ba con số tách riêng vì chúng nói ba chuyện khác nhau: **ghi được**, **bỏ qua
 * theo quyết định của người duyệt**, và **hỏng**. Gộp "bỏ qua" vào "hỏng" là vu
 * cho người dùng một lỗi mà chính họ vừa cố ý chọn.
 */
export function commitFeedback(summary: {
  committed: number;
  skipped: number;
  failed: number;
  failures: { rowNumber: number; message: string }[];
  /** M12-C / TO-BE 6 / AC-24 — hồ sơ vào được nhưng lớp trong file không áp dụng. */
  enrollmentSkipped?: number;
  enrollmentSkippedSample?: number[];
}): ImportFeedback {
  const parts = [`Đã ghi ${summary.committed} dòng vào hệ thống`];
  if (summary.skipped > 0) parts.push(`bỏ qua ${summary.skipped} dòng`);
  parts.push(`lỗi ${summary.failed} dòng`);
  const text = `${parts.join(" · ")}.`;

  /**
   * 🔴 Câu này là **toàn bộ** giá trị của TO-BE 6. Trước đợt này việc "em đã có
   * lớp nên lớp trong file không được áp dụng" xảy ra hoàn toàn im lặng: dòng
   * báo *đã ghi*, mà Giáo lý viên lớp mới thì không bao giờ thấy em. Nói ra
   * **kèm số dòng cụ thể** để người nhập mở đúng chỗ mà đối chiếu — và nói luôn
   * việc phải làm, vì đổi lớp là việc của trang Lớp học chứ không phải của file.
   */
  const enrollmentCount = summary.enrollmentSkipped ?? 0;
  const enrollmentText =
    enrollmentCount > 0
      ? ` ⚠️ ${enrollmentCount} em đã có ghi danh đang mở từ trước (${(
          summary.enrollmentSkippedSample ?? []
        )
          .map((rowNumber) => `#${rowNumber}`)
          .join(", ")}${
          enrollmentCount > (summary.enrollmentSkippedSample ?? []).length ? "…" : ""
        }) nên lớp ghi trong file KHÔNG được áp dụng cho các em đó. Hồ sơ vẫn đúng; muốn chuyển lớp thì làm ở trang Lớp học.`
      : "";

  if (summary.failed > 0) {
    return {
      tone: "danger",
      text: `${text} Các dòng lỗi vẫn nằm nguyên trong lần nhập này, sửa file rồi tải lên lại là được.${enrollmentText}`,
      failures: summary.failures,
    };
  }
  if (summary.committed === 0) {
    return { tone: "info", text };
  }
  // Ghi được hết mà vẫn có em không đổi được lớp thì **không phải** một lượt
  // thành công trọn vẹn: để tone "success" là mời người dùng đóng màn hình lại.
  return { tone: enrollmentCount > 0 ? "info" : "success", text: `${text}${enrollmentText}` };
}

/** D-131 — huỷ là **đánh dấu**, không xoá; câu chữ phải nói đúng điều đó. */
export function cancelFeedback(rows: number): ImportFeedback {
  return {
    tone: "success",
    text: `Đã huỷ lần nhập này. ${rows} dòng đã kiểm tra không được ghi vào hệ thống, nhưng lần nhập vẫn được giữ lại trong danh sách để tra cứu.`,
  };
}

/** D-132 — xoá dữ liệu thô giữ nguyên sổ "dòng nào tạo ra em nào". */
export function purgeRawFeedback(rows: number): ImportFeedback {
  return {
    tone: "success",
    text: `Đã xoá dữ liệu thô của ${rows} dòng. Hồ sơ đã tạo và mối nối "dòng nào tạo ra em nào" vẫn được giữ nguyên.`,
  };
}

export function rowSavedFeedback(text: string): ImportFeedback {
  return { tone: "success", text };
}

export interface RowEditsSummary {
  saved: number;
  /** Số dòng nghi trùng chắc chắn bị bỏ qua vì D-133 đòi xác nhận **từng dòng**. */
  blocked: number[];
  failures: { rowNumber: number; message: string }[];
}

/**
 * Kết quả một lượt "Lưu tất cả thay đổi" — M12-B, **TO-BE 4 / AC-21**.
 *
 * 🔴 Câu chữ ở đây phải nói ra được **ba** chuyện khác nhau, vì gộp chúng lại là
 * cách nhanh nhất để người duyệt tưởng mình đã xong trong khi chưa:
 *
 *   1. **Đã lưu bao nhiêu dòng** — con số thật, đếm bằng số dòng cơ sở dữ liệu
 *      trả về chứ không phải số dòng gửi lên (SW-04: RLS từ chối bằng 0 dòng,
 *      không bằng lỗi).
 *   2. **Dòng nào cố ý không lưu** — dòng nghi trùng chắc chắn. Đây không phải
 *      lỗi và cũng không phải im lặng bỏ qua: **D-133** đòi người duyệt nhìn tận
 *      mắt từng dòng ấy, nên câu chữ phải chỉ đúng chỗ bấm.
 *   3. **Dòng nào hỏng thật** — kèm số dòng, đúng khuôn AC-15 của lượt ghi.
 */
export function rowEditsFeedback(summary: RowEditsSummary): ImportFeedback {
  const blockedText =
    summary.blocked.length > 0
      ? ` Còn ${summary.blocked.length} dòng nghi trùng chắc chắn (${summary.blocked
          .slice(0, 5)
          .map((rowNumber) => `#${rowNumber}`)
          .join(", ")}${summary.blocked.length > 5 ? "…" : ""}) chưa lưu cách xử lý: mở dòng đó ra, đối chiếu hồ sơ đã có rồi bấm "Xác nhận dòng này". Cách xử lý của dòng trùng chắc chắn không lưu hàng loạt được.`
      : "";

  if (summary.failures.length > 0) {
    return {
      tone: "danger",
      text: `Đã lưu ${summary.saved} dòng · ${summary.failures.length} dòng không lưu được.${blockedText}`,
      failures: summary.failures,
    };
  }

  if (summary.saved === 0) {
    return {
      tone: "info",
      text: `Không có thay đổi nào để lưu.${
        blockedText || " Hãy chọn giới tính hoặc cách xử lý cho ít nhất một dòng rồi lưu lại."
      }`,
    };
  }

  return {
    tone: summary.blocked.length > 0 ? "info" : "success",
    text: `Đã lưu ${summary.saved} dòng.${blockedText}`,
  };
}

export function importFailureFeedback(message?: string): ImportFeedback {
  return {
    tone: "danger",
    text: message && message.trim() !== "" ? message : "Không thực hiện được thao tác. Vui lòng thử lại.",
  };
}
