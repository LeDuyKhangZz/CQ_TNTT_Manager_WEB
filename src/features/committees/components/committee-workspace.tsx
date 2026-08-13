"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs, type TabItem } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeVi, formatDateVi, toDateTimeLocalVi } from "@/lib/dates";
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
  updateCommittee,
  updateCommitteeMemberPosition,
} from "../server/actions";
import type { CommitteeDetail, CommitteeMeeting, CommitteeMember } from "../server/queries";
import { WeeklyPlanEditor, type WeeklyPlanDraft } from "./weekly-plan-editor";

type ActionResult = { ok: boolean; message?: string };
type RunOptions = { form?: HTMLFormElement; onError?: () => void; onSuccess?: () => void };
type RunFn = (task: () => Promise<ActionResult>, successText: string, options?: RunOptions) => void;

type ConfirmConfig = {
  title: string;
  consequence: ReactNode;
  confirmLabel?: string;
  task: () => Promise<ActionResult>;
  successText: string;
};

type Message = { tone: "success" | "danger"; text: string } | null;

interface PanelProps {
  detail: CommitteeDetail;
  pending: boolean;
  run: RunFn;
  requestConfirm: (config: ConfirmConfig) => void;
}

// ─────────────────────────────────────────────────────────────────────────────

export function CommitteeWorkspace({
  detail,
  equipmentSlot,
}: {
  detail: CommitteeDetail;
  /** Bảng kho thiết bị dựng sẵn ở máy chủ; chỉ có với Ban giữ kho. */
  equipmentSlot?: ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<Message>(null);
  const [confirm, setConfirm] = useState<ConfirmConfig | null>(null);

  const run: RunFn = (task, successText, options) => {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setMessage({ tone: "success", text: successText });
        options?.form?.reset();
        options?.onSuccess?.();
        router.refresh();
      } else {
        setMessage({ tone: "danger", text: result.message ?? "Không thể xử lý yêu cầu." });
        options?.onError?.();
      }
    });
  };

  const requestConfirm = (config: ConfirmConfig) => setConfirm(config);

  const panelProps: PanelProps = { detail, pending, run, requestConfirm };

  const items: TabItem[] = [
    { id: "overview", label: "Tổng quan", content: <OverviewPanel {...panelProps} /> },
    {
      id: "members",
      label: `Thành viên (${detail.members.length})`,
      content: <MembersPanel {...panelProps} />,
    },
    { id: "announcements", label: "Thông báo", content: <AnnouncementsPanel {...panelProps} /> },
    { id: "meetings", label: "Lịch họp", content: <MeetingsPanel {...panelProps} /> },
    { id: "weekly", label: "Công việc tuần", content: <WeeklyPanel {...panelProps} /> },
  ];
  if (equipmentSlot) {
    items.push({ id: "equipment", label: "Thiết bị", content: equipmentSlot });
  }

  return (
    <div className="space-y-4">
      {/* Vùng phản hồi thao tác: giữ trên cùng để mọi tab dùng chung một chỗ báo
          kết quả (D-61). `aria-live` để trình đọc màn hình đọc ngay khi có. */}
      <div aria-live="polite">
        {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      </div>

      <Tabs items={items} label={`Nội dung ${detail.committee.name}`} />

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          const { task, successText } = confirm;
          setConfirm(null);
          run(task, successText);
        }}
        title={confirm?.title ?? ""}
        consequence={confirm?.consequence ?? ""}
        confirmLabel={confirm?.confirmLabel}
        pending={pending}
      />
    </div>
  );
}

// ── Tổng quan ────────────────────────────────────────────────────────────────

function OverviewPanel({ detail, pending, run }: PanelProps) {
  const { committee, members } = detail;
  const leaders = members.filter((m) => m.position === "leader");
  const deputies = members.filter((m) => m.position === "deputy");
  const [editing, setEditing] = useState(false);

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run(
      () => updateCommittee({
        id: committee.id,
        name: String(data.get("name") ?? ""),
        description: String(data.get("description") ?? "") || null,
        isActive: data.get("isActive") === "on",
        sortOrder: Number(data.get("sortOrder") ?? committee.sortOrder ?? 0),
      }),
      "Đã cập nhật thông tin Ban.",
      { onSuccess: () => setEditing(false) },
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              {/* Tên Ban đã là `<h1>` của PageHeader ngay trên; lặp lại nguyên
                  văn ở đây là đúng lỗi "hai tiêu đề trùng" mà 0.7 đã sửa cho vỏ.
                  Thẻ này mang một tiêu đề khác, đúng cấp `h2`. */}
              <CardTitle as="h2">Thông tin Ban</CardTitle>
              <CardDescription>
                {committee.memberCount} thành viên
                {committee.managesEquipment ? " · Quản lý kho thiết bị" : ""}
              </CardDescription>
            </div>
            <Badge variant={committee.isActive ? "success" : "outline"}>
              {committee.isActive ? "Đang hoạt động" : "Ngưng hoạt động"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {committee.description ? (
            <p className="text-sm text-ink">{committee.description}</p>
          ) : (
            <p className="text-sm text-ink-muted">Ban chưa có mô tả.</p>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-ink-muted">Trưởng ban</dt>
              <dd className="text-sm font-medium text-ink">
                {leaders.length > 0 ? leaders.map((m) => m.displayName).join(", ") : "Chưa có"}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-ink-muted">Phó ban</dt>
              <dd className="text-sm font-medium text-ink">
                {deputies.length > 0 ? deputies.map((m) => m.displayName).join(", ") : "Chưa có"}
              </dd>
            </div>
          </dl>

          {detail.canManageMembers ? (
            editing ? (
              <form onSubmit={submitEdit} className="grid gap-3 border-t border-line pt-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Tên Ban</Label>
                  <Input id="edit-name" name="name" required maxLength={120} defaultValue={committee.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-description">Mô tả</Label>
                  <Textarea id="edit-description" name="description" maxLength={1000} defaultValue={committee.description ?? ""} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="edit-sort">Thứ tự hiển thị</Label>
                    <Input id="edit-sort" name="sortOrder" type="number" min={0} max={32767} defaultValue={committee.sortOrder} />
                  </div>
                  <label className="flex items-center gap-2 pt-8 text-sm">
                    <input type="checkbox" name="isActive" defaultChecked={committee.isActive} className="size-4 rounded border-line-strong" />
                    Ban đang hoạt động
                  </label>
                </div>
                <p className="text-xs text-ink-muted">Mã Ban ({committee.code}) là khoá nghiệp vụ, không sửa được ở đây.</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Lưu thông tin Ban"}</Button>
                  <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={pending}>Hủy</Button>
                </div>
              </form>
            ) : (
              <div className="border-t border-line pt-4">
                <Button type="button" variant="outline" onClick={() => setEditing(true)}>Sửa thông tin Ban</Button>
              </div>
            )
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

// ── Thành viên ───────────────────────────────────────────────────────────────

function MembersPanel({ detail, pending, run, requestConfirm }: PanelProps) {
  const committeeId = detail.committee.id;

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
      { form },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Nhân sự</CardTitle>
        <CardDescription>Chức vụ Ban không thay vai trò chính của giáo lý viên.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail.members.length === 0 ? (
          <EmptyState
            title="Ban chưa có nhân sự"
            description={`Ban ${detail.committee.name} chưa có ai. Thêm giáo lý viên bằng biểu mẫu bên dưới.`}
          />
        ) : (
          <ul className="divide-y divide-line">
            {detail.members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                committeeName={detail.committee.name}
                canManage={detail.canManageMembers}
                pending={pending}
                run={run}
                requestConfirm={requestConfirm}
              />
            ))}
          </ul>
        )}

        {detail.canManageMembers ? (
          <form onSubmit={submitMember} className="grid gap-3 border-t border-line pt-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="add-staff">Thêm nhân sự</Label>
              <Select id="add-staff" name="staffProfileId" required placeholder="Chọn giáo lý viên" defaultValue="">
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
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-position">Chức vụ</Label>
              <Select id="add-position" name="position" defaultValue="member">
                {COMMITTEE_POSITIONS.map((position) => (
                  <option key={position} value={position}>{COMMITTEE_POSITION_LABELS[position]}</option>
                ))}
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Thêm vào Ban"}</Button>
            </div>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

/**
 * TB-M09-05: ô chức vụ là select CONTROLLED + nút "Lưu chức vụ" riêng, không còn
 * tự lưu khi vừa `onChange` (dễ đổi nhầm). Khi lưu lỗi thì khôi phục giá trị cũ.
 */
function MemberRow({
  member,
  committeeName,
  canManage,
  pending,
  run,
  requestConfirm,
}: {
  member: CommitteeMember;
  committeeName: string;
  canManage: boolean;
  pending: boolean;
  run: RunFn;
  requestConfirm: (config: ConfirmConfig) => void;
}) {
  const [position, setPosition] = useState<CommitteePosition>(member.position);
  // Nguồn sự thật là props từ server sau router.refresh(): đồng bộ lại khi đổi.
  useEffect(() => setPosition(member.position), [member.position]);
  const dirty = position !== member.position;

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">
          {member.displayName}{member.isSelf ? " (bạn)" : ""}
        </p>
        <p className="text-xs text-ink-muted">Từ ngày {formatDateVi(member.startsOn)}</p>
      </div>
      {canManage ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select
            className="w-auto"
            value={position}
            aria-label={`Chức vụ của ${member.displayName}`}
            disabled={pending}
            onChange={(event) => setPosition(event.target.value as CommitteePosition)}
          >
            {COMMITTEE_POSITIONS.map((option) => (
              <option key={option} value={option}>{COMMITTEE_POSITION_LABELS[option]}</option>
            ))}
          </Select>
          <Button
            variant="outline"
            size="sm"
            disabled={pending || !dirty}
            onClick={() => run(
              () => updateCommitteeMemberPosition({ membershipId: member.id, position }),
              `Đã đổi chức vụ của ${member.displayName} thành ${COMMITTEE_POSITION_LABELS[position]}.`,
              { onError: () => setPosition(member.position) },
            )}
          >
            Lưu chức vụ
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => requestConfirm({
              title: "Kết thúc nhiệm kỳ",
              consequence: (
                <>
                  Kết thúc nhiệm kỳ của <strong>{member.displayName}</strong> tại{" "}
                  <strong>{committeeName}</strong>? Lịch sử vẫn được giữ.
                </>
              ),
              confirmLabel: "Kết thúc nhiệm kỳ",
              task: () => endCommitteeMembership({ membershipId: member.id }),
              successText: `Đã kết thúc nhiệm kỳ của ${member.displayName}.`,
            })}
          >
            Kết thúc
          </Button>
        </div>
      ) : (
        <Badge variant="secondary">{COMMITTEE_POSITION_LABELS[member.position]}</Badge>
      )}
    </li>
  );
}

// ── Thông báo ────────────────────────────────────────────────────────────────

function AnnouncementsPanel({ detail, pending, run, requestConfirm }: PanelProps) {
  const committeeId = detail.committee.id;

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
      { form },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Thông báo Ban</CardTitle>
        <CardDescription>Chỉ Trưởng ban và Phó ban đăng nội dung.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {detail.canWriteContent ? (
          <form onSubmit={submitAnnouncement} className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Tiêu đề</Label>
              <Input id="announcement-title" name="title" required maxLength={200} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="announcement-content">Nội dung thông báo</Label>
              <Textarea id="announcement-content" name="content" required maxLength={5000} />
            </div>
            <div><Button type="submit" disabled={pending}>{pending ? "Đang đăng…" : "Đăng thông báo"}</Button></div>
          </form>
        ) : null}

        {detail.announcements.length === 0 ? (
          <EmptyState
            title="Chưa có thông báo"
            description={`Ban ${detail.committee.name} chưa đăng thông báo nào.`}
          />
        ) : (
          <ul className="space-y-3">
            {detail.announcements.map((item) => (
              <li key={item.id} className="rounded-md border border-line p-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium text-ink">{item.title}</p>
                  {detail.canWriteContent ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => requestConfirm({
                        title: "Xóa thông báo",
                        consequence: (
                          <>Xóa thông báo <strong>{item.title}</strong>? Thao tác này không hoàn tác được.</>
                        ),
                        confirmLabel: "Xóa thông báo",
                        task: () => deleteCommitteeAnnouncement({ id: item.id }),
                        successText: "Đã xóa thông báo.",
                      })}
                    >
                      Xóa
                    </Button>
                  ) : null}
                </div>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">{item.content}</p>
                <p className="mt-2 text-xs text-ink-muted">
                  {item.authorName ?? "Ban điều hành"} · {formatDateTimeVi(item.publishedAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ── Lịch họp ─────────────────────────────────────────────────────────────────

function MeetingsPanel({ detail, pending, run, requestConfirm }: PanelProps) {
  const committeeId = detail.committee.id;
  const [editing, setEditing] = useState<CommitteeMeeting | null>(null);

  const now = Date.now();
  const upcoming = detail.meetings
    .filter((m) => new Date(m.startsAt).getTime() >= now)
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
  const past = detail.meetings
    .filter((m) => new Date(m.startsAt).getTime() < now)
    .sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());

  function submitMeeting(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const startsAtLocal = String(data.get("startsAt") ?? "");
    if (!startsAtLocal) return;
    const editingId = editing?.id;
    run(
      () => saveCommitteeMeeting({
        committeeId,
        id: editingId,
        title: String(data.get("title") ?? ""),
        startsAt: new Date(startsAtLocal).toISOString(),
        endsAt: String(data.get("endsAt") ?? "") ? new Date(String(data.get("endsAt"))).toISOString() : null,
        location: String(data.get("location") ?? "") || null,
        note: String(data.get("note") ?? "") || null,
      }),
      editingId ? "Đã cập nhật lịch họp." : "Đã lưu lịch họp.",
      { form, onSuccess: () => setEditing(null) },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Lịch họp</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {detail.canWriteContent ? (
          // `key` theo bản đang sửa: đổi bản là React dựng lại form nên các ô
          // uncontrolled nạp đúng giá trị mới (cùng bài học với WeeklyPlanEditor).
          <form key={editing?.id ?? "new"} onSubmit={submitMeeting} className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="meeting-title">Nội dung buổi họp</Label>
              <Input id="meeting-title" name="title" required maxLength={200} defaultValue={editing?.title ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-starts">Bắt đầu</Label>
              <Input
                id="meeting-starts"
                name="startsAt"
                type="datetime-local"
                required
                defaultValue={editing ? toDateTimeLocalVi(editing.startsAt) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-ends">Kết thúc</Label>
              <Input
                id="meeting-ends"
                name="endsAt"
                type="datetime-local"
                defaultValue={editing?.endsAt ? toDateTimeLocalVi(editing.endsAt) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-location">Địa điểm</Label>
              <Input id="meeting-location" name="location" maxLength={200} defaultValue={editing?.location ?? ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meeting-note">Ghi chú</Label>
              <Input id="meeting-note" name="note" maxLength={2000} defaultValue={editing?.note ?? ""} />
            </div>
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu…" : editing ? "Cập nhật lịch họp" : "Lưu lịch họp"}
              </Button>
              {editing ? (
                <Button type="button" variant="outline" onClick={() => setEditing(null)} disabled={pending}>
                  Hủy sửa
                </Button>
              ) : null}
            </div>
          </form>
        ) : null}

        {detail.meetings.length === 0 ? (
          <EmptyState
            title="Chưa có buổi họp"
            description={`Ban ${detail.committee.name} chưa đặt lịch họp nào.`}
          />
        ) : (
          <div className="space-y-5">
            <MeetingGroup
              heading="Sắp diễn ra"
              meetings={upcoming}
              emptyText="Không có buổi họp nào sắp tới."
              canWrite={detail.canWriteContent}
              pending={pending}
              onEdit={setEditing}
              requestConfirm={requestConfirm}
            />
            <MeetingGroup
              heading="Đã qua"
              meetings={past}
              emptyText="Chưa có buổi họp nào đã diễn ra."
              canWrite={detail.canWriteContent}
              pending={pending}
              onEdit={setEditing}
              requestConfirm={requestConfirm}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MeetingGroup({
  heading,
  meetings,
  emptyText,
  canWrite,
  pending,
  onEdit,
  requestConfirm,
}: {
  heading: string;
  meetings: CommitteeMeeting[];
  emptyText: string;
  canWrite: boolean;
  pending: boolean;
  onEdit: (meeting: CommitteeMeeting) => void;
  requestConfirm: (config: ConfirmConfig) => void;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-ink">{heading}</h3>
      {meetings.length === 0 ? (
        <p className="mt-1 text-sm text-ink-muted">{emptyText}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {meetings.map((meeting) => (
            <li key={meeting.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-ink">{meeting.title}</p>
                <p className="text-xs text-ink-muted">
                  {formatDateTimeVi(meeting.startsAt)}
                  {meeting.endsAt ? ` – ${formatDateTimeVi(meeting.endsAt)}` : ""}
                  {meeting.location ? ` · ${meeting.location}` : ""}
                </p>
                {meeting.note ? <p className="mt-1 text-sm text-ink">{meeting.note}</p> : null}
              </div>
              {canWrite ? (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" disabled={pending} onClick={() => onEdit(meeting)}>
                    Sửa
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => requestConfirm({
                      title: "Xóa lịch họp",
                      consequence: (
                        <>Xóa buổi họp <strong>{meeting.title}</strong> ({formatDateTimeVi(meeting.startsAt)})? Thao tác này không hoàn tác được.</>
                      ),
                      confirmLabel: "Xóa lịch họp",
                      task: () => deleteCommitteeMeeting({ id: meeting.id }),
                      successText: "Đã xóa lịch họp.",
                    })}
                  >
                    Xóa
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── Công việc tuần ───────────────────────────────────────────────────────────

function WeeklyPanel({ detail, pending, run, requestConfirm }: PanelProps) {
  const committeeId = detail.committee.id;

  function saveWeeklyPlan(draft: WeeklyPlanDraft) {
    run(
      () => saveCommitteeWeeklyPlan({ committeeId, ...draft }),
      // D-61: câu báo nêu đúng tuần và phân biệt tạo với ghi đè.
      draft.expectedUpdatedAt
        ? `Đã cập nhật công việc tuần ${formatDateVi(draft.weekStart)}.`
        : `Đã tạo công việc tuần ${formatDateVi(draft.weekStart)}.`,
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">Công việc tuần</CardTitle>
        <CardDescription>
          Nội dung và checklist chung của Ban; chưa giao người phụ trách hay hạn chót.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <WeeklyPlanEditor
          plans={detail.weeklyPlans}
          canWrite={detail.canWriteContent}
          pending={pending}
          onSave={saveWeeklyPlan}
          onDelete={(plan) => requestConfirm({
            title: "Xóa công việc tuần",
            consequence: (
              <>Xóa công việc tuần <strong>{formatDateVi(plan.weekStart)}</strong>? Thao tác này không hoàn tác được.</>
            ),
            confirmLabel: "Xóa công việc tuần",
            task: () => deleteCommitteeWeeklyPlan({ id: plan.id }),
            successText: `Đã xóa công việc tuần ${formatDateVi(plan.weekStart)}.`,
          })}
        />
      </CardContent>
    </Card>
  );
}
