"use client";

import {
  useCallback,
  useId,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Panel } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateField } from "@/components/ui/date-field";
import { Dialog } from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateVi } from "@/lib/dates";
import {
  TEACHING_ITEM_TYPE_LABELS,
  TEACHING_MATERIAL_ACCEPT_ATTR,
  type TeachingItemType,
} from "../constants";
import {
  checkTeachingMaterialFile,
  TEACHING_MATERIAL_HINT,
  TEACHING_MATERIAL_MAX_MB,
  TEACHING_MATERIAL_SUMMARY,
} from "../material-limits";
import { isIsoDate, partitionTeachingStaff } from "../staff-availability";
import {
  createTeachingMaterialUrl,
  createTeachingPlanItem,
  deleteTeachingPlanItem,
  ensureTeachingPlan,
  removeTeachingMaterial,
  updateTeachingPlanItem,
  updateTeachingPlanTitle,
  uploadTeachingMaterial,
} from "../server/actions";
import type { TeachingPlanDetail, TeachingPlanItem, TeachingPlanStaffOption } from "../server/queries";
import { useGlobalPending } from "@/components/loading/loading-provider";

type Message = { tone: "success" | "error"; text: string } | null;

/** Ngưỡng hiện bộ đếm ký tự. Xem `PlanTextArea`. */
const COUNTER_THRESHOLD = 200;

/**
 * M06-C · hạng mục #8 — 12 trường chia **ba nhóm**.
 *
 * Nhóm 1 ("Thông tin bắt buộc") **không gập được**, và đó là ràng buộc kỹ thuật
 * chứ không phải sở thích: cả ba ô `required` nằm trong nhóm ấy, mà trình duyệt
 * từ chối lượt gửi kèm một ô `required` **đang bị ẩn** bằng lỗi
 * *"An invalid form control is not focusable"* — người dùng bấm Lưu và **không
 * có gì xảy ra**, không một câu nào giải thích.
 */
type ContentFieldName =
  | "objectives"
  | "catechismContent"
  | "scriptureContent"
  | "game"
  | "song"
  | "homework"
  | "preparation"
  | "note";

type ContentField = {
  name: ContentFieldName;
  label: string;
  maxLength: number;
  /** Dòng nói ai đọc được ô này. Chỉ đặt ở hai ô có ranh giới riêng tư thật. */
  privacy?: string;
};

const CONTENT_FIELDS: readonly ContentField[] = [
  { name: "objectives", label: "Mục tiêu", maxLength: 4000 },
  { name: "catechismContent", label: "Nội dung giáo lý", maxLength: 8000 },
  { name: "scriptureContent", label: "Lời Chúa", maxLength: 4000 },
  { name: "game", label: "Trò chơi", maxLength: 2000 },
  { name: "song", label: "Bài hát", maxLength: 1000 },
  { name: "homework", label: "Bài tập về nhà", maxLength: 2000 },
  {
    name: "preparation",
    label: "Chuẩn bị",
    maxLength: 2000,
    // 🔴 Ô DUY NHẤT của nhóm này đi ra ngoài: `getWeekAheadTeaching` trả về
    // `preparation` cho cổng phụ huynh (thẻ "7 ngày sắp tới"). Không nói ra thì
    // người soạn không có cách nào biết mình đang viết cho ai.
    privacy: "Phụ huynh và thiếu nhi đọc được ô này ở thẻ “7 ngày sắp tới”.",
  },
];

const NOTE_FIELD: ContentField = {
  name: "note",
  label: "Ghi chú nội bộ",
  maxLength: 2000,
  privacy: "Chỉ nhân sự đọc được giáo án mới thấy ô này. Không ra cổng phụ huynh.",
};

function formText(data: FormData, name: string): string | null {
  const value = String(data.get(name) ?? "").trim();
  return value || null;
}

function weekNumber(date: string, yearStart: string): number {
  const start = Date.parse(`${yearStart}T00:00:00Z`);
  const current = Date.parse(`${date}T00:00:00Z`);
  return Math.floor((current - start) / 604_800_000) + 1;
}

/** "đã điền 4/7" · "chưa điền" · với nhóm một ô thì bỏ luôn phân số. */
function filledSummary(filled: number, total: number): string {
  if (filled === 0) return "chưa điền";
  return total === 1 ? "đã điền" : `đã điền ${filled}/${total}`;
}

/**
 * Nhóm gập được.
 *
 * Dựng trên `<details>`/`<summary>` native — cùng lý lẽ D-82 của `Dropdown` và
 * của khối chi tiết ở `batch-row-editor`: mở/đóng được **không cần JavaScript**,
 * và trình đọc màn hình đã hiểu sẵn trạng thái mở.
 *
 * 🔴 Dòng đếm ở `<summary>` là điều kiện để được phép gập: gập một nhóm **đang
 * có nội dung** mà không nói ra là giấu mất chính thứ người sửa cần soát. Số ấy
 * đếm theo **thứ đang gõ dở**, không đếm theo dữ liệu đã lưu.
 */
function CollapsibleGroup({
  title,
  filled,
  total,
  children,
}: {
  title: string;
  filled: number;
  total: number;
  children: ReactNode;
}) {
  return (
    <Panel as="details" variant="muted" padding="none">
      <summary className="flex min-h-control cursor-pointer flex-wrap items-center gap-x-2 px-3 py-2 text-sm font-medium">
        <span>{title}</span>
        <span className="font-normal text-ink-muted">· {filledSummary(filled, total)}</span>
      </summary>
      <div className="space-y-4 px-3 pb-3">{children}</div>
    </Panel>
  );
}

/**
 * Ô nhập nhiều dòng của giáo án.
 *
 * 🔴 Bộ đếm chỉ hiện khi **sắp chạm trần**. `maxLength` cắt input trong im lặng
 * tuyệt đối — người soạn dán một bài giáo lý dài và mất phần đuôi mà màn hình
 * không nhúc nhích. Hiện bộ đếm suốt thì 12 ô mang 12 con số nhiễu; hiện lúc
 * còn 200 ký tự thì nó xuất hiện đúng lúc có ích.
 */
function PlanTextArea({
  field,
  defaultValue,
  onFilledChange,
}: {
  field: ContentField;
  defaultValue?: string | null;
  onFilledChange: (name: ContentFieldName, filled: boolean) => void;
}) {
  const fieldId = useId();
  const privacyId = `${fieldId}-privacy`;
  const counterId = `${fieldId}-counter`;
  const [length, setLength] = useState(defaultValue?.length ?? 0);
  const remaining = field.maxLength - length;
  const nearLimit = remaining <= COUNTER_THRESHOLD;
  const describedBy = [field.privacy ? privacyId : null, nearLimit ? counterId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{field.label}</Label>
      <Textarea
        id={fieldId}
        name={field.name}
        defaultValue={defaultValue ?? ""}
        maxLength={field.maxLength}
        aria-describedby={describedBy || undefined}
        onChange={(event) => {
          setLength(event.target.value.length);
          onFilledChange(field.name, event.target.value.trim().length > 0);
        }}
      />
      {field.privacy ? (
        <p id={privacyId} className="text-2xs text-ink-muted">
          {field.privacy}
        </p>
      ) : null}
      {/*
        🔴 Con số đếm ngược là một `<p>` thường, **cố ý không phải vùng thông báo
        sống**: nó đổi theo **từng phím gõ**, nên đặt `role="status"` ở đây là
        bắt trình đọc màn hình đọc lại một con số sau mỗi ký tự — nhiễu đúng lúc
        người dùng đang cần tập trung gõ. Nó gắn với ô nhập bằng
        `aria-describedby`, tức đọc được khi con trỏ vào ô.

        Lúc **đã chạm trần** thì ngược lại: đó là một trạng thái xảy ra **một
        lần** và từ đó mọi phím gõ bị nuốt trong im lặng. Câu ấy dùng
        `FormMessage tone="danger"` (`role="alert"`) để nói ngay — và vì nội dung
        không đổi nữa nên nó không lặp lại.
      */}
      {nearLimit ? (
        remaining === 0 ? (
          <FormMessage id={counterId} tone="danger">
            Đã chạm trần {field.maxLength} ký tự — phần gõ thêm sẽ không được nhận.
          </FormMessage>
        ) : (
          <p id={counterId} className="text-2xs text-ink-muted">
            Còn {remaining} ký tự.
          </p>
        )
      ) : null}
    </div>
  );
}

function ItemFields({
  item,
  staff,
  yearStart,
  yearEnd,
}: {
  item?: TeachingPlanItem;
  staff: readonly TeachingPlanStaffOption[];
  yearStart: string;
  yearEnd: string;
}) {
  const fieldId = useId();
  const [itemType, setItemType] = useState<TeachingItemType>(item?.itemType ?? "lesson");
  // TB-M06-03 — ngày dự kiến phải là **state**, vì danh sách người dạy phụ
  // thuộc vào nó. Trước đợt này nó chỉ là `defaultValue`, nên ô người dạy không
  // có cách nào biết người dùng vừa đổi ngày.
  const [plannedDate, setPlannedDate] = useState(item?.plannedDate ?? yearStart);
  const [teacherStaffId, setTeacherStaffId] = useState(item?.teacherStaffId ?? "");
  const [filled, setFilled] = useState<Record<ContentFieldName, boolean>>(() => {
    const initial = {} as Record<ContentFieldName, boolean>;
    for (const field of [...CONTENT_FIELDS, NOTE_FIELD]) {
      initial[field.name] = Boolean(item?.[field.name]?.trim());
    }
    return initial;
  });
  const markFilled = useCallback((name: ContentFieldName, value: boolean) => {
    setFilled((previous) => (previous[name] === value ? previous : { ...previous, [name]: value }));
  }, []);

  const { available, keptSelected } = useMemo(
    () => partitionTeachingStaff(staff, plannedDate, teacherStaffId || null),
    [staff, plannedDate, teacherStaffId],
  );
  const teacherHintId = `${fieldId}-teacher-hint`;
  // Ngày gõ dở là chuỗi rỗng ⇒ `formatDateVi` sẽ in "Invalid Date".
  const dateLabel = isIsoDate(plannedDate) ? `ngày ${formatDateVi(plannedDate)}` : "ngày đang chọn";
  const noStaffOnDate = available.length === 0;
  const contentFilled = CONTENT_FIELDS.filter((field) => filled[field.name]).length;

  return (
    <div className="space-y-4">
      <Panel as="fieldset" padding="none" className="px-3 pb-3">
        <legend className="px-1 text-sm font-medium">Thông tin bắt buộc</legend>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-type`}>Loại mục</Label>
            <Select
              id={`${fieldId}-type`}
              name="itemType"
              value={itemType}
              onChange={(event) => setItemType(event.target.value as TeachingItemType)}
            >
              <option value="lesson">Bài học</option>
              <option value="assessment">Kiểm tra</option>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-date`}>Ngày dự kiến</Label>
            <DateField
              id={`${fieldId}-date`}
              name="plannedDate"
              min={yearStart}
              max={yearEnd}
              value={plannedDate}
              onChange={(event) => setPlannedDate(event.target.value)}
              required
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${fieldId}-title`}>Tên bài / tên bài kiểm tra</Label>
            <Input id={`${fieldId}-title`} name="title" defaultValue={item?.title ?? ""} maxLength={200} required />
          </div>
          {/*
            🔴 Trường này dùng `<Label htmlFor>` chứ KHÔNG bọc trong `<label>` —
            và đó là bắt buộc, không phải sở thích: dòng cảnh báo bên dưới là một
            `<p>` (không hợp lệ bên trong `<label>`, vốn chỉ nhận nội dung
            phrasing) và **chứa một liên kết**. Nội dung tương tác nằm trong
            `<label>` thì một cú bấm vào liên kết cũng kích hoạt luôn ô chọn —
            người dùng bấm "Nhân sự" và thấy danh sách người dạy bung ra.
          */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`${fieldId}-teacher`}>Người dạy</Label>
            <Select
              id={`${fieldId}-teacher`}
              name="teacherStaffId"
              value={teacherStaffId}
              onChange={(event) => setTeacherStaffId(event.target.value)}
              required={itemType === "lesson"}
              aria-describedby={keptSelected || noStaffOnDate ? teacherHintId : undefined}
            >
              <option value="">{itemType === "assessment" ? "Chưa phân công" : "Chọn người dạy"}</option>
              {available.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}
              {/*
                🔴 Người đang được chọn mà **không** phụ trách lớp vào ngày ấy vẫn
                phải nằm trong danh sách. Bỏ đi thì `<select>` âm thầm nhảy về lựa
                chọn đầu tiên: chỉ đổi mỗi NGÀY của một mục cũ cũng đủ để người dạy
                bị thay bằng một cái tên chưa ai bấm vào. Xem `staff-availability.ts`.
              */}
              {keptSelected ? (
                <option key={keptSelected.id} value={keptSelected.id}>
                  {keptSelected.label} — không phụ trách lớp vào ngày này
                </option>
              ) : null}
            </Select>
            {keptSelected ? (
              <FormMessage id={teacherHintId} tone="danger">
                {keptSelected.label} không thuộc đội ngũ lớp vào {dateLabel}. Hãy chọn
                người khác, nếu không lượt lưu sẽ bị từ chối.
              </FormMessage>
            ) : noStaffOnDate ? (
              <FormMessage id={teacherHintId} tone="info">
                Chưa có nhân sự phụ trách lớp vào {dateLabel}. Hãy cập nhật đội ngũ lớp
                ở trang <Link href="/staff" className="underline">Nhân sự</Link> trước.
              </FormMessage>
            ) : null}
          </div>
        </div>
      </Panel>

      <CollapsibleGroup title="Nội dung buổi học" filled={contentFilled} total={CONTENT_FIELDS.length}>
        <div className="grid gap-4 pt-2 md:grid-cols-2">
          {CONTENT_FIELDS.map((field) => (
            <PlanTextArea
              key={field.name}
              field={field}
              defaultValue={item?.[field.name]}
              onFilledChange={markFilled}
            />
          ))}
        </div>
      </CollapsibleGroup>

      <CollapsibleGroup title="Ghi chú nội bộ" filled={filled.note ? 1 : 0} total={1}>
        <div className="pt-2">
          <PlanTextArea field={NOTE_FIELD} defaultValue={item?.note} onFilledChange={markFilled} />
        </div>
      </CollapsibleGroup>
    </div>
  );
}

function payloadFromForm(data: FormData, teachingPlanId: string) {
  return {
    teachingPlanId,
    plannedDate: String(data.get("plannedDate") ?? ""),
    title: String(data.get("title") ?? ""),
    objectives: formText(data, "objectives"),
    catechismContent: formText(data, "catechismContent"),
    scriptureContent: formText(data, "scriptureContent"),
    game: formText(data, "game"),
    song: formText(data, "song"),
    homework: formText(data, "homework"),
    preparation: formText(data, "preparation"),
    teacherStaffId: formText(data, "teacherStaffId"),
    itemType: String(data.get("itemType") ?? "lesson") as TeachingItemType,
    note: formText(data, "note"),
  };
}

function ItemForm({
  detail,
  item,
  onCancel,
  onSaved,
  onReload,
}: {
  detail: TeachingPlanDetail;
  item?: TeachingPlanItem;
  /** Đóng biểu mẫu mà không lưu gì. */
  onCancel: () => void;
  /**
   * Lưu xong. Có mặt ⇒ **chỗ gọi** lo phần đóng biểu mẫu và giữ lại câu thông
   * báo; vắng ⇒ biểu mẫu tự giữ câu ấy và dọn mình để soạn mục tiếp theo.
   *
   * 🔴 Đây là chỗ vá một lỗ D-61 có thật của bản cũ: lượt sửa thành công đặt
   * `message` rồi gọi luôn `onDone()`, mà `onDone` gỡ chính component đang giữ
   * `message` — nên **sửa một mục xong không có một chữ xác nhận nào**. Cùng
   * hình dạng với lỗi M05-B: thứ vừa xác nhận bị chính lượt đóng nó xoá mất.
   */
  onSaved?: (text: string) => void;
  /**
   * D-146 — lấy lại bản mới nhất của mục này.
   *
   * 🔴 Việc làm mới **phải do `ItemCard` chạy, không phải biểu mẫu này**, và đó
   * là một lỗi đo được chứ không phải sở thích kiến trúc: đóng biểu mẫu là gỡ
   * chính component đang gọi `router.refresh()` khỏi cây, nên lượt làm mới
   * không bao giờ tới nơi — E2E bắt được bằng cách thẻ mục vẫn in **tên cũ**
   * sau khi bấm. `ItemCard` thì còn sống suốt, nên lượt làm mới của nó chạy tới
   * cùng.
   */
  onReload?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);
  /**
   * 🔴 Từ M06-A, ngày dự kiến và người dạy là **state có kiểm soát** (TB-M06-03
   * cần đọc ngày để lọc danh sách người dạy). `form.reset()` chỉ khôi phục được
   * `defaultValue`, nên nó **không** đụng tới hai ô ấy nữa: thêm xong một mục
   * thì ngày vẫn nằm nguyên chỗ cũ và lần thêm tiếp theo chắc chắn đụng
   * *"Ngày này đã có một mục giáo án."* Đổi `key` để dựng lại cả khối trường —
   * một chỗ duy nhất đặt lại mọi giá trị mặc định, không phải một danh sách
   * `setState` mà lần thêm trường sau rất dễ quên cập nhật.
   */
  const [resetKey, setResetKey] = useState(0);
  /**
   * D-146 — chỉ hiện nút *"Tải lại mục này"* khi lượt lưu hỏng **vì bản đang giữ
   * đã cũ** (cờ `stale`, không phải mã `CONFLICT` — mã ấy còn dùng cho lỗi trùng
   * ngày, mà tải lại bao nhiêu lần cũng vẫn trùng).
   */
  const [stale, setStale] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.planId) return;
    setMessage(null);
    setStale(false);
    const form = event.currentTarget;
    const payload = payloadFromForm(new FormData(form), detail.planId);
    startTransition(async () => {
      const result = item
        ? await updateTeachingPlanItem({
            ...payload,
            itemId: item.id,
            // Nguyên văn chuỗi máy chủ trả về — không qua `Date`, xem `schemas.ts`.
            expectedUpdatedAt: item.updatedAt,
          })
        : await createTeachingPlanItem(payload);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        setStale(result.stale === true);
        return;
      }
      const text = item ? "Đã cập nhật mục giáo án." : "Đã thêm mục giáo án.";
      if (onSaved) {
        onSaved(text);
      } else {
        setMessage({ tone: "success", text });
        form.reset();
        setResetKey((value) => value + 1);
      }
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ItemFields key={resetKey} item={item} staff={detail.staff} yearStart={detail.yearStart} yearEnd={detail.yearEnd} />
      {message ? <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" onClick={onCancel} disabled={pending}>{item ? "Huỷ" : "Đóng"}</Button>
        {stale && onReload ? (
          <Button type="button" variant="outline" disabled={pending} onClick={onReload}>
            Tải lại mục này
          </Button>
        ) : null}
        <Button type="submit" pending={pending}>{item ? "Lưu thay đổi" : "Thêm vào giáo án"}</Button>
      </div>
    </form>
  );
}

function DetailLine({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value}</dd></div>;
}

function ItemCard({ detail, item }: { detail: TeachingPlanDetail; item: TeachingPlanItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  /** Hộp xác nhận nào đang mở. Hai thao tác phá huỷ, không bao giờ cùng lúc. */
  const [confirming, setConfirming] = useState<"item" | "material" | null>(null);
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);
  const fileInputId = useId();
  /**
   * 🔴 Lỗi do M06-A sinh ra, bắt được nhờ E2E: `FileUpload` giữ tên tệp đã chọn
   * trong **state của riêng nó**, mà `form.reset()` chỉ dọn giá trị của các ô
   * nhập — không đụng tới state React. Nên lưu xong, dòng *"Đã chọn:
   * giao-an.pdf"* **vẫn nằm đó** bên cạnh câu "Đã lưu tài liệu…", như thể còn
   * một tệp đang chờ lưu lần nữa. Dựng lại component bằng `key` là một chỗ duy
   * nhất đặt lại mọi thứ, cùng khuôn với `resetKey` của biểu mẫu mục.
   */
  const [uploadKey, setUploadKey] = useState(0);

  /**
   * D-146 — đóng biểu mẫu rồi lấy lại bản mới nhất từ máy chủ.
   *
   * `ItemCard` còn sống suốt lượt này, nên `router.refresh()` chạy tới cùng —
   * xem ghi chú ở prop `onReload` của `ItemForm` về lượt làm mới bị mất.
   *
   * 🔴 Cố ý **không** gắn `key` của khối trường vào `updatedAt` để tự dựng lại
   * mỗi khi phiên bản đổi: `router.refresh()` chạy sau **mọi** thao tác thành
   * công trên trang — kể cả tải tài liệu ở chính thẻ này, hay đổi tên giáo án ở
   * đầu trang — nên dựng lại theo phiên bản sẽ xoá phần người dùng đang gõ dở ở
   * một mục khác, đúng loại mất dữ liệu mà TB-M06-01 sinh ra để chặn.
   */
  function reloadItem() {
    setMessage(null);
    setEditing(false);
    startTransition(() => {
      router.refresh();
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteTeachingPlanItem(item.id);
      setConfirming(null);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      router.refresh();
    });
  }

  function uploadMaterial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("itemId", item.id);

    /**
     * Hạng mục #10 / **BR-M06-16** — chặn ở trình duyệt **trước khi** gửi.
     *
     * 🔴 Không phải để tiết kiệm băng thông. `next.config.mjs` đặt
     * `bodySizeLimit: "4.5mb"` (trần nền tảng, D-137), nên tệp vượt trần **không
     * bao giờ** tới được mã máy chủ: nó chết ở tầng hạ tầng bằng một trang lỗi
     * tiếng Anh, và câu tiếng Việt viết trong Server Action không có cơ hội
     * chạy. Đây là chỗ duy nhất câu ấy nói được cho đúng khoảng dung lượng đó.
     * Máy chủ vẫn gọi lại đúng hàm này — xem `material-limits.ts`.
     */
    // Đọc tệp từ **chính ô nhập**, không từ `FormData`. Ở trình duyệt thật hai
    // đường cho cùng một `File`; nhưng `FormData` là bản sao do trình duyệt
    // dựng, còn `input.files` là thứ người dùng vừa chọn — kiểm trên nguồn gốc
    // thì không phụ thuộc vào cách môi trường sao chép. (Đo được: trong jsdom
    // `new FormData(form).get("file")` trả về một `File` **size 0, mất cả tên
    // lẫn kiểu MIME**, nên kiểm trên nó là kiểm một thứ không tồn tại.)
    const input = form.elements.namedItem("file");
    const file = input instanceof HTMLInputElement ? (input.files?.[0] ?? null) : null;
    const rejected = file ? checkTeachingMaterialFile(file) : "Chưa chọn tệp nào.";
    if (rejected) {
      setMessage({ tone: "error", text: rejected });
      return;
    }

    startTransition(async () => {
      const result = await uploadTeachingMaterial(data);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setMessage({ tone: "success", text: "Đã lưu tài liệu vào kho riêng tư." });
      form.reset();
      setUploadKey((value) => value + 1);
      router.refresh();
    });
  }

  function downloadMaterial() {
    setMessage(null);
    startTransition(async () => {
      const result = await createTeachingMaterialUrl(item.id);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      window.location.assign(result.data.url);
    });
  }

  function removeMaterial() {
    setMessage(null);
    startTransition(async () => {
      const result = await removeTeachingMaterial(item.id);
      setConfirming(null);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setMessage({ tone: "success", text: "Đã gỡ tài liệu khỏi mục giáo án." });
      router.refresh();
    });
  }

  const itemTypeLabel = TEACHING_ITEM_TYPE_LABELS[item.itemType];

  return (
    <Card data-teaching-plan-item={item.id}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={item.itemType === "assessment" ? "warning" : "secondary"}>{itemTypeLabel}</Badge>
              <span className="text-sm text-ink-muted">Tuần {weekNumber(item.plannedDate, detail.yearStart)} · {formatDateVi(item.plannedDate)}</span>
            </div>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>Người dạy: {item.teacherName}</CardDescription>
          </div>
          {detail.canManage ? (
            <div className="flex gap-2">
              {/*
                Nhãn nút **không** còn đổi thành "Đóng" khi biểu mẫu mở: từ M06-C
                biểu mẫu nằm trong hộp thoại, nên nút đóng duy nhất là nút của
                hộp thoại. Bản cũ có hai nút cùng chức năng ở hai chỗ khác nhau
                (`06_UI_UX_RECOMMENDATIONS` §3).
              */}
              <Button size="sm" variant="outline" onClick={() => setEditing(true)}>Sửa</Button>
              <Button size="sm" variant="danger" disabled={pending} onClick={() => setConfirming("item")}>Xóa</Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/*
          🔴 Hạng mục #1 / **UI-02** — `tone` bị bỏ quên nên `FormMessage` rơi về
          mặc định `danger`: câu *"Đã lưu tài liệu vào kho riêng tư."* hiện **màu
          đỏ, kèm tam giác cảnh báo, và `role="alert"`** — trình đọc màn hình đọc
          "Lỗi:" trước một thông báo thành công. Thành công và thất bại trông y
          hệt nhau ở đúng chỗ người dùng cần phân biệt nhất.
        */}
        {message ? (
          <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage>
        ) : null}
        <dl className="grid gap-4 md:grid-cols-2">
          <DetailLine label="Mục tiêu" value={item.objectives} />
          <DetailLine label="Nội dung giáo lý" value={item.catechismContent} />
          <DetailLine label="Lời Chúa" value={item.scriptureContent} />
          <DetailLine label="Trò chơi" value={item.game} />
          <DetailLine label="Bài hát" value={item.song} />
          <DetailLine label="Bài tập về nhà" value={item.homework} />
          <DetailLine label="Chuẩn bị" value={item.preparation} />
          <DetailLine label="Ghi chú nội bộ" value={item.note} />
        </dl>
        <div className="border-t border-line pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Tài liệu</p>
          {item.materialName ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 break-all text-sm">
                {item.materialName}{item.materialSize ? ` · ${(item.materialSize / 1024).toFixed(0)} KB` : ""}
              </span>
              <Button size="sm" variant="outline" pending={pending} onClick={downloadMaterial}>
                Tải xuống
              </Button>
              {detail.canManage ? (
                <Button size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming("material")}>Gỡ tệp</Button>
              ) : null}
            </div>
          ) : <p className="mt-2 text-sm text-ink-muted">Chưa đính kèm tài liệu.</p>}
          {detail.canManage ? (
            /*
              Dùng `FileUpload` của design system (mục 0.8) thay cho `<input
              type="file">` trần: nó mang sẵn `htmlFor`/`aria-describedby` trỏ
              tới dòng giới hạn — đúng thiếu sót C14/F06 mà biên bản audit nêu —
              hiện tên tệp đã chọn, và cho cái nút "Chọn tệp" do trình duyệt vẽ
              đủ 44px. Vẫn là `input[type=file]` native nên bộ E2E hiện có không
              phải đổi bộ định vị.
            */
            <form onSubmit={uploadMaterial} className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
              <FileUpload
                key={uploadKey}
                id={fileInputId}
                name="file"
                label={item.materialName ? "Thay tài liệu" : "Tải tài liệu lên"}
                accept={TEACHING_MATERIAL_ACCEPT_ATTR}
                maxSizeMb={TEACHING_MATERIAL_MAX_MB}
                hint={TEACHING_MATERIAL_HINT}
                required
                disabled={pending}
                className="flex-1"
              />
              <Button type="submit" size="sm" pending={pending}>Lưu tài liệu</Button>
            </form>
          ) : (
            <p className="mt-2 text-xs text-ink-muted">{TEACHING_MATERIAL_SUMMARY}</p>
          )}
        </div>
      </CardContent>

      {/*
        M06-C · #8 — biểu mẫu 12 trường mở trong hộp thoại: trên 360px `Dialog`
        neo đáy màn hình và trượt lên (`items-end` + `rounded-t-xl`), tức đúng
        "form drawer" mà `docs/06` §11 đòi; từ `sm` trở lên nó là hộp giữa màn
        hình. Một đường đi duy nhất cho cả ba viewport — không đo cỡ màn hình
        bằng JavaScript, nên không có nhánh nào chỉ chạy trên một cỡ máy.
      */}
      <Dialog
        open={editing}
        onClose={() => setEditing(false)}
        title="Sửa mục giáo án"
        description={`${itemTypeLabel} · ${formatDateVi(item.plannedDate)} · ${item.title}`}
        className="sm:max-w-2xl"
      >
        <ItemForm
          detail={detail}
          item={item}
          onCancel={() => setEditing(false)}
          onSaved={(text) => {
            setEditing(false);
            setMessage({ tone: "success", text });
          }}
          onReload={reloadItem}
        />
      </Dialog>

      {/*
        M06-C · #9 / **nợ #1** — hai chỗ `window.confirm` cuối cùng của module.
        Hộp thoại của trình duyệt không dịch được nút OK/Cancel, không bẫy được
        focus, và **không nêu được hậu quả**: câu cũ *"Xóa … khỏi giáo án?"* im
        lặng hoàn toàn về chuyện tệp đính kèm bị xoá theo (`06_UI_UX` §3).
      */}
      <ConfirmDialog
        open={confirming === "item"}
        onClose={() => setConfirming(null)}
        onConfirm={remove}
        pending={pending}
        title="Xóa mục giáo án?"
        confirmLabel="Xóa mục này"
        consequence={
          <>
            Xóa <strong>{item.title}</strong> ({itemTypeLabel.toLowerCase()} ngày{" "}
            {formatDateVi(item.plannedDate)}) khỏi giáo án lớp {detail.className}.
            {item.materialName ? (
              <> Tệp đính kèm <strong>{item.materialName}</strong> bị xoá theo.</>
            ) : null}{" "}
            Giáo án không lưu lịch sử, nên thao tác này <strong>không hoàn tác được</strong>.
          </>
        }
      />

      <ConfirmDialog
        open={confirming === "material"}
        onClose={() => setConfirming(null)}
        onConfirm={removeMaterial}
        pending={pending}
        title="Gỡ tài liệu đính kèm?"
        confirmLabel="Gỡ tài liệu này"
        consequence={
          <>
            Xoá tệp <strong>{item.materialName}</strong> khỏi mục{" "}
            <strong>{item.title}</strong>. Tệp bị xoá khỏi kho lưu trữ, không chỉ
            gỡ liên kết — muốn dùng lại thì phải tải lên lần nữa.
          </>
        }
      />
    </Card>
  );
}

export function TeachingPlanEditor({ detail, view }: { detail: TeachingPlanDetail; view: "list" | "calendar" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);
  const [adding, setAdding] = useState(false);
  const groups = useMemo(() => {
    if (view === "list") return [["all", detail.items] as const];
    const map = new Map<string, TeachingPlanItem[]>();
    for (const item of detail.items) {
      const key = item.plannedDate.slice(0, 7);
      map.set(key, [...(map.get(key) ?? []), item]);
    }
    return [...map.entries()];
  }, [detail.items, view]);

  function createPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = String(new FormData(event.currentTarget).get("title") ?? "");
    startTransition(async () => {
      const result = await ensureTeachingPlan({ classId: detail.classId, title });
      if (!result.ok) setMessage({ tone: "error", text: result.message });
      else router.refresh();
    });
  }

  function renamePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.planId) return;
    const title = String(new FormData(event.currentTarget).get("title") ?? "");
    startTransition(async () => {
      const result = await updateTeachingPlanTitle({ planId: detail.planId!, title });
      setMessage(result.ok ? { tone: "success", text: "Đã đổi tên giáo án." } : { tone: "error", text: result.message });
      if (result.ok) router.refresh();
    });
  }

  if (!detail.planId) {
    return (
      <Card>
        <CardHeader><CardTitle>Chưa có giáo án</CardTitle><CardDescription>Mỗi lớp có một kế hoạch giảng dạy cho cả năm học.</CardDescription></CardHeader>
        <CardContent>
          {detail.canManage ? (
            <form onSubmit={createPlan} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2"><Label htmlFor="new-plan-title">Tên giáo án</Label><Input id="new-plan-title" name="title" defaultValue={`Kế hoạch giảng dạy ${detail.className} ${detail.academicYearCode}`} maxLength={150} required /></div>
              <Button type="submit" pending={pending}>Tạo giáo án</Button>
              {message ? (
                <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage>
              ) : null}
            </form>
          ) : <p className="text-sm text-ink-muted">GLV đại diện chưa khởi tạo giáo án cho lớp.</p>}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <CardContent className="pt-6">
          {detail.canManage ? (
            <form onSubmit={renamePlan} className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-2"><Label htmlFor="plan-title">Tên giáo án</Label><Input id="plan-title" name="title" defaultValue={detail.planTitle ?? ""} maxLength={150} required /></div>
              <Button type="submit" variant="outline" pending={pending}>Lưu tên</Button>
            </form>
          ) : <p className="font-medium">{detail.planTitle}</p>}
          {message ? <FormMessage className="mt-2" tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
        </CardContent>
      </Card>

      {detail.canManage ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">Mỗi ngày có tối đa một mục giáo án.</p>
          <Button onClick={() => setAdding(true)}>Thêm mục giáo án</Button>
        </div>
      ) : null}

      {/*
        Hộp thoại thêm mục **không tự đóng** sau khi lưu, và đó là chủ ý: soạn
        giáo án là việc thêm nhiều mục liên tiếp, còn đóng ngay thì câu *"Đã thêm
        mục giáo án."* bị chính lượt đóng nó xoá mất — đúng lỗi M05-B đã trả giá
        một lần. Biểu mẫu tự dọn để soạn mục tiếp theo; thẻ mục mới đã hiện sẵn
        phía sau nhờ `router.refresh()`.
      */}
      <Dialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Thêm mục giáo án"
        description="Chọn ngày, người dạy và điền nội dung cần thiết. Mỗi ngày có tối đa một mục."
        className="sm:max-w-2xl"
      >
        <ItemForm detail={detail} onCancel={() => setAdding(false)} />
      </Dialog>

      {detail.items.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-ink-muted">Giáo án chưa có bài dạy hoặc bài kiểm tra.</CardContent></Card>
      ) : groups.map(([key, items]) => (
        <section key={key} className="space-y-3">
          {view === "calendar" ? <h2 className="text-lg font-semibold">Tháng {key.slice(5)}/{key.slice(0, 4)}</h2> : null}
          <div className={view === "calendar" ? "grid gap-4 xl:grid-cols-2" : "space-y-4"}>
            {items.map((item) => <ItemCard key={item.id} detail={detail} item={item} />)}
          </div>
        </section>
      ))}
    </div>
  );
}
