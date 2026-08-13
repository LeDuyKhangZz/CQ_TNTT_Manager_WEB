import { EmptyState } from "@/components/shared/empty-state";
import type { AppAudience } from "@/lib/permissions/roles";
import type { PortalEmptyReason } from "../status";

const copyByReason: Record<
  PortalEmptyReason,
  { title: string; description: (audience: AppAudience | null, yearCode?: string | null) => string }
> = {
  not_linked: {
    title: "Tài khoản chưa được gắn với hồ sơ",
    description: (audience) =>
      audience === "student"
        ? "Tài khoản của em chưa được nối với hồ sơ thiếu nhi. Nhờ Giáo lý viên kiểm tra giúp."
        : "Tài khoản của bạn chưa được nối với hồ sơ người giám hộ. Xin liên hệ Ban quản trị Xứ đoàn để được kiểm tra.",
  },
  no_children: {
    title: "Hồ sơ người giám hộ chưa có thiếu nhi",
    description: () =>
      "Tài khoản đã có hồ sơ người giám hộ nhưng chưa có hồ sơ con nào được gắn. Xin liên hệ Ban quản trị Xứ đoàn để bổ sung.",
  },
  no_enrollment: {
    title: "Chưa có ghi danh trong năm học hiện hành",
    description: (audience, yearCode) => {
      const subject = audience === "student" ? "Em" : "Thiếu nhi này";
      return `${subject} chưa được ghi danh${yearCode ? ` trong năm học ${yearCode}` : " trong năm học hiện hành"}. Vì vậy chưa có kết quả hoặc điểm danh để hiển thị.`;
    },
  },
  no_data: {
    title: "Chưa có dữ liệu được công bố",
    description: (_audience, yearCode) =>
      `${yearCode ? `Năm học ${yearCode}` : "Năm học hiện hành"} chưa có dữ liệu thuộc phạm vi được phép công bố.`,
  },
};

export function PortalEmptyState({
  reason,
  audience,
  yearCode,
  title,
  description,
  className,
}: {
  reason: PortalEmptyReason;
  audience: AppAudience | null;
  yearCode?: string | null;
  title?: string;
  description?: string;
  className?: string;
}) {
  const copy = copyByReason[reason];
  return (
    <EmptyState
      variant={reason === "not_linked" || reason === "no_children" ? "not-linked" : "no-data"}
      title={title ?? copy.title}
      description={description ?? copy.description(audience, yearCode)}
      className={className}
    />
  );
}
