# Backend changes needed after frontend integration

Updated 2026-10-09 against freshly fetched API `origin/main` **80818266f617bd5144ab1b1a6cd0e74983983a4d** and the current frontend working tree. This index replaces the older 2026-10-05 gap list. Source existence and verified deployment are separate; no live gateway/database/R2 behavior was tested.

Start the backend session with [implementation handoff](backend-api-implementation-handoff.md). It contains dependency waves, migration/integration tasks, acceptance checks and unresolved product choices. [Debt register](frontend-api-debt-register.md) owns classifications; [source inventory](api-debt-source-inventory.md) records frontend markers; [shared conventions](api-contract-conventions.md) owns transport, errors, pagination and idempotency.

## Contract owners

| Debt | Required change | Contract |
| --- | --- | --- |
| D01 | R2 upload intent, verified object attachment, club/activity images and durable self avatar/cover | [Public images](public-image-api.md) |
| D02 | Canonical self GET/PATCH, profile projection, onboarding and private academic fields | [Self profile](self-profile-sync-api.md) |
| D03 | Consolidated self experience/history; reuse existing Admin declarations/radar | [Personal experience](personal-experience-api.md) |
| D04 | Club public-profile PATCH, preview/save, dynamic category and weekly 30-minute schedule | [Club profile](club-public-profile-api.md) |
| D05 | CTSV semester roster/import, eligible-member search and upgraded existing invitation workflow | [Roster](semester-student-roster-api.md), [Invitations](club-member-invitations-api.md) |
| D06 | Club-scoped roles and service capabilities; self-managed personal records | [Club roles](club-member-roles-api.md) |
| D07 | Club tasks, evidence, review, credited wallet/ledger and achievements | [Contributions/points](club-contributions-points-api.md) |
| D08 | Club reward catalog, color/PNG shape/bundle redemption and owned inventory | [Cover rewards](profile-cover-rewards-api.md) |
| D09 | Existing semester-linked academic block dates and private student timetable | [Study schedule](study-schedule-api.md) |
| D10 | Self application withdrawal and reliable invitation discriminator; richer cards optional | [My Clubs/applications](my-clubs-membership-api.md) |
| D11 | Privacy-safe public activity feed/detail and recommendation contract | [Discovery](activity-discovery-api.md) |
| D12 | Specialist event-content editing, staff assignment and registration-form/application review | [Event operations](club-event-operations-api.md) |
| D13 | Optional consent-based public member directory, only if product scope enables it | [Public directory](public-member-directory-api.md) |
| D14 | Revoke cross-user personal writes, canonical manager lookup, quest verification, remove storage paths/read-time samples, paging | [Existing API hardening](existing-api-hardening.md) |

## What is already present

The facade has 95 public async wrappers: 87 declared direct operations, two composed reads and six absent operations. The [facade audit](frontend-api-audit.md) lists them. Existing invitation POST is an upgrade rather than a missing route. Persisted semester/category catalogs, Admin declarations/radar/quest infrastructure, notifications and management workflows should be reused.

Raw experience, credited club points and money remain distinct. Admin XP ledger presence does not establish a spendable club wallet. The 200-point reward samples and local cosmetic grants are temporary UI data, never production credit. Common styles remain free; club-issued rewards are exchanged in the club store and appear as separate colors/shapes in the editor.

## Implementation boundary

No backend source was modified during this scan. Proposed APIs remain contracts until migrations, scoped authorization, Gateway routing, frontend adapters and live integration have been verified. Do not implement old PUT self-profile or student-profile aliases alongside canonical GET/PATCH. Preserve current backend local changes and fetch main again before the next session.
