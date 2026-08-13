import { describe, expect, it } from "vitest";
import {
  decideThemeContext,
  type ChildFact,
  type ClassFact,
  type DecideThemeInput,
  type StaffFacts,
} from "@/lib/theme/decide-theme-context";
import {
  hasStarted,
  isEffectiveAssignment,
  isEffectiveEnrollment,
  todayInVietnam,
} from "@/lib/theme/effective";
import { SECTOR_PALETTE, THEME_KEYS } from "@/lib/theme/sector-palette";
import { contrastRatio, AA_TEXT } from "@/lib/theme/contrast";

/**
 * 30 UNIT TEST BẮT BUỘC cho theme resolver — docs/.../10 §12:
 * 25 tình huống ở 13 §7.1 (trừ #4, #5 ngoài phạm vi do Q-01 = một lớp,
 * vẫn giữ dạng test khẳng định "không áp dụng"), cộng U-26..U-30.
 */

const YEAR = { id: "aaaaaaaa-0000-4000-8000-000000000001", code: "2026-2027" };
const OLD_YEAR_ID = "aaaaaaaa-0000-4000-8000-000000000000";

const AU = { id: "10000000-0000-4000-8000-000000000002", name: "Ấu Nhi", themeKey: "AU_NHI" as const };
const THIEU = { id: "10000000-0000-4000-8000-000000000003", name: "Thiếu Nhi", themeKey: "THIEU_NHI" as const };
const NGHIA = { id: "10000000-0000-4000-8000-000000000004", name: "Nghĩa Sĩ", themeKey: "NGHIA_SI" as const };
const CHIEN = { id: "10000000-0000-4000-8000-000000000001", name: "Chiên Con", themeKey: "CHIEN_CON" as const };

function klass(
  branch: ClassFact["branch"],
  overrides: Partial<ClassFact> = {},
): ClassFact {
  return {
    classId: "cccccccc-0000-4000-8000-00000000000a",
    className: "Ấu 2A",
    isTrainee: false,
    branch,
    ...overrides,
  };
}

function child(
  studentId: string,
  studentName: string,
  enrollment: ClassFact | null,
): ChildFact {
  return { studentId, studentName, enrollment };
}

function staff(overrides: Partial<StaffFacts> = {}): StaffFacts {
  return {
    kind: "STAFF",
    roleSectorBranch: null,
    classAssignment: null,
    roleClass: null,
    hasActiveRole: true,
    hasGlobalRole: false,
    ...overrides,
  };
}

function decide(input: Omit<DecideThemeInput, "currentAcademicYear"> & Partial<DecideThemeInput>) {
  return decideThemeContext({ currentAcademicYear: YEAR, ...input });
}

// =====================================================================
// 25 tình huống của chủ dự án (13 §7.1)
// =====================================================================
describe("resolver — 25 tình huống đã duyệt", () => {
  it("U-01 Ấu 3 → Thiếu 1 khi chuyển năm học: theme đi theo ghi danh đang mở", () => {
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: { kind: "STUDENT", enrollment: klass(THIEU, { className: "Thiếu 1A" }) },
      },
    });
    expect(result.themeKey).toBe("THIEU_NHI");
    expect(result.sourceOfTheme).toBe("OWN_ENROLLMENT_BRANCH");
    expect(result.branchName).toBe("Thiếu Nhi");
  });

  it("U-02 Thiếu 3 → Nghĩa 1", () => {
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: { kind: "STUDENT", enrollment: klass(NGHIA, { className: "Nghĩa 1" }) },
      },
    });
    expect(result.themeKey).toBe("NGHIA_SI");
    expect(result.sourceOfTheme).toBe("OWN_ENROLLMENT_BRANCH");
  });

  it("U-03 GLV năm trước ngành Ấu, năm nay ngành Thiếu: chỉ phân công năm hiện hành có hiệu lực", () => {
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: staff({ classAssignment: klass(THIEU, { className: "Thiếu 1B" }) }),
      },
    });
    expect(result.themeKey).toBe("THIEU_NHI");
    expect(result.sourceOfTheme).toBe("PRIMARY_ACTIVE_ASSIGNMENT");
  });

  it("U-04 GLV hai lớp cùng ngành: NGOÀI PHẠM VI (Q-01 = một lớp) — tầng truy vấn chỉ trả một phân công", () => {
    // Q-01 chốt một GLV = một lớp, có unique index chặn ở DB
    // (`class_staff_one_active_class_per_staff_idx`). Hàm quyết định chỉ nhận
    // MỘT `classAssignment`; test này canh đúng hình dạng đó.
    const facts = staff({ classAssignment: klass(AU) });
    expect(facts.classAssignment).not.toBeInstanceOf(Array);
    expect(decide({ scope: { kind: "PERSONAL", viewer: facts } }).themeKey).toBe("AU_NHI");
  });

  it("U-05 GLV hai ngành: NGOÀI PHẠM VI (Q-01) — không có bộ chọn ngữ cảnh ngành cho staff", () => {
    const result = decide({
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(AU) }) },
    });
    // Cookie ngữ cảnh CHỈ dùng ở nhánh guardian (10 §3).
    expect(result.availableThemeContexts).toHaveLength(0);
  });

  it("U-06 Trưởng ngành kiêm GLV: ngành phụ trách ở PERSONAL, ngành của lớp khi scope=CLASS", () => {
    const viewer = staff({
      roleSectorBranch: AU,
      classAssignment: klass(THIEU, { className: "Thiếu 1B" }),
    });
    expect(decide({ scope: { kind: "PERSONAL", viewer } }).themeKey).toBe("AU_NHI");
    expect(decide({ scope: { kind: "CLASS", class: klass(THIEU) } }).themeKey).toBe("THIEU_NHI");
  });

  it("U-07 Phụ huynh 1 con vừa chuyển ngành: theo ngành mới", () => {
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: {
          kind: "GUARDIAN",
          children: [child("dddddddd-0000-4000-8000-000000000001", "Maria Nguyễn Thị A", klass(THIEU))],
          selectedChildIdFromCookie: null,
        },
      },
    });
    expect(result.themeKey).toBe("THIEU_NHI");
    expect(result.sourceOfTheme).toBe("SOLE_CHILD_BRANCH");
    // Một con ⇒ 1 phần tử ⇒ KHÔNG hiện bộ chọn (D-64).
    expect(result.availableThemeContexts).toHaveLength(1);
  });

  it("U-08 Phụ huynh 2 con cùng ngành: ngành chung, không cần bộ chọn màu", () => {
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: {
          kind: "GUARDIAN",
          children: [
            child("dddddddd-0000-4000-8000-000000000001", "Em A", klass(AU, { className: "Ấu 1A" })),
            child("dddddddd-0000-4000-8000-000000000002", "Em B", klass(AU, { className: "Ấu 3B" })),
          ],
          selectedChildIdFromCookie: null,
        },
      },
    });
    expect(result.themeKey).toBe("AU_NHI");
    expect(result.sourceOfTheme).toBe("SOLE_CHILD_BRANCH");
    expect(result.fallbackReason).toBeNull();
  });

  it("U-09 Phụ huynh 2 con khác ngành, đổi con đang xem: đổi cả nội dung lẫn màu", () => {
    const children = [
      child("dddddddd-0000-4000-8000-000000000001", "Em A", klass(AU, { className: "Ấu 1A" })),
      child("dddddddd-0000-4000-8000-000000000002", "Em B", klass(NGHIA, { className: "Nghĩa 2" })),
    ];
    const withA = decide({
      scope: { kind: "PERSONAL", viewer: { kind: "GUARDIAN", children, selectedChildIdFromCookie: children[0].studentId } },
    });
    const withB = decide({
      scope: { kind: "PERSONAL", viewer: { kind: "GUARDIAN", children, selectedChildIdFromCookie: children[1].studentId } },
    });
    expect(withA.themeKey).toBe("AU_NHI");
    expect(withB.themeKey).toBe("NGHIA_SI");
    expect(withA.sourceOfTheme).toBe("SELECTED_CHILD_BRANCH");
    expect(withB.availableThemeContexts.map((c) => c.label)).toEqual([
      "Em A · Ấu 1A",
      "Em B · Nghĩa 2",
    ]);
  });

  it("U-10 Admin không thuộc ngành → HUYNH_TRUONG / SYSTEM_ADMIN_DEFAULT", () => {
    const result = decide({
      scope: { kind: "PERSONAL", viewer: staff({ hasGlobalRole: true }) },
    });
    expect(result.themeKey).toBe("HUYNH_TRUONG");
    expect(result.sourceOfTheme).toBe("SYSTEM_ADMIN_DEFAULT");
    expect(result.branchId).toBeNull();
  });

  it("U-11 Admin kiêm GLV: HUYNH_TRUONG ở /admin, ngành của lớp ở scope=CLASS", () => {
    const viewer = staff({ hasGlobalRole: true, classAssignment: klass(AU) });
    expect(decide({ scope: { kind: "SYSTEM" } }).themeKey).toBe("HUYNH_TRUONG");
    expect(decide({ scope: { kind: "CLASS", class: klass(AU) } }).themeKey).toBe("AU_NHI");
    // Ở PERSONAL thì phân công lớp thắng vai trò toàn cục — vai trò KHÔNG
    // quyết định màu (10 §8).
    expect(decide({ scope: { kind: "PERSONAL", viewer } }).themeKey).toBe("AU_NHI");
  });

  it("U-12 Tài khoản chưa phân công → NO_ACTIVE_ASSIGNMENT", () => {
    const result = decide({ scope: { kind: "PERSONAL", viewer: staff() } });
    expect(result.themeKey).toBe("HUYNH_TRUONG");
    expect(result.fallbackReason).toBe("NO_ACTIVE_ASSIGNMENT");
  });

  it("U-13 🔴 Phân công năm mới CHƯA hiệu lực: vẫn giữ ngành năm hiện tại", () => {
    // `starts_on` tương lai bị `isEffectiveAssignment` loại ở tầng truy vấn,
    // nên hàm quyết định chỉ thấy phân công năm hiện tại.
    const tomorrow = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10);
    expect(isEffectiveAssignment({ is_active: true, starts_on: tomorrow, ends_on: null })).toBe(false);

    const result = decide({
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(AU) }) },
    });
    expect(result.themeKey).toBe("AU_NHI");
  });

  it("U-14 Kích hoạt năm học mới: ngành đổi ngay ở lần dựng trang kế tiếp", () => {
    const before = decide({
      currentAcademicYear: { id: OLD_YEAR_ID, code: "2025-2026" },
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(AU) }) },
    });
    const after = decide({
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(THIEU) }) },
    });
    expect(before.themeKey).toBe("AU_NHI");
    expect(before.academicYearCode).toBe("2025-2026");
    expect(after.themeKey).toBe("THIEU_NHI");
    expect(after.academicYearCode).toBe("2026-2027");
  });

  it("U-15 Chuyển ngành GIỮA năm: ngành mới ngay khi phân công mới hiệu lực", () => {
    expect(isEffectiveAssignment({ is_active: true, starts_on: todayInVietnam(), ends_on: null })).toBe(true);
    const result = decide({
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(NGHIA) }) },
    });
    expect(result.themeKey).toBe("NGHIA_SI");
  });

  it("U-16 Huỷ phân công → NO_ACTIVE_ASSIGNMENT", () => {
    expect(isEffectiveAssignment({ is_active: true, starts_on: "2026-09-01", ends_on: "2026-11-01" }, new Date("2026-11-15T05:00:00Z"))).toBe(false);
    const result = decide({ scope: { kind: "PERSONAL", viewer: staff({ hasActiveRole: false }) } });
    expect(result.fallbackReason).toBe("NO_ACTIVE_ASSIGNMENT");
  });

  it("U-17 Lưu trữ rồi khôi phục hồ sơ: mất theme ngành → khôi phục đúng ngành cũ", () => {
    const archived = decide({
      scope: { kind: "PERSONAL", viewer: { kind: "STUDENT", enrollment: null } },
    });
    expect(archived.themeKey).toBe("HUYNH_TRUONG");
    expect(archived.fallbackReason).toBe("NOT_ENROLLED_THIS_YEAR");

    const restored = decide({
      scope: { kind: "PERSONAL", viewer: { kind: "STUDENT", enrollment: klass(CHIEN, { className: "Chiên Con 2" }) } },
    });
    expect(restored.themeKey).toBe("CHIEN_CON");
  });

  it("U-18 Phân công is_active=false KHÔNG được dùng", () => {
    expect(isEffectiveAssignment({ is_active: false, starts_on: "2026-09-01", ends_on: null })).toBe(false);
  });

  it("U-19 Dữ liệu đổi → dựng lại trang cho kết quả mới (hàm thuần, không giữ trạng thái)", () => {
    const first = decide({ scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(AU) }) } });
    const second = decide({ scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(THIEU) }) } });
    expect(first.themeKey).toBe("AU_NHI");
    expect(second.themeKey).toBe("THIEU_NHI");
  });

  it("U-20 Trang báo cáo toàn hệ thống → CROSS_BRANCH_SCREEN, KHÔNG lấy ngẫu nhiên ngành", () => {
    const result = decide({ scope: { kind: "CROSS_BRANCH" } });
    expect(result.themeKey).toBe("HUYNH_TRUONG");
    expect(result.contextType).toBe("CROSS_BRANCH");
    expect(result.fallbackReason).toBe("CROSS_BRANCH_SCREEN");
    expect(result.branchId).toBeNull();
  });

  it("U-21 Xem dữ liệu lịch sử: themeKey KHÔNG đổi, isViewingArchivedData = true", () => {
    const live = decide({
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(AU) }) },
    });
    const archived = decide({
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(AU) }) },
      viewingAcademicYearId: OLD_YEAR_ID,
    });
    expect(archived.themeKey).toBe(live.themeKey);
    expect(archived.branchId).toBe(live.branchId);
    expect(archived.isViewingArchivedData).toBe(true);
    expect(live.isViewingArchivedData).toBe(false);
    expect(archived.fallbackReason).toBe("ARCHIVED_YEAR_VIEW");
  });

  it("U-22 Nhiều vai trò: R-1 chỉ một vai trò hiệu lực — hình dạng dữ liệu không cho phép mảng", () => {
    const facts = staff({ roleSectorBranch: AU });
    expect(Array.isArray(facts.roleSectorBranch)).toBe(false);
    expect(decide({ scope: { kind: "PERSONAL", viewer: facts } }).themeKey).toBe("AU_NHI");
  });

  it("U-23 Cookie trỏ ngữ cảnh NGOÀI QUYỀN: bỏ qua cookie, SELECTED_CONTEXT_FORBIDDEN", () => {
    const children = [
      child("dddddddd-0000-4000-8000-000000000001", "Em A", klass(AU)),
      child("dddddddd-0000-4000-8000-000000000002", "Em B", klass(NGHIA)),
    ];
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: {
          kind: "GUARDIAN",
          children,
          // id con của NGƯỜI KHÁC
          selectedChildIdFromCookie: "dddddddd-0000-4000-8000-0000000000ff",
        },
      },
    });
    expect(result.themeKey).toBe("HUYNH_TRUONG");
    expect(result.fallbackReason).toBe("SELECTED_CONTEXT_FORBIDDEN");
    // Không được lộ gì về ngữ cảnh ngoài quyền.
    expect(result.branchId).toBeNull();
  });

  it("U-23b Cookie sai định dạng → SELECTED_CONTEXT_INVALID", () => {
    const children = [
      child("dddddddd-0000-4000-8000-000000000001", "Em A", klass(AU)),
      child("dddddddd-0000-4000-8000-000000000002", "Em B", klass(NGHIA)),
    ];
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: { kind: "GUARDIAN", children, selectedChildIdFromCookie: "'; drop table students;--" },
      },
    });
    expect(result.fallbackReason).toBe("SELECTED_CONTEXT_INVALID");
    expect(result.themeKey).toBe("HUYNH_TRUONG");
  });

  it("U-24 Tải lại trang / đăng nhập lại: kết quả giống hệt", () => {
    const input: DecideThemeInput = {
      currentAcademicYear: YEAR,
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(AU) }) },
    };
    expect(decideThemeContext(input)).toEqual(decideThemeContext(input));
  });

  it("U-25 Hai tab, phân công vừa đổi: mỗi lần dựng đọc dữ liệu mới, không có cache sống lâu hơn request", () => {
    const tabMoi = decide({ scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(THIEU) }) } });
    const tabCu = decide({ scope: { kind: "PERSONAL", viewer: staff({ classAssignment: klass(AU) }) } });
    expect(tabMoi.themeKey).toBe("THIEU_NHI");
    expect(tabCu.themeKey).toBe("AU_NHI");
  });
});

// =====================================================================
// U-26..U-30 — bổ sung bắt buộc của 10 §12
// =====================================================================
describe("U-26 tất định", () => {
  it("100 lần chạy trên dữ liệu nhiều ứng viên → kết quả giống hệt", () => {
    const children = [
      child("dddddddd-0000-4000-8000-000000000001", "Em A", klass(AU, { className: "Ấu 1A" })),
      child("dddddddd-0000-4000-8000-000000000002", "Em B", klass(NGHIA, { className: "Nghĩa 2" })),
      child("dddddddd-0000-4000-8000-000000000003", "Em C", klass(THIEU, { className: "Thiếu 1B" })),
    ];
    const input: DecideThemeInput = {
      currentAcademicYear: YEAR,
      scope: { kind: "PERSONAL", viewer: { kind: "GUARDIAN", children, selectedChildIdFromCookie: null } },
    };

    const first = JSON.stringify(decideThemeContext(input));
    for (let run = 0; run < 100; run += 1) {
      expect(JSON.stringify(decideThemeContext(input))).toBe(first);
    }
    // Nhiều ứng viên, không tiêu chí chọn ⇒ KHÔNG chọn.
    expect(decideThemeContext(input).fallbackReason).toBe("MULTI_BRANCH_NO_SELECTION");
  });
});

describe("U-27 canh bảng màu", () => {
  it("mọi themeKey resolver có thể trả đều có mục trong SECTOR_PALETTE", () => {
    for (const key of THEME_KEYS) {
      expect(SECTOR_PALETTE[key]).toBeDefined();
    }
    // Chi tiết đối chiếu với seed.sql nằm ở tests/unit/sector-palette.test.ts.
  });
});

describe("U-28 canh tương phản", () => {
  it("5 khẳng định của 09 §4.5 đúng cho cả 6 bộ", () => {
    for (const key of THEME_KEYS) {
      const p = SECTOR_PALETTE[key];
      expect(contrastRatio(p.onPrimary, p.primary)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(p.onPrimary, p.hover)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(p.onPrimary, p.active)).toBeGreaterThanOrEqual(AA_TEXT);
      expect(contrastRatio(p.onPrimary, p.hover)).toBeGreaterThan(contrastRatio(p.onPrimary, p.primary));
      expect(contrastRatio("#2E2A27", p.pastel)).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });
});

describe("U-29 múi giờ", () => {
  it("starts_on <= hôm nay tính theo giờ Việt Nam, không theo giờ máy chủ", () => {
    // 2026-09-04T23:30Z = 2026-09-05T06:30 giờ VN ⇒ phân công 5/9 ĐÃ hiệu lực.
    const earlyMorningVn = new Date("2026-09-04T23:30:00Z");
    expect(todayInVietnam(earlyMorningVn)).toBe("2026-09-05");
    expect(hasStarted("2026-09-05", earlyMorningVn)).toBe(true);

    // Cùng thời điểm đó, nếu tính theo UTC sẽ ra 2026-09-04 và coi là chưa hiệu
    // lực — đây chính là lỗi SW-08 đã lặp ở 3 module.
    expect(earlyMorningVn.toISOString().slice(0, 10)).toBe("2026-09-04");

    // 2026-09-05T20:00Z = 2026-09-06T03:00 giờ VN ⇒ ngày 6/9 đã hiệu lực.
    const lateNightUtc = new Date("2026-09-05T20:00:00Z");
    expect(todayInVietnam(lateNightUtc)).toBe("2026-09-06");
    expect(hasStarted("2026-09-06", lateNightUtc)).toBe(true);
    expect(hasStarted("2026-09-07", lateNightUtc)).toBe(false);
  });

  it("chấp nhận cả timestamptz lẫn date từ Postgres", () => {
    const now = new Date("2026-09-10T05:00:00Z");
    expect(hasStarted("2026-09-01T00:00:00+07:00", now)).toBe(true);
  });
});

describe("U-30 phân công không hiệu lực", () => {
  it("is_active=false, ends_on đã đặt, hoặc starts_on tương lai đều bị loại", () => {
    const now = new Date("2026-11-15T05:00:00Z");
    expect(isEffectiveAssignment({ is_active: false, starts_on: "2026-09-01", ends_on: null }, now)).toBe(false);
    expect(isEffectiveAssignment({ is_active: true, starts_on: "2026-09-01", ends_on: "2026-10-01" }, now)).toBe(false);
    expect(isEffectiveAssignment({ is_active: true, starts_on: "2027-09-01", ends_on: null }, now)).toBe(false);
    expect(isEffectiveAssignment({ is_active: true, starts_on: "2026-09-01", ends_on: null }, now)).toBe(true);
  });

  it("ghi danh: paused VẪN giữ ngành (10 §8); các trạng thái đóng thì không", () => {
    // `now` cố định — test không được phụ thuộc đồng hồ máy chạy.
    const now = new Date("2026-11-15T05:00:00Z");
    const open = { enrolled_on: "2026-09-01", ended_on: null };

    expect(isEffectiveEnrollment({ status: "active", ...open }, now)).toBe(true);
    expect(isEffectiveEnrollment({ status: "paused", ...open }, now)).toBe(true);

    for (const status of ["completed", "repeating", "transferred", "withdrawn"]) {
      expect(isEffectiveEnrollment({ status, ...open }, now), status).toBe(false);
    }

    expect(
      isEffectiveEnrollment({ status: "active", enrolled_on: "2026-09-01", ended_on: "2026-10-01" }, now),
    ).toBe(false);
    // Ghi danh năm sau chưa tới ngày ⇒ chưa hiệu lực (cùng luật với U-13).
    expect(
      isEffectiveEnrollment({ status: "active", enrolled_on: "2027-09-01", ended_on: null }, now),
    ).toBe(false);
  });
});

// =====================================================================
// Các bước còn lại của R3 chưa nằm trong 25 tình huống trên
// =====================================================================
describe("R3 — các bước còn lại", () => {
  it("bước 0: chưa đặt năm học current → NO_CURRENT_ACADEMIC_YEAR, thắng mọi scope", () => {
    for (const scope of [
      { kind: "SYSTEM" } as const,
      { kind: "CLASS", class: klass(AU) } as const,
      { kind: "SECTOR", branch: NGHIA } as const,
    ]) {
      const result = decideThemeContext({ currentAcademicYear: null, scope });
      expect(result.themeKey).toBe("HUYNH_TRUONG");
      expect(result.fallbackReason).toBe("NO_CURRENT_ACADEMIC_YEAR");
      expect(result.academicYearId).toBeNull();
    }
  });

  it("bước 3a: lớp Dự trưởng → HUYNH_TRUONG / TRAINEE_CLASS_DEFAULT", () => {
    const result = decide({
      scope: { kind: "CLASS", class: klass(null, { isTrainee: true, className: "Dự trưởng HK1" }) },
    });
    expect(result.themeKey).toBe("HUYNH_TRUONG");
    expect(result.sourceOfTheme).toBe("TRAINEE_CLASS_DEFAULT");
  });

  it("bước 3a: GLV phụ trách lớp Dự trưởng ở PERSONAL cũng về mặc định", () => {
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: staff({ classAssignment: klass(null, { isTrainee: true }) }),
      },
    });
    expect(result.sourceOfTheme).toBe("TRAINEE_CLASS_DEFAULT");
  });

  it("bước 4: scope=SECTOR → ngành đó / CURRENT_RECORD_BRANCH", () => {
    const result = decide({ scope: { kind: "SECTOR", branch: NGHIA } });
    expect(result.themeKey).toBe("NGHIA_SI");
    expect(result.sourceOfTheme).toBe("CURRENT_RECORD_BRANCH");
    expect(result.contextType).toBe("SECTOR");
  });

  it("bước 5: scope=CHILD → ngành ghi danh hiện tại của con", () => {
    const result = decide({
      scope: {
        kind: "CHILD",
        child: child("dddddddd-0000-4000-8000-000000000001", "Em A", klass(CHIEN, { className: "Chiên Con 1" })),
      },
    });
    expect(result.themeKey).toBe("CHIEN_CON");
    expect(result.sourceOfTheme).toBe("SELECTED_CHILD_BRANCH");
    expect(result.contextType).toBe("CHILD");
  });

  it("bước 5: scope=CHILD với con không tồn tại/ngoài quyền → không lộ gì", () => {
    const result = decide({ scope: { kind: "CHILD", child: null } });
    expect(result.themeKey).toBe("HUYNH_TRUONG");
    expect(result.fallbackReason).toBe("SELECTED_CONTEXT_FORBIDDEN");
    expect(result.branchId).toBeNull();
  });

  it("bước 6 guardian: 0 con → NO_LINKED_CHILDREN", () => {
    const result = decide({
      scope: { kind: "PERSONAL", viewer: { kind: "GUARDIAN", children: [], selectedChildIdFromCookie: null } },
    });
    expect(result.fallbackReason).toBe("NO_LINKED_CHILDREN");
    expect(result.availableThemeContexts).toHaveLength(0);
  });

  it("bước 6 staff: role_assignments.class_id lệch class_staff_assignments → lấy phân công công tác + ROLE_CLASS_MISMATCH", () => {
    const result = decide({
      scope: {
        kind: "PERSONAL",
        viewer: staff({
          classAssignment: klass(THIEU, { classId: "cccccccc-0000-4000-8000-00000000000b", className: "Thiếu 1B" }),
          roleClass: klass(AU, { classId: "cccccccc-0000-4000-8000-00000000000a", className: "Ấu 2A" }),
        }),
      },
    });
    // Phân công công tác THẬT thắng.
    expect(result.themeKey).toBe("THIEU_NHI");
    expect(result.fallbackReason).toBe("ROLE_CLASS_MISMATCH");
  });

  it("bước 6 staff: chỉ có role_assignments.class_id → dùng ngành lớp đó, không báo lệch", () => {
    const result = decide({
      scope: { kind: "PERSONAL", viewer: staff({ roleClass: klass(AU) }) },
    });
    expect(result.themeKey).toBe("AU_NHI");
    expect(result.fallbackReason).toBeNull();
  });

  it("bước 6 staff: hai nguồn TRÙNG lớp thì không báo lệch", () => {
    const same = klass(AU);
    const result = decide({
      scope: { kind: "PERSONAL", viewer: staff({ classAssignment: same, roleClass: same }) },
    });
    expect(result.fallbackReason).toBeNull();
  });

  it("bước 6: tài khoản chưa liên kết hồ sơ → PROFILE_NOT_LINKED", () => {
    const result = decide({ scope: { kind: "PERSONAL", viewer: { kind: "NO_PROFILE" } } });
    expect(result.themeKey).toBe("HUYNH_TRUONG");
    expect(result.fallbackReason).toBe("PROFILE_NOT_LINKED");
  });

  it("bước 3: scope=CLASS với lớp ngoài quyền → trung tính, không lộ ngành", () => {
    const result = decide({ scope: { kind: "CLASS", class: null } });
    expect(result.themeKey).toBe("HUYNH_TRUONG");
    expect(result.branchId).toBeNull();
  });

  it("branchName LUÔN hiển thị được ở mọi nhánh", () => {
    const results = [
      decide({ scope: { kind: "SYSTEM" } }),
      decide({ scope: { kind: "CROSS_BRANCH" } }),
      decide({ scope: { kind: "CLASS", class: null } }),
      decide({ scope: { kind: "PERSONAL", viewer: { kind: "NO_PROFILE" } } }),
      decideThemeContext({ currentAcademicYear: null, scope: { kind: "SYSTEM" } }),
    ];
    for (const result of results) {
      expect(result.branchName.length).toBeGreaterThan(0);
    }
  });
});
