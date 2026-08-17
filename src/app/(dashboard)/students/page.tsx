import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Panel, panelClassName } from "@/components/ui/card";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { SearchInputControl } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { BranchChip } from "@/components/theme/branch-chip";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { themeKeyFromSectorCode } from "@/lib/theme/sector-palette";
import { CreateGuardianForm } from "@/features/students/components/create-guardian-form";
import { CreateStudentForm } from "@/features/students/components/create-student-form";
import { studentStatusLabel } from "@/features/students/student-status";
import {
  hasActiveStudentFilter,
  parseStudentCriteria,
  studentListHref,
  STUDENT_STATUS_FILTER_LABELS,
  STUDENT_STATUS_FILTERS,
} from "@/features/students/student-directory";
import { getStudentsPageData } from "@/features/students/server/queries";
import { cn } from "@/lib/utils";

/**
 * Trang Thiếu nhi — TB-F03 (đóng M03-F03) + TB-F13 + TB-F02/F09 + D-123.
 *
 * 🔴 Trước M03-B trang này đổ thẳng **~900 thẻ** vào một lượt dựng, không tìm
 * kiếm, không lọc, không phân trang: muốn tìm một em phải Ctrl+F, và trên máy
 * 360px của Giáo lý viên đứng lớp thì đó là màn hình không dùng được (5W-F03).
 *
 * Thanh lọc và phân trang là `<form method="get">` + `<Link>` thật, nên **chạy
 * không cần JavaScript** và **chép được đường dẫn trang 3** (09 §11).
 */
export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const criteria = parseStudentCriteria(await searchParams);
  const {
    students,
    guardians,
    classes,
    sectors,
    canWrite,
    requiresClassOnCreate,
    page,
    pageSize,
    totalItems,
    feeScope,
  } = await getStudentsPageData(criteria);
  const filtered = hasActiveStudentFilter(criteria);

  return (
    <PageContainer>
      <PageHeader
        title="Thiếu nhi"
        description={
          // D-67/D-129 — nói ra phạm vi ngay ở đầu trang. Một danh sách thiếu
          // cột mà không giải thích thì người dùng tưởng hệ thống hỏng, và bài
          // học D-108 của M04 đã ghi đúng điều đó cho một danh sách tự ẩn bớt.
          feeScope
            ? "Danh sách phục vụ việc thu phí: tên em, lớp, ngành và liên lạc phụ huynh. Hồ sơ chi tiết, ngày sinh, địa chỉ, sức khoẻ và bí tích không thuộc phạm vi Thủ quỹ."
            : "Hồ sơ thiếu nhi và người giám hộ."
        }
      />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,0.75fr)]">
        <div className="space-y-4">
          <FilterBar
            legend="Lọc danh sách thiếu nhi"
            action="/students"
            resetHref={filtered ? "/students" : undefined}
          >
            <FilterField
              className="sm:col-span-2 lg:col-span-1"
              label="Tìm theo tên thiếu nhi"
              htmlFor="filter-student-search"
              helper="Gõ không dấu cũng tìm được — cả mã em và số điện thoại phụ huynh."
            >
              <SearchInputControl
                id="filter-student-search"
                defaultValue={criteria.search}
                placeholder="Ví dụ: tran ngoc"
              />
            </FilterField>
            <FilterField label="Ngành" htmlFor="filter-sector">
              <Select id="filter-sector" name="sector" defaultValue={criteria.sectorId}>
                <option value="all">Tất cả ngành</option>
                {sectors.map((sector) => (
                  <option key={sector.id} value={sector.id}>
                    {sector.name}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Lớp" htmlFor="filter-class">
              <Select id="filter-class" name="class" defaultValue={criteria.classId}>
                <option value="all">Tất cả lớp</option>
                <option value="none">Chưa xếp lớp</option>
                {classes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.displayName}
                  </option>
                ))}
              </Select>
            </FilterField>
            <FilterField label="Trạng thái hồ sơ" htmlFor="filter-status">
              <Select id="filter-status" name="status" defaultValue={criteria.status}>
                {STUDENT_STATUS_FILTERS.map((value) => (
                  <option key={value} value={value}>
                    {STUDENT_STATUS_FILTER_LABELS[value]}
                  </option>
                ))}
              </Select>
            </FilterField>
          </FilterBar>

          <Card>
            <CardHeader>
              <CardTitle>Danh sách thiếu nhi</CardTitle>
              <CardDescription>
                {totalItems === 0
                  ? "Mỗi em có một người giám hộ; một người giám hộ có thể có nhiều con."
                  : `${totalItems} hồ sơ trong phạm vi của bạn${
                      criteria.status === "all"
                        ? ""
                        : ` · đang lọc "${STUDENT_STATUS_FILTER_LABELS[criteria.status]}"`
                    }.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {students.length === 0 ? (
                /*
                  Hai câu khác nhau cho hai tình huống khác nhau (09 §9). "Không
                  tìm thấy" khi đang lọc mà nói "chưa có hồ sơ nào" là nói sai —
                  người dùng sẽ đi tạo lại một em đã có.
                */
                <EmptyState
                  variant="no-data"
                  title={filtered ? "Không có em nào khớp bộ lọc" : "Chưa có hồ sơ thiếu nhi"}
                  description={
                    filtered
                      ? "Thử bỏ bớt bộ lọc, hoặc gõ ít chữ hơn ở ô tìm kiếm — ô này tìm cả khi không bỏ dấu."
                      : "Chưa có hồ sơ thiếu nhi nào trong phạm vi của bạn."
                  }
                  action={
                    filtered ? (
                      <Link href="/students" className="text-sm font-medium underline underline-offset-4">
                        Xoá bộ lọc
                      </Link>
                    ) : undefined
                  }
                />
              ) : (
                /*
                  Tên cho danh sách: vỏ ứng dụng cũng có `<li>` (thanh điều
                  hướng), nên "mục danh sách đầu tiên trên trang" không phải là
                  em đầu tiên. Trình đọc màn hình cũng cần biết đây là danh sách
                  gì trước khi đọc từng em.
                */
                <ul aria-label="Danh sách thiếu nhi" className="space-y-3">
                  {students.map((item) => {
                    const row = (
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium">
                            {item.saintName} {item.fullName}
                          </p>
                          <p className="text-sm text-ink-muted">
                            Giám hộ: {item.guardianName} · {item.guardianPhone}
                          </p>
                          {/*
                            `docs/06` §8 — cột Lớp. "Chưa xếp lớp" là một TIN,
                            không phải một ô trống: đó chính là nhóm cần chú ý.
                          */}
                          <p className="text-sm text-ink-muted">
                            Lớp: {item.className ?? "Chưa xếp lớp"}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {item.sectorName ? (
                            <BranchChip
                              themeKey={themeKeyFromSectorCode(item.sectorCode)}
                              branchName={item.sectorName}
                            />
                          ) : null}
                          {item.hardshipFlag ? <Badge variant="warning">Hoàn cảnh</Badge> : null}
                          <Badge variant={item.status === "active" ? "success" : "secondary"}>
                            {studentStatusLabel(item.status)}
                          </Badge>
                        </div>
                      </div>
                    );
                    return (
                      <li key={item.id}>
                        {/*
                          🔴 D-67 — với Thủ quỹ, dòng KHÔNG phải là một liên kết.
                          Trang chi tiết đọc thẳng bảng `students`, mà RLS vẫn trả
                          0 dòng cho họ ⇒ bấm vào tên là rơi vào trang 404. Một
                          liên kết luôn dẫn tới 404 còn tệ hơn không có liên kết:
                          người dùng sẽ báo "hệ thống mất hồ sơ của em".
                        */}
                        {feeScope ? (
                          <Panel padding="md">{row}</Panel>
                        ) : (
                          <Link
                            href={`/students/${item.id}`}
                            className={cn(panelClassName({ padding: "md" }), "block transition-colors hover:border-theme-primary hover:bg-theme-soft")}
                          >
                            {row}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}

              {totalItems > pageSize ? (
                <Pagination
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  itemLabel="thiếu nhi"
                  buildHref={(target) => studentListHref(criteria, target)}
                />
              ) : null}
            </CardContent>
          </Card>
        </div>

        {canWrite ? (
          <div className="space-y-5">
            <Card>
              <CardHeader>
                <CardTitle>Thêm người giám hộ</CardTitle>
                <CardDescription>Tạo phụ huynh trước khi thêm con.</CardDescription>
              </CardHeader>
              <CardContent>
                <CreateGuardianForm />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Thêm thiếu nhi</CardTitle>
                <CardDescription>Mã thiếu nhi được cấp tự động.</CardDescription>
              </CardHeader>
              <CardContent>
                {guardians.length === 0 ? (
                  <p className="text-sm text-ink-muted">Vui lòng tạo người giám hộ trước.</p>
                ) : (
                  <CreateStudentForm
                    guardians={guardians}
                    classes={classes}
                    requiresClass={requiresClassOnCreate}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </PageContainer>
  );
}
