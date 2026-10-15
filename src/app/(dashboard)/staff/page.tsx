import { DataTable } from "@/components/ui/data-table";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Drawer, drawerHref } from "@/components/ui/drawer";
import { DateField } from "@/components/ui/date-field";
import { FilterField } from "@/components/ui/filter-bar";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { ActionSheet } from "@/components/ui/task-sheet";
import { SearchInputControl } from "@/components/ui/search-input";
import { Search } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { FormPendingBridge } from "@/components/loading/form-pending-bridge";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { assignStaffFromForm } from "@/features/staff/server/actions";
import { getStaffPageData } from "@/features/staff/server/queries";
import { StaffCreateForm } from "@/features/staff/components/staff-create-form";
import {
  CAPACITY_LABELS,
  CAPACITY_SHORT_LABELS,
  SERVICE_FILTER_LABELS,
  SERVICE_FILTERS,
  STAFF_PAGE_SIZE,
  componentLabel,
  formationLabel,
  parsePage,
  parseServiceFilter,
  serviceLabel,
  staffAccountBadge,
  staffDisplayName,
} from "@/features/staff/staff-directory";

const WRITE_ROLES = ["super_admin", "group_leader", "deputy_group_leader", "secretary"];

const OK_MESSAGES: Record<string, string> = { assign: "Đã lưu phân công." };
const ERROR_MESSAGES: Record<string, string> = {
  assign: "Không lưu được phân công (người này đã có lớp đang phục vụ, hoặc dữ liệu chưa đúng).",
};

type StaffSearchParams = {
  q?: string;
  classId?: string;
  service?: string;
  page?: string;
  ok?: string;
  error?: string;
  deleted?: string;
  panel?: string;
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<StaffSearchParams>;
}) {
  const params = await searchParams;
  const search = params.q?.trim() ?? "";
  const classFilter = params.classId || "all";
  const service = parseServiceFilter(params.service);

  const data = await getStaffPageData({ search, classId: classFilter, service }, parsePage(params.page));
  const { context, visibility, staff, classes, assignableStaff } = data;
  const canWrite = context.role ? WRITE_ROLES.includes(context.role) : false;

  const okMessage = params.ok ? OK_MESSAGES[params.ok] : null;
  const errorMessage = params.error ? ERROR_MESSAGES[params.error] : null;
  const deletedMessage = params.deleted ? `Đã xóa hồ sơ ${params.deleted}.` : null;

  // Bộ lọc nằm trong query string nên trang 3 chép được, đánh dấu được, bấm Back
  // được — và mọi đường dẫn sinh ra từ trang này phải mang theo đúng bộ lọc đó.
  function buildHref(overrides: { page?: number; service?: string } = {}): string {
    const nextService = overrides.service ?? service;
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (classFilter !== "all") query.set("classId", classFilter);
    if (nextService !== "serving") query.set("service", nextService);
    if ((overrides.page ?? 1) > 1) query.set("page", String(overrides.page));
    const suffix = query.toString();
    return suffix ? `/staff?${suffix}` : "/staff";
  }
  const pageHref = (page: number) => buildHref({ page });
  const isFiltered = Boolean(search) || classFilter !== "all" || service !== "serving";
  const closeHref = buildHref({ page: data.page });
  const listParams = new URLSearchParams(closeHref.split("?")[1]);

  return (
    <PageContainer data-density="compact">
      <PageHeader title="Huynh trưởng/Giáo lý viên" description={`${data.total} hồ sơ`}
        action={canWrite ? <div className="flex flex-wrap gap-2"><Link scroll={false} href={drawerHref("/staff", listParams, { panel: "assign" })} className={buttonVariants({ variant: "outline" })}>Phân công</Link><Link scroll={false} href={drawerHref("/staff", listParams, { panel: "new" })} className={buttonVariants()}>Thêm nhân sự</Link></div> : null}
      />
      {deletedMessage ? <div className="mb-4"><FormMessage tone="success">{deletedMessage}</FormMessage></div> : null}
      {okMessage ? <div className="mb-4"><FormMessage tone="success">{okMessage}</FormMessage></div> : null}
      {errorMessage ? <div className="mb-4"><FormMessage tone="danger">{errorMessage}</FormMessage></div> : null}

      <div className="space-y-5">
        <div className="space-y-4">
          <form action="/staff" method="get" aria-label="Lọc danh sách nhân sự" className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1"><SearchInputControl id="filter-staff-search" name="q" aria-label="Tìm theo họ tên" defaultValue={search} placeholder="Tên, mã hoặc SĐT" /></div>
            <Button type="submit" variant="secondary" aria-label="Tìm nhân sự" className="w-11 px-0"><Search className="h-4 w-4" aria-hidden="true" /></Button>
            <ActionSheet title="Bộ lọc nhân sự" triggerLabel={classFilter !== "all" || service !== "serving" ? "Lọc · Đang lọc" : "Lọc"}>
              <div className="space-y-4">
                <FilterField label="Lớp đang phục vụ" htmlFor="filter-class">
                  <Select id="filter-class" name="classId" defaultValue={classFilter}>
                    <option value="all">Mọi lớp</option>
                    <option value="none">Chưa phân lớp</option>
                    {classes.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </FilterField>
                <FilterField label="Trạng thái phục vụ" htmlFor="filter-service">
                  <Select id="filter-service" name="service" defaultValue={service}>
                    {SERVICE_FILTERS.map((value) => (
                      <option key={value} value={value}>{SERVICE_FILTER_LABELS[value]}</option>
                    ))}
                  </Select>
                </FilterField>
                <Button type="submit" variant="secondary">Áp dụng bộ lọc</Button>
              </div>
            </ActionSheet>
            {isFiltered ? <Link href="/staff" className="inline-flex min-h-11 items-center px-2 text-sm text-ink-muted underline underline-offset-4">Xoá lọc</Link> : null}
          </form>

          <Card>
            <h2 className="sr-only">Danh sách nhân sự</h2>
            <CardContent className="space-y-3">
              {/* D-108 — danh sách tự ẩn bớt người thì PHẢI nói ra, kèm đường bật lại.
                  Một danh sách âm thầm bỏ sót là một danh sách khiến người dùng
                  tưởng hồ sơ đã biến mất và đi tạo lại một hồ sơ trùng. */}
              {data.hiddenByService > 0 ? (
                <p className="text-sm text-ink-muted">
                  <strong>{data.hiddenByService}</strong> hồ sơ đang ẩn.{" "}
                  <Link
                    href={buildHref({ service: "all" })}
                    className="inline-flex min-h-11 items-center underline underline-offset-4"
                  >
                    Hiện tất cả
                  </Link>
                </p>
              ) : null}

              {staff.length === 0 ? (
                <EmptyState
                  title={isFiltered ? "Không có ai khớp bộ lọc" : "Chưa có hồ sơ nhân sự"}
                  description={
                    isFiltered
                      ? `Không tìm thấy nhân sự nào khớp bộ lọc hiện tại trong ${data.totalUnfiltered} hồ sơ bạn xem được. Thử xoá bớt điều kiện lọc.`
                      : "Chưa có hồ sơ nhân sự nào trong phạm vi của bạn."
                  }
                  action={
                    isFiltered ? (
                      <Link
                        href="/staff"
                        className="inline-flex min-h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-muted"
                      >
                        Xoá lọc
                      </Link>
                    ) : undefined
                  }
                />
              ) : (
                <DataTable
                  caption="Danh sách nhân sự" hideCaption density="compact" tableId="staff-directory"
                  rows={staff} getRowKey={(item) => item.id} rowHref={(item) => `/staff/${item.id}`}
                  rowActionLabel="Xem hồ sơ" minWidth="780px" mobileRow={{ titleKey: "name" }}
                  columns={[
                    { key: "name", header: "Họ tên / Thành phần", cell: (item) => {
                      const account = staffAccountBadge({ hasAccount: item.hasAccount, username: item.username, hasActiveRole: item.hasActiveRole }, visibility);
                      return <>
                        <span className="block break-words font-semibold text-ink"><span className="md:hidden">{item.fullName}</span><span className="hidden md:inline">{staffDisplayName(item)}</span></span>
                        <span className="hidden text-xs text-ink-muted md:block">{item.staffCode} · {componentLabel(item.component)}</span>
                        <span className="mt-1 block text-xs text-ink-muted md:hidden">{item.assignment ? `${item.assignment.className} · ${CAPACITY_SHORT_LABELS[item.assignment.capacity] ?? item.assignment.capacity}` : "Chưa phân lớp"}{item.serviceStatus !== "active" ? ` · ${serviceLabel(item.serviceStatus)}` : ""}</span>
                        {account.tone === "warning" ? <span className="mt-1 block text-xs text-warning md:hidden">{account.text}</span> : null}
                      </>;
                    } },
                    { key: "contact", header: "Liên hệ / Huấn luyện", cell: (item) => <><p>{item.phone ?? "Chưa có SĐT"}</p><p className="text-xs text-ink-muted">Huấn luyện {formationLabel(item.formationLevel)}</p></> },
                    { key: "assignment", header: "Phân công", cell: (item) => item.assignment ? `${item.assignment.className} · ${CAPACITY_SHORT_LABELS[item.assignment.capacity] ?? item.assignment.capacity}` : "Chưa phân lớp" },
                    { key: "account", header: "Phục vụ / Tài khoản", cell: (item) => {
                      const account = staffAccountBadge({ hasAccount: item.hasAccount, username: item.username, hasActiveRole: item.hasActiveRole }, visibility);
                      return <><p>{serviceLabel(item.serviceStatus)}</p>{account.tone === "warning" ? <Badge variant="warning">{account.text}</Badge> : <p className="text-xs text-ink-muted">{account.text}</p>}</>;
                    } },
                  ]}
                />
              )}

              <Pagination
                page={data.page}
                pageSize={STAFF_PAGE_SIZE}
                totalItems={data.total}
                buildHref={pageHref}
                itemLabel="hồ sơ"
              />
            </CardContent>
          </Card>
        </div>

        <Drawer open={canWrite && params.panel === "new"} title="Thêm nhân sự" closeHref={closeHref}>
          <StaffCreateForm />
        </Drawer>
        <Drawer open={canWrite && params.panel === "assign"} title="Phân công vào lớp" closeHref={closeHref} description="Đổi lớp? Mở hồ sơ nhân sự và chọn Chuyển lớp.">
            <form action={assignStaffFromForm} className="space-y-3"><FormPendingBridge />
              <div className="space-y-2">
                <Label htmlFor="assign-staff">Nhân sự</Label>
                {/* Liệt kê TOÀN BỘ danh sách, không phải trang đang xem — xem ghi
                    chú `assignableStaff` ở `queries.ts`. */}
                <Select id="assign-staff" name="staffProfileId" required defaultValue="" placeholder="Chọn nhân sự">
                  {assignableStaff.map((item) => (
                    <option key={item.id} value={item.id} disabled={Boolean(item.assignment)}>
                      {item.staffCode} · {item.fullName}{item.assignment ? ` (${item.assignment.className})` : ""}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-class">Lớp</Label>
                <Select id="assign-class" name="classId" required defaultValue="" placeholder="Chọn lớp">
                  {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assign-capacity">Vai trò trong lớp</Label>
                <Select id="assign-capacity" name="capacity" defaultValue="member">
                  {Object.entries(CAPACITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2"><Label htmlFor="assign-start">Ngày bắt đầu</Label><DateField id="assign-start" name="startsOn" required /></div>
              <Button type="submit" className="w-full">Lưu phân công</Button>
            </form>
        </Drawer>
      </div>
    </PageContainer>
  );
}
