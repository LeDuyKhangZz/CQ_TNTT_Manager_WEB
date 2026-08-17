"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDateVi } from "@/lib/dates";
import { DUPLICATE_LEVEL_LABELS, duplicateWarningText } from "@/lib/students/duplicate";
import { GENDER_LABELS } from "../student-status";
import {
  CREATE_STUDENT_INITIAL_STATE,
  type CreateStudentFormState,
} from "../create-student-form-state";
import { createStudentFormAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Biểu mẫu "Thêm thiếu nhi" — M03-A (TB-F14) và M03-B (TB-F13, TB-F02/F09, D-123).
 *
 * **Hai pha, cảnh báo MỀM** (WF-03 bước 4, BR-M03-N08):
 *   · Pha 1 — gửi bình thường. Máy chủ thấy hồ sơ nghi trùng thì **không tạo**,
 *     mà trả danh sách về cùng nguyên vẹn dữ liệu vừa gõ.
 *   · Pha 2 — người nhập hoặc bấm vào một hồ sơ đã có (hết việc), hoặc bấm
 *     "Vẫn tạo hồ sơ mới" để gửi lại kèm `confirmDuplicate=1`.
 *
 * 🔴 Khối cảnh báo trùng dùng tông **cảnh báo**, không phải tông lỗi. Đây không
 * phải một lỗi — tô đỏ nó là dạy người dùng bấm qua cảnh báo theo phản xạ, đúng
 * thứ M03-A đã tránh khi cố ý **không** hỏi lại ở nút "Tạm nghỉ".
 *
 * 🔴 Ô ẩn `confirmDuplicate` là `<input type="hidden">` chứ không phải state của
 * React: pha hai **cũng phải gửi được khi chưa có JavaScript** (09 §11 — máy
 * yếu, mạng phòng học kém). Cùng khuôn với ô ẩn `intent` của M03-A.
 *
 * Dữ liệu đã gõ quay lại qua **thân phản hồi**, không qua query string: các ô
 * này có ngày sinh, địa chỉ và số điện thoại của một trẻ em.
 */
export function CreateStudentForm({
  guardians,
  classes,
  requiresClass,
}: {
  guardians: Array<{ id: string; fullName: string; phone: string }>;
  classes: Array<{ id: string; displayName: string; sectorName: string | null }>;
  /** D-123 — Trưởng/Phó ngành bắt buộc chọn lớp; vai trò xứ đoàn thì tuỳ. */
  requiresClass: boolean;
}) {
  const [state, formAction, pending] = useActionState<CreateStudentFormState, FormData>(
    createStudentFormAction,
    CREATE_STUDENT_INITIAL_STATE,
  );
  useGlobalPending(pending);
  const { values, feedback, duplicates } = state;
  const showingDuplicates = duplicates.length > 0;

  return (
    /*
      `key` đổi theo câu phản hồi để React dựng lại các ô sau mỗi lượt gửi. Không có
      nó thì `defaultValue` của lượt đầu bị giữ nguyên và ô nhập **không** trở về
      rỗng sau khi tạo xong — em kế tiếp sẽ mang tên em vừa nhập.

      Pha cảnh báo trùng KHÔNG có `feedback`, nên khoá phải kể cả số hồ sơ nghi
      trùng: thiếu nó, lượt gửi thứ hai không dựng lại và ô chọn quay về giá trị cũ.
    */
    <form
      key={`${feedback?.text ?? "idle"}|${duplicates.length}`}
      action={formAction}
      aria-label="Thêm thiếu nhi"
      className="space-y-3"
    >
      {showingDuplicates ? (
        <div
          className="space-y-2 rounded-md border border-warning bg-warning-subtle p-3"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-ink">{duplicateWarningText(duplicates.length)}</p>
          <ul className="space-y-1 text-sm text-ink">
            {duplicates.map((item) => (
              <li key={item.student.id}>
                <Link
                  href={`/students/${item.student.id}`}
                  className="font-medium underline underline-offset-4"
                >
                  {item.student.fullName}
                </Link>{" "}
                <span className="text-ink-muted">
                  — {item.student.studentCode} · {formatDateVi(item.student.dateOfBirth)}
                  {item.student.className ? ` · ${item.student.className}` : " · chưa xếp lớp"} ·{" "}
                  {DUPLICATE_LEVEL_LABELS[item.level]}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-2xs text-ink-muted">
            Nếu đúng là em đã có hồ sơ thì bấm vào tên ở trên để mở hồ sơ đó. Nếu là em
            khác thật thì bấm &ldquo;Vẫn tạo hồ sơ mới&rdquo;.
          </p>
          <input type="hidden" name="confirmDuplicate" value="1" />
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="student-guardian">Người giám hộ</Label>
        <Select
          id="student-guardian"
          name="guardianId"
          required
          placeholder="Chọn phụ huynh"
          defaultValue={values.guardianId}
        >
          {guardians.map((guardian) => (
            <option key={guardian.id} value={guardian.id}>
              {guardian.fullName} · {guardian.phone}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="student-saint">Tên thánh</Label>
          <Input id="student-saint" name="saintName" defaultValue={values.saintName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-gender">Giới tính</Label>
          <Select id="student-gender" name="gender" defaultValue={values.gender}>
            {Object.entries(GENDER_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-name">Họ tên</Label>
        <Input id="student-name" name="fullName" defaultValue={values.fullName} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="student-dob">Ngày sinh</Label>
          <DateField
            id="student-dob"
            name="dateOfBirth"
            defaultValue={values.dateOfBirth}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="student-feast">Ngày bổn mạng</Label>
          <DateField
            id="student-feast"
            name="patronFeastDate"
            defaultValue={values.patronFeastDate}
          />
        </div>
      </div>

      {/* TB-F02/F09 + D-123 — xếp lớp ngay tại đây thay vì bắt đi qua ba màn hình.
          Với Trưởng/Phó ngành ô này là BẮT BUỘC: ngành của em suy ra từ lớp, nên
          hồ sơ không lớp thì không có gì để kiểm "trong ngành mình". */}
      <div className="space-y-2">
        <Label htmlFor="student-class">
          {requiresClass ? "Ghi danh vào lớp" : "Ghi danh vào lớp (nếu đã biết)"}
        </Label>
        <Select
          id="student-class"
          name="classId"
          required={requiresClass}
          placeholder={requiresClass ? "Chọn lớp trong ngành của bạn" : "Chưa xếp lớp"}
          defaultValue={values.classId}
        >
          {classes.map((item) => (
            <option key={item.id} value={item.id}>
              {item.displayName}
              {item.sectorName ? ` · ${item.sectorName}` : ""}
            </option>
          ))}
        </Select>
        <p className="text-2xs text-ink-muted">
          {requiresClass
            ? "Hồ sơ và ghi danh được lưu cùng một lúc. Nếu chưa biết xếp em vào lớp nào, hãy nhờ Thư ký tạo hồ sơ trước."
            : "Để trống cũng được — mở hồ sơ em để ghi danh sau."}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="student-phone">Điện thoại (nếu có)</Label>
        <Input id="student-phone" name="phone" inputMode="tel" defaultValue={values.phone} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="student-address">Địa chỉ</Label>
        <Input id="student-address" name="address" defaultValue={values.address} />
      </div>
      <Checkbox
        id="student-hardship"
        name="hardshipFlag"
        defaultChecked={values.hardshipFlag}
        labelClassName="flex"
      >
        Hoàn cảnh khó khăn
      </Checkbox>
      <Button type="submit" className="w-full" pending={pending}>
        {showingDuplicates ? "Vẫn tạo hồ sơ mới" : "Tạo hồ sơ thiếu nhi"}
      </Button>
      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}
    </form>
  );
}
