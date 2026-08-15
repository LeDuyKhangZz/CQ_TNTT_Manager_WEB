"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { DateField } from "@/components/ui/date-field";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import type { CommitteeWeeklyPlan } from "../server/queries";

/** Thứ Hai của tuần chứa `date`, ở dạng yyyy-MM-dd. */
export function mondayOf(date: Date): string {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() - ((weekday + 6) % 7));
  return copy.toISOString().slice(0, 10);
}

export interface WeeklyPlanDraft {
  weekStart: string;
  content: string | null;
  checklist: string[];
  expectedUpdatedAt: string | null;
}

/** Câu mô tả bản đang có, để cả nút lẫn dòng chữ nói cùng một điều. */
export function describeExistingPlan(plan: CommitteeWeeklyPlan): string {
  const when = formatDateTimeVi(plan.updatedAt);
  return plan.savedByName
    ? `Bản hiện tại do ${plan.savedByName} lưu lúc ${when}.`
    : `Bản hiện tại lưu lúc ${when}.`;
}

/**
 * 🔴 TB-M09-01 / AC-M09-13 — vì sao ô nhập phải biết tuần đang chọn.
 *
 * Bản cũ là một form "tạo mới" thuần: ô tuần mặc định là tuần này, hai ô nội dung
 * **luôn trống**, nút luôn ghi "Lưu công việc tuần". Người dùng mở trang giữa tuần,
 * thấy form trống, gõ thêm một việc rồi bấm Lưu — và toàn bộ nội dung Ban đã soạn
 * từ đầu tuần biến mất, vì phía server là một `upsert` ghi đè mọi cột. Màn hình
 * chưa bao giờ nói rằng tuần đó **đã có bản**, nên không ai kịp nghi ngờ.
 *
 * Nay ô tuần là nguồn sự thật của cả khối: đổi tuần thì tra ngay trong danh sách
 * đã nạp sẵn, và giao diện tự nói mình đang **tạo** hay đang **sửa**.
 *
 * Các ô nội dung cố ý là uncontrolled + `key` theo tuần đang nhắm tới: React dựng
 * lại chúng khi đổi tuần (nên prefill đúng), nhưng không giành quyền điều khiển
 * từng phím gõ của người dùng — thứ mà bảng gõ tiếng Việt trên máy phòng học hay
 * bị vấp.
 */
export function WeeklyPlanEditor({
  plans,
  canWrite,
  pending,
  onSave,
  onDelete,
}: {
  plans: CommitteeWeeklyPlan[];
  canWrite: boolean;
  pending: boolean;
  onSave: (draft: WeeklyPlanDraft) => void;
  onDelete: (plan: CommitteeWeeklyPlan) => void;
}) {
  const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()));
  const [focusRequest, setFocusRequest] = useState(0);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const weekRef = useRef<HTMLInputElement>(null);
  const existing = plans.find((plan) => plan.weekStart === weekStart) ?? null;

  /**
   * 🔴 Đồng bộ lại tuần đã chọn TRƯỚC khi JS kịp tải.
   *
   * Ô ngày là controlled component. Người dùng máy phòng học chọn tuần trong lúc
   * trang chưa hydrate thì giá trị nằm ở DOM, còn React vẫn giữ tuần mặc định —
   * và tệ hơn: khi hydrate xong, React ghi nhớ giá trị **đang có trên DOM** làm
   * mốc so sánh, nên người dùng chọn lại **đúng tuần đó** một lần nữa cũng không
   * sinh ra sự kiện nào. Kết quả: ô ngày hiện tuần 12/10, danh sách bên dưới có
   * bản của tuần 12/10, mà form vẫn nói "Tuần này chưa có công việc nào".
   *
   * Đã đo được đúng trạng thái đó trong lượt E2E của M09-A ở `tablet-768`.
   * Một lần đọc lại DOM khi vừa hydrate là đủ đóng khe hở này.
   */
  useEffect(() => {
    const chosen = weekRef.current?.value;
    if (chosen) setWeekStart((current) => (chosen === current ? current : chosen));
  }, []);

  // Focus phải đặt SAU khi React dựng lại ô nội dung. Gọi thẳng trong `onClick`
  // là focus vào node sắp bị thay, và người dùng bàn phím bị bỏ lại ở cuối trang.
  useEffect(() => {
    if (focusRequest > 0) contentRef.current?.focus();
  }, [focusRequest]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const content = String(data.get("content") ?? "").trim();
    onSave({
      weekStart: String(data.get("weekStart") ?? ""),
      content: content || null,
      checklist: String(data.get("checklist") ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
      // Dấu thời gian của đúng bản đang hiển thị. Người dùng bấm Lưu là đang nói
      // "tôi muốn thay bản NÀY", không phải "thay bất cứ thứ gì đang nằm ở đó".
      expectedUpdatedAt: existing?.updatedAt ?? null,
    });
  }

  return (
    <div className="space-y-4">
      {canWrite ? (
        <form onSubmit={submit} className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="plan-week">Tuần bắt đầu (thứ Hai)</Label>
            <DateField
              id="plan-week"
              name="weekStart"
              required
              ref={weekRef}
              value={weekStart}
              onChange={(event) => setWeekStart(event.target.value)}
            />
          </div>

          {/* Không dùng màu làm tín hiệu duy nhất: trạng thái nói bằng chữ, và
              nhãn nút nói lại cùng điều đó ngay bên dưới. */}
          <p className="text-xs text-ink-muted" role="status">
            {existing
              ? `Đang sửa công việc tuần ${formatDateVi(existing.weekStart)}. ${describeExistingPlan(existing)}`
              : "Tuần này chưa có công việc nào. Nội dung bên dưới sẽ tạo bản mới."}
          </p>

          <div className="space-y-2">
            <Label htmlFor="plan-content">Nội dung công việc</Label>
            <Textarea
              id="plan-content"
              name="content"
              ref={contentRef}
              maxLength={5000}
              key={`content-${weekStart}-${existing?.id ?? "new"}`}
              defaultValue={existing?.content ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="plan-checklist">Checklist (mỗi dòng một việc)</Label>
            <Textarea
              id="plan-checklist"
              name="checklist"
              key={`checklist-${weekStart}-${existing?.id ?? "new"}`}
              defaultValue={existing?.checklist.join("\n") ?? ""}
            />
          </div>
          <div>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Đang lưu…"
                : existing
                  ? "Cập nhật công việc tuần"
                  : "Tạo công việc tuần"}
            </Button>
          </div>
        </form>
      ) : null}

      {plans.length === 0 ? (
        <p className="text-sm text-ink-muted">Chưa có công việc tuần nào.</p>
      ) : (
        <ul className="space-y-3">
          {plans.map((plan) => (
            <li key={plan.id} className="rounded-md border border-line p-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-medium">Tuần {formatDateVi(plan.weekStart)}</p>
                {canWrite ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        // Đưa focus lên ô nội dung: người dùng bàn phím và trình
                        // đọc màn hình đi tới đúng chỗ, còn trình duyệt tự cuộn
                        // theo focus cho người dùng chuột.
                        setWeekStart(plan.weekStart);
                        setFocusRequest((value) => value + 1);
                      }}
                    >
                      Sửa
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => onDelete(plan)}
                    >
                      Xóa
                    </Button>
                  </div>
                ) : null}
              </div>
              {plan.content ? <p className="mt-1 whitespace-pre-line text-sm">{plan.content}</p> : null}
              {plan.checklist.length > 0 ? (
                <ul className="mt-2 list-inside list-disc text-sm text-ink-muted">
                  {plan.checklist.map((entry, index) => <li key={`${plan.id}-${index}`}>{entry}</li>)}
                </ul>
              ) : null}
              <p className="mt-2 text-2xs text-ink-muted">{describeExistingPlan(plan)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
