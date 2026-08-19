"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGlobalPending } from "@/components/loading/loading-provider";
import { updateOwnStaffContact } from "@/features/staff/server/actions";
import {
  STAFF_CONTACT_LABELS,
  staffContactReminder,
  type StaffContact,
} from "@/features/staff/profile-completeness";

/**
 * Khối "Bổ sung hồ sơ" của trang Tài khoản — IMP-BULK-002.
 *
 * 🔴 Khối này là **lời hứa đi kèm** việc bỏ hàng rào ở nhập hàng loạt. Nhận hồ
 * sơ thiếu mà không có chỗ nào bổ sung thì dữ liệu thiếu ở lại thiếu vĩnh viễn;
 * chủ dự án chốt đường bổ sung là chính đương sự, sau khi họ có tài khoản.
 *
 * Bốn ô **luôn hiện đủ**, không chỉ hiện ô đang trống: người ta cũng đổi số điện
 * thoại và đổi chỗ ở, nên một biểu mẫu tự ẩn bớt sẽ thành một biểu mẫu vô dụng
 * ngay sau lần điền đầu tiên. Câu nhắc phía trên mới là phần thay đổi theo dữ liệu.
 */
export function OwnContactForm({ contact }: { contact: StaffContact }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const reminder = staffContactReminder(contact);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await updateOwnStaffContact({
        phone: String(formData.get("phone") ?? "") || null,
        dateOfBirth: String(formData.get("dateOfBirth") ?? "") || null,
        address: String(formData.get("address") ?? "") || null,
        email: String(formData.get("email") ?? "") || null,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      // Nói ra CÒN THIẾU GÌ sau khi lưu, không chỉ "đã lưu": người vừa điền một
      // ô cần biết mình đã xong hay chưa mà không phải tự dò lại cả biểu mẫu.
      setNotice(
        result.data.missing.length === 0
          ? "Đã lưu. Hồ sơ của bạn đã đầy đủ."
          : `Đã lưu. Còn thiếu: ${result.data.missing
              .map((field) => STAFF_CONTACT_LABELS[field].toLowerCase())
              .join(", ")}.`,
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-3">
      {reminder ? <FormMessage tone="info">{reminder}</FormMessage> : null}
      {notice ? <FormMessage tone="success">{notice}</FormMessage> : null}
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="own-phone">{STAFF_CONTACT_LABELS.phone}</Label>
          <Input
            id="own-phone"
            name="phone"
            inputMode="tel"
            maxLength={20}
            defaultValue={contact.phone ?? ""}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="own-birth">{STAFF_CONTACT_LABELS.dateOfBirth}</Label>
          <DateField id="own-birth" name="dateOfBirth" defaultValue={contact.dateOfBirth ?? ""} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="own-address">{STAFF_CONTACT_LABELS.address}</Label>
        <Input id="own-address" name="address" maxLength={500} defaultValue={contact.address ?? ""} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="own-email">{STAFF_CONTACT_LABELS.email}</Label>
        <Input id="own-email" name="email" type="email" defaultValue={contact.email ?? ""} />
      </div>
      <Button type="submit" pending={pending}>
        Lưu thông tin
      </Button>
    </form>
  );
}
