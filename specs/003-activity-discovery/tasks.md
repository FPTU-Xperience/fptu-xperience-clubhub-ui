# Tasks: Khám phá hoạt động

**Input**: Design documents from `/specs/003-activity-discovery/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [activity discovery contract](contracts/activity-discovery-contract.md), and [quickstart.md](quickstart.md).

**Tests**: Focused production adapter/route tests are required by the plan and constitution. Retain the existing demo regression and build commands as final checks.

**Organization**: Tasks are grouped by user story after the contract and privacy foundation. A recommendation never grants access, and no UI task may substitute the current raw Activity response or demo fixtures.

## Phase 1: Setup and traceability

**Purpose**: Preserve the agreed cross-repository boundary before implementation starts.

- [ ] T001 Record the activity-feed and recommendation field/privacy boundary from `specs/003-activity-discovery/contracts/activity-discovery-contract.md` on the linked UI API-adapter/activity-recommendation issues, then update `../fptu-xperience-doc/docs/clubhub-ui-issue-dependency-graph.md` if the feed/recommendation dependency is not navigable.
- [ ] T002 [P] Reconcile the proposed response examples and lifecycle vocabulary in `specs/003-activity-discovery/contracts/activity-discovery-contract.md` with `../fptu-xperience-clubhub-api/API_ENDPOINTS.md`; document that the contract is Gateway-routed and not a direct Recommendation Engine browser call.
- [X] T003 [P] Add a production activity-discovery test fixture/helper boundary in `src/pages/v2/activity-data.test.js` that contains only display-safe feed data, never demo actors, participant/attendance arrays, user IDs, or raw ranking scores.

---

## Phase 2: Foundational contract and adapter prerequisites

**Purpose**: Build the server-authoritative and V2-local prerequisites that block every user story.

**CRITICAL**: Do not start page or Discover UI work until the feed/recommendation contracts are approved and their responses can be exercised through the Gateway.

- [ ] T004 Extend `../fptu-xperience-clubhub-api/src/Services/ActivityService/Models/ClubActivity.cs`, `../fptu-xperience-clubhub-api/src/Services/ActivityService/Models/ActivityStatuses.cs`, `../fptu-xperience-clubhub-api/src/Services/ActivityService/Migrations/20260918000000_AddActivityDiscoveryVisibility.cs`, and its generated designer file to represent server-owned public visibility and an explicit lifecycle mapping for the display states `UPCOMING` and `LIVE`; do not derive `LIVE` in the browser.
- [ ] T005 Implement display-safe response records in `../fptu-xperience-clubhub-api/src/Services/ActivityService/Contracts/ActivityContracts.cs` and the authorized `GET /api/v2/activities/feed` projection in `../fptu-xperience-clubhub-api/src/Services/ActivityService/Endpoints/ActivityEndpoints.cs`; return only the contract fields, deduplicate public-plus-membership matches, exclude completed/cancelled/ineligible items, and never serialize rosters, attendance, user IDs, applications or internal permissions.
- [ ] T006 Implement or Gateway-route `GET /api/v2/recommendations/activities?limit=6` in `../fptu-xperience-clubhub-api/src/Gateway/ApiGateway/yarp.json` and its owning recommendation integration; clamp limit to six, re-check eligibility before serialization, and return only `recommendationId`, positive rank, optional non-sensitive reason/model version, and an `ActivityFeedItem` projection as specified in `specs/003-activity-discovery/contracts/activity-discovery-contract.md`.
- [ ] T007 Add authenticated `getActivityFeed()` and `getRecommendedActivities(limit)` request methods in `src/services/api.js` for the approved Gateway endpoints; preserve existing 401 refresh/sign-in behavior and do not alter the legacy `getActivities()` consumer contract.
- [X] T008 Implement display-safe mapping, `ActivityFeedCriteria`, client search, request-gate invalidation, and separate feed/recommendation hooks in `src/pages/v2/activity-data.js`; enforce “Exactly `UPCOMING` or `LIVE`”, “The section keeps at most six unique activity IDs, in ascending rank”, and only open `selectedActivityId` when it identifies an item in the current authorized feed.
- [ ] T009 Add focused mapper and request-lifecycle coverage in `src/pages/v2/activity-data.test.js` for required `ActivityFeedItem` fields, permitted search fields, duplicate activity IDs, six-item ranked recommendations, forbidden/error classification, and stale session/request responses.

**Checkpoint**: The UI has an approved, least-privilege data boundary and testable V2 adapter. No production component imports demo state, raw Activity payloads, or local business mutations.

---

## Phase 3: User Story 1 - Xem danh sách hoạt động phù hợp (Priority: P1) MVP

**Goal**: An authenticated student can browse and search one feed of authorized public and active-membership upcoming/live activities, then read an in-context detail without mutating registration.

**Independent Test**: With public, active-membership, unrelated-private, completed and cancelled records, direct navigation to `/v2/activities` shows only authorized `UPCOMING`/`LIVE` entries, filters by permitted text, opens read-only detail, and exposes no registration mutation.

### Tests for User Story 1

- [ ] T010 [US1] Add feed-page and production-isolation assertions in `src/pages/v2/activity-data.test.js` for direct `/v2/activities` ownership, no `DemoContext`/`model.js` import, and no completed, cancelled or unrelated-private item after mapping.
- [ ] T011 [US1] Add keyboard/focus and non-mutating-detail assertions in `src/pages/v2/activity-data.test.js` for the selected item and its `nextAction`; verify the page has no register/unregister request path.

### Implementation for User Story 1

- [X] T012 [P] [US1] Create the production card in `src/components/v2/activity-card/ActivityCard.jsx` and `src/components/v2/activity-card/ActivityCard.scss` with date, club name, `UPCOMING`/`LIVE` status, title, optional-location unavailable treatment, and an accessible detail-open control derived visually from the demo only.
- [X] T013 [P] [US1] Create the read-only, focus-managed detail presentation in `src/components/v2/activity-detail/ActivityDetail.jsx` and `src/components/v2/activity-detail/ActivityDetail.scss`; render `description`, time and contract-approved `nextAction`, but no create/edit/register/unregister/check-in controls.
- [X] T014 [US1] Create `src/pages/v2/activities-page/ActivitiesPage.jsx` and `src/pages/v2/activities-page/ActivitiesPage.scss` using `getActivityFeed()`/the V2 hook, a text search over only the current authorized feed, `PageState`, ActivityCard and ActivityDetail.
- [X] T015 [US1] Register `/v2/activities` in `src/pages/v2/V2App.jsx` and reconcile the existing Hoạt động navigation in `src/components/v2/common/header/Header.jsx` without overwriting unrelated header changes.
- [ ] T016 [US1] Extend `src/pages/v2/activity-data.test.js` with the P1 end-to-end composition checks: visible display fields, one public-plus-membership copy, empty search result, read-only modal, and direct-route session continuity.

**Checkpoint**: User Story 1 is independently demoable as the MVP with only server-authorized, upcoming/live activities.

---

## Phase 4: User Story 2 - Nhận gợi ý hoạt động trên Khám phá (Priority: P2)

**Goal**: Discover presents no more than six current, authorized recommendations and offers the full activity feed without manufacturing suggestions when none exist.

**Independent Test**: With rank-ordered eligible recommendations, `/v2` displays at most six unique ActivityCards and its all-activities action opens `/v2/activities`; an empty, forbidden or failed recommendation request has its own truthful state.

### Tests for User Story 2

- [ ] T017 [P] [US2] Add recommendation mapper/composition assertions in `src/pages/v2/discover-data.test.js` for ascending positive ranks, unique activity IDs, a maximum of six, optional reason omission, and rejection of ineligible or non-`UPCOMING`/`LIVE` payloads.

### Implementation for User Story 2

- [X] T018 [US2] Add the recommended-activities section to `src/pages/v2/discovery-page/DiscoveryPage.jsx`, sourcing only `getRecommendedActivities(6)`, reusing the production ActivityCard/detail behavior, and linking the section action to `/v2/activities`.
- [X] T019 [US2] Add the section’s responsive layout and empty/loading/forbidden/error styling to `src/pages/v2/discovery-page/DiscoveryPage.scss`, retaining Discover’s no-left-rail information architecture and preserving the existing club-directory section.
- [ ] T020 [US2] Extend `src/pages/v2/discover-data.test.js` to verify the Discover section does not import demo providers/fixtures, does not treat recommendation metadata as authority, and retains existing club-directory behavior.

**Checkpoint**: User Story 2 independently shows only current, authorized recommendations and continues safely to the P1 feed.

---

## Phase 5: User Story 3 - Hiểu trạng thái dữ liệu (Priority: P3)

**Goal**: Students can distinguish loading, empty, forbidden and retriable failure states on both the feed and recommendation section, with no stale or fixture fallback.

**Independent Test**: Simulate each status for the two hooks, retry from an error, and change session during a pending request; verify only the current context can render data.

### Tests for User Story 3

- [ ] T021 [P] [US3] Add state-transition and retry assertions in `src/pages/v2/activity-data.test.js` for `Loading → Populated/Empty/Forbidden/Error`, preserving the existing unauthenticated sign-in behavior and clearing stale results on a session change.
- [ ] T022 [P] [US3] Add page/section availability-state assertions in `src/pages/v2/discover-data.test.js` for independent recommendation loading, empty, forbidden and retriable error states without fixture fallback.

### Implementation for User Story 3

- [ ] T023 [US3] Refine availability-state wiring in `src/pages/v2/activities-page/ActivitiesPage.jsx` and `src/pages/v2/discovery-page/DiscoveryPage.jsx` so retry targets only the current request purpose and an expired session, valid-session 403, empty response and network failure remain visually distinct.

**Checkpoint**: All terminal states are truthful, retriable when appropriate, and isolated to the current user/session.

---

## Phase 6: Polish and cross-cutting verification

**Purpose**: Validate the production migration boundary, accessibility and linked-contract handoff.

- [ ] T024 [P] Confirm implementation/source isolation in `src/pages/v2/V2App.jsx`, `src/pages/v2/activity-data.js`, `src/pages/v2/activities-page/ActivitiesPage.jsx`, and `src/pages/v2/discovery-page/DiscoveryPage.jsx`: no demo provider, fixture actor, UI lab or in-memory business mutation is imported by production routes.
- [ ] T025 [P] Execute and record the manual acceptance scenarios in `specs/003-activity-discovery/quickstart.md`, including 1060px and narrow-width keyboard/focus checks, direct reload of `/v2/activities`, access denial, stale session, and all availability states.
- [ ] T026 Run the validation commands declared in `package.json` (`npm run test:demo`, `npm run test:demo:routes`, and `npm run build`) plus `git diff --check` from the repository root; resolve any regression before feature handoff and report environment-only test blocks separately from product defects.

---

## Dependencies and execution order

```text
Phase 1 (traceability)
        ↓
Phase 2 (safe Activity + recommendation contracts and V2 adapter)
        ↓
US1 / P1 (authorized activity feed) ──→ US2 / P2 (Discover recommendations)
        └──────────────────────────────→ US3 / P3 (availability states)
                                      ↓
                         Phase 6 (cross-cutting verification)
```

### User story dependencies

- **US1 (P1)** starts after Phase 2 and is the MVP. It has no dependency on recommendations.
- **US2 (P2)** starts after Phase 2 and reuses the P1 card/detail presentation; it must not block delivery of the main feed.
- **US3 (P3)** starts after Phase 2, then completes after US1/US2 composition exists because it verifies the distinct states on both surfaces.

### Parallel opportunities

- T002 and T003 can run in parallel once the contract document is the agreed reference.
- In Phase 2, T004 and the recommendation owner work in T006 may proceed in parallel; T007–T009 are then sequenced by API method, adapter and tests.
- T010/T011 and T012/T013 use different files and can be parallelized within US1.
- T017 can run independently of the Discover page composition; T021 and T022 can run in parallel.
- T024 and T025 can run in parallel after all story work; T026 is the final gate.

## Parallel example: User Story 1

```text
Task: "T010 Add feed-page and production-isolation assertions in src/pages/v2/activity-data.test.js"
Task: "T011 Add keyboard/focus and non-mutating-detail assertions in src/pages/v2/activity-data.test.js"
Task: "T012 Create the production card in src/components/v2/activity-card/ActivityCard.jsx"
Task: "T013 Create the read-only detail in src/components/v2/activity-detail/ActivityDetail.jsx"
```

T010 and T011 should be coordinated if they modify the same test file; T012 and T013 are safe to perform in parallel because they own separate components.

## Implementation strategy

### MVP first

1. Complete Phase 1 and Phase 2; do not call the raw Activity endpoint from production UI.
2. Complete US1 and validate the independent P1 test with authorized and unauthorized fixtures.
3. Demonstrate `/v2/activities` before adding personalized recommendations.

### Incremental delivery

1. Add US2 only after the P1 card/detail behavior is stable; validate the six-item limit and all-activities route.
2. Add US3 availability coverage across both surfaces.
3. Complete Phase 6 and record API/issue dependency evidence before handoff.

## Notes

- Every task follows `- [ ] T### [P?] [US?] Description with file path`.
- `P` marks only work that can be performed without waiting on a shared file or unfinished task.
- Registration, unregistering, activity creation/editing, attendance and ranking-algorithm work are out of scope for this feature.
