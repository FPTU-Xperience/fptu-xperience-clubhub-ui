# Data Model: Production Club Workspace

## WorkspaceSelection

| Field | Type | Rules |
|-------|------|-------|
| clubId | string | Required; unique within a selection; must exactly match the decoded route identifier. |
| name | string | Required display label; falls back to “Câu lạc bộ” only when omitted by the source. |
| logoUrl | string | Optional safe artwork URL. |
| role | `MEMBER` or `MANAGER` | Required; manager determines access to manager navigation and manager-only count. |
| upcomingActivity | object or null | Display only when title and start time are both valid. |
| pendingApplications | non-negative integer or null | Display only to a manager. `null` means unavailable, never zero. |

## WorkspaceView

| Field | Source | Rules |
|-------|--------|-------|
| selection | WorkspaceSelection | Present only when the current selection includes the route club ID. |
| section | route segment | `home` by default; a named deferred area changes only the explanatory state. |
| status | request outcome | `loading`, `populated`, `empty`, `unauthorized`, `forbidden`, `not-found`, or `error`. |

## Relationships and state

- One authenticated user has zero or more WorkspaceSelection records.
- One WorkspaceView displays exactly one selection scoped by `clubId`.
- A `MANAGER` selection may reveal manager navigation; a `MEMBER` selection may not.
- Selection request lifecycle: loading → populated/empty/error category; retry restarts the current request only.
