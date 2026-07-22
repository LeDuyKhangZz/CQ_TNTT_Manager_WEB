export const ASSESSMENT_KINDS = [
  "quiz_15m",
  "midterm",
  "final",
  "attendance",
  "custom",
] as const;

export type AssessmentKind = (typeof ASSESSMENT_KINDS)[number];

export const ASSESSMENT_KIND_LABELS: Record<AssessmentKind, string> = {
  quiz_15m: "Kiểm tra 15 phút",
  midterm: "Giữa kỳ",
  final: "Cuối kỳ",
  attendance: "Chuyên cần",
  custom: "Kiểm tra phát sinh",
};

export const ATTENDANCE_COMPONENTS = ["mass", "catechism"] as const;
export type AttendanceScoreComponent = (typeof ATTENDANCE_COMPONENTS)[number];

export const ATTENDANCE_COMPONENT_LABELS: Record<AttendanceScoreComponent, string> = {
  mass: "Thánh lễ",
  catechism: "Giáo lý",
};

export const COMMENT_VISIBILITIES = ["student_visible", "staff_only"] as const;
export type CommentVisibility = (typeof COMMENT_VISIBILITIES)[number];
export const COMMENT_VISIBILITY_LABELS: Record<CommentVisibility, string> = {
  student_visible: "Công khai cho phụ huynh/thiếu nhi",
  staff_only: "Nội bộ nhân sự",
};

export const LEADERBOARD_SOURCE_TYPES = [
  "assessment",
  "temporary_weighted_average",
  "final_average",
  "custom_competition",
] as const;
export type LeaderboardSourceType = (typeof LEADERBOARD_SOURCE_TYPES)[number];
export const LEADERBOARD_SOURCE_LABELS: Record<LeaderboardSourceType, string> = {
  assessment: "Một cột điểm",
  temporary_weighted_average: "Điểm trung bình tạm",
  final_average: "Điểm tổng kết đã khóa",
  custom_competition: "Đợt thi đua / điểm tùy chỉnh",
};
