# Production Workspace UI Contract

Implement Status: Not Yet

Status Scope: Backend/integration scope: partial authorized workspace

Source Review: 2026-10-19; backend b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf, fetched current branch and origin/main equal HEAD. Source audit only; live acceptance and service tests unverified.

Source Evidence: Authorized shell, current access composition, activity/session operations, personal experience and club plans/statistics/PDF now have consumers. Governance, wallet, safe semester catalog and action/staffing backend remain missing.

## Current reconciliation — 2026-10-19

Authorized shell, current access composition, activity/session operations, personal experience and club plans/statistics/PDF now have consumers. Governance, wallet, safe semester catalog and action/staffing backend remain missing.

The specification below preserves its original proposed scope. Older dated route-absence and local-only statements are historical where superseded above; use the current lifecycle/index before implementation. Remaining obligations keep this contract Not Yet.


## Optional proposed rich server projection

`GET /api/clubs/me/selection` remains absent on API main 80818266. Current production selection instead composes existing `/api/clubs/me/access`, active directory and self memberships. The optional richer projection would use this shape; its upcoming activity and manager-only pending counts are not available from the current composed reads:

```json
[
  {
    "clubId": "string",
    "clubCode": "canonical server code",
    "name": "string",
    "logoUrl": "string optional",
    "role": "MEMBER | MANAGER",
    "upcomingActivity": {
      "title": "string",
      "startTime": "ISO-8601 timestamp",
      "location": "string optional"
    },
    "pendingApplications": "non-negative integer; managers only"
  }
]
```

## UI mapping and access boundary

- The client must discard entries without `clubId`, canonical `clubCode`, or a role of `MEMBER`/`MANAGER`.
- The route is displayable only if its decoded `clubCode` matches an authorized selection entry (case-normalized); clubId remains the server resource ID.
- `pendingApplications` is omitted for members and normalized to `null` for a manager if unavailable.
- The response must not contain roster members, personal contact data, points, finance, report, or membership-application detail solely to support this MVP.

## Future workspace contracts (not implemented here)

The original MVP deferred these areas; several now use existing backend APIs as described in the implementation section below. Their scoped authorization remains mandatory:

- activities and attendance
- members and applications
- contributions, points, and rewards
- reports and finance
- club settings

Those contracts must define semester scope, role permissions, pagination where collection data is returned, and write conflict/error behavior.

## Current implementation and backend handoff — 2026-10-09

Activities/attendance, management roster/applications, reports and finance now use existing API routes; they are not all unavailable or missing backend contracts. Member management stays in V2. Club-page editing calls a missing public-profile PATCH, media attachment remains provisional, specialist role assignments are not implemented in main, tasks/points remain unavailable, and rewards/cover ownership are temporary local data.

Attendance navigation follow-up (2026-10-12): removed the standalone attendance tab; attendance reads live inside the activity detail modal and full detail page. Legacy workspace `/attendance` redirects to `/activities`. Detail reloads use the authorized single-activity route and retain completed/cancelled records; discovery still excludes those statuses. Manager mode is club-scoped, member mode reads self only. This move retains existing read capability; it does not add check-in or attendance-update writes.

The [debt register](../../../docs/contracts/contract-lifecycle-audit.md) owns those classifications. Exact [My Clubs](../../../docs/contracts/my-clubs-membership-api.md), [club profile](../../../docs/contracts/implemented/club-public-profile-api.md), [governance groups](../../../docs/contracts/club-governance-groups-api.md), [invitations](../../../docs/contracts/club-member-invitations-api.md), [contributions](../../../docs/contracts/club-contributions-points-api.md), [event operations](../../../docs/contracts/event-registration-extensions-api.md) and [rewards](../../../docs/contracts/profile-cover-rewards-api.md) contracts supersede the broad future-work list for the next API session. Governance supports multiple groups, intra-term personal history and independent board reports; only protected leadership needs CTSV approval. DEV-only rehearsal does not grant live access. Organizational capabilities must be server-scoped; full leadership never grants another user's personal-profile edit.
