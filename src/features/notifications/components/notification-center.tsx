"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTimeVi } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  NOTIFICATION_LINK_ROUTES,
  NOTIFICATION_TARGETS_NEEDING_ID,
  NOTIFICATION_TARGET_LABELS,
  type NotificationTargetType,
} from "../constants";
import { INBOX_FILTERS, INBOX_PAGE_SIZE } from "../inbox";
import { markAllFeedback, publishFeedback, type PublishFeedbackTone } from "../publish-feedback";
import { publishConfirmation, sendButtonLabel } from "../publish-preview";
import {
  markAllNotificationsRead,
  markNotificationRead,
  previewNotificationAudience,
  publishNotification,
  retractNotification,
  searchNotificationRecipients,
} from "../server/actions";
import type { NotificationsPageData, SentNotification } from "../server/queries";
import { useGlobalPending } from "@/components/loading/loading-provider";

/**
 * D-165 — mã chống gửi đúp, sinh **một lần cho mỗi lượt soạn**.
 *
 * Sinh lại ở mỗi lần bấm thì mã trở nên vô nghĩa: hai cú bấm là hai mã, tức hai
 * thông báo — đúng thứ nó sinh ra để chặn. Chỉ sau khi gửi **thành công** mới
 * cấp mã mới, để lượt soạn tiếp theo không bị máy chủ coi là bản lặp.
 */
function newRequestId(): string | null {
  if (typeof crypto === "undefined" || typeof crypto.randomUUID !== "function") return null;
  return crypto.randomUUID();
}

interface DraftForConfirm {
  title: string;
  content: string;
  targetId: string | null;
  linkPath: string | null;
  form: HTMLFormElement;
}

// M10-C — bốn thẻ `<select>` trần với chuỗi class chép tay đã đi hết sang
// component `Select` của design system (`09` §10 · `11` §5 *"không `<select>`
// native mới"*), và `<textarea>` trần sang `Textarea`. Cả hai chuỗi class cũ
// còn viết `border-border`/`bg-card` — bí danh token **cũ** từ trước mục 0.2.
type Message = { tone: PublishFeedbackTone; text: string } | null;

export function NotificationCenter({ data }: { data: NotificationsPageData }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  useGlobalPending(pending);
  /** Dòng vừa gửi trong phiên này, chèn tay cho tới khi máy chủ trả về bản của nó. */
  const [justSent, setJustSent] = useState<SentNotification[]>([]);
  const [message, setMessage] = useState<Message>(null);
  const [targetType, setTargetType] = useState<NotificationTargetType>("class");

  const [targetId, setTargetId] = useState("");
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftForConfirm | null>(null);
  const [people, setPeople] = useState<{ id: string; label: string }[]>([]);
  const [personQuery, setPersonQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [retracting, setRetracting] = useState<SentNotification | null>(null);
  const [retractReason, setRetractReason] = useState("");
  // Lỗi của bước thu hồi phải hiện **trong hộp thoại**, không phải ở đầu trang:
  // hộp thoại đang che nội dung phía sau, nên một câu lỗi đặt ngoài là một câu
  // lỗi người dùng **không nhìn thấy** — họ bấm lại và hỏng y nguyên.
  const [retractError, setRetractError] = useState<string | null>(null);
  const requestIdRef = useRef<string | null>(newRequestId());

  const { publishOptions } = data;
  const availableTargets = useMemo(() => {
    const targets: NotificationTargetType[] = [];
    if (publishOptions.canPublishGlobal) targets.push("all", "guardians", "students");
    if (publishOptions.sectors.length > 0) targets.push("sector");
    if (publishOptions.classes.length > 0) targets.push("class");
    if (publishOptions.committees.length > 0) targets.push("committee");
    // TB-M10-03 — phạm vi "Một người" cuối cùng cũng có đường vào.
    if (publishOptions.canPublishUser) targets.push("user");
    return targets;
  }, [publishOptions]);

  const targetOptions = targetType === "sector"
    ? publishOptions.sectors
    : targetType === "class"
      ? publishOptions.classes
      : targetType === "committee"
        ? publishOptions.committees
        : targetType === "user"
          ? people
          : [];

  const needsTargetId = NOTIFICATION_TARGETS_NEEDING_ID.includes(targetType);
  const targetLabel = targetOptions.find((option) => option.id === targetId)?.label ?? null;
  const confirmation = publishConfirmation({ targetType, targetLabel, audienceCount });

  // Danh sách "Tôi đã gửi" = dòng chèn tay của phiên này + dòng từ máy chủ.
  // 🔴 **Máy chủ THẮNG khi trùng `id`**: bản của máy chủ mang số người nhận đã
  // chốt và nhãn thu hồi thật. Giữ bản chèn tay đè lên nó là dựng sẵn một màn
  // hình nói dối vào ngày dữ liệu hai bên lệch nhau.
  const sentList = useMemo(() => {
    const serverIds = new Set(data.sent.map((item) => item.id));
    return [...justSent.filter((item) => !serverIds.has(item.id)), ...data.sent];
  }, [data.sent, justSent]);

  // TB-M10-04 — đếm người nhận ngay khi phạm vi + đối tượng đã đủ. Thụ động:
  // không thêm bước nào cho người dùng, và lỗi thì chỉ ẩn con số đi.
  useEffect(() => {
    if (needsTargetId && !targetId) {
      setAudienceCount(null);
      return;
    }
    let cancelled = false;
    setAudienceCount(null);
    void previewNotificationAudience({
      targetType,
      targetId: needsTargetId ? targetId : null,
    }).then((result) => {
      if (!cancelled && result.ok) setAudienceCount(result.data.count);
    });
    return () => { cancelled = true; };
  }, [targetType, targetId, needsTargetId]);

  const runSearch = useCallback((query: string) => {
    setPersonQuery(query);
    if (query.trim().length < 2) {
      setPeople([]);
      return;
    }
    setSearching(true);
    void searchNotificationRecipients({ query }).then((result) => {
      setSearching(false);
      if (result.ok) setPeople(result.data.people);
    });
  }, []);

  // AC-06-01 — bấm "Gửi" mở hộp xem lại, chưa gửi gì cả.
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setMessage(null);
    setDraft({
      title: String(formData.get("title") ?? ""),
      content: String(formData.get("content") ?? ""),
      targetId: needsTargetId ? targetId || null : null,
      linkPath: String(formData.get("linkPath") ?? "") || null,
      form,
    });
  }

  function confirmSend() {
    if (!draft) return;
    setPending(true);
    void (async () => {
      try {
      const result = await publishNotification({
        title: draft.title,
        content: draft.content,
        targetType,
        targetId: draft.targetId,
        linkPath: draft.linkPath,
        requestId: requestIdRef.current,
      });
      setDraft(null);
      if (result.ok) {
        // AC-02-01/02 — nói ra số người nhận **thật**, và ca 0 người không được
        // trông giống một lần gửi thành công bình thường.
        const feedback = publishFeedback(result.data.recipientCount);
        setMessage({ tone: feedback.tone, text: feedback.text });
        if (feedback.resetForm) {
          draft.form.reset();
          setTargetId("");
          setPeople([]);
          setPersonQuery("");
          // Lượt soạn mới cần mã mới, nếu không máy chủ coi nó là bản lặp của
          // lượt vừa rồi và trả lại thông báo cũ — im lặng nuốt mất bản mới.
          requestIdRef.current = newRequestId();
        }
        // 🔴 Chèn ngay dòng vừa gửi vào "Tôi đã gửi" — P3-UX-001.
        //
        // Vì sao không chờ `router.refresh()`: **đã đo**. Bài E2E D-166 chờ đủ
        // 15 giây mà mục ấy vẫn là danh sách cũ, và trả lại `revalidatePath`
        // trong action cũng không đổi được gì. Đây không phải "giấu lỗi bằng
        // giao diện": `id` dùng ở đây là id **thật** mà máy chủ vừa trả về, nên
        // nút "Thu hồi" trên dòng này gọi đúng bản ghi đó. Khi dữ liệu máy chủ
        // về, bản của máy chủ thắng — xem `sentList` bên dưới.
        //
        // Cái còn nợ: **vì sao** `router.refresh()` không mang dòng mới xuống
        // thì chưa tìm ra. Ghi vào WORKLOG, không giả vờ là đã hiểu.
        setJustSent((current) => [
          {
            id: result.data.id,
            title: draft.title,
            publishedAt: new Date().toISOString(),
            targetType,
            recipientCount: result.data.recipientCount,
            retractedAt: null,
            retractReason: null,
          },
          ...current.filter((item) => item.id !== result.data.id),
        ]);
        router.refresh();
      } else {
        setMessage({ tone: "danger", text: result.message });
      }
      } finally {
        setPending(false);
      }
    })();
  }

  function confirmRetract() {
    if (!retracting) return;
    const target = retracting;
    setRetractError(null);
    setPending(true);
    void (async () => {
      try {
      const result = await retractNotification({
        notificationId: target.id,
        reason: retractReason,
      });
      if (result.ok) {
        setRetracting(null);
        setMessage({
          tone: "success",
          // Dấu ngoặc kép cong là quy ước sẵn có của các câu phản hồi trong
          // repo (`promotion-board` · `gradebook-editor` · `teaching-plan-editor`).
          text: `Đã thu hồi “${target.title}”. ${result.data.recipientCount} người sẽ thấy nhãn “Đã thu hồi”.`,
        });
        // Dòng chèn tay cũng phải mang nhãn "Đã thu hồi", nếu không màn hình nói
        // hai điều ngược nhau: câu phản hồi bảo đã thu hồi, dòng ngay dưới thì không.
        setJustSent((current) =>
          current.map((item) =>
            item.id === target.id
              ? { ...item, retractedAt: new Date().toISOString(), retractReason: retractReason }
              : item,
          ),
        );
        router.refresh();
      } else {
        // Hộp thoại **ở lại mở**: đóng nó đi là bắt người dùng mở lại rồi gõ lại
        // từ đầu đúng thứ họ vừa gõ.
        setRetractError(result.message);
      }
      } finally {
        setPending(false);
      }
    })();
  }

  function markRead(notificationId: string) {
    setMessage(null);
    setPending(true);
    void (async () => {
      try {
      const result = await markNotificationRead({ notificationId });
      // Đánh dấu đã đọc mà thất bại thầm lặng thì badge cứ đứng yên và người
      // dùng không hiểu vì sao — luôn hiện lỗi.
      if (!result.ok) setMessage({ tone: "danger", text: result.message });
      router.refresh();
      } finally {
        setPending(false);
      }
    })();
  }

  function markAll() {
    setMessage(null);
    setPending(true);
    void (async () => {
      try {
      const result = await markAllNotificationsRead();
      // SW-04: RPC trả về số dòng đã đổi từ Phase 6 nhưng chỗ này vứt đi, nên
      // bấm xong không có gì nói rằng nó đã làm được việc gì.
      if (result.ok) {
        const feedback = markAllFeedback(result.data.count);
        setMessage({ tone: feedback.tone, text: feedback.text });
      } else {
        setMessage({ tone: "danger", text: result.message });
      }
      router.refresh();
      } finally {
        setPending(false);
      }
    })();
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
                <Select
                  value={targetType}
                  onChange={(event) => {
                    setTargetType(event.target.value as NotificationTargetType);
                    // Đối tượng của phạm vi cũ không còn nghĩa gì ở phạm vi mới;
                    // giữ lại là gửi nhầm chỗ mà biểu mẫu trông vẫn hợp lệ.
                    setTargetId("");
                  }}
                >
                  {availableTargets.map((target) => (
                    <option key={target} value={target}>{NOTIFICATION_TARGET_LABELS[target]}</option>
                  ))}
                </Select>
              </label>
              {targetType === "user" ? (
                <div className="space-y-2">
                  <Label htmlFor="notification-person">Tìm người nhận</Label>
                  <Input
                    id="notification-person"
                    type="search"
                    autoComplete="off"
                    placeholder="Gõ tên hoặc tên đăng nhập"
                    value={personQuery}
                    onChange={(event) => runSearch(event.target.value)}
                  />
                  <Select
                    aria-label="Người nhận"
                    value={targetId}
                    required
                    onChange={(event) => setTargetId(event.target.value)}
                  >
                    <option value="">
                      {searching
                        ? "Đang tìm…"
                        : people.length === 0
                          ? "Gõ ít nhất 2 ký tự để tìm"
                          : "Chọn người nhận"}
                    </option>
                    {people.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </Select>
                  {targetId ? (
                    <p className="text-xs text-ink-muted">
                      Gửi riêng cho {targetLabel}. Chỉ người này nhìn thấy.
                    </p>
                  ) : null}
                </div>
              ) : needsTargetId ? (
                <label className="space-y-2">
                  <span className="text-sm font-medium">Đối tượng nhận</span>
                  <Select
                    value={targetId}
                    required
                    onChange={(event) => setTargetId(event.target.value)}
                  >
                    <option value="">Chọn đối tượng</option>
                    {targetOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.label}</option>
                    ))}
                  </Select>
                </label>
              ) : null}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notification-title">Tiêu đề</Label>
                <Input id="notification-title" name="title" required maxLength={200} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="notification-content">Nội dung</Label>
                <Textarea id="notification-content" name="content" required maxLength={5000} />
              </div>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Liên kết kèm theo (tùy chọn)</span>
                <Select name="linkPath" defaultValue="">
                  <option value="">Không kèm liên kết</option>
                  {NOTIFICATION_LINK_ROUTES.map((route) => (
                    <option key={route} value={route}>{route}</option>
                  ))}
                </Select>
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={pending}>
                  {sendButtonLabel(audienceCount, pending)}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {/*
        AC-06-01 — xem lại trước khi gửi. Hộp này nêu **phạm vi bằng tên riêng**,
        **số người nhận dự kiến** và **nội dung**, kèm cảnh báo không lùi được.
      */}
      <ConfirmDialog
        open={draft !== null}
        onClose={() => setDraft(null)}
        onConfirm={confirmSend}
        pending={pending}
        tone={confirmation.emptyAudience ? "danger" : "primary"}
        title={confirmation.heading}
        confirmLabel={confirmation.confirmLabel}
        cancelLabel="Quay lại sửa"
        consequence={
          <span className="block space-y-2">
            <span className="block">{confirmation.scopeLine}</span>
            {draft ? (
              <span className="block rounded-md border border-border bg-surface-muted p-3">
                <span className="block font-semibold">{draft.title}</span>
                <span className="mt-1 block whitespace-pre-line text-sm">{draft.content}</span>
              </span>
            ) : null}
            <span className="block font-medium">{confirmation.warning}</span>
          </span>
        }
      />

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle>Hộp thư của tôi</CardTitle>
              <CardDescription>{data.unreadCount} thông báo chưa đọc</CardDescription>
            </div>
            {data.unreadCount > 0 ? (
              <Button variant="outline" disabled={pending} onClick={markAll}>Đánh dấu tất cả đã đọc</Button>
            ) : null}
          </div>
          {/*
            `docs/06` §14 đòi bộ lọc này từ đầu; trước M10-C thì chưa có. Dựng
            bằng `<Link>` để chép được đường dẫn và chạy được không cần JS.
          */}
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Lọc hộp thư">
            {INBOX_FILTERS.map((value) => (
              <Link
                key={value}
                href={value === "all" ? "/notifications" : `/notifications?filter=${value}`}
                aria-current={data.filter === value ? "page" : undefined}
                className={cn(
                  "grid min-h-control place-items-center rounded-md border px-4 text-sm",
                  data.filter === value
                    ? "border-theme-accent bg-theme-tint font-semibold text-theme-accent-text"
                    : "border-border text-ink-muted hover:bg-surface-muted",
                )}
              >
                {value === "all" ? "Tất cả" : "Chưa đọc"}
              </Link>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {data.inbox.length === 0 ? (
            // `11` §5 — trạng thái rỗng dùng **đúng một trong ba loại chuẩn**,
            // không phải một dòng chữ xám. Loại `no-data`: dữ liệu chưa có,
            // không phải ngoài phạm vi và không phải chưa liên kết tài khoản.
            // Hai ca rỗng nói **hai câu khác nhau** — "đã đọc hết" và "chưa có
            // gì" là hai tình huống khác hẳn nhau với người dùng.
            <EmptyState
              variant="no-data"
              className="border-0 shadow-none"
              title={data.filter === "unread" ? "Bạn đã đọc hết thông báo" : "Hộp thư còn trống"}
              description={
                data.filter === "unread"
                  ? "Không còn thông báo nào chưa đọc dành cho bạn. Bấm “Tất cả” để xem lại những thông báo đã đọc."
                  : "Chưa có thông báo nào được gửi tới bạn. Khi xứ đoàn, ngành hoặc lớp của bạn gửi thông báo, nó sẽ hiện ở đây."
              }
              action={
                data.filter === "unread" ? (
                  <Link href="/notifications" className="text-sm text-primary hover:underline">
                    Xem tất cả thông báo
                  </Link>
                ) : null
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.inbox.map((item) => (
                // `data-testid` để bài E2E đếm ĐÚNG dòng hộp thư: `getByRole
                // ("listitem")` gom cả mục điều hướng ở vỏ và danh sách "Tôi đã
                // gửi", nên con số nó trả về không nói lên điều gì.
                <li key={item.id} data-testid="inbox-item" className="py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={cn("font-medium", item.retracted && "text-ink-muted")}>
                        {item.title}
                        {item.readAt === null && !item.retracted ? (
                          <span className="ml-2 align-middle"><Badge>Mới</Badge></span>
                        ) : null}
                        {item.retracted ? (
                          <span className="ml-2 align-middle"><Badge variant="danger">Đã thu hồi</Badge></span>
                        ) : null}
                      </p>
                      <p className="mt-1 whitespace-pre-line text-sm">{item.content}</p>
                      <p className="mt-2 text-xs text-ink-muted">
                        {/*
                          Chip phạm vi mang **tên phạm vi bằng chữ**, không phải
                          chỉ một mảng màu — `11` §5 cấm dùng màu làm tín hiệu
                          duy nhất.
                        */}
                        {item.targetType ? (
                          <span className="mr-2 rounded-full border border-border px-2 py-0.5">
                            {NOTIFICATION_TARGET_LABELS[item.targetType]}
                          </span>
                        ) : null}
                        {formatDateTimeVi(item.publishedAt)}
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

          {data.inboxTotal > INBOX_PAGE_SIZE ? (
            <Pagination
              className="mt-4"
              page={data.page}
              pageSize={INBOX_PAGE_SIZE}
              totalItems={data.inboxTotal}
              itemLabel="thông báo"
              buildHref={(page) => {
                const query = new URLSearchParams();
                if (data.filter !== "all") query.set("filter", data.filter);
                if (page > 1) query.set("page", String(page));
                const suffix = query.toString();
                return suffix ? `/notifications?${suffix}` : "/notifications";
              }}
            />
          ) : null}
        </CardContent>
      </Card>

      {sentList.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Tôi đã gửi</CardTitle>
            <CardDescription>
              Xem lại thông báo mình đã gửi, kèm số người nhận thật. Gửi nhầm thì thu hồi ở đây.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {sentList.map((item) => (
                <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <p className={cn("font-medium", item.retractedAt && "text-ink-muted line-through")}>
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      <span className="mr-2 rounded-full border border-border px-2 py-0.5">
                        {NOTIFICATION_TARGET_LABELS[item.targetType]}
                      </span>
                      {formatDateTimeVi(item.publishedAt)} · {item.recipientCount} người nhận
                    </p>
                    {item.retractedAt ? (
                      <p className="mt-1 text-xs text-danger">
                        Đã thu hồi {formatDateTimeVi(item.retractedAt)} — {item.retractReason}
                      </p>
                    ) : null}
                  </div>
                  {item.retractedAt ? null : (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pending}
                      onClick={() => {
                        setRetractReason("");
                        setRetractError(null);
                        setRetracting(item);
                      }}
                    >
                      Thu hồi
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {/*
        D-166 — thu hồi. Hộp này KHÔNG phải bản sao của hộp "Gửi thông báo":
        ở đó người ta xác nhận một việc sắp làm, ở đây họ phải **viết ra lý do**,
        và chính lý do ấy là thứ thay cho giới hạn thời gian mà chủ dự án đã bỏ.
      */}
      <ConfirmDialog
        open={retracting !== null}
        onClose={() => setRetracting(null)}
        onConfirm={confirmRetract}
        pending={pending}
        title="Thu hồi thông báo?"
        confirmLabel="Thu hồi"
        cancelLabel="Không thu hồi"
        consequence={
          <span className="block space-y-2">
            <span className="block">
              {retracting
                ? `"${retracting.title}" đã tới ${retracting.recipientCount} người. `
                  + "Họ sẽ thấy dòng \"Thông báo này đã được thu hồi\" thay cho nội dung — "
                  + "nhưng ai đã đọc rồi thì đã đọc rồi."
                : ""}
            </span>
            <span className="block">
              <Label htmlFor="retract-reason">Lý do thu hồi (bắt buộc)</Label>
              <Input
                id="retract-reason"
                value={retractReason}
                maxLength={500}
                onChange={(event) => setRetractReason(event.target.value)}
                placeholder="Ví dụ: gửi nhầm lớp"
                aria-invalid={retractError ? true : undefined}
                aria-describedby={retractError ? "retract-reason-error" : undefined}
              />
              <FormMessage id="retract-reason-error">{retractError}</FormMessage>
            </span>
            <span className="block text-ink-muted">
              Lý do này được lưu lại cùng tên bạn và không xoá được.
            </span>
          </span>
        }
      />
    </div>
  );
}
