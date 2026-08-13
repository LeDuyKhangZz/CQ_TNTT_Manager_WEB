/**
 * Câu chữ phản hồi cho hồ sơ thiếu nhi và người giám hộ — M03-A, TB-F14 /
 * BR-M03-N10 · N11, D-61.
 *
 * Đợt này đóng **sáu thao tác ghi im lặng**: tạo hồ sơ · sửa hồ sơ · lưu sức khỏe ·
 * thêm bí tích · tạo giám hộ · sửa giám hộ. Cả sáu adapter `*FromForm` trước đây trả
 * `Promise<void>` — kết quả bị vứt bỏ ngay tại chỗ nhận (BR-M03-38).
 *
 * Hai họ lỗi khác nhau, cùng biểu hiện là "bấm xong không thấy gì":
 *
 *   1. **Nuốt kết quả** — action trả `{ok:false}` nhưng adapter không đọc.
 *   2. **Ghi 0 dòng vẫn báo thành công** — `.update().eq()` không kèm `.select()`.
 *      Trong mô hình RLS, **quyền bị từ chối biểu hiện dưới dạng 0 dòng, không phải
 *      exception** (5W-F05/F08). Bài học này đã ghi cho luồng *đọc* từ Phase 2
 *      nhưng chưa từng áp cho luồng *ghi*.
 *
 * Hồ sơ thiếu nhi và hồ sơ giám hộ dùng chung file vì chúng **dùng chung đúng một
 * cổng quyền** (`requireStudentWrite`) và cùng nằm trên `/students` — nói khác nhau
 * về quyền ở hai chỗ là gieo nhầm lẫn.
 *
 * File thuần, không import gì ⇒ kiểm được bằng unit test.
 */

export type StudentFeedbackTone = "success" | "danger";

export interface StudentFeedback {
  tone: StudentFeedbackTone;
  text: string;
}

export type StudentFailedCode =
  | "forbidden"
  | "forbidden_sensitive"
  | "forbidden_archive"
  | "forbidden_delete_sacrament"
  | "not_found"
  | "no_change"
  | "needs_class"
  | "class_unavailable"
  | "duplicate_sacrament"
  | "open_enrollment"
  | "student_not_active"
  | "enrollment_locked"
  | "guardian_has_students"
  | "invalid";

const FAILURE_TEXT: Record<StudentFailedCode, string> = {
  // D-63/D-123 — câu này phải kể đúng danh sách mới, nếu không một Trưởng ngành
  // vừa được trao quyền lại đọc được câu nói rằng họ không có quyền.
  forbidden:
    "Bạn không có quyền ghi hồ sơ thiếu nhi. Việc này dành cho Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký, Quản trị viên hệ thống, và Trưởng/Phó ngành trong ngành mình.",
  // D-127 — sau khi nới, danh sách này rộng hơn danh sách ghi hồ sơ ở một đầu
  // (thêm Giáo lý viên) và hẹp hơn ở đầu kia (Dự trưởng phụ tá vẫn chỉ đọc).
  // Câu phải kể đúng, nếu không người vừa được trao quyền lại đọc câu từ chối.
  forbidden_sensitive:
    "Bạn không có quyền ghi hồ sơ sức khoẻ và bí tích. Việc này dành cho Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký, Quản trị viên hệ thống, Trưởng/Phó ngành và Giáo lý viên — mỗi người trong phạm vi lớp hoặc ngành của mình.",
  // TB-F06 / `docs/05` §5 — lưu trữ hẹp hơn sửa hồ sơ. Nói thẳng ra vì người
  // đọc câu này (Trưởng ngành) vừa sửa được hồ sơ ở ô ngay bên cạnh.
  forbidden_archive:
    "Bạn không có quyền chuyển hồ sơ sang \"Đã rút\" hoặc \"Lưu trữ\". Việc này dành cho Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký và Quản trị viên hệ thống. Bạn vẫn chuyển được em sang \"Tạm nghỉ\".",
  // D-128 — xoá hẹp hơn ghi một bậc.
  forbidden_delete_sacrament:
    "Bạn không có quyền xoá bản ghi bí tích. Việc này dành cho Xứ đoàn trưởng, Phó Xứ đoàn, Thư ký và Quản trị viên hệ thống. Bạn vẫn sửa được bản ghi.",
  not_found: "Không tìm thấy hồ sơ này. Có thể nó vừa bị đổi ở một cửa sổ khác — hãy tải lại trang.",
  no_change:
    "Không có dòng nào được cập nhật. Hồ sơ có thể không còn tồn tại, hoặc bạn không đủ quyền sửa nó.",
  // D-123 — không phải "không có quyền" mà là "còn thiếu một ô". Hai câu khác
  // nhau: một câu bảo người dùng đi tìm người khác, câu kia bảo họ chọn lớp.
  needs_class:
    "Trưởng ngành và Phó ngành phải chọn lớp trong ngành mình khi tạo hồ sơ. Nếu chưa biết xếp em vào lớp nào, hãy nhờ Thư ký tạo hồ sơ trước.",
  class_unavailable:
    "Lớp đã chọn không nhận ghi danh: lớp không còn hoạt động, hoặc năm học của lớp đã đóng.",
  // BR-M03-24 — unique index chống trùng loại bí tích chạy đúng từ đầu
  // (`20260716000100:101-103`), nhưng lỗi bị nuốt nên trải nghiệm là "bấm không có
  // gì xảy ra" (F08, AC-F08-02).
  duplicate_sacrament:
    "Em này đã có bản ghi cho loại bí tích đó. Mỗi loại chỉ ghi một lần — hãy kiểm tra lại danh sách bên cạnh.",
  // BR-M03-N12 — lưới an toàn của cơ sở dữ liệu nói ra bằng tiếng Việt. Câu này
  // chỉ tới được người dùng khi họ gọi thẳng action (bỏ qua giao diện), vì hộp
  // xác nhận đã hỏi trước; giữ nó vì "ẩn nút không phải authorization".
  open_enrollment:
    "Em vẫn còn ghi danh đang mở ở một lớp. Hãy tick ô \"Đồng thời kết thúc ghi danh\", hoặc kết thúc ghi danh ở trang lớp trước.",
  // BR-M03-N13 / AC-F06-04 — chiều ngược lại của cùng một luật.
  student_not_active:
    "Chỉ ghi danh được em có hồ sơ đang sinh hoạt. Hãy chuyển hồ sơ của em về \"Đang sinh hoạt\" trước, hoặc dùng nút \"Khôi phục\" nếu em đang tạm nghỉ.",
  // D-117/D-118 (M02-C) — hàng rào năm học nằm trong RLS của `enrollments`, nên
  // nó từ chối bằng 0 dòng. Không có câu này thì người dùng chỉ thấy "thất bại".
  enrollment_locked:
    "Không sửa được ghi danh của em: ghi danh thuộc một năm học đã đóng, hoặc bạn không quản lý lớp đó.",
  // BR-M03-N17 — không vô hiệu hoá người giám hộ còn con đang sinh hoạt.
  guardian_has_students:
    "Không thể ngừng sử dụng hồ sơ phụ huynh này: vẫn còn thiếu nhi đang sinh hoạt gắn với họ. Hãy chuyển các em sang phụ huynh khác trước.",
  invalid: "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
};

export function studentFailureFeedback(
  code: StudentFailedCode,
  message?: string | null,
): StudentFeedback {
  return { tone: "danger", text: message?.trim() || FAILURE_TEXT[code] || FAILURE_TEXT.invalid };
}

/**
 * AC-F14-01 — câu thành công phải nêu **tên em và mã `CQxxxx`**.
 *
 * Mã do cơ sở dữ liệu sinh ra bằng sequence (BR-M03-01), tức người nhập **không**
 * biết trước nó. Đây là lần duy nhất mã hiện ra ngay sau khi tạo; không in nó thì
 * phải đi tìm lại em vừa nhập trong danh sách ~900 hồ sơ.
 */
export function studentCreatedFeedback(
  studentName: string,
  studentCode: string,
  className?: string | null,
): StudentFeedback {
  // BR-M03-N19 / D-123 — khi hồ sơ và ghi danh sinh ra cùng lúc thì câu thành
  // công phải nói **cả hai việc**. Chỉ báo "đã tạo hồ sơ" trong khi hệ thống vừa
  // ghi danh em vào một lớp là bỏ sót đúng nửa quan trọng hơn.
  const enrolled = className ? ` Đã ghi danh vào lớp ${className}.` : "";
  return {
    tone: "success",
    text: `Đã tạo hồ sơ ${studentName} · mã thiếu nhi ${studentCode}.${enrolled}`,
  };
}

/**
 * BR-M03-N19 — hồ sơ tạo xong mà **chưa xếp lớp** thì phải mời xếp ngay, kèm
 * đường dẫn. Trước M03-B, người nhập tạo hồ sơ xong bị bỏ lại giữa chừng: WF-03
 * mô tả một luồng liền, còn thực tế phải đi qua ba đến bốn màn hình (F02, C3=3).
 */
export function studentCreatedUnassignedFeedback(
  studentName: string,
  studentCode: string,
): StudentFeedback {
  return {
    tone: "success",
    text: `Đã tạo hồ sơ ${studentName} · mã thiếu nhi ${studentCode}. Em chưa được xếp lớp — mở hồ sơ để ghi danh.`,
  };
}

export function studentSavedFeedback(studentName: string): StudentFeedback {
  return { tone: "success", text: `Đã lưu hồ sơ ${studentName}.` };
}

export function healthSavedFeedback(): StudentFeedback {
  return { tone: "success", text: "Đã lưu thông tin sức khỏe." };
}

export function sacramentSavedFeedback(label: string): StudentFeedback {
  return { tone: "success", text: `Đã lưu bí tích ${label}.` };
}

export function guardianCreatedFeedback(guardianName: string): StudentFeedback {
  return {
    tone: "success",
    text: `Đã tạo người giám hộ ${guardianName}. Bây giờ chọn tên này ở biểu mẫu "Thêm thiếu nhi".`,
  };
}

/**
 * TB-F12 / BR-M03-N15 — **M03-C**. M03-A cố ý chưa viết hàm này ("không viết sẵn
 * hàm cho màn hình chưa có"); nay màn hình đã có nên nó ra đời cùng chỗ gọi.
 */
export function guardianSavedFeedback(guardianName: string): StudentFeedback {
  return { tone: "success", text: `Đã lưu thông tin liên lạc của ${guardianName}.` };
}

/**
 * 🔴 **AC-F12-02 — câu này là một cảnh báo BẢO MẬT, không phải một lời nhắc.**
 *
 * `students.guardian_id` là đường nối duy nhất giữa một em và tài khoản phụ
 * huynh: `app.own_student_ids()` nối theo `guardians.profile_id`. Đổi ô này là
 * **đổi ngay quyền đọc của hai con người thật** — phụ huynh cũ mất, phụ huynh
 * mới được — và không có màn hình nào khác trong hệ thống làm điều đó.
 *
 * Vì thế hộp xác nhận phải gọi **đủ ba cái tên**, đúng như tiêu chí nghiệm thu
 * đòi: em nào, ai mất quyền, ai được quyền.
 */
export function guardianChangeConsequence(
  studentName: string,
  fromGuardianName: string | null,
  toGuardianName: string,
): string {
  const lost = fromGuardianName
    ? `Phụ huynh ${fromGuardianName} sẽ KHÔNG còn xem được ${studentName} trong cổng phụ huynh`
    : `${studentName} hiện chưa gắn với phụ huynh nào có tài khoản`;
  return `${lost}; phụ huynh ${toGuardianName} sẽ xem được em. Thay đổi có hiệu lực ngay khi bạn xác nhận.`;
}

export function guardianChangedFeedback(
  studentName: string,
  toGuardianName: string,
): StudentFeedback {
  return {
    tone: "success",
    text: `Đã đổi người giám hộ của ${studentName} sang ${toGuardianName}. Từ bây giờ chỉ phụ huynh này xem được em trong cổng phụ huynh.`,
  };
}

export function sacramentDeletedFeedback(label: string): StudentFeedback {
  return { tone: "success", text: `Đã xoá bản ghi bí tích ${label}.` };
}
