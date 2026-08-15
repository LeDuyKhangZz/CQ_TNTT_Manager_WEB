"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateField } from "@/components/ui/date-field";
import { Dialog } from "@/components/ui/dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  assignStaffToClass,
  endClassStaffAssignment,
  transferClassStaff,
} from "@/features/staff/server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

const CAPACITY_LABELS: Record<string, string> = {
  representative: "Giáo lý viên đại diện",
  member: "Giáo lý viên lớp",
  trainee: "Dự trưởng phụ tá",
};
const CAPACITY_OPTIONS = Object.entries(CAPACITY_LABELS);

export interface AssignmentPanelAssignment {
  id: string;
  classId: string;
  className: string;
  capacity: string;
  startsOn: string;
}

export interface StaffAssignmentPanelProps {
  staffProfileId: string;
  /** Tên đã ghép danh xưng — dùng nguyên văn trong mọi câu hậu quả. */
  staffName: string;
  activeAssignment: AssignmentPanelAssignment | null;
  classes: Array<{ id: string; name: string }>;
  /** Phân công / kết thúc phân công: `can_global_write`. */
  canWrite: boolean;
  /** Chuyển lớp (D-105): thêm Trưởng/Phó ngành — DB vẫn chốt theo ngành. */
  canTransfer: boolean;
  /** Hồ sơ có tài khoản đăng nhập hay không — đổi hẳn câu hậu quả. */
  hasAccount: boolean;
}

function viDate(value: string): string {
  const [y, m, d] = value.split("-");
  return d && m && y ? `${d}/${m}/${y}` : value;
}

/** Ngày liền trước `value` (yyyy-mm-dd), tính bằng UTC để không lệch múi giờ. */
function dayBefore(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Ngày mặc định cho ô "kết thúc"/"hiệu lực": hôm nay, NHƯNG không bao giờ sớm
 * hơn ngày bắt đầu của phân công đang bị đụng tới.
 *
 * 🔴 Không phải chuyện làm đẹp. Năm học được tạo trước khi khai giảng, nên phân
 * công thường có `starts_on` NẰM Ở TƯƠNG LAI. Điền sẵn "hôm nay" khi đó là điền
 * sẵn một giá trị mà cơ sở dữ liệu chắc chắn từ chối (`INVALID_END_DATE` /
 * `INVALID_EFFECTIVE_DATE`) — người dùng mở hộp thoại, bấm xác nhận, và ăn một
 * câu lỗi cho một giá trị họ không hề chọn. Thuộc tính `min` của ô ngày KHÔNG
 * tự sửa giá trị khởi tạo, nó chỉ chặn lúc gõ.
 */
function defaultDateFrom(startsOn: string | undefined): string {
  const now = today();
  return startsOn && startsOn > now ? startsOn : now;
}

/**
 * Khối "Phân công lớp" của `/staff/[staffId]` — phần THAO TÁC.
 * Lịch sử phân công do trang (Server Component) tự dựng: nó chỉ đọc, không cần JS.
 *
 * Hai thao tác nguy hiểm ở đây đều đổi QUYỀN của người khác, nên cả hai bắt buộc
 * có hộp xác nhận nêu hậu quả bằng tên riêng (`11` §5, SW-06):
 *
 *   · "Kết thúc phân công" — tác dụng phụ ẩn của nó là VÔ HIỆU HOÁ vai trò đăng
 *     nhập (M04-F05 chấm C5 = 1 đúng vì nút cũ không hề nói điều này).
 *   · "Chuyển lớp" — hộp thoại tự nó là lời xác nhận: câu xem trước nêu đủ tên
 *     người, hai tên lớp, hai ngày và vai trò đăng nhập sẽ chuyển đi đâu.
 */
export function StaffAssignmentPanel(props: StaffAssignmentPanelProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [endsOn, setEndsOn] = useState(() => defaultDateFrom(props.activeAssignment?.startsOn));
  const [endOpen, setEndOpen] = useState(false);

  const [transferOpen, setTransferOpen] = useState(false);
  const [newClassId, setNewClassId] = useState("");
  const [newCapacity, setNewCapacity] = useState("member");
  const [effectiveOn, setEffectiveOn] = useState(() => defaultDateFrom(props.activeAssignment?.startsOn));

  const active = props.activeAssignment;
  const otherClasses = props.classes.filter((item) => item.id !== active?.classId);
  const newClassName = otherClasses.find((item) => item.id === newClassId)?.name ?? null;

  function reset() {
    setError(null);
    setNotice(null);
  }

  async function runEnd() {
    if (!active) return;
    setPending(true);
    reset();
    try {
      const result = await endClassStaffAssignment(active.id, endsOn);
      if (!result.ok) {
        // Đóng hộp xác nhận rồi mới nêu lỗi: hộp đó không có chỗ đặt câu lỗi và
        // nó che kín màn hình, để mở là người dùng đọc một hộp nói "sẽ kết thúc…"
        // trong khi việc đã hỏng. Không mất gì vì hộp này không giữ dữ liệu nhập.
        setEndOpen(false);
        setError(result.message);
        return;
      }
      setEndOpen(false);
      setNotice(
        `Đã kết thúc phân công của ${props.staffName} tại lớp ${active.className} ngày ${viDate(endsOn)}.`,
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function runTransfer() {
    if (!active || !newClassId) return;
    setPending(true);
    reset();
    try {
      const result = await transferClassStaff({
        assignmentId: active.id,
        newClassId,
        capacity: newCapacity as "representative" | "member" | "trainee",
        effectiveOn,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setTransferOpen(false);
      setNotice(
        `Đã chuyển ${props.staffName} sang lớp ${newClassName ?? ""} từ ${viDate(effectiveOn)}.`,
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function runAssign(formData: FormData) {
    setPending(true);
    reset();
    try {
      const classId = String(formData.get("classId") ?? "");
      const result = await assignStaffToClass({
        staffProfileId: props.staffProfileId,
        classId,
        capacity: String(formData.get("capacity")) as "representative" | "member" | "trainee",
        startsOn: String(formData.get("startsOn") ?? ""),
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      const name = props.classes.find((item) => item.id === classId)?.name ?? "";
      setNotice(`Đã phân công ${props.staffName} vào lớp ${name}.`);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 border-t border-border pt-3">
      {notice ? <FormMessage tone="success">{notice}</FormMessage> : null}
      {/* Hộp thoại Chuyển lớp GIỮ nguyên các ô đã điền khi lỗi và tự nêu câu lỗi
          bên trong, nên ở đây phải im — cùng một câu hiện hai chỗ là người dùng
          tưởng có hai lỗi khác nhau. */}
      {error && !transferOpen ? <FormMessage tone="danger">{error}</FormMessage> : null}

      {active && (props.canWrite || props.canTransfer) ? (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="end-date">Ngày kết thúc phân công</Label>
            <DateField
              id="end-date"
              name="endsOn"
              className="w-48"
              value={endsOn}
              min={active.startsOn}
              onChange={(event) => setEndsOn(event.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {props.canWrite ? (
              <Button type="button" variant="outline" size="sm" onClick={() => { reset(); setEndOpen(true); }}>
                Kết thúc phân công
              </Button>
            ) : null}
            {props.canTransfer ? (
              <Button
                type="button"
                size="sm"
                onClick={() => { reset(); setNewCapacity(active.capacity); setTransferOpen(true); }}
                disabled={otherClasses.length === 0}
              >
                Chuyển lớp
              </Button>
            ) : null}
          </div>
          {props.canTransfer && otherClasses.length === 0 ? (
            <p className="text-2xs text-ink-muted">
              Chưa có lớp nào khác đang hoạt động để chuyển sang.
            </p>
          ) : null}
        </div>
      ) : null}

      {!active && props.canWrite ? (
        <form action={runAssign} className="space-y-3">
          <p className="text-sm font-medium text-ink">Phân công vào lớp</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="assign-class">Lớp</Label>
              <Select id="assign-class" name="classId" required defaultValue="" placeholder="Chọn lớp">
                {props.classes.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="assign-capacity">Vai trò trong lớp</Label>
              <Select id="assign-capacity" name="capacity" defaultValue="member">
                {CAPACITY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="assign-start">Ngày bắt đầu</Label>
            <DateField id="assign-start" name="startsOn" defaultValue={today()} required />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Đang lưu…" : "Lưu phân công"}
          </Button>
        </form>
      ) : null}

      {active ? (
        <ConfirmDialog
          open={endOpen}
          onClose={() => setEndOpen(false)}
          onConfirm={runEnd}
          pending={pending}
          title="Kết thúc phân công?"
          confirmLabel="Kết thúc phân công"
          consequence={
            <>
              <p>
                Sẽ kết thúc phân công của <strong>{props.staffName}</strong> tại lớp{" "}
                <strong>{active.className}</strong> ngày <strong>{viDate(endsOn)}</strong>.
              </p>
              {props.hasAccount ? (
                <p className="mt-2">
                  <strong>Và vô hiệu hoá vai trò đăng nhập</strong> {CAPACITY_LABELS[active.capacity] ?? ""} của{" "}
                  {props.staffName}: sau thao tác này {props.staffName} vẫn đăng nhập được nhưng{" "}
                  <strong>không vào được lớp nào</strong> cho tới khi được phân công lại.
                </p>
              ) : null}
              <p className="mt-2">
                Muốn đổi lớp mà giữ nguyên quyền thì hãy dùng <strong>Chuyển lớp</strong> thay vì thao tác này.
              </p>
            </>
          }
        />
      ) : null}

      {active ? (
        <Dialog
          open={transferOpen}
          onClose={() => setTransferOpen(false)}
          title="Chuyển lớp"
          description={`Một thao tác duy nhất: kết thúc phân công cũ, mở phân công mới, và mang theo vai trò đăng nhập của ${props.staffName}.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setTransferOpen(false)} disabled={pending}>
                Huỷ
              </Button>
              <Button onClick={runTransfer} disabled={pending || !newClassId}>
                {pending ? "Đang chuyển…" : "Xác nhận chuyển lớp"}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
            <div className="space-y-1">
              <Label htmlFor="transfer-class">Lớp mới</Label>
              <Select
                id="transfer-class"
                value={newClassId}
                placeholder="Chọn lớp mới"
                onChange={(event) => setNewClassId(event.target.value)}
              >
                {otherClasses.map((item) => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="transfer-capacity">Vai trò trong lớp mới</Label>
              <Select
                id="transfer-capacity"
                value={newCapacity}
                onChange={(event) => setNewCapacity(event.target.value)}
              >
                {CAPACITY_OPTIONS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="transfer-date">Ngày hiệu lực</Label>
              <DateField
                id="transfer-date"
                value={effectiveOn}
                min={active.startsOn}
                onChange={(event) => setEffectiveOn(event.target.value)}
              />
            </div>

            {/* Câu xem trước = lời xác nhận (TB-M04-02). Nêu đủ tên người, hai tên
                lớp, hai ngày, và vai trò đăng nhập đi đâu — không có chữ "bạn có
                chắc không". */}
            <div
              className="rounded-md border border-border bg-surface-muted p-3 text-sm text-ink"
              role="status"
              aria-live="polite"
            >
              {newClassId ? (
                <>
                  <p>
                    <strong>{props.staffName}</strong> sẽ kết thúc ở lớp{" "}
                    <strong>{active.className}</strong> ngày{" "}
                    <strong>{viDate(dayBefore(effectiveOn))}</strong> và bắt đầu ở lớp{" "}
                    <strong>{newClassName}</strong> ngày <strong>{viDate(effectiveOn)}</strong>.
                  </p>
                  {props.hasAccount ? (
                    <p className="mt-2">
                      Vai trò đăng nhập chuyển từ{" "}
                      <strong>{CAPACITY_LABELS[active.capacity]} ({active.className})</strong> sang{" "}
                      <strong>{CAPACITY_LABELS[newCapacity]} ({newClassName})</strong>. Không phải đăng
                      nhập lại, không phải đổi mật khẩu.
                    </p>
                  ) : (
                    <p className="mt-2">
                      Hồ sơ này chưa có tài khoản đăng nhập nên không có vai trò nào bị đổi.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-ink-muted">Chọn lớp mới để xem trước thay đổi.</p>
              )}
            </div>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
