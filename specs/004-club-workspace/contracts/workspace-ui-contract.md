# Production Workspace UI Contract

## Existing server dependency

`GET /api/clubs/me/selection` is an authenticated current-user projection. The workspace reuses the My Clubs response contract:

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
