import { describe, expect, it } from "vitest";
import {
  ACCOUNTS_PAGE_SIZE,
  filterAccounts,
  paginateAccounts,
} from "@/features/auth/account-directory";
import type { AccountSummary } from "@/features/auth/server/queries";

function account(overrides: Partial<AccountSummary> & { id: string }): AccountSummary {
  return {
    username: "GLV000",
    displayName: "Người dùng",
    status: "active",
    role: "class_teacher",
    mustChangePassword: false,
    ...overrides,
  };
}

const accounts: AccountSummary[] = [
  account({ id: "1", username: "GLV045", displayName: "Anrê Nguyễn Văn An", role: "class_teacher", status: "active" }),
  account({ id: "2", username: "GLV046", displayName: "Maria Trần Thị Bình", role: "sector_leader", status: "disabled" }),
  account({ id: "3", username: "TQ01", displayName: "Giuse Lê Văn Cường", role: "treasurer", status: "active" }),
];

describe("filterAccounts", () => {
  it("tìm theo tên đăng nhập và họ tên, không phân biệt hoa thường", () => {
    expect(filterAccounts(accounts, { search: "glv045", role: "all", status: "all" }).map((a) => a.id)).toEqual(["1"]);
    expect(filterAccounts(accounts, { search: "bình", role: "all", status: "all" }).map((a) => a.id)).toEqual(["2"]);
  });

  it("tìm bỏ dấu tiếng Việt (an khớp Anrê ... An)", () => {
    const hits = filterAccounts(accounts, { search: "an", role: "all", status: "all" }).map((a) => a.id);
    expect(hits).toContain("1");
  });

  it("lọc theo vai trò và trạng thái", () => {
    expect(filterAccounts(accounts, { search: "", role: "treasurer", status: "all" }).map((a) => a.id)).toEqual(["3"]);
    expect(filterAccounts(accounts, { search: "", role: "all", status: "disabled" }).map((a) => a.id)).toEqual(["2"]);
    expect(filterAccounts(accounts, { search: "", role: "sector_leader", status: "active" })).toHaveLength(0);
  });

  it("không lọc gì khi để rỗng", () => {
    expect(filterAccounts(accounts, { search: "", role: "all", status: "all" })).toHaveLength(3);
  });
});

describe("paginateAccounts", () => {
  const many: AccountSummary[] = Array.from({ length: ACCOUNTS_PAGE_SIZE * 2 + 1 }, (_, index) =>
    account({ id: String(index), username: `GLV${index}` }),
  );

  it("cắt đúng cỡ trang và tính số trang", () => {
    const page1 = paginateAccounts(many, 1);
    expect(page1.items).toHaveLength(ACCOUNTS_PAGE_SIZE);
    expect(page1.pageCount).toBe(3);
    expect(page1.total).toBe(ACCOUNTS_PAGE_SIZE * 2 + 1);
    expect(paginateAccounts(many, 3).items).toHaveLength(1);
  });

  it("kẹp trang vượt biên về khoảng hợp lệ", () => {
    expect(paginateAccounts(many, 99).page).toBe(3);
    expect(paginateAccounts(many, 0).page).toBe(1);
    expect(paginateAccounts([], 1)).toMatchObject({ page: 1, pageCount: 1, total: 0 });
  });
});
