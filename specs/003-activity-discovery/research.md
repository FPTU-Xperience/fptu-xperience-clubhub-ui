# Research: Khám phá hoạt động

## Decision: Introduce an authorized display-safe activity feed

**Decision**: The production UI consumes a dedicated feed contract that server-filters the union
of public activities and activities belonging to the current user's active memberships, limited to
`UPCOMING` and `LIVE`. It returns only activity-display fields and the user's allowed next action.

**Rationale**: The current `GET /api/activities` implementation is limited to clubs returned by
`GetMyAccessAsync`, has no public visibility field, and maps `Participants` and `Attendances` into
its response. It therefore cannot safely satisfy public browsing or least-privilege display.

**Alternatives considered**: Filtering the current activity response in the browser was rejected
because the browser would first receive roster and attendance data, and client filtering is not an
authorization boundary. A client call per club was rejected because it cannot include public
activities consistently and increases stale-context risk.

## Decision: Treat public access and membership as separate server rules

**Decision**: The contract determines view eligibility per item: a public activity can be included
under public visibility; a non-public activity requires an active membership (or separately
authorized relationship) for its owning club. Recommendation ranking is applied only after that
eligibility check.

**Rationale**: The UI must not infer visibility from a global role, a cached access list or a
recommendation. A recommendation is a ranking result, never a grant of access.

**Alternatives considered**: Treating all Activity-Service `CanView` clubs as public and treating
recommendation membership as authority were rejected because they conflate two authorization
decisions and expose internal activity data.

## Decision: Return a small, ranked recommendation projection

**Decision**: Discover requests at most six activity recommendations from a server-authoritative
source. Each returned item is eligible at response time and has a stable recommendation identifier,
rank and optional non-sensitive explanation metadata. An empty eligible set is a normal state.

**Rationale**: The specification fixes the Discover cap at six and requires truthful empty state.
The existing issue graph identifies RE-35 (activity recommendations), RE-40 (activity action) and
RE-43 (shared contract) as external dependencies for UI activity recommendations.

**Alternatives considered**: Deriving recommendations from the club directory or filling the
section with demo fixtures was rejected because it falsely claims personalization. Loading an
unbounded feed into Discover was rejected because it displaces the club-discovery purpose.

## Decision: Preserve the demo interaction shape without its state model

**Decision**: Build production card and read-only detail components with the demo's information
hierarchy: date, owning club, status, title, location, detail open control, then a permitted
next-action link. Keep selected activity in page-local UI state; route-level data remains the
authorized feed.

**Rationale**: This meets the requested visual reference and avoids introducing a new detail route
or coupling production to `DemoContext`, fixture actors, registration arrays or demo mutations.

**Alternatives considered**: Rendering demo components directly was rejected due to their
`useDemo`/workspace dependencies. A dedicated detail route was rejected by the clarification.

## Decision: Use request identity and explicit availability states

**Decision**: Reuse the V2 request-gate pattern for feed and recommendation requests, keyed by the
current session and request purpose. Show loading, populated, empty, forbidden and error states
independently for the page and Discover section; retry only issues a current request.

**Rationale**: Existing V2 club adapters already apply stale-response protection. The feature's
privacy requirement means a response started for one user/session must not render after that
context changes.

**Alternatives considered**: A global cached list with optimistic fallback and fixture fallback
were rejected because they risk stale/private content and violate truthful state requirements.

## Decision: Normalize lifecycle labels at the API boundary

**Decision**: The display contract uses `UPCOMING` and `LIVE` as its only feed states. The
Activity-Service's existing `Scheduled`, `Completed`, and `Cancelled` records require an explicit
server mapping/availability rule; no client guesses `LIVE` from local time.

**Rationale**: The existing model has no `Public` property and no `Live` status constant, while the
spec requires only available upcoming/live activities. A shared definition avoids inconsistent
time-zone or cancellation behavior.

**Alternatives considered**: Converting `Scheduled` to `UPCOMING` and deriving `LIVE` solely in
the browser was rejected because lifecycle and authorization need one authoritative source.
