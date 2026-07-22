"use server";

import { revalidatePath } from "next/cache";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import { buildRow } from "../build-row";
import { findDuplicate, findInFileDuplicates } from "../dedup";
import { ImportParseError, parseWorkbook } from "../parse";
import { requireImportAccess } from "./permissions";
import {
  getClassLookup,
  getCurrentAcademicYear,
  getExistingStudents,
  listClassOptions,
} from "./queries";

type ImportActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: AppErrorCode; message: string };

/** Chunk size for commit, per docs/09 §7 (one transaction per chunk). */
const COMMIT_CHUNK_SIZE = 100;

/** Upload guard: the parish files are well under this; anything larger is a
 *  mistake or an attack on the parser. */
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Serialize a value into the `Json` shape the generated DB types expect. */
function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

function fail(error: unknown): ImportActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof ImportParseError) {
    return { ok: false, code: "VALIDATION_ERROR", message: error.message };
  }
  return {
    ok: false,
    code: "CONFLICT",
    message: "Không xử lý được file import. Vui lòng thử lại.",
  };
}

export interface DryRunSummary {
  batchId: string;
  sourceFormat: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
}

/**
 * Parse an uploaded workbook, validate every row and stage the result.
 * Writes only to import_batches/import_rows — no business table is touched
 * until commitBatch runs (docs/09 §2, §9).
 */
export async function createDryRunBatch(
  formData: FormData,
): Promise<ImportActionResult<DryRunSummary>> {
  try {
    const actor = await requireImportAccess();

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new AppError("VALIDATION_ERROR", "Vui lòng chọn file Excel để tải lên.");
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new AppError("VALIDATION_ERROR", "File vượt quá 5MB.");
    }

    const year = await getCurrentAcademicYear();
    if (!year) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Chưa có năm học hiện tại. Vui lòng tạo năm học trước khi import.",
      );
    }

    const parsed = await parseWorkbook(await file.arrayBuffer());
    const [classes, existing] = await Promise.all([
      getClassLookup(year.id),
      getExistingStudents(),
    ]);

    // Optional target class for sheets with no class column (Chiên Con roster).
    // The label is resolved server-side rather than trusted from the form.
    const fallbackClassId = String(formData.get("classId") ?? "") || null;
    let fallbackClassLabel: string | null = null;
    if (fallbackClassId) {
      const option = (await listClassOptions(year.id)).find((item) => item.id === fallbackClassId);
      if (!option) {
        throw new AppError("VALIDATION_ERROR", "Lớp đích không thuộc năm học hiện tại.");
      }
      fallbackClassLabel = option.displayName;
    }

    const built = parsed.rows.map((row) =>
      buildRow(row, classes, { fallbackClassId, fallbackClassLabel }),
    );
    const inFileConflicts = findInFileDuplicates(built.map((row) => row.normalized));

    const supabase = await createClient();
    const { data: batch, error: batchError } = await supabase
      .from("import_batches")
      .insert({
        filename: file.name,
        source_format: parsed.layout,
        academic_year_id: year.id,
        uploaded_by: actor.profileId,
        total_rows: built.length,
      })
      .select("id")
      .single();
    if (batchError || !batch) throw new AppError("VALIDATION_ERROR");

    let validRows = 0;
    let warningRows = 0;
    let errorRows = 0;

    const rowsPayload = built.map((row, index) => {
      const warnings = [...row.warnings];

      // Duplicate warnings never block the import (docs/09 §5).
      const duplicate = findDuplicate(row.normalized, existing);
      if (duplicate) {
        warnings.push({ field: "duplicate", message: `[${duplicate.level}] ${duplicate.reason}` });
      }
      const inFile = inFileConflicts.get(index);
      if (inFile) warnings.push({ field: "duplicate", message: inFile });

      const status: "valid" | "warning" | "error" =
        row.errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid";
      if (status === "error") errorRows += 1;
      else if (status === "warning") warningRows += 1;
      else validRows += 1;

      return {
        batch_id: batch.id,
        row_number: row.rowNumber,
        raw_json: toJson(parsed.rows[index].values),
        normalized_json: toJson(row.normalized),
        status,
        errors_json: toJson(row.errors),
        warnings_json: toJson(warnings),
        matched_student_id: duplicate?.student.id ?? null,
        action: "create" as const,
      };
    });

    if (rowsPayload.length > 0) {
      const { error: rowsError } = await supabase.from("import_rows").insert(rowsPayload);
      if (rowsError) throw new AppError("VALIDATION_ERROR");
    }

    await supabase
      .from("import_batches")
      .update({ valid_rows: validRows, warning_rows: warningRows, error_rows: errorRows })
      .eq("id", batch.id);

    revalidatePath("/imports");
    return {
      ok: true,
      data: {
        batchId: batch.id,
        sourceFormat: parsed.layout,
        totalRows: built.length,
        validRows,
        warningRows,
        errorRows,
      },
    };
  } catch (error) {
    return fail(error);
  }
}

/** Record the reviewer's decision for one row (create / merge / skip). */
export async function setRowAction(
  rowId: string,
  action: "create" | "merge" | "skip",
): Promise<ImportActionResult> {
  try {
    await requireImportAccess();
    const supabase = await createClient();
    const { error } = await supabase.from("import_rows").update({ action }).eq("id", rowId);
    if (error) throw new AppError("VALIDATION_ERROR");
    revalidatePath("/imports");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Set the gender the reviewer picked for a row. The parish SYLL sheets carry no
 * gender column, so this is how the required value gets filled in — never a
 * default, always an explicit human choice.
 */
export async function setRowGender(
  rowId: string,
  gender: "male" | "female" | "other",
): Promise<ImportActionResult> {
  try {
    await requireImportAccess();
    const supabase = await createClient();

    const { data: row, error: readError } = await supabase
      .from("import_rows")
      .select("normalized_json, warnings_json")
      .eq("id", rowId)
      .maybeSingle();
    if (readError || !row) throw new AppError("RESOURCE_NOT_FOUND");

    const normalized = { ...((row.normalized_json ?? {}) as Record<string, unknown>), gender };
    // Drop the "missing gender" warning now that it is answered.
    const warnings = ((row.warnings_json ?? []) as { field: string; message: string }[]).filter(
      (issue) => issue.field !== "gender",
    );

    const { error } = await supabase
      .from("import_rows")
      .update({ normalized_json: toJson(normalized), warnings_json: toJson(warnings) })
      .eq("id", rowId);
    if (error) throw new AppError("VALIDATION_ERROR");

    revalidatePath("/imports");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}

export interface CommitSummary {
  committed: number;
  failed: number;
  failures: { rowNumber: number; message: string }[];
}

/**
 * Commit a reviewed batch in chunks of {@link COMMIT_CHUNK_SIZE}. Each RPC call
 * is its own transaction, and a row that fails is reported rather than silently
 * dropped (docs/09 §7).
 */
export async function commitBatch(batchId: string): Promise<ImportActionResult<CommitSummary>> {
  try {
    await requireImportAccess();
    const supabase = await createClient();

    const { data: pending, error: pendingError } = await supabase
      .from("import_rows")
      .select("id, row_number, action, normalized_json")
      .eq("batch_id", batchId)
      .in("status", ["valid", "warning"])
      .order("row_number");
    if (pendingError) throw new AppError("VALIDATION_ERROR");

    const ids = (pending ?? []).map((row) => row.id);
    if (ids.length === 0) {
      throw new AppError("VALIDATION_ERROR", "Không còn dòng nào hợp lệ để ghi vào hệ thống.");
    }

    // students.gender is NOT NULL. Catch it here with a readable message rather
    // than letting every such row fail inside the RPC with a constraint error.
    const missingGender = (pending ?? []).filter((row) => {
      if (row.action !== "create") return false;
      const normalized = (row.normalized_json ?? {}) as Record<string, unknown>;
      return !normalized.gender;
    });
    if (missingGender.length > 0) {
      const sample = missingGender
        .slice(0, 5)
        .map((row) => `#${row.row_number}`)
        .join(", ");
      throw new AppError(
        "VALIDATION_ERROR",
        `Còn ${missingGender.length} dòng chưa chọn giới tính (${sample}${
          missingGender.length > 5 ? "…" : ""
        }). Vui lòng chọn Nam/Nữ cho các dòng này trước khi ghi.`,
      );
    }

    let committed = 0;
    const failures: { rowNumber: number; message: string }[] = [];

    for (let offset = 0; offset < ids.length; offset += COMMIT_CHUNK_SIZE) {
      const chunk = ids.slice(offset, offset + COMMIT_CHUNK_SIZE);
      const { data, error } = await supabase.rpc("commit_import_rows", {
        p_batch_id: batchId,
        p_row_ids: chunk,
      });
      if (error) throw new AppError("CONFLICT", "Không ghi được dữ liệu import.");

      for (const result of data ?? []) {
        if (result.out_committed) committed += 1;
        else if (result.out_error_message) {
          failures.push({
            rowNumber: result.out_row_number,
            message: result.out_error_message,
          });
        }
      }
    }

    revalidatePath("/imports");
    revalidatePath("/students");
    revalidatePath("/classes");
    return { ok: true, data: { committed, failed: failures.length, failures } };
  } catch (error) {
    return fail(error);
  }
}

/** Discard a staged batch. Staging data is disposable (docs/09 §6). */
export async function deleteBatch(batchId: string): Promise<ImportActionResult> {
  try {
    await requireImportAccess();
    const supabase = await createClient();
    const { error } = await supabase.from("import_batches").delete().eq("id", batchId);
    if (error) throw new AppError("VALIDATION_ERROR");
    revalidatePath("/imports");
    return { ok: true, data: undefined };
  } catch (error) {
    return fail(error);
  }
}
