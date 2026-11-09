# Activity layout and personal schedule — 2026-11-03

## Changes
- Activity title has full available width. Actions have their own row below date/location; desktop navigation aligns with the registration button. At tablet/mobile widths navigation wraps to a separate row.
- Disabled registration button uses legible neutral colors instead of translucent orange/white.
- Removed StudentActivityActions from the public activity directory; cards retain the detail link.
- MySchedulePage now reads the existing authenticated /api/users/me/activity-history endpoint with complete pagination, rather than filtering a general feed by club access.
- Consequently confirmed public registration in a different club appears in personal schedule too. Real session times are retained; duplicates, cancelled/completed and ended occurrences are excluded. API errors remain errors.
- No backend changes or local registration persistence. No optimistic calendar entries before API success.

## Validation and release
Source commit: 36d72797c9d6f085bd0448dc1f526a99d8ff87ca.
Build and deployment run: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41668777669
- 312 unit tests pass, including schedule time boundary/cancellation/deduplication, external-club registration, complete pagination and error propagation.
- Notification layout suite and actual public/workspace reader tab suites pass.
- Production build preview passes 12 browser scenarios: public/internal x enabled/disabled x 1440/1024/390 pixels. Includes title width, separate action row, aligned/wrapped navigation, no horizontal overflow, submit then schedule navigation, empty schedule, and no list registration button.
- Cloudflare deployment completed: https://54e2a104.fptux-clubhub-ui.pages.dev
- This run's post-deploy browser step failed to start because Wrangler installation pruned the unsaved Playwright dependency; it did not report an application failure. Manual deploy workflow now restores that dependency before post-deploy browser checks.
- Earlier run 41668324166 stopped before deployment when tablet navigation alignment failed; fixed before release.

Online verification: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41669381964
- Successful. Exact domain https://fptux-clubhub-ui.pages.dev serves built index-BcYgOUws.js.
- All 12 layout, registration-to-schedule and directory scenarios pass against the actual deployed app.
- API health returned 200.
- Online browser screenshots are in the online-activity-layout-and-schedule artifact.

## Limits
Browser scenarios intercept every API request with isolated fixtures; synthetic token never reaches backend and no real participant is created. Schedule persistence relies on the existing real history endpoint and participant storage, inspected in API source. Real student production registration was not performed. Build/preview checks ran on GitHub Actions because the local execution environment is unavailable.

Existing deployment workflow restored to manual-only; no additional workflow files.
