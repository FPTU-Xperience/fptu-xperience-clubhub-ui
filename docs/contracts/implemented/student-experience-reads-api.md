# Student discovery and verified experience reads

Implement Status: Done

Status Scope: Current backend read contracts and FE consumers at source level; no deployed sign-off, full policy approval, or wallet equivalence claim.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. Evidence: `ActivityService/Endpoints/StudentActivityEndpoints.cs`, `StudentActivityHistoryEndpoints.cs`; `AdminService/Endpoints/StudentExperienceEndpoints.cs`, `VerifiedContributionEndpoints.cs`, `BenchmarkEndpoints.cs`; `Shared/Experience/StudentExperienceSources.cs`, `BenchmarkContracts.cs`; service Program registration and Gateway explicit experience/discovery routes.

| Method / path | Current contract | FE consumer |
| --- | --- | --- |
| GET `/api/v2/activities/feed` | `clubId/search/status/semesterId/page/pageSize`; UPCOMING/LIVE, source account/campus/club eligibility, published or closed records; `{items,totalItems,totalPages,asOf,scopeVersion}` | `useActivityFeed` traverses all advertised pages |
| GET `/api/v2/activities/{id}` | Authorized display-safe deep link; may retain completed/cancelled history | Public detail; management detail keeps `/api/activities/{id}` |
| GET `/api/v2/recommendations/activities?limit=6` | At most six eligible/registerable future activities, ranked by low axis then start/id; rule version/reason/snapshot; downstream failure is 503 | `useRecommendedActivities` uses server ranking and IDs, no temporary slicing fallback |
| GET `/api/users/me/experience-summary` | Current actor; PERIOD with semesterId or CUMULATIVE; recognized count, **rawExperiencePoints**, verified attendance/club counters with availability/snapshot metadata | Profile overview |
| GET `/api/v1/declarations/me/radar` | PERIOD/CUMULATIVE, canonical six `radarAxes`, separate `plusOne`; policy/formula/ledger provenance and authority flag | Profile overview |
| GET `/api/users/me/contributions` | Own canonical contributions plus explicitly labelled legacy preview entries, paged | Profile contribution history |
| GET `/api/users/me/experience-ledger` | Own per-pillar AWARD/CORRECTION/REVERSAL allocations; filter semester/pillar/source type; not club money or spendable wallet | Profile ledger history |
| GET `/api/users/me/activity-history` | Own sessions, attendance, legacy registration/attendance labelled separately; page and semester filters | Profile participation history |

The profile hides private totals/history in its sharing preview, displays independent summary/radar failures, and preserves unavailable counters rather than inventing zero. Histories are paged; totals are server aggregates rather than summing one page. `rawExperiencePoints` is displayed as raw points.

Public detail uses server `canRegister` and `nextAction`. Registration POSTs `/api/activities/{id}/participants`. Session check-in POSTs `/api/activities/{id}/check-in` with `sessionId`, server-issued challenge and optional measured location. Stable idempotency keys are retained for an identical retry. Registration is not verified attendance; a check-in response is not a promise that a raw-budget award or spendable credit exists. Source handlers recheck policy/eligibility/window/geofence.

Unimplemented target obligations such as action-based final report approval, raw-budget debits, roster rollover and configured wallet conversion remain in the [current index](../README.md). The old proposed summary field names and recommendation precision are preserved only in `outdated/`.
