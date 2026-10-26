> Current reconciliation — 2026-10-26: [API/UI integration and remaining obligations](main-api-ui-reconciliation-2026-10-26.md) supersedes older absence/browser-only claims for the capabilities listed there. The earlier audit/checklists below are historical; source integration and live acceptance remain separate.

# Personal experience summary, evidence and radar

Contract tổng hợp 2026-10-22: [Báo cáo Xperience Point và trải nghiệm tự khai](../../../fptu-xperience-doc/docs/contracts/xperience-report-and-self-declaration-contract.md) — phạm vi Admin/ClubHub, một quyền xử lý CLB, mismatch 403 và backend acceptance.

## Club workspace update — 2026-10-22

The production workspace now includes **Trải nghiệm tự khai** at `/v2/my-clubs/:clubCode/student-declarations` for manager/BQL users with scoped visibility. It reuses the authorized declaration queue/detail APIs, retains only the current club's assigned records and offers scoped evidence/history and a separate club review interface. No roster-wide personal experience lookup is performed. Historical rows stay unassigned to a semester unless the server provides an assignment. Members without the unified processing grant and observation routes are blocked; server verification permissions remain authoritative. See [feature and validation details](../qa/club-student-declarations-v2.md).

The queue currently lacks server clubId/semester/search filtering and a privacy-scoped student identity projection for canonical declarations. Future endpoint work should provide those filters, capabilities and safe name/student-code data directly. The UI traverses authorized pages and filters by exact `ClubId`, without fetching private personal profiles. Use the unified `studentDeclarationPermissions` projection below for delegated processing; the previous read-only flag does not authorize processing. The external referring-club workflow below remains pending; a student's ordinary club membership is not consent to share their direct external declaration.

### Unified club processing permission — 2026-10-22

One permission: **Xử lý trải nghiệm tự khai trong CLB**, ID `club.declarations.process`, covers reading records/private evidence, club review/requesting changes and forwarding an endorsed record to CTSV. President/vice president in the current club receive it automatically. Every other role requires the explicit unified grant in `studentDeclarationPermissions`; obsolete `canViewStudentDeclarations` and split read/review/submit grants do not grant processing. Leadership administers grants, with two checked/locked rows and one checkbox for each other role. Processing rights do not grant unrelated management permissions. Observation mode stays blocked; server authorization remains authoritative.

Production has no permission policy persistence, club review or forwarding API. The UI exposes this boundary and keeps real writes disabled. Temporary checkbox choices never grant actual rights. Club endorsement is separate from final CTSV approval and never posts official Xperience Point. Existing declaration reads and private evidence downloads retain server scope checks.

Optional adapter seams are requirements, not implemented endpoints:

- `getClubStudentDeclarationPermissions(clubId)` returns `{clubId,version,roles:[{role,permissions:[]|["club.declarations.process"]}]}`.
- `saveClubStudentDeclarationPermissions(clubId,{expectedVersion,roles},idempotencyKey)` returns persisted scoped policy with a new version and matching grants. Server protects leadership defaults, checks grant administration and audits changes.
- `reviewClubStudentDeclaration(clubId,recordId,{expectedVersion,reason,decision:"ENDORSE"|"REQUEST_CHANGES"},idempotencyKey)` returns the same scoped record, new version and `clubReviewStatus: "APPROVED"|"CHANGES_REQUESTED"`.
- `submitClubStudentDeclarationToStudentAffairs(clubId,recordId,{expectedVersion,reason},idempotencyKey)` returns the same scoped record, new version and `ctsvSubmissionStatus:"SUBMITTED"`; only after club approval.

Record projections require server workflow capabilities `canClubReview` and `canSubmitToStudentAffairs`, independent of the one role permission. Each command must recheck actor, club, active assignment, unified grant, evidence sharing, version and stage. Backend must define revision/resubmission and audit history before enabling writes. No HTTP route is guessed and the final CTSV approval endpoint is never reused for club endorsement.

## Current frontend/source update — 2026-10-21

Rechecked local backend `b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf`, specifically StudentExperienceEndpoints, VerifiedContributionEndpoints, DeclarationExperienceBridge, PrivateEvidenceEndpoints, StudentContributionReadService and Gateway yarp routes. The older 13 October snapshot below is historical; current source now declares the own summary/contribution reads described here. Live gateway/auth/database acceptance is not claimed.

ClubHub adds **Của tôi → Trải nghiệm cá nhân** at `/v2/personal-experience`. It reads the authenticated principal's active-period report and paged experiences, opens their evidence/review history and submits external experiences for review. UI terminology is **Xperience Point**, with existing technical fields such as `rawPoints`/`rawXp` unchanged. Admin's navigation/queue now uses **Trải nghiệm tự khai**.

| UI operation | Existing declared source |
| --- | --- |
| Own active-period report | GET `/api/users/me/experience-summary?scope=PERIOD` |
| Own contributions/declarations, paged/status/semester filters | GET `/api/users/me/contributions` |
| Canonical own experience and review history | GET `/api/contributions/{id}` |
| Historical declaration detail | GET `/api/v1/declarations/{id}` |
| Private PDF/PNG/JPEG upload, max 10 MB each | POST `/api/contributions/evidence`, multipart + idempotency key |
| Authorized evidence download | GET `/api/contributions/evidence/{id}/download` |
| Direct external submission | POST `/api/v1/declarations/`, canonical external bridge request + stable idempotency key |

The form requires 1–10 evidence files, title, organizer/issuer, real occurrence date, semester, description and proposed canonical attributes. Competitions, certificates, qualifications and other experiences are UI kinds retained as readable text in the supported evidence description, not invented database enums. Exactly one of seven canonical categories is proposed at weight 1. Dates carry Vietnam offset. The server validates enrollment-period boundaries, actual evidence ownership/signatures and final scoring; the browser never posts calculated points or claims submission is approval. No student-facing semester catalog is declared by the inspected backend, so the field uses the summary's configured semester when available and allows entry of another supplied canonical code. It does not insert demo semesters.

Successful uploaded evidence receipts are retained in form memory after a submit error. Retry reuses them and the same submission key until inputs change. The list/detail validates own identity; pending and historical non-authoritative records do not become official zero-point awards. Summary/list failures remain independent. No browser persistence or production fixtures were added.

### Pending: optional club reference / endorsement

The user can choose direct submission or prepare a request through a currently affiliated club. **Only direct submission is currently sendable.** `DeclarationExperienceBridge.SubmitAsync` requires `IsOutsideClub=true` and rejects a non-null `ClubId`; putting a referral ID there changes the domain meaning and is invalid. The ClubHub choice therefore does not silently convert to direct submission, send an invented endpoint, or claim a club has confirmed evidence.

Required backend extension: keep external experience ownership/source intact; add distinct `referenceMode`/`referringClubId`, validate current membership server-side, an authorized club endorsement decision with reason/evidence/history, states for awaiting/received/declined endorsement, and forwarding to final CTSV review. Student must explicitly choose bypassing endorsement if allowed; no automatic reroute on club failure. Canonical self list/detail and Admin review must project this referral independently of `ClubId`. Require version/idempotency, author/reviewer separation and private evidence visibility. Club endorsement alone must not post Xperience Point. These fields/states are a proposal, not implemented DTOs/routes.

See [personal-experience QA](../qa/personal-experience-v2.md). The remaining older aggregate/profile requirements below retain their historical context.

Implement Status: Not Yet

Status Scope: Backend implementation: partial Admin foundations

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: Admin DeclarationEndpoints/StudentRadar projections and XP data exist; Auth UserEndpoints.cs lacks own experience-summary, activity-history and club-contribution aggregate projections. Per-club activity statistics are not a student-wide aggregate.

D03; baseline main 80818266, 2026-10-09. Owner: Auth/profile aggregation with Activity/Club and existing Admin experience reads. This is **partially supported**, not a request to recreate experience scoring.

## Reuse existing APIs

- GET `/api/v1/declarations/me` and existing private declaration detail/update flow return the student's evidence records. CTSV review computes raw points using `ExperienceScoringCalculator`; reviewed declarations feed radar.
- GET `/api/v1/declarations/me/radar?semester={canonicalCode}` returns `StudentRadarResponse`, including pillar raw sums, benchmark/saturated values and overall metrics. Map by canonical pillar identifier; do not reinterpret one of six values as a wallet. Preserve the seventh work component and derived metrics supported by that DTO. Default selection must use server semester metadata rather than the handler's FA26 fallback when introducing the ClubHub view.
- Admin `XpLedgerEntry` has student/campus/semester/type/amount/source metadata, but no club wallet or redemptions. Its presence is not proof of contributed spendable points. Existing anomaly/backoffice ledger reads are not a student club-wallet API.

## Proposed missing projections

GET `/api/users/me/experience-summary?semesterId={code}` ->

```json
{"userId":42,"semesterId":"FALL2026","recognizedContributionTotal":120,"attendedActivityCount":3,"approvedClubCount":1,"sources":{"contributions":"club-approved-ledger","attendance":"verified-attendance","clubs":"approved-memberships"},"asOf":"2026-10-09T08:00:00Z","version":"opaque"}
```

`recognizedContributionTotal` means credited contribution records, not current wallet balance (redemption must not lower this total). If a source is not configured/available, return its total as null plus availability metadata; do not report fabricated 0. Deduplicate approved memberships and verified attendance by stable IDs. Only server attendance status qualifies; registering or self-claiming does not imply participation.

GET `/api/users/me/activity-history?semesterId=...&page=1&pageSize=20` -> paged `{activityId, clubId, clubCode, clubName, title, startsAt, attendanceStatus, verifiedAt}` for that principal only. Empty history is normal. Never expose other participants.

Use existing declarations for declaration evidence; add GET `/api/users/me/contributions?semesterId=...&page=1&pageSize=20` only for approved/pending **club contribution** records not represented there, returning `{id, clubId, clubName, title, status, submittedAt, reviewedAt, creditedWalletPoints, evidenceRefs}`. The UI adapter can merge typed sources (`DECLARATION` / `CLUB_CONTRIBUTION`) without losing review rules or double counting. A consolidated evidence read, if introduced later, must retain source IDs and source-specific authorization; it is not another write/review authority.

## Privacy, persistence and acceptance

Self-only reads regardless of global actor role. Public profile preview excludes private identity, personal evidence, contribution totals, points and contact data; expose only consented display fields. Maintain application/history data after self-profile edits. Aggregation failures preserve independent fields with unavailable metadata, not synthetic sample data. Never calculate final totals client-side from a truncated first page.

Tests: two accounts see only own evidence/history; attendance/cancelled/duplicate cases; consistent totals across pagination and redemption; canonical semester; empty versus unavailable; declaration/radar mapping; public preview privacy. FE owner: `ProfilePage.jsx`, `profile-data.js`; replace seeded evidence and radar only after these reads are deployed. No new profile-summary write endpoint.
