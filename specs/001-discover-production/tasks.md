---
description: 'Task list for the Production Discover Experience'
---

# Tasks: Production Discover Experience

**Input**: Design documents from `/specs/001-discover-production/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md),
[data-model.md](data-model.md), [discover-ui-contract.md](contracts/discover-ui-contract.md)

**Tests**: Include focused V2 adapter/route checks required by the constitution, existing demo
regression checks, and the production build.

**Organization**: Tasks are grouped by user story so each increment can be validated independently.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the V2 production/demo route boundary and create the V2-only feature areas.

- [x] T001 Create V2 production page and reusable component directories in `src/pages/v2/` and `src/components/v2/`
- [x] T002 [P] Add a V2-local stylesheet entry for production Discover styling in `src/pages/v2/discover.scss`
- [x] T003 [P] Document the required least-privilege directory/public-detail backend fields and the recruiting-status dependency in `specs/001-discover-production/contracts/discover-ui-contract.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Move the retained demo below `/v2/demo` and provide shared V2 production routing/data
infrastructure. No user story begins until this phase is complete.

- [x] T004 Create the single authenticated V2 parent route owner in `src/pages/v2/V2App.jsx`, with production index/child routes and a nested `/demo/*` branch
- [x] T005 Update the V2 branch in `src/main.jsx` so `/v2/*` mounts `V2App` rather than mounting the demo application directly
- [x] T006 Refactor `src/pages/v2/DemoApp.jsx` into provider-free demo route composition that receives the parent V2 session while keeping `DemoProvider` exclusively around demo routes
- [x] T007 Rebase all hard-coded demo paths, redirects, reset targets, and route-relative fallbacks from `/v2` to `/v2/demo` in `src/pages/v2/DemoApp.jsx`, `src/pages/v2/Discovery.jsx`, `src/pages/v2/Workspace.jsx`, `src/pages/v2/ui.jsx`, and `src/pages/v2/Profile.jsx`
- [x] T008 Rebase retained demo SSR smoke paths and assertions to `/v2/demo` in `scripts/demo-smoke.mjs`
- [x] T009 Create V2-only normalized models and request lifecycle utilities in `src/pages/v2/discover-data.js`: `ClubDirectoryEntry`, `DirectoryCriteria`, `ClubPublicDetail`, states Loading/Populated/Empty/Forbidden/Error, current-context identity, cancellation/obsolete-response handling, and no fixture fallback
- [x] T010 Create V2-only API mapping functions in `src/pages/v2/discover-data.js` that select display-safe directory/detail fields, never expose roster data, normalize missing optional fields as unavailable, and keep `recruitingOnly` disabled when `isRecruiting` is absent
- [x] T011 Add foundational V2 route/data checks in `src/pages/v2/discover-data.test.js` for stale-context rejection, 401 sign-in handoff, 403, retryable errors, missing optional fields, and no fixture fallback

**Checkpoint**: `/v2` and `/v2/demo` have isolated owners, production data has one V2-only adapter,
and retained demo navigation is rebased before production UI is added.

---

## Phase 3: User Story 1 - Discover clubs (Priority: P1) 🎯 MVP

**Goal**: An authenticated user can use the V2 Discover landing, browse the full directory, filter
it truthfully, and open a read-only production club detail page.

**Independent Test**: With permitted clubs across categories, open `/v2`, continue to `/v2/clubs`,
intersect search/category/recruitment criteria, and open `/v2/clubs/:clubId` without demo content.

- [x] T012 [P] [US1] Create the public card presentation with optional-image/schedule fallbacks and `/v2/clubs/:clubId` navigation in `src/components/v2/ClubCard.jsx`
- [x] T013 [P] [US1] Create accessible search, category, clear, count, and conditionally disabled recruiting-only controls in `src/components/v2/DirectoryFilters.jsx`; preserve the exact rule “May be enabled only when recruitment state is available.”
- [x] T014 [P] [US1] Create production page-state presentation in `src/components/v2/PageState.jsx` for Loading, Empty, Forbidden, Error/retry, and not-found outcomes
- [x] T015 [US1] Migrate the complete demo Discover layout into maintainable production page/components in `src/pages/v2/DiscoverPage.jsx` and `src/components/v2/`, using V2 adapter data and no `DemoContext`/`model.js` imports or visual redesign
- [x] T016 [US1] Create the complete searchable directory inside `src/pages/v2/DiscoverPage.jsx`; apply `DirectoryCriteria` with AND semantics and preserve controls for empty results
- [x] T017 [US1] Create the read-only permitted club detail screen in `src/pages/v2/ClubDetailPage.jsx`; use `ClubPublicDetail`, show unavailable optional values truthfully, and never render membership rosters or demo join mutations
- [x] T018 [US1] Compose landing, directory, and detail routes under the V2 parent in `src/pages/v2/V2App.jsx` and register production Discover styles through `src/pages/v2/discover.scss`
- [x] T019 [US1] Extend `src/pages/v2/discover-data.test.js` with card navigation, full filter intersection, disabled recruitment state, empty-result clearing, and public-detail privacy assertions

**Checkpoint**: US1 is complete when `/v2`, `/v2/clubs`, and `/v2/clubs/:clubId` work under the
authenticated V2 boundary and can be tested without the recommendation feature.

---

## Phase 4: User Story 2 - Navigate the student club area (Priority: P1)

**Goal**: Page actions and cards move authenticated users among Discover, Clubs, and club detail.

**Independent Test**: Visit each V2 production route directly and through its page action; the
authenticated session persists and `/v2/demo` remains isolated.

- [x] T020 [P] [US2] Provide explicit Discover-to-Clubs and card-to-detail navigation
- [x] T021 [US2] Create the production V2 shell with a header and routed content outlet in `src/components/v2/DiscoverShell.jsx`
- [x] T022 [US2] Apply `DiscoverShell` to production routes only in `src/pages/v2/V2App.jsx`, preserving the separate demo header/UI LAB shell
- [x] T023 [US2] Add direct-route, authenticated-session, and production-vs-demo isolation checks in `src/pages/v2/discover-data.test.js`

**Checkpoint**: US2 is complete when production navigation is shared and session-preserving, while
the demo remains reachable only below `/v2/demo`.

---

## Phase 5: User Story 3 - Understand unavailable results (Priority: P2)

**Goal**: Users receive clear loading, empty, forbidden, and error/retry feedback across every
production Discover page.

**Independent Test**: Simulate each adapter outcome for landing, directory, recommendation, and
detail views; every route shows the appropriate state without unrelated data or fixtures.

- [x] T024 [US3] Apply `PageState` and retry behavior to the unified landing/directory and detail fetch paths in `src/pages/v2/DiscoverPage.jsx` and `src/pages/v2/ClubDetailPage.jsx`
- [x] T025 [US3] Add availability-state and retry assertions for all production V2 routes in `src/pages/v2/discover-data.test.js`, including rapid criteria, route, and session changes
- [x] T026 [US3] Verify no retained demo import, UI LAB text, fixture club, or demo actor can render from production V2 modules in `src/pages/v2/discover-data.test.js`

**Checkpoint**: US3 is complete when every required state is distinct, actionable where relevant,
and isolated to the current authorized context.

---

## Phase 6: User Story 4 - Receive recommendations without a redesign (Priority: P3)

**Goal**: Users see a bounded suggested subset on Discover that RE-39 can later populate with personalized entries.

**Independent Test**: Open Discover before RE-39; verify the permitted suggested subset, category
controls, six-card pagination, and four-page maximum.

- [x] T027 [US4] Create Suggested Clubs mode in `src/pages/v2/DiscoverPage.jsx` using the deterministic curated subset and explicit non-personalized label
- [x] T028 [US4] Add suggested/full directory query-mode composition and compatibility redirects in `src/pages/v2/V2App.jsx` without changing club-detail routing
- [x] T029 [US4] Add curated-label, independent error, and RE-39-compatible card-region checks in `src/pages/v2/discover-data.test.js`

**Checkpoint**: US4 is complete when recommendations are useful but never claim personalization or
block the directory if their own data path fails.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validate the completed migration, responsive desktop experience, and retained demo.

- [x] T030 [P] Review V2 production styles in `src/pages/v2/discover.scss` at 1060px and a wider desktop viewport; verify controls, cards, focus order, and actions have no horizontal clipping
- [x] T031 [P] Verify `/v2/demo` deep-link fallback configuration in `nginx.conf` and document any required deployment rewrite behavior in `specs/001-discover-production/quickstart.md`
- [x] T032 Run `npm run test:demo`, `npm run test:demo:routes`, and `npm run build`; record results in `specs/001-discover-production/quickstart.md`
- [ ] T033 Run every manual scenario in `specs/001-discover-production/quickstart.md`, including production/demo route isolation and all availability states

## Phase 9: Suggested Discover and Independent Clubs

- [x] T038 Remove the production left rail from `src/components/v2/DiscoverShell.jsx`
- [x] T039 Limit Discover to 24 suggested clubs, six per page, with category/search filters only
- [x] T040 Restore independent `/v2/clubs` with all filters and twelve-card pagination
- [x] T041 Keep `/v2/clubs/:clubId` as an independent card destination and point the Discover callout to Clubs
- [x] T042 Make valid club logos cover the artwork region while retaining ClubArt for missing/failed URLs

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on setup and blocks all stories.
- **US1 (Phase 3)**: Depends on Phase 2 and is the MVP.
- **US2 (Phase 4)**: Depends on Phase 2; integrates the production pages delivered by US1.
- **US3 (Phase 5)**: Depends on Phase 2 and completes state coverage for US1/US2 pages.
- **US4 (Phase 6)**: Depends on Phase 2 and the shared card infrastructure from US1.
- **Polish (Phase 7)**: Depends on all desired stories.

### User Story Dependencies

- **US1**: No user-story dependency after the foundation.
- **US2**: Uses the routes/pages created in US1.
- **US3**: Uses the shared adapter and page-state component; can start once those foundational files exist.
- **US4**: Uses the shared adapter and cards from US1.

### Parallel Opportunities

- T002 and T003 can run in parallel.
- T012, T013, and T014 can run in parallel after T009–T010.
- T020 can begin independently once V2 parent routes exist.
- T030 and T031 can run in parallel after feature implementation.

## Parallel Example: User Story 1

```text
T012 src/components/v2/ClubCard.jsx
T013 src/components/v2/DirectoryFilters.jsx
T014 src/components/v2/PageState.jsx
```

## Implementation Strategy

### MVP First

1. Complete Phases 1 and 2, including the `/v2` versus `/v2/demo` route migration.
2. Complete US1 and validate the landing, directory, and public detail journey.
3. Confirm the required backend public-detail/recruitment contract is available; where it is not,
   keep the documented truthful unavailable states rather than substituting fixture values.

### Incremental Delivery

1. Deliver US1 as the production browsing/detail MVP.
2. Add US2 page navigation and direct-route confidence.
3. Complete US3 failure-state coverage.
4. Add US4 curated recommendations, ready for RE-39.

## Notes

- All tasks follow the required checkbox, ID, optional parallel marker, story label, and file-path format.
- V2 production code must not import `DemoContext`, `model.js`, or retained demo mutation behavior.
- `/v2/demo` remains a reference/demo route, not a production fallback.
