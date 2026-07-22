"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTimeVi } from "@/lib/dates";
import {
  NOTIFICATION_LINK_ROUTES,
  NOTIFICATION_TARGETS_NEEDING_ID,
  NOTIFICATION_TARGET_LABELS,
  type NotificationTargetType,
} from "../constants";
import { markAllNotificationsRead, markNotificationRead, publishNotification } from "../server/actions";
import type { NotificationsPageData } from "../server/queries";

const selectClassName = "h-11 min-h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
const textareaClassName = "min-h-24 w-full rounded-md border border-border bg-card p-3 text-sm";
type Message = { tone: "success" | "danger"; text: string } | null;

export function NotificationCenter({ data }: { data: NotificationsPageData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const [targetType, setTargetType] = useState<NotificationTargetType>("class");

  const { publishOptions } = data;
  const availableTargets = useMemo(() => {
    const targets: NotificationTargetType[] = [];
    if (publishOptions.canPublishGlobal) targets.push("all", "guardians", "students");
    if (publishOptions.sectors.length > 0) targets.push("sector");
    if (publishOptions.classes.length > 0) targets.push("class");
    if (publishOptions.committees.length > 0) targets.push("committee");
    return targets;
  }, [publishOptions]);

  const targetOptions = targetType === "sector"
    ? publishOptions.sectors
    : targetType === "class"
      ? publishOptions.classes
      : targetType === "committee"
        ? publishOptions.committees
        : [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    startTransition(async () => {
      const result = await publishNotification({
        title: String(formData.get("title") ?? ""),
        content: String(formData.get("content") ?? ""),
        targetType,
        targetId: NOTIFICATION_TARGETS_NEEDING_ID.includes(targetType)
          ? String(formData.get("targetId") ?? "") || null
          : null,
        linkPath: String(formData.get("linkPath") ?? "") || null,
      });
      if (result.ok) {
        setMessage({ tone: "success", text: "Đã gửi thông báo." });
        form.reset();
        router.refresh();
      } else {
        setMessage({ tone: "danger", text: result.message });
      }
    });
  }

  function markRead(notificationId: string) {
    setMessage(null);
    startTransition(async () => {
      const result = await markNotificationRead({ notificationId });
      // Đánh dấu đã đọc mà thất bại thầm lặng thì badge cứ đứng yên và người
      // dùng không hiểu vì sao — luôn hiện lỗi.
      if (!result.ok) setMessage({ tone: "danger", text: result.message });
      router.refresh();
    });
  }

  function markAll() {
    setMessage(null);
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (!result.ok) setMessage({ tone: "danger", text: result.message });
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      {availableTargets.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Gửi thông báo</CardTitle>
            <CardDescription>
              Thông báo chỉ hiển thị trong hệ thống, không gửi SMS/email/Zalo và không hẹn giờ.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Phạm vi</span>
                <select
                  className={selectClassName}
                  value={targetType}
                  onChange={(event) => setTargetType(event.target.value as NotificationTargetType)}
                >
                  {availableTargets.map((target) => (
                    <option key={target} value={target}>{NOTIFICATION_TARGET_LABELS[target]}</option>
                  ))}
                </select>
              </label>
              {NOTIFICATION_TARGETS_NEEDING_ID.includes(targetType) ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium">Đối tượng nhận</span>
                  <select name="targetId" required className={selectClassName}>
                    <option value="">Chọn đối tượng</option>
                    {targetOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notification-title">Tiêu đề</Label>
                <Input id="notification-title" name="title" required maxLength={200} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notification-content">Nội dung</Label>
                <textarea id="notification-content" name="content" required maxLength={5000} className={textareaClassName} />
              </div>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Liên kết kèm theo (tùy chọn)</span>
                <select name="linkPath" defaultValue="" className={selectClassName}>
                  <option value="">Không kèm liên kết</option>
                  {NOTIFICATION_LINK_ROUTES.map((route) => (
                    <option key={route} value={route}>{route}</option>
                  ))}
                </select>
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={pending}>{pending ? "Đang gửi…" : "Gửi thông báo"}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Hộp thư</CardTitle>
              <CardDescription>{data.unreadCount} thông báo chưa đọc</CardDescription>
            </div>
            {data.unreadCount > 0 ? (
              <Button variant="outline" disabled={pending} onClick={markAll}>Đánh dấu tất cả đã đọc</Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent>
          {data.inbox.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có thông báo nào dành cho bạn.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.inbox.map((item) => (
                <li key={item.id} className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {item.title}
                        {item.readAt === null ? <span className="ml-2 align-middle"><Badge>Mới</Badge></span> : null}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm">{item.content}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {NOTIFICATION_TARGET_LABELS[item.targetType]} · {formatDateTimeVi(item.publishedAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.linkPath ? (
                        <Link href={item.linkPath} className="text-sm text-primary hover:underline">Mở trang liên quan</Link>
                      ) : null}
                      {item.readAt === null ? (
                        <Button variant="outline" size="sm" disabled={pending} onClick={() => markRead(item.id)}>
                          Đánh dấu đã đọc
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
