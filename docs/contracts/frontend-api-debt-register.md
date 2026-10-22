# Frontend API debt register — rechecked 2026-10-13

Personal experience update 2026-10-21: own report/list/detail and direct external submission with mandatory evidence now use declared source routes. The [current personal-experience contract](personal-experience-api.md) supersedes older D03 endpoint-absence claims where explicitly noted; affiliated-club endorsement and a student semester catalog remain pending. UI displays Xperience Point while retaining API field names.

Update 2026-10-21: the report editor adds a dedicated XP step, with [pending authoritative XP draft/save/version/settlement contracts](report-xp-workflow.md). Production shows an unavailable state; QA adapters only verify frontend interactions. This is not another declared API operation or official XP integration.

Implement Status: Not Yet

Status Scope: Backend/integration debt tracked here

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: Regenerated facade inventory retains six absent operations and two composed reads. Topic resource/policy/persistence gaps remain; D10 now also references durable pin preferences and seven-day inbox behavior.

Current declaration recheck and contract cleanup: [lifecycle audit](contract-lifecycle-audit.md), [per-wrapper inventory](api-declaration-inventory.md). API remote main and local HEAD both **80818266f617bd5144ab1b1a6cd0e74983983a4d**, checked 2026-10-13 without modifying BE. The earlier detailed audit was 2026-10-09; its source-marker counts below are dated evidence, not current file/import counts.

The 2026-10-13 source recheck regenerates every current facade declaration and reviews all retained topic/spec contracts. The stale 2026-10-09 literal-marker snapshot has been retired; current route counts come from [declaration inventory](api-declaration-inventory.md). Source review does not verify deployed services, databases, migrations or authenticated integration.

API facade: **95 async public wrappers**, excluding `request`, `parseResponse`, `getErrorMessage`. Of these, **87 have direct declared backend operations**, **2 are composed reads**, and **6 target absent routes**. Direct existence does not imply DTO/authorization compatibility. Backend Admin semester/catalog/quest/declaration/radar routes are largely not represented in this facade yet.

| Debt | UI/source and current behavior | Latest-main classification | Owning contract / implementation outcome |
| --- | --- | --- | --- |
| D01 Media | `api.uploadPublicImage`, club/application/logo dialogs, profile IndexedDB, club transparent-PNG publication | Missing upload intent, club public-image write, activity cover and durable self images; no Gateway media route | [public-image-api](public-image-api.md): R2 r2.dev, verified issued objects, avatar/background/shape kinds and authorized attach |
| D02 Self profile and onboarding | `profile-data.js`, `EditProfileModal`, onboarding, own member projection; localStorage | Missing canonical self read/write; other members use application snapshots; legacy manager personal-profile PUT still exists | [self-profile-sync](self-profile-sync-api.md): one canonical GET/PATCH, cover layout/text, academic authority, onboarding, private club projection |
| D03 Personal experience | `ProfilePage` totals/evidence/radar marked unavailable or illustrative | **Partial**: Admin self declarations, raw scoring, XP ledger entity and self radar already exist; no consolidated ClubHub participation/contribution history | [personal-experience-api](personal-experience-api.md): reuse declarations/radar, add self summary/attendance history, retain quantity separation |
| D04 Public club profile | `ClubPageTab`, Preview then bottom Save/Cancel; provisional PATCH | Missing public-profile PATCH; reads exist; category catalog now dynamic; admin generic PUT is not manager authorization | [club-public-profile](club-public-profile-api.md): granular capability, partial fields, structured weekly schedule and category-code validation |
| D05 Semester roster/invites | `InviteMemberModal`, eligible-member query, invite call, My Clubs consent | **Partial**: semesters persist and invite/consent/approval exist; CTSV roster/eligible search/options/source/notifications absent | [club-member-invitations](club-member-invitations-api.md) + [semester-student-roster](semester-student-roster-api.md) |
| D06 Governance groups | DEV-only group/member/history/report rehearsal with default empty groups; member-row roles are read-only and direct role mutation UI removed | Member/treasurer/owner/owner-transfer foundations exist; multi-group term structure, immutable personal history, report snapshots and vice approvals missing | [club-governance-groups](club-governance-groups-api.md): ordinary specialist Save applies grants; report submit only snapshots; CTSV leadership approval separate; policy enforced across services |
| D07 Tasks/contributions/points | `QuestsTab`, `PointsTab` unavailable; dashboard uses reports rather than fake pending contribution count | Missing **club** task/submission/review, credited club wallet and badges; Admin quest catalog is not this workflow | [club-contributions-points](club-contributions-points-api.md): lifecycle, evidence, transactional awards, safe ledger/leaderboard |
| D08 Gifts/cover cosmetics | `GiftsTab`, `cover-cosmetics.js`, local catalog, 200 sample club points, local entitlement keys | Missing club reward catalog/admin publication, wallet debit/redemption and reusable inventory; samples not production | [profile-cover-rewards](profile-cover-rewards-api.md): individual color/shape/bundle, grants, PNG provenance, idempotent transactions |
| D09 Academic calendar/timetable | `AcademicCalendarPage`, shared mock dates; `/v2/study-schedule` private weekly cells and bulk template | **Partial**: semester identity/start/end exist; block dates, self timetable and import missing | [study-schedule-api](study-schedule-api.md): link to existing semester, private week/slot persistence, admin date configuration |
| D10 Own applications/My Clubs | `withdrawMyMembershipApplication` absent, composed cards omit metadata; invitation heuristic | Missing self withdrawal; richer selection/inbox projections optional; existing me/access + memberships are usable | [my-clubs-membership-api](my-clubs-membership-api.md): self-only withdraw, discriminator, approved count/logos/code, optional composed replacement |
| D11 Discovery/recommendations | `activity-data.js` uses management feed; recommendations are first six with temporary IDs; curated clubs | Missing safe feed/detail and ranking gateway; current activities read membership-scoped with participant data | [activity-discovery-api](activity-discovery-api.md), existing [feature contract](../../specs/003-activity-discovery/contracts/activity-discovery-contract.md) |
| D12 Event specialist operations | role matrix promises Content/Event duties; existing event UI only CRUD/participants/attendance | Existing CRUD/registration does not implement staff assignments, form/version/submitted-answer review lifecycle | [club-event-operations-api](club-event-operations-api.md): event content scope, staff and registration application operations |
| D13 Public member directory | ordinary workspace member view shows leaders/count only | Missing privacy-safe opt-in directory; **optional**, no current full-roster control blocked | [public-member-directory-api](public-member-directory-api.md); defer unless enabled product scope |
| D14 Existing API tightening | legacy admin profile edit blocked; manager assignment trusts name; member personal write; report path field; local 100-row filters | Existing routes need compatibility/security/paging work, not wholesale replacement | [existing-api-hardening](existing-api-hardening.md): self identity, reject cross-user profile writes, scoped lookup, attachment privacy, queries |

## Six currently called absent operations

| FE wrapper | Exact proposed operation | Debt |
| --- | --- | --- |
| uploadPublicImage | POST `/api/media/upload-intents` | D01 |
| updateClubPublicImages | PUT `/api/clubs/{clubId}/public-images` | D01 |
| updateActivityCoverImage | PUT `/api/activities/{activityId}/cover-image` | D01 |
| updateClubPublicProfile | PATCH `/api/clubs/{clubId}/public-profile` | D04 |
| searchEligibleClubMembers | GET `/api/clubs/{clubId}/eligible-members` | D05 |
| withdrawMyMembershipApplication | POST `/api/clubs/me/membership-applications/{applicationId}/withdraw` | D10 |

Invitation POST `/members` exists but ignores semester eligibility and trusts submitted identity; it is an **upgrade**, not a seventh absent endpoint. `updateClubMemberProfile` still exists in the facade/legacy page but is disallowed by the new personal-profile product rule; remove/migrate that caller and revoke manager writes rather than preserving it as a supported future capability.

## Do not duplicate or misclassify

- Semester/catalog CRUD, current notification list/read mutations, club/account reads, membership approvals, treasurer operations, reports/finance/KPI/exports and attendance already have source routes. Wire/test them rather than create duplicate APIs.
- `/api/v1/quests` and `/api/quests` exist, including participation. `CompleteQuestAsync` accepts AnyActor and a requested target user without a scoped reviewer check in the inspected handler: do not use it to award club points; harden before enabling trusted completion (D14).
- `/api/v1/declarations/me`, `/api/v1/declarations/me/radar` exist. Student radar is based on reviewed raw experience and a benchmark, not a spendable point balance. No evidence supports treating Admin `XpLedgerEntries` as a club reward wallet.
- Authentication bypass/dev-login, theme/token cache, demo fixtures, FAP automatic sync, optional full public rosters and new physical reward fulfillment are not implicit requirements to implement every demo feature. Keep accepted dev-login behavior.
- Disband/transfer, manager assignment, role administration, audit events, manual finance adjustment and creation from approved reports have existing backend routes. New UI for them is separately owned.

## Handoff

[Start the next implementation session here](backend-api-implementation-handoff.md). It specifies dependency waves, concrete endpoint/database tasks, contract precedence, acceptance tests and open product choices. All new routes in this package are proposed until verified in source and through the running gateway.

## Session follow-up — 2026-10-13

D10 also covers the [navigation/application addendum](club-navigation-applications-api.md): authoritative self-withdraw capability/source, canonical clubCode/logo for all inbox rows, existing reviewedAtUtc for the seven-day result rule, and optional durable account pin synchronization. Quick switching and branding/badge styling do not need new backend endpoints. Current local pins are not persisted server preferences.
