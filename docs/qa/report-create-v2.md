# Report templates and V2 editor

Date: 2026-10-16.

Update 2026-10-21: the structured shared editor now has five steps, adding **Báo cáo Xperience Point** before **Xem trước & nộp**. See [current UI verification](report-xp-v2.md) and [required Xperience Point source/save adapter](../contracts/report-xp-workflow.md). Production Xperience Point autofill/save remains unavailable until that backend contract exists; ordinary report payloads retain their existing fields.

Update: new **Báo cáo Tạo hoạt động** creation now uses the dedicated [action/Xperience Point application flow](activity-application-v2.md). The shared report editor and existing ReportService mapping below continue to apply to the other templates and existing legacy FUTURE_EVENT records. Verification counts below describe the earlier report-editor migration; the linked document records current application checks.

## Delivered flow

The workspace **Tạo báo cáo** button opens a V2 modal containing exactly:

1. Báo cáo Hoạt động CLB.
2. Báo cáo Tạo hoạt động.
3. Báo cáo Đầu kỳ CLB.
4. Báo cáo Cuối kỳ CLB.

The first template opens a second modal with an activity dropdown. It loads activities from the existing API for the current club, uses semester time bounds when supplied, filters mismatched club IDs and deduplicates results. Loading/error/retry/empty states are distinct. Continue is disabled until an activity from the loaded list is selected. Back returns to template selection; closing restores focus.

All templates continue to `/v2/my-clubs/:clubCode/reports/create?...` inside the same workspace. The template, club, selected report period and activity ID are carried in query parameters and survive reload. The shared editor also supports `/v2/reports/create` and `/v2/reports/:reportId/edit`. Old `/reports/create` and `/reports/:id/edit` paths redirect at the root router before any legacy layout renders.

For ordinary reports and existing report edits, the V2 editor contains:

- General metadata with template and club scope, current period and deadline where supplied by the API.
- Activities with names, Vietnam-local dates, location, description, participation counts, outcomes, evidence links and money fields already supported by the existing report DTO. Money is labelled VNĐ; it is not an Xperience Point budget implementation.
- Narrative evaluation and plans.
- Preview, save draft and save/submit through existing API methods.
- PDF/DOCX/XLSX upload up to 20 MB, with file-type/size validation.
- Loading, source-error retry, permission denial and save/submit error states.

Activity reports prefill the chosen activity's real metadata, without creating attendance totals or completed outcomes. Start/end reports may have no activity details; no dummy activity is inserted to satisfy a generic form. Future activity reports expose the location/description fields required by the existing backend workflow.

Manager access is checked per club. Observation and ordinary-member access cannot open a writable editor. Editing preserves existing detail IDs and report tag and is restricted to Draft/Rejected states. If draft creation succeeds but submission fails, its ID is retained; retry does not create the report again.

## Existing API mapping and limits

| Template | reportType | tag |
| --- | --- | --- |
| Activity | CLUB_ACTIVITY | CLUB_ACTIVITY:{selectedActivityId} |
| Create activity (existing records only) | FUTURE_EVENT | FUTURE_EVENT |
| Term start | CLUB_TERM_START | CLUB_TERM_START |
| Term end | CLUB_TERM_END | CLUB_TERM_END |

Current ReportService create/update DTOs accept reportType/tag strings and narrative/detail fields. The type/tag pair distinguishes templates, including start/end in one period and separate activity reports under the existing club/period/tag uniqueness rule. These are frontend conventions using existing fields, not a new template-catalog endpoint.

The current create DTO has no `sourceActivityId` field. The selected activity ID is carried in the activity-report tag for traceability and its data is copied into report details. This is **not** a backend-enforced foreign-key relationship or automatic end-of-activity approval/Xperience Point settlement. A future authoritative source-link contract must explicitly add and validate that relationship. Existing FUTURE_EVENT records retain the finance workflow. New create-activity applications use the separate contract in the linked application document; ReportService DTOs do not persist action/Xperience Point plans.

## Verification

- Five new unit tests cover the four-template catalog, context validation and report-period priority, template identity, filtering club/semester activities and Vietnam-local date/zero-count prefilling.
- Full V2 Node suite: 159 passed, 0 failed.
- Production build passed, with the existing chunk-size warning.
- Browser checks use synthetic API interception only; no fixtures were added to production `/v2` and no real records were created.
- Eleven browser scenarios passed: template selection/focus, mobile fit, empty list, error/retry and correct activity payload, all other templates, no-activity term draft, old create redirect, upload validation/save, old edit redirect/update, submit retry without duplicates, and ordinary-member denial.
- Desktop/mobile screenshots were inspected. The editor and both modal steps use V2 controls and styling; the workspace remains visible throughout the scoped flow.

Browser evidence is in the calling chat's visualization directory: `report-template-browser-check.cjs`, `report-template-browser-results.json`, `report-template-desktop.png`, `report-template-mobile.png`, `report-template-activity.png`, `report-create-activity-desktop.png`, and `report-create-activity-mobile.png`.

These checks verify frontend behavior against controlled responses, not deployment, gateway authorization, real PDF conversion or production storage. Backend remains authoritative. Existing unrelated `GiftsTab.jsx` work was preserved.
