# ClubHub report Xperience Point step

Contract tổng hợp 2026-10-22: [Báo cáo Xperience Point và trải nghiệm tự khai](../../../fptu-xperience-doc/docs/contracts/xperience-report-and-self-declaration-contract.md) — phạm vi Admin/ClubHub, một quyền xử lý CLB, mismatch 403 và backend acceptance.

Implement Status: Not Yet

Status Scope: Authoritative backend Xperience Point source, draft persistence and settlement. Frontend five-step UI and guarded adapter integration are implemented.

Source Review: 2026-10-21; local backend HEAD b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. Inspected ReportService/Contracts/ReportContracts.cs: ReportResponse/ReportDetailResponse have no student/action Xperience Point rows and ReviewRequest contains only feedback. Source inspection, not live acceptance.

## Frontend behavior

The shared structured report editor now has five steps: Thông tin chung → Hoạt động → Đánh giá → Báo cáo Xperience Point → Xem trước & nộp. The fourth step is dedicated to Xperience Point; the existing metadata, narrative and upload payloads remain compatible. The separate new activity-application wizard is unchanged.

Activity closing (`CLUB_ACTIVITY`) and end-of-term (`CLUB_TERM_END`) reports can use the Xperience Point panel. Start-of-term and legacy future-event reports explain that planning is not Xperience Point settlement. Uploaded documents retain their existing upload flow, without a five-step structured editor.

The Xperience Point panel supports explicit evidence autofill, student/action filtering and aggregation, row edits, approved unit-point calculation, zero-quantity exclusions, and before/after quantity/evidence/points history with reason/actor/time. Autofill preserves local edits only while identities, approved rates, source availability and server draft version remain compatible. Preview reports Xperience Point totals and whether there are unsaved changes. Source data is never inferred from attendance counts or copied from Admin simulation fixtures.

## Adapter boundary — pending implementation

No new endpoint is guessed and no optional adapter is implemented in `src/services/api.js`. The panel checks for **both** operations below. Without them it shows an explicit unavailable state, disables autofill and leaves ordinary report saving available; preview discloses that no Xperience Point is submitted. Errors never become an empty successful Xperience Point response.

1. `getReportXpDraft(scope)` returns a canonical Xperience Point source/draft. Scope is `{clubId, period, reportType, activityId, reportId}`. The activity ID is extracted only from the existing `CLUB_ACTIVITY:<id>` tag; malformed/missing source identity disables autofill. Term-end uses `activityId: null` and requires complete semester-scoped results.
2. `saveReportXpDraft(reportId, payload)` atomically associates the reviewed Xperience Point snapshot with a saved report. Payload includes scope, expected draft version, source version, reviewed `{sourceId, quantity, evidence}` rows and new changes with source/reason/client time plus before/after quantities/evidence. The server derives rates, totals, actor and authoritative timestamps; it must validate each change against its predecessor, enrollment, evidence and approved rules. Accept only independently authorized draft edits. Server source/version conflicts must fail without partial Xperience Point writes.

Both return the same scoped snapshot, with `version`, `sourceVersion`, `budgetRaw`, `rows`, `changes`, `capabilities.canEdit` and nullable/new or persisted `reportId`. Each row includes stable `sourceId`, `activityId`, student code/name, action ID/title, quantity, approved unit `points`, derived `rawPoints` and evidence. Each change includes stable ID/source/student/action, before/after quantity/raw points/evidence, reason, actor and timestamp. The frontend rejects duplicates, malformed rows/history, mismatched scope and budget overflow.

After saving, the frontend requires a newer version, the same source version, matching reviewed rows and acknowledgement of every new before/after change. A shape-correct stale or partial acknowledgement does not authorize submission. It retains the report ID on failure so retries do not recreate the ordinary report.

Ordinary report create/update payloads **do not** include Xperience Point fields. If Xperience Point exists, its adapter save must succeed before `submitReport` runs. Xperience Point is not credited by form save/submission. Server submit must bind the exact persisted Xperience Point version and closing-review must independently authorize durable ledger posting. The frontend ordering alone is not an atomic submission/settlement transaction; production enablement requires that server invariant, concurrency/idempotency and durable receipts first.

The production adapter and its URLs must be added only after these backend contracts exist and are validated. The browser QA script supplies controlled optional methods solely to exercise UI success/failure paths. This does not connect ClubHub to the Admin in-memory simulator.

## Related work

- [Shared report-editor behavior](../qa/report-create-v2.md)
- [Frontend/backend handoff](backend-api-implementation-handoff.md)
- [Admin Xperience Point workflow and authoritative requirements](../../../fptu-xperience-admin-ui/docs/contracts/activity-xp-report.md)
- [Browser and workflow verification](../qa/report-xp-v2.md)
