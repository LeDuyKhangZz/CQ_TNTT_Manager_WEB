import { describe, expect, it } from "vitest";
import {
  ROSTER_FILTERS,
  countRosterFilters,
  emptyRosterMessage,
  filterRoster,
  type RosterDraftLookup,
  type RosterFilterEntry,
} from "@/features/attendance/roster-filter";

/**
 * M05-C · U-11 / TB-09 — bộ lọc danh sách điểm danh.
 *
 * Ở 360px một lớp 50 em dài ~9.000px, nên "soát lại mình đã đánh vắng ai" là
 * cuộn hết cả trang. Bộ lọc chạy trên **bản nháp đang gõ**; đó là điều dễ cài
 * sai nhất và cũng là điều đắt nhất nếu sai — lọc theo dữ liệu đã lưu thì em
 * vừa được đánh vắng KHÔNG xuất hiện trong nhóm "Đang vắng", và người dùng kết
 * luận rằng cú bấm vừa rồi không ăn.
 */
const ROSTER: RosterFilterEntry[] = [
  { enrollmentId: "e1", label: "Giuse Nguyễn Minh An", pendingAbsenceReason: null, warnings: [] },
  {
    enrollmentId: "e2",
    label: "Maria Trần Thị Ánh",
    pendingAbsenceReason: "Cháu về quê giỗ ông",
    warnings: [],
  },
  {
    enrollmentId: "e3",
    label: "Phêrô Lê Văn Đức",
    pendingAbsenceReason: null,
    warnings: ["Vắng lễ Chúa nhật nhiều buổi liên tiếp"],
  },
  { enrollmentId: "e4", label: "Anna Phạm Bảo Trân", pendingAbsenceReason: null, warnings: [] },
];

const ALL_PRESENT: RosterDraftLookup = {
  e1: { mass: "present", catechism: "present" },
  e2: { mass: "present", catechism: "present" },
  e3: { mass: "present", catechism: "present" },
  e4: { mass: "present", catechism: "present" },
};

function labels(entries: readonly RosterFilterEntry[]): string[] {
  return entries.map((entry) => entry.label);
}

describe("U-11 — nhóm lọc", () => {
  it("“Tất cả” giữ nguyên thứ tự và không bỏ sót em nào", () => {
    expect(labels(filterRoster(ROSTER, ALL_PRESENT, "all", ""))).toEqual(labels(ROSTER));
  });

  it("🔴 “Đang vắng” đọc BẢN NHÁP, không đọc dữ liệu đã lưu", () => {
    const draft: RosterDraftLookup = {
      ...ALL_PRESENT,
      e4: { mass: "present", catechism: "unexcused_absence" },
    };

    expect(labels(filterRoster(ROSTER, draft, "absent", ""))).toEqual(["Anna Phạm Bảo Trân"]);
    // Cùng danh sách ấy, chưa sửa gì thì nhóm này rỗng.
    expect(filterRoster(ROSTER, ALL_PRESENT, "absent", "")).toHaveLength(0);
  });

  it("vắng ở BẤT KỲ cột nào cũng là “Đang vắng” — hai cột độc lập (D-30)", () => {
    const massOnly: RosterDraftLookup = {
      ...ALL_PRESENT,
      e1: { mass: "excused_absence", catechism: "present" },
    };
    expect(labels(filterRoster(ROSTER, massOnly, "absent", ""))).toEqual([
      "Giuse Nguyễn Minh An",
    ]);
  });

  it("“Đi trễ” và “Về sớm” KHÔNG phải vắng — đúng `isAbsent` của cả hệ thống", () => {
    const late: RosterDraftLookup = {
      ...ALL_PRESENT,
      e1: { mass: "late", catechism: "left_early" },
    };
    expect(filterRoster(ROSTER, late, "absent", "")).toHaveLength(0);
  });

  it("“Có đơn” và “Cảnh báo” lấy đúng em của mình", () => {
    expect(labels(filterRoster(ROSTER, ALL_PRESENT, "requested", ""))).toEqual([
      "Maria Trần Thị Ánh",
    ]);
    expect(labels(filterRoster(ROSTER, ALL_PRESENT, "warned", ""))).toEqual(["Phêrô Lê Văn Đức"]);
  });
});

describe("U-11 — ô tìm tên bỏ dấu", () => {
  it("gõ không dấu vẫn ra tên có dấu", () => {
    expect(labels(filterRoster(ROSTER, ALL_PRESENT, "all", "duc"))).toEqual([
      "Phêrô Lê Văn Đức",
    ]);
  });

  it("chữ Đ hoa cũng bỏ dấu được — Unicode không coi nó là “d + dấu phụ”", () => {
    expect(labels(filterRoster(ROSTER, ALL_PRESENT, "all", "le van d"))).toEqual([
      "Phêrô Lê Văn Đức",
    ]);
  });

  it("tìm và lọc nhóm áp CÙNG LÚC, không cái nào ghi đè cái nào", () => {
    const draft: RosterDraftLookup = {
      ...ALL_PRESENT,
      e1: { mass: "unexcused_absence", catechism: "unexcused_absence" },
      e4: { mass: "unexcused_absence", catechism: "unexcused_absence" },
    };
    expect(labels(filterRoster(ROSTER, draft, "absent", "minh an"))).toEqual([
      "Giuse Nguyễn Minh An",
    ]);
    // Cùng chữ ấy nhưng lỏng hơn thì ra cả hai em đang vắng — bằng chứng rằng
    // hai điều kiện thật sự nhân nhau chứ không phải cái này nuốt cái kia.
    expect(labels(filterRoster(ROSTER, draft, "absent", "an"))).toEqual([
      "Giuse Nguyễn Minh An",
      "Anna Phạm Bảo Trân",
    ]);
    // Cả bốn tên đều chứa "an" khi bỏ dấu (tr**an**, v**an**…) — nhóm "Tất cả"
    // không đọc bản nháp nên giữ nguyên cả bốn.
    expect(labels(filterRoster(ROSTER, draft, "all", "an"))).toHaveLength(4);
  });

  it("khoảng trắng thừa không làm hỏng phép tìm", () => {
    expect(filterRoster(ROSTER, ALL_PRESENT, "all", "  minh   an  ")).toHaveLength(1);
  });
});

describe("U-11 — con số trên nhãn nút lọc", () => {
  it("🔴 đếm theo CẢ BUỔI, không theo kết quả tìm đang hiện", () => {
    const draft: RosterDraftLookup = {
      ...ALL_PRESENT,
      e1: { mass: "unexcused_absence", catechism: "present" },
    };
    const counts = countRosterFilters(ROSTER, draft);

    expect(counts).toEqual({ all: 4, absent: 1, requested: 1, warned: 1 });
    // Ô tìm không phải tham số của hàm đếm — đó chính là điều cần chốt: người
    // ta đọc con số để quyết định có bấm nút hay không, nên nó phải nói về cả
    // buổi chứ không về trang đang xem.
    expect(Object.keys(counts).sort()).toEqual([...ROSTER_FILTERS].sort());
  });

  it("em chưa có bản nháp không bị tính là vắng", () => {
    expect(countRosterFilters(ROSTER, {}).absent).toBe(0);
  });
});

describe("U-11 — câu giải thích khi lọc ra rỗng", () => {
  it("nêu đúng chữ vừa gõ VÀ đúng nhóm đang lọc", () => {
    expect(emptyRosterMessage("warned", " Hoa ")).toContain("Hoa");
    expect(emptyRosterMessage("warned", " Hoa ")).toContain("Cảnh báo");
  });

  it("không gõ gì thì nói lý do của chính nhóm đó", () => {
    expect(emptyRosterMessage("absent", "")).toBe("Chưa em nào được đánh vắng trong buổi này.");
    expect(emptyRosterMessage("requested", "")).toContain("đơn xin nghỉ");
    expect(emptyRosterMessage("warned", "")).toContain("cảnh báo chuyên cần");
  });
});
