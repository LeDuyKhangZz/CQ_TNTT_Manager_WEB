"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { requireAuthContext } from "@/lib/auth/guards";
import {
  parseChildSelection,
  THEME_CHILD_COOKIE,
  THEME_CHILD_COOKIE_OPTIONS,
} from "@/lib/theme/child-selection";

/**
 * Ghi lựa chọn "đang xem con nào" cho `ChildSwitcher` — 10 §7.
 *
 * Cookie chỉ chứa **id của em**, không bao giờ chứa màu. Ở đây cố ý KHÔNG kiểm
 * tra em đó có phải con của người gọi hay không: resolver xác thực lại đủ bốn
 * bước ở mỗi request và danh sách con của nó đi qua RLS, nên một cookie bị sửa
 * tay chỉ dẫn tới `SELECTED_CONTEXT_FORBIDDEN` và màu trung tính — không lộ
 * tên, không lộ sự tồn tại của hồ sơ nào. Thêm một lần kiểm ở đây sẽ là bản sao
 * thứ hai của cùng một luật, và bản sao là thứ sẽ lệch.
 *
 * `revalidatePath('/', 'layout')` vì đổi con là đổi **cả nội dung lẫn màu vỏ**
 * (10 §8) — chỉ dựng lại một trang là để lại vỏ mang màu của con trước.
 */
export async function selectThemeChild(formData: FormData): Promise<void> {
  await requireAuthContext();

  const studentId = parseChildSelection(formData.get("studentId"));
  const cookieStore = await cookies();

  if (studentId) {
    cookieStore.set(THEME_CHILD_COOKIE, studentId, THEME_CHILD_COOKIE_OPTIONS);
  } else {
    // Giá trị sai dạng thì XOÁ hẳn lựa chọn cũ thay vì giữ nguyên: giữ nguyên
    // nghĩa là người dùng bấm một nút và không có gì thay đổi.
    cookieStore.delete(THEME_CHILD_COOKIE);
  }

  revalidatePath("/", "layout");
}
