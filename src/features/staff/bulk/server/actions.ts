"use server";

import { revalidatePath } from "next/cache";
import { AppError } from "@/lib/errors";
import { requireRouteAccess } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/permissions/roles";
import { classAliasKey } from "@/features/imports/normalize";
import { assignmentErrorMessage } from "../../assignment-messages";
import { STAFF_BULK_FORBIDDEN_TEXT } from "../messages";
import {
  parseStaffText,
  StaffParseError,
  type BuiltStaffRow,
  type StaffClassLookup,
} from "../parse";

/**
 * Nhập hàng loạt huynh trưởng / dự trưởng — IMP-BULK-001.
 *
 * 🔴 **Vì sao KHÔNG dùng bảng tạm như luồng thiếu nhi.** Luồng thiếu nhi dựng
 * `import_batches`/`import_rows` vì nó phải giữ trạng thái duyệt qua nhiều lượt:
 * chọn giới tính từng dòng, xác nhận từng dòng trùng (D-133), ghi làm nhiều lô.
 * Luồng này không có khâu nào như thế — nhân sự không có trường bắt buộc nào mà
 * sổ giáo xứ thiếu, và số dòng là ~90 chứ không phải ~900. Nên hai pha ở đây là
 * **xem trước rồi ghi**, cả hai lần đều đọc lại chính khối văn bản người dùng
 * đang nhìn: không có trạng thái nào ở giữa để lệch, và không có bảng nào phải
 * dọn khi người dùng bỏ dở.
 *
 * 🔴 **Hồ sơ và phân công là HAI việc, và được báo cáo tách nhau.** Tạo được hồ
 * sơ nhưng không phân công được lớp (lớp đã có đại diện, người ấy đã đứng lớp
 * khác…) là chuyện xảy ra thật, và nó **không** phải một lượt hỏng: hồ sơ đã
 * vào thật, gọi đó là lỗi rồi để người dùng nhập lại sẽ sinh hồ sơ trùng. Cùng
 * khuôn `enrollmentSkipped` mà TO-BE 6 dựng cho luồng thiếu nhi.
 */

const STAFF_BULK_ROLES: readonly AppRole[] = [
  "super_admin",
  "group_leader",
  "deputy_group_leader",
  "secretary",
];

async function staffBulkContext() {
  return requireRouteAccess("/staff/bulk");
}

function assertStaffBulkAccess(context: { role: AppRole | null }): void {
  if (!context.role || !STAFF_BULK_ROLES.includes(context.role)) {
    throw new AppError("FORBIDDEN", STAFF_BULK_FORBIDDEN_TEXT);
  }
}

export interface StaffBulkPreviewRow {
  rowNumber: number;
  fullName: string;
  saintName: string | null;
  title: string;
  phone: string | null;
  className: string | null;
  capacity: string;
  formationLevel: string;
  /** STAFF-COMP-001 — thành phần đã quy về enum; quyết định tiền tố mã hồ sơ. */
  component: string;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
  /** Hồ sơ đã có trông giống người này — cảnh báo mềm, đúng khuôn TB-M04-03. */
  existingStaffCode: string | null;
}

export interface StaffBulkPreview {
  yearCode: string;
  rows: StaffBulkPreviewRow[];
  validCount: number;
  errorCount: number;
  /** Dòng sẽ **ghép** vào hồ sơ đã có thay vì tạo mới. */
  matchedCount: number;
}

export type StaffBulkResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string };

/** Lớp của một năm học, tra theo bí danh — cùng khoá với luồng nhập thiếu nhi. */
async function getClassLookup(academicYearId: string): Promise<StaffClassLookup> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, display_name")
    .eq("academic_year_id", academicYearId)
    .eq("status", "active");
  const lookup = new Map<string, string>();
  for (const row of data ?? []) lookup.set(classAliasKey(row.display_name), row.id);
  return lookup;
}

interface ExistingStaff {
  id: string;
  staffCode: string;
  fullName: string;
  /** Null từ IMP-BULK-002 — hồ sơ nhập từ sổ chưa có số điện thoại. */
  phone: string | null;
  /** STAFF-COMP-001 — `khac` nghĩa là chưa ai phân loại, lượt dán sau nâng được. */
  component: string;
}

/**
 * Hồ sơ đã có, khoá theo **tên đã bỏ dấu + số điện thoại**.
 *
 * 🔴 Khoá phải có **cả hai** vế. Chỉ theo tên thì hai người trùng họ tên bị gộp
 * làm một — danh sách của xứ đoàn có đúng trường hợp ấy (hai "Maria Nguyễn Thị
 * Thanh Hằng", một Huynh trưởng một Nữ tu). Chỉ theo số điện thoại thì cả một
 * gia đình dùng chung một số sẽ gộp thành một người.
 *
 * ⚠️ **IMP-BULK-002 — người KHÔNG có số điện thoại khoá theo mỗi cái tên**, tức
 * đúng cái rủi ro đoạn trên vừa nói. Đây là lựa chọn có ý thức giữa hai cái dở:
 * dán lại một khối đã dán (đường đi thường gặp nhất khi sửa vài dòng) sẽ đẻ ra
 * hồ sơ thứ hai cho **mọi** người thiếu số, còn gộp nhầm hai người trùng tên thì
 * hiếm hơn nhiều **và có người nhìn thấy trước**: màn hình xem trước in
 * *"Đã có hồ sơ GLVxxx — dùng lại"* trên đúng dòng đó, trước khi ghi.
 */
async function getExistingStaff(): Promise<Map<string, ExistingStaff>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("staff_profiles")
    .select("id, staff_code, full_name, phone, component");
  const map = new Map<string, ExistingStaff>();
  for (const row of data ?? []) {
    map.set(matchKey(row.full_name, row.phone), {
      id: row.id,
      staffCode: row.staff_code,
      fullName: row.full_name,
      phone: row.phone,
      component: row.component,
    });
  }
  return map;
}

function matchKey(fullName: string, phone: string | null): string {
  return `${classAliasKey(fullName)}|${phone ?? ""}`;
}

async function resolveYear(academicYearId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("id, code, name, status")
    .eq("id", academicYearId)
    .maybeSingle();
  if (!data) throw new AppError("VALIDATION_ERROR", "Không tìm thấy năm học đã chọn.");
  if (data.status !== "draft" && data.status !== "current") {
    throw new AppError(
      "VALIDATION_ERROR",
      `Năm học ${data.code} đã đóng nên không phân công thêm được.`,
    );
  }
  return data;
}

function failure(error: unknown): { ok: false; message: string } {
  if (error instanceof AppError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof StaffParseError) return { ok: false, message: error.message };
  return { ok: false, message: "Không xử lý được dữ liệu dán. Vui lòng thử lại." };
}

async function readRows(
  text: string,
  academicYearId: string,
): Promise<{ rows: BuiltStaffRow[]; year: { id: string; code: string } }> {
  if (text.trim() === "") {
    throw new AppError("VALIDATION_ERROR", "Vui lòng dán danh sách nhân sự vào ô văn bản.");
  }
  const year = await resolveYear(academicYearId);
  const classes = await getClassLookup(year.id);
  return { rows: parseStaffText(text, classes), year };
}

/** Pha một — xem trước. Không ghi gì. */
export async function previewStaffBulk(
  text: string,
  academicYearId: string,
): Promise<StaffBulkResult<StaffBulkPreview>> {
  const context = await staffBulkContext();
  try {
    assertStaffBulkAccess(context);
    const { rows, year } = await readRows(text, academicYearId);
    const existing = await getExistingStaff();

    const previewRows = rows.map<StaffBulkPreviewRow>((row) => {
      // IMP-BULK-002 — dòng thiếu số cũng phải được dò: `matchKey` đã có sẵn
      // nhánh `phone ?? ""`, nên bỏ điều kiện là đủ. Không dò thì người thiếu số
      // luôn hiện ra như hồ sơ mới, kể cả khi họ đã có hồ sơ từ lượt dán trước.
      const match = existing.get(matchKey(row.normalized.fullName, row.normalized.phone));
      return {
        rowNumber: row.rowNumber,
        fullName: row.normalized.fullName,
        saintName: row.normalized.saintName,
        title: row.normalized.title,
        phone: row.normalized.phone,
        className: row.normalized.classLabel,
        capacity: row.normalized.capacity,
        formationLevel: row.normalized.formationLevel,
        component: row.normalized.component,
        errors: row.errors,
        warnings: row.warnings,
        existingStaffCode: match?.staffCode ?? null,
      };
    });

    return {
      ok: true,
      data: {
        yearCode: year.code,
        rows: previewRows,
        validCount: previewRows.filter((row) => row.errors.length === 0).length,
        errorCount: previewRows.filter((row) => row.errors.length > 0).length,
        matchedCount: previewRows.filter((row) => row.existingStaffCode !== null).length,
      },
    };
  } catch (error) {
    return failure(error);
  }
}

export interface StaffBulkCommitSummary {
  created: number;
  reused: number;
  assigned: number;
  skipped: number;
  /**
   * STAFF-COMP-001 — hồ sơ đã có đang để "Chưa phân loại" và lượt dán này nói ra
   * được thành phần thật. Đếm riêng vì nó SỬA dữ liệu của hồ sơ cũ: một lượt dán
   * mà lặng lẽ đổi hồ sơ người khác là thứ phải hiện lên màn hình.
   */
  componentUpdated: number;
  /** Hồ sơ vào được nhưng KHÔNG phân công được lớp — không phải lỗi, xem đầu file. */
  assignFailures: { rowNumber: number; fullName: string; message: string }[];
  failures: { rowNumber: number; fullName: string; message: string }[];
}

/**
 * Pha hai — ghi thật.
 *
 * Đọc lại chính khối văn bản đã xem trước: dòng lỗi bị bỏ qua (đúng như luồng
 * thiếu nhi bỏ dòng `error`), dòng đã có hồ sơ khớp thì **dùng lại** hồ sơ ấy
 * thay vì tạo bản thứ hai.
 */
export async function commitStaffBulk(
  text: string,
  academicYearId: string,
  startsOn: string,
): Promise<StaffBulkResult<StaffBulkCommitSummary>> {
  const context = await staffBulkContext();
  try {
    assertStaffBulkAccess(context);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn)) {
      throw new AppError("VALIDATION_ERROR", "Ngày bắt đầu phân công không hợp lệ.");
    }
    const { rows } = await readRows(text, academicYearId);
    const existing = await getExistingStaff();
    const supabase = await createClient();

    const summary: StaffBulkCommitSummary = {
      created: 0,
      reused: 0,
      assigned: 0,
      skipped: 0,
      componentUpdated: 0,
      assignFailures: [],
      failures: [],
    };

    for (const row of rows) {
      const { normalized } = row;
      // IMP-BULK-002 — bỏ lượt kiểm `phone` thứ hai ở đây. Nó có mặt vì cột
      // `staff_profiles.phone` từng là `not null`; cột nay cho phép trống
      // (migration 20260819000100), nên dòng thiếu số phải đi tiếp chứ không
      // bị đếm vào `skipped`. `row.errors` vẫn là hàng rào duy nhất còn lại.
      if (row.errors.length > 0) {
        summary.skipped += 1;
        continue;
      }
      const phone = normalized.phone;

      const key = matchKey(normalized.fullName, phone);
      let staffId = existing.get(key)?.id ?? null;

      if (staffId) {
        summary.reused += 1;
        // STAFF-COMP-001 — nâng "Chưa phân loại" lên giá trị thật, và CHỈ hướng
        // đó. Ghi đè một thành phần đã có nghĩa là mỗi lượt dán lại khối cũ sẽ
        // xoá tay sửa của quản trị viên; còn `khac` thì không phải câu trả lời
        // của ai cả, nên thay được mà không mất gì.
        const current = existing.get(key);
        if (current && current.component === "khac" && normalized.component !== "khac") {
          const { error: componentError } = await supabase
            .from("staff_profiles")
            .update({ component: normalized.component, updated_by: context.profileId })
            .eq("id", staffId);
          if (!componentError) {
            summary.componentUpdated += 1;
            existing.set(key, { ...current, component: normalized.component });
          }
        }
      } else {
        const { data, error } = await supabase
          .from("staff_profiles")
          .insert({
            title: normalized.title,
            saint_name: normalized.saintName,
            full_name: normalized.fullName,
            date_of_birth: normalized.dateOfBirth,
            phone,
            address: normalized.address,
            formation_level: normalized.formationLevel,
            // STAFF-COMP-001 — cột này quyết tiền tố mã hồ sơ ở trigger
            // `staff_profiles_assign_code`: `tro_ta` ⇒ TTxxx, còn lại ⇒ GLVxxx.
            component: normalized.component,
            service_status: "active",
            updated_by: context.profileId,
          })
          .select("id, staff_code")
          .single();
        // SW-04 — RLS từ chối bằng **0 dòng**, không bằng ngoại lệ. Không kiểm
        // `data` thì một lượt bị chặn trông y hệt một lượt thành công.
        if (error || !data) {
          summary.failures.push({
            rowNumber: row.rowNumber,
            fullName: normalized.fullName,
            message: "Không tạo được hồ sơ (bị từ chối hoặc dữ liệu không hợp lệ).",
          });
          continue;
        }
        staffId = data.id;
        summary.created += 1;
        existing.set(key, {
          id: data.id,
          staffCode: data.staff_code,
          fullName: normalized.fullName,
          phone,
          component: normalized.component,
        });
      }

      if (!normalized.classId) continue;

      const { error: assignError } = await supabase.from("class_staff_assignments").insert({
        staff_profile_id: staffId,
        class_id: normalized.classId,
        capacity: normalized.capacity,
        starts_on: startsOn,
        updated_by: context.profileId,
      });
      if (assignError) {
        summary.assignFailures.push({
          rowNumber: row.rowNumber,
          fullName: normalized.fullName,
          // Dùng lại đúng từ điển câu chữ của nút "Phân công" một người: hai chỗ
          // gặp cùng một ràng buộc thì phải nói cùng một câu.
          message: assignmentErrorMessage(assignError, {
            staffName: normalized.fullName,
            targetClassName: normalized.classLabel,
          }),
        });
      } else {
        summary.assigned += 1;
      }
    }

    revalidatePath("/staff");
    revalidatePath("/classes");
    return { ok: true, data: summary };
  } catch (error) {
    return failure(error);
  }
}
