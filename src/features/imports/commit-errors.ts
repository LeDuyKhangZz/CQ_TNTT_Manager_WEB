/**
 * Dịch lỗi ghi của cơ sở dữ liệu ra tiếng Việt — M12-A, **AC-26 / SEC-16**.
 *
 * 🔴 Trước đợt này trang chi tiết in **thẳng `commit_error`** ra màn hình
 * (`[batchId]/page.tsx:90`), mà cột đó chứa nguyên văn `sqlerrm`. Người nhập dữ
 * liệu — Thư ký xứ đoàn — nhận những câu như *"new row for relation
 * \"enrollments\" violates check constraint …"*: vừa không hiểu để sửa, vừa lộ
 * tên bảng và tên ràng buộc ra màn hình, đúng điều `08_ACCEPTANCE_CRITERIA` §C
 * ghi là **"hiện đang vi phạm"** (SEC-16).
 *
 * Hai nguyên tắc của file này:
 *
 *   1. **Không bao giờ trả câu gốc ra giao diện.** Mã lạ rơi vào câu chung. Câu
 *      gốc **vẫn nằm nguyên trong `import_rows.commit_error`** cho người quản
 *      trị tra khi cần — giấu khỏi màn hình không phải là vứt đi.
 *   2. **Nói việc phải làm tiếp**, không chỉ nói cái gì hỏng. Người đọc câu này
 *      đang cầm một file Excel 300 dòng và cần biết sửa ô nào.
 *
 * ⚠️ `STUDENT_NOT_ACTIVE` là mã quan trọng nhất ở đây và nó **mới có từ M03-C**
 * (trigger `enrollments_need_active_student`, BR-M03-N13). Luồng nhập Excel ghi
 * thẳng vào `enrollments`, nên một dòng ghép vào hồ sơ đã rút/lưu trữ sẽ nhận
 * đúng mã đó — `WORKLOG` của M03-C đã dặn trước rằng M12 phải dịch nó ra, đừng
 * để nó thành "lỗi không rõ".
 *
 * File thuần ⇒ kiểm được bằng unit test.
 */

const COMMIT_ERROR_TEXT: Record<string, string> = {
  // Ghép vào một hồ sơ không còn sinh hoạt — trigger của M03-C từ chối ghi danh.
  STUDENT_NOT_ACTIVE:
    'Hồ sơ được chọn để ghép không còn sinh hoạt (đã rút hoặc đã lưu trữ) nên không ghi danh được. Hãy khôi phục hồ sơ em ở trang Thiếu nhi rồi nhập lại, hoặc đổi dòng này sang "Tạo mới" nếu đây là em khác.',
  STUDENT_NOT_FOUND:
    "Không tìm thấy hồ sơ được chọn để ghép — có thể hồ sơ vừa bị xoá ở một cửa sổ khác. Hãy tải lại trang và chọn lại.",
  MERGE_TARGET_MISSING:
    'Hồ sơ được chọn để ghép không còn tồn tại. Hãy đổi dòng này sang "Tạo mới" hoặc chọn lại hồ sơ đối chiếu.',
  // Lớp: ba mã của trigger validate_enrollment + một mã của chính RPC import.
  CLASS_NOT_RESOLVED:
    "Dòng này chưa xác định được lớp. Hãy ghi tên lớp đúng như danh sách lớp của năm học hiện tại rồi tải lại file.",
  CLASS_NOT_FOUND:
    "Lớp của dòng này không còn tồn tại. Hãy tải lại file với tên lớp thuộc năm học hiện tại.",
  CLASS_YEAR_MISMATCH:
    "Lớp của dòng này không thuộc năm học của lần nhập. Hãy kiểm tra lại tên lớp trong file.",
  CLASS_NOT_ACTIVE:
    "Lớp của dòng này đã đóng hoặc tạm ngưng nên không nhận thêm thiếu nhi. Hãy chọn lớp khác hoặc mở lại lớp ở trang Lớp học.",
  GUARDIAN_PHONE_REQUIRED:
    "Dòng này chưa có số điện thoại phụ huynh, mà hệ thống cần số đó để liên lạc khi em ốm giữa buổi học. Hãy bổ sung số điện thoại cha, mẹ hoặc người giám hộ rồi tải lại file.",
  ROW_NOT_NORMALIZED:
    "Dòng này chưa được kiểm tra xong nên chưa ghi được. Hãy tải lại file và kiểm tra lại.",
  // Năm học đã đóng (D-117/D-118) — chỉ gặp khi năm học bị đóng giữa chừng.
  YEAR_NOT_WRITABLE:
    "Năm học của lần nhập này đã đóng nên không ghi thêm được. Hãy mở đúng năm học hiện hành rồi nhập lại.",
  ACADEMIC_YEAR_CLOSED:
    "Năm học của lần nhập này đã đóng nên không ghi thêm được. Hãy mở đúng năm học hiện hành rồi nhập lại.",
};

/** Họ lỗi của Postgres, nhận ra bằng câu mở đầu cố định của `sqlerrm`. */
const SQL_ERROR_PATTERNS: { test: RegExp; text: string }[] = [
  {
    test: /duplicate key value|already exists/i,
    text: "Dữ liệu của dòng này đã tồn tại trong hệ thống nên không ghi thêm được. Hãy kiểm tra xem em đã có hồ sơ chưa và chọn Ghép hồ sơ có sẵn.",
  },
  {
    test: /null value in column/i,
    text: "Dòng này còn thiếu một thông tin bắt buộc. Hãy kiểm tra họ tên, giới tính, ngày sinh và lớp rồi tải lại file.",
  },
  {
    test: /violates check constraint|invalid input syntax|invalid input value/i,
    text: "Một ô của dòng này có giá trị không hợp lệ. Hãy kiểm tra lại ngày tháng, số điện thoại và giới tính rồi tải lại file.",
  },
  {
    test: /violates foreign key constraint/i,
    text: "Dòng này trỏ tới một dữ liệu không còn tồn tại (lớp hoặc hồ sơ đối chiếu). Hãy tải lại trang và kiểm tra lại.",
  },
  {
    test: /permission denied|row-level security|42501/i,
    text: "Bạn không có quyền ghi dòng này. Hãy nhờ Xứ đoàn trưởng, Phó Xứ đoàn hoặc Thư ký thực hiện.",
  },
];

const FALLBACK_TEXT =
  "Không ghi được dòng này. Hãy kiểm tra lại dữ liệu của dòng rồi thử lại; nếu vẫn lỗi, báo Quản trị viên hệ thống kèm số dòng.";

/**
 * Câu tiếng Việt cho một `commit_error`.
 *
 * `null` vào thì `null` ra (dòng không lỗi). Mọi trường hợp khác **luôn** ra một
 * câu tiếng Việt — không có nhánh nào trả lại chuỗi gốc.
 */
export function commitErrorText(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "") return null;

  // `raise exception 'X'` cho `sqlerrm` đúng bằng "X"; vài chỗ ghi thêm phần mô
  // tả sau dấu hai chấm ("YEAR_HAS_OPEN_WORK: …") nên cắt ở đó.
  const token = trimmed.split(":")[0].trim().toUpperCase();
  const known = COMMIT_ERROR_TEXT[token];
  if (known) return known;

  for (const pattern of SQL_ERROR_PATTERNS) {
    if (pattern.test.test(trimmed)) return pattern.text;
  }
  return FALLBACK_TEXT;
}
