# Data Model: Production Application Header

## Header navigation item

| Field | Meaning | Validation / source |
| --- | --- | --- |
| `id` | Stable header item identifier | Static V2-local value; unique |
| `label` | User-visible destination label | Non-empty, Vietnamese UI label |
| `destination` | Production route | Must be a supported `/v2` route; never `/v2/demo` |
| `isActive` | Whether it represents the current location | Derived from the route location |

Initial items: Discover (`/v2`) and Clubs (`/v2/clubs`). Items are presentation choices only; server authorization remains authoritative.

## Authenticated header identity

| Field | Meaning | Validation / source |
| --- | --- | --- |
| `sessionKey` | Identity used to scope header request lifecycle | Authenticated user id, then email; required for data retrieval |
| `displayName` | Current user's display name | Trimmed display-safe auth value; fallback `Sinh viên FPTU` |
| `accountLabel` | Secondary account identifier | Email or `ClubHub`; never inferred from demo actor data |
| `avatarLabel` | Avatar or initials fallback | Existing auth value or accessible fallback `SV` |

**Transition**: unauthenticated → authenticated creates a header identity; identity/session change invalidates notification state; logout clears it before protected UI can render again.

## Notification summary

| Field | Meaning | Validation / source |
| --- | --- | --- |
| `id` | Stable notification identifier | Required after mapping; entries without one are excluded |
| `title` | Short authorized heading | Optional; fallback to a neutral update label |
| `message` | Display-safe notification text | Optional string; no club roster or unrelated account data |
| `createdAt` | Creation timestamp for ordering/presentation | Optional ISO-compatible value; no client fabrication |
| `isRead` | Whether the user has read the notification | Boolean, defaults to `false` only when omitted |

**Relationship**: belongs to the authenticated header identity returned by the server. The client must not add a recipient or club relationship that the response does not provide.

## Notification request state

| State | Meaning | Permitted user outcome |
| --- | --- | --- |
| `idle` | Popover has not requested data | Open control starts retrieval |
| `loading` | Current-session request is in flight | Header remains navigable; progress is announced |
| `populated` | At least one valid summary is available | Show most recent six summaries and unread indicator |
| `empty` | Request succeeded without valid summaries | Show clear no-notifications message |
| `forbidden` | Server denied notification access | Explain that notifications are unavailable; do not show prior data |
| `unauthorized` | Session is no longer valid | Follow established sign-in handling; clear protected data |
| `error` | Other retrieval failure | Show retry action; do not substitute fixture data |

**Transitions**: `idle → loading → populated|empty|forbidden|unauthorized|error`; retry returns `error → loading`; close leaves data in memory only for the same session; session key change or unmount invalidates pending work and returns state to `idle`.
