import { beforeEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ read: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/guards", () => ({ requireRouteAccess: async () => ({ role: "parish_priest" }) }));
vi.mock("@/lib/academic-year/view", () => ({
  getAcademicYearView: async () => ({ readOnly: false, year: { id: "year" } }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: () => ({ select: () => ({ eq: () => ({ maybeSingle: state.read }) }) }) }),
}));

import { getClassDetail } from "@/features/classes/server/queries";

beforeEach(() => vi.clearAllMocks());

it.each([
  [{ final_status: "pending" }, true],
  [{ final_status: "approved" }, false],
  [{ final_status: "rejected" }, false],
  [null, false],
])("renders a roster with the one-to-one promotion relation %j", async (review, pending) => {
  state.read.mockResolvedValue({ data: {
    id: "class", display_name: "Ấu 1A", class_kind: "catechism", status: "active",
    meeting_location: null, notes: null, academic_year_id: "year",
    academic_years: { code: "2026-2027", name: "Năm học 2026-2027", status: "current", semester_1_end_date: null },
    grade_levels: null, class_staff_assignments: [],
    enrollments: [{ id: "enrollment", status: "active", promotion_reviews: review,
      students: { id: "student", student_code: "TN001", saint_name: "Giuse", full_name: "Nguyễn Minh An" } }],
  } });

  const result = await getClassDetail("class");
  expect(result.classDetail?.roster).toEqual([{
    enrollmentId: "enrollment", studentId: "student", studentCode: "TN001",
    saintName: "Giuse", fullName: "Nguyễn Minh An", status: "active", pendingPromotion: pending,
  }]);
  expect(result.canManage).toBe(false);
});
