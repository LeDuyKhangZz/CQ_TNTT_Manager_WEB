import type { AppErrorCode } from "@/lib/errors";
import type { AdminFailedCode } from "./admin-feedback";
import type { AcademicYearOpenWork } from "./year-lifecycle";

/**
 * Dịch lỗi cơ sở dữ liệu của module Năm học sang **mã nghiệp vụ** — M02-A.
 *
 * Quy ước mã lỗi của repo (theo `20260724000500_equipment_lifecycle.sql`):
 * `42501` = không đủ quyền · `P0002` = không tìm thấy · `23514` = vi phạm luật
 * nghiệp vụ, và **tên của luật nằm trong thông điệp**. Nghĩa là chỉ đọc mã số
 * SQL thì không đủ: hai tình huống rất khác nhau — *thiếu danh mục lớp chuẩn*
 * và *năm học đã đóng* — cùng mang mã `23514`.
 *
 * Hàm thuần, không import runtime nào, để kiểm được bằng unit test.
 */
export interface DbErrorLike {
  code?: string | null;
  message?: string | null;
}

export interface AcademicYearFailure {
  /** Mã ổn định cho `AppError` (docs/04 §9). */
  appCode: AppErrorCode;
  /** Khoá câu chữ hiển thị ở `/admin`. */
  failed: AdminFailedCode;
}

export function classifyAcademicYearDbError(error: DbErrorLike): AcademicYearFailure {
  const message = error.message ?? "";
  if (message.includes("CLASS_TEMPLATES_EMPTY")) {
    return { appCode: "REFERENCE_DATA_MISSING", failed: "reference_data_missing" };
  }
  if (message.includes("ACADEMIC_YEAR_CLOSED")) {
    return { appCode: "VALIDATION_ERROR", failed: "year_closed" };
  }
  // M02-C — sáu tên luật của vòng đời năm học. Cả sáu **cùng mang mã `23514`** (trừ
  // mã gõ lại sai, `22023`), đúng quy ước của repo, nên chỉ đọc mã số SQL thì không
  // phân biệt được "còn việc tồn đọng" với "chưa tới hạn lưu trữ" — hai câu trả lời
  // hoàn toàn khác nhau cho người dùng.
  if (message.includes("YEAR_HAS_OPEN_WORK")) {
    return { appCode: "CONFLICT", failed: "year_has_open_work" };
  }
  if (message.includes("CLOSE_REASON_REQUIRED")) {
    return { appCode: "VALIDATION_ERROR", failed: "close_reason_required" };
  }
  if (message.includes("ACADEMIC_YEAR_NOT_CURRENT")) {
    return { appCode: "VALIDATION_ERROR", failed: "year_not_current" };
  }
  if (message.includes("ACADEMIC_YEAR_NOT_CLOSED")) {
    return { appCode: "VALIDATION_ERROR", failed: "year_not_closed" };
  }
  if (message.includes("RETENTION_NOT_REACHED")) {
    return { appCode: "VALIDATION_ERROR", failed: "retention_not_reached" };
  }
  if (message.includes("YEAR_CODE_MISMATCH")) {
    return { appCode: "VALIDATION_ERROR", failed: "year_code_mismatch" };
  }
  switch (error.code) {
    case "42501":
      return { appCode: "FORBIDDEN", failed: "forbidden" };
    case "P0002":
      return { appCode: "RESOURCE_NOT_FOUND", failed: "not_found" };
    case "23505":
      return { appCode: "CONFLICT", failed: "year_code_taken" };
    default:
      return { appCode: "VALIDATION_ERROR", failed: "invalid" };
  }
}

/**
 * Ba con số của bảng kiểm chốt sổ — `app.academic_year_open_work()`.
 *
 * Trả `null` khi hình dạng lạ, **không** đoán bừa 0: cùng lý lẽ với
 * `parseGenerateClassesResult`. Một bảng kiểm bịa ra toàn số 0 sẽ nói "không còn
 * việc tồn đọng" trước một RPC chắc chắn từ chối — và người dùng sẽ đi tìm lỗi ở
 * chỗ hoàn toàn khác.
 */
export function parseOpenWork(value: unknown): AcademicYearOpenWork | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  const openEnrollments = Number(row.open_enrollments);
  const unlockedGradebooks = Number(row.unlocked_gradebooks);
  const openSessions = Number(row.open_sessions);
  if (
    !Number.isInteger(openEnrollments) ||
    !Number.isInteger(unlockedGradebooks) ||
    !Number.isInteger(openSessions)
  ) {
    return null;
  }
  return { openEnrollments, unlockedGradebooks, openSessions };
}

/**
 * Bóc bảng kiểm ra khỏi thông điệp lỗi `YEAR_HAS_OPEN_WORK: {…}`.
 *
 * Vì sao đọc từ thông điệp lỗi thay vì gọi lại bảng kiểm: RPC đếm **sau khi khoá
 * dòng**, nên con số nó nhúng vào lỗi là con số tại đúng thời điểm từ chối. Gọi lại
 * một lượt nữa là mở ra khả năng hai con số khác nhau trên cùng một màn hình.
 */
export function parseOpenWorkFromMessage(message: string | null | undefined): AcademicYearOpenWork | null {
  if (!message) return null;
  const start = message.indexOf("{");
  const end = message.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return parseOpenWork(JSON.parse(message.slice(start, end + 1)));
  } catch {
    return null;
  }
}

/** Kết quả sinh lớp mà RPC trả về (BR-M02-N02). */
export interface GenerateClassesResult {
  inserted: number;
  expected: number;
  alreadyPresent: number;
}

/**
 * Đọc `jsonb` do `generate_default_classes` trả về.
 *
 * 🔴 Trả `null` khi hình dạng lạ thay vì đoán bừa `0`: một số 0 bịa ra ở đây là
 * đúng con đường đã dẫn tới sự cố production — giao diện sẽ nói "đã có đủ lớp
 * từ trước" trong khi thực tế không ai biết chuyện gì vừa xảy ra.
 */
export function parseGenerateClassesResult(value: unknown): GenerateClassesResult | null {
  if (typeof value !== "object" || value === null) return null;
  const row = value as Record<string, unknown>;
  const inserted = Number(row.inserted);
  const expected = Number(row.expected);
  const alreadyPresent = Number(row.already_present);
  if (!Number.isInteger(inserted) || !Number.isInteger(expected)) return null;
  return {
    inserted,
    expected,
    alreadyPresent: Number.isInteger(alreadyPresent) ? alreadyPresent : 0,
  };
}
