"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { updateStaff } from "@/features/staff/server/actions";
import {
  COMPONENT_LABELS,
  FORMATION_LABELS,
  SERVICE_LABELS,
  TITLE_LABELS,
} from "@/features/staff/staff-directory";
import { useGlobalPending } from "@/components/loading/loading-provider";
import { ROLE_LABELS } from "@/lib/permissions/roles";

// Cùng một bảng nhãn với danh sách và trang chi tiết (M04-B). Ba bản sao trước
// đây đã lệch thật: ô này ghi "Chưa có" trong khi danh sách in `NONE`.
const TITLE_OPTIONS = Object.entries(TITLE_LABELS);
const FORMATION_OPTIONS = Object.entries(FORMATION_LABELS);
const SERVICE_OPTIONS = Object.entries(SERVICE_LABELS);
const COMPONENT_OPTIONS = Object.entries(COMPONENT_LABELS);

export type StaffProfileEditorProps = {
  id: string;
  title: string;
  saintName: string | null;
  fullName: string;
  phone: string | null;
  formationLevel: string;
  serviceStatus: string;
  component: string;
  dateOfBirth: string | null;
  address: string | null;
  email: string | null;
  /** BDH-2025-002 — chức vụ theo sổ Ban Điều Hành; `null` với đại đa số hồ sơ. */
  appointedRole: string | null;
  appointedSectorId: string | null;
  sectors: Array<{ id: string; name: string }>;
};

/**
 * BDH-2025-002 — sáu chức vụ ghi được vào sổ bổ nhiệm, đúng bằng enum của
 * `updateStaffSchema.appointedRole` và của ràng buộc `staff_profiles_appointment_shape`.
 * Nhãn lấy từ `ROLE_LABELS` để ô này và khối Tài khoản không bao giờ gọi cùng
 * một vai trò bằng hai cái tên.
 */
const APPOINTED_ROLE_OPTIONS: ReadonlyArray<{ value: AppointedRole; label: string }> = (
  ["group_leader", "deputy_group_leader", "secretary", "treasurer", "sector_leader", "sector_deputy"] as const
).map((role) => ({ value: role, label: ROLE_LABELS[role] }));

type AppointedRole =
  | "group_leader"
  | "deputy_group_leader"
  | "secretary"
  | "treasurer"
  | "sector_leader"
  | "sector_deputy";

const SECTOR_SCOPED_ROLES: readonly string[] = ["sector_leader", "sector_deputy"];

/** Khối "Sửa hồ sơ" — kích hoạt `updateStaff` (trước M01-B là action chết). */
export function StaffProfileEditor(props: StaffProfileEditorProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // Ô "Ngành" chỉ hiện với chức vụ ngành, nên trạng thái phải theo dõi được —
  // `defaultValue` một mình không đủ để ẩn/hiện.
  const [appointedRole, setAppointedRole] = useState(props.appointedRole ?? "");
  const needsSector = SECTOR_SCOPED_ROLES.includes(appointedRole);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await updateStaff({
        id: props.id,
        title: String(formData.get("title")) as never,
        saintName: String(formData.get("saintName") ?? "") || null,
        fullName: String(formData.get("fullName") ?? ""),
        dateOfBirth: String(formData.get("dateOfBirth") ?? "") || null,
        phone: String(formData.get("phone") ?? "") || null,
        email: String(formData.get("email") ?? "") || null,
        address: String(formData.get("address") ?? "") || null,
        formationLevel: String(formData.get("formationLevel")) as never,
        component: String(formData.get("component")) as never,
        serviceStatus: String(formData.get("serviceStatus")) as never,
        // BDH-2025-002 — ô trống nghĩa là "không có trong sổ bổ nhiệm", tức
        // `null`, chứ không phải "bỏ qua trường này". Ngành chỉ gửi kèm khi
        // chức vụ thật sự cần, để không đâm vào ràng buộc hình dạng ở DB.
        appointedRole: (String(formData.get("appointedRole") ?? "") || null) as never,
        appointedSectorId: needsSector
          ? String(formData.get("appointedSectorId") ?? "") || null
          : null,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setNotice("Đã lưu hồ sơ.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-3">
      {notice ? <FormMessage tone="success">{notice}</FormMessage> : null}
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="edit-title">Danh xưng</Label>
          <Select id="edit-title" name="title" defaultValue={props.title}>
            {TITLE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-formation">Trình độ huấn luyện</Label>
          <Select id="edit-formation" name="formationLevel" defaultValue={props.formationLevel}>
            {FORMATION_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-component">Thành phần</Label>
          <Select id="edit-component" name="component" defaultValue={props.component} aria-describedby="edit-component-hint">
            {COMPONENT_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
          {/* STAFF-COMP-001 — nói trước cái mà người sửa chắc chắn sẽ tưởng: mã
              hồ sơ KHÔNG chạy theo ô này. Mã nhân sự cũng là tên đăng nhập, đổi
              mã của người đang dùng là khoá họ khỏi hệ thống. */}
          <p id="edit-component-hint" className="text-2xs text-ink-muted">
            Sửa được bất cứ lúc nào, nhưng mã hồ sơ giữ nguyên như lúc tạo.
          </p>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-saint">Tên thánh</Label>
        <Input id="edit-saint" name="saintName" defaultValue={props.saintName ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-name">Họ tên</Label>
        <Input id="edit-name" name="fullName" defaultValue={props.fullName} required />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="edit-phone">Điện thoại</Label>
          {/* IMP-BULK-002 — bỏ `required`: hồ sơ nhập từ sổ có thể chưa có số,
              và bắt điền ở đây là khoá luôn mọi ô khác của biểu mẫu. */}
          <Input id="edit-phone" name="phone" inputMode="tel" defaultValue={props.phone ?? ""} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-birth">Ngày sinh</Label>
          <DateField id="edit-birth" name="dateOfBirth" defaultValue={props.dateOfBirth ?? ""} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-email">Email</Label>
        <Input id="edit-email" name="email" type="email" defaultValue={props.email ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-address">Địa chỉ</Label>
        <Input id="edit-address" name="address" defaultValue={props.address ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="edit-service">Trạng thái phục vụ</Label>
        <Select id="edit-service" name="serviceStatus" defaultValue={props.serviceStatus}>
          {SERVICE_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </Select>
      </div>
      {/* BDH-2025-002 — sổ bổ nhiệm. Đặt CUỐI biểu mẫu và tách khỏi lưới thông
          tin cá nhân vì nó không phải thông tin về con người mà là một quyết
          định của Ban Điều Hành, và nó đổi mỗi năm học chứ không phải mỗi lần
          sửa hồ sơ. */}
      <div className="space-y-1">
        <Label htmlFor="edit-appointed-role">Chức vụ bổ nhiệm</Label>
        <Select
          id="edit-appointed-role"
          name="appointedRole"
          value={appointedRole}
          placeholder="Không giữ chức vụ nào"
          onChange={(event) => setAppointedRole(event.target.value)}
          aria-describedby="edit-appointed-hint"
        >
          {APPOINTED_ROLE_OPTIONS.map((item) => (
            <option key={item.value} value={item.value}>{item.label}</option>
          ))}
        </Select>
        <p id="edit-appointed-hint" className="text-2xs text-ink-muted">
          Chức vụ theo sổ Ban Điều Hành. Ô này <strong>không cấp quyền</strong> — nó chỉ chọn sẵn
          đúng vai trò khi cấp tài khoản, và cảnh báo nếu tài khoản đang mang vai trò khác.
        </p>
      </div>
      {needsSector ? (
        <div className="space-y-1">
          <Label htmlFor="edit-appointed-sector">Ngành phụ trách</Label>
          <Select
            id="edit-appointed-sector"
            name="appointedSectorId"
            defaultValue={props.appointedSectorId ?? ""}
            placeholder="Chọn ngành"
          >
            {props.sectors.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </Select>
        </div>
      ) : null}
      <Button type="submit" pending={pending}>Lưu hồ sơ</Button>
    </form>
  );
}
