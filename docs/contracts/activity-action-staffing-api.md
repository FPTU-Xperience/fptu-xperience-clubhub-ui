# Activity application, action XP, publication and staffing gap

Implement Status: Not Yet

Status Scope: BE action operational routes implemented; scoring/final report/budget incomplete

Backend Progress: PARTIAL_OPERATIONAL_SOURCE_IMPLEMENTED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#actions).

**Đã có BE:** 7 application và các route publication/staffing/assignment/recruitment/completion/verify đã có persistence, audit, CAS và quyền hiện tại.

**Chưa hoàn thành / giới hạn:** expectedRawXp=null/canAwardPoints=false; adapter FE numeric phải đổi. Final report/awards/budgets/caps/+1/rollover chưa chốt.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Activity application, action XP, publication and staffing gap

Historical Implement Status: Not Yet

Historical Status Scope: Backend resources required by the current activity application/publication/staffing FE, plus final-review obligations in the action proposal. Existing verified contribution APIs are foundations, not this contract.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf; FE baseline 82e5e63ca9061cae5f287cb93d8d03f34f96ad5b. Sources: `src/pages/v2/activity-application/`, `services/activity-staffing.js`, `components/v2/activity-detail/ActivityStaffingPanel.jsx`, `club-workspace-page/tabs/QuestsTab.jsx`, `activity-publication.js`; backend Activity/Admin endpoint declarations, contracts, models, contexts and Gateway. The action proposal (tham chiếu gốc ../../../fptu-xperience-doc/feature-requests/activity-action-xp-approval-proposal.md; tài liệu chưa có trong checkout này) is explicitly a proposal. Its numeric policy and final approval ownership must be resolved against the product baseline (tham chiếu gốc ../../../fptu-xperience-doc/documents/final-product-baseline.md; chưa thể xác minh từ checkout này) before enabling awards.

## Current gap and compatibility

The BE has activity CRUD/publishing through lifecycle `PUT /api/activities/{id}`, session-based check-in, verified contributions, policy snapshots, verification assignments, append-only effects, club plans/statistics/PDF. It lacks `/api/activity-applications`, action rules/completions/staff assignments/recruitments and the FE's integer-version `/publication` toggle. Do not adapt FinanceService money reports, automatically create an approved activity from an unapproved dossier, or substitute T1..T5 contribution scoring for arbitrary `basePoints`.

Current BE publication uses GUID `version` and `publicationStatus` (`DRAFT/PUBLISHED/CLOSED/LEGACY`); CLOSE closes registration and does not unpublish. Current FE action contract uses `isPublished`, positive integer `publicationVersion` and source application ID. A compatibility decision or new canonical adapter is required; mapping “hide” to CLOSE would be incorrect.

## Application resources already called by FE

| Method | Path | Required behavior |
| --- | --- | --- |
| POST | `/api/activity-applications` | Create own authorized club dossier draft; return ID, version, persisted draft and server estimates |
| GET | `/api/activity-applications/{id}` | Owner club/reviewer read with authorized capabilities, no other applicant PII |
| PATCH | `/api/activity-applications/{id}` | Edit DRAFT or REVISION_REQUESTED using expectedVersion |
| POST | `/api/activity-applications/{id}/submit` | Validate complete dossier and bind its revision for review |

FE body is defined by `activity-application-data.js/applicationPayload`: numeric `clubId`, canonical `period`, title/description/objective/location, UTC start/end, `scale`, `independentActionsConfirmed`, `actions`, `recruitment`. Each action contains stable `clientId`, name, positive decimal basePoints, canonical contributionRole, scaleSource ACTIVITY/OVERRIDE and selected scale, positive integer expectedPeople/expectedOccurrencesPerPerson/maxAwardsPerPerson/maxAwardCount, ATTENDANCE/WORK_REVIEW, FULL_ONLY completion and ADDITIVE stacking. Limits must cover the proposed counts. Server must assign stable actionRuleIds and versioned formula/policy snapshots; the browser estimate is never an award authority.

Recruitment wire body: null when disabled; otherwise PUBLIC/PRIVATE visibility, SCHOOL_STUDENTS/CLUB_MEMBERS eligibility and `positions[]` of `actionClientId` and capacity. The local editor's enabled/actionIds fields are not sent. Private recruitment must be restricted to club members. Name, description, date, point precision, maximum action/count/amount and payload limits require documented server validation; do not accept unbounded JSON just because FE validates.

Add SA approve/reject/request-revision resources with a documented decision DTO, expectedVersion, reason, optional suggested budget and unique final decision. Their final URL is a BE-owned extension because the current FE has no corresponding reviewer client. Approval binds the immutable content/actions/category allocation/policy and creates exactly one unpublished execution activity, not points. Repeated approve returns the same activity. Resubmission creates a new revision preserving earlier review history. Nonmembers, cross-club actors and stale revisions are denied.

## Staffing projection and existing mutation consumers

GET `/api/activities/{activityId}/staffing` returns the activity ID, **positive integer** aggregate version, applicationStatus, server capabilities, `actions[]`, `assignments[]`, optional `recruitment` with `positions[]` and optional `eligibleAssignees[]`. Each assignment needs userId/displayName/actionRuleId/actionName, HOST/STAFF kind, status, canRemove, verifiedOccurrences, pendingRawXp, and optional completion rows (`id`, version, occurrenceLabel, status, canVerify). Return only assignees/applicant fields permitted for that principal. Public viewers do not receive a general school roster or private application evidence.

Every mutation below is relative to `/api/activities/{activityId}/`, carries `expectedVersion`, and requires `Idempotency-Key`. POST/PATCH receipts must contain a committed aggregate version greater than the input. FE reloads after acknowledgement and retains the same key for the same path/body retry. If BE chooses GUIDs instead, update `validateStaffing` and all consumers together.

| Method / suffix | Additional payload / invariant |
| --- | --- |
| POST `assignments` | `userId`, `actionRuleId`, HOST/STAFF assignmentKind; only a server-returned eligible account, approved action and available slot |
| POST `assignments/{id}/cancel` | Keep assignment/history; do not erase verified completions or credited effects |
| POST `action-completions/{id}/verify` | `completionVersion`; independent verifier; approved source and completion evidence; never self-verify |
| POST `recruitment` | title, description, visibility, eligibility, positions of actionRuleId/capacity/assignmentKind |
| PATCH `recruitment` | Same validated shape plus expectedVersion; immutable history/filled-position constraints |
| PATCH `recruitment/status` | OPEN/CLOSED; explicit permission and approved source |
| POST `recruitment/positions/{positionId}/join` | Own principal only; eligibility, unique active participation and atomic last-seat reservation |

GET `/api/clubs/{clubId}/activity-recruitments` must return the same recruitment IDs as activity staffing, with server pagination/filters. `QuestsTab` uses this resource, not a separate XP quest ledger. A staffing assignment does not confer club office, a global actor, activity management, finance or verifier powers.

The exact join suffix and request fields must remain in lockstep with `ActivityStaffingPanel.jsx`; the route inventory cannot resolve its generic mutation suffix automatically. Before implementation run UI/service tests plus a source diff of all `mutate(...)` call sites.

## Execution, final report and ledger

The proposal separates independent action completion verification from final XP approval. A verified completion holds pending raw XP. A closing report snapshots actions, participants, evidence, counts, applied policy and budget consumption; final authorized approval records each effective award exactly once. Reject/revision leaves awards pending and retains decision history. Add distinct report submission/review resources and frontend review UI; do not claim existing immediate contribution approval already implements this delayed report gate.

Persist application/revision/decision, action rule versions, activity source link, recruitment/position, assignment intervals, completion/verification and final-report award references. Choose one canonical source key including action rule and occurrence; dedupe across attendance/manual contribution/retry paths. Award limits and available raw budget are checked transactionally. Corrections append linked compensating effects; no history deletion. Actor, club, activity and active capability are revalidated after every authority change. Use outbox events for notification and record recipient dedupe.

## Publication API required by the existing action UI

PATCH `/api/activities/{id}/publication`: `{isPublished,expectedVersion}` with `Idempotency-Key`; source-approved activity only; response `{id,isPublished,publicationVersion}`. Discovery and recommendations must respect publication immediately. Clarify whether an activity with registrations can be hidden and what students see. Do not silently unpublish a current BE record using its unrelated CLOSE operation.

## Acceptance

- Draft/revision/submit/approve race and retry; at most one execution activity per approved dossier.
- Backend recomputes estimates; arbitrary base values and stacking cannot mint unapproved points.
- Same recruitment entity across activity and workspace; private/cross-campus visibility; last-seat race; duplicate join.
- HOST/STAFF assignment never grants permissions; expired verifier and self-verification denied.
- Completion alone produces no final action award; final report approval is replay-safe and budget-limited.
- Published/hidden/deep-link behavior; cancellation, session changes and final-report adjustments preserve history.
- GUID versus integer version compatibility, 401/403/404/409/429/503, Gateway ownership, migrations, service tests and authenticated browser acceptance.

Until implemented, existing FE availability/errors must remain truthful. Never fall back to fake success, browser-local points or direct creation of an approved activity.

</details>
