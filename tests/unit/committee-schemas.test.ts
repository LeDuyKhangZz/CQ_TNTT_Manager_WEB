import { describe, expect, it } from "vitest";
import {
  committeeInputSchema,
  committeeMeetingInputSchema,
  committeeMembershipInputSchema,
  committeeWeeklyPlanInputSchema,
} from "@/features/committees/schemas";

describe("committee schemas", () => {
  it("chỉ nhận mã Ban dạng chữ in hoa/số/gạch dưới", () => {
    expect(committeeInputSchema.safeParse({ code: "KY_THUAT", name: "Ban Kỹ thuật" }).success).toBe(true);
    expect(committeeInputSchema.safeParse({ code: "ky thuat", name: "Ban Kỹ thuật" }).success).toBe(false);
    expect(committeeInputSchema.safeParse({ code: "K", name: "Ban Kỹ thuật" }).success).toBe(false);
  });

  it("chức vụ Ban phải nằm trong bốn giá trị đã chốt", () => {
    const base = {
      committeeId: "11111111-1111-4111-8111-111111111111",
      staffProfileId: "22222222-2222-4222-8222-222222222222",
    };
    expect(committeeMembershipInputSchema.safeParse({ ...base, position: "leader" }).success).toBe(true);
    expect(committeeMembershipInputSchema.safeParse({ ...base, position: "captain" }).success).toBe(false);
  });

  it("công việc tuần chỉ nhận mốc thứ Hai", () => {
    const base = {
      committeeId: "11111111-1111-4111-8111-111111111111",
      content: "Chuẩn bị Trung Thu",
      checklist: ["Mua đèn"],
    };
    // 2026-07-20 là thứ Hai, 2026-07-21 là thứ Ba.
    expect(committeeWeeklyPlanInputSchema.safeParse({ ...base, weekStart: "2026-07-20" }).success).toBe(true);
    expect(committeeWeeklyPlanInputSchema.safeParse({ ...base, weekStart: "2026-07-21" }).success).toBe(false);
  });

  it("lịch họp không cho giờ kết thúc trước giờ bắt đầu", () => {
    const base = {
      committeeId: "11111111-1111-4111-8111-111111111111",
      title: "Họp Ban",
      startsAt: "2026-07-20T12:00:00+07:00",
    };
    expect(committeeMeetingInputSchema.safeParse(base).success).toBe(true);
    expect(committeeMeetingInputSchema.safeParse({ ...base, endsAt: "2026-07-20T11:00:00+07:00" }).success).toBe(false);
    expect(committeeMeetingInputSchema.safeParse({ ...base, endsAt: "2026-07-20T14:00:00+07:00" }).success).toBe(true);
  });
});
