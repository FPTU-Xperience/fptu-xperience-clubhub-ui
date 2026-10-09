# Backend API implementation handoff

Prepared 2026-10-09 for the next implementation session. Start with [debt register](frontend-api-debt-register.md), [source inventory](api-debt-source-inventory.md), and [shared conventions](api-contract-conventions.md). API baseline: freshly fetched `origin/main` **80818266f617bd5144ab1b1a6cd0e74983983a4d**. Frontend includes current uncommitted work; no backend source was changed during this audit. Fetch main again before implementation and reconcile any new routes, migrations and permissions.

## Contract precedence and decisions

This handoff/register plus the dated updates in topic contracts supersede the 2026-10-05/07 audit conclusions. Topic contracts own exact payload/state rules; conventions own errors/paging/idempotency. Existing feature specs retain `/api/v2/activities/feed` and recommendation paths; do not invent another feed namespace. Personal profile has one canonical GET/PATCH `/api/users/me/profile`; the old proposed PUT/fullName-only and student-profile aliases are superseded. Preview and Cancel never write; actual Save writes once. Never replace production V2 with demo fixtures.

Reuse Admin semester persistence and declaration/radar/quest infrastructure. Club member roles are organizational, not global auth roles. Personal data is self-managed even for full club leadership. R2 remains the chosen storage with public r2.dev delivery; Cloudflare Images is not selected. Existing/common styles free; paid individual/background/shape/bundle redemption is in club store, while editor shows independent color/shape entries. Text is draggable and 24..240px; PNG shape overlays remain independent of image background.

## Dependency waves and executable tasks

Every unchecked task requires code/migration/tests plus FE integration; checking a route declaration alone is insufficient.

### Wave 0 — baseline and shared authority

- [ ] Fetch main, inspect API AGENTS.md and graph/index tooling; compare against pinned snapshot. Work on an isolated branch/worktree, retain existing local API docs modifications.
- [ ] Capture current service tests, migrations and Gateway routing baseline; classify source/test/deployment separately.
- [ ] Define reusable principal/campus/club capabilities and API error/version/idempotency contract. D06 capability design precedes specialist grants; preserve current manager/treasurer operation until migration.
- [ ] Fix D14 cross-user member-profile write and unsafe quest target verification before enabling new specialist writes/credit.

### Wave 1 — self data, media and club page (D01, D02, D04)

- [ ] Implement canonical self profile persistence, GET/PATCH, private academic/read-only metadata, onboarding completion/preferences; [self contract](self-profile-sync-api.md).
- [ ] Implement media intent persistence/signing, verified object attach and cleanup, Gateway /api/media, R2 CORS/read domain. Avatar/background/transparent shape use distinct scopes; [media contract](public-image-api.md).
- [ ] Add club cover field/mappers/migration, authorized public-images PUT, activity cover field/PUT. All attachments validate actor/object purpose/owner.
- [ ] Implement public-profile PATCH with persisted category validation, partial text state and structured 30-minute weekly schedule; [club contract](club-public-profile-api.md).
- [ ] Remove legacy manager personal-profile mutations; project canonical user fields and immutable applicationSnapshot in member list/detail.
- [ ] Replace local profile/IndexedDB repositories through existing FE facade; deliberate local import review only. Test shared projection/privacy and saved cover preview parity.

### Wave 2 — semester roster, invitations, roles and own applications (D05, D06, D09, D10)

- [ ] Add roster revision/import preview+commit/read and audited carry-forward linked to existing semester. [Roster](semester-student-roster-api.md), [invites](club-member-invitations-api.md).
- [ ] Add protected internal eligibility reads and manager/HR semester options/eligible-member lookup. Upgrade existing invite/consent/approve with authoritative identity/source/revision; outbox recipient notifications.
- [ ] Implement scoped member role catalog/assignment/version/audit and per-service capabilities; [roles](club-member-roles-api.md). Owner succession remains existing transfer workflow.
- [ ] Implement self withdrawal/history and active-record uniqueness/reapply; optional richer My Clubs reads only if replacing composed adapters. [My Clubs](my-clubs-membership-api.md).
- [ ] Extend semester with admin calendar block dates and safe student projection, implement private weekly timetable and transactional template import. [Study schedule](study-schedule-api.md). No second semester table.
- [ ] Wire Admin roster/calendar and ClubHub invite/timetable UI; two-account consent must still await manager approval.

### Wave 3 — contributions, wallets, gifts and personal experience (D03, D07, D08)

- [ ] Add published task/submission/evidence/review history and no-self-review; unique server award and outbox. [Contributions](club-contributions-points-api.md).
- [ ] Implement immutable per-club credit wallet, ledger, summary, safe points/badges reads. Raw budgets, XP and money do not become wallet credit implicitly.
- [ ] Implement reward catalog/write/asset publication, inventory and atomic idempotent debit+grants. [Rewards](profile-cover-rewards-api.md). Bundle grants unlock both separate editor choices; do not import sample entitlements/200 balances.
- [ ] Reuse declaration/radar reads and add private activity/contribution summary/history projections; [personal experience](personal-experience-api.md). No duplicate raw scoring engine.
- [ ] Replace unavailable Quests/Points tabs and local Gifts/Cover repositories with authoritative API reads/mutations; preserve empty/error states.

### Wave 4 — discovery and specialist event operations (D11, D12)

- [ ] Add auditable publication/visibility with default CLUB_ONLY, privacy-safe paged feed/direct detail and server-clock UPCOMING/LIVE; [discovery](activity-discovery-api.md).
- [ ] Route authenticated recommendations via Gateway, use private preference input internally, isolate engine outage and label curated fallback.
- [ ] Add scoped content PATCH, staff assignment and versioned registration form/application/review/withdraw/capacity integration; [event operations](club-event-operations-api.md). Reuse participant/attendance records.
- [ ] Wire FE adapters without broadening membership/private-roster reads or granting global manager roles to specialists.

### Wave 5 — compatibility and release verification

- [ ] D14 canonical manager lookup, custom category round-trips, private attachment DTO, existing query pagination and author deadlines; [hardening](existing-api-hardening.md).
- [ ] D13 opt-in public directory only if explicitly enabled; [optional directory](public-member-directory-api.md). Ordinary member roster remains leaders/count otherwise.
- [ ] Update FE API/page audit and this register per completed capability, with commit/test/gateway evidence; remove provisional UI labels only after deployment verification.
- [ ] Execute acceptance matrix below and record unresolved cases. No backend-only duplicate endpoint creation for already implemented finance/report/notification/transfer workflows.

## Minimum test matrix

Use accounts for system admin, CTSV (two campuses), club owner, vice, Content, Event, HR, treasurer, approved member, pending applicant, invited student and unrelated user. Test own/other club and self/other person; revoked role; inactive/locked account; campus mismatch; expired session; empty/unconfigured state; malformed/unknown fields; stale version; concurrent duplicate; idempotent replay; transaction rollback; internal dependency/R2 outage; outbox duplicate delivery; pagination >100; persistence across reload/devices. Media must prove public read of a verified issued object; direct R2 PUT alone is not completion.

Run backend service/regression tests and migration upgrade path, then Gateway-backed calls and FE checks (`npm run test:demo`, `npm run test:club-page`, focused profile/media/invitation tests, build). Browser UI proof and API endpoint unit tests are separate. API test evidence was inspected but not executed in this audit; do not carry old FE build results forward as backend proof.

## Decisions still requiring explicit product binding before live rollout

- O-04 roster CSV/upload timing and identity matching: provisional parser schema supplied in roster contract; final CTSV policy can replace it without changing canonical preview/commit boundary.
- Semester alias mapping: catalog contains arbitrary codes; configure SP/SU/FA/year aliases and reject ambiguous mappings. Do not equate FA26, FA2026 and FALL2026 implicitly.
- Bind actual FPT Dev numeric club ID/catalog issuer. Provisional FPT-DEV code must never fall back to FPT-TECH.
- Credit correction after spending: the contribution contract proposes an auditable negative-balance debt with new-redemption lock; confirm before live rollout.
- Point award policy/configuration and real entitlement pricing: demo 120/160/200 and 200 starting balance are examples, not financial/credit authorization. Configure approved server policy before minting real points.
- Confirm campus-public activity publication policy; this contract defaults old records to private. Physical gift fulfillment and public member-directory opt-in remain optional extensions.

The handoff is ready for implementation planning; these choices are clearly isolated instead of silently claimed as already approved business rules. No secrets, deploy changes, issue comments or backend commits were created by this audit.

## Audit verification boundary

Routes, DTOs and handlers were inspected from an exported fresh-main snapshot. GitNexus runner/index tools were unavailable, so dependency/callflow graph analysis was not performed. Validation passed for 282 local links across 27 contract documents, 15 JSON examples, 95 public async wrapper enumeration and documentation diff whitespace; no backend tests, migrations, live authorization, database or R2 checks were run. The existing API checkout and its pre-existing documentation changes were retained.
