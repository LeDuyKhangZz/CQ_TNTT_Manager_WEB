import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Panel } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { SearchInputControl } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
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

  return (
    <PageContainer>
      <PageHeader title="Huynh trưởng/Giáo lý viên" description="Hồ sơ nhân sự và lịch sử phân công đứng lớp." />
      {deletedMessage ? <div className="mb-4"><FormMessage tone="success">{deletedMessage}</FormMessage></div> : null}
      {okMessage ? <div className="mb-4"><FormMessage tone="success">{okMessage}</FormMessage></div> : null}
      {errorMessage ? <div className="mb-4"><FormMessage tone="danger">{errorMessage}</FormMessage></div> : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className="space-y-4">
          <FilterBar
            legend="Lọc danh sách nhân sự"
            action="/staff"
            resetHref={isFiltered ? "/staff" : undefined}
          >
            <FilterField
              className="sm:col-span-2 lg:col-span-1"
              label="Tìm theo họ tên"
              htmlFor="filter-staff-search"
              helper="Gõ không dấu cũng tìm được — cả tên thánh, mã GLV và số điện thoại."
            >
              <SearchInputControl
                id="filter-staff-search"
                name="q"
                defaultValue={search}
                placeholder="Tìm theo tên hoặc mã GLV"
              />
            </FilterField>
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
          </FilterBar>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách nhân sự</CardTitle>
              <CardDescription>Mỗi người chỉ có một lớp đang phục vụ tại một thời điểm.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* D-108 — danh sách tự ẩn bớt người thì PHẢI nói ra, kèm đường bật lại.
                  Một danh sách âm thầm bỏ sót là một danh sách khiến người dùng
                  tưởng hồ sơ đã biến mất và đi tạo lại một hồ sơ trùng. */}
              {data.hiddenByService > 0 ? (
                <p className="text-sm text-ink-muted">
                  Đang ẩn <strong>{data.hiddenByService}</strong> người không thuộc bộ lọc &ldquo;
                  {SERVICE_FILTER_LABELS[service]}&rdquo;.{" "}
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
                staff.map((item) => {
                  const account = staffAccountBadge(
                    { hasAccount: item.hasAccount, username: item.username, hasActiveRole: item.hasActiveRole },
                    visibility,
                  );
                  return (
                    <Panel key={item.id} padding="md">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          {/* 🔴 `prefetch={false}` là BẮT BUỘC, không phải tinh
                              chỉnh. Mặc định Next tải trước mọi `<Link>` lọt vào
                              khung nhìn: 10 thẻ ⇒ 10 lượt dựng `/staff/[id]`
                              cùng lúc, mỗi lượt là mấy truy vấn cộng một RPC
                              đếm lý do chặn xóa. Trình duyệt chỉ mở 6 kết nối
                              một lúc, nên lượt tải của chính cú bấm "Trang 2"
                              xếp hàng sau chúng và bị huỷ (`ERR_ABORTED`) —
                              người dùng bấm số trang mà trang đứng yên. Đo được
                              bằng E2E: rớt lặp lại ở 1366px, và nhật ký mạng cho
                              thấy đúng 10 lượt `/staff/<uuid>?_rsc=` chen trước.
                              Người dùng mở nhiều nhất MỘT hồ sơ, nên tải trước
                              chín cái còn lại là trả giá để không dùng. */}
                          <Link href={`/staff/${item.id}`} prefetch={false} className="font-medium text-ink underline-offset-4 hover:underline">
                            {staffDisplayName(item)}
                          </Link>
                          <p className="text-sm text-ink-muted">
                            {item.staffCode} · {item.phone} · Huấn luyện {formationLabel(item.formationLevel)}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={item.serviceStatus === "active" ? "success" : "secondary"}>
                            {serviceLabel(item.serviceStatus)}
                          </Badge>
                          <Badge variant={account.tone === "success" ? "success" : account.tone === "warning" ? "warning" : "secondary"}>
                            {account.text}
                          </Badge>
                          <Badge variant={item.assignment ? "success" : "secondary"}>
                            {item.assignment
                              ? `${item.assignment.className} · ${CAPACITY_SHORT_LABELS[item.assignment.capacity] ?? item.assignment.capacity}`
                              : "Chưa phân lớp"}
                          </Badge>
                        </div>
                      </div>
                    </Panel>
                  );
                })
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

        {canWrite ? <div className="space-y-5">
          <Card>
            <CardHeader><CardTitle>Thêm nhân sự</CardTitle><CardDescription>Dì/Sơ là danh xưng, không phải role hệ thống.</CardDescription></CardHeader>
            <CardContent><StaffCreateForm /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Phân công vào lớp</CardTitle><CardDescription>Muốn đổi lớp mà giữ tài khoản thì mở hồ sơ và dùng &ldquo;Chuyển lớp&rdquo;.</CardDescription></CardHeader>
            <CardContent><form action={assignStaffFromForm} className="space-y-3"><FormPendingBridge />
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
            </form></CardContent>
          </Card>
        </div> : null}
      </div>
    </PageContainer>
  );
}
