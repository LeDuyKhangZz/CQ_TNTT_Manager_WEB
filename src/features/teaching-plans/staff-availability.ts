/**
 * Ai được chọn làm người dạy vào một ngày cụ thể — M06-A, **TB-M06-03**.
 *
 * Luật đã nằm ở cơ sở dữ liệu từ Phase 4 (`app.validate_teaching_plan_item`):
 * người dạy phải có phân công đội ngũ lớp **còn hiệu lực tại đúng ngày của mục**
 * (`starts_on <= planned_date <= ends_on`). Nhưng ô chọn trên màn hình chỉ lọc
 * `is_active`, nên nó **mời** người dùng chọn một nhân sự đã hết nhiệm kỳ rồi
 * để cơ sở dữ liệu từ chối — mà câu từ chối ấy, trước đợt này, là
 * *"Dữ liệu không hợp lệ. Vui lòng kiểm tra lại."*
 *
 * 🔴 **Cái bẫy của việc chỉ lọc rồi thôi, và nó nguy hiểm hơn lỗi đang sửa.**
 * `<select>` đang giữ một giá trị mà giá trị ấy biến khỏi danh sách thì trình
 * duyệt **âm thầm** nhảy về lựa chọn đầu tiên. Kịch bản thật: mở một mục cũ do
 * chị Lan dạy, chỉ đổi mỗi **ngày** sang tuần sau — nếu phân công của chị Lan
 * vừa kết thúc, ô người dạy tự đổi sang một người khác **mà không ai bấm gì**,
 * và lượt lưu ghi đè người dạy bằng một cái tên người dùng chưa từng chọn.
 * Nên hàm này không vứt người đang được chọn đi: nó **tách riêng** ra để màn
 * hình còn giữ được lựa chọn ấy và nói rõ vì sao nó bất thường.
 *
 * Hàm thuần, không import runtime nào, để kiểm được bằng unit test.
 */

export interface TeachingStaffAvailability {
  startsOn: string;
  endsOn: string | null;
}

/** Ngày dạng `yyyy-MM-dd` so sánh được bằng phép so chuỗi, không cần `Date`. */
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Ô `<input type="date">` trả về **chuỗi rỗng** trong lúc người dùng còn đang
 * gõ dở. `formatDateVi` gọi thẳng `new Date(value)` nên với chuỗi ấy nó in ra
 * *"Invalid Date"* giữa một câu tiếng Việt — kiểm trước khi in.
 */
export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

export function isStaffAvailableOn(staff: TeachingStaffAvailability, date: string): boolean {
  if (!ISO_DATE.test(date)) return true;
  if (staff.startsOn > date) return false;
  return staff.endsOn === null || staff.endsOn >= date;
}

export interface TeachingStaffPartition<T> {
  /** Chọn được: cơ sở dữ liệu sẽ chấp nhận. */
  available: T[];
  /**
   * Người **đang được chọn** nhưng không phụ trách lớp vào ngày ấy. `null` khi
   * không có ca đó. Màn hình vẫn phải hiện, kèm lời cảnh báo — xem ghi chú đầu
   * file.
   */
  keptSelected: T | null;
}

/**
 * Chia danh sách nhân sự của lớp theo ngày dự kiến.
 *
 * Ngày rỗng hoặc sai định dạng ⇒ **giữ nguyên cả danh sách**: người dùng chưa
 * gõ xong ngày mà ô người dạy đã trống trơn thì trông như lớp không có ai, và
 * đó là một lời nói dối tệ hơn hẳn việc hiện dư một lựa chọn mà cơ sở dữ liệu
 * sẽ từ chối bằng một câu rõ ràng.
 */
export function partitionTeachingStaff<T extends TeachingStaffAvailability & { id: string }>(
  staff: readonly T[],
  date: string,
  selectedId: string | null,
): TeachingStaffPartition<T> {
  const available = staff.filter((person) => isStaffAvailableOn(person, date));
  if (!selectedId || available.some((person) => person.id === selectedId)) {
    return { available, keptSelected: null };
  }
  return {
    available,
    keptSelected: staff.find((person) => person.id === selectedId) ?? null,
  };
}
