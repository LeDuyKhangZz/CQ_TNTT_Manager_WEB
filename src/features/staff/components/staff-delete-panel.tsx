"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteStaffProfile } from "@/features/staff/server/actions";

export interface StaffDeletePanelProps {
  staffId: string;
  staffCode: string;
  /** Họ tên THẬT trong cơ sở dữ liệu — chuỗi người dùng phải gõ lại đúng. */
  fullName: string;
  /** Rỗng nghĩa là xóa được. Do DB đếm, không do trang tự đếm. */
  blockers: readonly string[];
}

/** Gộp khoảng trắng thừa giống hệt phía DB, để nút không khoá oan vì một dấu cách. */
function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

/**
 * Khối "Xóa hồ sơ" — D-106 (M04-F07, 5W-08), quyền D-109.
 *
 * Ba lớp ma sát, tương xứng với một thao tác KHÔNG HOÀN TÁC ĐƯỢC:
 *   1. Chỉ hiện nút khi DB nói hồ sơ xóa được; nếu không thì hiện thẳng LÝ DO.
 *   2. Phải gõ lại đúng họ tên — cùng luật so ở cả hai phía.
 *   3. `ConfirmDialog` nêu hậu quả bằng tên riêng (`11` §5).
 *
 * Nút bị khoá KHÔNG phải là biện pháp bảo vệ (09: "ẩn nút không phải
 * authorization") — chốt chặn thật là `delete_unused_staff_profile`, nơi kiểm cả
 * quyền, cả họ tên gõ lại, cả bảy bảng tham chiếu, trong một giao dịch có khoá dòng.
 */
export function StaffDeletePanel(props: StaffDeletePanelProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState("");

  const blocked = props.blockers.length > 0;
  const nameMatches = normalizeName(confirmName) === normalizeName(props.fullName);

  async function runDelete() {
    setPending(true);
    setError(null);
    try {
      const result = await deleteStaffProfile({ id: props.staffId, confirmName });
      if (!result.ok) {
        // Đóng hộp rồi mới nêu lỗi: hộp không có chỗ đặt câu lỗi và nó che kín
        // màn hình. Ô gõ tên được xoá theo — người dùng phải gõ lại có chủ ý.
        setOpen(false);
        setConfirmName("");
        setError(result.message);
        return;
      }
      // Hồ sơ không còn nữa nên ở lại trang này là ở lại một trang 404. Về danh
      // sách và mang theo câu thông báo nêu đúng ai vừa bị xoá.
      router.replace(
        `/staff?deleted=${encodeURIComponent(`${result.data.staffCode} · ${result.data.fullName}`)}`,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}

      {blocked ? (
        <div className="space-y-2 text-sm">
          <p className="text-ink">
            Hồ sơ này <strong>không xóa được</strong> vì đã có dữ liệu gắn với nó:
          </p>
          <ul className="list-disc space-y-1 pl-5 text-ink-muted">
            {props.blockers.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
          <p className="text-2xs text-ink-muted">
            Người đã ngưng phục vụ thì đổi &ldquo;Trạng thái phục vụ&rdquo; sang{" "}
            <strong>Đã nghỉ</strong> ở khối &ldquo;Sửa hồ sơ&rdquo; — lịch sử mục vụ vẫn được giữ.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-ink">
            Hồ sơ <strong>{props.staffCode}</strong> chưa được dùng vào việc gì: chưa có tài khoản,
            chưa phân công lớp, chưa có bản ghi nào tham chiếu. Xóa được, và{" "}
            <strong>không hoàn tác được</strong>.
          </p>
          <div className="space-y-1">
            <Label htmlFor="delete-confirm-name">
              Gõ lại họ tên để mở nút xóa: <strong>{props.fullName}</strong>
            </Label>
            <Input
              id="delete-confirm-name"
              name="confirmName"
              autoComplete="off"
              value={confirmName}
              placeholder={props.fullName}
              onChange={(event) => setConfirmName(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={!nameMatches || pending}
            onClick={() => { setError(null); setOpen(true); }}
          >
            Xóa hồ sơ
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={runDelete}
        pending={pending}
        title="Xóa hẳn hồ sơ này?"
        confirmLabel="Xóa hẳn hồ sơ"
        consequence={
          <>
            <p>
              Sẽ xóa hẳn hồ sơ <strong>{props.fullName}</strong> (mã{" "}
              <strong>{props.staffCode}</strong>) khỏi hệ thống.
            </p>
            <p className="mt-2">
              Mã <strong>{props.staffCode}</strong> sẽ không được cấp lại cho ai, và{" "}
              <strong>thao tác này không hoàn tác được</strong>. Việc xóa được ghi vào nhật ký
              quản trị.
            </p>
          </>
        }
      />
    </div>
  );
}
