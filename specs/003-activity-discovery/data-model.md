# Data Model: Khám phá hoạt động

## ActivityFeedItem

The normalized display model for the production page and modal. It is created only by the V2
adapter from the authorized feed/recommendation contracts.

| Field | Required | Rules |
| --- | --- | --- |
| `id` | Yes | Stable activity identifier; unique within a response. |
| `clubId` | Yes | Stable owning club identifier; used only for permitted navigation context. |
| `clubName` | Yes | Display-safe name of the owning club. |
| `title` | Yes | Display title and search text. |
| `description` | Yes | Read-only detail text; never inferred from fixtures. |
| `startTime` | Yes | Authoritative start timestamp, rendered in the viewer locale. |
| `endTime` | No | Authoritative end timestamp when supplied. |
| `location` | No | Display-safe location; absent is shown as unavailable. |
| `status` | Yes | Exactly `UPCOMING` or `LIVE` in this feature. |
| `nextAction` | Yes | Server-permitted action descriptor; no client-side permission inference. |

`ActivityFeedItem` explicitly excludes `isPublic`, participant and attendance lists, user IDs,
contact data, applications, internal permissions, capacity management data, and raw recommendation
scores.

## NextAction

| Field | Required | Rules |
| --- | --- | --- |
| `kind` | Yes | `VIEW_CLUB` or `OPEN_ACTIVITY_CONTEXT`; controls an already-authorized next destination. |
| `label` | Yes | Accessible, user-facing action text. |
| `available` | Yes | `false` prevents an actionable link while retaining truthful explanation. |
| `unavailableReason` | Conditional | Required when `available` is `false`; display-safe only. |

The destination is resolved by production V2 routing from a contract-approved kind and stable IDs.
The server remains responsible for accepting or rejecting every target resource request.

## ActivityRecommendation

| Field | Required | Rules |
| --- | --- | --- |
| `activity` | Yes | One authorized `ActivityFeedItem`. |
| `recommendationId` | Yes | Opaque stable identifier for the ranked result. |
| `rank` | Yes | Positive integer; ascending order is most relevant first. |
| `reason` | No | Short non-sensitive explanation, used only when the product elects to display it. |
| `modelVersion` | No | Diagnostic/version metadata; not displayed as a user score. |

The section keeps at most six unique activity IDs, in ascending rank. A recommendation does not
override the activity's current eligibility or lifecycle state.

## ActivityFeedCriteria

| Field | Default | Validation |
| --- | --- | --- |
| `query` | Empty | Trimmed, locale-aware case-insensitive match against permitted `clubName`, `title`, `description` and `location`. |
| `status` | `UPCOMING,LIVE` | Fixed by feature scope; no completed/cancelled selector. |
| `selectedActivityId` | None | Must identify an item in the current authorized feed before its detail opens. |

Filtering runs only over the server-authorized collection currently in memory. A zero-result search
is an empty filter result, not an API error.

## Page and Section State

| State | Meaning | Allowed transition |
| --- | --- | --- |
| Loading | Current request is in flight. | Populated, Empty, Forbidden, Error |
| Populated | Current authorized data has one or more items. | Loading after retry/session change |
| Empty | Authorized request returned no items. | Loading after retry/session change |
| Forbidden | Valid session lacks the requested resource permission. | Loading after session/access refresh |
| Error | Retriable non-access failure. | Loading on retry |

An unauthenticated/expired session continues through the existing sign-in flow. Page and Discover
section own separate states; neither substitutes demo content for a terminal state.

## Relationships and Isolation

- One authenticated user has zero or more active club memberships. The server uses those
  relationships, together with public visibility, to form the feed; they are not returned as a
  roster or permission table.
- One `ActivityFeedItem` belongs to one club and can appear once in the main feed, even if both
  public and membership eligibility apply.
- One `ActivityRecommendation` references one currently eligible `ActivityFeedItem`.
- A request identity includes user session and request purpose. Session changes invalidate both
  page and recommendation responses; stale results cannot update visible UI.
