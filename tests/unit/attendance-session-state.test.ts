import { afterEach, describe, expect, it, vi } from "vitest";
import {
  SESSION_STATE_LABELS,
  deriveSessionState,
  isSessionLocked,
  meetingTypeForDate,
  mostRecentMeetingDate,
} from "@/features/attendance/constants";
import { todayVi } from "@/lib/dates";

/**
 * M05-A · TB-01 + TB-02 — U-06 và U-07 của `08_ACCEPTANCE_CRITERIA` §B.3.
 *
 * Hai luật này trước đây **không có test nào**, và cả hai đều hỏng im lặng:
 * ngày mặc định sai thì form vẫn hiện một ngày hợp lệ, còn nhãn trạng thái sai
 * thì màn hình vẫn hiện một chữ tiếng Việt trông bình thường.
 */

afterEach(() => {
  vi.useRealTimers();
});

describe("TB-01 — ngày mặc định của form mở buổi", () => {
  /**
   * 🔴 Bài quan trọng nhất của đợt A, và nó tái lập ĐÚNG lỗi thật.
   *
   * Máy chủ chạy `TZ=UTC` (Vercel/Node mặc định). 06:30 sáng Chúa nhật 26/07
   * giờ Việt Nam là 23:30 thứ Bảy 25/07 giờ UTC. Bản cũ gọi `new Date()` rồi
   * `toISOString()`, nên nó nhìn thấy thứ Bảy và lùi về **thứ Năm 23/07** — tức
   * Giáo lý viên tới nhà thờ điểm danh sớm sẽ mở nhầm buổi của tuần trước.
   */
  it("06:30 sáng Chúa nhật giờ Việt Nam ⇒ đúng Chúa nhật đó, không phải thứ Năm trước", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T23:30:00Z"));

    // Cách cũ, giữ lại làm bằng chứng chứ không phải để dùng.
    const utcToday = new Date().toISOString().slice(0, 10);
    expect(utcToday).toBe("2026-07-25");
    expect(mostRecentMeetingDate(utcToday)).toBe("2026-07-23");
    expect(meetingTypeForDate("2026-07-23")).toBe("thursday");

    // Cách đúng.
    expect(todayVi()).toBe("2026-07-26");
    expect(mostRecentMeetingDate(todayVi())).toBe("2026-07-26");
    expect(meetingTypeForDate(todayVi())).toBe("sunday");
  });

  it("00:30 sáng Chúa nhật giờ Việt Nam cũng đúng — mốc thứ hai của AC-F01-1", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-25T17:30:00Z"));
    expect(todayVi()).toBe("2026-07-26");
    expect(mostRecentMeetingDate(todayVi())).toBe("2026-07-26");
  });

  it("giữa tuần thì lùi về buổi gần nhất đã qua", () => {
    // Thứ Ba 28/07 → Chúa nhật 26/07.
    expect(mostRecentMeetingDate("2026-07-28")).toBe("2026-07-26");
    // Thứ Bảy 25/07 → thứ Năm 23/07.
    expect(mostRecentMeetingDate("2026-07-25")).toBe("2026-07-23");
    // Chính thứ Năm thì giữ nguyên, không lùi thêm.
    expect(mostRecentMeetingDate("2026-07-23")).toBe("2026-07-23");
  });

  it("mọi ngày trong 40 ngày liên tiếp đều ra một ngày sinh hoạt hợp lệ và không ở tương lai", () => {
    for (let offset = 0; offset < 40; offset += 1) {
      const day = new Date(Date.UTC(2026, 6, 1 + offset)).toISOString().slice(0, 10);
      const result = mostRecentMeetingDate(day);
      expect(meetingTypeForDate(result), `${day} → ${result}`).not.toBeNull();
      expect(result <= day, `${day} → ${result} không được ở tương lai`).toBe(true);
    }
  });
});

describe("TB-02 — trạng thái hiển thị suy ra ở một chỗ", () => {
  const NOW = Date.parse("2026-08-03T10:00:00Z");
  const PAST = "2026-08-01T10:00:00Z";
  const FUTURE = "2026-08-10T10:00:00Z";

  it("buổi chưa chốt giữ nguyên trạng thái cơ sở dữ liệu", () => {
    for (const status of ["open", "in_progress", "completed"] as const) {
      expect(
        deriveSessionState({ status, lockedAt: null, unlockedAt: null, now: NOW }),
        status,
      ).toBe(status);
    }
  });

  it("🔴 đã chốt và QUÁ mốc khóa ⇒ 'locked', dù cột status vẫn là 'completed'", () => {
    expect(
      deriveSessionState({ status: "completed", lockedAt: PAST, unlockedAt: null, now: NOW }),
    ).toBe("locked");
  });

  it("đã chốt nhưng CHƯA tới mốc khóa ⇒ vẫn 'completed'", () => {
    expect(
      deriveSessionState({ status: "completed", lockedAt: FUTURE, unlockedAt: null, now: NOW }),
    ).toBe("completed");
  });

  it("đúng mốc khóa tính là đã khóa (>=, không phải >)", () => {
    const at = new Date(NOW).toISOString();
    expect(
      deriveSessionState({ status: "completed", lockedAt: at, unlockedAt: null, now: NOW }),
    ).toBe("locked");
  });

  it("🔴 mở khóa thắng 'completed' — mở khóa KHÔNG đổi cột status", () => {
    expect(
      deriveSessionState({ status: "completed", lockedAt: null, unlockedAt: PAST, now: NOW }),
    ).toBe("unlocked");
  });

  it("trạng thái 'locked' ghi tay thắng mọi thứ", () => {
    expect(
      deriveSessionState({ status: "locked", lockedAt: null, unlockedAt: PAST, now: NOW }),
    ).toBe("locked");
  });

  it("hub và trang chi tiết dùng CÙNG một hàm nên không thể lệch nhãn", () => {
    const session = { status: "completed", lockedAt: PAST, unlockedAt: null, now: NOW } as const;
    expect(SESSION_STATE_LABELS[deriveSessionState(session)]).toBe("Đã khóa");
    expect(isSessionLocked(session)).toBe(true);
  });

  it("mọi trạng thái đều có nhãn tiếng Việt, kể cả 'unlocked'", () => {
    expect(SESSION_STATE_LABELS.unlocked).toBe("Đã mở khóa");
    for (const label of Object.values(SESSION_STATE_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });
});
