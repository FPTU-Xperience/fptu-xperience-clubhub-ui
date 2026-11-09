# Student data consistency audit — 2026-10-27

Scope: student onboarding/profile, private study schedule, personal experience and spendable club points. Source audit at ClubHub UI `fd20ae1` and API `bbf7367`; Admin UI inspected for competing browser persistence. No authenticated production student records were read or changed. No implementation or deployment is claimed by this audit.

## Current authority

| Data | Current source | Consistency verdict |
| --- | --- | --- |
| Onboarding | Browser account keys `clubhub:v2:onboarding:*` and `clubhub:v2:profile:*` | Not consistent with canonical server profile or another device. |
| Self profile | AuthService `/api/users/me/profile`, versioned PATCH | Server fields override local fields; onboarding bypasses this path. |
| Academic identity | AdminService semester roster through canonical academic read filter | Student code has provenance; major/year explicitly have no authoritative source. |
| Study schedule | AuthService own-user blocks/cells and AdminService campus/semester calendar | Server persistence, ownership and optimistic concurrency exist. |
| Personal experience | AdminService contributions and verified net experience ledger | Backend summary/radar share the ledger; frontend selection/snapshot reads differ. |
| Spendable club wallet | No implemented wallet/redemption API found | Gifts use browser sample credits; PointsTab correctly reports unavailable. |

## Findings

### P1 — Onboarding completion and student input never reach the canonical profile

`src/pages/v2/V2Access.jsx` gates access with `readOnboarding(user)`. `StudentOnboarding.jsx` initializes with `readProfile(user)` and calls synchronous `saveOnboarding`; `onboarding.js` writes only browser storage. The authenticated profile hook independently GETs/PATCHes the server profile. `profileSynced: true` means a local copy was saved, not a server receipt.

Reproduction: finish onboarding, open Profile, or sign in on a second device. Canonical fields need not contain the submitted phone/address/interests; the second device has no completion marker. Clearing storage can repeat onboarding. Current onboarding tests verify local round trips and cannot establish server persistence.

Required contract: persist onboarding completion/version and accepted student-declared fields on the server; acknowledge completion only after a successful versioned response. Load the same server snapshot in onboarding and Profile. Keep a failed save incomplete. Never silently import old local fields over newer canonical data.

### P1 — Declared academic input and official academic identity have incompatible ownership

Onboarding requires a self-entered major, accepts campus/student code/year and infers values from email. In contrast, the server canonical profile PATCH accepts only profile/personal sections; academic identity is read-only. `AcademicStudentProfile` explicitly returns null major/year with `NO_AUTHORITATIVE_SOURCE`. Thus merely wiring the existing PATCH would still discard these onboarding fields.

Required contract: separate student-declared major/year preferences from official roster identity, or extend the official import source. Do not turn browser values into verified student identity. Surface availability/provenance instead of requiring an official field that the server cannot store.

### P2 — Auth projection drops campus

AuthService `UserSummary` includes `CampusCode`, but `src/context/AuthContext.jsx` `toAuthUser` omits it. `canonicalProfileSnapshot` derives the campus label from `user.campusCode`, so the student profile displays an empty campus even when the authentication response contains it. Preserve this authenticated field; do not infer it from a browser profile.

### P2 — Experience list, summary and radar do not share a selected scope/snapshot

`PersonalExperiencePage.jsx` filters the list by `semester`, while its summary effect always calls `summary()` and does not depend on that filter. The client hardcodes `scope=PERIOD` without `semesterId`. Empty list filtering means all semesters, while summary means the uniquely active semester. The current labels disclose this difference, but these are not comparable totals.

`src/services/profile-experience.js` reads summary and radar concurrently without binding `semesterId`, `asOf`, `ledgerRevision` or policy version. Approval/correction or an active-semester change between requests can produce inconsistent panels. This is an observed lack of snapshot validation, not proof that production records have already diverged.

Required contract: use an explicit semester/scope across comparable panels; make all-semester listing distinct from a cumulative scored scope and its approved policy. Bind radar to the summary's semester and snapshot, verify policy/revision agreement, and retry or show unavailable on mismatch. Approval/revoke should invalidate relevant reads; never compute an official total from one paginated list or include non-authoritative legacy previews.

### P1 before real redemption — Gifts has a sample wallet, not a spendable ledger

`cover-cosmetics.js` `sampleClubBalance` returns 200 if no valid local balance exists. `redeemCoverReward` updates local wallets and ownership. `GiftsTab.jsx` labels these as sample points and device-local data. `PointsTab.jsx` says the backend feature is unavailable. No implemented spendable wallet or atomic redemption service was found in API source; existing D07/D08 documents describe proposed contracts.

Required implementation: one server ledger per authenticated user and issuing club, with immutable credit/debit/reversal entries, versioned reads, idempotent atomic redemption and inventory receipts. `/points/me` and `/wallet/me` must be projections of that same ledger. Raw XP, radar scores and FinanceService money must remain distinct. Never bootstrap real credit or grants from the local 200-point sample or migrate sample ownership as real entitlement.

### P2 — Canonical profile updates lack cross-tab invalidation

The profile hook listens for local profile storage/custom events. A canonical-only successful PATCH updates React state, but does not emit a profile signal; another open tab remains stale until reload or another trigger. Server `STALE_PROFILE` protects conflicting writes, but does not refresh displays. Publish an account-scoped invalidation without personal payloads and reload canonical state; retain version conflict protection.

## Study schedule: mechanisms confirmed, remaining boundaries

- Own-user routes derive the actor from authenticated claims. Unique `(UserId, Year, Term, Block)` and version concurrency are configured.
- Writes send both schedule and academic calendar versions. Stale 409 responses invalidate cached write versions; DELETE reads the new block version. UI provides server reload and blocks period changes while saving.
- Calendar source binds the requested period to official semester/campus and controls write availability. Missing source must remain unavailable/read-only; no browser fallback.
- Initial period is chosen from the browser clock in `defaultStudyPeriod`, not the server's active-semester catalog. Use the canonical semester selection if all student panels must open on the same semester.
- Another device's successful change is visible after server reload. No automatic focus/cross-tab refresh was found for this screen; server concurrency prevents silently overwriting stale versions.

## Backend experience mechanisms confirmed

`StudentExperienceReadService` computes summary/radar from verified net ledger effects and pillar allocations, scoped by user, semester, approved policy and `asOf`; responses expose revision/policy metadata. `VerifiedContributionEndpoints` and `VerifiedExperienceService` append award, upgrade delta, correction and reversal effects and synchronize declaration status. Unique source keys and concurrency versions exist. These source mechanisms support consistency but do not establish live database/deployment correctness.

## Recommended implementation scopes

1. Onboarding/profile contract: persisted completion, declared fields vs official identity, server save/load, campus projection and invalidation.
2. Shared student semester and experience snapshot: list/summary/radar scope, policy/revision validation, refresh after changes, official-ledger history.
3. Real club wallet and redemption: complete D07/D08 backend lifecycle before enabling real credits or migrating any entitlement.
4. Schedule refresh: canonical default semester, focus/account-scoped invalidation while preserving version conflict behavior.

Acceptance scenarios: sign in on a second device; reload after onboarding; switch account with a pending read; simultaneous edits; switch semester; approve/correct/revoke an experience while Profile is open; fail/retry a mutation; duplicate/concurrent redemption; clear all browser storage. Server-owned data must survive storage clearing, remain isolated by account/campus/club/semester, and never report success before its authoritative receipt.

## Validation and limitations

26 existing targeted frontend tests passed (onboarding, study schedule, personal experience, implemented contracts). They establish covered source behavior, including the current local onboarding design; they do not certify the identified consistency gaps.

Backend AGENTS requires GitNexus graph queries/impact before changes. The local runner/index is missing; bootstrapped GitNexus lists an older registered index (`d95015e`, 2026-10-26), but its status read did not complete. No current graph impact verdict was obtained. Backend findings above are source inspection, not graph validation. No backend functions were changed and no commits were made.
