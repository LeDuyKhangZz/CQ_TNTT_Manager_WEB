/**
 * Chọn ngẫu nhiên **không lặp liền kề** — `17_UI_POLISH_PLAN.md` §3.7.
 *
 * Vì sao không dùng thẳng `Math.floor(Math.random() * n)`: với 4 ảnh, xác suất
 * hai lần chờ liên tiếp ra cùng một ảnh là 25%. Người dùng bấm lưu ba lần liền
 * mà thấy đúng một tấm ảnh sẽ kết luận là "chỉ có một ảnh", tức là toàn bộ công
 * chuẩn bị bốn tấm ảnh trở nên vô hình.
 *
 * Hàm thuần, nhận `random` từ ngoài để bộ kiểm chốt được kết quả.
 */
export function pickNextIndex(
  length: number,
  previous: number,
  random: () => number = Math.random,
): number {
  if (length <= 0) return -1;
  if (length === 1) return 0;

  // Bốc trong (length - 1) lựa chọn còn lại rồi trượt qua chỗ vừa dùng. Cách này
  // luôn kết thúc sau đúng một lần bốc — vòng lặp "bốc lại nếu trùng" thì không.
  if (previous < 0 || previous >= length) {
    return Math.min(length - 1, Math.floor(random() * length));
  }

  const drawn = Math.min(length - 2, Math.floor(random() * (length - 1)));
  return drawn >= previous ? drawn + 1 : drawn;
}
