import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  WeeklyPlanEditor,
  describeExistingPlan,
  mondayOf,
  type WeeklyPlanDraft,
} from "@/features/committees/components/weekly-plan-editor";
import type { CommitteeWeeklyPlan } from "@/features/committees/server/queries";

/**
 * M09-A · TB-M09-01 / AC-M09-13 — hàng rào cho lỗi F11 (`CRITICAL`).
 *
 * Lỗi thật: form công việc tuần luôn mở ra TRỐNG, và phía server là một `upsert`
 * ghi đè mọi cột. Ai bấm "Lưu" cho một tuần đã có bản là xoá sạch nội dung Ban
 * đã soạn từ đầu tuần — không hỏi, không cảnh báo, không khôi phục được.
 *
 * Ba điều phải đúng cùng lúc mới chặn được lỗi đó, và cả ba đều nằm ở đây:
 *  1. đổi tuần sang một tuần đã có bản ⇒ nội dung hiện lên sẵn;
 *  2. nhãn nút nói rõ đây là **cập nhật**, không phải tạo mới;
 *  3. payload gửi đi mang `expectedUpdatedAt` của đúng bản đang hiển thị — đó là
 *     thứ duy nhất cho phép server từ chối ghi đè bản người khác vừa sửa.
 */

// 2026-10-05 và 2026-10-12 đều là thứ Hai.
const PLAN_TRUNG_THU: CommitteeWeeklyPlan = {
  id: "plan-1",
  weekStart: "2026-10-05",
  content: "Chuẩn bị Trung Thu",
  checklist: ["Mua đèn", "Tập múa"],
  updatedAt: "2026-10-05T09:30:00.123456+00:00",
  savedByName: "Anh Trưởng Ban Sinh hoạt",
};

const PLAN_SAU_TRUNG_THU: CommitteeWeeklyPlan = {
  id: "plan-2",
  weekStart: "2026-10-12",
  content: null,
  checklist: ["Dọn kho"],
  updatedAt: "2026-10-12T02:00:00+00:00",
  savedByName: null,
};

function renderEditor(overrides: Partial<Parameters<typeof WeeklyPlanEditor>[0]> = {}) {
  const onSave = vi.fn<(draft: WeeklyPlanDraft) => void>();
  const onDelete = vi.fn();
  render(
    <WeeklyPlanEditor
      plans={[PLAN_SAU_TRUNG_THU, PLAN_TRUNG_THU]}
      canWrite
      pending={false}
      onSave={onSave}
      onDelete={onDelete}
      {...overrides}
    />,
  );
  return { onSave, onDelete };
}

describe("mondayOf", () => {
  it("lùi mọi ngày trong tuần về thứ Hai của chính tuần đó", () => {
    expect(mondayOf(new Date(2026, 9, 5))).toBe("2026-10-05"); // thứ Hai
    expect(mondayOf(new Date(2026, 9, 8))).toBe("2026-10-05"); // thứ Năm
    expect(mondayOf(new Date(2026, 9, 11))).toBe("2026-10-05"); // Chủ nhật
    expect(mondayOf(new Date(2026, 9, 12))).toBe("2026-10-12"); // thứ Hai kế
  });
});

describe("describeExistingPlan", () => {
  it("nêu tên người lưu khi đọc được", () => {
    expect(describeExistingPlan(PLAN_TRUNG_THU)).toContain("Anh Trưởng Ban Sinh hoạt");
  });

  it("bỏ hẳn phần tên khi RLS không cho đọc, không hiện dấu gạch thay tên", () => {
    const text = describeExistingPlan(PLAN_SAU_TRUNG_THU);
    expect(text).not.toContain("—");
    expect(text).toMatch(/^Bản hiện tại lưu lúc /);
  });
});

describe("WeeklyPlanEditor — chống ghi đè mù (F11)", () => {
  it("nạp sẵn nội dung và checklist khi tuần đang chọn đã có bản", async () => {
    const user = userEvent.setup();
    renderEditor();

    // Mặc định là tuần hiện tại, gần như chắc chắn chưa có bản trong fixture này.
    await user.clear(screen.getByLabelText("Tuần bắt đầu (thứ Hai)"));
    await user.type(screen.getByLabelText("Tuần bắt đầu (thứ Hai)"), "2026-10-05");

    expect(screen.getByLabelText("Nội dung công việc")).toHaveValue("Chuẩn bị Trung Thu");
    expect(screen.getByLabelText("Checklist (mỗi dòng một việc)")).toHaveValue("Mua đèn\nTập múa");
  });

  it("nhãn nút đổi theo tạo mới / cập nhật, và nói rõ bản hiện tại của ai", async () => {
    const user = userEvent.setup();
    renderEditor();

    expect(screen.getByRole("button", { name: "Tạo công việc tuần" })).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Tuần bắt đầu (thứ Hai)"));
    await user.type(screen.getByLabelText("Tuần bắt đầu (thứ Hai)"), "2026-10-05");

    expect(screen.getByRole("button", { name: "Cập nhật công việc tuần" })).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Anh Trưởng Ban Sinh hoạt");
  });

  it("gửi kèm dấu thời gian của ĐÚNG bản đang hiển thị", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor();

    await user.clear(screen.getByLabelText("Tuần bắt đầu (thứ Hai)"));
    await user.type(screen.getByLabelText("Tuần bắt đầu (thứ Hai)"), "2026-10-05");
    await user.click(screen.getByRole("button", { name: "Cập nhật công việc tuần" }));

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave.mock.calls[0][0]).toEqual({
      weekStart: "2026-10-05",
      content: "Chuẩn bị Trung Thu",
      checklist: ["Mua đèn", "Tập múa"],
      expectedUpdatedAt: PLAN_TRUNG_THU.updatedAt,
    });
  });

  it("tuần chưa có bản thì gửi expectedUpdatedAt = null — server hiểu là TẠO", async () => {
    const user = userEvent.setup();
    const { onSave } = renderEditor({ plans: [] });

    await user.type(screen.getByLabelText("Nội dung công việc"), "Việc mới");
    await user.click(screen.getByRole("button", { name: "Tạo công việc tuần" }));

    expect(onSave.mock.calls[0][0].expectedUpdatedAt).toBeNull();
    expect(onSave.mock.calls[0][0].content).toBe("Việc mới");
  });

  it("bấm Sửa trên một bản trong danh sách sẽ nạp bản đó vào form", async () => {
    const user = userEvent.setup();
    renderEditor();

    const row = screen.getByText("Tuần 05/10/2026").closest("li");
    expect(row).not.toBeNull();
    await user.click(within(row!).getByRole("button", { name: "Sửa" }));

    // Ô ngày hiện dd/MM/yyyy từ Đợt C; giá trị gửi lên máy chủ vẫn là ISO.
    expect(screen.getByLabelText("Tuần bắt đầu (thứ Hai)")).toHaveValue("05/10/2026");
    expect(
      document.querySelector('input[type="hidden"][name="weekStart"]'),
    ).toHaveValue("2026-10-05");
    expect(screen.getByLabelText("Nội dung công việc")).toHaveValue("Chuẩn bị Trung Thu");
    // Đưa focus tới ô nội dung: người dùng bàn phím không bị bỏ lại ở cuối trang.
    expect(screen.getByLabelText("Nội dung công việc")).toHaveFocus();
  });

  it("người chỉ đọc không thấy form, nhưng vẫn đọc được nội dung tuần", () => {
    renderEditor({ canWrite: false });

    expect(screen.queryByLabelText("Tuần bắt đầu (thứ Hai)")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sửa" })).toBeNull();
    expect(screen.getByText("Chuẩn bị Trung Thu")).toBeInTheDocument();
  });
});
