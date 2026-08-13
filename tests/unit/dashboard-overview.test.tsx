import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardOverview } from "@/features/dashboard/components/dashboard-overview";
import type { DashboardData } from "@/features/dashboard/server/queries";

/**
 * M11-B / D-170 — trang tổng quan của Thủ quỹ.
 *
 * 🔴 Hiện trạng đã ĐO trên cơ sở dữ liệu thật trước đợt này: bốn ô số của họ là
 * `0 · 0 · 0 · —`. Đó không phải "chưa biết", đó là **nói sai** — trang chủ báo
 * với một chức việc cấp xứ đoàn rằng xứ đoàn có 0 thiếu nhi và 0 lớp.
 *
 * Nhưng nới số thôi thì sinh ra một câu nói sai thứ hai, ở ngay thẻ bên cạnh:
 * `warned_student_count` là số gộp nên nó lên **12**, trong khi danh sách tên
 * bên dưới vẫn rỗng vì RLS (đúng như D-67 muốn) và bản cũ in ra *"Không có em
 * nào cần lưu ý trong phạm vi của bạn"*. Hai câu ngược nhau trong cùng một thẻ.
 * Vì vậy `aggregateOnly` không chỉ đổi nguồn số — nó đổi cả những thẻ được hiện.
 */
function dashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    audience: "staff",
    aggregateOnly: false,
    canOpenAdmin: false,
    hasLoadError: false,
    kpis: {
      academicYearCode: "2026-2027",
      studentCount: 412,
      staffCount: 38,
      classCount: 19,
      massRate: 0.92,
      catechismRate: 0.95,
      warnedStudentCount: 12,
      lastSessionDate: "2026-09-13",
    },
    atRisk: [],
    upcoming: [],
    celebrations: [],
    incompleteProfileCount: 4,
    committeeTasks: [],
    latestNotifications: [],
    ...overrides,
  };
}

describe("DashboardOverview — nhân sự đọc được chi tiết", () => {
  it("hiện đủ bốn ô số và các thẻ danh sách", () => {
    render(<DashboardOverview data={dashboardData()} />);
    expect(screen.getByText("412")).toBeInTheDocument();
    expect(screen.getByText("Giáo lý viên")).toBeInTheDocument();
    expect(screen.getByText("Lớp")).toBeInTheDocument();
    expect(screen.getByText("Sinh nhật và bổn mạng")).toBeInTheDocument();
    expect(screen.getByText("Hồ sơ thiếu dữ liệu")).toBeInTheDocument();
  });

  it("thẻ 'Cần quan tâm' nói số cảnh báo ngay ở phần mô tả", () => {
    render(<DashboardOverview data={dashboardData()} />);
    expect(screen.getByText("12 em đang có cảnh báo chuyên cần.")).toBeInTheDocument();
  });
});

describe("D-170 — Thủ quỹ: đọc được SỐ, không đọc được TÊN", () => {
  const treasurer = dashboardData({ aggregateOnly: true });

  it("bốn ô số vẫn hiện đủ — đây chính là thứ D-67 cho phép", () => {
    render(<DashboardOverview data={treasurer} />);
    expect(screen.getByText("412")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
    expect(screen.getByText("19")).toBeInTheDocument();
    expect(screen.getByText("92%")).toBeInTheDocument();
  });

  it("🔴 thẻ 'Cần quan tâm' KHÔNG còn hứa một danh sách rồi bỏ trống", () => {
    render(<DashboardOverview data={treasurer} />);
    expect(screen.queryByText("Không có em nào cần lưu ý trong phạm vi của bạn."))
      .not.toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText(/danh sách tên từng em thuộc quyền của Ban điều hành/))
      .toBeInTheDocument();
  });

  it("🔴 các thẻ chỉ chứa TÊN người biến mất thay vì hiện 'chưa có gì' — đó là một câu sai", () => {
    render(<DashboardOverview data={treasurer} />);
    expect(screen.queryByText("Sinh nhật và bổn mạng")).not.toBeInTheDocument();
    expect(screen.queryByText("Buổi học sắp tới")).not.toBeInTheDocument();
    expect(screen.queryByText("Hồ sơ thiếu dữ liệu")).not.toBeInTheDocument();
  });

  it("thẻ 'Thông báo mới' vẫn ở lại — đó là hộp thư của chính họ, không phải dữ liệu người khác", () => {
    render(<DashboardOverview data={treasurer} />);
    expect(screen.getByText("Thông báo mới")).toBeInTheDocument();
  });
});

/**
 * M11-C / TB-03 — bố cục theo `audience`.
 *
 * 🔴 Bài đầu tiên của khối này canh **ngõ cụt** mà `03_AUDIT_RESULTS` §4.3 mô
 * tả: phụ huynh thấy tên con đang bị cảnh báo, bấm vào, và bị đá sang
 * `/access-denied` vì liên kết trỏ `/students/<id>` — một route chỉ dành cho
 * nhân sự. Từ đó không còn đường nào khác.
 */
const AT_RISK = [{
  studentId: "student-1",
  displayName: "Maria Nguyễn Thị A",
  className: "Ấu 1A",
  catechismAbsenceStreak: 3,
  sundayAbsenceStreak: 1,
  weightedAverage: 6.5,
  reasons: ["vắng giáo lý liên tiếp"],
}];

describe("TB-03 — phụ huynh", () => {
  const guardian = dashboardData({ audience: "guardian", atRisk: AT_RISK });

  it("🔴 AC-B02 — tên con dẫn tới cổng phụ huynh, KHÔNG dẫn tới /students", () => {
    render(<DashboardOverview data={guardian} />);
    const link = screen.getByRole("link", { name: "Maria Nguyễn Thị A" });
    expect(link).toHaveAttribute("href", "/parent/children/student-1");
  });

  it("🔴 AC-B02 — không một liên kết nào trên trang trỏ vào route chỉ dành cho nhân sự", () => {
    render(<DashboardOverview data={guardian} />);
    const staffOnly = screen.getAllByRole("link")
      .map((link) => link.getAttribute("href") ?? "")
      .filter((href) => href.startsWith("/students") || href.startsWith("/admin") || href.startsWith("/reports"));
    expect(staffOnly).toEqual([]);
  });

  it("AC-B03 — ô số mang nhãn 'Con của tôi', và không có ô Giáo lý viên/Lớp", () => {
    render(<DashboardOverview data={guardian} />);
    expect(screen.getByText("Con của tôi")).toBeInTheDocument();
    expect(screen.queryByText("Giáo lý viên")).not.toBeInTheDocument();
    expect(screen.queryByText("Lớp")).not.toBeInTheDocument();
  });

  it("AC-B03 — tỷ lệ chuyên cần ghi rõ là của con, không phải của xứ đoàn", () => {
    render(<DashboardOverview data={guardian} />);
    expect(screen.getByText("Tỷ lệ dự lễ của con")).toBeInTheDocument();
    expect(screen.getByText("Tỷ lệ học giáo lý của con")).toBeInTheDocument();
  });

  it("không thấy các thẻ điều hành", () => {
    render(<DashboardOverview data={guardian} />);
    expect(screen.queryByText("Công việc Ban")).not.toBeInTheDocument();
    expect(screen.queryByText("Hồ sơ thiếu dữ liệu")).not.toBeInTheDocument();
    expect(screen.queryByText("Sinh nhật và bổn mạng")).not.toBeInTheDocument();
  });
});

describe("TB-03 — thiếu nhi", () => {
  const student = dashboardData({ audience: "student", atRisk: AT_RISK });

  it("🔴 AC-B02 — tên mình dẫn tới trang điểm danh của chính mình", () => {
    render(<DashboardOverview data={student} />);
    expect(screen.getByRole("link", { name: "Maria Nguyễn Thị A" }))
      .toHaveAttribute("href", "/student/attendance");
  });

  it("AC-B03 — không có ô đếm thiếu nhi: đếm chính mình là một con số vô nghĩa", () => {
    render(<DashboardOverview data={student} />);
    expect(screen.queryByText("Thiếu nhi")).not.toBeInTheDocument();
    expect(screen.queryByText("Con của tôi")).not.toBeInTheDocument();
    expect(screen.getByText("Tỷ lệ dự lễ của tôi")).toBeInTheDocument();
  });

  it("có đường vào trang điểm danh ngay từ màn hình đầu tiên", () => {
    render(<DashboardOverview data={student} />);
    expect(screen.getByRole("link", { name: "Mở trang điểm danh của tôi" }))
      .toHaveAttribute("href", "/student/attendance");
  });
});

describe("chưa có năm học hiện hành", () => {
  it("hiện thẻ hướng dẫn thay vì một dãy số 0", () => {
    render(<DashboardOverview data={dashboardData({ kpis: null })} />);
    expect(screen.getByText(/Chưa có năm học nào đang diễn ra/)).toBeInTheDocument();
    expect(screen.queryByText("412")).not.toBeInTheDocument();
  });

  it("🔴 F05 — vai trò không vào được /admin thì KHÔNG thấy liên kết tới đó", () => {
    render(<DashboardOverview data={dashboardData({ kpis: null, canOpenAdmin: false })} />);
    expect(screen.queryByRole("link", { name: "Quản trị hệ thống" })).not.toBeInTheDocument();
    expect(screen.getByText(/liên hệ Ban quản trị Xứ đoàn/)).toBeInTheDocument();
  });

  it("Quản trị viên hệ thống vẫn có liên kết đi thẳng tới nơi mở năm học", () => {
    render(<DashboardOverview data={dashboardData({ kpis: null, canOpenAdmin: true })} />);
    expect(screen.getByRole("link", { name: "Quản trị hệ thống" })).toHaveAttribute("href", "/admin");
  });
});

describe("N-2 — truy vấn hỏng phải NÓI RA", () => {
  it("không hỏng thì không có dải cảnh báo nào", () => {
    render(<DashboardOverview data={dashboardData()} />);
    expect(screen.queryByText(/Không tải được một số mục/)).not.toBeInTheDocument();
  });

  it("🔴 hỏng thì nói ra ở ĐẦU trang — thẻ rỗng và thẻ hỏng nhìn giống hệt nhau", () => {
    render(<DashboardOverview data={dashboardData({ hasLoadError: true })} />);
    expect(screen.getByText(/Không tải được một số mục của trang tổng quan/)).toBeInTheDocument();
  });
});
