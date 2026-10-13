# R4 independent browser verification — 2026-10-13

Reviewer: independent agent `review_r4_list`. Read-only browser verification against local production builds on ports 3195 and 3197; no business fixture writes, Git commits, or deployment actions.

## Final build, port 3197

- Tablet 768×1024: **12 complete rows** above bottom navigation (top y=959), exceeding the target of eight. First row y=366.5, height=44.5px. Page horizontal overflow=0px.
- Tablet column bounds: name x=25–251.36; class 251.36–435.69; guardian 435.69–638.78; phone 638.78–762.88; status 762.88–905. Table width=880px inside a horizontally scrollable viewport. Four column headings appear, but the phone column extends about 20px past the container's visible right edge; full phone/status contents require horizontal table scrolling. This is a remaining tablet layout limitation, not full four-column visibility without scrolling.
- Mobile 360×800, attendance tab: automatic strip scrollLeft=94; active tab x=238.875–344.406 in navigation x=16–344. The 0.406px fractional overflow is within the 1px assertion tolerance. Page scrollY remained 0.
- Mobile health tab: scrollLeft=256; active tab x=256.125–343.953, fully inside navigation. Page scrollY remained 0. Resize to tablet and back retained the visible active tab.
- Horizontal page overflow remained 0px for both detail tabs. The reviewed TabNav effect changes only scrollLeft and keeps native SSR links.

Evidence: `independent-final-browser.json`, `independent-final-tablet768.png`, `independent-final-attendance.png`, `independent-final-health.png`; reproducible read-only script `independent-final-browser.mjs`.

## Earlier read-only workflow checks, port 3195

- Existing guardian → child step → cancel passed with JavaScript both enabled and disabled. The selected guardian survived step navigation; the URL carried an ID; no business form was submitted.
- Filter sheet remained visible after resize from mobile to desktop. Escape returned to page 2 and restored body scrolling.
- Family and attendance pages rendered six navigation links without data-load error messages or horizontal page overflow. Attendance fixture had no finalized sessions, so this browser check proves the empty state; real-note authorization is covered separately below.
- Mobile list row height=63px (target 56–64); desktop first row y=287 and height=44.5px. Page overflow=0px at widths 360/768/1366.
- At the shorter 768×800 viewport, only about seven complete rows fit above the bottom navigation. This limitation remains documented; the standard 768×1024 target passes.

The no-JavaScript script initially clicked during drawer entrance animation and timed out waiting for a stable target. Waiting for the actual CSS animation to finish, without forced clicks or disabled animations, passed.

## Independent code and permission verification

`tests/unit/r4-detail-boundaries.test.tsx`: **16/16 passed**, covering route denial, sibling scope, historical membership, current/historical class labels, guardian-options errors, attendance-note session/record boundaries, note failures preserving attendance, and overview warning scope/errors.

Real local JWT reads: secretary's authorized `attendance_session_notes` RPC succeeded; guardian received `42501/FORBIDDEN`. Direct note-column reads returned `42501` for both roles. No local nonempty-note fixture existed, so returned-note rendering is verified by the unit fixture rather than a live note record. No production/business database mutations were performed by this reviewer.

No remaining authorization or workflow blocker was found in this review. Full write-flow E2E execution and release checks are owned by the root agent; this note does not claim results from unfinished or unrelated suites.
