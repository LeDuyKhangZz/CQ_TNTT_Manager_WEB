"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, type ChangeEvent, type MouseEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormMessage } from "@/components/ui/form-message";
import { Select } from "@/components/ui/select";
import { formatDateVi } from "@/lib/dates";
import { studentStatusLabel } from "@/features/students/student-status";
import {
  BULK_GENDER_FIELD,
  CONFIRM_ROW_FIELD,
  ROW_ACTION_LABELS,
  ROW_FIELD_PREFIX,
} from "../batch-directory";
import { commitErrorText } from "../commit-errors";
import type { ImportFeedback } from "../import-feedback";
import { DUPLICATE_PENDING_FIELD, canMergeInto, type RowAction } from "../row-decision";
import type { BatchRow } from "../server/queries";
import { refreshBatchPage, rowEditsFormAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * Bảng duyệt dòng của một lần nhập — M12-B, **TO-BE 4 + TO-BE 7 / AC-21 · AC-25**.
 *
 * 🔴 Thay cho `BatchRowCard` của M12-A, và lý do đổi nằm ở con số của biên bản
 * audit: tiêu chí *"số bước hợp lý"* chấm **2/5** vì sổ SYLL thiếu giới tính ở
 * **83% dòng** mà mỗi dòng lại là **một biểu mẫu riêng** — chọn xong bấm Lưu,
 * chờ cả trang dựng lại, rồi mới tới em tiếp theo. Thẻ dòng cũ cao ~150px nên
 * một màn hình máy tính chỉ chứa 4–5 em; nay một hàng bảng gọn trong 48px và
 * **một** nút "Lưu tất cả thay đổi" gửi cả trang trong một lượt.
 *
 * **Một cây DOM, hai hình dạng** — **D-134**, chủ dự án chọn 2026-07-29 (`09`
 * §11: thẻ trên điện thoại, bảng trên máy tính). Không dựng hai bản rồi ẩn bớt
 * bằng CSS: hai bản nghĩa là **hai ô nhập cùng tên** cùng gửi lên, và khi chưa
 * có JavaScript thì bản đang ẩn vẫn gửi giá trị cũ của nó — máy chủ nhận hai câu
 * trả lời cho một câu hỏi. Nên mỗi dòng là một `<tbody>` riêng: dưới `md` nó là
 * một **thẻ** có viền, từ `md` trở lên nó trở lại đúng một nhóm hàng của bảng
 * thật. `DataTable` của Đợt 0-UI không dùng được ở đây vì nó là bảng **chỉ đọc**
 * với khung sườn cố định, không xếp lại được theo bề ngang.
 *
 * **Vẫn chạy khi chưa có JavaScript.** Ô chọn là `<select>` native (D-80), nút
 * "Lưu tất cả thay đổi" là nút gửi thật. Hai nút "Áp dụng Nam/Nữ" cũng là nút
 * **gửi** mang `name="bulkGender"`: có JS thì `preventDefault()` và điền tại chỗ,
 * chưa có JS thì máy chủ áp đúng những dòng đang được đánh dấu.
 */

const ROW_STATUS: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "outline" | "secondary" }
> = {
  valid: { label: "Hợp lệ", variant: "success" },
  warning: { label: "Cảnh báo", variant: "warning" },
  error: { label: "Lỗi", variant: "danger" },
  committed: { label: "Đã ghi", variant: "secondary" },
  skipped: { label: "Bỏ qua", variant: "outline" },
};

const GENDER_LABELS: Record<string, string> = {
  male: "Nam",
  female: "Nữ",
  other: "Khác",
};

interface RowDraft {
  gender: string;
  action: string;
  picked: boolean;
}

function initialDraft(rows: readonly BatchRow[]): Record<string, RowDraft> {
  const draft: Record<string, RowDraft> = {};
  for (const row of rows) {
    draft[row.id] = { gender: row.gender ?? "", action: row.action, picked: false };
  }
  return draft;
}

/** Dòng nào còn sửa được: đã ghi hoặc đã bỏ qua thì là chuyện đã rồi. */
function isEditable(row: BatchRow, batchCancelled: boolean): boolean {
  if (batchCancelled) return false;
  return row.status !== "committed" && row.status !== "skipped";
}

const CELL = "block px-0 py-1 md:table-cell md:px-3 md:py-2 md:align-middle";
/** Nhãn cột lặp lại trong từng thẻ — chỉ hiện ở dạng thẻ, vì bảng đã có `<thead>`. */
const MOBILE_LABEL = "mr-2 inline-block min-w-24 text-xs font-medium text-ink-muted md:hidden";

export function BatchRowEditor({
  batchId,
  rows,
  batchCancelled,
}: {
  batchId: string;
  rows: BatchRow[];
  /** Lần nhập đã huỷ thì mọi quyết định đều vô nghĩa — `commit` sẽ từ chối (D-131). */
  batchCancelled: boolean;
}) {
  const router = useRouter();
  const [feedback, formAction, pending] = useActionState<ImportFeedback | null, FormData>(
    rowEditsFormAction,
    null,
  );
  useGlobalPending(pending);
  const [optimisticResolvedIds, setOptimisticResolvedIds] = useState<Set<string>>(
    () => new Set(),
  );

  useEffect(() => {
    if (!feedback?.updatedRowIds?.length) return;
    setOptimisticResolvedIds((current) => {
      const next = new Set(current);
      for (const rowId of feedback.updatedRowIds ?? []) next.add(rowId);
      return next;
    });
  }, [feedback]);

  // Xin dữ liệu Server Component MỚI **sau khi** `useActionState` đã nhận và
  // công bố kết quả. Revalidate ngay trong response của action thì lượt dựng lại
  // bị nhét vào chính response ấy và giữ biểu mẫu ở trạng thái "đang chạy" vĩnh
  // viễn dù cơ sở dữ liệu đã ghi xong.
  //
  // 🔴 KHÔNG hẹn giờ trước khi gọi. Bản đầu chờ 250ms rồi mới bắt đầu, mà từ đó
  // còn **hai** lượt đi–về máy chủ nữa (`refreshBatchPage` rồi `router.refresh`).
  // Hiệu ứng này vốn đã chạy SAU lượt dựng mang phản hồi — đó chính là điều nó
  // được sinh ra để bảo đảm — nên 250ms kia không mua thêm gì, chỉ đẩy tổng thời
  // gian vượt quá cửa sổ chờ mặc định của bài E2E. Đo được: dải cảnh báo cấp
  // trang (`imports/[batchId]/page.tsx:102`, đếm trong CSDL) vẫn hiện số cũ.
  useEffect(() => {
    if (!feedback?.refreshPage) return;
    let cancelled = false;
    const refresh = () => {
      if (!cancelled) router.refresh();
    };
    void refreshBatchPage(batchId).then(refresh, refresh);
    return () => {
      cancelled = true;
    };
  }, [batchId, feedback, router]);

  // 🔴 Bản nháp phải **theo kịp máy chủ**. Sau mỗi lượt lưu, `revalidatePath` đưa
  // dòng mới xuống nhưng component không bị dựng lại, nên state cũ sẽ tiếp tục
  // hiện thứ người dùng vừa chọn — kể cả những dòng máy chủ **cố ý không lưu**
  // (dòng nghi trùng chắc chắn, D-133). Đó là một lời nói dối im lặng: màn hình
  // bảo "đã Ghép" trong khi cơ sở dữ liệu vẫn để "Tạo mới". Dấu vân tay dưới đây
  // đổi mỗi khi dữ liệu máy chủ đổi ⇒ nháp được đặt lại về đúng sự thật.
  const signature = rows.map((row) => `${row.id}:${row.gender ?? ""}:${row.action}`).join("|");
  const [snapshot, setSnapshot] = useState(signature);
  const [draft, setDraft] = useState<Record<string, RowDraft>>(() => initialDraft(rows));
  if (snapshot !== signature) {
    setSnapshot(signature);
    setDraft(initialDraft(rows));
  }

  const editableRows = rows.filter((row) => isEditable(row, batchCancelled));
  const pickedCount = editableRows.filter((row) => draft[row.id]?.picked).length;
  const allPicked = editableRows.length > 0 && pickedCount === editableRows.length;
  /**
   * Ô chọn-tất-cả ở trạng thái "một phần" — Đợt D (`17` §6).
   *
   * Trước đợt này ô ấy chỉ có hai mặt: đánh dấu 3/10 dòng thì nó vẽ **y hệt**
   * lúc chưa chọn dòng nào, nên nó nói sai. Nay chọn dở dang thì nó hiện dấu
   * gạch và trình đọc màn hình nghe `aria-checked="mixed"`.
   */
  const partiallyPicked = pickedCount > 0 && !allPicked;

  function updateDraft(rowId: string, patch: Partial<RowDraft>) {
    setDraft((previous) => ({
      ...previous,
      [rowId]: { ...(previous[rowId] ?? { gender: "", action: "create", picked: false }), ...patch },
    }));
  }

  function togglePickAll(event: ChangeEvent<HTMLInputElement>) {
    const picked = event.target.checked;
    setDraft((previous) => {
      const next = { ...previous };
      for (const row of editableRows) {
        next[row.id] = { ...next[row.id], picked };
      }
      return next;
    });
  }

  /**
   * "Áp dụng Nam/Nữ cho các dòng đang chọn" — TO-BE 4 bước 3.
   *
   * `docs/09` §2b cấm đoán giới tính, nên **không** có nút "Đoán theo tên đệm".
   * Nút này chỉ chép **lựa chọn của con người** xuống nhiều dòng cùng lúc, và
   * chỉ chép vào dòng chưa có giới tính — không đè lên giá trị đã đọc được từ
   * file.
   */
  function applyGender(value: string) {
    return (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setDraft((previous) => {
        const next = { ...previous };
        for (const row of editableRows) {
          if (next[row.id]?.picked) next[row.id] = { ...next[row.id], gender: value };
        }
        return next;
      });
    };
  }

  return (
    <form action={formAction} aria-label="Sửa dòng của lần nhập" className="space-y-3">
      <input type="hidden" name="batchId" value={batchId} />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm md:min-w-[52rem]">
          <caption className="sr-only">
            Danh sách dòng của lần nhập — chọn giới tính và cách xử lý cho từng dòng, rồi lưu một
            lượt.
          </caption>
          <thead className="hidden md:table-header-group">
            <tr className="border-b border-line bg-surface-muted text-left">
              <th scope="col" className="px-3 py-2">
                <span className="sr-only">Chọn dòng</span>
                <Checkbox
                  aria-label="Chọn tất cả dòng của trang này"
                  checked={allPicked}
                  indeterminate={partiallyPicked}
                  onChange={togglePickAll}
                  disabled={editableRows.length === 0}
                />
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Dòng
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Họ tên
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Trạng thái
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Giới tính
              </th>
              <th scope="col" className="px-3 py-2 font-semibold">
                Xử lý
              </th>
            </tr>
          </thead>

          {rows.map((row) => {
            const rowWarnings = optimisticResolvedIds.has(row.id)
              ? row.warnings.filter((issue) => issue.field !== DUPLICATE_PENDING_FIELD)
              : row.warnings;
            const status = ROW_STATUS[row.status] ?? {
              label: row.status,
              variant: "outline" as const,
            };
            const editable = isEditable(row, batchCancelled);
            const undecidedDuplicate = rowWarnings.some(
              (issue) => issue.field === DUPLICATE_PENDING_FIELD,
            );
            const commitMessage = commitErrorText(row.commitError);
            const matched = row.matchedStudent;
            const hasDetail =
              row.errors.length > 0 ||
              rowWarnings.length > 0 ||
              matched !== null ||
              commitMessage !== null;
            const values = draft[row.id] ?? {
              gender: row.gender ?? "",
              action: row.action,
              picked: false,
            };

            return (
              <tbody
                key={row.id}
                className="mb-3 block rounded-lg border border-line-strong p-3 md:mb-0 md:table-row-group md:rounded-none md:border-0 md:p-0"
              >
                <tr className="block md:table-row md:border-b md:border-line">
                  <td className={CELL}>
                    {editable ? (
                      <Checkbox
                        name={`${ROW_FIELD_PREFIX.pick}${row.id}`}
                        checked={values.picked}
                        onChange={(event) => updateDraft(row.id, { picked: event.target.checked })}
                      >
                        <span className="text-xs text-ink-muted md:sr-only">
                          Chọn dòng {row.rowNumber}
                        </span>
                      </Checkbox>
                    ) : null}
                  </td>

                  <td className={CELL} data-numeric="">
                    <span className={MOBILE_LABEL}>Dòng</span>
                    <span className="font-medium text-ink-muted">#{row.rowNumber}</span>
                  </td>

                  <td className={CELL}>
                    <span className={MOBILE_LABEL}>Họ tên</span>
                    <span className="font-medium">{row.fullName || "(chưa có tên)"}</span>
                    {row.className ? (
                      <span className="block text-xs text-ink-muted md:mt-0.5">
                        Lớp: {row.className}
                      </span>
                    ) : null}
                  </td>

                  <td className={CELL}>
                    <span className={MOBILE_LABEL}>Trạng thái</span>
                    <span className="inline-flex flex-wrap items-center gap-1">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {undecidedDuplicate ? (
                        <Badge variant="warning">Chờ xác nhận trùng</Badge>
                      ) : null}
                    </span>
                  </td>

                  <td className={CELL}>
                    <span className={MOBILE_LABEL}>Giới tính</span>
                    {editable && !row.gender ? (
                      <Select
                        name={`${ROW_FIELD_PREFIX.gender}${row.id}`}
                        aria-label={`Giới tính của dòng ${row.rowNumber}`}
                        className="md:w-32"
                        value={values.gender}
                        onChange={(event) => updateDraft(row.id, { gender: event.target.value })}
                      >
                        <option value="">— Chọn —</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                      </Select>
                    ) : (
                      <span>{row.gender ? (GENDER_LABELS[row.gender] ?? row.gender) : "—"}</span>
                    )}
                  </td>

                  <td className={CELL}>
                    <span className={MOBILE_LABEL}>Xử lý</span>
                    {editable && row.status !== "error" ? (
                      <Select
                        name={`${ROW_FIELD_PREFIX.action}${row.id}`}
                        aria-label={`Cách xử lý dòng ${row.rowNumber}`}
                        className="md:w-44"
                        value={values.action}
                        onChange={(event) => updateDraft(row.id, { action: event.target.value })}
                      >
                        <option value="create">Tạo mới</option>
                        <option value="merge" disabled={!row.matchedStudentId}>
                          Ghép hồ sơ có sẵn
                        </option>
                        <option value="skip">Bỏ qua</option>
                      </Select>
                    ) : (
                      <span>{ROW_ACTION_LABELS[row.action as RowAction] ?? row.action}</span>
                    )}
                  </td>
                </tr>

                {hasDetail ? (
                  <tr className="block md:table-row">
                    <td className="block pt-2 md:table-cell md:px-3 md:pb-3" colSpan={6}>
                      {/*
                        `<details>` native: mở/đóng được **không cần JavaScript**,
                        và trình đọc màn hình đã hiểu sẵn trạng thái mở của nó
                        (cùng lý lẽ D-82 của `Dropdown`). Dòng nào có vấn đề mới
                        có khối này, nên nó không thành nhiễu cho 900 dòng sạch.
                      */}
                      <details className="rounded-md border border-line bg-surface-muted">
                        <summary className="flex min-h-11 cursor-pointer items-center px-3 text-sm font-medium">
                          {undecidedDuplicate
                            ? `Dòng #${row.rowNumber} — đối chiếu hồ sơ nghi trùng`
                            : `Dòng #${row.rowNumber} — chi tiết`}
                        </summary>

                        <div className="space-y-2 px-3 pb-3">
                          {row.errors.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5 text-sm text-danger">
                              {row.errors.map((issue, index) => (
                                <li key={`${issue.field}-${index}`}>{issue.message}</li>
                              ))}
                            </ul>
                          ) : null}

                          {rowWarnings.length > 0 ? (
                            <ul className="list-disc space-y-1 pl-5 text-sm text-ink-muted">
                              {rowWarnings.map((issue, index) => (
                                <li key={`${issue.field}-${index}`}>{issue.message}</li>
                              ))}
                            </ul>
                          ) : null}

                          {matched ? (
                            <div className="rounded-md border border-line-strong bg-surface p-3 text-sm">
                              <p className="font-medium">Hồ sơ đã có trong hệ thống</p>
                              <p className="text-ink-muted">
                                {matched.studentCode} · {matched.fullName} · sinh{" "}
                                {formatDateVi(matched.dateOfBirth)}
                                {matched.guardianPhone
                                  ? ` · SĐT phụ huynh ${matched.guardianPhone}`
                                  : ""}
                              </p>
                              <p className="text-ink-muted">
                                Trạng thái hồ sơ: <strong>{studentStatusLabel(matched.status)}</strong>
                                {canMergeInto(matched.status)
                                  ? ""
                                  : " — phải khôi phục hồ sơ trước khi ghép được."}
                              </p>
                              <Link
                                href={`/students/${matched.id}`}
                                className="mt-1 inline-flex min-h-11 items-center text-sm font-medium text-theme-accent-text underline underline-offset-4"
                              >
                                Mở hồ sơ {matched.studentCode} để đối chiếu
                              </Link>
                            </div>
                          ) : null}

                          {commitMessage ? (
                            <p className="text-sm text-danger">Lỗi khi ghi: {commitMessage}</p>
                          ) : null}

                          {/*
                            🔴 D-133 — nút của RIÊNG dòng này. "Lưu tất cả thay
                            đổi" cố ý KHÔNG lưu cách xử lý của dòng nghi trùng
                            chắc chắn: một cú bấm xác nhận hai chục dòng trùng là
                            đúng thứ D-133 sinh ra để chặn. Nhãn khác nhãn nút
                            lưu chung, vì hai nút cùng tên trong một trang là hai
                            thứ trình đọc màn hình đọc lên giống hệt nhau.
                          */}
                          {editable && undecidedDuplicate ? (
                            <Button
                              type="submit"
                              size="sm"
                              variant="outline"
                              name={CONFIRM_ROW_FIELD}
                              value={row.id}
                              disabled={pending}
                            >
                              Xác nhận dòng #{row.rowNumber}
                            </Button>
                          ) : null}
                        </div>
                      </details>
                    </td>
                  </tr>
                ) : null}
              </tbody>
            );
          })}
        </table>
      </div>

      {editableRows.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-3">
          <p className="basis-full text-sm text-ink-muted sm:basis-auto">
            {pickedCount === 0
              ? "Đánh dấu vài dòng rồi áp dụng giới tính cho cả nhóm."
              : `${pickedCount} dòng đang chọn.`}
          </p>
          {/*
            🔴 KHÔNG vô hiệu hoá khi chưa chọn dòng nào. Hai nút này là nút **gửi**
            thật, tức đường dự phòng khi JavaScript chưa chạy; mà lúc chưa hydrate
            thì `pickedCount` luôn bằng 0 ⇒ vô hiệu hoá theo nó là khoá chết đúng
            cái đường dự phòng vừa dựng. Câu hướng dẫn ngay bên trái đã nói phải
            đánh dấu dòng trước.
          */}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            name={BULK_GENDER_FIELD}
            value="male"
            onClick={applyGender("male")}
            disabled={pending}
          >
            Áp dụng Nam cho dòng đang chọn
          </Button>
          <Button
            type="submit"
            variant="outline"
            size="sm"
            name={BULK_GENDER_FIELD}
            value="female"
            onClick={applyGender("female")}
            disabled={pending}
          >
            Áp dụng Nữ cho dòng đang chọn
          </Button>
          <Button type="submit" disabled={pending} className="ms-auto">
            {pending ? "Đang lưu…" : "Lưu tất cả thay đổi"}
          </Button>
        </div>
      ) : null}

      {feedback ? (
        <div className="space-y-2">
          <FormMessage tone={feedback.tone}>{feedback.text}</FormMessage>
          {feedback.failures && feedback.failures.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
              {feedback.failures.map((failure) => (
                <li key={failure.rowNumber}>
                  <strong>#{failure.rowNumber}</strong> — {failure.message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
