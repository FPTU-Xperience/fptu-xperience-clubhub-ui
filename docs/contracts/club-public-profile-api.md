# Club public profile editing

Status: **proposed manager-scoped API, not implemented in the current backend** (2026-10-09). The frontend exposes the full page preview first and opens separate text, logo, and cover dialogs. All writes use `src/services/api.js`. Editing text never uploads files or changes image fields; image saves do not submit public text fields.

## Public text update

`PATCH /api/clubs/{clubId}/public-profile`, authenticated active assigned manager of that club (optionally an ADMIN/STUDENT_AFFAIRS_ADMIN).

Accept a partial object containing only `name` (non-empty, <=200), `category` (canonical active code from the persisted category catalog, <=40), `description` (<=1000), `contactEmail` (valid email or empty, <=255), `contactPhone` (<=20), and `scheduleLabel` (<=500). Omitted fields are preserved; an empty string clears optional text. Return the updated club DTO. Reject image URLs, active/deleted status, manager assignments, recruiting status, and unknown properties. Public-page editing must not reactivate a deleted club.

The frontend uses one edit button beside the club name and one text dialog containing all six public fields, organized into General, Introduction, Contact, and Schedule tabs with one shared Preview/Cancel pair. Switching tabs preserves the draft. Validation checks all tabs and reveals the tab containing the first invalid field. Preview closes the dialog and stages all six fields on the page without any API write. A visible pending-preview bar provides Save changes/Cancel; only Save changes submits the profile API. Cancel restores saved text while preserving independently saved images. Reopening the dialog uses the staged text; cancelling that dialog preserves the preceding preview. Failed saves retain the staged preview and display a page error, including explanations for unsupported 404/405 responses or 403 access denial. Successful saves replace the saved baseline and clear the pending preview. Logo and cover remain separate dialogs.

Do not fall back to `PUT /api/clubs/{id}`: that endpoint requires StudentAffairsAdministration and its `isActive` request defaults to true.

## Semester schedule editor

The Schedule tab selects semester/year, one or more weekdays, a weekly-repeat flag, and one start/end pair using two slider handles with 30-minute increments. There are no academic blocks or calendar grid. Times range from 00:00 to 24:00 with a minimum duration of 30 minutes, within one day. The same time interval applies to every selected weekday.

For the current text-only contract this serializes to `scheduleLabel`, for example `FA2026 · T2, T7 · 18:00–20:00 · Hằng tuần`. Older labels ending in `Lặp lại hàng tuần` or `Lặp lại hằng tuần` remain editable and display as `Hằng tuần` without implicitly writing saved data. Recognized labels restore the controls. Legacy free text is preserved until the user edits the schedule; Cancel discards the modal draft. Editing a schedule requires at least one weekday; explicitly clearing it is allowed. Semester selection describes the public schedule and does not modify the Admin academic calendar or student timetable.

This is presentation metadata, not activity generation. Before adding real recurring events or attendance sessions, implement structured schedule persistence (`year`, `term`, `days`, `startTime`, `endTime`, `repeatWeekly`, timezone and applicable dates) and define the occurrence dates for non-repeating selections. A label alone must not create calendar events.

## Images

See [public-image-api.md](public-image-api.md) and [media-storage-integration.md](../media-storage-integration.md). Logo and cover have separate dialogs and independent uploads/saves. A save sends the new selected image URL plus the currently saved other URL to the existing proposed `PUT /api/clubs/{clubId}/public-images` contract. The configured delivery origin remains the selected R2 `r2.dev` origin. The UI does not claim persisted images or successful text saves without a successful backend response.

## Backend verification needed

- Manager can edit their club, cannot edit another club; ordinary members cannot write.
- Partial updates preserve other public fields, image URLs and active/deleted state.
- Invalid names, categories, lengths and email formats are rejected server-side.
- Saved content survives reload and appears on public detail reads.
- Logo/cover writes preserve the other image and text; unauthorized upload intents are denied.


## Latest-main reconciliation and structured schedule — 2026-10-09

Fetched main 80818266 has `GET/POST /api/clubs/categories` and persisted category definitions. Public-profile PATCH is still absent. Reuse category-code lookup; legacy application mapper still normalizes static categories, so D14 must prevent custom categories being collapsed to OTHER. FE editor currently uses local category choices and scheduleLabel; migrate its adapter with the backend contract.

PATCH also supports `expectedVersion` and a structured `schedule: {semesterId,weekdays,startTime,endTime,repeatWeekly,timezone}`. Weekdays are unique integers 1..7 (Monday=1), at least one; timezone fixed `Asia/Ho_Chi_Minh`; minutes in 30-minute increments, 00:00 <= start < end <= 24:00. Validate authoritative semester code; one interval applies to every selected day. Explicit null clears schedule. Server serializes the public `scheduleLabel` for display with `Hằng tuần`; this metadata never creates activities or attendance sessions. Reject both structured schedule and legacy scheduleLabel in the same patch. Legacy free-text scheduleLabel remains accepted/preserved until deliberate conversion; do not overwrite old arbitrary text with an invented schedule.

Return version plus updated public DTO, structured schedule and both image URLs. Preserve active/deleted/recruitment and unrelated fields. Capability-authorized owner/vice/CONTENT/HR may edit public profile and corresponding media according to D06; generic manager/admin authorization remains compatibility until role migration. Full club leadership does not bypass platform/CTSV final approval or permit another user's personal-profile writes. [Conventions](api-contract-conventions.md), [handoff](backend-api-implementation-handoff.md).
