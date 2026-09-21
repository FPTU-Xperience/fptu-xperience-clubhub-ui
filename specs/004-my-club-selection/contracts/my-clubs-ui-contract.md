# My Clubs Production UI Contract

**Consumer**: ClubHub V2 UI — UI-08 / issue #11  
**Backend dependency**: CLBHB-BE-14 / issue #15, subject to CLBHB-BE-12 / issue #13

## Authorization and privacy

Every endpoint derives the current user from the authenticated session; no user ID is accepted from the UI. The server returns only active manager assignments and approved memberships belonging to that user. A global role does not authorize any club-scoped data or workspace access.

Return 401 for an invalid session, 403 for an unauthorized requested resource, 404 for unavailable resources, and 409 when a withdrawal loses a state race. Never return rosters, other-user IDs, private contacts, manager assignments, internal permissions, or complete activity records.

## `GET /api/clubs/me/selection`

Returns one complete, deterministic authorized card set and prevents browser-side N+1 joining.

```json
{
  "items": [{
    "clubId": "42",
    "name": "F-Code",
    "logoUrl": "https://cdn.example.edu/clubs/f-code.png",
    "role": "MANAGER",
    "workspacePath": "/v2/my-clubs/42",
    "upcomingActivity": { "title": "Code Camp", "startTime": "2026-10-01T09:00:00Z", "location": "A.203" },
    "pendingApplications": 3
  }]
}
```

Cards include only approved memberships or active manager assignments. The server excludes cancelled, complete, or out-of-scope activities before choosing the earliest future item. For a manager whose count is unavailable, return `pendingApplications: null`; omit it for a member. Return `items: []` for a valid user with no eligible club.

## `GET /api/clubs/me/membership-applications`

Returns only the current user’s requests to join existing clubs, not club-formation applications.

```json
{
  "items": [{
    "applicationId": "m-901",
    "club": { "clubId": "42", "name": "F-Code", "logoUrl": null },
    "reason": "Muốn tham gia đội lập trình.",
    "status": "PENDING",
    "canWithdraw": true
  }]
}
```

Allowed statuses are `PENDING`, `APPROVED`, `REJECTED`, and `WITHDRAWN`. Reviewer identity, review notes and other applicants are excluded.

## `POST /api/clubs/me/membership-applications/{applicationId}/withdraw`

Withdraws only the current user’s pending request; no body is required. It is safe to retry: a repeat may return the current withdrawn representation or 409 with current state. Successful response returns the updated application; UI refreshes current-user data.

## Workspace route boundary

The UI navigates to `/v2/my-clubs/{clubId}` even while it is a V2-local placeholder. The later workspace route must independently verify access and must never route to `/v2/demo`.
