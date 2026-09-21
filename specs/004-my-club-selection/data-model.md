# Data Model: Chọn câu lạc bộ của tôi

UI identifiers are opaque strings. Server owns authorization and state.

## MyClubSelection

| Field | Required | Rules |
| --- | --- | --- |
| `clubId` | Yes | Unique active eligible club; one card per ID. |
| `name`, `logoUrl` | Name yes | Display-safe identity; logo optional. |
| `role` | Yes | `MEMBER` or `MANAGER`; only manager may receive count. |
| `workspacePath` | Yes | `/v2/my-clubs/{clubId}`. |
| `upcomingActivity` | No | Earliest future activity authorized for viewer. |
| `pendingApplications` | Conditional | Manager-only nonnegative integer; null means updating; omitted for member. |

Only active manager assignments and approved memberships appear. Destination independently authorizes access.

## UpcomingActivitySummary

`title` and future `startTime` are required when present; `location` is optional. Server removes cancelled/completed/out-of-scope activities before selecting the earliest. Absence is valid.

## MyMembershipApplication

| Field | Required | Rules |
| --- | --- | --- |
| `applicationId` | Yes | Owned by current user. |
| `club` | Yes | Minimal club ID/name/optional logo. |
| `reason` | No | Current user’s submitted reason only. |
| `status` | Yes | `PENDING`, `APPROVED`, `REJECTED`, `WITHDRAWN`. |
| `canWithdraw` | Yes | True only for owned pending request. |

`PENDING → WITHDRAWN` is the only transition in scope. Repeated/non-owned/non-pending attempts return current state, conflict, forbidden or not-found without changing other data.

## Page lifecycle

`loading → populated | empty | unauthorized | forbidden | error`. Session change/unmount invalidates older requests. Withdrawal refreshes current-user projections.
