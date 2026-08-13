import { describe, expect, it } from "vitest";
import {
  approveConfirmLabel,
  describeApproveConsequence,
} from "@/features/promotions/review-consequence";

/**
 * M08-C — câu hậu quả của hộp xác nhận **"Duyệt"** (**AC-14 / TO-BE 6**).
 *
 * `06_UI_UX_RECOMMENDATIONS` §3 xếp mục này mức **Cao** và nợ đã được mang qua
 * hai đợt. Bộ test canh ba điều mà một hộp xác nhận sai sẽ hỏng ở đó:
 *
 *   · **Bốn tên riêng** (`11` §5) — tên em · lớp đang học · năm nguồn · lớp sẽ vào.
 *   · **Lớp đang sắp ghi vào**, không phải lớp trong đề xuất — người duyệt đổi
 *     được ô "Lớp đích khi duyệt", và hai thứ đó khác nhau đúng lúc nguy hiểm nhất.
 *   · **"Tạm nghỉ" KHÔNG bị doạ là không lùi được** — nó lùi được bằng nút
 *     "Khôi phục" ở trang Lớp (M03-A). Doạ người dùng bằng một câu sai cũng là
 *     nói sai.
 */

const BASE = {
  studentName: "Maria Nguyễn Thị An",
  sourceClassName: "Ấu 1B",
  sourceYearCode: "2080-2081",
  proposeTrainee: false,
} as const;

describe("hộp xác nhận Duyệt", () => {
  it("nêu đủ bốn tên riêng cho một lượt lên lớp", () => {
    const text = describeApproveConsequence({
      ...BASE,
      proposedStatus: "recommended_promote",
      targetLabel: "Ấu 2B · 2081-2082",
    });
    expect(text).toContain("Maria Nguyễn Thị An");
    expect(text).toContain("Ấu 1B");
    expect(text).toContain("2080-2081");
    expect(text).toContain("Ấu 2B · 2081-2082");
    expect(text).toContain("không có đường lùi");
  });

  it("nói rõ đây là quyết định CỦA NGƯỜI KHÁC mà mình đang thi hành", () => {
    const text = describeApproveConsequence({
      ...BASE,
      proposedStatus: "recommended_promote",
      targetLabel: "Ấu 2B · 2081-2082",
    });
    expect(text).toContain("Duyệt đề xuất của đại diện lớp");
  });

  it("🔴 nói ra khi người duyệt ĐÃ ĐỔI lớp đích so với lớp đại diện đề nghị", () => {
    const text = describeApproveConsequence({
      ...BASE,
      proposedStatus: "recommended_promote",
      targetLabel: "Ấu 2A · 2081-2082",
      proposedTargetLabel: "Ấu 2B · 2081-2082",
    });
    expect(text).toContain("đại diện lớp đề nghị Ấu 2B · 2081-2082");
    expect(text).toContain("bạn đang chọn Ấu 2A · 2081-2082");
  });

  it("không đổi lớp thì KHÔNG thêm câu nhiễu", () => {
    const text = describeApproveConsequence({
      ...BASE,
      proposedStatus: "recommended_promote",
      targetLabel: "Ấu 2B · 2081-2082",
      proposedTargetLabel: "Ấu 2B · 2081-2082",
    });
    expect(text).not.toContain("Lưu ý");
  });

  it("Dự trưởng: nói rõ hệ thống tự chọn lớp, không đòi lớp đích", () => {
    const text = describeApproveConsequence({
      ...BASE,
      proposeTrainee: true,
      proposedStatus: "recommended_promote",
      targetLabel: null,
    });
    expect(text).toContain("Dự trưởng");
    expect(text).toContain("hệ thống tự chọn");
  });

  it("Tạm nghỉ KHÔNG bị doạ là không lùi được — trang Lớp có nút Khôi phục", () => {
    const text = describeApproveConsequence({
      ...BASE,
      proposedStatus: "temporarily_pause",
      targetLabel: null,
    });
    expect(text).not.toContain("không có đường lùi");
    expect(text).toContain("Khôi phục");
  });

  it("Rút học: nói rõ KHÔNG có ghi danh mới nào được tạo", () => {
    const text = describeApproveConsequence({
      ...BASE,
      proposedStatus: "withdraw",
      targetLabel: null,
    });
    expect(text).toContain("không có ghi danh mới nào được tạo");
    expect(text).toContain("không có đường lùi");
  });

  it("chưa chọn lớp đích thì nói 'chưa chọn', không im lặng bỏ trống", () => {
    const text = describeApproveConsequence({
      ...BASE,
      proposedStatus: "recommended_repeat",
      targetLabel: null,
    });
    expect(text).toContain("chưa chọn");
  });
});

describe("nhãn nút xác nhận", () => {
  it("nói ra VIỆC SẮP LÀM, không phải 'Đồng ý'", () => {
    expect(approveConfirmLabel("recommended_promote", false)).toBe("Duyệt lên lớp");
    expect(approveConfirmLabel("recommended_repeat", false)).toBe("Duyệt cho học lại");
    expect(approveConfirmLabel("temporarily_pause", false)).toBe("Duyệt Tạm nghỉ");
    expect(approveConfirmLabel("withdraw", false)).toBe("Duyệt Rút học");
    expect(approveConfirmLabel("recommended_promote", true)).toBe("Duyệt vào Dự trưởng");
  });
});
