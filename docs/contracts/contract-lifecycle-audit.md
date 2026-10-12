# Contract lifecycle / FE–BE integration recheck — 2026-10-12

Remote `git ls-remote origin refs/heads/main` and API checkout HEAD both resolve to **80818266f617bd5144ab1b1a6cd0e74983983a4d**. API checkout was not changed. FE is current working tree based on `4431029`, including governance UI rehearsal. Source recheck only; no BE service tests, migration, authenticated Gateway/deployment or R2 check was run. GitNexus runner/index remains unavailable, so no graph-impact claim is made.

## Facade recheck

[Generated per-wrapper declaration inventory](api-declaration-inventory.md), reproducible with `node scripts/audit-api-contracts.mjs`: **95 wrappers = 87 declared direct operations + 2 composed reads + 6 absent operations**. Explicitly resolved Report/Activity/Finance parent route groups and MapMethods PATCH; unresolved Admin helper groups are listed and are not target paths of these wrappers. Matching declarations does not certify DTO/policy/integration correctness.

Absent calls remain POST media/upload-intents; PUT club public-images; PUT activity cover-image; PATCH club public-profile; GET club eligible-members; POST self membership-application withdrawal. Governance rehearsal adds **zero** live facade requests. New governance operations are additional BE obligations, not part of the 95-wrapper count.

## Removed outdated contract

Removed `club-member-roles-api.md`. Its one-primary-role model and proposed `PATCH /members/{id}/role` cannot represent multiple groups, term reporting, separate CTSV leadership approval or intra-term assignment history. Do not implement that endpoint/catalog as a parallel new authority. Canonical replacement: [club-governance-groups-api.md](club-governance-groups-api.md). Personal-profile restrictions are retained in [self-profile-sync](self-profile-sync-api.md); existing treasurer/owner compatibility and migration are retained in the replacement.

The old Secretary/Event informational permission matrix was inconsistent with its descriptions/tests; FE role-information matrix now restricts Secretary to reports and Event to staff/registrations. This fixes descriptive UI, not server authorization.

## Active contract owners

| Contract | Decision | Source status / why retained |
| --- | --- | --- |
| [Governance groups](club-governance-groups-api.md) | NEW canonical D06 | Group, term revision, per-member history, report snapshot and vice nomination are absent; owner transfer/treasurer/membership are existing foundations |
| [Governance proposal](club-governance-groups-proposal.md) | UPDATED product context | Confirmed decisions and UI design; canonical API contract overrides provisional endpoint examples |
| [Public images](public-image-api.md) | KEEP proposed D01 | Three media/image facade routes absent; self media persistence pending; Gateway has no /api/media route |
| [Self profile](self-profile-sync-api.md) | KEEP proposed D02 | users/me identity exists; canonical self-profile GET/PATCH and durable covers missing; legacy manager personal write needs hardening |
| [Personal experience](personal-experience-api.md) | KEEP partial D03 | Admin declarations/radar exist; consolidated ClubHub personal participation/contribution projections absent |
| [Club public profile](club-public-profile-api.md) | KEEP proposed D04 | Manager public-profile PATCH absent; generic admin club PUT is not its substitute |
| [Invitations](club-member-invitations-api.md) | KEEP partial D05 | Invite/join/consent/approve exist; student roster validation, manager eligibility/options and invitation notifications pending |
| [Semester roster](semester-student-roster-api.md) | KEEP proposed D05 | Admin semesters persist; school roster/import/carry-forward are separate missing resources; group member picker uses already-approved club roster instead |
| [Contributions/points](club-contributions-points-api.md) | KEEP proposed D07 | Admin quest/XP infrastructure does not implement club evidence reviews and spendable credit wallet |
| [Cover rewards](profile-cover-rewards-api.md) | KEEP proposed D08 | Local cosmetic grants/sample balances are not server reward catalog/redemption/inventory |
| [Study schedule](study-schedule-api.md) | KEEP partial D09 | Existing semester catalog reused; academic block dates/private timetable/import remain missing |
| [My Clubs/applications](my-clubs-membership-api.md) | KEEP partial D10 | Existing composed reads usable; self withdrawal absent; richer reads optional and must not be treated as already implemented |
| [Discovery](activity-discovery-api.md) | KEEP proposed D11 | Access-scoped management activity read is not public privacy-safe discovery or ranked recommendations |
| [Event operations](club-event-operations-api.md) | KEEP proposed D12 | CRUD/participant/attendance exist; specialist content/staff/form/application lifecycle pending; permissions come from active governance groups |
| [Public member directory](public-member-directory-api.md) | KEEP deferred D13 | Explicit optional consent-based feature; neither governance UI nor current leaders/count view requires exposing full roster |
| [Existing API hardening](existing-api-hardening.md) | KEEP D14 | Cross-user profile write, quest target checks, manager identity, storage-path privacy and paging remain upgrades to existing operations |
| [Shared conventions](api-contract-conventions.md) | KEEP | Error/version/idempotency/identity/semester rules remain current; governance uses the same transport |
| [FE facade audit](frontend-api-audit.md) | REFRESH | Point at reproducible 2026-10-12 inventory; retain compatibility findings |
| [FE debt register](frontend-api-debt-register.md) | REFRESH D06 | Replace single-role task with group/history/report/leadership scope; no unsupported fulfilled checks |
| [Page integration checklist](page-integration-checklist.md) | REFRESH members | Prototype/browser proof separate from capability-backed live integration |
| [BE handoff](backend-api-implementation-handoff.md) | REFRESH Wave 2 | New D06 migration/policies/Gateway tasks; reporting separate from grant activation |
| [BE changes index](backend-changes-for-frontend.md) | REFRESH D06 | Still a useful index; not outdated merely because endpoints remain unbuilt |
| [Old source marker inventory](api-debt-source-inventory.md) | KEEP dated evidence | 2026-10-09 literal-line snapshot, not current line/file count; current declaration inventory owns 2026-10-12 route counts |

No other topic contract was retired: the inspected BE baseline has not changed, and these proposed/partial capabilities remain unmet. Delete fulfilled/obsolete proposals only with source/test evidence or explicit replacement, not because an endpoint is absent.

## Current UI / integration split

| Surface | Implemented in this batch | Still required for live integration |
| --- | --- | --- |
| Manager members tab | DEV-only Ban quản lý with local synthetic data; existing live member/invite flows retained | Real catalog, term/approved-member query, capabilities and group mutations |
| Group editor | Name/preset/checkboxes, create/edit, member add/transfer/remove, dissolution, local union/finance constraints | Server authority, transaction/concurrency, duty constraints, immediate revocation across services |
| History | Local persistent personal timeline, group change events, before/after grants, preserved demotion history | Persisted immutable BE events/intervals, stable paging, system expiry and appointment events |
| Reporting | Immutable local submitted snapshot, reportNeedsUpdate after configuration changes, previous-semester read-only example | Semester/report window policy, server snapshot/idempotency, cross-device reads |
| Leadership | Pending sample nomination; protected owner card; no approval/grant simulation | CTSV vice workflow + existing owner transfer integration; activation/expiry/access projection |

UI verification evidence and reproducible steps are in [governance UI QA](../qa/club-governance-ui.md). Prototype success cannot be carried forward as BE or deployed integration proof.
