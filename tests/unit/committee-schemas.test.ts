import { describe, expect, it } from "vitest";
import {
  committeeInputSchema,
  committeeMeetingInputSchema,
  committeeMembershipInputSchema,
  committeeUpdateSchema,
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

  // ── M09-A · TB-M09-01 ────────────────────────────────────────────────────
  it("công việc tuần không được rỗng cả nội dung lẫn checklist (AC-M09-14)", () => {
    const base = {
      committeeId: "11111111-1111-4111-8111-111111111111",
      weekStart: "2026-07-20",
    };
    expect(committeeWeeklyPlanInputSchema.safeParse({ ...base, content: null, checklist: [] }).success)
      .toBe(false);
    // Khoảng trắng cũng là rỗng — cùng luật với CHECK ở DB.
    expect(committeeWeeklyPlanInputSchema.safeParse({ ...base, content: "   ", checklist: [] }).success)
      .toBe(false);
    expect(committeeWeeklyPlanInputSchema.safeParse({ ...base, content: null, checklist: ["Mua đèn"] }).success)
      .toBe(true);
    expect(committeeWeeklyPlanInputSchema.safeParse({ ...base, content: "Có nội dung", checklist: [] }).success)
      .toBe(true);
  });

  it("nhận đúng dạng dấu thời gian mà PostgREST trả về cho expectedUpdatedAt", () => {
    const base = {
      committeeId: "11111111-1111-4111-8111-111111111111",
      weekStart: "2026-07-20",
      content: "Chuẩn bị Trung Thu",
      checklist: [],
    };
    // Hình dạng thật của `timestamptz` đi qua PostgREST: 6 chữ số phần lẻ giây và
    // phần lệch múi giờ dạng +00:00. Schema quá chặt ở đây là mọi lần "Cập nhật"
    // đều rớt validation trong khi dữ liệu hoàn toàn hợp lệ.
    expect(committeeWeeklyPlanInputSchema.safeParse({
      ...base,
      expectedUpdatedAt: "2026-10-05T09:30:00.123456+00:00",
    }).success).toBe(true);
    expect(committeeWeeklyPlanInputSchema.safeParse({
      ...base,
      expectedUpdatedAt: "2026-10-05T09:30:00Z",
    }).success).toBe(true);
    // `null` là cách nói "tuần này chưa có bản, tôi đang tạo mới".
    expect(committeeWeeklyPlanInputSchema.safeParse({ ...base, expectedUpdatedAt: null }).success)
      .toBe(true);
    expect(committeeWeeklyPlanInputSchema.safeParse({ ...base, expectedUpdatedAt: "hôm qua" }).success)
      .toBe(false);
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

  // ── M09-C · TB-M09-06 ────────────────────────────────────────────────────
  it("lịch họp nhận `id` để chuyển từ tạo mới sang sửa", () => {
    const base = {
      committeeId: "11111111-1111-4111-8111-111111111111",
      title: "Họp Ban",
      startsAt: "2026-07-20T12:00:00+07:00",
    };
    // Vắng id ⇒ tạo mới; có id hợp lệ ⇒ sửa; id sai định dạng ⇒ từ chối.
    expect(committeeMeetingInputSchema.safeParse(base).success).toBe(true);
    expect(committeeMeetingInputSchema.safeParse({ ...base, id: "33333333-3333-4333-8333-333333333333" }).success).toBe(true);
    expect(committeeMeetingInputSchema.safeParse({ ...base, id: "không-phải-uuid" }).success).toBe(false);
  });

  it("sửa Ban nhận đủ trường nhưng KHÔNG mở đường đổi mã Ban", () => {
    const valid = {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Ban Kỹ thuật",
      description: "Âm thanh ánh sáng",
      isActive: true,
      sortOrder: 2,
    };
    const parsed = committeeUpdateSchema.safeParse(valid);
    expect(parsed.success).toBe(true);
    // `code` là khoá nghiệp vụ: dù client có gửi kèm, schema tước bỏ, không có
    // đường nào đổi được nó qua updateCommittee.
    const withCode = committeeUpdateSchema.parse({ ...valid, code: "HACKED" });
    expect(withCode).not.toHaveProperty("code");
    // isActive bắt buộc; sortOrder phải là số nguyên trong ngưỡng smallint.
    expect(committeeUpdateSchema.safeParse({ ...valid, isActive: undefined }).success).toBe(false);
    expect(committeeUpdateSchema.safeParse({ ...valid, sortOrder: 1.5 }).success).toBe(false);
    expect(committeeUpdateSchema.safeParse({ ...valid, sortOrder: -1 }).success).toBe(false);
  });
});
