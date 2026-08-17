"use client";

import { useActionState, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { guardianPanelFormAction } from "@/features/guardians/server/actions";
import { guardianChangeConsequence, type StudentFeedback } from "../student-feedback";
import { useGlobalPending } from "@/components/loading/loading-provider";
import { panelClassName } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface GuardianOption {
  id: string;
  fullName: string;
  phone: string;
}

/**
 * Khối "Người giám hộ" — M03-C, **TB-F12 / BR-M03-N15 · N16 · N17**.
 *
 * 🔴 **Luồng F12 chấm 31/75 — thấp nhất module — vì nó KHÔNG TỒN TẠI.**
 * `updateGuardian` viết xong từ Phase 2 mà không màn hình nào gọi; hệ quả
 * nghiệp vụ là nhập sai số điện thoại phụ huynh thì **không có nơi nào sửa**, mà
 * đó là số gọi khi em ốm giữa buổi học. Hai tiêu chí C13/C14 bị chấm 1 với lý do
 * *"không có UI để đánh giá"*.
 *
 * **Phương án B của `04_TO_BE_FLOWS`** — nhúng vào trang chi tiết em, không dựng
 * route `/guardians` riêng. Route riêng là phương án A và để dành cho **M13 Cổng
 * phụ huynh**, nơi mới thật sự cần "gia đình này có mấy em". Dựng trước ở đây là
 * thêm một mục điều hướng, một luật `route-map` và một màn hình danh sách cho
 * một nhu cầu chưa có.
 *
 * 🔴 **Hai thao tác, MỘT `useActionState`** — cùng lý do đã đo được ở M03-A:
 * hook giữ lại kết quả lượt trước, nên hai state riêng sẽ để câu *"Đã lưu thông
 * tin liên lạc của bà A"* đứng nguyên sau khi người dùng vừa đổi em sang **ông
 * B**, tức nói sai ai đang là người giám hộ.
 */
export function GuardianPanel({
  studentId,
  studentName,
  guardian,
  options,
  canWrite,
}: {
  studentId: string;
  studentName: string;
  guardian: { id: string; fullName: string; phone: string; address: string | null } | null;
  /** Cửa sổ hẹp `list_guardian_options` (D-124): chỉ tên + số điện thoại. */
  options: GuardianOption[];
  canWrite: boolean;
}) {
  const [feedback, formAction, pending] = useActionState<StudentFeedback | null, FormData>(
    guardianPanelFormAction,
    null,
  );
  useGlobalPending(pending);

  const changeFormRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<GuardianOption | null>(null);

  function handleChangeSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    const picked = String(new FormData(event.currentTarget).get("guardianId") ?? "");
    setTarget(options.find((item) => item.id === picked) ?? null);
    setOpen(true);
  }

  function handleConfirm() {
    confirmedRef.current = true;
    setOpen(false);
    changeFormRef.current?.requestSubmit();
  }

  if (!guardian) {
    return (
      <p className="text-sm text-muted-foreground">
        {studentName} chưa gắn với người giám hộ nào.
      </p>
    );
  }

  if (!canWrite) {
    return (
      <div className="space-y-1 text-sm">
        <p className="font-medium">{guardian.fullName}</p>
        <p className="text-muted-foreground">Điện thoại: {guardian.phone}</p>
        <p className="text-muted-foreground">Địa chỉ: {guardian.address ?? "—"}</p>
      </div>
    );
  }

  const others = options.filter((item) => item.id !== guardian.id);

  return (
    <div className="space-y-5">
      {/* BR-M03-N15 — sửa thông tin liên lạc, thao tác thường ngày. */}
      <form
        action={formAction}
        aria-label={`Sửa thông tin người giám hộ của ${studentName}`}
        className="space-y-3"
      >
        <input type="hidden" name="intent" value="save" />
        <input type="hidden" name="guardianId" value={guardian.id} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="guardian-name">Họ tên phụ huynh</Label>
            <Input
              id="guardian-name"
              name="fullName"
              defaultValue={guardian.fullName}
              maxLength={150}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="guardian-phone">Điện thoại</Label>
            <Input
              id="guardian-phone"
              name="phone"
              defaultValue={guardian.phone}
              maxLength={20}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardian-address">Địa chỉ</Label>
          <Input
            id="guardian-address"
            name="address"
            defaultValue={guardian.address ?? ""}
            maxLength={500}
          />
        </div>
        {/*
          BR-M03-N17 — "Ngừng sử dụng" bị cơ sở dữ liệu chặn khi còn con đang
          sinh hoạt, và câu từ chối nói ra việc phải làm trước. Vẫn để lựa chọn ở
          đây: ẩn nó đi thì hồ sơ phụ huynh của một gia đình đã rời xứ đoàn không
          có đường nào đóng lại.
        */}
        <div className="space-y-2">
          <Label htmlFor="guardian-status">Trạng thái hồ sơ phụ huynh</Label>
          <Select id="guardian-status" name="status" defaultValue="active">
            <option value="active">Đang sử dụng</option>
            <option value="inactive">Ngừng sử dụng</option>
          </Select>
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Đang lưu…" : "Lưu thông tin liên lạc"}
        </Button>
      </form>

      {/*
        🔴 BR-M03-N16 — thao tác ĐỔI QUYỀN ĐỌC, tách hẳn khỏi biểu mẫu trên.
        Đi chung một nút "Lưu" với số điện thoại là để nó trôi qua mà không ai
        xác nhận.
      */}
      {others.length > 0 ? (
        <form
          ref={changeFormRef}
          action={formAction}
          onSubmit={handleChangeSubmit}
          aria-label={`Đổi người giám hộ của ${studentName}`}
          className={cn(panelClassName({ variant: "muted" }), "space-y-3")}
        >
          <input type="hidden" name="intent" value="change" />
          <input type="hidden" name="studentId" value={studentId} />
          <div className="space-y-2">
            <Label htmlFor="guardian-change">Đổi sang người giám hộ khác</Label>
            <Select id="guardian-change" name="guardianId" defaultValue={others[0].id}>
              {others.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.fullName} · {item.phone}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Thao tác này đổi ngay ai xem được {studentName} trong cổng phụ huynh.
          </p>
          <Button type="submit" variant="outline" disabled={pending}>
            {pending ? "Đang đổi…" : "Đổi người giám hộ"}
          </Button>
        </form>
      ) : null}

      {feedback ? <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage> : null}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
        pending={pending}
        title={`Đổi người giám hộ của ${studentName}?`}
        // Chữ trên nút xác nhận phải KHÁC chữ trên nút mở hộp thoại: trùng nhau
        // thì trình đọc màn hình đọc ra hai điều khiển cùng tên trên một trang,
        // và người dùng bàn phím không biết mình đang bấm cái nào.
        confirmLabel="Xác nhận đổi"
        tone="danger"
        consequence={
          <p>
            {target
              ? guardianChangeConsequence(studentName, guardian.fullName, target.fullName)
              : ""}
          </p>
        }
      />
    </div>
  );
}
