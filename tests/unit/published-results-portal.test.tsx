import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PublishedResultsPortal } from "@/features/assessments/components/published-results-portal";
import type { PublishedPortalResult } from "@/features/assessments/server/queries";

/**
 * M07-A · **TB-M07-07 phương án A / AC-07-01** — cổng phụ huynh nói ra mẫu số
 * của điểm trung bình.
 *
 * 🔴 Bài kiểm quan trọng nhất ở đây là bài **cuối**: nó canh đúng ranh giới mà
 * `07_IMPLEMENTATION_IMPACT` §4 gọi là *"nơi nhạy cảm nhất của module"* — dòng
 * chú thích **không được** để phụ huynh suy ra lớp còn cột nội bộ (AC-02-03).
 */
function resultOf(overrides: Partial<PublishedPortalResult>): PublishedPortalResult {
  return {
    enrollmentId: "enr-1",
    studentId: "stu-1",
    studentName: "Maria Nguyễn An",
    className: "Chiên Con 1",
    academicYearCode: "2026-2027",
    weightedAverage: 8.4,
    publishedCount: 3,
    scoredCount: 2,
    assessments: [],
    comments: [],
    leaderboards: [],
    ...overrides,
  };
}

function portal(result: PublishedPortalResult, status: "ok" | "no_data" = "ok") {
  return (
    <PublishedResultsPortal
      results={[result]}
      status={status}
      audience="guardian"
      yearCode="2026-2027"
    />
  );
}

describe("cổng phụ huynh — điểm trung bình", () => {
  it("AC-07-01 — nói rõ trung bình tính trên bao nhiêu cột đã công bố", () => {
    render(portal(resultOf({})));
    expect(screen.getByText("TB 8.4")).toBeInTheDocument();
    expect(screen.getByText("Tính trên 2/3 cột đã công bố.")).toBeInTheDocument();
  });

  it("chưa có điểm nào thì nói ra điều đó, không hiện một mẫu số 0/3 khó hiểu", () => {
    render(portal(resultOf({ weightedAverage: null, scoredCount: 0 })));
    expect(screen.getByText("TB —")).toBeInTheDocument();
    expect(screen.getByText("Chưa có điểm ở cột nào trong 3 cột đã công bố.")).toBeInTheDocument();
  });

  it("lớp chưa công bố cột nào — không chia cho 0", () => {
    render(portal(resultOf({ weightedAverage: null, publishedCount: 0, scoredCount: 0 })));
    expect(screen.getByText("Lớp chưa công bố cột điểm nào.")).toBeInTheDocument();
  });

  it("AC-02-03 — KHÔNG con số nào để lộ rằng lớp còn cột chưa công bố", () => {
    // Lớp thật có 5 cột, mới công bố 3. Cả `publishedCount` lẫn `scoredCount`
    // đều đến từ phần đã công bố, nên con số 5 **không tồn tại** ở tầng này —
    // muốn có nó phải nới quyền đọc của cổng, điều `07` §4 cấm tuyệt đối.
    const { container } = render(
      portal(resultOf({ publishedCount: 3, scoredCount: 2 })),
    );
    expect(container.textContent).not.toContain("/5");
    expect(container.textContent).not.toContain("5 cột");
  });

  it("M13-B: trạng thái có ghi danh nhưng chưa có dữ liệu công bố dùng đúng EmptyState", () => {
    render(portal(resultOf({ assessments: [], comments: [], leaderboards: [] }), "no_data"));
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("Chưa có kết quả học tập");
    expect(screen.getByText(/2026-2027/)).toBeInTheDocument();
  });

  it("M13-B: bảng điểm có caption, tiêu đề cột và vùng cuộn dùng được bằng bàn phím", () => {
    render(portal(resultOf({
      assessments: [{
        id: "assessment-1",
        title: "Kiểm tra giữa kỳ",
        kind: "midterm",
        score: 8,
        maxScore: 10,
        weight: 2,
      }],
    })));
    const table = screen.getByRole("table", { name: /Điểm đã công bố/ });
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getByRole("rowheader", { name: "Kiểm tra giữa kỳ" })).toBeInTheDocument();
    expect(table.parentElement).toHaveAttribute("tabindex", "0");
  });
});
