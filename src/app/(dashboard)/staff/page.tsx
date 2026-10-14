import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateField } from "@/components/ui/date-field";
import { FilterField } from "@/components/ui/filter-bar";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Pagination } from "@/components/ui/pagination";
import { Select } from "@/components/ui/select";
import { Toolbar } from "@/components/ui/toolbar";
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
    <PageContainer data-density="compact">
      <PageHeader title="Huynh trưởng/Giáo lý viên" description={`${data.total} hồ sơ · Nhân sự và phân công đứng lớp.`}
        action={canWrite ? <div className="flex flex-wrap gap-2"><Link href="#assign-staff-section" className={buttonVariants({ variant: "outline" })}>Phân công vào lớp</Link><Link href="#add-staff" className={buttonVariants()}>Thêm nhân sự</Link></div> : null}
      />
      {deletedMessage ? <div className="mb-4"><FormMessage tone="success">{deletedMessage}</FormMessage></div> : null}
      {okMessage ? <div className="mb-4"><FormMessage tone="success">{okMessage}</FormMessage></div> : null}
      {errorMessage ? <div className="mb-4"><FormMessage tone="danger">{errorMessage}</FormMessage></div> : null}

      <div className="space-y-5">
        <div className="space-y-4">
          <Toolbar
            label="Lọc danh sách nhân sự"
            action="/staff"
            search={{
              id: "filter-staff-search",
              label: "Tìm theo họ tên",
              defaultValue: search,
              placeholder: "Tên, mã GLV hoặc số điện thoại",
            }}
            className="relative"
          >
            <details className="static sm:relative">
              <summary className="flex min-h-11 cursor-pointer items-center rounded-md border border-line-strong bg-surface px-3 text-sm font-medium">
                Bộ lọc{classFilter !== "all" || service !== "serving" ? " · Đang lọc" : ""}
              </summary>
              <div className="absolute inset-x-0 z-dropdown mt-1 grid gap-3 rounded-lg border border-line bg-surface p-3 shadow-md sm:left-auto sm:w-80">
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
            </details>
            {isFiltered ? <Link href="/staff" className="inline-flex min-h-11 items-center px-2 text-sm text-ink-muted underline underline-offset-4">Xoá lọc</Link> : null}
          </Toolbar>

          <Card>
            <h2 className="sr-only">Danh sách nhân sự</h2>
            <CardContent className="space-y-3">
              {/* D-108 — danh sách tự ẩn bớt người thì PHẢI nói ra, kèm đường bật lại.
                  Một danh sách âm thầm bỏ sót là một danh sách khiến người dùng
                  tưởng hồ sơ đã biến mất và đi tạo lại một hồ sơ trùng. */}
              {data.hiddenByService > 0 ? (
                <p className="text-sm text-ink-muted">
                  Đang ẩn <strong>{data.hiddenByService}</strong> hồ sơ ngoài bộ lọc.{" "}
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
                <table className="w-full text-left text-sm" aria-label="Danh sách nhân sự">
                  <thead className="hidden border-b border-line bg-surface-muted text-ink-muted md:table-header-group">
                    <tr>
                      <th scope="col" className="px-3 py-2 font-medium">Họ tên / Thành phần</th>
                      <th scope="col" className="px-3 py-2 font-medium">Liên hệ / Huấn luyện</th>
                      <th scope="col" className="px-3 py-2 font-medium">Phân công</th>
                      <th scope="col" className="px-3 py-2 font-medium">Phục vụ / Tài khoản</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                {staff.map((item) => {
                  const account = staffAccountBadge(
                    { hasAccount: item.hasAccount, username: item.username, hasActiveRole: item.hasActiveRole },
                    visibility,
                  );
                  return (
                    <tr key={item.id} className="grid gap-1 py-3 md:table-row md:py-0">
                        <td className="min-w-0 md:px-3 md:py-2">
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
                          <Link href={`/staff/${item.id}`} prefetch={false} className="inline-flex min-h-11 items-center break-words font-medium text-ink underline-offset-4 hover:underline">
                            {staffDisplayName(item)}
                          </Link>
                          <p className="text-sm text-ink-muted">
                            {item.staffCode} · {componentLabel(item.component)}
                          </p>
                        </td>
                        <td className="md:px-3 md:py-2">
                          <p>{item.phone ?? "Chưa có SĐT"}</p>
                          <p className="text-xs text-ink-muted">Huấn luyện {formationLabel(item.formationLevel)}</p>
                        </td>
                        <td className="md:px-3 md:py-2">
                            {item.assignment
                              ? `${item.assignment.className} · ${CAPACITY_SHORT_LABELS[item.assignment.capacity] ?? item.assignment.capacity}`
                              : "Chưa phân lớp"}
                        </td>
                        <td className="md:px-3 md:py-2">
                          <p>{serviceLabel(item.serviceStatus)}</p>
                          {account.tone === "warning" ? <Badge variant="warning">{account.text}</Badge> : <p className="text-xs text-ink-muted">{account.text}</p>}
                        </td>
                    </tr>
                  );
                })}
                  </tbody>
                </table>
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

        {canWrite ? <div className="grid items-start gap-5 xl:grid-cols-2">
          <Card id="add-staff" className="scroll-mt-24">
            <CardHeader><CardTitle>Thêm nhân sự</CardTitle><CardDescription>Dì/Sơ là danh xưng, không phải role hệ thống.</CardDescription></CardHeader>
            <CardContent><StaffCreateForm /></CardContent>
          </Card>

          <Card id="assign-staff-section" className="scroll-mt-24">
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
