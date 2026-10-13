# Contract lifecycle / current BE source audit — 2026-10-13

Implement Status: Done

Status Scope: Documentation audit; does not mean the proposed backend features are complete.

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: Existing handlers/DTOs/models/DbContexts/migrations, Gateway configuration and regenerated facade declarations were inspected. No backend source was modified.

## Status semantics

Every retained Markdown file in docs/contracts and specs/*/contracts has exactly one `Implement Status: Done`, `Implement Status: Not Yet` or `Implement Status: Cancel` line.

- **Done**: complete for the explicitly stated scope in that file. For documentation/audit files this means the report was refreshed, not its listed backend gaps implemented. Existing notification reads are Done at the inspected source level, without live sign-off.
- **Not Yet**: at least one required backend/persistence/policy/integration obligation remains. Existing foundations and partially present routes do not make the complete contract Done. Optional/deferred work stays Not Yet unless explicitly cancelled.
- **Cancel**: retired/replaced scope. Outdated files were deleted as requested, so Cancel decisions remain in the retirement ledger rather than as dead contract files.

Current retained files: **31**, comprising **3 Done** and **28 Not Yet**. Two outdated reports are retired in this batch. No active feature is cancelled merely because it has not been built.

## Verified baseline and method

API local HEAD and fetched origin/main both match **80818266f617bd5144ab1b1a6cd0e74983983a4d**, with no ahead/behind divergence and a clean backend worktree. FE session commit is **b9832cd**; later branding and a user-owned ClubDetailPage change are present in the working tree. This audit changes documentation and inventory tooling only.

Reproduced `node scripts/audit-api-contracts.mjs ../fptu-xperience-clubhub-api 2026-10-13`: **95 wrappers = 87 declared direct operations + 2 composed reads + 6 absent**, zero unresolved facade wrappers. [Current declaration inventory](api-declaration-inventory.md) lists exact files/lines. Parent Report/Activity/Finance groups are resolved explicitly; 17 helper/root declarations remain listed for manual review and are not the matched facade paths. Admin semester/quest/declaration/radar resources were also read directly; their existence is not inferred solely from this limited facade inventory.

Both composed reads now include the active club directory: selection uses own access + directory; inbox uses self memberships + directory. Existing code/logo/access/review fields support navigation and seven-day display. Backend still lacks self withdrawal and source/capability/version metadata, persisted pins, media/profile, governance/roster and other proposed resources.

GitNexus runner/index is unavailable in this checkout; no graph query/impact claim is made. The previous CLI fallback could not produce a graph. Backend was read only. No backend tests, migration, database, authenticated running Gateway, deployment, R2 signing/delivery or browser E2E was run; Done here must never be presented as production success.

## Session BE changes

New [club navigation/applications](club-navigation-applications-api.md): implement D10 own withdrawal and capabilities/source; enrich own rows with canonical code/logo and version; reuse reviewedAtUtc for the seven-day result rule; optionally replace browser-local pins with self-only durable pin resources. No new APIs for logo fallback rendering, icon placement, font or badge colors. The existing [D10 contract](my-clubs-membership-api.md) remains the sole withdrawal workflow owner.

## Every retained contract and supporting file

| File | Implement Status | Scope | Current source evidence / remaining gap |
| --- | --- | --- | --- |
| [docs/contracts/activity-discovery-api.md](activity-discovery-api.md) | Not Yet | Backend implementation | ActivityService activity list/detail remain access-scoped management reads; no /api/v2 feed, published-visibility model or recommendation Gateway route. Inspect ActivityEndpoints.cs, ActivityContracts.cs and Gateway/ApiGateway/yarp.json. |
| [docs/contracts/activity-profile-resources-api.md](activity-profile-resources-api.md) | Not Yet | Backend implementation | ActivityEndpoints.cs and ActivityWriteEndpoints.cs provide core CRUD/attendance, but ActivityContracts.cs has no resource gallery/capabilities or cover field; resource upload/commit routes and public activity projection are absent. |
| [docs/contracts/api-contract-conventions.md](api-contract-conventions.md) | Not Yet | Backend adoption of proposed conventions | Shared auth/error/outbox infrastructure exists, but proposed endpoints do not yet implement this package-wide version, principal, idempotency and migration contract. ClubMembershipResponse lacks version/capability/source; no own withdrawal/pin resources. |
| [docs/contracts/api-declaration-inventory.md](api-declaration-inventory.md) | Done | Documentation: regenerated declaration inventory, not backend feature completion | scripts/audit-api-contracts.mjs was executed against current source: 95 wrappers, 87 declared, 2 composed, 6 absent, 0 unresolved wrappers. Unresolved helper groups remain listed explicitly; no handler/deployment sign-off. |
| [docs/contracts/backend-api-implementation-handoff.md](backend-api-implementation-handoff.md) | Not Yet | Backend work tracked by this handoff | The dependency waves remain open: own withdrawal, media/profile, governance, semester roster, credit/rewards, discovery and timetable persistence are absent or incomplete in the source contexts/endpoints. |
| [docs/contracts/backend-changes-for-frontend.md](backend-changes-for-frontend.md) | Not Yet | Backend work indexed here | All D01-D14 obligations remain active; source foundations are available but missing capabilities are documented in each topic contract and the current lifecycle matrix. |
| [docs/contracts/club-contributions-points-api.md](club-contributions-points-api.md) | Not Yet | Backend implementation | AdminDbContext declares Quests, QuestParticipants and XpLedgerEntries, but ClubDbContext has no club task evidence/review, wallet or credit-ledger entities/routes. Admin raw XP is not this spendable credit lifecycle. |
| [docs/contracts/club-event-operations-api.md](club-event-operations-api.md) | Not Yet | Backend implementation | ActivityWriteEndpoints.cs contains CRUD, participants, check-in and attendance; specialist content PATCH, staff assignment, versioned registration forms and reviewed registration application resources are absent. |
| [docs/contracts/club-governance-groups-api.md](club-governance-groups-api.md) | Not Yet | Backend implementation | ClubDbContext/ClubContracts and shared access retain memberships, active owner assignments and boolean treasurer access; no governance terms/groups/revisions/change sets/board snapshots/vice nomination entities or endpoints. |
| [docs/contracts/club-governance-groups-proposal.md](club-governance-groups-proposal.md) | Not Yet | Backend implementation of retained product decisions | This remains useful product context for the canonical governance contract. Existing TransferEndpoints.cs/treasurer rules are foundations, not multi-group assignments or report/history implementation; do not retire the agreed decisions. |
| [docs/contracts/club-member-invitations-api.md](club-member-invitations-api.md) | Not Yet | Backend implementation: partial existing invite/consent workflow | MemberManagementEndpoints.cs InviteClubMember exists; MembershipEndpoints.cs requires personal consent before approval. SemesterEndpoints.cs is backoffice-scoped; school roster/eligible lookup, canonical invite identity/semester validation and invitation delivery events are missing. |
| [docs/contracts/club-navigation-applications-api.md](club-navigation-applications-api.md) | Not Yet | Backend implementation: session addendum | Existing code/logo/access/review fields support part of the UI. Self withdrawal, source/action/version metadata and persistent account pins are absent; exact source files and acceptance tasks are detailed below. |
| [docs/contracts/club-public-profile-api.md](club-public-profile-api.md) | Not Yet | Backend implementation | ClubEndpoints.cs has admin PUT and public reads but no manager public-profile PATCH. Club model has ScheduleLabel only; no structured term schedule or persisted cover; category persistence alone does not satisfy this contract. |
| [docs/contracts/contract-lifecycle-audit.md](contract-lifecycle-audit.md) | Done | Documentation: current contract/source audit, not integration completion | Fetched API origin/main matches local HEAD; every retained docs/contracts and specs/*/contracts file has one status and evidence. See matrix, retirement ledger and verification limits below. |
| [docs/contracts/existing-api-hardening.md](existing-api-hardening.md) | Not Yet | Backend/consumer hardening | MemberManagementEndpoints.cs still permits managed personal snapshot writes; ManagerEndpoints.cs trusts client ManagerName; QuestEndpoints.cs accepts target StudentUserId; ReportContracts.cs exposes StoragePath. Existing routes are not proof of the required fixes. |
| [docs/contracts/frontend-api-debt-register.md](frontend-api-debt-register.md) | Not Yet | Backend/integration debt tracked here | Regenerated facade inventory retains six absent operations and two composed reads. Topic resource/policy/persistence gaps remain; D10 now also references durable pin preferences and seven-day inbox behavior. |
| [docs/contracts/my-clubs-membership-api.md](my-clubs-membership-api.md) | Not Yet | Backend implementation: existing composed reads only | ClubEndpoints.cs exposes own access/memberships and review timestamps; MembershipEndpoints.cs has no self withdrawal route. ClubWorkflowStatuses.cs lacks WITHDRAWN, and ClubMembershipResponse lacks source/capability/version/code/logo. |
| [docs/contracts/page-integration-checklist.md](page-integration-checklist.md) | Not Yet | Complete FE/BE integration and live acceptance | Several pages use existing live-shaped reads, but source declarations do not complete media/profile/governance/credit/timetable/withdrawal contracts or authenticated deployment checks. See current audit and per-page unchecked tasks. |
| [docs/contracts/personal-experience-api.md](personal-experience-api.md) | Not Yet | Backend implementation: partial Admin foundations | Admin DeclarationEndpoints/StudentRadar projections and XP data exist; Auth UserEndpoints.cs lacks own experience-summary, activity-history and club-contribution aggregate projections. Per-club activity statistics are not a student-wide aggregate. |
| [docs/contracts/profile-cover-rewards-api.md](profile-cover-rewards-api.md) | Not Yet | Backend implementation | Admin quest/XP models exist; no server cosmetic catalog/inventory, club wallet, redemption receipt or verified shape publication entities/endpoints. FE cosmetic ownership remains local sample state. |
| [docs/contracts/public-image-api.md](public-image-api.md) | Not Yet | Backend implementation and storage integration | Club.LogoUrl is readable; public detail mapper returns null cover. No media upload intent, public-images PUT, activity cover PUT or user-image persistence; yarp.json has no /api/media route. |
| [docs/contracts/public-member-directory-api.md](public-member-directory-api.md) | Not Yet | Optional/deferred backend capability, not cancelled | MemberManagementEndpoints.cs provides private management reads, but no opt-in member public route or per-club consent persistence. Public leaders/count do not satisfy a consent-based directory; deferral does not mean cancellation. |
| [docs/contracts/self-profile-sync-api.md](self-profile-sync-api.md) | Not Yet | Backend implementation | AuthDbContext has Users/Roles/RefreshTokens, no canonical profile store. UserEndpoints.cs exposes users/me identity and admin updates but no self profile GET/PATCH; club personal data remains membership snapshots. |
| [docs/contracts/semester-student-roster-api.md](semester-student-roster-api.md) | Not Yet | Backend implementation | AdminDbContext persists Semesters and migration AddSemesters exists, but no semester student roster revision/import/carry-forward entities/routes in Admin/Auth contexts. General accounts and club roster reads are not the school roster. |
| [docs/contracts/study-schedule-api.md](study-schedule-api.md) | Not Yet | Backend implementation | Semester catalog persistence exists, but AuthDbContext/AdminDbContext have no private weekly timetable or academic block-date resources, import/cell routes or academic-calendar Gateway prefix. |
| [docs/contracts/workspace-semester-context-api.md](workspace-semester-context-api.md) | Not Yet | Backend implementation | Admin SemesterEndpoints.cs requires BackofficeUser. No club-safe /semesters projection with configured activity bounds/report aliases, finance attribution or term-indexed schedules; shared FE selection is not server authority. |
| [specs/001-discover-production/contracts/discover-ui-contract.md](../../specs/001-discover-production/contracts/discover-ui-contract.md) | Not Yet | Backend implementation: partial directory/detail foundations | ClubEndpoints.cs supplies active directory/public detail and ClubCategories persistence. ClubDirectoryResponse still includes manager identities and contacts; strictly minimal directory projection and server-authorized personalized recommendation behavior are not fully implemented. |
| [specs/002-header-production/contracts/notification-summary.md](../../specs/002-header-production/contracts/notification-summary.md) | Done | Backend source implementation of existing notification read contract | NotificationEndpoints.cs GetNotificationsAsync uses authenticated actor and scoped recipients; NotificationExtensions.cs applies access filtering and safe DTO mapping; notification persistence and Gateway route exist. Bounded six-item presentation is FE-only; no live or newly executed service-test claim. |
| [specs/003-activity-discovery/contracts/activity-discovery-contract.md](../../specs/003-activity-discovery/contracts/activity-discovery-contract.md) | Not Yet | Backend implementation | Canonical /api/v2 activity feed/detail/recommendations are absent from service endpoints and Gateway; existing management activity reads do not meet this display-safe discovery contract. |
| [specs/004-club-workspace/contracts/workspace-ui-contract.md](../../specs/004-club-workspace/contracts/workspace-ui-contract.md) | Not Yet | Backend/integration scope: partial authorized workspace | Current route resolves server clubCode from existing own-access/directory composition and role-gates the workspace; richer selection is optional and absent. Governance, profile/media, semester, credit/rewards and withdrawal dependencies remain open. |
| [specs/005-profile-production/contracts/profile-service.md](../../specs/005-profile-production/contracts/profile-service.md) | Not Yet | Backend implementation | Canonical self-profile GET/PATCH/media/experience/owned-cosmetics contracts remain missing from Auth/Club source. Account-local browser state and membership imports are not durable self-profile integration. |

## Documentation validation

`node scripts/check-contract-docs.mjs` passes across all 31 retained contracts plus existing QA documents: exactly one allowed status and an explicit scope per contract, pinned source commit present, local link targets exist, and JSON examples parse. The checker retains the original QA-link/JSON checks and now covers all five spec-contract directories. `git diff --check` passes. No application code or backend service was changed by this documentation task.

## Retirement ledger

| Removed file | Implement Status | Replacement and preserved scope |
| --- | --- | --- |
| `frontend-api-audit.md` | Cancel | Dated duplicate audit with stale composed-read/canWithdraw details. Current declaration table is in api-declaration-inventory.md; source status and compatibility are here and in [existing hardening](existing-api-hardening.md); exact workflows remain in topic contracts. |
| `api-debt-source-inventory.md` | Cancel | Obsolete 2026-10-09 line-marker snapshot. Replaced by regenerated facade source evidence and this per-contract source matrix; old file/line counts are not current coverage. |
| `club-member-roles-api.md` (removed before this batch) | Cancel | Canonical [governance groups](club-governance-groups-api.md) replaces single-primary-role PATCH. Self-profile and ownership/treasurer constraints remain in active owners. |

References to the two newly removed reports were rewritten. Retained governance proposal is product context, not an outdated competing API; its canonical DTO owner is governance-groups-api. No other missing/partial contract was removed, and deferred public-directory work is not cancelled.

## Preserved compatibility / owners

[Shared conventions](api-contract-conventions.md) own transport/errors/version/idempotency. [Hardening](existing-api-hardening.md) retains old audit findings that still apply. Generic admin club PUT is not manager public-profile PATCH; manager DELETE membership is not self withdrawal; raw XP, credited wallet points and financial money remain different units. Self-profile GET/PATCH supersedes old PUT/student-profile aliases. Current activity CRUD/attendance, notification reads, semester/category persistence and owner transfer are existing foundations to reuse.

## Current UI / integration split

| Surface | Implemented in this batch | Still required for live integration |
| --- | --- | --- |
| Manager members tab | DEV-only Ban quản lý with local synthetic data; existing live member/invite flows retained | Real catalog, term/approved-member query, capabilities and group mutations |
| Group editor | Name/preset/checkboxes, create/edit, member add/transfer/remove, dissolution, local union/finance constraints | Server authority, transaction/concurrency, duty constraints, immediate revocation across services |
| History | Local persistent personal timeline, group change events, before/after grants, preserved demotion history | Persisted immutable BE events/intervals, stable paging, system expiry and appointment events |
| Reporting | Immutable local submitted snapshot, reportNeedsUpdate after configuration changes, previous-semester read-only example | Semester/report window policy, server snapshot/idempotency, cross-device reads |
| Leadership | Pending sample nomination; protected owner card; no approval/grant simulation | CTSV vice workflow + existing owner transfer integration; activation/expiry/access projection |

UI verification evidence and reproducible steps are in [governance UI QA](../qa/club-governance-ui.md). Prototype success cannot be carried forward as BE or deployed integration proof.
