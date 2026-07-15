import { CalendarDays, ChevronDown } from "lucide-react";

export function AcademicYearSwitcher() {
  return (
    <button type="button" disabled className="hidden min-h-11 items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground disabled:cursor-not-allowed disabled:opacity-100 sm:flex" aria-label="Năm học hiện tại, dữ liệu mẫu">
      <CalendarDays className="h-4 w-4 text-primary" aria-hidden="true" />
      <span>Năm học 2026–2027</span>
      <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </button>
  );
}
