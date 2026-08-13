/**
 * Dịch lỗi phân công lớp sang câu tiếng Việt NÊU TÊN (TB-M04-00, AC-01.4).
 *
 * Trước M04-A, ba lối ghi của `/staff` gộp mọi thất bại vào đúng một câu:
 * *"Không lưu được phân công (người này đã có lớp đang phục vụ, hoặc dữ liệu
 * chưa đúng)."* — câu đó liệt kê hai khả năng rồi để người dùng tự đoán, trong
 * khi cơ sở dữ liệu đã biết chính xác lý do. AC-01.4 đòi ngược lại: *"Lớp Ấu 1A
 * đã có Giáo lý viên đại diện. Hãy kết thúc phân công của người hiện tại
 * trước."* — nêu tên lớp, nêu việc phải làm tiếp.
 *
 * Hàm thuần, không đụng mạng/DB, nên kiểm được bằng unit test.
 *
 * 🔴 Nhận dạng `23505` phải soi TÊN INDEX trong `message`, không chỉ mã lỗi.
 * Hai ràng buộc rất khác nhau cùng mang mã `23505`: "một người một lớp" và "một
 * lớp một Đại diện". Đọc nhầm nghĩa là bảo người dùng đi kết thúc phân công của
 * chính người mình đang chuyển, trong khi thứ chắn đường là Đại diện cũ của lớp
 * đích. Mã lỗi nghiệp vụ (`CLASS_NOT_ACTIVE`, `SAME_CLASS`…) do chính RPC/trigger
 * `raise` nên nằm trong `message`, cũng đọc theo cách này.
 */

/** Phần lỗi mà `postgrest-js` trả về; chỉ hai trường này là cần. */
export interface PostgresErrorLike {
  code?: string | null;
  message?: string | null;
}

export interface AssignmentErrorContext {
  /** Tên người đang được thao tác, đã ghép danh xưng. */
  staffName: string;
  /** Lớp ĐÍCH của thao tác (phân công vào / chuyển sang). */
  targetClassName?: string | null;
  /** Lớp người đó đang phục vụ, nếu có. */
  currentClassName?: string | null;
  /** Ngày bắt đầu của phân công đang bị đụng tới, dạng `yyyy-mm-dd`. */
  startsOn?: string | null;
}

const FALLBACK = "Không lưu được phân công. Vui lòng kiểm tra lại thông tin.";

function viDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const [y, m, d] = value.split("-");
  return d && m && y ? `${d}/${m}/${y}` : value;
}

function classLabel(name: string | null | undefined): string {
  return name ? `lớp ${name}` : "lớp đã chọn";
}

export function assignmentErrorMessage(
  error: PostgresErrorLike | null | undefined,
  context: AssignmentErrorContext,
): string {
  if (!error) return FALLBACK;
  const code = error.code ?? "";
  const raw = error.message ?? "";
  const name = context.staffName || "Người này";

  if (code === "42501") {
    return "Bạn không có quyền thực hiện thao tác này.";
  }
  if (code === "P0002" || raw.includes("ASSIGNMENT_NOT_FOUND")) {
    return "Phân công không còn tồn tại hoặc đã được kết thúc. Hãy tải lại trang.";
  }
  if (code === "23505") {
    if (raw.includes("class_staff_one_active_representative_idx")) {
      return `${capitalize(classLabel(context.targetClassName))} đã có Giáo lý viên đại diện. Hãy kết thúc phân công của người hiện tại trước.`;
    }
    if (raw.includes("class_staff_one_active_class_per_staff_idx")) {
      const current = context.currentClassName
        ? `đang phục vụ tại lớp ${context.currentClassName}`
        : "đang phục vụ tại một lớp khác";
      return `${name} ${current}. Hãy kết thúc phân công cũ trước.`;
    }
    return `${name} đã có một phân công trùng với phân công vừa nhập.`;
  }
  if (raw.includes("CLASS_NOT_ACTIVE")) {
    return `${capitalize(classLabel(context.targetClassName))} không còn hoạt động, không nhận thêm phân công.`;
  }
  if (raw.includes("ROLE_CAPACITY_MISMATCH")) {
    const current = context.currentClassName ? ` ở lớp ${context.currentClassName}` : "";
    return `${name} đang giữ một vai trò đăng nhập${current} không khớp với vai trò trong lớp vừa chọn. Hãy đổi vai trò cho khớp trước.`;
  }
  if (raw.includes("ACTIVE_CLASS_ROLE_EXISTS")) {
    return `Không kết thúc được phân công khi ${name} còn vai trò đăng nhập của lớp đó. Hãy dùng "Chuyển lớp" nếu bạn muốn đổi lớp mà giữ tài khoản.`;
  }
  if (raw.includes("INVALID_END_DATE")) {
    const from = viDate(context.startsOn);
    return from
      ? `Ngày kết thúc không được trước ngày bắt đầu (${from}).`
      : "Ngày kết thúc không được trước ngày bắt đầu phân công.";
  }
  if (raw.includes("INVALID_EFFECTIVE_DATE")) {
    const from = viDate(context.startsOn);
    return from
      ? `Ngày chuyển lớp không được trước ngày bắt đầu phân công hiện tại (${from}).`
      : "Ngày chuyển lớp không được trước ngày bắt đầu phân công hiện tại.";
  }
  if (raw.includes("SAME_CLASS")) {
    return `${name} đang phục vụ chính ${classLabel(context.targetClassName)}. Hãy chọn một lớp khác.`;
  }
  if (raw.includes("ACTIVE_CLASS_ASSIGNMENT_REQUIRED")) {
    return `${name} chưa được phân công vào ${classLabel(context.targetClassName)} với đúng vai trò. Hãy phân công trước.`;
  }
  return FALLBACK;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
