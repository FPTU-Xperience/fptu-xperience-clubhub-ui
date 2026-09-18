# Activity Discovery Contract

**Status**: Proposed dependency for implementation. This document specifies the display-safe
boundary required by the UI; it does not claim the endpoints already exist.

## Authorization rules

For every request, the server obtains the caller from the authenticated session and evaluates each
activity before serializing it.

1. Include an `UPCOMING` or `LIVE` activity when it is public to the caller under the agreed
   policy, or when the caller has active membership/explicit view authority for its club.
2. Do not return `COMPLETED`, `CANCELLED`, unavailable, or otherwise ineligible activities.
3. Do not return a roster, attendance records, user IDs, applications, internal permissions,
   raw ranking score or recommendation as evidence of authority.
4. Re-evaluate eligibility when detail/action resources are requested. Client routing and a
   recommendation result never grant access.

## `GET /api/v2/activities/feed`

Returns the caller's authorized upcoming/live activity collection. The request is authenticated;
server pagination may be added later only with an agreed UI contract. Version one must support the
specification's 50-item validation case without client overfetch of private data.

### Success response — `200 OK`

```json
{
  "items": [
    {
      "id": "activity-123",
      "clubId": "club-fcode",
      "clubName": "F-Code",
      "title": "Workshop React",
      "description": "Nội dung hiển thị cho người được phép xem.",
      "startTime": "2026-09-24T09:00:00+07:00",
      "endTime": "2026-09-24T11:00:00+07:00",
      "location": "Innovation Lab",
      "status": "UPCOMING",
      "nextAction": {
        "kind": "OPEN_ACTIVITY_CONTEXT",
        "label": "Xem trong CLB",
        "available": true
      }
    }
  ]
}
```

### Error behavior

| Status | UI behavior |
| --- | --- |
| `401` | Existing sign-in/session-expiry flow. |
| `403` | Render page forbidden state; do not retain prior user's data. |
| `5xx` or network error | Render retriable error state. |

## `GET /api/v2/recommendations/activities?limit=6`

Returns no more than six rank-ordered activity recommendations for the authenticated caller. The
server filters authorization and availability before ranking/serializing. `limit` greater than six
is clamped to six; an empty `items` array is normal.

### Success response — `200 OK`

```json
{
  "items": [
    {
      "recommendationId": "rec-opaque-456",
      "rank": 1,
      "reason": "Phù hợp với lĩnh vực bạn quan tâm",
      "modelVersion": "activity-v1",
      "activity": {
        "id": "activity-123",
        "clubId": "club-fcode",
        "clubName": "F-Code",
        "title": "Workshop React",
        "description": "Nội dung hiển thị cho người được phép xem.",
        "startTime": "2026-09-24T09:00:00+07:00",
        "endTime": "2026-09-24T11:00:00+07:00",
        "location": "Innovation Lab",
        "status": "UPCOMING",
        "nextAction": { "kind": "VIEW_CLUB", "label": "Xem CLB", "available": true }
      }
    }
  ]
}
```

The UI may omit `reason` when rendering. `modelVersion` and rank are not a permission signal and
must not be used for client authorization.

## Compatibility and migration

- Do not bind this UI to the current `/api/activities` response: it includes participant and
  attendance structures and its existing visibility rules do not meet this contract.
- Preserve the existing `VITE_API_BASE_URL`/Gateway boundary; the browser does not call an internal
  service port or Recommendation Engine directly.
- Map existing backend lifecycle data explicitly to `UPCOMING`/`LIVE` before it reaches the UI.
  The current Activity Service exposes `Scheduled`, `Completed` and `Cancelled`, so `LIVE` and
  public availability require product/backend agreement.
- The contract needs cross-repository ownership and a linked issue/comment before UI implementation
  begins. Existing relevant graph dependencies are UI-02 API adapters, UI-06 activity
  recommendations, RE-35, RE-40 and RE-43.
