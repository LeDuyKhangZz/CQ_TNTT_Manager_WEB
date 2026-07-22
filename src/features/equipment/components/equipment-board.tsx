"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateTimeVi } from "@/lib/dates";
import {
  EQUIPMENT_CONDITIONS,
  EQUIPMENT_CONDITION_LABELS,
  EQUIPMENT_LOAN_STATUS_LABELS,
  type EquipmentCondition,
} from "../constants";
import { borrowEquipment, createEquipmentItem, returnEquipment, updateEquipmentItem } from "../server/actions";
import type { EquipmentBoardData, EquipmentItemRow } from "../server/queries";

const selectClassName = "h-11 min-h-11 w-full rounded-md border border-border bg-card px-3 text-sm";
type Message = { tone: "success" | "danger"; text: string } | null;

function ItemRow({
  item,
  board,
  canManageCatalog,
  canOperate,
  pending,
  run,
}: {
  item: EquipmentItemRow;
  board: EquipmentBoardData;
  canManageCatalog: boolean;
  canOperate: boolean;
  pending: boolean;
  run: (task: () => Promise<{ ok: boolean; message?: string }>, successText: string, form?: HTMLFormElement) => void;
}) {
  const [showBorrow, setShowBorrow] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  function submitBorrow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const expected = String(data.get("expectedReturnAt") ?? "");
    run(
      () => borrowEquipment({
        equipmentItemId: item.id,
        quantity: Number(data.get("quantity") ?? 1),
        borrowerStaffId: String(data.get("borrowerStaffId") ?? ""),
        expectedReturnAt: expected ? new Date(expected).toISOString() : null,
        note: String(data.get("note") ?? "") || null,
      }),
      "Đã ghi nhận lượt mượn.",
      form,
    );
    setShowBorrow(false);
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
    );
    setShowEdit(false);
  }

  return (
    <li className="rounded-md border border-border p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">{item.name} <span className="text-xs text-muted-foreground">({item.assetCode})</span></p>
          <p className="text-xs text-muted-foreground">
            Khả dụng {item.availableQuantity}/{item.totalQuantity}
            {item.category ? ` · ${item.category}` : ""}
            {item.storageLocation ? ` · ${item.storageLocation}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={item.condition === "good" ? "success" : item.condition === "needs_maintenance" ? "warning" : "danger"}>
            {EQUIPMENT_CONDITION_LABELS[item.condition]}
          </Badge>
          {!item.isActive ? <Badge variant="outline">Ngưng sử dụng</Badge> : null}
          {canOperate && item.isActive && item.availableQuantity > 0 ? (
            <Button size="sm" variant="outline" onClick={() => setShowBorrow((value) => !value)}>Cho mượn</Button>
          ) : null}
          {canManageCatalog ? (
            <Button size="sm" variant="ghost" onClick={() => setShowEdit((value) => !value)}>Sửa</Button>
          ) : null}
        </div>
      </div>

      {showBorrow ? (
        <form onSubmit={submitBorrow} className="mt-3 grid gap-3 border-t border-border pt-3 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium">Người mượn</span>
            <select name="borrowerStaffId" required className={selectClassName}>
              <option value="">Chọn người mượn</option>
              {board.borrowerOptions.map((option) => (
                <option key={option.id} value={option.id}>{option.displayName}</option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            <Label htmlFor={`quantity-${item.id}`}>Số lượng</Label>
            <Input id={`quantity-${item.id}`} name="quantity" type="number" min={1} max={item.availableQuantity} defaultValue={1} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`expected-${item.id}`}>Hẹn trả</Label>
            <Input id={`expected-${item.id}`} name="expectedReturnAt" type="datetime-local" />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`note-${item.id}`}>Ghi chú</Label>
            <Input id={`note-${item.id}`} name="note" maxLength={1000} />
          </div>
          <div className="md:col-span-2"><Button type="submit" disabled={pending}>Ghi nhận mượn</Button></div>
        </form>
      ) : null}

      {showEdit ? (
        <form onSubmit={submitEdit} className="mt-3 grid gap-3 border-t border-border pt-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`name-${item.id}`}>Tên thiết bị</Label>
            <Input id={`name-${item.id}`} name="name" defaultValue={item.name} required maxLength={200} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`category-${item.id}`}>Nhóm</Label>
            <Input id={`category-${item.id}`} name="category" defaultValue={item.category ?? ""} maxLength={100} />
          </div>
          <label className="space-y-2">
            <span className="text-sm font-medium">Tình trạng</span>
            <select name="condition" defaultValue={item.condition} className={selectClassName}>
              {EQUIPMENT_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>{EQUIPMENT_CONDITION_LABELS[condition]}</option>
              ))}
            </select>
          </label>
          <div className="space-y-2">
            <Label htmlFor={`location-${item.id}`}>Vị trí</Label>
            <Input id={`location-${item.id}`} name="storageLocation" defaultValue={item.storageLocation ?? ""} maxLength={200} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`itemnote-${item.id}`}>Ghi chú</Label>
            <Input id={`itemnote-${item.id}`} name="note" defaultValue={item.note ?? ""} maxLength={1000} />
          </div>
          <label className="flex min-h-11 items-center gap-2 text-sm md:col-span-2">
            <input type="checkbox" name="isActive" defaultChecked={item.isActive} /> Còn sử dụng
          </label>
          <div className="md:col-span-2"><Button type="submit" disabled={pending}>Lưu thiết bị</Button></div>
        </form>
      ) : null}
    </li>
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
  const [message, setMessage] = useState<Message>(null);

  function run(
    task: () => Promise<{ ok: boolean; message?: string }>,
    successText: string,
    form?: HTMLFormElement,
  ) {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (result.ok) {
        setMessage({ tone: "success", text: successText });
        form?.reset();
        router.refresh();
      } else {
        setMessage({ tone: "danger", text: result.message ?? "Không thể xử lý thao tác." });
      }
    });
  }

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
      form,
    );
  }

  function submitReturn(event: FormEvent<HTMLFormElement>, loanId: string) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const condition = String(data.get("condition") ?? "");
    run(
      () => returnEquipment({
        loanId,
        restoredQuantity: Number(data.get("restoredQuantity") ?? 0),
        condition: condition ? (condition as EquipmentCondition) : null,
        note: String(data.get("note") ?? "") || null,
      }),
      "Đã ghi nhận lượt trả.",
      form,
    );
  }

  const openLoans = board.loans.filter((loan) => loan.status === "borrowed");
  const closedLoans = board.loans.filter((loan) => loan.status === "returned");

  return (
    <div className="space-y-6">
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}

      <Card>
        <CardHeader>
          <CardTitle>Kho thiết bị</CardTitle>
          <CardDescription>Số lượng khả dụng chỉ thay đổi qua thao tác mượn/trả.</CardDescription>
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
                <Button type="submit" disabled={pending}>{pending ? "Đang lưu…" : "Thêm thiết bị"}</Button>
              </div>
            </form>
          ) : null}

          {board.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Kho chưa có thiết bị nào.</p>
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
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Đang mượn</CardTitle>
          <CardDescription>Ghi rõ ai mượn, lúc nào, ai bàn giao và ai nhận lại.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {openLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">Không có thiết bị nào đang được mượn.</p>
          ) : (
            openLoans.map((loan) => (
              <div key={loan.id} className="rounded-md border border-border p-3">
                <p className="text-sm font-medium">{loan.itemName} · {loan.quantity} cái</p>
                <p className="text-xs text-muted-foreground">
                  {loan.borrowerName} mượn lúc {formatDateTimeVi(loan.borrowedAt)}
                  {loan.expectedReturnAt ? ` · hẹn trả ${formatDateTimeVi(loan.expectedReturnAt)}` : ""}
                </p>
                {loan.borrowNote ? <p className="mt-1 text-sm">{loan.borrowNote}</p> : null}
                {canOperate ? (
                  <form onSubmit={(event) => submitReturn(event, loan.id)} className="mt-3 grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`restored-${loan.id}`}>Số lượng trả được</Label>
                      <Input id={`restored-${loan.id}`} name="restoredQuantity" type="number" min={0} max={loan.quantity} defaultValue={loan.quantity} required />
                    </div>
                    <label className="space-y-2">
                      <span className="text-sm font-medium">Tình trạng khi trả</span>
                      <select name="condition" defaultValue="" className={selectClassName}>
                        <option value="">Không đổi</option>
                        {EQUIPMENT_CONDITIONS.map((condition) => (
                          <option key={condition} value={condition}>{EQUIPMENT_CONDITION_LABELS[condition]}</option>
                        ))}
                      </select>
                    </label>
                    <div className="space-y-2">
                      <Label htmlFor={`returnnote-${loan.id}`}>Ghi chú</Label>
                      <Input id={`returnnote-${loan.id}`} name="note" maxLength={1000} />
                    </div>
                    <div className="md:col-span-3"><Button type="submit" disabled={pending}>Ghi nhận trả</Button></div>
                  </form>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {closedLoans.length > 0 ? (
        <Card>
          <CardHeader><CardTitle>Lịch sử mượn/trả</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y divide-border text-sm">
              {closedLoans.map((loan) => (
                <li key={loan.id} className="py-3">
                  <p className="font-medium">{loan.itemName} · {loan.quantity} cái</p>
                  <p className="text-xs text-muted-foreground">
                    {loan.borrowerName} · {EQUIPMENT_LOAN_STATUS_LABELS[loan.status]} lúc{" "}
                    {loan.returnedAt ? formatDateTimeVi(loan.returnedAt) : "—"}
                    {loan.restoredQuantity !== null && loan.restoredQuantity < loan.quantity
                      ? ` · thiếu ${loan.quantity - loan.restoredQuantity}`
                      : ""}
                    {loan.conditionOnReturn ? ` · ${EQUIPMENT_CONDITION_LABELS[loan.conditionOnReturn]}` : ""}
                  </p>
                  {loan.returnNote ? <p className="mt-1">{loan.returnNote}</p> : null}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
