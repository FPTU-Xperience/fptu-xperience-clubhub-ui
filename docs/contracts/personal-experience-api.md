# Personal experience summary, evidence and radar

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
