import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Wizard } from "@/components/ui/wizard";
import { drawerHref } from "@/components/ui/drawer";
import { CreateGuardianForm } from "./create-guardian-form";
import { CreateStudentForm } from "./create-student-form";
import { createGuardianWizardAction } from "../server/wizard-actions";
import type { StudentsPageData } from "../server/queries";

export function StudentCreationWizard({ data, listHref, step, guardianId, createGuardian }: {
  data: StudentsPageData; listHref: string; step?: string; guardianId?: string; createGuardian: boolean;
}) {
  const params = new URLSearchParams(listHref.split("?")[1]);
  const startHref = drawerHref("/students", params, { new: "1", ...(guardianId ? {guardian:guardianId} : {}) });
  const guardian = data.guardians.find(item => item.id === guardianId);
  const childStep = step === "student" && !!guardian && !createGuardian;
  const steps = [{ id: "guardian", title: "Người giám hộ", href: startHref }, { id: "student", title: "Thiếu nhi & lớp" }];
  if (data.guardianOptionsError) return <div role="alert" className="space-y-3">
    <p>Không thể tải danh sách người giám hộ. Vui lòng thử lại.</p>
    <a href={startHref} className={buttonVariants({ variant: "outline" })}>Thử lại</a>
  </div>;
  if (createGuardian) return <Wizard label="Thêm thiếu nhi" steps={steps} activeId="guardian" backHref={startHref}>
    <p className="text-sm text-ink-muted">Lưu người giám hộ rồi tiếp tục nhập thông tin em. Nếu dừng ở đây, hồ sơ giám hộ đã lưu vẫn được giữ.</p>
    <CreateGuardianForm action={createGuardianWizardAction.bind(null, listHref)} />
  </Wizard>;
  if (childStep) return <Wizard label="Thêm thiếu nhi" steps={steps} activeId="student" backHref={startHref}>
    <p className="text-sm">Người giám hộ: <strong>{guardian.fullName}</strong></p>
    <p className="text-2xs text-ink-muted">Hoàn tất bước này trước khi quay lại để giữ thông tin em đang nhập.</p>
    <CreateStudentForm key={guardian.id} guardians={[guardian]} guardianId={guardian.id} classes={data.classes} requiresClass={data.requiresClassOnCreate} closeHref={listHref} />
  </Wizard>;
  return <div className="space-y-4">
    <Wizard label="Thêm thiếu nhi" steps={steps} activeId="guardian" nextStepId="student" action="/students" method="get" submitLabel="Tiếp tục"
      fields={[...Array.from(params, ([name,value]) => ({name,value})), {name:"new",value:"1"}]}>
      <div className="space-y-2"><label htmlFor="wizard-guardian" className="text-sm font-medium">Người giám hộ đã có</label>
        <Select id="wizard-guardian" name="guardian" required placeholder="Chọn người giám hộ" defaultValue={guardianId ?? ""}>
          {data.guardians.map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.phone ?? "chưa có SĐT"}</option>)}
        </Select>
      </div>
      {!data.guardians.length ? <p className="text-sm text-ink-muted">Chưa có người giám hộ. Thêm người giám hộ để tiếp tục.</p> : null}
    </Wizard>
    <Link href={drawerHref("/students", params, {new:"guardian"})} replace className={buttonVariants({variant:"outline"})}>Thêm người giám hộ</Link>
  </div>;
}
