import { describe, expect, it } from "vitest";
import {
  DUPLICATE_FIELD,
  DUPLICATE_PENDING_FIELD,
  canMergeInto,
  decideDuplicateRow,
  hasPendingDuplicate,
  pendingDuplicateMessage,
  resolveDuplicateWarnings,
} from "@/features/imports/row-decision";

/**
 * M12-A — mặc định an toàn cho dòng trùng (TO-BE 2 / BR-M12-31·32·33 / D-133).
 *
 * Bài quan trọng nhất của file không phải "mặc định đổi sang Ghép" mà là **cặp
 * mặc-định + chặn**: một mặc định an toàn mà không bắt người xác nhận thì vẫn là
 * máy quyết thay người, và ca so khớp sai làm em MỚI không có hồ sơ còn em CŨ bị
 * ghi danh nhầm lớp.
 */
const HIGH = {
  level: "high" as const,
  studentId: "11111111-1111-4111-8111-111111111111",
  reason: "Trùng họ tên, ngày sinh và SĐT phụ huynh với CQ0001.",
  status: "active",
};

describe("decideDuplicateRow", () => {
  it("dòng không trùng ai giữ nguyên Tạo mới và không có cảnh báo", () => {
    expect(decideDuplicateRow(null)).toEqual({ action: "create", warning: null });
  });

  it("AC-18: trùng chắc chắn mặc định là Ghép", () => {
    const decision = decideDuplicateRow(HIGH);
    expect(decision.action).toBe("merge");
  });

  it("AC-19: trùng chắc chắn bị đánh dấu CHỜ XÁC NHẬN nên chưa ghi được", () => {
    const decision = decideDuplicateRow(HIGH);
    expect(decision.warning?.field).toBe(DUPLICATE_PENDING_FIELD);
    expect(hasPendingDuplicate([decision.warning!])).toBe(true);
  });

  it("nhiều khả năng trùng cũng mặc định Ghép, nhưng KHÔNG chặn ghi", () => {
    const decision = decideDuplicateRow({ ...HIGH, level: "medium" });
    expect(decision.action).toBe("merge");
    expect(decision.warning?.field).toBe(DUPLICATE_FIELD);
    expect(hasPendingDuplicate([decision.warning!])).toBe(false);
  });

  it("mức thấp (tên gần giống) giữ Tạo mới — ghép nhầm ở mức này tốn kém hơn", () => {
    const decision = decideDuplicateRow({ ...HIGH, level: "low" });
    expect(decision.action).toBe("create");
    expect(decision.warning?.field).toBe(DUPLICATE_FIELD);
  });

  it("AC-20: hồ sơ đối chiếu đã rút thì vẫn cảnh báo, và PHẢI xác nhận", () => {
    const decision = decideDuplicateRow({ ...HIGH, level: "medium", status: "withdrawn" });
    expect(decision.action).toBe("merge");
    expect(decision.warning?.field).toBe(DUPLICATE_PENDING_FIELD);
    // Câu chữ phải chỉ ra việc cần làm, vì trigger của M03-C sẽ từ chối ghi danh.
    expect(decision.warning?.message).toContain("khôi phục");
    expect(decision.warning?.message).toContain("Đã rút");
  });

  it("hồ sơ đối chiếu đã lưu trữ cũng vậy", () => {
    const decision = decideDuplicateRow({ ...HIGH, status: "archived" });
    expect(decision.warning?.message).toContain("Lưu trữ");
  });

  it("mức thấp + hồ sơ không hoạt động KHÔNG bị chặn, vì mặc định của nó là Tạo mới", () => {
    const decision = decideDuplicateRow({ ...HIGH, level: "low", status: "withdrawn" });
    expect(decision.action).toBe("create");
    expect(hasPendingDuplicate([decision.warning!])).toBe(false);
  });
});

describe("canMergeInto", () => {
  it("chỉ hồ sơ đang sinh hoạt mới ghép được (BR-M03-N13)", () => {
    expect(canMergeInto("active")).toBe(true);
    for (const status of ["temporarily_inactive", "withdrawn", "archived"]) {
      expect(canMergeInto(status)).toBe(false);
    }
  });
});

describe("resolveDuplicateWarnings", () => {
  it("người duyệt quyết xong thì cảnh báo hết chặn nhưng VẪN CÒN HIỆN", () => {
    const warnings = [
      { field: DUPLICATE_PENDING_FIELD, message: "[high] Trùng với CQ0001." },
      { field: "gender", message: "Thiếu giới tính." },
    ];
    const resolved = resolveDuplicateWarnings(warnings);
    expect(hasPendingDuplicate(resolved)).toBe(false);
    expect(resolved[0]).toEqual({ field: DUPLICATE_FIELD, message: "[high] Trùng với CQ0001." });
    expect(resolved[1]).toEqual(warnings[1]);
  });

  it("không đụng vào dòng không có cảnh báo trùng", () => {
    const warnings = [{ field: "class", message: "Lớp lấy từ ô chọn." }];
    expect(resolveDuplicateWarnings(warnings)).toEqual(warnings);
  });
});

describe("pendingDuplicateMessage", () => {
  it("nêu số dòng cụ thể, tối đa 5 số", () => {
    const text = pendingDuplicateMessage([3, 17, 42]);
    expect(text).toContain("3 dòng");
    expect(text).toContain("#3, #17, #42");
    expect(text).not.toContain("…");
  });

  it("nhiều hơn 5 dòng thì cắt bớt nhưng vẫn nói tổng số", () => {
    const text = pendingDuplicateMessage([1, 2, 3, 4, 5, 6, 7]);
    expect(text).toContain("7 dòng");
    expect(text).toContain("#5…");
    expect(text).not.toContain("#6");
  });
});
