import Link from "next/link";
import { getAllFeaturesNavigation, type NavigationViewer } from "@/config/navigation";

/** A real linked directory at an existing route, usable before hydration too. */
export function AllFeaturesGrid({ viewer }: { viewer: NavigationViewer }) {
  const items = getAllFeaturesNavigation(viewer);
  return <section id="all-features" aria-labelledby="all-features-title" className="mt-6 scroll-mt-24 border-t border-line pt-4">
    <h2 id="all-features-title" tabIndex={-1} className="text-lg font-semibold text-ink">Tất cả chức năng</h2>
    <p className="mt-1 text-sm text-ink-muted">Các chức năng trong phạm vi tài khoản của bạn.</p>
    <nav aria-label="Tất cả chức năng" className="mt-3">
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => <li key={href}>
          <Link href={href} className="flex h-full min-h-14 items-center gap-2 rounded-md border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-surface-muted">
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" strokeWidth={1.75} />
            <span>{label}</span>
          </Link>
        </li>)}
      </ul>
    </nav>
  </section>;
}
