import "server-only";

import { createClient } from "@/lib/supabase/server";
import { classAliasKey } from "../normalize";
import type { ClassLookup } from "../build-row";
import type { ExistingStudent } from "../dedup";
import { requireImportAccess } from "./permissions";

export interface CurrentYear {
  id: string;
  code: string;
  name: string;
}

/** The academic year an import targets. Imports always land in the current year. */
export async function getCurrentAcademicYear(): Promise<CurrentYear | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("academic_years")
    .select("id, code, name")
    .eq("status", "current")
    .maybeSingle();
  return data ?? null;
}

/**
 * Build the class-alias lookup for a year. Keys come from
 * {@link classAliasKey} so "ẤU 3A", "Au 3 A" and "Ấu 3A" all resolve.
 */
export async function getClassLookup(academicYearId: string): Promise<ClassLookup> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, display_name")
    .eq("academic_year_id", academicYearId)
    .eq("status", "active");

  const lookup = new Map<string, string>();
  for (const row of data ?? []) {
    lookup.set(classAliasKey(row.display_name), row.id);
  }
  return lookup;
}

/**
 * Students already on file, used for duplicate warnings. Scoped to what the
 * importing user may read; the global-write roles that can import see all.
 */
export async function getExistingStudents(): Promise<ExistingStudent[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("students")
    .select("id, student_code, full_name, date_of_birth, guardians(phone)")
    .eq("status", "active");

  return (data ?? []).map((row) => {
    const guardian = row.guardians as { phone: string } | { phone: string }[] | null;
    const phone = Array.isArray(guardian) ? (guardian[0]?.phone ?? null) : (guardian?.phone ?? null);
    return {
      id: row.id,
      studentCode: row.student_code,
      fullName: row.full_name,
      dateOfBirth: row.date_of_birth,
      guardianPhone: phone,
    };
  });
}

export interface ClassOption {
  id: string;
  displayName: string;
}

/** Active classes of the current year, for the upload-time class selector. */
export async function listClassOptions(academicYearId: string): Promise<ClassOption[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, display_name")
    .eq("academic_year_id", academicYearId)
    .eq("status", "active")
    .order("display_name");
  return (data ?? []).map((row) => ({ id: row.id, displayName: row.display_name }));
}

export interface BatchSummary {
  id: string;
  filename: string;
  sourceFormat: string;
  status: string;
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  committedRows: number;
  createdAt: string;
}

export async function listBatches(): Promise<BatchSummary[]> {
  await requireImportAccess();
  const supabase = await createClient();
  const { data } = await supabase
    .from("import_batches")
    .select(
      "id, filename, source_format, status, total_rows, valid_rows, warning_rows, error_rows, committed_rows, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => ({
    id: row.id,
    filename: row.filename,
    sourceFormat: row.source_format,
    status: row.status,
    totalRows: row.total_rows,
    validRows: row.valid_rows,
    warningRows: row.warning_rows,
    errorRows: row.error_rows,
    committedRows: row.committed_rows,
    createdAt: row.created_at,
  }));
}

export interface BatchRow {
  id: string;
  rowNumber: number;
  status: string;
  action: string;
  fullName: string;
  className: string | null;
  errors: { field: string; message: string }[];
  warnings: { field: string; message: string }[];
  matchedStudentId: string | null;
  commitError: string | null;
  /** Null when the sheet had no gender column; the reviewer must choose one. */
  gender: string | null;
}

export interface BatchDetail extends BatchSummary {
  rows: BatchRow[];
}

export async function getBatchDetail(batchId: string): Promise<BatchDetail | null> {
  await requireImportAccess();
  const supabase = await createClient();
  const { data: batch } = await supabase
    .from("import_batches")
    .select(
      "id, filename, source_format, status, total_rows, valid_rows, warning_rows, error_rows, committed_rows, created_at",
    )
    .eq("id", batchId)
    .maybeSingle();
  if (!batch) return null;

  const { data: rows } = await supabase
    .from("import_rows")
    .select(
      "id, row_number, status, action, normalized_json, errors_json, warnings_json, matched_student_id, commit_error",
    )
    .eq("batch_id", batchId)
    .order("row_number");

  return {
    id: batch.id,
    filename: batch.filename,
    sourceFormat: batch.source_format,
    status: batch.status,
    totalRows: batch.total_rows,
    validRows: batch.valid_rows,
    warningRows: batch.warning_rows,
    errorRows: batch.error_rows,
    committedRows: batch.committed_rows,
    createdAt: batch.created_at,
    rows: (rows ?? []).map((row) => {
      const normalized = (row.normalized_json ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        rowNumber: row.row_number,
        status: row.status,
        action: row.action,
        fullName: String(normalized.full_name ?? ""),
        className: (normalized.class_label as string | null) ?? null,
        errors: (row.errors_json ?? []) as { field: string; message: string }[],
        warnings: (row.warnings_json ?? []) as { field: string; message: string }[],
        matchedStudentId: row.matched_student_id,
        commitError: row.commit_error,
        gender: (normalized.gender as string | null) ?? null,
      };
    }),
  };
}
