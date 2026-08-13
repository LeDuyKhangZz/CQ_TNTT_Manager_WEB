import { describe, expect, it } from "vitest";
import { batchRefSchema, rowEditsSchema } from "@/features/imports/schemas";
import {
  cancelFeedback,
  commitFeedback,
  importFailureFeedback,
  purgeRawFeedback,
  rowEditsFeedback,
} from "@/features/imports/import-feedback";

/**
 * M12-A — ranh giới Zod (hạng mục 9) và câu chữ phản hồi (TO-BE 1).
 * **M12-B** — cùng ranh giới ấy sau khi cả trang dòng đi lên trong một lượt gửi.
 *
 * Biên bản audit trừ điểm C6 vì **không có Zod ở boundary**: bốn thao tác nhận
 * chuỗi thô rồi ném thẳng vào `.eq()` và vào tham số RPC. Câu lỗi phải nói đúng
 * thứ hỏng — một `rowId` sai mà hiện ra câu nói về *file* là dẫn người dùng đi
 * sửa nhầm chỗ.
 */
describe("Zod ở biên của luồng nhập", () => {
  const uuid = "22222222-2222-4222-8222-222222222222";
  const batchId = "33333333-3333-4333-8333-333333333333";
  const base = { batchId, confirmRowId: null, bulkGender: null };

  it("chuỗi rỗng không đi qua được, và câu lỗi nói về DÒNG chứ không về file", () => {
    const parsed = rowEditsSchema.safeParse({
      ...base,
      entries: [{ rowId: "", gender: null, action: "create", picked: false }],
    });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].message).toContain("Dòng nhập không hợp lệ");
  });

  it("cách xử lý lạ bị chặn", () => {
    const entry = { rowId: uuid, gender: null, picked: false };
    expect(
      rowEditsSchema.safeParse({ ...base, entries: [{ ...entry, action: "delete" }] }).success,
    ).toBe(false);
    expect(
      rowEditsSchema.safeParse({ ...base, entries: [{ ...entry, action: "merge" }] }).success,
    ).toBe(true);
  });

  it("giới tính chỉ nhận ba giá trị của enum, không nhận chuỗi tiếng Việt", () => {
    const entry = { rowId: uuid, action: null, picked: false };
    expect(
      rowEditsSchema.safeParse({ ...base, entries: [{ ...entry, gender: "Nam" }] }).success,
    ).toBe(false);
    expect(
      rowEditsSchema.safeParse({ ...base, entries: [{ ...entry, gender: "male" }] }).success,
    ).toBe(true);
  });

  it("mã lần nhập phải là UUID", () => {
    expect(batchRefSchema.safeParse({ batchId: "abc" }).success).toBe(false);
    expect(batchRefSchema.safeParse({ batchId: uuid }).success).toBe(true);
  });

  it("khoá lạ bị cắt bỏ, không đi tiếp vào câu lệnh ghi", () => {
    const parsed = rowEditsSchema.parse({
      ...base,
      entries: [
        { rowId: uuid, gender: null, action: "skip", picked: true, status: "committed" },
      ],
    });
    expect(parsed.entries[0]).toEqual({ rowId: uuid, gender: null, action: "skip", picked: true });
  });

  it("🔴 một lượt lưu quá 200 dòng bị chặn ở biên, không đi tới cơ sở dữ liệu", () => {
    const entries = Array.from({ length: 201 }, () => ({
      rowId: uuid,
      gender: "male",
      action: null,
      picked: true,
    }));
    const parsed = rowEditsSchema.safeParse({ ...base, entries });
    expect(parsed.success).toBe(false);
    expect(parsed.error?.issues[0].message).toContain("tối đa 200 dòng");
    // 200 vẫn qua được: trang lớn nhất là 50 dòng nên trần này rộng gấp bốn.
    expect(rowEditsSchema.safeParse({ ...base, entries: entries.slice(0, 200) }).success).toBe(true);
  });
});

/**
 * M12-B / AC-21 — câu chữ của lượt lưu hàng loạt.
 *
 * 🔴 Điều quan trọng nhất được canh ở đây là **D-133 không bị nuốt**: dòng nghi
 * trùng chắc chắn mà lượt lưu hàng loạt cố ý bỏ qua thì màn hình phải nói ra,
 * kèm số dòng và chỗ phải bấm. Im lặng bỏ qua nghĩa là người duyệt tưởng đã xong
 * và chỉ phát hiện ra khi bấm Ghi bị chặn.
 */
describe("câu chữ lưu hàng loạt (AC-21 · D-133)", () => {
  it("lưu trọn vẹn: giọng thành công, nêu đúng số dòng", () => {
    const feedback = rowEditsFeedback({ saved: 27, blocked: [], failures: [] });
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toContain("Đã lưu 27 dòng");
  });

  it("🔴 dòng trùng bị bỏ qua phải được NÓI RA, kèm số dòng và việc phải làm", () => {
    const feedback = rowEditsFeedback({ saved: 12, blocked: [3, 17, 42], failures: [] });
    expect(feedback.text).toContain("Đã lưu 12 dòng");
    expect(feedback.text).toContain("#3, #17, #42");
    expect(feedback.text).toContain("Xác nhận dòng này");
    // Không phải lỗi — người duyệt chưa làm sai gì cả.
    expect(feedback.tone).toBe("info");
  });

  it("chỉ liệt kê 5 số dòng đầu rồi thôi, không đổ cả danh sách ra màn hình", () => {
    const feedback = rowEditsFeedback({ saved: 0, blocked: [1, 2, 3, 4, 5, 6, 7], failures: [] });
    expect(feedback.text).toContain("#1, #2, #3, #4, #5…");
    expect(feedback.text).not.toContain("#6");
  });

  it("không có gì để lưu thì nói thẳng, không giả vờ đã lưu", () => {
    const feedback = rowEditsFeedback({ saved: 0, blocked: [], failures: [] });
    expect(feedback.tone).toBe("info");
    expect(feedback.text).toContain("Không có thay đổi nào để lưu");
  });

  it("có dòng không lưu được: giọng cảnh báo và MANG THEO danh sách dòng", () => {
    const failures = [{ rowNumber: 9, message: "Không có gì thay đổi." }];
    const feedback = rowEditsFeedback({ saved: 4, blocked: [], failures });
    expect(feedback.tone).toBe("danger");
    expect(feedback.failures).toEqual(failures);
  });
});

describe("câu chữ kết quả ghi (AC-15)", () => {
  it("ghi trọn vẹn: giọng thành công, nêu số dòng", () => {
    const feedback = commitFeedback({ committed: 28, skipped: 0, failed: 0, failures: [] });
    expect(feedback.tone).toBe("success");
    expect(feedback.text).toContain("Đã ghi 28 dòng");
  });

  it("dòng BỎ QUA được đếm riêng, không bị gộp vào lỗi", () => {
    const feedback = commitFeedback({ committed: 5, skipped: 3, failed: 0, failures: [] });
    expect(feedback.text).toContain("bỏ qua 3 dòng");
    expect(feedback.text).toContain("lỗi 0 dòng");
    expect(feedback.tone).toBe("success");
  });

  it("có dòng lỗi: giọng cảnh báo và MANG THEO danh sách dòng lỗi", () => {
    const failures = [{ rowNumber: 12, message: "Lớp không khớp." }];
    const feedback = commitFeedback({ committed: 4, skipped: 0, failed: 1, failures });
    expect(feedback.tone).toBe("danger");
    expect(feedback.failures).toEqual(failures);
    expect(feedback.text).toContain("vẫn nằm nguyên trong lần nhập này");
  });
});

/**
 * M12-C — TO-BE 6 / AC-24 / BR-M12-39.
 *
 * 🔴 Đây là bài canh đúng thứ lỗi 4.5 sinh ra: dòng báo **"đã ghi"** trong khi
 * việc quan trọng nhất của nó — xếp em vào lớp — **không xảy ra**, và không một
 * dòng chữ nào ở bất kỳ đâu nói ra. Ba bài dưới đây canh ba cách nói sai khác
 * nhau: im lặng, gộp vào "lỗi", và gộp vào "thành công trọn vẹn".
 */
describe("câu chữ ghi danh bị bỏ qua (AC-24)", () => {
  it("nói ra số em VÀ số dòng cụ thể, không im lặng", () => {
    const feedback = commitFeedback({
      committed: 30,
      skipped: 0,
      failed: 0,
      failures: [],
      enrollmentSkipped: 2,
      enrollmentSkippedSample: [7, 19],
    });
    expect(feedback.text).toContain("Đã ghi 30 dòng");
    expect(feedback.text).toContain("2 em đã có ghi danh đang mở");
    expect(feedback.text).toContain("#7, #19");
    expect(feedback.text).toContain("trang Lớp học");
  });

  it("KHÔNG gộp vào số dòng lỗi — hồ sơ em đã tạo/ghép thật", () => {
    const feedback = commitFeedback({
      committed: 30,
      skipped: 0,
      failed: 0,
      failures: [],
      enrollmentSkipped: 2,
      enrollmentSkippedSample: [7, 19],
    });
    expect(feedback.text).toContain("lỗi 0 dòng");
    expect(feedback.failures).toBeUndefined();
  });

  it("KHÔNG còn là 'thành công trọn vẹn': giọng đổi sang info", () => {
    const clean = commitFeedback({ committed: 30, skipped: 0, failed: 0, failures: [] });
    const withSkip = commitFeedback({
      committed: 30,
      skipped: 0,
      failed: 0,
      failures: [],
      enrollmentSkipped: 1,
      enrollmentSkippedSample: [7],
    });
    expect(clean.tone).toBe("success");
    expect(withSkip.tone).toBe("info");
  });

  it("nhiều hơn 5 dòng thì cắt bớt và ghi dấu ba chấm", () => {
    const feedback = commitFeedback({
      committed: 40,
      skipped: 0,
      failed: 0,
      failures: [],
      enrollmentSkipped: 9,
      enrollmentSkippedSample: [1, 2, 3, 4, 5],
    });
    expect(feedback.text).toContain("#1, #2, #3, #4, #5…");
  });

  it("không có em nào bị bỏ qua thì câu chữ giữ nguyên như trước", () => {
    const feedback = commitFeedback({
      committed: 28,
      skipped: 0,
      failed: 0,
      failures: [],
      enrollmentSkipped: 0,
      enrollmentSkippedSample: [],
    });
    expect(feedback.tone).toBe("success");
    expect(feedback.text).not.toContain("ghi danh đang mở");
  });
});

describe("câu chữ huỷ và xoá dữ liệu thô", () => {
  it("D-131: câu huỷ phải nói rõ lần nhập ĐƯỢC GIỮ LẠI", () => {
    const feedback = cancelFeedback(120);
    expect(feedback.text).toContain("120 dòng");
    expect(feedback.text).toContain("giữ lại");
  });

  it("D-132: câu xoá dữ liệu thô phải nói rõ hồ sơ và mối nối vẫn còn", () => {
    const feedback = purgeRawFeedback(300);
    expect(feedback.text).toContain("300 dòng");
    expect(feedback.text).toContain("giữ nguyên");
  });

  it("thất bại không có câu cụ thể thì vẫn có một câu tiếng Việt", () => {
    expect(importFailureFeedback("").text).toBe(
      "Không thực hiện được thao tác. Vui lòng thử lại.",
    );
    expect(importFailureFeedback("Lần nhập này đã ghi dữ liệu.").text).toBe(
      "Lần nhập này đã ghi dữ liệu.",
    );
  });
});
