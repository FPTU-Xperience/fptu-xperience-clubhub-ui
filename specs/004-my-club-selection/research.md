# Research: Chọn câu lạc bộ của tôi

## Decision 1: One server-authorized projection

**Decision**: Request `GET /api/clubs/me/selection` rather than combine memberships, access, club details, activity feed, and manager lists in the browser.

**Rationale**: Current `/me/memberships` and `/me/access` establish partial data only. A projection prevents N+1 requests, makes nearest activity deterministic, and prevents roster/application access outside scope.

**Alternatives considered**: Client-side joins and full-list filtering were rejected for privacy and authorization risk.

## Decision 2: Keep join applications distinct from club-formation applications

**Decision**: Use a membership-application resource; do not reuse current `/api/clubs/applications/me`.

**Rationale**: Existing applications represent creating a club, while this page shows requests to join a club; lifecycle and ownership differ.

**Alternatives considered**: Reuse formation applications or omit the panel — rejected as incorrect or contrary to approved demo UI.

## Decision 3: Server-owned authorization and summaries

**Decision**: Server returns only eligible cards, display-safe role, earliest authorized activity, and manager-only count. `pendingApplications: null` maps to “Đơn tham gia đang cập nhật”.

**Rationale**: Global role never grants club scope; `0` for unavailable count is misleading.

## Decision 4: Dedicated self-withdraw operation

**Decision**: `POST /api/clubs/me/membership-applications/{id}/withdraw` is idempotent and limited to the viewer’s pending request.

**Rationale**: Demo behavior is required, while current API only exposes manager approval/rejection.

## Decision 5: Production placeholder route

**Decision**: Card links always use `/v2/my-clubs/:clubId`; a V2-local placeholder remains until UI-09/BE-12 workspace migration.

**Rationale**: User chose production navigation even while destination content is not migrated; demo and public-detail redirects are rejected.
