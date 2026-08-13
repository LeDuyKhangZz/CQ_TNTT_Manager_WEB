// @vitest-environment node
/**
 * M09-A · SEC-M09-14 — hai phiên cùng mượn cái CUỐI CÙNG.
 *
 * `03_AUDIT_RESULTS.md` §2 câu 7 kết luận luồng này "ĐẠT" dựa trên lập luận:
 * `borrow_equipment` khoá dòng bằng `select … for update` trước khi đọc
 * `available_quantity`, nên phiên thứ hai phải đợi rồi đọc lại bản mới. Lập luận
 * đúng — nhưng `08_ACCEPTANCE_CRITERIA.md` xếp SEC-M09-14 là 🟠 **CHƯA CÓ TEST**,
 * và một hàng rào chống tranh chấp chưa từng bị bắn thử thì chưa phải hàng rào.
 *
 * Bài này bắn thật: hai phiên đăng nhập bằng **JWT vai trò thật** (không service
 * role, `CLAUDE.md` §4) gọi RPC đồng thời trên một thiết bị chỉ còn đúng 1 cái.
 *
 * Chạy sau `db:reset` + `seed:dev`:
 *   M09_DB=1 npx vitest run tests/integration/m09-equipment-concurrency.test.ts
 *
 * Mặc định bài này **skip** — cùng khuôn với `gate-phase2-*`: bộ unit test phải
 * chạy được trên máy không có Docker.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Database } from "../../src/types/database";

function loadEnvLocal() {
  const file = path.resolve(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2];
  }
}
loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const enabled =
  process.env.M09_DB === "1" &&
  Boolean(anonKey && serviceKey) &&
  /^https?:\/\/(127\.0\.0\.1|localhost)(:|$)/.test(url);
const describeDb = enabled ? describe : describe.skip;

const DEV_PASSWORD = "123456";
const COMMITTEE_KY_THUAT = "30000000-0000-0000-0000-000000000002";
const ASSET_CODE = "M09A-RACE-01";

describeDb("M09-A · SEC-M09-14 — tranh chấp cái cuối cùng", () => {
  const domain = process.env.INTERNAL_AUTH_DOMAIN || "choquan.internal";
  const admin = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let itemId = "";
  let borrowerStaffId = "";

  async function sessionFor(staffCode: string): Promise<SupabaseClient<Database>> {
    const client = createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await client.auth.signInWithPassword({
      email: `${staffCode.toLowerCase()}@staff.${domain}`,
      password: DEV_PASSWORD,
    });
    if (error) throw new Error(`Đăng nhập ${staffCode}: ${error.message}`);
    return client;
  }

  async function removeFixture() {
    const { data } = await admin
      .from("equipment_items")
      .select("id")
      .eq("asset_code", ASSET_CODE)
      .maybeSingle();
    if (!data) return;
    // `equipment_loans` và `equipment_stock_adjustments` (M09-B) tham chiếu
    // thiết bị bằng ON DELETE RESTRICT; nhật ký kho cố ý không cascade.
    await admin.from("equipment_stock_adjustments").delete().eq("equipment_item_id", data.id);
    await admin.from("equipment_loans").delete().eq("equipment_item_id", data.id);
    await admin.from("equipment_items").delete().eq("id", data.id);
  }

  beforeAll(async () => {
    await removeFixture();
    const { data: item, error } = await admin
      .from("equipment_items")
      .insert({
        committee_id: COMMITTEE_KY_THUAT,
        asset_code: ASSET_CODE,
        name: "Loa tranh chấp M09-A",
        total_quantity: 1,
        available_quantity: 1,
        storage_location: "Kho test",
      })
      .select("id")
      .single();
    if (error || !item) throw new Error(`Tạo thiết bị fixture: ${error?.message}`);
    itemId = item.id;

    const { data: staff } = await admin
      .from("staff_profiles")
      .select("id")
      .eq("staff_code", "GLV913")
      .single();
    if (!staff) throw new Error("Chưa có GLV913. Chạy seed:dev trước.");
    borrowerStaffId = staff.id;
  });

  afterAll(async () => {
    await removeFixture();
  });

  it("đúng MỘT phiếu được tạo, phiên còn lại nhận EQUIPMENT_NOT_ENOUGH, kho không âm", async () => {
    const [first, second] = await Promise.all([sessionFor("GLV912"), sessionFor("GLV913")]);

    // Cùng lúc, không xếp hàng: đây chính là điều kiện mà row lock phải chịu được.
    const results = await Promise.all([
      first.rpc("borrow_equipment", {
        p_equipment_item_id: itemId,
        p_quantity: 1,
        p_borrower_staff_id: borrowerStaffId,
      }),
      second.rpc("borrow_equipment", {
        p_equipment_item_id: itemId,
        p_quantity: 1,
        p_borrower_staff_id: borrowerStaffId,
      }),
    ]);

    const succeeded = results.filter((result) => !result.error);
    const failed = results.filter((result) => result.error);
    expect(succeeded, "đúng một phiên mượn được").toHaveLength(1);
    expect(failed, "phiên còn lại phải bị từ chối").toHaveLength(1);
    expect(failed[0].error?.message ?? "").toContain("EQUIPMENT_NOT_ENOUGH");

    const { data: item } = await admin
      .from("equipment_items")
      .select("available_quantity, total_quantity")
      .eq("id", itemId)
      .single();
    expect(item?.available_quantity, "khả dụng về 0, không âm").toBe(0);
    expect(item?.total_quantity, "tổng kho không đổi vì chưa ai trả").toBe(1);

    const { count } = await admin
      .from("equipment_loans")
      .select("id", { count: "exact", head: true })
      .eq("equipment_item_id", itemId);
    expect(count, "chỉ một phiếu mượn được ghi").toBe(1);
  });
});
