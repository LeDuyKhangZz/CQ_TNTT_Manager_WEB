import Link from "next/link";
import { requireRouteAccess } from "@/lib/auth/guards";
import { getAcademicYearView } from "@/lib/academic-year/view";
import { createClient } from "@/lib/supabase/server";
import { getPortalAttendance } from "@/features/portal/server/queries";
import { AttendanceHistory } from "@/features/portal/components/attendance-history";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Section } from "@/components/ui/section";
import { studentStatusLabel } from "../student-status";
import { formatDateVi } from "@/lib/dates";

export function DetailLoadError({ href, label }: { href: string; label: string }) {
  return <div role="alert" className="space-y-2 rounded-md border border-line p-3 text-sm">
    <p>Không thể tải {label}. Vui lòng thử lại.</p>
    <a href={href} className="inline-flex min-h-11 items-center font-medium text-theme-accent-text underline">Thử lại</a>
  </div>;
}

export async function StudentFamilyMembers({ studentId, guardianId }: { studentId: string; guardianId: string }) {
  await requireRouteAccess(`/students/${studentId}`);
  const db = await createClient();
  const view = await getAcademicYearView();
  let query = db.from(view.readOnly ? "student_year_directory" : "student_directory")
    .select("id,saint_name,full_name,class_name,status").eq("guardian_id", guardianId).neq("id", studentId);
  if (view.readOnly && view.year) query = query.eq("academic_year_id", view.year.id);
  const { data, error } = await query.order("full_name").limit(100);
  if (error) return <DetailLoadError href={`/students/${studentId}?tab=family`} label="anh chị em cùng giám hộ" />;
  return <Section id="family-members" title="Anh chị em cùng người giám hộ" description="Chỉ hiển thị hồ sơ trong phạm vi bạn được phép xem.">
    {!data?.length ? <p className="text-sm text-ink-muted">Không có hồ sơ khác trong phạm vi của bạn.</p> :
      <ul className="divide-y divide-line">{data.map(item => <li key={item.id}>
        <Link href={`/students/${item.id}`} className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2 text-sm">
          <span className="font-medium text-theme-accent-text">{item.saint_name} {item.full_name}</span>
          <span>{item.class_name ?? "Chưa xếp lớp"} · {studentStatusLabel(item.status ?? "active")}</span>
        </Link>
      </li>)}</ul>}
  </Section>;
}

export async function StudentAttendanceSection({ studentId, noteSession }: { studentId: string; noteSession?: string }) {
  await requireRouteAccess(`/students/${studentId}`);
  const view = await getAcademicYearView();
  try {
    const attendance = await getPortalAttendance(studentId, view.year ?? undefined);
    const sessions = attendance.rows.filter(row => row.sessionId);
    const selected = sessions.find(row => row.sessionId === noteSession) ?? sessions[0];
    const db = await createClient();
    // D-75: only the authorized RPC can read notes. Fetch one session on demand,
    // filtered to this student's record; never put notes into portal data.
    const notes = selected ? await db.rpc("attendance_session_notes", {p_session_id:selected.sessionId!})
      .eq("record_id", selected.recordId) : {data:[],error:null};
    return <div className="space-y-5">
      <AttendanceHistory audience="staff" {...attendance} />
      {selected ? <Section id="attendance-notes" title="Ghi chú nội bộ" description="Chọn buổi để xem ghi chú của em. Chỉ nhân sự có quyền được đọc.">
        <form method="get" action={`/students/${studentId}`} className="mb-3 flex flex-wrap gap-2">
          <input type="hidden" name="tab" value="attendance" />
          <Select name="noteSession" aria-label="Buổi cần xem ghi chú" defaultValue={selected.sessionId} className="w-auto">
            {sessions.map(row => <option key={row.recordId} value={row.sessionId}>{formatDateVi(row.attendanceDate)} · {row.meetingType === "sunday" ? "Chúa nhật" : "Thứ Năm"}</option>)}
          </Select>
          <Button type="submit" variant="outline">Xem ghi chú</Button>
        </form>
        {notes.error ? <DetailLoadError href={`/students/${studentId}?tab=attendance&noteSession=${selected.sessionId}`} label="ghi chú của buổi" /> :
          <p className="whitespace-pre-wrap text-sm">{notes.data?.[0]?.note || "Không có ghi chú nội bộ cho em trong buổi này."}</p>}
      </Section> : null}
    </div>;
  } catch {
    return <DetailLoadError href={`/students/${studentId}?tab=attendance`} label="chuyên cần" />;
  }
}

/** Small overview warning; the full history stays in its own tab. */
export async function StudentAttendanceOverview({studentId}:{studentId:string}) {
  await requireRouteAccess(`/students/${studentId}`);
  const view=await getAcademicYearView();
  if(!view.year) return null;
  const db=await createClient();
  const {data,error}=await db.from("v_student_attendance_summary")
    .select("warn_consecutive_absence,warn_consecutive_sunday,warn_low_rate,catechism_absence_streak,sunday_absence_streak")
    .eq("student_id",studentId).eq("academic_year_id",view.year.id).maybeSingle();
  if(error) return <DetailLoadError href={`/students/${studentId}`} label="cảnh báo chuyên cần" />;
  const warnings = data ? [
    data.warn_consecutive_absence ? `Vắng ${data.catechism_absence_streak} buổi giáo lý liên tiếp.` : null,
    data.warn_consecutive_sunday ? `Vắng lễ ${data.sunday_absence_streak} Chúa nhật liên tiếp.` : null,
    data.warn_low_rate ? "Tỷ lệ chuyên cần đang dưới mức của năm học." : null,
  ].filter(Boolean) : [];
  return warnings.length ? <div role="status" className="rounded-md border border-warning bg-warning-subtle p-3 text-sm">
    <p className="font-medium">Cần lưu ý về chuyên cần</p><ul className="mt-1 list-inside list-disc">{warnings.map(message=><li key={message}>{message}</li>)}</ul>
  </div> : null;
}
