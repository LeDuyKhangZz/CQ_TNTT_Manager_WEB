/**
 * M07-A · **TB-M07-01 bước 5 / TB-M07-03 bước 2 (phương án B)** — biểu mẫu nhập
 * điểm chỉ gửi lên **những ô đã thay đổi**.
 *
 * 🔴 **Đây là nguyên nhân gốc của lỗi nặng nhất module, chứ không phải một tối
 * ưu.** `03_AUDIT_RESULTS` F04 (50/75) truy ra bằng 5-Whys: bấm "Lưu điểm" một
 * lần là ghi **cả roster kể cả ô trống**, nên cột nào cũng lập tức có 50 dòng
 * `assessment_scores` — mà khoá ngoại là `on delete restrict`. Hệ quả: **một cột
 * tạo nhầm không bao giờ xóa được nữa**, kể cả khi mọi điểm đều rỗng, và câu lỗi
 * người dùng đọc được là *"Cột đã có điểm"* trong khi họ **chưa nhập điểm nào**.
 *
 * Ba việc được sửa cùng lúc, và đó là lý do bước này được `07_IMPLEMENTATION_IMPACT`
 * §7 xếp làm **điều kiện tiên quyết** cho ba hạng mục sau:
 *
 *   1. **Không sinh dòng rác** ⇒ cột chưa nhập điểm xóa được (mở đường cho
 *      TB-M07-01 ở đợt sau).
 *   2. **Ghi đè đồng thời gần như biến mất.** F06 (57/75): hai Giáo lý viên cùng
 *      mở một cột, người lưu sau ghi đè **toàn bộ** snapshot cũ nên điểm người
 *      trước thành `null` **không một lời cảnh báo**. Từ nay hai người sửa hai ô
 *      khác nhau **không còn đụng nhau** — phần còn lại (đúng **cùng một ô**)
 *      cần đổi chữ ký RPC nên để đợt sau.
 *   3. **Cột chuyên cần không còn bị khoá cả lớp.** RPC đặt
 *      `is_manual_override = true` cho **mọi** phần tử nhận được, nên một cú
 *      "Lưu điểm" biến cả 50 em thành "đang chỉnh tay" và cơ chế đề xuất tự động
 *      không bao giờ cập nhật được nữa (F07 = 62/75 bị vô hiệu bởi F06). Nay chỉ
 *      ô thật sự bị sửa mới mang cờ ấy.
 *
 * Hàm thuần, không import runtime — kiểm được bằng unit test, đúng bài học 5-Whys
 * của F18 (*"test viết theo hàm chứ không theo bề mặt tấn công"*).
 */

/** Giá trị đang lưu trong cơ sở dữ liệu của một ô — `undefined` khi chưa có dòng nào. */
export interface ScoreCellBaseline {
  score: number | null;
  note: string | null;
}

/** Một ô như biểu mẫu đang giữ. */
export interface ScoreCellDraft {
  enrollmentId: string;
  score: number | null;
  note: string | null;
}

/**
 * Đọc ô điểm từ `FormData`.
 *
 * `""` ⇒ `null` **có nghĩa**: ô rỗng là *"chưa có điểm"*, không phải điểm 0
 * (`AGENTS` §8). Chuỗi không phải số ra `NaN` và **cố ý để lọt xuống Zod** —
 * chặn ở đây thì lỗi biến mất trong im lặng, còn Zod thì có câu tiếng Việt.
 */
export function readScoreInput(value: FormDataEntryValue | null | undefined): number | null {
  const text = String(value ?? "").trim();
  return text === "" ? null : Number(text);
}

/** Ghi chú rỗng và ghi chú chưa từng nhập là **một** — cả hai đều `null`. */
export function readNoteInput(value: FormDataEntryValue | null | undefined): string | null {
  return String(value ?? "").trim() || null;
}

/**
 * Một ô có khác giá trị đang lưu không?
 *
 * 🔴 So bằng `Object.is` **sau khi** cả hai đã về `number | null`, không so chuỗi.
 * Cơ sở dữ liệu trả `numeric(4,2)` nên điểm 9 về tới đây có thể là `9`; ô nhập
 * hiển thị `"9"` và người dùng gõ lại `"9.0"` vẫn ra `9`. So chuỗi thì `"9.0"`
 * khác `"9"` ⇒ ô **không đổi gì** vẫn bị gửi lên, và với cột chuyên cần thì nó
 * bị đóng dấu "chỉnh tay" oan — đúng cái lỗi đang đi chữa.
 */
export function hasScoreCellChanged(
  draft: ScoreCellDraft,
  baseline: ScoreCellBaseline | undefined,
): boolean {
  const baseScore = baseline?.score ?? null;
  const baseNote = baseline?.note ?? null;
  return !Object.is(draft.score, baseScore) || draft.note !== baseNote;
}

/**
 * Lọc ra đúng những ô cần gửi lên máy chủ.
 *
 * Ô chưa từng có dòng **và** người dùng để trống ⇒ không gửi. Đó chính là chỗ
 * dòng rác của F04 được sinh ra suốt từ Phase 5.
 */
export function changedScoreCells(
  drafts: readonly ScoreCellDraft[],
  baselines: Readonly<Record<string, ScoreCellBaseline | undefined>>,
): ScoreCellDraft[] {
  return drafts.filter((draft) => hasScoreCellChanged(draft, baselines[draft.enrollmentId]));
}
