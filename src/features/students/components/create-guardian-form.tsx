"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGuardianFormAction } from "@/features/guardians/server/actions";
import {
  CREATE_GUARDIAN_INITIAL_STATE,
  type CreateGuardianFormState,
} from "../create-student-form-state";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Biểu mẫu "Thêm người giám hộ" — M03-A (TB-F14) và M03-B (BR-M03-N09).
 *
 * Câu thành công **chỉ đường sang việc tiếp theo** ("bây giờ chọn tên này ở biểu mẫu
 * Thêm thiếu nhi") chứ không chỉ nói "đã lưu": tạo phụ huynh gần như luôn là bước
 * đầu của việc tạo hồ sơ một em.
 *
 * 🔴 **Vì sao cảnh báo trùng ở đây quan trọng ngang bên hồ sơ em, và lý do là
 * PHÂN QUYỀN chứ không phải gọn gàng:** một gia đình bị nhập thành hai bản ghi
 * giám hộ mà chỉ một bản có tài khoản ⇒ phụ huynh đăng nhập chỉ thấy **một phần
 * số con của mình** (`app.own_student_ids()` nối theo `guardians.profile_id`),
 * và hệ thống **không có chức năng gộp** để chữa (5W-F01/F02).
 *
 * Cảnh báo vẫn MỀM: cả một gia đình dùng chung một số điện thoại là chuyện
 * thường, nên không có ràng buộc `unique` nào được thêm.
 */
export function CreateGuardianForm() {
  const [state, formAction, pending] = useActionState<CreateGuardianFormState, FormData>(
    createGuardianFormAction,
    CREATE_GUARDIAN_INITIAL_STATE,
  );
  useGlobalPending(pending);
  const { values, feedback, duplicates } = state;
  const showingDuplicates = duplicates.length > 0;

  return (
    <form
      key={`${feedback?.text ?? "idle"}|${duplicates.length}`}
      action={formAction}
      aria-label="Thêm người giám hộ"
      className="space-y-3"
    >
      {showingDuplicates ? (
        <div
          className="space-y-2 rounded-md border border-warning bg-warning-subtle p-3"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-ink">
            {duplicates.length === 1
              ? "Đã có 1 phụ huynh trông giống người này."
              : `Đã có ${duplicates.length} phụ huynh trông giống người này.`}
          </p>
          <ul className="space-y-1 text-sm text-ink">
            {duplicates.map((item) => (
              <li key={item.id}>
                <span className="font-medium">{item.fullName}</span>{" "}
                <span className="text-ink-muted">
                  — {item.phone} · {item.reason}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-2xs text-ink-muted">
            Nếu đúng là người đã có hồ sơ thì đóng biểu mẫu này và chọn thẳng tên đó ở
            &ldquo;Thêm thiếu nhi&rdquo;. Nếu là người khác thật thì bấm &ldquo;Vẫn tạo phụ
            huynh mới&rdquo;.
          </p>
          <input type="hidden" name="confirmDuplicate" value="1" />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="guardian-name">Họ tên phụ huynh</Label>
        <Input id="guardian-name" name="fullName" defaultValue={values.fullName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="guardian-phone">Điện thoại</Label>
        <Input
          id="guardian-phone"
          name="phone"
          inputMode="tel"
          defaultValue={values.phone}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="guardian-address">Địa chỉ</Label>
        <Input id="guardian-address" name="address" defaultValue={values.address} />
      </div>
      <Button type="submit" className="w-full" pending={pending}>
        {showingDuplicates ? "Vẫn tạo phụ huynh mới" : "Tạo phụ huynh"}
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
    </form>
  );
}
