"use client";

import { EntityLink } from "@/components/ui/entity-link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { COMMITTEE_POSITION_LABELS } from "../constants";
import { createCommittee } from "../server/actions";
import type { CommitteeSummary } from "../server/queries";
import { useGlobalPending } from "@/components/loading/loading-provider";

type Message = { tone: "success" | "danger"; text: string } | null;

function CommitteeCard({ committee }: { committee: CommitteeSummary }) {
  return (
    <li><EntityLink href={`/committees/${committee.id}`} className="rounded-none border-0"><div className="grid gap-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(16rem,1.5fr)_auto] lg:gap-4">
          <div className="min-w-0">
            <p className="font-semibold">{committee.name}</p>
            <p className="text-sm text-ink-muted">
              {committee.memberCount} thành viên
              {committee.managesEquipment ? " · Quản lý kho thiết bị" : ""}
            </p>
            {committee.description ? <p className="mt-1 break-words text-sm text-ink-muted">{committee.description}</p> : null}
          </div>
        {/* TB-M09-06: tên Trưởng/Phó ban trên thẻ. Đọc được nhờ D-100; ẩn dòng
            khi chưa có/không đọc được thay vì hiện nhãn trống. */}
        {committee.leaderNames.length > 0 || committee.deputyNames.length > 0 ? (
          <dl className="min-w-0 space-y-1 py-2 text-sm">
            {committee.leaderNames.length > 0 ? (
              <div className="flex flex-wrap gap-x-2">
                <dt className="shrink-0 text-ink-muted">Trưởng ban:</dt>
                <dd className="break-words text-ink">{committee.leaderNames.join(", ")}</dd>
              </div>
            ) : null}
            {committee.deputyNames.length > 0 ? (
              <div className="flex flex-wrap gap-x-2">
                <dt className="shrink-0 text-ink-muted">Phó ban:</dt>
                <dd className="break-words text-ink">{committee.deputyNames.join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        ) : <span />}
        <div className="py-2 text-sm text-ink-muted">
          {committee.myPosition ? <p>{COMMITTEE_POSITION_LABELS[committee.myPosition]}</p> : null}
          {!committee.isActive ? <Badge variant="secondary">Ngưng hoạt động</Badge> : <p>Đang hoạt động</p>}
        </div>
    </div></EntityLink></li>
  );
}

export function CommitteeList({
  committees,
  canManage,
}: {
  committees: CommitteeSummary[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);
  const [showForm, setShowForm] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setMessage(null);
    startTransition(async () => {
      const result = await createCommittee({
        code: String(data.get("code") ?? "").toUpperCase(),
        name: String(data.get("name") ?? ""),
        description: String(data.get("description") ?? "") || null,
      });
      if (result.ok) {
        setMessage({ tone: "success", text: "Đã thêm Ban mới." });
        form.reset();
        setShowForm(false);
        router.refresh();
      } else {
        setMessage({ tone: "danger", text: result.message });
      }
    });
  }

  return (
    <div className="space-y-4" data-density="compact">
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted">{committees.length} Ban trong phạm vi của bạn</p>
        {canManage && !showForm ? <Button type="button" onClick={() => setShowForm(true)}>Thêm Ban mới</Button> : null}
      </div>
      {canManage && showForm ? (
        <Card>
          <CardHeader>
            <CardTitle>Thêm Ban</CardTitle>
            <CardDescription>Sáu Ban mặc định đã có sẵn; chỉ thêm khi xứ đoàn lập Ban mới.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showForm ? (
              <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="committee-code">Mã Ban</Label>
                  <Input id="committee-code" name="code" required maxLength={32} placeholder="VD: TRUYEN_THONG" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="committee-name">Tên Ban</Label>
                  <Input id="committee-name" name="name" required maxLength={120} placeholder="VD: Ban Truyền thông" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="committee-description">Mô tả</Label>
                  <Input id="committee-description" name="description" maxLength={1000} />
                </div>
                <div className="flex flex-wrap gap-2 md:col-span-2">
                  <Button type="submit" pending={pending}>Lưu Ban</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Hủy</Button>
                </div>
              </form>
            ) : (
              <Button type="button" variant="outline" onClick={() => setShowForm(true)}>Thêm Ban mới</Button>
            )}
          </CardContent>
        </Card>
      ) : null}

      {committees.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-ink-muted">
            Bạn chưa thuộc Ban nào. Xin liên hệ Ban điều hành xứ đoàn để được thêm vào Ban.
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y divide-line rounded-md border border-line bg-surface">
          {committees.map((committee) => (
            <CommitteeCard key={committee.id} committee={committee} />
          ))}
        </ul>
      )}
    </div>
  );
}
