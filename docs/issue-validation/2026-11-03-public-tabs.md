# Public activity tabs and registration action

- Public ActivityDetailPage owns the active tab and passes it as a refresh key to useActivityDetail. Every transition refetches current student detail and resource gallery. The header/tabs remain mounted while body data reloads; selected tab survives retries.
- Request identity combines account/activity/source with the refresh key. Late responses cannot overwrite the active tab/account. Previous data is retained only for the same account/activity, with content hidden during refresh.
- Staffing refreshes on mode/account changes and is keyed per public tab. Attendance/session panels remount and fetch when revisited.
- Registration action is in the public header and activity cards, visible with a disabled state when API denies registration; it requires server canRegister=true to submit. A successful API receipt disables repeated registration and refreshes authoritative data. No fake membership, registration, attendance or XP state is created.
- Header registration is scoped to public reads; workspace management DTOs do not expose the student registration capability.
- Browser fixture renders the actual ActivityDetailPage and child components, with isolated auth/API test doubles only. It checks all six tabs, repeated visits, staffing/attendance/session requests, slow/out-of-order responses, retry selection, account isolation, no idle requests, header action placement, double-submit locking, and desktop/mobile overflow.
- Validation on revision 7f6ad836d43a49dd8d50d5eecd7c9d88bedb5a56: 310 tests, notification browser scenarios, full activity browser scenarios, build and production bundle/health smoke all passed. https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41619153105
- Production API data exposed a separate nullable-registration-window mismatch; backend fix tracked in docs/issue-validation/2026-11-03-public-registration-window.md in the API repo. Do not equate UI browser fixtures with a production student-account end-to-end test.


## Final UI release
- Source/release revision: 1053a17193d46f6889d9a50da65ba5807018869f.
- https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41620185288 succeeded: 310 unit/contract tests, 17 notification viewport/state checks, desktop/mobile activity tab and registration browser flow, build, Cloudflare deploy and production bundle/API-health smoke.
- Registration is visible in the header for all public tabs, submit is gated by the server flag, and no student registration control is added to workspace management reads without that API capability.
- Manual deployment trigger restored; browser regression gates retained in the existing workflow. No new workflow files were created.
