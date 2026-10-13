import { Pagination, type PaginationProps } from "./pagination";
import { Select } from "./select";
import { Button } from "./button";

export function PaginationFooter({ selectedCount, pageSizes = [25, 50, 100], sizeName = "size", action, keepParams = [], ...pagination }: PaginationProps & {
  selectedCount?: number; pageSizes?: readonly number[]; sizeName?: string; action: string;
  keepParams?: readonly {name:string; value:string}[];
}) {
  const sizes = Array.from(new Set([...pageSizes, pagination.pageSize])).sort((a,b) => a-b);
  return <div className="space-y-2 border-t border-line py-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      {selectedCount === undefined ? <span /> : <p className="text-sm text-ink-muted" role="status">Đã chọn {selectedCount} mục</p>}
      <form action={action} method="get" className="flex flex-wrap items-center gap-2">
        {keepParams.filter(p => p.name !== "page" && p.name !== sizeName).map((p,i) => <input key={`${p.name}-${i}`} type="hidden" name={p.name} value={p.value} />)}
        <label className="flex items-center gap-2 text-sm">Số dòng mỗi trang
          <Select name={sizeName} defaultValue={String(pagination.pageSize)} key={pagination.pageSize} className="w-24">
            {sizes.map(size => <option key={size} value={size}>{size}</option>)}
          </Select>
        </label>
        <Button variant="outline" type="submit" size="sm">Áp dụng</Button>
      </form>
    </div>
    <Pagination {...pagination} />
  </div>;
}
