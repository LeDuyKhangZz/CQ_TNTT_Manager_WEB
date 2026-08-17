"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Panel } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DateTimeField } from "@/components/ui/date-field";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { formatDateTimeVi } from "@/lib/dates";
import {
  EQUIPMENT_CONDITIONS,
  EQUIPMENT_CONDITION_LABELS,
  EQUIPMENT_LOAN_EVENT_LABELS,
  EQUIPMENT_LOAN_STATUS_LABELS,
  EQUIPMENT_STOCK_ADJUSTMENT_REASON_LABELS,
  EQUIPMENT_STOCK_DECREASE_REASONS,
  EQUIPMENT_STOCK_INCREASE_REASONS,
  type EquipmentCondition,
  type EquipmentStockAdjustmentReason,
} from "../constants";
import { describeLoanBalance } from "../loan-balance";
import {
  adjustEquipmentStock,
  borrowEquipment,
  createEquipmentItem,
  receiveEquipment,
  updateEquipmentItem,
  writeOffEquipment,
} from "../server/actions";
import type {
  EquipmentBoardData,
  EquipmentItemRow,
  EquipmentLoanRow,
} from "../server/queries";
import { useGlobalPending } from "@/components/loading/loading-provider";

type Message = { tone: "success" | "danger"; text: string } | null;
type ActionTask = () => Promise<{ ok: boolean; message?: string }>;

/** Chạy một thao tác ghi, kèm câu báo kết quả và việc dọn form sau khi xong. */
type RunAction = (
  task: ActionTask,
  successText: string,
  options?: { form?: HTMLFormElement; onSuccess?: () => void },
) => void;

/**
 * Yêu cầu xác nhận cho thao tác KHÔNG HOÀN TÁC ĐƯỢC.
 * `11` §5 bắt buộc nêu hậu quả **bằng tên riêng và con số thật**, không phải
 * "Bạn có chắc không?".
 */
type ConfirmRequest = {
  title: string;
  consequence: ReactNode;
  confirmLabel: string;
  task: ActionTask;
  successText: string;
  form?: HTMLFormElement;
  onSuccess?: () => void;
} | null;

type AskConfirm = (request: NonNullable<ConfirmRequest>) => void;

function conditionBadgeVariant(condition: EquipmentCondition) {
  if (condition === "good") return "success" as const;
  if (condition === "needs_maintenance") return "warning" as const;
  return "danger" as const;
}

/**
 * M09-B · TB-M09-04 — nhập thêm hoặc giảm tồn kho.
 *
 * Hai chiều là hai nút riêng chứ không phải một ô số có dấu âm: người trực kho
 * gõ "-2" nhầm thành "2" là mất hai cái thiết bị khỏi sổ mà không ai biết. Nhãn
 * nút, danh sách lý do và câu xác nhận đều nói rõ chiều nào.
 */
function StockAdjustForm({
  item,
  direction,
  pending,
  run,
  askConfirm,
  onDone,
}: {
  item: EquipmentItemRow;
  direction: "increase" | "decrease";
  pending: boolean;
  run: RunAction;
  askConfirm: AskConfirm;
  onDone: () => void;
}) {
  const increasing = direction === "increase";
  const reasons = increasing
    ? EQUIPMENT_STOCK_INCREASE_REASONS
    : EQUIPMENT_STOCK_DECREASE_REASONS;
  const idPrefix = `${direction}-${item.id}`;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const amount = Number(data.get("amount") ?? 0);
    const reason = String(data.get("reason") ?? "") as EquipmentStockAdjustmentReason;
    const note = String(data.get("note") ?? "").trim();
    const delta = increasing ? amount : -amount;
    const totalAfter = item.totalQuantity + delta;
    const task: ActionTask = () =>
      adjustEquipmentStock({
        equipmentItemId: item.id,
        delta,
        reason,
        note: note || null,
      });

    if (increasing) {
      run(task, `Đã nhập thêm ${amount} cái ${item.name}. Tổng kho nay là ${totalAfter}.`, {
        form,
        onSuccess: onDone,
      });
      return;
    }
    askConfirm({
      title: "Giảm tồn kho?",
      consequence: (
        <>
          Tổng kho của <strong>{item.name}</strong> giảm từ <strong>{item.totalQuantity}</strong>{" "}
          xuống <strong>{totalAfter}</strong>. Lý do:{" "}
          {EQUIPMENT_STOCK_ADJUSTMENT_REASON_LABELS[reason]}. Thao tác này không hoàn tác được.
        </>
      ),
      confirmLabel: `Giảm ${amount} cái`,
      task,
      successText: `Đã giảm ${amount} cái ${item.name}. Tổng kho nay là ${totalAfter}.`,
      form,
      onSuccess: onDone,
    });
  }

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 border-t border-line pt-3 md:grid-cols-3">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-amount`}>
          {increasing ? "Số cái nhập thêm" : "Số cái giảm bớt"}
        </Label>
        <Input
          id={`${idPrefix}-amount`}
          name="amount"
          type="number"
          min={1}
          max={increasing ? undefined : item.availableQuantity}
          defaultValue={1}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-reason`}>Lý do</Label>
        <Select id={`${idPrefix}-reason`} name="reason" defaultValue={reasons[0]} required>
          {reasons.map((reason) => (
            <option key={reason} value={reason}>
              {EQUIPMENT_STOCK_ADJUSTMENT_REASON_LABELS[reason]}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-note`}>
          {increasing ? "Ghi chú" : "Ghi chú (bắt buộc)"}
        </Label>
        <Input
          id={`${idPrefix}-note`}
          name="note"
          maxLength={1000}
          required={!increasing}
        />
      </div>
      <div className="md:col-span-3">
        <Button type="submit" variant={increasing ? "primary" : "danger"} pending={pending}>
          {increasing ? "Ghi nhận nhập thêm" : "Ghi nhận giảm tồn kho"}
        </Button>
      </div>
      {!increasing ? (
        <p className="text-xs text-ink-muted md:col-span-3">
          Chỉ giảm được tối đa {item.availableQuantity} cái đang có trong kho. Phần đang có người
          mượn phải chờ nhận lại hoặc báo hỏng/mất trên phiếu mượn.
        </p>
      ) : null}
    </form>
  );
}

function ItemRow({
  item,
  board,
  canManageCatalog,
  canOperate,
  pending,
  run,
  askConfirm,
}: {
  item: EquipmentItemRow;
  board: EquipmentBoardData;
  canManageCatalog: boolean;
  canOperate: boolean;
  pending: boolean;
  run: RunAction;
  askConfirm: AskConfirm;
}) {
  const [panel, setPanel] = useState<"borrow" | "edit" | "increase" | "decrease" | null>(null);

  function toggle(next: NonNullable<typeof panel>) {
    setPanel((current) => (current === next ? null : next));
  }

  function submitBorrow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const expected = String(data.get("expectedReturnAt") ?? "");
    const quantity = Number(data.get("quantity") ?? 1);
    run(
      () => borrowEquipment({
        equipmentItemId: item.id,
        quantity,
        borrowerStaffId: String(data.get("borrowerStaffId") ?? ""),
        expectedReturnAt: expected ? new Date(expected).toISOString() : null,
        note: String(data.get("note") ?? "") || null,
      }),
      `Đã ghi nhận lượt mượn ${quantity} cái ${item.name}.`,
      { form, onSuccess: () => setPanel(null) },
    );
  }

  function submitEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run(
      () => updateEquipmentItem({
        equipmentItemId: item.id,
        name: String(data.get("name") ?? ""),
        category: String(data.get("category") ?? "") || null,
        condition: String(data.get("condition") ?? "good") as EquipmentCondition,
        storageLocation: String(data.get("storageLocation") ?? "") || null,
        note: String(data.get("note") ?? "") || null,
        isActive: data.get("isActive") === "on",
      }),
      "Đã cập nhật thiết bị.",
      { onSuccess: () => setPanel(null) },
    );
  }

  return (
    <Panel as="li">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{item.name} <span className="text-xs text-ink-muted">({item.assetCode})</span></p>
          <p className="text-xs text-ink-muted">
            Khả dụng {item.availableQuantity}/{item.totalQuantity}
            {item.category ? ` · ${item.category}` : ""}
            {item.storageLocation ? ` · ${item.storageLocation}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={conditionBadgeVariant(item.condition)}>
            {EQUIPMENT_CONDITION_LABELS[item.condition]}
          </Badge>
          {!item.isActive ? <Badge variant="outline">Ngưng sử dụng</Badge> : null}
          {canOperate && item.isActive && item.availableQuantity > 0 ? (
            <Button size="sm" variant="outline" onClick={() => toggle("borrow")}>Cho mượn</Button>
          ) : null}
          {canManageCatalog ? (
            <>
              {/* TB-M09-04: sau khi M09-A khoá `total_quantity`, đây là đường
                  hợp lệ DUY NHẤT để tổng kho đổi ngoài phiếu mượn. */}
              <Button size="sm" variant="outline" onClick={() => toggle("increase")}>Nhập thêm</Button>
              <Button size="sm" variant="outline" onClick={() => toggle("decrease")}>Giảm tồn kho</Button>
              <Button size="sm" variant="ghost" onClick={() => toggle("edit")}>Sửa</Button>
            </>
          ) : null}
        </div>
      </div>

      {panel === "borrow" ? (
        <form onSubmit={submitBorrow} className="mt-3 grid gap-3 border-t border-line pt-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`borrower-${item.id}`}>Người mượn</Label>
            {/* D-94 · AC-M09-30: mọi nhân sự xứ đoàn, không chỉ thành viên Ban
                Kỹ thuật. Mã GLV đi kèm vì hai người trùng tên là chuyện thường. */}
            <Select
              id={`borrower-${item.id}`}
              name="borrowerStaffId"
              required
              defaultValue=""
              placeholder="Chọn người mượn"
            >
              {board.borrowerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.displayName} ({option.staffCode})
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`quantity-${item.id}`}>Số lượng</Label>
            <Input id={`quantity-${item.id}`} name="quantity" type="number" min={1} max={item.availableQuantity} defaultValue={1} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`expected-${item.id}`}>Hẹn trả</Label>
            <DateTimeField id={`expected-${item.id}`} name="expectedReturnAt" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`note-${item.id}`}>Ghi chú</Label>
            <Input id={`note-${item.id}`} name="note" maxLength={1000} />
          </div>
          <div className="md:col-span-2"><Button type="submit" pending={pending}>Ghi nhận mượn</Button></div>
        </form>
      ) : null}

      {panel === "increase" || panel === "decrease" ? (
        <StockAdjustForm
          item={item}
          direction={panel}
          pending={pending}
          run={run}
          askConfirm={askConfirm}
          onDone={() => setPanel(null)}
        />
      ) : null}

      {panel === "edit" ? (
        <form onSubmit={submitEdit} className="mt-3 grid gap-3 border-t border-line pt-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`name-${item.id}`}>Tên thiết bị</Label>
            <Input id={`name-${item.id}`} name="name" defaultValue={item.name} required maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`category-${item.id}`}>Nhóm</Label>
            <Input id={`category-${item.id}`} name="category" defaultValue={item.category ?? ""} maxLength={100} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`condition-${item.id}`}>Tình trạng</Label>
            <Select id={`condition-${item.id}`} name="condition" defaultValue={item.condition}>
              {EQUIPMENT_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>{EQUIPMENT_CONDITION_LABELS[condition]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`location-${item.id}`}>Vị trí</Label>
            <Input id={`location-${item.id}`} name="storageLocation" defaultValue={item.storageLocation ?? ""} maxLength={200} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`itemnote-${item.id}`}>Ghi chú</Label>
            <Input id={`itemnote-${item.id}`} name="note" defaultValue={item.note ?? ""} maxLength={1000} />
          </div>
          <Checkbox name="isActive" defaultChecked={item.isActive} labelClassName="flex md:col-span-2">
            Còn sử dụng
          </Checkbox>
          <div className="md:col-span-2"><Button type="submit" pending={pending}>Lưu thiết bị</Button></div>
        </form>
      ) : null}
    </Panel>
  );
}

/**
 * 🔴 TB-M09-02 PA A / AC-M09-25, AC-M09-26 — vì sao phải là HAI nút.
 *
 * Bản cũ có đúng một ô "Số lượng trả được". Điền 3 trên phiếu mượn 5 nghĩa là
 * *"3 cái về kho, 2 cái mất vĩnh viễn"* — phiếu đóng ngay và tổng kho tụt 2 mà
 * không hỏi ai một câu nào. Nhưng điều người trực kho thường muốn nói là *"hôm
 * nay mới mang về 3, còn 2 cái mai trả nốt"*. Một con số không phân biệt được
 * hai câu đó, nên mỗi lần trả dần là một lần tài sản bốc hơi khỏi sổ sách.
 *
 * Nay: "Nhận lại hàng" KHÔNG BAO GIỜ đụng tổng kho và để phiếu mở tới khi hết
 * nợ; "Báo hỏng/mất" là đường riêng, có hộp xác nhận đỏ nêu đúng con số (D-93 —
 * quyền vẫn là mọi thành viên Ban Kỹ thuật, nên hàng rào nằm ở chỗ này).
 */
function OpenLoanCard({
  loan,
  item,
  pending,
  run,
  askConfirm,
}: {
  loan: EquipmentLoanRow;
  item: EquipmentItemRow | undefined;
  pending: boolean;
  run: RunAction;
  askConfirm: AskConfirm;
}) {
  const [panel, setPanel] = useState<"receive" | "write_off" | null>(null);
  const totalQuantity = item?.totalQuantity ?? 0;

  function submitReceive(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const quantity = Number(data.get("quantity") ?? 0);
    const condition = String(data.get("condition") ?? "");
    const remaining = loan.outstandingQuantity - quantity;
    run(
      () => receiveEquipment({
        loanId: loan.id,
        quantity,
        condition: condition ? (condition as EquipmentCondition) : null,
        note: String(data.get("note") ?? "") || null,
      }),
      remaining > 0
        ? `Đã nhận lại ${quantity} cái ${loan.itemName}. Phiếu còn nợ ${remaining} cái.`
        : `Đã nhận lại ${quantity} cái ${loan.itemName}. Phiếu đã trả xong.`,
      { form, onSuccess: () => setPanel(null) },
    );
  }

  function submitWriteOff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const quantity = Number(data.get("quantity") ?? 0);
    const condition = String(data.get("condition") ?? "damaged") as EquipmentCondition;
    const note = String(data.get("note") ?? "").trim();
    const totalAfter = totalQuantity - quantity;
    askConfirm({
      title: "Báo hỏng/mất thiết bị?",
      consequence: (
        <>
          Ghi nhận <strong>{quantity}</strong> cái <strong>{loan.itemName}</strong> là{" "}
          {EQUIPMENT_CONDITION_LABELS[condition].toLowerCase()}. Tổng kho giảm từ{" "}
          <strong>{totalQuantity}</strong> xuống <strong>{totalAfter}</strong>. Thao tác này không
          hoàn tác được.
        </>
      ),
      confirmLabel: `Báo hỏng/mất ${quantity} cái`,
      task: () => writeOffEquipment({ loanId: loan.id, quantity, condition, note }),
      successText: `Đã báo hỏng/mất ${quantity} cái ${loan.itemName}. Tổng kho nay là ${totalAfter}.`,
      form,
      onSuccess: () => setPanel(null),
    });
  }

  return (
    <Panel>
      <p className="text-sm font-medium">{loan.itemName} · {describeLoanBalance(loan)}</p>
      <p className="text-xs text-ink-muted">
        {loan.borrowerName ? `${loan.borrowerName} mượn lúc ` : "Mượn lúc "}
        {formatDateTimeVi(loan.borrowedAt)}
        {loan.expectedReturnAt ? ` · hẹn trả ${formatDateTimeVi(loan.expectedReturnAt)}` : ""}
      </p>
      {loan.borrowNote ? <p className="mt-1 text-sm">{loan.borrowNote}</p> : null}
      {loan.events.length > 0 ? (
        <ul className="mt-2 space-y-1 text-2xs text-ink-muted">
          {loan.events.map((event) => (
            <li key={event.id}>
              {EQUIPMENT_LOAN_EVENT_LABELS[event.kind]} {event.quantity} cái lúc{" "}
              {formatDateTimeVi(event.createdAt)}
              {event.note ? ` — ${event.note}` : ""}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPanel((current) => (current === "receive" ? null : "receive"))}
        >
          Nhận lại hàng
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPanel((current) => (current === "write_off" ? null : "write_off"))}
        >
          Báo hỏng/mất
        </Button>
      </div>

      {panel === "receive" ? (
        <form onSubmit={submitReceive} className="mt-3 grid gap-3 border-t border-line pt-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`receive-qty-${loan.id}`}>Số cái nhận lại</Label>
            <Input
              id={`receive-qty-${loan.id}`}
              name="quantity"
              type="number"
              min={1}
              max={loan.outstandingQuantity}
              defaultValue={loan.outstandingQuantity}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`receive-condition-${loan.id}`}>Tình trạng khi nhận</Label>
            <Select id={`receive-condition-${loan.id}`} name="condition" defaultValue="">
              <option value="">Không đổi</option>
              {EQUIPMENT_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>{EQUIPMENT_CONDITION_LABELS[condition]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`receive-note-${loan.id}`}>Ghi chú</Label>
            <Input id={`receive-note-${loan.id}`} name="note" maxLength={1000} />
          </div>
          <div className="md:col-span-3">
            <Button type="submit" pending={pending}>Ghi nhận nhận lại</Button>
          </div>
          <p className="text-xs text-ink-muted md:col-span-3">
            Tổng kho không đổi. Phiếu chỉ đóng khi nhận đủ {loan.outstandingQuantity} cái còn nợ.
          </p>
        </form>
      ) : null}

      {panel === "write_off" ? (
        <form onSubmit={submitWriteOff} className="mt-3 grid gap-3 border-t border-line pt-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor={`writeoff-qty-${loan.id}`}>Số cái hỏng/mất</Label>
            <Input
              id={`writeoff-qty-${loan.id}`}
              name="quantity"
              type="number"
              min={1}
              max={loan.outstandingQuantity}
              defaultValue={loan.outstandingQuantity}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`writeoff-condition-${loan.id}`}>Tình trạng</Label>
            <Select id={`writeoff-condition-${loan.id}`} name="condition" defaultValue="damaged" required>
              {EQUIPMENT_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>{EQUIPMENT_CONDITION_LABELS[condition]}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`writeoff-note-${loan.id}`}>Ghi chú (bắt buộc)</Label>
            <Input id={`writeoff-note-${loan.id}`} name="note" maxLength={1000} required />
          </div>
          <div className="md:col-span-3">
            {/* Nhãn khác nút mở panel: hai nút cùng tên trên một màn hình là
                người dùng trình đọc màn hình nghe hai lần "Báo hỏng/mất" mà
                không biết cái nào mở form, cái nào ghi thật. */}
            <Button type="submit" variant="danger" pending={pending}>Ghi nhận hỏng/mất</Button>
          </div>
          <p className="text-xs text-ink-muted md:col-span-3">
            Tổng kho sẽ giảm và không hoàn tác được. Hệ thống hỏi lại một lần trước khi ghi.
          </p>
        </form>
      ) : null}
    </Panel>
  );
}

export function EquipmentBoard({
  committeeId,
  board,
  canManageCatalog,
  canOperate,
}: {
  committeeId: string;
  board: EquipmentBoardData;
  canManageCatalog: boolean;
  canOperate: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  useGlobalPending(pending);
  const [message, setMessage] = useState<Message>(null);
  const [confirm, setConfirm] = useState<ConfirmRequest>(null);

  const run: RunAction = (task, successText, options) => {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setMessage({ tone: "success", text: successText });
        options?.form?.reset();
        options?.onSuccess?.();
        router.refresh();
      } else {
        setMessage({ tone: "danger", text: result.message ?? "Không thể xử lý thao tác." });
      }
    });
  };

  const askConfirm: AskConfirm = (request) => setConfirm(request);

  function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    run(
      () => createEquipmentItem({
        committeeId,
        assetCode: String(data.get("assetCode") ?? ""),
        name: String(data.get("name") ?? ""),
        category: String(data.get("category") ?? "") || null,
        totalQuantity: Number(data.get("totalQuantity") ?? 1),
        storageLocation: String(data.get("storageLocation") ?? "") || null,
        note: String(data.get("note") ?? "") || null,
      }),
      "Đã thêm thiết bị vào kho.",
      { form },
    );
  }

  const itemById = new Map(board.items.map((item) => [item.id, item]));
  const openLoans = board.loans.filter((loan) => loan.status === "borrowed");
  const closedLoans = board.loans.filter((loan) => loan.status === "returned");

  return (
    <div className="space-y-6">
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <Card>
        <CardHeader>
          <CardTitle>Kho thiết bị</CardTitle>
          <CardDescription>
            Số lượng khả dụng chỉ thay đổi qua mượn/trả. Tổng kho chỉ thay đổi qua &ldquo;Nhập
            thêm&rdquo;, &ldquo;Giảm tồn kho&rdquo; hoặc &ldquo;Báo hỏng/mất&rdquo;.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {canManageCatalog ? (
            <form onSubmit={submitItem} className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="asset-code">Mã thiết bị</Label>
                <Input id="asset-code" name="assetCode" required maxLength={50} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-name">Tên thiết bị</Label>
                <Input id="asset-name" name="name" required maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-category">Nhóm</Label>
                <Input id="asset-category" name="category" maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-quantity">Tổng số lượng</Label>
                <Input id="asset-quantity" name="totalQuantity" type="number" min={0} defaultValue={1} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-location">Vị trí</Label>
                <Input id="asset-location" name="storageLocation" maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="asset-note">Ghi chú</Label>
                <Input id="asset-note" name="note" maxLength={1000} />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" pending={pending}>Thêm thiết bị</Button>
              </div>
            </form>
          ) : null}

          {board.items.length === 0 ? (
            <p className="text-sm text-ink-muted">Kho chưa có thiết bị nào.</p>
          ) : (
            <ul className="space-y-3">
              {board.items.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  board={board}
                  canManageCatalog={canManageCatalog}
                  canOperate={canOperate}
                  pending={pending}
                  run={run}
                  askConfirm={askConfirm}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đang mượn</CardTitle>
          <CardDescription>
            Nhận lại hàng nhiều lần được; phiếu chỉ đóng khi hết nợ.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {openLoans.length === 0 ? (
            <p className="text-sm text-ink-muted">Không có thiết bị nào đang được mượn.</p>
          ) : (
            openLoans.map((loan) =>
              canOperate ? (
                <OpenLoanCard
                  key={loan.id}
                  loan={loan}
                  item={itemById.get(loan.equipmentItemId)}
                  pending={pending}
                  run={run}
                  askConfirm={askConfirm}
                />
              ) : (
                <Panel key={loan.id}>
                  <p className="text-sm font-medium">{loan.itemName} · {describeLoanBalance(loan)}</p>
                  <p className="text-xs text-ink-muted">
                    {loan.borrowerName ? `${loan.borrowerName} mượn lúc ` : "Mượn lúc "}
                    {formatDateTimeVi(loan.borrowedAt)}
                  </p>
                </Panel>
              ),
            )
          )}
        </CardContent>
      </Card>

      {closedLoans.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Lịch sử mượn/trả</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-line text-sm">
              {closedLoans.map((loan) => (
                <li key={loan.id} className="py-3">
                  <p className="font-medium">{loan.itemName} · {describeLoanBalance(loan)}</p>
                  <p className="text-xs text-ink-muted">
                    {loan.borrowerName ? `${loan.borrowerName} · ` : ""}
                    {EQUIPMENT_LOAN_STATUS_LABELS[loan.status]} lúc{" "}
                    {loan.returnedAt ? formatDateTimeVi(loan.returnedAt) : "—"}
                    {loan.conditionOnReturn ? ` · ${EQUIPMENT_CONDITION_LABELS[loan.conditionOnReturn]}` : ""}
                  </p>
                  {loan.returnNote ? <p className="mt-1">{loan.returnNote}</p> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {board.adjustments.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nhật ký tổng kho</CardTitle>
            <CardDescription>Mọi lần nhập thêm hoặc giảm tồn kho ngoài phiếu mượn.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-line text-sm">
              {board.adjustments.map((adjustment) => (
                <li key={adjustment.id} className="py-3">
                  {/* Dấu +/- kèm chữ "tăng"/"giảm": không dùng màu làm tín hiệu duy nhất. */}
                  <p className="font-medium">
                    {adjustment.itemName} · {adjustment.delta > 0 ? "tăng" : "giảm"}{" "}
                    {Math.abs(adjustment.delta)} cái → tổng kho {adjustment.totalAfter}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {EQUIPMENT_STOCK_ADJUSTMENT_REASON_LABELS[adjustment.reason]} ·{" "}
                    {formatDateTimeVi(adjustment.createdAt)}
                    {adjustment.note ? ` — ${adjustment.note}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return;
          const request = confirm;
          setConfirm(null);
          run(request.task, request.successText, {
            form: request.form,
            onSuccess: request.onSuccess,
          });
        }}
        title={confirm?.title ?? ""}
        consequence={confirm?.consequence ?? ""}
        confirmLabel={confirm?.confirmLabel ?? "Xác nhận"}
        pending={pending}
      />
    </div>
  );
}
