# Verified experience operations and club reporting

Implement Status: Done

Status Scope: Existing backend operations and current FE consumers at source level; service/runtime/migration and business-policy acceptance are separate. Source projection limitations remain active.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. Evidence: VerifiedContributionEndpoints, PrivateEvidenceEndpoints, ManualAttendanceEndpoints, VerificationAssignmentEndpoints, ExperiencePolicyEndpoints, ActivitySessionEndpoints, ClubSemesterPlanEndpoints, ClubExperienceStatisticsEndpoints, ClubExperienceReportEndpoints, their strict DTOs, persistence/migrations, Program registrations and Gateway experience route precedence.

## Student and assigned-verifier operations

| Endpoint | Current consumer / invariant |
| --- | --- |
| POST `/api/contributions/evidence` | PrivateEvidence uploads one PDF/PNG/JPEG up to 10 MiB as multipart with idempotency; no JSON content type or public URL |
| GET `/api/contributions/evidence/{id}/download` | Protected bearer download from own/assigned source; no public evidence link |
| POST `/api/v1/declarations` | Profile external declaration form supplies canonical semester, occurredAt, proposed effort attributes and private evidence IDs, exactly one selected category; no proposed raw-point amount |
| POST `/api/activities/{activityId}/contributions` | Student authorized session form submits frozen source blueprint, requested role/result, source activity version and own evidence; server dedupes one source per user/session |
| GET `/api/contributions/{id}` | Profile detail shows current contribution, calculation, decisions, revisions and effect allocations; legacy previews do not masquerade as canonical editable sources |
| PATCH `/api/contributions/{id}` | Own SUBMITTED/REVISION_REQUESTED revision with expectedVersion; CLUB tier/scale/vector remain source-bound |
| POST `/api/contributions/{id}/role-upgrade-requests` | Own approved source, proposed higher role/result, evidence/reason and contribution version |
| POST `/api/contributions/{id}/reviews` | Assigned non-self reviewer; APPROVE/REJECT/REQUEST_REVISION, reason, contribution version, verified attributes only for approve |
| POST `/api/contributions/{id}/role-upgrade-requests/{requestId}/reviews` | Uses upgrade version, preserves original blueprint/policy; private upgrade evidence is available to current reviewer |
| POST `/api/contributions/{id}/adjustments` | Assigned experience.adjust, non-self; CORRECT/REVOKE with reason/version; corrected attributes only for CORRECT; append-only effect |
| GET `/api/verifications/me/queue` | Profile verifier tab and manager Points tab use server-assigned scope, paging and own exclusion; no inferred grant from club title |
| GET/POST `/api/activities/{a}/sessions/{s}/manual-attendance-requests` | Own history entry can request manual confirmation with private evidence; source enables it and server rechecks registration/time/status |
| POST `/api/activities/{a}/sessions/{s}/manual-attendance-requests/{id}/reviews` | Assigned independent verifier uses manual-request version, decision/reason and no arbitrary verified scoring attributes |

`components/v2/experience/` owns these FE flows. Retry keys remain stable for identical commands. File uploads must finish before submit. Server 403/409/503 is shown, never converted into local awards. Current self declaration intake accepts outside-club sources; target BOD referral/SA-final/raw-wallet policy remains a separate gap.

## Admin authority and policy

Admin RoleMatrix includes verification-assignment list/create/revoke/restore/expiry controls using `/api/verification-assignments`. Search returns real account choices; source types CLUB/EXTERNAL/REAL_WORLD and capabilities contribution.review/attendance.verify/experience.adjust are explicit. CLUB requires a club ID; others use null. Server validates active account/club and GUID version; roles alone do not authorize verification.

Admin Rubrics includes GET `/api/v1/student-affairs/benchmarks/{id}/policy`, POST `/draft` and POST `/approval`. It reads version through the policy projection, requires an explicit basis/environment/scope and unchecked-by-default parameter agreement before approval, and distinguishes locking from immutable policy publication. This audit never sends an approval or invents agreed parameters. Existing server policy supports REVERSE_SOURCE_INVALIDATION; coefficient/+1 differences from product requirements remain open decisions.

## Activity session and club report operations

Manager detail integrates GET/POST sessions, PATCH session, POST close/cancel and GET attendance-challenge. Time inputs convert from Asia/Ho_Chi_Minh, onsite mode requires a geofence, and operations send the appropriate activity/session GUID. Challenge is an opaque server token with displayed 30-second expiry.

Manager publication uses existing lifecycle PUT operation=PUBLISH/CLOSE for recognized GUID publicationStatus records. CLOSE closes registration while keeping the activity visible. The proposed action application's bool/integer unpublish API remains missing and is not emulated with CLOSE.

Manager Reports integrates GET/PUT semester-plans with plan version, GET experience-statistics, POST experience-reports with expectedPlanVersion/expectedLedgerRevision, GET status and protected PDF download. Response identity is reportId, not an assumed id. Only verified raw distributions are presented; missing plans/downstream failures/stale snapshots remain errors.

Remaining safe reads: [source projection gaps](../experience-source-projections-api.md). Target wallet, raw budget, final action-report gate, rollover and full governance are not provided by these operations. Validation: [audit QA](../../qa/fe-be-audit-2026-10-19.md).
