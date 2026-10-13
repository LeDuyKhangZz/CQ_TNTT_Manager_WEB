import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookie: undefined as string | undefined,
  rows: [] as Array<{id:string;code:string;name:string;status:string;start_date:string;end_date:string;semester_1_end_date:null}>,
  error: null as null | {message:string},
  from: vi.fn(), set:vi.fn(), delete:vi.fn(), revalidate:vi.fn(),
  audience:"staff",
}));
vi.mock("server-only",()=>({}));
vi.mock("next/headers",()=>({cookies:async()=>({get:()=>mocks.cookie ? {value:mocks.cookie} : undefined,has:()=>Boolean(mocks.cookie),set:mocks.set,delete:mocks.delete})}));
vi.mock("next/cache",()=>({revalidatePath:mocks.revalidate}));
vi.mock("next/navigation",()=>({redirect:(url:string)=>{throw new Error(`redirect:${url}`);}}));
vi.mock("@/lib/auth/guards",()=>({requireRouteAccess:async()=>({audience:mocks.audience,role:"super_admin"})}));
vi.mock("@/lib/supabase/server",()=>({createClient:async()=>({from:mocks.from})}));
import { ACADEMIC_YEAR_COOKIE, assertWritableYearView, getAcademicYearView } from "@/lib/academic-year/view";
import { selectAcademicYear } from "@/features/academic-years/server/view-actions";
import * as studentActions from "@/features/students/server/actions";
import * as classActions from "@/features/classes/server/actions";
import * as enrollmentActions from "@/features/enrollments/server/actions";
import * as guardianActions from "@/features/guardians/server/actions";
import * as assessmentActions from "@/features/assessments/server/actions";
import * as reportActions from "@/features/reports/server/actions";
import { updateStudent } from "@/features/students/server/actions";

const current="a1000000-0000-4000-8000-000000000001";
const old="a1000000-0000-4000-8000-000000000002";
beforeEach(()=>{
  vi.clearAllMocks(); mocks.cookie=undefined; mocks.error=null; mocks.audience="staff";
  mocks.rows=[{id:current,code:"2026-2027",name:"Hiện hành",status:"current",start_date:"2026-09-01",end_date:"2027-06-30",semester_1_end_date:null},{id:old,code:"2025-2026",name:"Năm cũ",status:"closed",start_date:"2025-09-01",end_date:"2026-06-30",semester_1_end_date:null}];
  const query = {select:vi.fn(),in:vi.fn(),order:vi.fn(),then:(resolve:(value:unknown)=>unknown)=>Promise.resolve({data:mocks.rows,error:mocks.error}).then(resolve)};
  query.select.mockReturnValue(query);query.in.mockReturnValue(query);query.order.mockReturnValue(query);
  mocks.from.mockReturnValue(query);
});

describe("R2 academic year preference and mutation boundary",()=>{
  it("defaults to current and preserves a separate current year when reading history",async()=>{
    expect((await getAcademicYearView()).readOnly).toBe(false);
    mocks.cookie=old;
    const view=await getAcademicYearView();
    expect(view.year?.id).toBe(old);expect(view.current?.id).toBe(current);expect(view.readOnly).toBe(true);
  });
  it.each(["invalid","a1000000-0000-4000-8000-000000000099"])("invalid or inaccessible cookie %s cannot select another year",async(cookie)=>{
    mocks.cookie=cookie;expect((await getAcademicYearView()).year?.id).toBe(current);
  });
  it("does not query when a mutation has no history preference",async()=>{
    await assertWritableYearView();expect(mocks.from).not.toHaveBeenCalled();
  });
  it("refuses writes for a historical preference",async()=>{
    mocks.cookie=old;await expect(assertWritableYearView()).rejects.toMatchObject({code:"FORBIDDEN"});
  });
  it("an actual student mutation returns inline failure before obtaining a write query",async()=>{
    mocks.cookie=old;
    const result=await updateStudent({} as Parameters<typeof updateStudent>[0]);
    expect(result).toMatchObject({ok:false,code:"FORBIDDEN"});
    expect(mocks.from.mock.calls.map(call=>call[0])).toEqual(["academic_years"]);
  });
  it("year lookup failures do not become permission to mutate",async()=>{
    mocks.cookie=old;mocks.error={message:"network"};
    await expect(assertWritableYearView()).rejects.toMatchObject({code:"CONFLICT"});
  });
  it("selects only accessible years and returns to a safe module root",async()=>{
    const form=new FormData();form.set("year",old);form.set("section","https://evil.invalid/");
    await expect(selectAcademicYear(form)).rejects.toThrow("redirect:/classes");
    expect(mocks.set).toHaveBeenCalledWith(ACADEMIC_YEAR_COOKIE,old,expect.objectContaining({httpOnly:true,sameSite:"lax",path:"/"}));
    expect(mocks.revalidate).toHaveBeenCalledWith("/","layout");
  });
  it("returning to the current year removes the preference",async()=>{
    const form=new FormData();form.set("year",current);form.set("section","/students");
    await expect(selectAcademicYear(form)).rejects.toThrow("redirect:/students");expect(mocks.delete).toHaveBeenCalledWith(ACADEMIC_YEAR_COOKIE);
  });
  it.each(["guardian","student"])("%s cannot submit a forged year switch action",async audience=>{
    mocks.audience=audience;const form=new FormData();form.set("year",old);
    await expect(selectAcademicYear(form)).rejects.toThrow("redirect:/access-denied");expect(mocks.set).not.toHaveBeenCalled();
  });
});

const mutationNames = new Set([
  "createStudent","updateStudent","saveHealthProfile","upsertSacrament","deleteSacrament","setStudentStatus",
  "updateClass","enrollStudent","pauseEnrollment","resumeEnrollment","closeEnrollment",
  "createGuardian","updateGuardian","changeStudentGuardian",
  "createAssessment","updateAssessment","deleteAssessment","archiveAssessment","saveAssessmentScores","setAssessmentPublished","restoreAssessment",
  "refreshAttendanceScores","resetAttendanceScoreOverride","createStudentComment","updateStudentComment","deleteStudentComment",
  "lockGradebook","unlockGradebook","createLeaderboard","publishLeaderboard","unpublishLeaderboard","republishLeaderboard","deleteLeaderboard","createReportSnapshot",
]);
const mutations=Object.entries({...studentActions,...classActions,...enrollmentActions,...guardianActions,...assessmentActions,...reportActions}).filter(([name])=>mutationNames.has(name));
it.each(mutations)("historical view rejects %s before any write query", async (_name, action) => {
  mocks.cookie=old;
  const result=await Reflect.apply(action,undefined,[{},{}]);
  expect(result).toMatchObject({ok:false,code:"FORBIDDEN"});
  expect(mocks.from.mock.calls.map(call=>call[0])).toEqual(["academic_years"]);
});
