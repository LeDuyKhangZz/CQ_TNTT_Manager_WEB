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
  FORMATION_LABELS,
  SERVICE_LABELS,
  TITLE_LABELS,
} from "@/features/staff/staff-directory";
import { useGlobalPending } from "@/components/loading/loading-provider";

// Cùng một bảng nhãn với danh sách và trang chi tiết (M04-B). Ba bản sao trước
// đây đã lệch thật: ô này ghi "Chưa có" trong khi danh sách in `NONE`.
const TITLE_OPTIONS = Object.entries(TITLE_LABELS);
const FORMATION_OPTIONS = Object.entries(FORMATION_LABELS);
const SERVICE_OPTIONS = Object.entries(SERVICE_LABELS);

export type StaffProfileEditorProps = {
  id: string;
  title: string;
  saintName: string | null;
  fullName: string;
  phone: string | null;
  formationLevel: string;
  serviceStatus: string;
  dateOfBirth: string | null;
  address: string | null;
  email: string | null;
};

/** Khối "Sửa hồ sơ" — kích hoạt `updateStaff` (trước M01-B là action chết). */
export function StaffProfileEditor(props: StaffProfileEditorProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
        serviceStatus: String(formData.get("serviceStatus")) as never,
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
      <Button type="submit" pending={pending}>Lưu hồ sơ</Button>
    </form>
  );
}
