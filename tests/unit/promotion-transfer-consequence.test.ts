import { describe, expect, it } from "vitest";
import {
  describeTransferConsequence,
  describeTransferSuccess,
  transferConfirmLabel,
} from "@/features/promotions/transfer-consequence";

/**
 * M08-B — **D-159**, câu chữ của hộp xác nhận "Chuyển lớp" và câu phản hồi sau đó.
 *
 * `11` §5 có hai mục mà bộ test này canh trực tiếp:
 *   · *"thao tác nguy hiểm có `ConfirmDialog` nêu hậu quả **bằng tên riêng**"*;
 *   · *"mọi thao tác ghi có phản hồi (D-61)"* — và phản hồi phải nói ra **kết quả
 *     thật**, vì một câu "Đã lưu" suông không phân biệt được với một câu thành
 *     công giả (bài học M02-A).
 */

const BASE = {
  studentName: "Maria Nguyễn Thị An",
  sourceClassName: "Ấu 1B",
  sourceYearCode: "2080-2081",
  proposeTrainee: false,
  targetLabel: "Ấu 2B · 2081-2082",
} as const;

describe("hậu quả nêu bằng tên riêng", () => {
  it("lên lớp: nêu đủ tên em · lớp đang học · năm nguồn · lớp đích kèm năm", () => {
    const text = describeTransferConsequence({ ...BASE, proposedStatus: "recommended_promote" });
    expect(text).toContain("Maria Nguyễn Thị An");
    expect(text).toContain("Ấu 1B");
    expect(text).toContain("2080-2081");
    expect(text).toContain("Ấu 2B · 2081-2082");
    expect(text).toContain("không có đường lùi");
  });

  it("học lại cũng đóng ghi danh cũ nên cũng phải cảnh báo không lùi được", () => {
    const text = describeTransferConsequence({ ...BASE, proposedStatus: "recommended_repeat" });
    expect(text).toContain("không có đường lùi");
  });

  it("Dự trưởng: nói rõ hệ thống TỰ chọn lớp, vì người dùng không được chọn ô nào", () => {
    const text = describeTransferConsequence({
      ...BASE,
      proposedStatus: "recommended_promote",
      proposeTrainee: true,
      targetLabel: null,
    });
    expect(text).toContain("Dự trưởng");
    expect(text).toContain("tự chọn");
  });

  it("rút học: nói rõ KHÔNG có ghi danh mới nào được tạo", () => {
    const text = describeTransferConsequence({
      ...BASE,
      proposedStatus: "withdraw",
      targetLabel: null,
    });
    expect(text).toContain("Rút học");
    expect(text).toContain("không có ghi danh mới");
    expect(text).toContain("không có đường lùi");
  });

  it("🔴 tạm nghỉ KHÔNG được doạ 'không có đường lùi' — trang Lớp có sẵn nút Khôi phục", () => {
    const text = describeTransferConsequence({
      ...BASE,
      proposedStatus: "temporarily_pause",
      targetLabel: null,
    });
    expect(text).toContain("Tạm nghỉ");
    expect(text).toContain("Khôi phục");
    expect(text).not.toContain("không có đường lùi");
  });

  it("chưa chọn lớp đích thì nói 'chưa chọn', không in một chỗ trống", () => {
    const text = describeTransferConsequence({
      ...BASE,
      proposedStatus: "recommended_promote",
      targetLabel: null,
    });
    expect(text).toContain("chưa chọn");
  });
});

describe("nhãn nút xác nhận nói ra việc sắp làm", () => {
  it("mỗi trạng thái một nhãn riêng, không có 'Đồng ý' chung chung", () => {
    expect(transferConfirmLabel("recommended_promote", false)).toBe("Chuyển lên lớp");
    expect(transferConfirmLabel("recommended_repeat", false)).toBe("Cho học lại");
    expect(transferConfirmLabel("temporarily_pause", false)).toBe("Chuyển sang Tạm nghỉ");
    expect(transferConfirmLabel("withdraw", false)).toBe("Ghi nhận Rút học");
    expect(transferConfirmLabel("recommended_promote", true)).toBe("Chuyển sang Dự trưởng");
  });
});

describe("D-61 — câu thành công nêu kết quả thật", () => {
  it("lên lớp nói ra CẢ HAI việc đã xảy ra: đóng ghi danh cũ và tạo ghi danh mới", () => {
    const text = describeTransferSuccess("Maria Nguyễn Thị An", "recommended_promote", false);
    expect(text).toContain("Maria Nguyễn Thị An");
    expect(text).toContain("đã đóng");
    expect(text).toContain("đã được tạo");
  });

  it("rút học KHÔNG được nói 'ghi danh mới đã được tạo' — không có ghi danh nào được tạo", () => {
    const text = describeTransferSuccess("Maria Nguyễn Thị An", "withdraw", false);
    expect(text).toContain("rút học");
    expect(text).not.toContain("ghi danh mới đã được tạo");
  });

  it("tạm nghỉ nói đúng trạng thái mới của em", () => {
    expect(describeTransferSuccess("Maria Nguyễn Thị An", "temporarily_pause", false))
      .toContain("Tạm nghỉ");
  });
});
