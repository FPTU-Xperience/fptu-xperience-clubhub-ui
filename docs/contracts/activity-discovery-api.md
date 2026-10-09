# Privacy-safe activity discovery and recommendations

D11; 2026-10-09 main 80818266. Refines the existing [activity feature contract](../../specs/003-activity-discovery/contracts/activity-discovery-contract.md). Canonical route names below retain its `/api/v2` prefix. New Gateway routing is required; `/v2` browser routes do not imply `/api/v2` already exists.

Current FE uses `getActivities()` and ranks the first six as temporary recommendations. Existing ActivityService list/detail are membership-scoped and contain participant/attendance data. They remain management reads. Club directory has dynamic categories and can still provide a clearly non-personalized curated subset.

## Feed and detail

GET `/api/v2/activities/feed?clubId=...&status=...&search=...&page=1&pageSize=50` returns `{items,page,pageSize,totalItems,totalPages}`; the optional page defaults cover the feature contract's 50-item case. Existing `mapActivityFeed` accepts `items`; FE must add page handling before relying on totals beyond the first page.

GET `/api/v2/activities/{activityId}` returns the same display-safe item or 404/403. Resolve cold deep links directly; do not download the whole feed to find a detail record. No roster, participant IDs, attendance, submissions or raw ranking scores.

Item: `{id,clubId,clubCode,clubName,title,description,coverImageUrl,startTime,endTime,location,status,nextAction}`. IDs preserve server values (FE may stringify). `nextAction` is a presentation hint, not permission. Scheduled maps to UPCOMING before start and LIVE for `start <= now < end` while the activity remains scheduled; use server clock. Exclude completed, cancelled and ended records from the upcoming/live feed. End must follow start.

Implementation default visibility: authenticated users may view only activities explicitly published for campus-wide discovery in an active club in their permitted campus, or activities permitted by existing club membership. Add `discoveryVisibility` (`CLUB_ONLY` default / `CAMPUS_PUBLIC`) and auditable publication under leadership authority; do not make all existing private activities public in a migration. A campus-public view does not permit registration/attendance/staff reads automatically. Cross-campus/public-anonymous policy is deferred, not inferred.

## Recommendations

GET `/api/v2/recommendations/activities?limit=6` -> `{items:[{recommendationId,rank,reason?,modelVersion,sourceLabel,activity}],available:true}`. Clamp 1..6, deterministic order, authorize candidates before serialization and recheck detail/actions. Persisted self preferences/academic fields are purpose-limited input from D02; no private roster/contact leakage to the browser/engine.

If ranking is unavailable, return an explicit availability outcome or an explicitly labeled `sourceLabel:"Curated"` authorized subset; never call temporary first-six ordering personalized. Failure must not break the ordinary feed/directory. Existing recommendation-engine is an internal dependency, not a browser origin. Read-only GET requires no telemetry write. Optional recommendation feedback has no current FE caller and is not part of this batch.

## Acceptance

Unaffiliated user sees only explicitly published eligible activities; existing member sees allowed club context; other campus/club denial; 0/50/>50 paging; exact start/end boundaries; no roster fields; cancelled records absent; direct deep links; recommendation outage/isolation; gateway precedence and authorization; card image and allowed action behavior. No duplication of existing activity creation/attendance APIs.
