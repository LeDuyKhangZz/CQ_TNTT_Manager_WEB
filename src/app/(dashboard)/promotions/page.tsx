import Link from "next/link";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar, FilterField } from "@/components/ui/filter-bar";
import { FormMessage } from "@/components/ui/form-message";
import { Pagination } from "@/components/ui/pagination";
import { SearchInputControl } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { PromotionBoard } from "@/features/promotions/components/promotion-board";
import { PromotionProgress } from "@/features/promotions/components/promotion-progress";
import {
  hasActivePromotionFilter,
  parsePromotionCriteria,
  PROMOTION_STATUS_FILTERS,
  PROMOTION_STATUS_FILTER_LABELS,
  promotionsHref,
  type PromotionBoardCriteria,
} from "@/features/promotions/promotion-directory";
import {
  getPromotionsPageData,
  type PromotionClassOption,
} from "@/features/promotions/server/queries";

/** Câu mô tả phạm vi đang xem — một danh sách tự thu hẹp mà không nói gì là bài học D-108. */
function scopeText(
  criteria: PromotionBoardCriteria,
  classOptions: readonly PromotionClassOption[],
): string {
  const parts: string[] = [];
  if (criteria.classId !== "all") {
    const name = classOptions.find((option) => option.id === criteria.classId)?.displayName;
    if (name) parts.push(`lớp ${name}`);
  }
  if (criteria.status !== "all") {
    parts.push(`trạng thái “${PROMOTION_STATUS_FILTER_LABELS[criteria.status]}”`);
  }
  if (criteria.search) parts.push(`tên chứa “${criteria.search}”`);
  return parts.length > 0 ? `Đang xem ${parts.join(" · ")}.` : "";
}

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const criteria = parsePromotionCriteria(await searchParams);
  const data = await getPromotionsPageData(criteria);
  const filtered = hasActivePromotionFilter(criteria);
  const effectiveCriteria: PromotionBoardCriteria = data.unknownClassFilter
    ? { ...criteria, classId: "all" }
    : criteria;

  return (
    <PageContainer>
      <PageHeader
        title="Lên lớp và chuyển lớp"
        description="Đại diện lớp đề xuất; trưởng ngành duyệt và hệ thống cập nhật ghi danh trong một giao dịch."
      />

      {!data.yearCode ? (
        <EmptyState
          variant="no-data"
          title="Chưa có năm học hiện hành"
          description="Đề xuất chuyển lớp luôn xuất phát từ ghi danh của năm học đang áp dụng, mà hiện chưa có năm nào ở trạng thái đó. Hãy đặt năm học hiện hành ở trang Quản trị trước."
          action={
            <Link
              href="/admin"
              className="inline-flex h-control min-h-control items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              Mở trang Quản trị
            </Link>
          }
        />
      ) : data.progress.length === 0 ? (
        // 🔴 Câu chữ cố ý KHÔNG khẳng định *"bạn chưa phụ trách lớp nào"*.
        // Bảng tiến độ dựng từ **ghi danh**, nên nó rỗng ở hai tình huống khác
        // hẳn nhau: chưa được phân công lớp, và có lớp nhưng lớp chưa có em nào
        // ghi danh. Chọn một trong hai rồi nói chắc như đinh là dẫn người dùng
        // đi sai chỗ — đúng loại lỗi mà `09` §9 gọi là trạng thái rỗng nói dối.
        <EmptyState
          variant="no-data"
          title="Chưa có ghi danh nào để xử lý"
          description={`Năm học ${data.yearCode} chưa có ghi danh nào trong phạm vi bạn đọc được. Có thể lớp của bạn chưa có thiếu nhi nào ghi danh, hoặc bạn chưa được phân công lớp trong năm học này — trang Lớp trả lời được cả hai.`}
          action={
            <Link
              href="/classes"
              className="inline-flex h-control min-h-control items-center justify-center rounded-md border border-line-strong bg-surface px-4 text-sm font-medium text-ink transition-colors hover:bg-surface-muted"
            >
              Mở trang Lớp
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* BR-M08-14 — chỉ ghi danh của năm học hiện hành. Bản cũ đọc mọi năm
              (BR-M08-Y3) nên đề xuất đã duyệt của các năm trước tích tụ mãi trên
              cùng màn hình với việc đang phải làm. Nói ra phạm vi, không im lặng. */}
          <p className="text-sm text-ink-muted">
            Ghi danh của năm học <span className="font-medium text-ink">{data.yearCode}</span>.
          </p>

          <PromotionProgress progress={data.progress} activeClassId={effectiveCriteria.classId} />

          {data.unknownClassFilter ? (
            // TO-BE 1 "Validation": lớp lạ thì hiện lại bộ chọn kèm thông báo,
            // KHÔNG `throw`. Câu chữ cố ý **không** phân biệt "lớp không tồn tại"
            // với "lớp bạn không đọc được" — phân biệt là biến đường dẫn thành
            // một cái máy dò xem lớp nào có thật.
            <FormMessage tone="info">
              Lớp trong đường dẫn không nằm trong phạm vi bạn phụ trách nên đã bỏ qua bộ lọc lớp.
              Hãy chọn một lớp trong danh sách bên dưới.
            </FormMessage>
          ) : null}

          <section aria-labelledby="promotion-list-heading" className="space-y-3">
            <h2 id="promotion-list-heading" className="text-lg font-semibold">
              Danh sách đề xuất
            </h2>

            <FilterBar
              legend="Lọc danh sách chuyển lớp"
              action="/promotions"
              resetHref={filtered ? "/promotions" : undefined}
            >
              <FilterField label="Lớp" htmlFor="filter-promotion-class">
                <Select
                  id="filter-promotion-class"
                  name="classId"
                  defaultValue={effectiveCriteria.classId}
                >
                  <option value="all">Tất cả lớp</option>
                  {data.classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.displayName}
                    </option>
                  ))}
                </Select>
              </FilterField>
              <FilterField label="Trạng thái" htmlFor="filter-promotion-status">
                <Select
                  id="filter-promotion-status"
                  name="status"
                  defaultValue={effectiveCriteria.status}
                >
                  {PROMOTION_STATUS_FILTERS.map((value) => (
                    <option key={value} value={value}>
                      {PROMOTION_STATUS_FILTER_LABELS[value]}
                    </option>
                  ))}
                </Select>
              </FilterField>
              {/* `FilterField` dựng nhãn cho cả lưới, nên ô tìm dùng bản
                  `SearchInputControl` không nhãn — đặt nguyên `SearchInput` vào
                  đây là hai nhãn trỏ vào cùng một ô. */}
              <FilterField
                label="Tìm tên thiếu nhi"
                htmlFor="filter-promotion-search"
                helper="Gõ không dấu cũng tìm được."
              >
                <SearchInputControl
                  id="filter-promotion-search"
                  name="q"
                  defaultValue={effectiveCriteria.search}
                  placeholder="Gõ không dấu cũng được"
                />
              </FilterField>
            </FilterBar>

            {data.roster.length === 0 ? (
              <EmptyState
                variant="no-data"
                title={filtered ? "Không có em nào khớp bộ lọc" : "Chưa có ghi danh nào để xử lý"}
                description={
                  filtered
                    ? `${scopeText(effectiveCriteria, data.classOptions)} Bỏ bớt bộ lọc để xem các em khác.`
                    : `Năm học ${data.yearCode} chưa có ghi danh đang mở nào trong phạm vi bạn phụ trách.`
                }
                action={
                  filtered ? (
                    <Link
                      href="/promotions"
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      Xoá bộ lọc
                    </Link>
                  ) : undefined
                }
              />
            ) : (
              <>
                <p className="text-sm text-ink-muted">
                  <span data-numeric>{data.totalItems}</span> em.{" "}
                  {scopeText(effectiveCriteria, data.classOptions)}
                </p>
                {/* `selectable` phủ **cả bộ lọc**, không chỉ trang đang xem —
                    chủ dự án chốt 2026-08-08 rằng "Chọn tất cả" lấy cả em ở
                    trang sau (AC-20). Xem `PromotionsPageData.selectable`. */}
                <PromotionBoard
                  roster={data.roster}
                  targets={data.targets}
                  selectable={data.selectable}
                />
              </>
            )}

            {data.totalItems > data.pageSize ? (
              <Pagination
                page={data.page}
                pageSize={data.pageSize}
                totalItems={data.totalItems}
                itemLabel="em"
                buildHref={(target) => promotionsHref(effectiveCriteria, target)}
              />
            ) : null}
          </section>
        </div>
      )}
    </PageContainer>
  );
}
