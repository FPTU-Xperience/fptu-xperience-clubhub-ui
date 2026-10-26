> Current reconciliation — 2026-10-26: [API/UI integration and remaining obligations](main-api-ui-reconciliation-2026-10-26.md) supersedes older absence/browser-only claims for the capabilities listed there. The earlier audit/checklists below are historical; source integration and live acceptance remain separate.

# Backend API implementation handoff

Contract tổng hợp 2026-10-22: [Báo cáo Xperience Point và trải nghiệm tự khai](../../../fptu-xperience-doc/docs/contracts/xperience-report-and-self-declaration-contract.md) — phạm vi Admin/ClubHub, một quyền xử lý CLB, mismatch 403 và backend acceptance.

Update 2026-10-22: [club workspace student declarations](../qa/club-student-declarations-v2.md) now provides the BQL list/detail/evidence UI using assigned declaration reads. Follow up with server club/semester/search filters, safe student identity and unified `club.declarations.process` projection (president/vice automatic, other roles one checkbox); the external referral/endorsement contract remains separate and pending. Permission policy persistence, club review and forwarding adapters also remain unavailable; see the personal-experience contract.

Update 2026-10-21 (personal experience): [Trải nghiệm cá nhân](personal-experience-api.md) now wires own summary/contributions, private evidence and direct external declaration into ClubHub. Optional affiliated-club endorsement and a student-facing semester catalog remain backend work. `ClubId` on the existing canonical external bridge cannot be reused as an endorsement reference.

Update 2026-10-21: [ClubHub report XP step](report-xp-workflow.md) adds the five-step frontend and guarded source/save integration. Implement the authoritative scoped XP draft, before/after audit, version-bound submission and settlement contracts before enabling its production adapter. The existing ReportService DTO does not persist XP rows.

Implement Status: Not Yet

Status Scope: Backend work tracked by this handoff

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: The dependency waves remain open: own withdrawal, media/profile, governance, semester roster, credit/rewards, discovery and timetable persistence are absent or incomplete in the source contexts/endpoints.

Updated 2026-10-13 for the next BE batch. Start with [contract lifecycle audit](contract-lifecycle-audit.md), [debt register](frontend-api-debt-register.md), [declaration inventory](api-declaration-inventory.md), and [shared conventions](api-contract-conventions.md). API baseline: remote main and local HEAD both **80818266f617bd5144ab1b1a6cd0e74983983a4d**, checked 2026-10-13. Frontend session commit b9832cd and later uncommitted branding updates were inspected; no backend source was changed. Recheck main before implementation and reconcile any new routes, migrations and permissions.

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

- [ ] Implement one scoped [workspace semester catalog/context](workspace-semester-context-api.md) from existing Admin semesters; provide explicit activity bounds, report Period and invitation aliases. Header is the only selector; reconcile governance/invitation catalogs rather than create competing authorities. Define finance attribution and term-indexed club schedules before claiming every tab is semester-filtered.

- [ ] Add roster revision/import preview+commit/read and audited carry-forward linked to existing semester. [Roster](semester-student-roster-api.md), [invites](club-member-invitations-api.md).
- [ ] Add protected internal eligibility reads and manager/HR semester options/eligible-member lookup. Upgrade existing invite/consent/approve with authoritative identity/source/revision; outbox recipient notifications.
- [ ] Implement [canonical governance groups contract](club-governance-groups-api.md): authoritative term + immutable structure revisions, capability/preset catalog, multi-group specialist assignments and atomic ADD/REMOVE/TRANSFER; preserve owner/two-treasurer rules across custom groups.
- [ ] Persist each intra-term promote/transfer/demote/group-permission change with before/after personal events and assignment intervals in the same transaction; include system expiry/member-departure/revocation and history reads after demotion.
- [ ] Implement independent term report submissions with exact-version snapshots and supplementary history; submission never grants/revokes rights and has no whole-BQL review gate.
- [ ] Implement CTSV-approved vice appointments; reuse existing owner transfer workflow; protected leadership cannot be granted through custom groups. Synchronize shared access, Finance/Report/Activity action policies/recipients, cache invalidation and legacy role-writer cutover.
- [ ] Replace DEV-only governance rehearsal with authoritative facade adapters/approved-member paging/capability gates after BE verification; do not migrate synthetic people, sample semesters or browser grants.
- [ ] Implement self withdrawal/history, authoritative source/canWithdraw/version and active-record uniqueness/reapply; optional richer My Clubs reads only if replacing composed adapters. [My Clubs](my-clubs-membership-api.md).
- [ ] Extend semester with admin calendar block dates and safe student projection, implement private weekly timetable and transactional template import. [Study schedule](study-schedule-api.md). No second semester table.
- [ ] Wire Admin roster/calendar and ClubHub invite/timetable UI; two-account consent must still await manager approval.

### Wave 3 — contributions, wallets, gifts and personal experience (D03, D07, D08)

- [ ] Add published task/submission/evidence/review history and no-self-review; unique server award and outbox. [Contributions](club-contributions-points-api.md).
- [ ] Implement immutable per-club credit wallet, ledger, summary, safe points/badges reads. Raw budgets, XP and money do not become wallet credit implicitly.
- [ ] Implement reward catalog/write/asset publication, inventory and atomic idempotent debit+grants. [Rewards](profile-cover-rewards-api.md). Bundle grants unlock both separate editor choices; do not import sample entitlements/200 balances.
- [ ] Reuse declaration/radar reads and add private activity/contribution summary/history projections; [personal experience](personal-experience-api.md). No duplicate raw scoring engine.
- [ ] Replace unavailable Quests/Points tabs and local Gifts/Cover repositories with authoritative API reads/mutations; preserve empty/error states.

### Wave 4 — discovery and specialist event operations (D11, D12)

- [ ] Implement profile-style activity detail media/document/embed projections and owned upload-intent/commit pipeline; enable `resourceCapabilities` only after deployed verification. Keep public viewer and workspace manager contracts separate. [Activity profile/resources](activity-profile-resources-api.md).

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

## Session navigation/inbox batch — 2026-10-13

Scope includes the complete latest FE commit `b9832cd33f7d8e17c09982e68a5acca0fc2b21ce`, not just uncommitted follow-up edits. The [commit coverage matrix](club-navigation-applications-api.md#latest-commit-coverage) maps all 16 changed files to a BE obligation, an existing API to reuse, or presentation-only work. Imported parent `9321f84` was checked as well; CSS/markup/demo-loading changes add no new API writer.

- [ ] Follow [club navigation/applications](club-navigation-applications-api.md) for source/capability metadata, canonical code/logo and the seven-day display rule. Use existing reviewedAtUtc; hiding results must never delete approved memberships.
- [ ] Implement optional durable pins when cross-device preference sync is selected, with self-only reads/writes, unique user+club and current access revalidation. Browser pins currently remain temporary.
- [ ] Keep pin/role presentation independent of authorization; verify self withdrawal through the actual deployed route before enabling it.
