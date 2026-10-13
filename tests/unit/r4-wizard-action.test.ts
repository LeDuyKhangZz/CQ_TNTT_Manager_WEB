import {beforeEach,describe,expect,it,vi} from "vitest";
import {CREATE_GUARDIAN_INITIAL_STATE} from "@/features/students/create-student-form-state";
const mocks=vi.hoisted(()=>({create:vi.fn(),redirect:vi.fn((path:string)=>{throw new Error(`REDIRECT:${path}`)})}));
vi.mock("@/features/guardians/server/actions",()=>({createGuardianFormAction:mocks.create}));
vi.mock("next/navigation",()=>({redirect:mocks.redirect}));
import {createGuardianWizardAction} from "@/features/students/server/wizard-actions";
beforeEach(()=>vi.clearAllMocks());
describe("R4 wizard action",()=>{
 it("returns duplicate/error feedback without advancing or creating a second guardian",async()=>{
  const feedback={...CREATE_GUARDIAN_INITIAL_STATE,feedback:{tone:"error",text:"Validation"}};
  mocks.create.mockResolvedValue(feedback);
  const form=new FormData();form.set("fullName","Invalid");
  expect(await createGuardianWizardAction("/students",CREATE_GUARDIAN_INITIAL_STATE,form)).toBe(feedback);
  expect(mocks.create).toHaveBeenCalledTimes(1);
  expect(mocks.create).toHaveBeenCalledWith(CREATE_GUARDIAN_INITIAL_STATE,form);
  expect(mocks.redirect).not.toHaveBeenCalled();
 });
 it("only advances after a saved guardian, keeps filters, and strips injected route/PII parameters",async()=>{
  const id="a2000000-0000-4000-8000-000000000001";
  mocks.create.mockResolvedValue({...CREATE_GUARDIAN_INITIAL_STATE,createdGuardianId:id});
  const form=new FormData();form.set("phone","0911111111");
  await expect(createGuardianWizardAction("https://untrusted.invalid/other?q=an&size=50&page=2&phone=0911111111&redirect=https://untrusted.invalid",CREATE_GUARDIAN_INITIAL_STATE,form)).rejects.toThrow("REDIRECT:");
  const target=new URL(mocks.redirect.mock.calls[0][0],"http://local");
  expect(target.pathname).toBe("/students");
  expect(target.searchParams.get("step")).toBe("student");expect(target.searchParams.get("guardian")).toBe(id);
  expect(target.searchParams.get("size")).toBe("50");expect(target.searchParams.get("page")).toBe("2");
  expect(target.searchParams.has("phone")).toBe(false);expect(target.searchParams.has("redirect")).toBe(false);
 });
});
