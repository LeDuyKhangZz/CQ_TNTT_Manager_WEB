"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { createStaffFormAction } from "@/features/staff/server/actions";
import { CREATE_STAFF_INITIAL_STATE } from "@/features/staff/create-form-state";
import { duplicateReasonLabel, duplicateWarningText } from "@/features/staff/staff-duplicates";
import { FORMATION_LABELS, SERVICE_LABELS, TITLE_LABELS } from "@/features/staff/staff-directory";
import { useGlobalPending } from "@/components/loading/loading-provider";

const TITLE_OPTIONS = Object.entries(TITLE_LABELS);
const FORMATION_OPTIONS = Object.entries(FORMATION_LABELS);

/**
 * Nút gửi tự khoá khi đang chạy — TB-M04-03 ("chặn bấm đúp"). Phải là component
 * RIÊNG vì `useFormStatus` chỉ đọc được trạng thái của `<form>` cha nó.
 */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  useGlobalPending(pending);
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Đang lưu…" : label}
    </Button>
  );
}

/**
 * Form "Thêm nhân sự" — TB-M04-03 (chống trùng hồ sơ), AC-M04-05.
 *
 * Hai pha, cảnh báo MỀM:
 *   · Pha 1 — gửi bình thường. Nếu server thấy hồ sơ nghi trùng thì KHÔNG tạo,
 *     mà trả về danh sách nghi trùng kèm nguyên vẹn dữ liệu vừa gõ.
 *   · Pha 2 — người dùng đọc danh sách, rồi hoặc bấm vào một hồ sơ đã có (hết
 *     việc), hoặc bấm "Vẫn tạo hồ sơ mới" để gửi lại với `confirmDuplicate=1`.
 *
 * 🔴 Dùng `useActionState` chứ KHÔNG phải `useState` + gọi action bằng tay: chỉ
 * cách này mới giữ được form CHẠY KHI CHƯA CÓ JAVASCRIPT (09 §11 — máy yếu,
 * mạng phòng học kém). React gửi biểu mẫu thẳng tới Server Action rồi dựng lại
 * trang bằng state trả về, nên cả hai pha đều đi được mà không cần một dòng JS
 * nào ở máy người dùng.
 *
 * Dữ liệu đã gõ quay lại qua THÂN phản hồi, không qua query string: bảy ô này có
 * ngày sinh, địa chỉ và số điện thoại — không để lại trên thanh địa chỉ.
 */
export function StaffCreateForm() {
  const [state, formAction] = useActionState(createStaffFormAction, CREATE_STAFF_INITIAL_STATE);
  const showingDuplicates = state.status === "duplicate";

  return (
    <form action={formAction} className="space-y-3">
      {state.status === "error" && state.message ? (
        <FormMessage tone="danger">{state.message}</FormMessage>
      ) : null}

      {showingDuplicates ? (
        <div
          className="space-y-2 rounded-md border border-warning bg-warning-subtle p-3"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-ink">
            {duplicateWarningText(state.duplicates.length)}
          </p>
          <ul className="space-y-1 text-sm text-ink">
            {state.duplicates.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/staff/${item.id}`}
                  className="font-medium underline underline-offset-4"
                >
                  {item.saintName ? `${item.saintName} ` : ""}
                  {item.fullName}
                </Link>{" "}
                <span className="text-ink-muted">
                  — {item.staffCode} · {item.phone} · {duplicateReasonLabel(item.reason)}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-2xs text-ink-muted">
            Nếu đúng là người đã có hồ sơ thì bấm vào tên ở trên để mở hồ sơ đó. Nếu là người
            khác thật thì bấm &ldquo;Vẫn tạo hồ sơ mới&rdquo;.
          </p>
          {/* Cờ xác nhận đi kèm biểu mẫu ở pha hai. Là `<input type="hidden">`
              chứ không phải state của React: pha hai cũng phải gửi được khi
              chưa có JS. */}
          <input type="hidden" name="confirmDuplicate" value="1" />
        </div>
      ) : null}

      {/* 🔴 `key` KHÔNG phải trang trí. `defaultValue` của `<select>` chỉ có tác
          dụng lúc gắn vào DOM; ô chữ thì trình duyệt tự cập nhật theo thuộc tính
          `value` khi người dùng chưa gõ vào, nhưng ô CHỌN thì không. Thiếu `key`,
          sau khi cảnh báo trùng hiện lên, "Chị" âm thầm quay về "Anh" và "Cấp II"
          quay về "Chưa qua huấn luyện" — rồi người dùng bấm "Vẫn tạo hồ sơ mới"
          và hồ sơ được tạo với danh xưng lẫn trình độ SAI mà không ai thấy. Đổi
          `key` theo chính giá trị ⇒ chỉ gắn lại khi giá trị thật sự đổi. */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="staff-title">Danh xưng</Label>
          <Select
            id="staff-title"
            name="title"
            key={`title-${state.values.title}`}
            defaultValue={state.values.title}
          >
            {TITLE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="formation">Trình độ huấn luyện</Label>
          <Select
            id="formation"
            name="formationLevel"
            key={`formation-${state.values.formationLevel}`}
            defaultValue={state.values.formationLevel}
          >
            {FORMATION_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-saint">Tên thánh</Label>
        <Input id="staff-saint" name="saintName" defaultValue={state.values.saintName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-name">Họ tên</Label>
        <Input id="staff-name" name="fullName" defaultValue={state.values.fullName} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-phone">Điện thoại</Label>
        <Input id="staff-phone" name="phone" inputMode="tel" defaultValue={state.values.phone} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-birth">Ngày sinh</Label>
        <DateField id="staff-birth" name="dateOfBirth" defaultValue={state.values.dateOfBirth} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-email">Email</Label>
        <Input id="staff-email" name="email" type="email" defaultValue={state.values.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="staff-address">Địa chỉ</Label>
        <Input id="staff-address" name="address" defaultValue={state.values.address} />
      </div>

      <SubmitButton label={showingDuplicates ? "Vẫn tạo hồ sơ mới" : "Tạo hồ sơ"} />
      <p className="text-2xs text-ink-muted">
        Hồ sơ mới luôn ở trạng thái &ldquo;{SERVICE_LABELS.active}&rdquo;. Đổi trạng thái ở trang
        hồ sơ sau khi tạo.
      </p>
    </form>
  );
}
