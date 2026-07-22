"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTimeVi, formatDateVi } from "@/lib/dates";
import {
  COMMITTEE_POSITIONS,
  COMMITTEE_POSITION_LABELS,
  MAX_ACTIVE_COMMITTEES_PER_STAFF,
  type CommitteePosition,
} from "../constants";
import {
  addCommitteeMember,
  deleteCommitteeAnnouncement,
  deleteCommitteeMeeting,
  deleteCommitteeWeeklyPlan,
  endCommitteeMembership,
  publishCommitteeAnnouncement,
  saveCommitteeMeeting,
  saveCommitteeWeeklyPlan,
  updateCommitteeMemberPosition,
} from "../server/actions";
import type { CommitteeDetail } from "../server/queries";

const selectClassName = "h-11 min-h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
const textareaClassName = "min-h-24 w-full rounded-md border border-border bg-card p-3 text-sm";

type Message = { tone: "success" | "danger"; text: string } | null;

/** Thứ Hai của tuần chứa `date`, ở dạng yyyy-MM-dd. */
export function mondayOf(date: Date): string {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const weekday = copy.getUTCDay();
  copy.setUTCDate(copy.getUTCDate() - ((weekday + 6) % 7));
  return copy.toISOString().slice(0, 10);
}

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

export function CommitteeWorkspace({ detail }: { detail: CommitteeDetail }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const committeeId = detail.committee.id;

  function run(task: () => Promise<{ ok: boolean; message?: string }>, successText: string, form?: HTMLFormElement) {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setMessage({ tone: "success", text: successText });
        form?.reset();
        router.refresh();
      } else {
        setMessage({ tone: "danger", text: result.message ?? "Không thể xử lý yêu cầu." });
      }
    });
  }

  function submitMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run(
      () => addCommitteeMember({
        committeeId,
        staffProfileId: String(data.get("staffProfileId") ?? ""),
        position: String(data.get("position") ?? "member") as CommitteePosition,
      }),
      "Đã thêm nhân sự vào Ban.",
      form,
    );
  }

  function submitAnnouncement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run(
      () => publishCommitteeAnnouncement({
        committeeId,
        title: String(data.get("title") ?? ""),
        content: String(data.get("content") ?? ""),
      }),
      "Đã đăng thông báo Ban.",
      form,
    );
  }

  function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const startsAtLocal = String(data.get("startsAt") ?? "");
    if (!startsAtLocal) {
      setMessage({ tone: "danger", text: "Vui lòng chọn thời gian bắt đầu." });
      return;
    }
    run(
      () => saveCommitteeMeeting({
        committeeId,
        title: String(data.get("title") ?? ""),
        startsAt: new Date(startsAtLocal).toISOString(),
        endsAt: String(data.get("endsAt") ?? "") ? new Date(String(data.get("endsAt"))).toISOString() : null,
        location: String(data.get("location") ?? "") || null,
        note: String(data.get("note") ?? "") || null,
      }),
      "Đã lưu lịch họp.",
      form,
    );
  }

  function submitWeeklyPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const checklist = String(data.get("checklist") ?? "")
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    run(
      () => saveCommitteeWeeklyPlan({
        committeeId,
        weekStart: String(data.get("weekStart") ?? ""),
        content: String(data.get("content") ?? "") || null,
        checklist,
      }),
      "Đã lưu công việc tuần.",
      form,
    );
  }

  return (
    <div className="space-y-6">
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <Section title="Nhân sự" description="Chức vụ Ban không thay vai trò chính của giáo lý viên.">
        {detail.members.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ban chưa có nhân sự.</p>
        ) : (
          <ul className="divide-y divide-border">
            {detail.members.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{member.displayName}{member.isSelf ? " (bạn)" : ""}</p>
                  <p className="text-xs text-muted-foreground">Từ ngày {formatDateVi(member.startsOn)}</p>
                </div>
                {detail.canManageMembers ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className={`${selectClassName} w-auto`}
                      defaultValue={member.position}
                      aria-label={`Chức vụ của ${member.displayName}`}
                      disabled={pending}
                      onChange={(event) => run(
                        () => updateCommitteeMemberPosition({
                          membershipId: member.id,
                          position: event.target.value as CommitteePosition,
                        }),
                        "Đã cập nhật chức vụ.",
                      )}
                    >
                      {COMMITTEE_POSITIONS.map((position) => (
                        <option key={position} value={position}>{COMMITTEE_POSITION_LABELS[position]}</option>
                      ))}
                    </select>
                    <Button
                      variant="outline"
                      disabled={pending}
                      onClick={() => run(() => endCommitteeMembership({ membershipId: member.id }), "Đã kết thúc nhiệm kỳ.")}
                    >
                      Kết thúc
                    </Button>
                  </div>
                ) : (
                  <Badge variant="secondary">{COMMITTEE_POSITION_LABELS[member.position]}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}

        {detail.canManageMembers ? (
          <form onSubmit={submitMember} className="grid gap-3 border-t border-border pt-4 md:grid-cols-3">
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium">Thêm nhân sự</span>
              <select name="staffProfileId" required className={selectClassName}>
                <option value="">Chọn giáo lý viên</option>
                {detail.staffOptions.map((staff) => (
                  <option
                    key={staff.id}
                    value={staff.id}
                    disabled={staff.activeCommitteeCount >= MAX_ACTIVE_COMMITTEES_PER_STAFF}
                  >
                    {staff.displayName}
                    {staff.activeCommitteeCount >= MAX_ACTIVE_COMMITTEES_PER_STAFF ? " — đã đủ hai Ban" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium">Chức vụ</span>
              <select name="position" defaultValue="member" className={selectClassName}>
                {COMMITTEE_POSITIONS.map((position) => (
                  <option key={position} value={position}>{COMMITTEE_POSITION_LABELS[position]}</option>
                ))}
              </select>
            </label>
            <div className="md:col-span-3">
              <Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Thêm vào Ban"}</Button>
            </div>
          </form>
        ) : null}
      </Section>

      <Section title="Thông báo Ban" description="Chỉ Trưởng ban và Phó ban đăng nội dung.">
        {detail.canWriteContent ? (
          <form onSubmit={submitAnnouncement} className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Tiêu đề</Label>
              <Input id="announcement-title" name="title" required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-content">Nội dung thông báo</Label>
              <textarea id="announcement-content" name="content" required maxLength={5000} className={textareaClassName} />
            </div>
            <div><Button type="submit" disabled={pending}>{pending ? "Đang đăng…" : "Đăng thông báo"}</Button></div>
          </form>
        ) : null}

        {detail.announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ban chưa có thông báo nào.</p>
        ) : (
          <ul className="space-y-3">
            {detail.announcements.map((item) => (
              <li key={item.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{item.title}</p>
                  {detail.canWriteContent ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => run(() => deleteCommitteeAnnouncement({ id: item.id }), "Đã xóa thông báo.")}
                    >
                      Xóa
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm">{item.content}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {item.authorName ?? "Ban điều hành"} · {formatDateTimeVi(item.publishedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Lịch họp">
        {detail.canWriteContent ? (
          <form onSubmit={submitMeeting} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="meeting-title">Nội dung buổi họp</Label>
              <Input id="meeting-title" name="title" required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-starts">Bắt đầu</Label>
              <Input id="meeting-starts" name="startsAt" type="datetime-local" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-ends">Kết thúc</Label>
              <Input id="meeting-ends" name="endsAt" type="datetime-local" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-location">Địa điểm</Label>
              <Input id="meeting-location" name="location" maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-note">Ghi chú</Label>
              <Input id="meeting-note" name="note" maxLength={2000} />
            </div>
            <div className="md:col-span-2"><Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Lưu lịch họp"}</Button></div>
          </form>
        ) : null}

        {detail.meetings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có buổi họp nào.</p>
        ) : (
          <ul className="divide-y divide-border">
            {detail.meetings.map((meeting) => (
              <li key={meeting.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{meeting.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTimeVi(meeting.startsAt)}
                    {meeting.endsAt ? ` – ${formatDateTimeVi(meeting.endsAt)}` : ""}
                    {meeting.location ? ` · ${meeting.location}` : ""}
                  </p>
                  {meeting.note ? <p className="mt-1 text-sm">{meeting.note}</p> : null}
                </div>
                {detail.canWriteContent ? (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => run(() => deleteCommitteeMeeting({ id: meeting.id }), "Đã xóa lịch họp.")}
                  >
                    Xóa
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Công việc tuần" description="Nội dung và checklist chung của Ban; chưa giao người phụ trách hay hạn chót.">
        {detail.canWriteContent ? (
          <form onSubmit={submitWeeklyPlan} className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="plan-week">Tuần bắt đầu (thứ Hai)</Label>
              <Input id="plan-week" name="weekStart" type="date" required defaultValue={mondayOf(new Date())} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-content">Nội dung công việc</Label>
              <textarea id="plan-content" name="content" maxLength={5000} className={textareaClassName} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-checklist">Checklist (mỗi dòng một việc)</Label>
              <textarea id="plan-checklist" name="checklist" className={textareaClassName} />
            </div>
            <div><Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Lưu công việc tuần"}</Button></div>
          </form>
        ) : null}

        {detail.weeklyPlans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có công việc tuần nào.</p>
        ) : (
          <ul className="space-y-3">
            {detail.weeklyPlans.map((plan) => (
              <li key={plan.id} className="rounded-md border border-border p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">Tuần {formatDateVi(plan.weekStart)}</p>
                  {detail.canWriteContent ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => run(() => deleteCommitteeWeeklyPlan({ id: plan.id }), "Đã xóa công việc tuần.")}
                    >
                      Xóa
                    </Button>
                  ) : null}
                </div>
                {plan.content ? <p className="mt-1 whitespace-pre-line text-sm">{plan.content}</p> : null}
                {plan.checklist.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-sm text-muted-foreground">
                    {plan.checklist.map((entry, index) => <li key={`${plan.id}-${index}`}>{entry}</li>)}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
