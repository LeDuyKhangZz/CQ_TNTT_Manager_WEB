"use client";

import { AcademicYearSwitcher } from "./academic-year-switcher";
import { usePathname } from "next/navigation";
import { Dropdown } from "@/components/ui/dropdown";
import { dropdownItemClassName } from "@/components/ui/dropdown-item";
import { FormPendingBridge } from "@/components/loading/form-pending-bridge";
import type { ViewedAcademicYear } from "@/lib/academic-year/view";
import { ArchivedYearBanner } from "@/components/theme/archived-year-banner";

const SECTIONS = ["classes", "students", "results", "reports"];
export type YearViewPresentation = {
  year: Pick<ViewedAcademicYear, "id" | "code" | "name"> | null;
  current: Pick<ViewedAcademicYear, "id" | "code" | "name"> | null;
  years: Pick<ViewedAcademicYear, "id" | "code" | "name">[];
  readOnly: boolean;
};

export function AcademicYearControl({ view, selectYearAction }: {view: YearViewPresentation; selectYearAction:(data:FormData)=>Promise<void>}) {
  const pathname = usePathname();
  const section = pathname.split("/")[1];
  const supported = SECTIONS.includes(section) && !pathname.startsWith("/reports/snapshots");
  if (!supported) return <AcademicYearSwitcher current={view.current} />;
  const shown = view.year;
  return <Dropdown key={view.year?.id} align="start" ariaLabel="Chọn năm học" triggerClassName="px-1 sm:px-3"
    label={<span className="text-xs sm:text-sm"><span className="sr-only">Năm học đang xem: </span>{shown?.code ?? "Chưa đặt năm học"}</span>}>
    <p className="px-3 py-2 text-xs text-ink-muted">Năm học cũ chỉ được xem.</p>
    {view.years.map(year => <form key={year.id} action={selectYearAction}>
      <input type="hidden" name="year" value={year.id} />
      <input type="hidden" name="section" value={supported ? `/${section}` : "/classes"} />
      <button type="submit" role="menuitem" data-dropdown-item="true" aria-current={shown?.id === year.id ? "true" : undefined} className={dropdownItemClassName("default")}>
        {year.name}{year.id === view.current?.id ? " · Hiện hành" : " · Chỉ xem"}
      </button><FormPendingBridge />
    </form>)}
  </Dropdown>;
}

export function AcademicYearViewBanner({ view }: {view: YearViewPresentation}) {
  const pathname = usePathname();
  if (!SECTIONS.includes(pathname.split("/")[1]) || pathname.startsWith("/reports/snapshots")) return null;
  return <div><ArchivedYearBanner theme={{isViewingArchivedData:view.readOnly}} academicYearLabel={view.year?.code} className="mx-4 mt-4 sm:mx-6 lg:mx-8" />{view.readOnly && pathname.startsWith("/students") ? <p className="mx-4 mt-2 text-sm text-ink-muted sm:mx-6 lg:mx-8">Lớp theo năm đang xem; thông tin cá nhân là hồ sơ hiện tại. Chỉ hiển thị hồ sơ thuộc quyền đọc hiện tại của bạn.</p> : null}</div>;
}
