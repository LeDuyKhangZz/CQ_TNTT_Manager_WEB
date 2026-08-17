"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { COMMITTEE_POSITION_LABELS } from "../constants";
import { createCommittee } from "../server/actions";
import type { CommitteeSummary } from "../server/queries";
import { useGlobalPending } from "@/components/loading/loading-provider";

type Message = { tone: "success" | "danger"; text: string } | null;

function CommitteeCard({ committee }: { committee: CommitteeSummary }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle>{committee.name}</CardTitle>
            <CardDescription>
              {committee.memberCount} thành viên
              {committee.managesEquipment ? " · Quản lý kho thiết bị" : ""}
            </CardDescription>
          </div>
          {committee.myPosition ? (
            <Badge variant="success">{COMMITTEE_POSITION_LABELS[committee.myPosition]}</Badge>
          ) : (
            <Badge variant="outline">{committee.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {committee.description ? (
          <p className="text-sm text-ink-muted">{committee.description}</p>
        ) : null}
        {/* TB-M09-06: tên Trưởng/Phó ban trên thẻ. Đọc được nhờ D-100; ẩn dòng
            khi chưa có/không đọc được thay vì hiện nhãn trống. */}
        {committee.leaderNames.length > 0 || committee.deputyNames.length > 0 ? (
          <dl className="space-y-1 text-sm">
            {committee.leaderNames.length > 0 ? (
              <div className="flex gap-2">
                <dt className="text-ink-muted">Trưởng ban:</dt>
                <dd className="font-medium text-ink">{committee.leaderNames.join(", ")}</dd>
              </div>
            ) : null}
            {committee.deputyNames.length > 0 ? (
              <div className="flex gap-2">
                <dt className="text-ink-muted">Phó ban:</dt>
                <dd className="font-medium text-ink">{committee.deputyNames.join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        ) : null}
        <Link
          href={`/committees/${committee.id}`}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Mở trang Ban
        </Link>
      </CardContent>
    </Card>
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
    <div className="space-y-6">
      {canManage ? (
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
            {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {committees.map((committee) => (
            <CommitteeCard key={committee.id} committee={committee} />
          ))}
        </div>
      )}
    </div>
  );
}
