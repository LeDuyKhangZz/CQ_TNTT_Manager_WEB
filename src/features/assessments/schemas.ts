import { z } from "zod";
import { ASSESSMENT_KINDS, ATTENDANCE_COMPONENTS, COMMENT_VISIBILITIES, LEADERBOARD_SOURCE_TYPES } from "./constants";

export const assessmentIdSchema = z.string().uuid();
export const gradebookClassIdSchema = z.string().uuid();
export const gradebookLockInputSchema = z.object({ classId: gradebookClassIdSchema });

export const assessmentInputSchema = z.object({
  classId: gradebookClassIdSchema,
  kind: z.enum(ASSESSMENT_KINDS),
  title: z.string().trim().min(1, "Vui lòng nhập tên cột điểm.").max(120),
  assessmentDate: z.string().date().nullable().optional(),
  weight: z.coerce.number().positive("Hệ số phải lớn hơn 0.").max(100),
  attendanceComponent: z.enum(ATTENDANCE_COMPONENTS).nullable().optional(),
}).superRefine((value, context) => {
  if (value.kind === "attendance" && !value.attendanceComponent) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["attendanceComponent"],
      message: "Điểm chuyên cần phải chọn Thánh lễ hoặc Giáo lý.",
    });
  }
  if (value.kind !== "attendance" && value.attendanceComponent) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["attendanceComponent"],
      message: "Chỉ cột chuyên cần mới có thành phần điểm danh.",
    });
  }
});

export const updateAssessmentSchema = assessmentInputSchema.and(z.object({
  assessmentId: assessmentIdSchema,
}));

export const assessmentScoreInputSchema = z.object({
  enrollmentId: z.string().uuid(),
  score: z.number().min(0).max(10).nullable(),
  note: z.string().trim().max(500).nullable().optional(),
});

export const saveAssessmentScoresSchema = z.object({
  assessmentId: assessmentIdSchema,
  scores: z.array(assessmentScoreInputSchema).max(150),
});

export const publishAssessmentSchema = z.object({
  assessmentId: assessmentIdSchema,
  published: z.boolean(),
});

export const attendanceAssessmentActionSchema = z.object({
  assessmentId: assessmentIdSchema,
});

export const resetAttendanceOverrideSchema = z.object({
  assessmentId: assessmentIdSchema,
  enrollmentId: z.string().uuid(),
});

export const studentCommentInputSchema = z.object({
  enrollmentId: z.string().uuid(),
  visibility: z.enum(COMMENT_VISIBILITIES),
  content: z.string().trim().min(1, "Vui lòng nhập nội dung nhận xét.").max(2000),
});

export const studentCommentIdSchema = z.string().uuid();

export const leaderboardIdSchema = z.string().uuid();
export const leaderboardInputSchema = z.object({
  classId: gradebookClassIdSchema,
  title: z.string().trim().min(1, "Vui lòng nhập tên Top 5.").max(120),
  sourceType: z.enum(LEADERBOARD_SOURCE_TYPES),
  sourceAssessmentId: assessmentIdSchema.nullable().optional(),
}).superRefine((value, context) => {
  if (value.sourceType === "assessment" && !value.sourceAssessmentId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceAssessmentId"], message: "Vui lòng chọn cột điểm nguồn." });
  }
  if (value.sourceType !== "assessment" && value.sourceAssessmentId) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["sourceAssessmentId"], message: "Nguồn này không dùng cột điểm." });
  }
});

export const customLeaderboardScoreSchema = z.object({
  enrollmentId: z.string().uuid(),
  score: z.number().min(-1_000_000).max(1_000_000),
});
export const leaderboardOperationSchema = z.object({
  leaderboardId: leaderboardIdSchema,
  customScores: z.array(customLeaderboardScoreSchema).max(150).nullable().optional(),
});

export type AssessmentInput = z.infer<typeof assessmentInputSchema>;
export type UpdateAssessmentInput = z.infer<typeof updateAssessmentSchema>;
export type SaveAssessmentScoresInput = z.infer<typeof saveAssessmentScoresSchema>;
export type PublishAssessmentInput = z.infer<typeof publishAssessmentSchema>;
export type ResetAttendanceOverrideInput = z.infer<typeof resetAttendanceOverrideSchema>;
export type StudentCommentInput = z.infer<typeof studentCommentInputSchema>;
export type LeaderboardInput = z.infer<typeof leaderboardInputSchema>;
export type LeaderboardOperationInput = z.infer<typeof leaderboardOperationSchema>;
