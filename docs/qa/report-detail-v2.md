# Report detail migration to V2

Date: 2026-10-16.

## Scope

- Workspace reports open `/v2/my-clubs/:clubCode/reports/:reportId` inside the existing workspace shell and semester provider.
- CTSV observation opens `/v2/ctsv/clubs/:clubCode/workspace/reports/:reportId` with read-only controls and a report/club identity check.
- Existing `/reports/:id` bookmarks redirect to `/v2/reports/:reportId`; links from legacy report creation, editing and finance therefore open the new detail view.
- Structured reports include narrative, all activity details, evidence, attachments, metadata, aggregate statistics and review history.
- Uploaded reports use the authenticated preview endpoint and lazy-loaded react-pdf viewer, with loading, render-error and retry states.
- Existing submit/review/approve/reject/export/attachment API methods remain in use. Report access controls preserve the existing workflow; this migration does not implement the proposed activity-action XP approval system.
- Report list pagination remains in the V2 workspace. The four non-financial templates require manager access for the current club, matching the existing backend report-author boundary.
- Create/edit forms have subsequently been migrated to V2, including legacy-entry redirects. See [report creation QA](report-create-v2.md).

## Verification

- `node --test src/pages/v2/*.test.js`: 154 passed, 0 failed, including five new permission/evidence-link tests.
- `npm run build`: passed; Vite reports the existing warning for chunks larger than 500 kB.
- `git diff --check`: passed. The initial sandbox test attempt could not spawn Node workers (EPERM); the successful runs used approved execution outside the sandbox.
- Headless Chromium: 13 browser checks passed, no page errors. Screenshots were visually inspected at desktop and mobile. Widths checked: 1440, 1060 and 390 px; no horizontal overflow. The report-specific mobile workspace bar wraps breadcrumb and role/semester into separate rows.

Browser checks used synthetic API interception in the test process, without adding fixtures or alternate data providers to production `/v2`:

1. Workspace list link opens detail without leaving V2; structured sections and author controls render.
2. Workspace fits at 1060/390 px; attachment download/upload/remove use existing endpoints.
3. Failed submit is visible and retryable; successful submit reloads the canonical status.
4. Legacy detail URL redirects to V2.
5. Standalone mobile detail has no horizontal overflow.
6. Manager review uses the existing review endpoint.
7. CTSV observation route exposes no mutation/export controls.
8. Direct CTSV detail can use the existing final-approval endpoint.
9. Export request opens the V2 export-history dialog and reads the nested file metadata.
10. Uploaded-report PDF renders an actual page and text using the authenticated preview endpoint.
11. Preview error exposes retry and recovers to a rendered PDF.
12. Wrong-club report is rejected before rendering its content.
13. API 404/403 responses stay in V2 with explicit states.

Browser artifacts are in the calling chat's visualization directory: `report-detail-browser-check.cjs`, `report-detail-browser-results.json`, `report-detail-desktop.png`, `report-detail-mobile.png`, `report-detail-workspace-mobile.png`, and `report-detail-uploaded.png`.

This verifies frontend behavior against controlled responses. It does not verify a deployed gateway, backend authorization, PDF conversion service or real file storage. Backend remains authoritative for all reads and mutations. Existing unrelated work in `GiftsTab.jsx` was not edited as part of this migration.
