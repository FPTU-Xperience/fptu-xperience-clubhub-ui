# Production Workspace UI Contract

## Optional proposed rich server projection

`GET /api/clubs/me/selection` remains absent on API main 80818266. Current production selection instead composes existing `/api/clubs/me/access`, active directory and self memberships. The optional richer projection would use this shape; its upcoming activity and manager-only pending counts are not available from the current composed reads:

```json
[
  {
    "clubId": "string",
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

- The client must discard entries without `clubId` or a role of `MEMBER`/`MANAGER`.
- The route is displayable only if its decoded `clubId` exactly matches one mapped entry.
- `pendingApplications` is omitted for members and normalized to `null` for a manager if unavailable.
- The response must not contain roster members, personal contact data, points, finance, report, or membership-application detail solely to support this MVP.

## Future workspace contracts (not implemented here)

Each production area requires a separate current-user, club-scoped contract and server authorization before a real screen can replace its unavailable state:

- activities and attendance
- members and applications
- contributions, points, and rewards
- reports and finance
- club settings

Those contracts must define semester scope, role permissions, pagination where collection data is returned, and write conflict/error behavior.

## Current implementation and backend handoff — 2026-10-09

Activities/attendance, management roster/applications, reports and finance now use existing API routes; they are not all unavailable or missing backend contracts. Member management stays in V2. Club-page editing calls a missing public-profile PATCH, media attachment remains provisional, specialist role assignments are not implemented in main, tasks/points remain unavailable, and rewards/cover ownership are temporary local data.

The [debt register](../../../docs/contracts/frontend-api-debt-register.md) owns those classifications. Exact [My Clubs](../../../docs/contracts/my-clubs-membership-api.md), [club profile](../../../docs/contracts/club-public-profile-api.md), [member roles](../../../docs/contracts/club-member-roles-api.md), [invitations](../../../docs/contracts/club-member-invitations-api.md), [contributions](../../../docs/contracts/club-contributions-points-api.md), [event operations](../../../docs/contracts/club-event-operations-api.md) and [rewards](../../../docs/contracts/profile-cover-rewards-api.md) contracts supersede the broad future-work list for the next API session. Organizational capabilities must be server-scoped; full leadership never grants another user's personal-profile edit.
