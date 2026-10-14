import Link from "next/link";
import { getAllFeaturesNavigation, groupNavigationItems, type NavigationViewer } from "@/config/navigation";

/** Collapsed native menu fallback when JavaScript is disabled. */
export function AllFeaturesGrid({ viewer }: { viewer: NavigationViewer }) {
  const items = getAllFeaturesNavigation(viewer);
  return <section id="all-features" aria-labelledby="all-features-title" className="mt-6 scroll-mt-24 border-t border-line pt-4">
    <h2 id="all-features-title" tabIndex={-1} className="text-lg font-semibold text-ink">Tất cả chức năng</h2>
    <nav aria-label="Tất cả chức năng" className="mt-3">
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
        {groupNavigationItems(items).map(({ group, items: members }) => (
          <div key={group}>
            <h3 className="border-b border-line pb-2 text-sm font-medium text-ink-muted">{group}</h3>
            <ul className="divide-y divide-line">
              {members.map(({ href, label }) => <li key={href}>
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
