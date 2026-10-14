import Link from "next/link";
import { getAllFeaturesNavigation, type NavigationViewer } from "@/config/navigation";

/** A real linked directory at an existing route, usable before hydration too. */
export function AllFeaturesGrid({ viewer }: { viewer: NavigationViewer }) {
  const items = getAllFeaturesNavigation(viewer);
  return <section id="all-features" aria-labelledby="all-features-title" className="mt-6 scroll-mt-24 border-t border-line pt-4">
    <h2 id="all-features-title" tabIndex={-1} className="text-lg font-semibold text-ink">Tất cả chức năng</h2>
    <p className="mt-1 text-sm text-ink-muted">Các chức năng trong phạm vi tài khoản của bạn.</p>
    <nav aria-label="Tất cả chức năng" className="mt-3">
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from(new Set(items.map((item) => item.group))).map((group) => (
          <div key={group}>
            <h3 className="border-b border-line pb-2 text-sm font-medium text-ink-muted">{group}</h3>
            <ul className="divide-y divide-line">
              {items.filter((item) => item.group === group).map(({ href, label }) => <li key={href}>
                <Link href={href} className="flex min-h-11 items-center rounded-sm px-2 py-2 text-sm font-medium text-ink hover:bg-surface-muted">
                  {label}
                </Link>
              </li>)}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  </section>;
}
