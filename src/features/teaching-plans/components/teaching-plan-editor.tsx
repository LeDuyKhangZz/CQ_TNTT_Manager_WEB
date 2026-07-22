"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateVi } from "@/lib/dates";
import {
  TEACHING_ITEM_TYPE_LABELS,
  TEACHING_MATERIAL_ACCEPT,
  type TeachingItemType,
} from "../constants";
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

const selectClassName = "h-11 min-h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
const textareaClassName = "min-h-24 w-full rounded-md border border-border bg-card px-3 py-2 text-sm";

type Message = { tone: "success" | "error"; text: string } | null;

function formText(data: FormData, name: string): string | null {
  const value = String(data.get(name) ?? "").trim();
  return value || null;
}

function weekNumber(date: string, yearStart: string): number {
  const start = Date.parse(`${yearStart}T00:00:00Z`);
  const current = Date.parse(`${date}T00:00:00Z`);
  return Math.floor((current - start) / 604_800_000) + 1;
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
  const [itemType, setItemType] = useState<TeachingItemType>(item?.itemType ?? "lesson");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm font-medium">Loại mục</span>
        <select name="itemType" className={selectClassName} value={itemType} onChange={(event) => setItemType(event.target.value as TeachingItemType)}>
          <option value="lesson">Bài học</option>
          <option value="assessment">Kiểm tra</option>
        </select>
      </label>
      <div className="space-y-2">
        <Label htmlFor={`planned-date-${item?.id ?? "new"}`}>Ngày dự kiến</Label>
        <Input id={`planned-date-${item?.id ?? "new"}`} name="plannedDate" type="date" min={yearStart} max={yearEnd} defaultValue={item?.plannedDate ?? yearStart} required />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`title-${item?.id ?? "new"}`}>Tên bài / tên bài kiểm tra</Label>
        <Input id={`title-${item?.id ?? "new"}`} name="title" defaultValue={item?.title ?? ""} maxLength={200} required />
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium">Người dạy</span>
        <select name="teacherStaffId" className={selectClassName} defaultValue={item?.teacherStaffId ?? ""} required={itemType === "lesson"}>
          <option value="">{itemType === "assessment" ? "Chưa phân công" : "Chọn người dạy"}</option>
          {staff.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}
        </select>
      </label>
      <TextArea name="objectives" label="Mục tiêu" value={item?.objectives} maxLength={4000} />
      <TextArea name="catechismContent" label="Nội dung giáo lý" value={item?.catechismContent} maxLength={8000} />
      <TextArea name="scriptureContent" label="Lời Chúa" value={item?.scriptureContent} maxLength={4000} />
      <TextArea name="game" label="Trò chơi" value={item?.game} maxLength={2000} />
      <TextArea name="song" label="Bài hát" value={item?.song} maxLength={1000} />
      <TextArea name="homework" label="Bài tập về nhà" value={item?.homework} maxLength={2000} />
      <TextArea name="preparation" label="Chuẩn bị" value={item?.preparation} maxLength={2000} />
      <TextArea name="note" label="Ghi chú nội bộ" value={item?.note} maxLength={2000} />
    </div>
  );
}

function TextArea({ name, label, value, maxLength }: { name: string; label: string; value?: string | null; maxLength: number }) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium">{label}</span>
      <textarea name={name} defaultValue={value ?? ""} maxLength={maxLength} className={textareaClassName} />
    </label>
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

function ItemForm({ detail, item, onDone }: { detail: TeachingPlanDetail; item?: TeachingPlanItem; onDone?: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!detail.planId) return;
    setMessage(null);
    const form = event.currentTarget;
    const payload = payloadFromForm(new FormData(form), detail.planId);
    startTransition(async () => {
      const result = item
        ? await updateTeachingPlanItem({ ...payload, itemId: item.id })
        : await createTeachingPlanItem(payload);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setMessage({ tone: "success", text: item ? "Đã cập nhật mục giáo án." : "Đã thêm mục giáo án." });
      if (!item) form.reset();
      onDone?.();
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ItemFields item={item} staff={detail.staff} yearStart={detail.yearStart} yearEnd={detail.yearEnd} />
      {message ? <FormMessage tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
      <div className="flex flex-wrap justify-end gap-2">
        {onDone ? <Button variant="ghost" onClick={onDone}>Đóng</Button> : null}
        <Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : item ? "Lưu thay đổi" : "Thêm vào giáo án"}</Button>
      </div>
    </form>
  );
}

function DetailLine({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className="mt-1 whitespace-pre-wrap text-sm">{value}</dd></div>;
}

function ItemCard({ detail, item }: { detail: TeachingPlanDetail; item: TeachingPlanItem }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);

  function remove() {
    if (!window.confirm(`Xóa “${item.title}” khỏi giáo án?`)) return;
    startTransition(async () => {
      const result = await deleteTeachingPlanItem(item.id);
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
    startTransition(async () => {
      const result = await uploadTeachingMaterial(data);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      setMessage({ tone: "success", text: "Đã lưu tài liệu vào kho riêng tư." });
      form.reset();
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
    if (!window.confirm(`Gỡ tài liệu “${item.materialName ?? ""}”?`)) return;
    setMessage(null);
    startTransition(async () => {
      const result = await removeTeachingMaterial(item.id);
      if (!result.ok) {
        setMessage({ tone: "error", text: result.message });
        return;
      }
      router.refresh();
    });
  }

  return (
    <Card data-teaching-plan-item={item.id}>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={item.itemType === "assessment" ? "warning" : "secondary"}>{TEACHING_ITEM_TYPE_LABELS[item.itemType]}</Badge>
              <span className="text-sm text-muted-foreground">Tuần {weekNumber(item.plannedDate, detail.yearStart)} · {formatDateVi(item.plannedDate)}</span>
            </div>
            <CardTitle>{item.title}</CardTitle>
            <CardDescription>Người dạy: {item.teacherName}</CardDescription>
          </div>
          {detail.canManage ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setEditing((value) => !value)}>{editing ? "Đóng" : "Sửa"}</Button>
              <Button size="sm" variant="danger" disabled={pending} onClick={remove}>Xóa</Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {message ? <FormMessage>{message.text}</FormMessage> : null}
        {editing ? (
          <ItemForm detail={detail} item={item} onDone={() => setEditing(false)} />
        ) : (
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
        )}
        <div className="border-t border-border pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tài liệu</p>
          {item.materialName ? (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 break-all text-sm">
                {item.materialName}{item.materialSize ? ` · ${(item.materialSize / 1024).toFixed(0)} KB` : ""}
              </span>
              <Button size="sm" variant="outline" disabled={pending} onClick={downloadMaterial}>Tải xuống</Button>
              {detail.canManage ? <Button size="sm" variant="ghost" disabled={pending} onClick={removeMaterial}>Gỡ tệp</Button> : null}
            </div>
          ) : <p className="mt-2 text-sm text-muted-foreground">Chưa đính kèm tài liệu.</p>}
          {detail.canManage ? (
            <form onSubmit={uploadMaterial} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="flex-1 space-y-2">
                <span className="text-sm font-medium">{item.materialName ? "Thay tài liệu" : "Tải tài liệu lên"}</span>
                <Input name="file" type="file" accept={TEACHING_MATERIAL_ACCEPT.join(",")} required />
              </label>
              <Button type="submit" size="sm" disabled={pending}>Lưu tài liệu</Button>
            </form>
          ) : null}
          <p className="mt-2 text-xs text-muted-foreground">PDF, Office, ảnh hoặc văn bản · tối đa 5 MB · chỉ nhân sự đúng phạm vi lớp được tải.</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function TeachingPlanEditor({ detail, view }: { detail: TeachingPlanDetail; view: "list" | "calendar" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
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
              <Button type="submit" disabled={pending}>Tạo giáo án</Button>
              {message ? <FormMessage>{message.text}</FormMessage> : null}
            </form>
          ) : <p className="text-sm text-muted-foreground">GLV đại diện chưa khởi tạo giáo án cho lớp.</p>}
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
              <Button type="submit" variant="outline" disabled={pending}>Lưu tên</Button>
            </form>
          ) : <p className="font-medium">{detail.planTitle}</p>}
          {message ? <FormMessage className="mt-2" tone={message.tone === "error" ? "danger" : "success"}>{message.text}</FormMessage> : null}
        </CardContent>
      </Card>

      {detail.canManage ? (
        <Card>
          <CardHeader><CardTitle>Thêm mục giáo án</CardTitle><CardDescription>Chọn ngày, người dạy và điền nội dung cần thiết. Mỗi ngày có tối đa một mục.</CardDescription></CardHeader>
          <CardContent><ItemForm detail={detail} /></CardContent>
        </Card>
      ) : null}

      {detail.items.length === 0 ? (
        <Card><CardContent className="pt-6 text-sm text-muted-foreground">Giáo án chưa có bài dạy hoặc bài kiểm tra.</CardContent></Card>
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
