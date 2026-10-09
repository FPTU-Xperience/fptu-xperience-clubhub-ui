# Frontend API debt register — 2026-10-09

Authoritative rescan of this frontend's **current working tree**, including uncommitted profile/workspace changes. Backend baseline is freshly fetched `origin/main` **80818266f617bd5144ab1b1a6cd0e74983983a4d**, committed 2026-10-08 16:22:35 +07:00. The older API checkout is `109c901`; it was not reset, checked out or edited. API documentation had pre-existing local modifications and was not used as implementation proof.

Scope: all 145 JS/JSX source files, 113 production-reachable imports from the route entry points, API facade, repositories, pending controls, docs/contracts and feature spec contracts. [Literal evidence](api-debt-source-inventory.md) contains 88 matching production lines; manual review separates actual debt from caches, demo state and ordinary workflow statuses. All findings are source-based. No deployed service, migration, credential, database, live R2 or authenticated end-to-end behavior was tested.

API facade: **95 async public wrappers**, excluding `request`, `parseResponse`, `getErrorMessage`. Of these, **87 have direct declared backend operations**, **2 are composed reads**, and **6 target absent routes**. Direct existence does not imply DTO/authorization compatibility. Backend Admin semester/catalog/quest/declaration/radar routes are largely not represented in this facade yet.

| Debt | UI/source and current behavior | Latest-main classification | Owning contract / implementation outcome |
| --- | --- | --- | --- |
| D01 Media | `api.uploadPublicImage`, club/application/logo dialogs, profile IndexedDB, club transparent-PNG publication | Missing upload intent, club public-image write, activity cover and durable self images; no Gateway media route | [public-image-api](public-image-api.md): R2 r2.dev, verified issued objects, avatar/background/shape kinds and authorized attach |
| D02 Self profile and onboarding | `profile-data.js`, `EditProfileModal`, onboarding, own member projection; localStorage | Missing canonical self read/write; other members use application snapshots; legacy manager personal-profile PUT still exists | [self-profile-sync](self-profile-sync-api.md): one canonical GET/PATCH, cover layout/text, academic authority, onboarding, private club projection |
| D03 Personal experience | `ProfilePage` totals/evidence/radar marked unavailable or illustrative | **Partial**: Admin self declarations, raw scoring, XP ledger entity and self radar already exist; no consolidated ClubHub participation/contribution history | [personal-experience-api](personal-experience-api.md): reuse declarations/radar, add self summary/attendance history, retain quantity separation |
| D04 Public club profile | `ClubPageTab`, Preview then bottom Save/Cancel; provisional PATCH | Missing public-profile PATCH; reads exist; category catalog now dynamic; admin generic PUT is not manager authorization | [club-public-profile](club-public-profile-api.md): granular capability, partial fields, structured weekly schedule and category-code validation |
| D05 Semester roster/invites | `InviteMemberModal`, eligible-member query, invite call, My Clubs consent | **Partial**: semesters persist and invite/consent/approval exist; CTSV roster/eligible search/options/source/notifications absent | [club-member-invitations](club-member-invitations-api.md) + [semester-student-roster](semester-student-roster-api.md) |
| D06 Club member roles | `club-member-roles.js`, roles popup, disabled unsupported assignments | Member/treasurer/owner exist; new specialist roles and service capabilities missing | [club-member-roles](club-member-roles-api.md): scoped role catalog, optimistic assignments, enforce capabilities across services |
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
