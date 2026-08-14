"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateVi } from "@/lib/dates";
import { SACRAMENT_LABELS, sacramentLabel } from "../student-status";
import type { StudentFeedback } from "../student-feedback";
import { sacramentFormAction } from "../server/actions";
import { useGlobalPending } from "@/components/loading/loading-provider";

export interface SacramentItem {
  id: string;
  sacramentType: string;
  sacramentName: string | null;
  sacramentDate: string | null;
  place: string | null;
  godparentName: string | null;
  registryNumber: string | null;
  notes: string | null;
}

/**
 * Tab "Bí tích" — M03-C, **TB-F08 / AC-F08-01 · AC-F08-02**.
 *
 * 🔴 **Danh sách và biểu mẫu nằm trong MỘT component, dùng chung MỘT
 * `useActionState`.** Đây không phải lựa chọn thẩm mỹ mà là bài học đo được ở
 * M03-A: `useActionState` **giữ lại** kết quả của lượt trước, nên hai state
 * riêng cho "lưu" và "xoá" sẽ để câu *"Đã lưu bí tích Rửa tội"* đứng nguyên sau
 * khi người dùng vừa xoá đúng bản ghi ấy. Tệ hơn nữa với nút xoá: đặt phản hồi
 * bên trong từng dòng thì xoá xong **dòng biến mất mang theo câu thông báo**,
 * và người dùng không bao giờ biết việc đã chạy.
 *
 * **Chọn bản ghi để sửa bằng ĐƯỜNG DẪN (`?edit=<id>`), không bằng state React.**
 * Nhờ vậy nút "Sửa" vẫn chạy khi chưa có JavaScript (`09` §11) — nó là một
 * `<Link>` thật, và máy chủ dựng sẵn biểu mẫu đã điền. Hộp xác nhận xoá là lớp
 * duy nhất cần JS, và khi không có JS thì bấm là gửi ngay: mất hộp xác nhận
 * nhưng **không mất thao tác** (cùng khuôn `RosterRow`).
 */
export function SacramentPanel({
  studentId,
  studentName,
  sacraments,
  editing,
  canWrite,
  canDelete,
  backHref,
}: {
  studentId: string;
  /** `11` §5 — hộp xác nhận phải nêu hậu quả **bằng tên riêng**. */
  studentName: string;
  sacraments: SacramentItem[];
  /** Bản ghi đang sửa, lấy từ `?edit=<id>`; `null` là đang thêm mới. */
  editing: SacramentItem | null;
  canWrite: boolean;
  canDelete: boolean;
  /** Đường về chế độ "thêm mới" — giữ nguyên tab đang đứng. */
  backHref: string;
}) {
  const router = useRouter();
  const [feedback, formAction, pending] = useActionState<StudentFeedback | null, FormData>(
    sacramentFormAction,
    null,
  );
  useGlobalPending(pending);

  // Refresh only after the action result has settled. The previous synchronous
  // revalidation could strand both save and delete buttons in `pending` while
  // the database change had already completed.
  useEffect(() => {
    if (feedback?.tone !== "success") return;
    const timer = window.setTimeout(() => router.refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [feedback, router]);

  const deleteFormRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);
  const [target, setTarget] = useState<SacramentItem | null>(null);

  function handleDeleteSubmit(event: FormEvent<HTMLFormElement>, item: SacramentItem) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      return;
    }
    event.preventDefault();
    deleteFormRef.current = event.currentTarget;
    setTarget(item);
  }

  function handleConfirm() {
    confirmedRef.current = true;
    setTarget(null);
    deleteFormRef.current?.requestSubmit();
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Bí tích đã lãnh</CardTitle>
          <CardDescription>Mỗi loại bí tích chỉ ghi một lần cho mỗi em.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sacraments.length === 0 ? (
            <EmptyState
              variant="no-data"
              title="Chưa có thông tin bí tích"
              description="Dùng biểu mẫu bên cạnh để ghi bí tích đầu tiên cho em."
            />
          ) : (
            <ul aria-label={`Bí tích của ${studentName}`} className="space-y-3">
              {sacraments.map((item) => (
                <li key={item.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {sacramentLabel(item.sacramentType, item.sacramentName)}
                      </p>
                      <p className="text-muted-foreground">
                        {item.sacramentDate ? formatDateVi(item.sacramentDate) : "Chưa rõ ngày"}
                        {item.place ? ` · ${item.place}` : ""}
                      </p>
                      {item.godparentName ? (
                        <p className="text-muted-foreground">Người đỡ đầu: {item.godparentName}</p>
                      ) : null}
                      {item.registryNumber ? (
                        <p className="text-muted-foreground">Số sổ: {item.registryNumber}</p>
                      ) : null}
                    </div>

                    {canWrite ? (
                      <div className="flex flex-wrap items-center gap-2">
                        {/*
                          `<Link>` mang lớp của nút chứ KHÔNG bọc trong `<Button>`:
                          `Button` của Đợt 0-UI luôn dựng ra một `<button>` thật
                          (không có `asChild`), và một `<button>` lồng trong một
                          `<a>` là HTML sai — trình đọc màn hình đọc ra hai điều
                          khiển chồng nhau. `buttonVariants` sinh ra đúng bộ lớp
                          ấy, gồm cả `min-h-control` = 44px.
                        */}
                        <Link
                          href={`${backHref}&edit=${item.id}`}
                          aria-label={`Sửa bí tích ${sacramentLabel(item.sacramentType, item.sacramentName)}`}
                          className={buttonVariants({ variant: "outline", size: "sm" })}
                        >
                          Sửa
                        </Link>
                        {canDelete ? (
                          <form
                            action={formAction}
                            onSubmit={(event) => handleDeleteSubmit(event, item)}
                          >
                            <input type="hidden" name="intent" value="delete" />
                            <input type="hidden" name="studentId" value={studentId} />
                            <input type="hidden" name="id" value={item.id} />
                            <Button type="submit" variant="outline" size="sm" disabled={pending}>
                              {pending ? "Đang xoá…" : "Xoá"}
                            </Button>
                          </form>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canWrite ? (
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Sửa bản ghi bí tích" : "Thêm bí tích"}</CardTitle>
            <CardDescription>
              {editing
                ? `Đang sửa: ${sacramentLabel(editing.sacramentType, editing.sacramentName)}.`
                : "Ghi lại bí tích em đã lãnh nhận."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/*
              `key` đổi theo bản ghi đang sửa VÀ theo câu phản hồi cuối: đổi theo
              bản ghi để các ô nạp lại giá trị mới; đổi theo phản hồi để biểu mẫu
              "thêm mới" tự trống sau một lượt lưu thành công.
            */}
            <form
              key={`${editing?.id ?? "new"}-${feedback?.text ?? "idle"}`}
              action={formAction}
              aria-label={editing ? "Sửa bản ghi bí tích" : "Thêm bí tích"}
              className="space-y-3"
            >
              <input type="hidden" name="studentId" value={studentId} />
              <input type="hidden" name="id" value={editing?.id ?? ""} />
              <div className="space-y-2">
                <Label htmlFor="sac-type">Loại bí tích</Label>
                <Select
                  id="sac-type"
                  name="sacramentType"
                  defaultValue={editing?.sacramentType ?? "baptism"}
                >
                  {Object.entries(SACRAMENT_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sac-name">Tên (nếu chọn Khác)</Label>
                <Input
                  id="sac-name"
                  name="sacramentName"
                  maxLength={150}
                  defaultValue={editing?.sacramentName ?? ""}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sac-date">Ngày lãnh</Label>
                  <Input
                    id="sac-date"
                    name="sacramentDate"
                    type="date"
                    defaultValue={editing?.sacramentDate ?? ""}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sac-place">Nơi lãnh</Label>
                  <Input
                    id="sac-place"
                    name="place"
                    maxLength={200}
                    defaultValue={editing?.place ?? ""}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sac-godparent">Người đỡ đầu</Label>
                <Input
                  id="sac-godparent"
                  name="godparentName"
                  maxLength={150}
                  defaultValue={editing?.godparentName ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sac-registry">Số sổ</Label>
                <Input
                  id="sac-registry"
                  name="registryNumber"
                  maxLength={100}
                  defaultValue={editing?.registryNumber ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sac-notes">Ghi chú</Label>
                <Textarea
                  id="sac-notes"
                  name="notes"
                  rows={2}
                  maxLength={1000}
                  defaultValue={editing?.notes ?? ""}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={pending}>
                  {pending ? "Đang lưu…" : editing ? "Lưu thay đổi" : "Lưu bí tích"}
                </Button>
                {editing ? (
                  <Link href={backHref} className={buttonVariants({ variant: "outline" })}>
                    Huỷ sửa
                  </Link>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/*
        Một chỗ duy nhất hiển thị phản hồi cho cả ba thao tác (thêm · sửa · xoá).
        `lg:col-span-2` để câu chữ chạy hết bề ngang, không bị ép vào một cột.
      */}
      {feedback ? (
        <FormMessage tone={feedback.tone} className="lg:col-span-2">
          {feedback.text}
        </FormMessage>
      ) : null}

      <ConfirmDialog
        open={target !== null}
        onClose={() => setTarget(null)}
        onConfirm={handleConfirm}
        pending={pending}
        title="Xoá bản ghi bí tích?"
        confirmLabel="Xoá bản ghi"
        tone="danger"
        consequence={
          <p>
            {target
              ? `Xoá vĩnh viễn bản ghi "${sacramentLabel(target.sacramentType, target.sacramentName)}" khỏi hồ sơ của ${studentName}. Hệ thống không có thùng rác — muốn khôi phục thì phải nhập lại từ sổ bộ của giáo xứ.`
              : ""}
          </p>
        }
      />
    </div>
  );
}
