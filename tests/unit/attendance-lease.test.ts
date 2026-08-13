import { describe, expect, it } from "vitest";
import {
  LEASE_WARNING_MS,
  buildDraftHandoffText,
  leaseRemainingMs,
  leaseStatus,
  type DraftLine,
} from "@/features/attendance/lease";

/**
 * M05-C · TB-05 / AC-F05-3 · AC-F05-4 — đồng hồ phiên chỉnh sửa.
 *
 * Hàm nhận **mốc hết hạn của máy chủ** và **mốc "bây giờ"** làm tham số, nên
 * test được mà không phải đổi đồng hồ máy — cùng khuôn `mostRecentMeetingDate`
 * (TB-01) và `absenceReviewWindow` (M05-B).
 */
const NOW = Date.parse("2026-08-03T10:00:00Z");

function inMinutes(minutes: number): string {
  return new Date(NOW + minutes * 60_000).toISOString();
}

describe("AC-F05-4 — còn bao lâu", () => {
  it("chưa biết mốc hết hạn thì không hiện gì, KHÔNG đoán bừa", () => {
    expect(leaseRemainingMs(null, NOW)).toBeNull();
    expect(leaseStatus(null, NOW)).toBeNull();
  });

  it("chuỗi ngày hỏng cũng trả null thay vì NaN chạy tiếp xuống màn hình", () => {
    expect(leaseRemainingMs("không-phải-ngày", NOW)).toBeNull();
    expect(leaseStatus("không-phải-ngày", NOW)).toBeNull();
  });

  it("còn nhiều thời gian thì giọng bình thường và nêu số phút", () => {
    const status = leaseStatus(inMinutes(12), NOW);

    expect(status?.tone).toBe("info");
    expect(status?.text).toContain("12 phút");
    expect(status?.text).toContain("Bạn đang giữ quyền sửa");
  });

  it("🔴 làm tròn LÊN — còn 30 giây phải hiện 1 phút, không hiện 0", () => {
    const status = leaseStatus(new Date(NOW + 30_000).toISOString(), NOW);

    expect(status?.text).toContain("1 phút");
    expect(status?.text).not.toContain("0 phút");
  });

  it("dưới ngưỡng 3 phút thì đổi giọng và giục lưu nháp (TB-05 bước 3)", () => {
    const status = leaseStatus(new Date(NOW + LEASE_WARNING_MS - 1_000).toISOString(), NOW);

    expect(status?.tone).toBe("warning");
    expect(status?.text).toContain("Lưu nháp");
  });

  it("đúng mốc 3 phút đã tính là sắp hết — biên nghiêng về phía an toàn", () => {
    expect(leaseStatus(inMinutes(3), NOW)?.tone).toBe("warning");
    expect(leaseStatus(new Date(NOW + LEASE_WARNING_MS + 1_000).toISOString(), NOW)?.tone).toBe(
      "info",
    );
  });

  it("🔴 quá hạn KHÔNG nói “bạn đã mất quyền sửa”", () => {
    const status = leaseStatus(inMinutes(-2), NOW);

    // Lease hết hạn không tự chuyển quyền cho ai: chừng nào chưa có người tiếp
    // quản thì lượt lưu tiếp theo vẫn đi lọt. Nói quá lên là làm người ta bỏ dở
    // một buổi còn cứu được.
    expect(status?.tone).toBe("expired");
    expect(status?.text).toContain("có thể tiếp quản");
    expect(status?.text).not.toContain("đã mất quyền");
  });
});

describe("AC-F05-3 — chép lại phần chưa lưu khi bị tiếp quản", () => {
  const lines: DraftLine[] = [
    {
      label: "Giuse Nguyễn Minh An",
      massLabel: "Có mặt",
      catechismLabel: "Có mặt",
      note: "",
      isException: false,
    },
    {
      label: "Maria Trần Thị Ánh",
      massLabel: "Vắng có phép",
      catechismLabel: "Vắng có phép",
      note: "Cháu về quê giỗ ông",
      isException: true,
    },
    {
      label: "Phêrô Lê Văn Đức",
      massLabel: "Đi trễ",
      catechismLabel: "Có mặt",
      note: "  ",
      isException: true,
    },
  ];

  it("chỉ chép NGOẠI LỆ — 50 dòng “Có mặt” thì không ai đọc nổi", () => {
    const text = buildDraftHandoffText(lines);

    expect(text).not.toContain("Giuse Nguyễn Minh An");
    expect(text.split("\n")).toHaveLength(2);
  });

  it("mỗi dòng có tên em, cả hai cột và ghi chú", () => {
    const text = buildDraftHandoffText(lines);

    expect(text).toContain(
      "Maria Trần Thị Ánh: Thánh lễ Vắng có phép, Giáo lý Vắng có phép — Cháu về quê giỗ ông",
    );
    // Ghi chú toàn khoảng trắng không sinh ra một dấu gạch cụt lủn.
    expect(text).toContain("Phêrô Lê Văn Đức: Thánh lễ Đi trễ, Giáo lý Có mặt");
    expect(text).not.toContain("Có mặt —");
  });

  it("không có ngoại lệ nào thì nói thẳng như vậy, không trả chuỗi rỗng", () => {
    expect(buildDraftHandoffText([lines[0]])).toBe("Không có ngoại lệ nào chưa lưu.");
    expect(buildDraftHandoffText([])).toBe("Không có ngoại lệ nào chưa lưu.");
  });
});
