"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { AppError, type AppErrorCode } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";
import {
  BULK_GENDER_FIELD,
  CONFIRM_ROW_FIELD,
  readRowEdits,
} from "../batch-directory";
import { buildRow } from "../build-row";
import { commitErrorText } from "../commit-errors";
import { findDuplicate, findInFileDuplicates } from "../dedup";
import {
  cancelFeedback,
  commitFeedback,
  importFailureFeedback,
  IMPORT_NO_CHANGE_TEXT,
  purgeRawFeedback,
  rowEditsFeedback,
  uploadFailureFeedback,
  type ImportFeedback,
  type RowEditsSummary,
} from "../import-feedback";
import { checkUploadSize, MAX_IMPORT_ROWS, tooManyRowsText } from "../limits";
import { ImportParseError, parseWorkbook } from "../parse";
import {
  decideDuplicateRow,
  hasPendingDuplicate,
  pendingDuplicateMessage,
  resolveDuplicateWarnings,
  type RowAction,
  type RowIssue,
} from "../row-decision";
import { batchRefSchema, rowEditsSchema, type RowEditsInput } from "../schemas";
import { assertImportAccess, importRouteContext } from "./permissions";
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

/** Serialize a value into the `Json` shape the generated DB types expect. */
function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value ?? null)) as Json;
}

function fail(error: unknown): ImportActionResult<never> {
  if (error instanceof AppError) return { ok: false, code: error.code, message: error.message };
  if (error instanceof ImportParseError) {
    return { ok: false, code: "VALIDATION_ERROR", message: error.message };
  }
  // M12-A: lỗi Zod phải giữ nguyên câu tiếng Việt của chính nó. Bản cũ gói mọi
  // lỗi lạ thành "Không xử lý được file import", nên một `rowId` hỏng hiện ra
  // thành một câu nói về *file* — dẫn người dùng đi sửa nhầm chỗ. Cùng vá gốc
  // với M02-A và M03-A.
  if (error instanceof ZodError) {
    return {
      ok: false,
      code: "VALIDATION_ERROR",
      message: error.issues[0]?.message ?? "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.",
    };
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
  const actor = await importRouteContext();
  try {
    assertImportAccess(actor);

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      throw new AppError("VALIDATION_ERROR", "Vui lòng chọn file Excel để tải lên.");
    }
    // TO-BE 8 / SEC-10 / D-137 — trần 4 MB, đặt dưới trần ~4,5 MB của nền tảng
    // để câu tiếng Việt này còn có cơ hội chạy. Xem `limits.ts`.
    const tooLarge = checkUploadSize(file.size);
    if (tooLarge) throw new AppError("VALIDATION_ERROR", tooLarge);

    const year = await getCurrentAcademicYear();
    if (!year) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Chưa có năm học hiện tại. Vui lòng tạo năm học trước khi import.",
      );
    }

    const parsed = await parseWorkbook(await file.arrayBuffer());
    // 🔴 TO-BE 8 / SEC-12 / D-138 — chặn NGAY SAU khi đọc file và **trước** khi
    // đọc cơ sở dữ liệu. Mỗi dòng kéo theo một lượt `buildRow` cộng một lượt dò
    // trùng trên toàn bộ hồ sơ đã có, nên một file trăm nghìn dòng làm treo hàm
    // trước khi ghi được gì. Giới hạn dung lượng không thay được phép kiểm này:
    // sheet toàn chữ nén rất tốt.
    if (parsed.rows.length > MAX_IMPORT_ROWS) {
      throw new AppError("VALIDATION_ERROR", tooManyRowsText(parsed.rows.length));
    }
    const [classes, existing] = await Promise.all([
      getClassLookup(year.id),
      getExistingStudents(),
    ]);
    // Trạng thái hồ sơ đối chiếu không đi kèm `DuplicateMatch` (kiểu dùng chung
    // với đường nhập tay), nên tra lại tại chỗ bằng id.
    const statusById = new Map(existing.map((student) => [student.id, student.status]));

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
      const warnings: RowIssue[] = [...row.warnings];

      // 🔴 M12-A / TO-BE 2: quyết định mặc định của dòng trùng nay do
      // `decideDuplicateRow` đặt, không còn là `"create"` viết cứng. Xem
      // `row-decision.ts` để biết vì sao mặc định an toàn thôi thì chưa đủ.
      const duplicate = findDuplicate(row.normalized, existing);
      const decision = decideDuplicateRow(
        duplicate
          ? {
              level: duplicate.level,
              studentId: duplicate.student.id,
              reason: duplicate.reason,
              status: statusById.get(duplicate.student.id) ?? "active",
            }
          : null,
      );
      if (decision.warning) warnings.push(decision.warning);

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
        action: decision.action,
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

/** Bao nhiêu lệnh `update` chạy song song một lượt. Xem giải thích ở {@link saveRowEdits}. */
const ROW_UPDATE_CONCURRENCY = 8;

/**
 * Lưu quyết định của **nhiều dòng trong một lượt gửi** — M12-B, **TO-BE 4 /
 * AC-21 / BR-M12-36**, và giữ nguyên **D-133**.
 *
 * 🔴 Vấn đề đang sửa (`03_AUDIT_RESULTS` tiêu chí 3 = **2/5**, thấp nhất module):
 * sổ SYLL của giáo xứ **không có cột giới tính**, mà `students.gender` là NOT
 * NULL — nên **83% dòng** phải được người duyệt chọn tay. Trước đợt này mỗi dòng
 * là **một lần gửi + một lượt dựng lại cả trang** đang hiện đủ 30 thẻ. Một sổ 30
 * em = 30 lượt như thế; sổ 300 em thì không ai làm nổi.
 *
 * 🔴 **Vì sao vẫn còn thứ KHÔNG lưu hàng loạt được.** Chủ dự án chốt 2026-07-29
 * (**D-136**): nút này lưu cả giới tính lẫn cách xử lý, **trừ** dòng nghi trùng
 * chắc chắn. Lý do không phải kỹ thuật mà là chính **D-133** vừa chốt hôm trước:
 * dòng trùng mức `high` phải được người duyệt nhìn tận mắt từng dòng. Một nút
 * gộp xác nhận được 20 dòng trùng bằng một cú bấm là đúng thứ D-133 sinh ra để
 * chặn — nên các dòng ấy vẫn có nút **"Xác nhận dòng này"** của riêng chúng, và
 * lượt lưu hàng loạt chỉ **báo lại** rằng chúng chưa được lưu, không im lặng bỏ.
 * Giới tính thì ngược lại: nó không phải một quyết định về danh tính em nào, nên
 * lưu hàng loạt là an toàn.
 *
 * ⚠️ **Một lượt gửi của trình duyệt, nhiều lệnh `update` ở máy chủ.** AC-21 đòi
 * "chỉ một lần gửi lên server và một lần tải lại danh sách" — đó là đòi hỏi về
 * phía người dùng, và điều đó đạt được. Bên trong vẫn phải một lệnh mỗi dòng vì
 * `gender` nằm **bên trong** `normalized_json` và `warnings_json` khác nhau từng
 * dòng: PostgREST không hợp nhất jsonb theo hàng được. Chạy theo lô
 * {@link ROW_UPDATE_CONCURRENCY} để một trang 50 dòng không thành 50 lượt đi về
 * nối đuôi nhau — đúng chỗ nợ #10 đang đau (vòng trả lời của Server Action).
 */
export async function saveRowEdits(
  input: RowEditsInput,
): Promise<ImportActionResult<RowEditsSummary>> {
  const actor = await importRouteContext();
  try {
    assertImportAccess(actor);
    const parsed = rowEditsSchema.parse(input);
    const supabase = await createClient();

    // Bấm "Xác nhận dòng này" là một câu nói về ĐÚNG MỘT dòng. Thu hẹp ngay ở
    // đây, trước khi đọc cơ sở dữ liệu, để không có đường nào một cú bấm ấy đụng
    // tới dòng khác.
    let entries = parsed.entries;
    if (parsed.confirmRowId) {
      entries = entries.filter((entry) => entry.rowId === parsed.confirmRowId);
      if (entries.length === 0) {
        throw new AppError("VALIDATION_ERROR", "Không tìm thấy dòng cần xác nhận. Hãy tải lại trang.");
      }
    } else if (parsed.bulkGender) {
      // Đường dự phòng khi chưa có JavaScript của nút "Áp dụng Nam/Nữ cho các
      // dòng đang chọn": máy chủ áp đúng những dòng người dùng đã đánh dấu.
      // Vẫn là lựa chọn tường minh của con người ⇒ không phạm BR-M12-36.
      entries = entries.map((entry) =>
        entry.picked ? { ...entry, gender: parsed.bulkGender } : entry,
      );
    }

    const wanted = new Map(entries.map((entry) => [entry.rowId, entry]));
    const { data: current, error: readError } = await supabase
      .from("import_rows")
      .select("id, row_number, status, action, normalized_json, warnings_json, matched_student_id")
      // 🔴 Lọc theo **cả** `batch_id` lẫn danh sách id: id dòng đến từ biểu mẫu
      // nên một `rowId` của lần nhập khác vẫn là một UUID hợp lệ. Không có vế
      // `batch_id` thì `revalidatePath` báo đúng trang này trong khi dữ liệu vừa
      // đổi ở một lần nhập khác — sai im lặng.
      .eq("batch_id", parsed.batchId)
      .in("id", [...wanted.keys()])
      .order("row_number");
    if (readError) throw new AppError("VALIDATION_ERROR");

    const updates: {
      rowId: string;
      rowNumber: number;
      payload: { normalized_json?: Json; warnings_json?: Json; action?: RowAction };
    }[] = [];
    const confirmations: {
      rowId: string;
      rowNumber: number;
      action: RowAction;
      payload: { normalized_json?: Json; warnings_json?: Json; action?: RowAction };
    }[] = [];
    const blocked: number[] = [];
    let saved = 0;
    const failures: { rowNumber: number; message: string }[] = [];

    for (const row of current ?? []) {
      const entry = wanted.get(row.id);
      if (!entry) continue;
      // Dòng đã ghi hoặc đã bỏ qua là chuyện đã rồi; dòng lỗi thì sửa file rồi
      // tải lại, không sửa quyết định ở đây (đúng như bản cũ đã làm với thẻ dòng).
      if (row.status === "committed" || row.status === "skipped") continue;

      const warnings = (row.warnings_json ?? []) as unknown as RowIssue[];
      const normalized = (row.normalized_json ?? {}) as Record<string, unknown>;
      const payload: { normalized_json?: Json; warnings_json?: Json; action?: RowAction } = {};
      let nextWarnings = warnings;
      let confirmedAction: RowAction | null = null;

      if (entry.gender && entry.gender !== normalized.gender) {
        payload.normalized_json = toJson({ ...normalized, gender: entry.gender });
        nextWarnings = nextWarnings.filter((issue) => issue.field !== "gender");
      }

      const pending = hasPendingDuplicate(warnings);
      const wantsAction = entry.action && row.status !== "error";
      if (wantsAction) {
        if (pending && parsed.confirmRowId !== row.id) {
          // D-133: mặc định an toàn vẫn là máy quyết thay người. Không lưu, và
          // **nói ra** — im lặng bỏ qua ở đây thì người duyệt bấm Ghi mới biết.
          blocked.push(row.row_number);
        } else if (entry.action === "merge" && !row.matched_student_id) {
          throw new AppError(
            "VALIDATION_ERROR",
            `Dòng #${row.row_number} không có hồ sơ nào để ghép. Hãy chọn Tạo mới hoặc Bỏ qua.`,
          );
        } else if (entry.action !== row.action || parsed.confirmRowId === row.id) {
          // Bấm đúng nút của dòng đó thì ghi **kể cả khi giá trị không đổi**:
          // xác nhận "để nguyên Ghép" cũng là một quyết định, và nó phải gỡ được
          // dấu chặn. Không có nhánh này thì dòng mặc định đúng sẵn vĩnh viễn
          // không xác nhận được.
          if (pending) {
            // D-133: clearing duplicate_pending is privileged DB behavior. A
            // direct table update must not be able to impersonate this click.
            confirmedAction = entry.action as RowAction;
          } else {
            payload.action = entry.action as RowAction;
            nextWarnings = resolveDuplicateWarnings(nextWarnings);
          }
        }
      }

      if (nextWarnings !== warnings) payload.warnings_json = toJson(nextWarnings);
      if (confirmedAction) {
        confirmations.push({
          rowId: row.id,
          rowNumber: row.row_number,
          action: confirmedAction,
          payload,
        });
      } else if (Object.keys(payload).length > 0) {
        updates.push({ rowId: row.id, rowNumber: row.row_number, payload });
      }
    }

    // Apply any ordinary review edits first while duplicate_pending remains
    // intact; only then may the authoritative RPC resolve that marker. This
    // ordering also handles a single click that changes both gender and the
    // duplicate action without accidentally re-introducing the marker.
    for (const confirmation of confirmations) {
      let editOk = true;
      if (Object.keys(confirmation.payload).length > 0) {
        const { data, error } = await supabase
          .from("import_rows")
          .update(confirmation.payload)
          .eq("id", confirmation.rowId)
          .eq("batch_id", parsed.batchId)
          .select("id");
        editOk = !error && (data?.length ?? 0) > 0;
      }
      const { error } = editOk
        ? await supabase.rpc("confirm_import_duplicate", {
            p_row_id: confirmation.rowId,
            p_action: confirmation.action,
          })
        : { error: new Error(IMPORT_NO_CHANGE_TEXT) };
      if (error) {
        failures.push({ rowNumber: confirmation.rowNumber, message: IMPORT_NO_CHANGE_TEXT });
      } else {
        saved += 1;
      }
    }

    for (let offset = 0; offset < updates.length; offset += ROW_UPDATE_CONCURRENCY) {
      const chunk = updates.slice(offset, offset + ROW_UPDATE_CONCURRENCY);
      const results = await Promise.all(
        chunk.map(async (update) => {
          const { data, error } = await supabase
            .from("import_rows")
            .update(update.payload)
            .eq("id", update.rowId)
            .eq("batch_id", parsed.batchId)
            .select("id");
          return { update, ok: !error && (data?.length ?? 0) > 0 };
        }),
      );
      for (const result of results) {
        if (result.ok) saved += 1;
        else failures.push({ rowNumber: result.update.rowNumber, message: IMPORT_NO_CHANGE_TEXT });
      }
    }

    // TO-BE 4 bước 4 — revalidate ĐÚNG trang lần nhập, không phải `/imports`.
    // Bản cũ revalidate `/imports` sau mỗi dòng, tức dựng lại một trang mà người
    // dùng còn không đứng ở đó.
    revalidatePath(`/imports/${parsed.batchId}`);
    return { ok: true, data: { saved, blocked, failures } };
  } catch (error) {
    return fail(error);
  }
}

export interface CommitSummary {
  committed: number;
  /** Dòng người duyệt chọn "Bỏ qua" — không phải lỗi, phải đếm riêng. */
  skipped: number;
  failed: number;
  failures: { rowNumber: number; message: string }[];
  /**
   * M12-C / TO-BE 6 / AC-24 — dòng **ghi được hồ sơ nhưng KHÔNG tạo được ghi
   * danh** vì em đã có lớp đang mở trong năm học này (D-11).
   *
   * 🔴 Con số này phải đứng riêng, không được gộp vào `committed` cũng không
   * được gộp vào `failed`. Gộp vào `committed` là đúng thứ lỗi 4.5 vừa sửa —
   * báo "đã ghi" cho một việc không xảy ra. Gộp vào `failed` thì sai kiểu khác:
   * hồ sơ em **đã** được tạo/ghép thật, và bảo người dùng đi sửa file rồi tải
   * lại sẽ sinh ra hồ sơ trùng.
   */
  enrollmentSkipped: number;
  /** Tối đa 5 số dòng, đủ để người dùng mở đúng chỗ mà không thành một bức tường số. */
  enrollmentSkippedSample: number[];
}

/**
 * Commit a reviewed batch in chunks of {@link COMMIT_CHUNK_SIZE}. Each RPC call
 * is its own transaction, and a row that fails is reported rather than silently
 * dropped (docs/09 §7).
 */
export async function commitBatch(batchId: string): Promise<ImportActionResult<CommitSummary>> {
  const actor = await importRouteContext();
  try {
    assertImportAccess(actor);
    const parsed = batchRefSchema.parse({ batchId });
    const supabase = await createClient();

    const { data: pending, error: pendingError } = await supabase
      .from("import_rows")
      .select("id, row_number, action, normalized_json, warnings_json")
      .eq("batch_id", parsed.batchId)
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

    // 🔴 BR-M12-32 / AC-19 / D-133 — cùng khuôn chặn với dòng thiếu giới tính:
    // một mặc định an toàn vẫn là máy quyết thay người, nên dòng trùng chắc chắn
    // phải có người nhìn tận mắt rồi bấm Lưu.
    const undecided = (pending ?? []).filter((row) =>
      hasPendingDuplicate((row.warnings_json ?? []) as unknown as RowIssue[]),
    );
    if (undecided.length > 0) {
      throw new AppError(
        "VALIDATION_ERROR",
        pendingDuplicateMessage(undecided.map((row) => row.row_number)),
      );
    }

    let committed = 0;
    let skipped = 0;
    const failures: { rowNumber: number; message: string }[] = [];
    const enrollmentSkipped: number[] = [];

    for (let offset = 0; offset < ids.length; offset += COMMIT_CHUNK_SIZE) {
      const chunk = ids.slice(offset, offset + COMMIT_CHUNK_SIZE);
      const { data, error } = await supabase.rpc("commit_import_rows", {
        p_batch_id: parsed.batchId,
        p_row_ids: chunk,
      });
      if (error) throw new AppError("CONFLICT", "Không ghi được dữ liệu import.");

      for (const result of data ?? []) {
        if (result.out_committed) {
          committed += 1;
          // TO-BE 6 / AC-24 — hồ sơ vào được, lớp thì không. Cột này mới có từ
          // migration `20260803000100`; trước đó việc ấy xảy ra trong im lặng.
          if (result.out_enrollment_created === false) {
            enrollmentSkipped.push(result.out_row_number);
          }
        } else if (result.out_error_message) {
          failures.push({
            rowNumber: result.out_row_number,
            // AC-26 / SEC-16 — không bao giờ đưa `sqlerrm` ra màn hình.
            message: commitErrorText(result.out_error_message) ?? "",
          });
        } else skipped += 1;
      }
    }

    revalidatePath("/imports");
    revalidatePath(`/imports/${parsed.batchId}`);
    revalidatePath("/students");
    revalidatePath("/classes");
    return {
      ok: true,
      data: {
        committed,
        skipped,
        failed: failures.length,
        failures,
        enrollmentSkipped: enrollmentSkipped.length,
        enrollmentSkippedSample: enrollmentSkipped.slice(0, 5),
      },
    };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Huỷ một lần nhập **chưa ghi** — D-131 / BR-M12-35 / AC-17.
 *
 * 🔴 Đây là chỗ thay nút "Xoá lần nhập này" của bản cũ, và khác nó ở điều quan
 * trọng nhất: **không xoá gì cả**. Bản cũ gọi `.delete()` mà không kiểm trạng
 * thái, nên một lần nhập đã tạo ra hàng trăm hồ sơ cũng bốc hơi cùng toàn bộ mối
 * nối "dòng nào tạo ra em nào" (`on delete cascade`). Hàng rào thật nằm ở
 * policy `import_batches_delete_dry_run` của migration cùng đợt; câu kiểm ở đây
 * chỉ để nói ra thành lời.
 */
export async function cancelBatch(
  batchId: string,
): Promise<ImportActionResult<{ totalRows: number }>> {
  const actor = await importRouteContext();
  try {
    assertImportAccess(actor);
    const parsed = batchRefSchema.parse({ batchId });
    const supabase = await createClient();

    const { data: batch, error: readError } = await supabase
      .from("import_batches")
      .select("id, status, committed_rows, total_rows")
      .eq("id", parsed.batchId)
      .maybeSingle();
    if (readError || !batch) throw new AppError("RESOURCE_NOT_FOUND");
    if (batch.status !== "dry_run" || batch.committed_rows > 0) {
      throw new AppError(
        "CONFLICT",
        "Lần nhập này đã ghi dữ liệu vào hệ thống nên không huỷ được. Dữ liệu đã ghi phải sửa ở trang Thiếu nhi.",
      );
    }

    const { data: updated, error } = await supabase
      .from("import_batches")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: actor.profileId,
      })
      .eq("id", parsed.batchId)
      .eq("status", "dry_run")
      .select("id, total_rows");
    if (error) throw new AppError("VALIDATION_ERROR");
    if (!updated || updated.length === 0) throw new AppError("CONFLICT", IMPORT_NO_CHANGE_TEXT);

    revalidatePath("/imports");
    revalidatePath(`/imports/${parsed.batchId}`);
    return { ok: true, data: { totalRows: updated[0].total_rows } };
  } catch (error) {
    return fail(error);
  }
}

/**
 * Xoá **dữ liệu thô** của một lần nhập đã xử lý xong — D-132 / `docs/09` §6.
 *
 * `raw_json` là bản chép nguyên văn các ô Excel: họ tên, ngày sinh, địa chỉ, số
 * điện thoại và ghi chú sức khoẻ của trẻ (SEC-15). Giữ nó mãi không có lý do
 * nghiệp vụ nào — nhưng **mapping dòng → hồ sơ thì có** (`docs/09` §7), nên chỉ
 * `raw_json` bị dọn, `created_student_id`/`created_guardian_id` ở lại.
 */
export async function purgeBatchRawData(
  batchId: string,
): Promise<ImportActionResult<{ rows: number }>> {
  const actor = await importRouteContext();
  try {
    assertImportAccess(actor);
    const parsed = batchRefSchema.parse({ batchId });
    const supabase = await createClient();

    const { data: batch, error: readError } = await supabase
      .from("import_batches")
      .select("id, status")
      .eq("id", parsed.batchId)
      .maybeSingle();
    if (readError || !batch) throw new AppError("RESOURCE_NOT_FOUND");
    if (batch.status === "dry_run") {
      throw new AppError(
        "CONFLICT",
        "Lần nhập này còn đang chờ xác nhận. Dữ liệu thô là thứ để đối chiếu khi duyệt, chỉ xoá được sau khi đã ghi hoặc đã huỷ.",
      );
    }

    const { data: rows, error } = await supabase.rpc("purge_import_raw_data", {
      p_batch_id: parsed.batchId,
    });
    if (error) throw new AppError("VALIDATION_ERROR");

    revalidatePath("/imports");
    revalidatePath(`/imports/${parsed.batchId}`);
    return { ok: true, data: { rows } };
  } catch (error) {
    return fail(error);
  }
}

// ---------------------------------------------------------------------------
// Adapter cho `useActionState` — TO-BE 1 / BR-M12-30.
//
// 🔴 Đây là nửa còn lại của lỗi CRITICAL 4.1. Bản cũ có **năm** adapter dạng
// `async (formData) => { await action(...) }` trả `Promise<void>`, tức mọi thông
// điệp đã soạn ở dưới đều rơi vào hư không. Các adapter dưới đây trả
// `ImportFeedback` để component đọc và hiện lên.
// ---------------------------------------------------------------------------

export async function uploadFormAction(
  _previous: ImportFeedback | null,
  formData: FormData,
): Promise<ImportFeedback> {
  const result = await createDryRunBatch(formData);
  // AC-14 — vào thẳng trang của lần nhập vừa tạo. `redirect()` phải nằm NGOÀI
  // `try` (nó báo hiệu bằng cách ném lỗi) và đích là **route khác**, nên không
  // dính quả mìn nợ #16 (`redirect()` về chính route đang đứng làm trắng trang).
  if (result.ok) redirect(`/imports/${result.data.batchId}`);
  return uploadFailureFeedback(result.message);
}

export async function commitFormAction(
  _previous: ImportFeedback | null,
  formData: FormData,
): Promise<ImportFeedback> {
  const result = await commitBatch(String(formData.get("batchId") ?? ""));
  return result.ok ? commitFeedback(result.data) : importFailureFeedback(result.message);
}

export async function cancelFormAction(
  _previous: ImportFeedback | null,
  formData: FormData,
): Promise<ImportFeedback> {
  const result = await cancelBatch(String(formData.get("batchId") ?? ""));
  return result.ok ? cancelFeedback(result.data.totalRows) : importFailureFeedback(result.message);
}

export async function purgeRawFormAction(
  _previous: ImportFeedback | null,
  formData: FormData,
): Promise<ImportFeedback> {
  const result = await purgeBatchRawData(String(formData.get("batchId") ?? ""));
  return result.ok ? purgeRawFeedback(result.data.rows) : importFailureFeedback(result.message);
}

/**
 * Một biểu mẫu mang cả trang dòng — M12-B / AC-21.
 *
 * `readRowEdits` nằm ở `batch-directory.ts` (file thuần) chứ không ở đây, nên
 * luật đọc tên trường kiểm được bằng unit test mà không phải dựng Server Action.
 */
export async function rowEditsFormAction(
  _previous: ImportFeedback | null,
  formData: FormData,
): Promise<ImportFeedback> {
  const confirmRowId = String(formData.get(CONFIRM_ROW_FIELD) ?? "");
  const bulkGender = String(formData.get(BULK_GENDER_FIELD) ?? "");
  const result = await saveRowEdits({
    batchId: String(formData.get("batchId") ?? ""),
    confirmRowId: confirmRowId === "" ? null : confirmRowId,
    bulkGender: bulkGender === "" ? null : bulkGender,
    entries: readRowEdits(formData),
  } as RowEditsInput);
  return result.ok ? rowEditsFeedback(result.data) : importFailureFeedback(result.message);
}
