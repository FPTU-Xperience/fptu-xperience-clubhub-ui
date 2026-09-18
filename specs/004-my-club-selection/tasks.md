# Tasks: Chọn câu lạc bộ của tôi

**Input**: Design documents from `/specs/004-my-club-selection/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/my-clubs-ui-contract.md`, `quickstart.md`

**Scope**: UI-only. The backend contract is recorded on CLBHB-BE-14/#15; no task below changes backend source.

**Tests**: Included because the specification requires measurable route, privacy, stale-request, availability-state, and build verification.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the UI feature boundary and test target without changing demo behavior.

- [X] T001 Create the V2 feature directories `src/pages/v2/my-clubs-page/` and `src/components/v2/my-clubs/` per `specs/004-my-club-selection/plan.md`
- [X] T002 [P] Create `src/pages/v2/my-clubs-data.test.js` with the existing Node test-runner imports and production/demo source-boundary test scaffold
- [X] T003 [P] Review `specs/004-my-club-selection/contracts/my-clubs-ui-contract.md` before adding any UI client method; retain the UI-only external dependency boundary in `specs/004-my-club-selection/tasks.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implement shared V2 data, API and route foundations used by every story.

**⚠️ CRITICAL**: Complete this phase before beginning user-story UI composition.

- [X] T004 Implement contract DTO mappers and a session-safe request gate in `src/pages/v2/my-clubs-data.js`; map only `clubId`, display-safe identity, `MEMBER|MANAGER`, production workspace path, optional nearest activity, manager-only count, and current-user application fields
- [X] T005 Add named production client methods in `src/services/api.js` for `GET /api/clubs/me/selection`, `GET /api/clubs/me/membership-applications`, and `POST /api/clubs/me/membership-applications/{applicationId}/withdraw`; do not reuse club-formation application methods
- [X] T006 [P] Add adapter and request-gate coverage in `src/pages/v2/my-clubs-data.test.js` for opaque ID mapping, PII/roster stripping, `pendingApplications: null`, member count omission, earliest activity handling, application statuses, and stale session responses
- [X] T007 Add `/v2/my-clubs` and `/v2/my-clubs/:clubId` production route entries in `src/pages/v2/V2App.jsx`, preserving the isolated `/v2/demo/*` route tree
- [X] T008 Implement the V2-local temporary destination in `src/components/v2/my-clubs/WorkspacePlaceholder.jsx`; identify the selected production club route, show truthful in-progress/forbidden/not-found feedback, and never route to `/v2/demo`

**Checkpoint**: API boundary, stale-request protection, and production routes are ready; no demo state enters production.

---

## Phase 3: User Story 1 - Chọn không gian CLB đang tham gia (Priority: P1) 🎯 MVP

**Goal**: A signed-in user sees exactly their eligible clubs with correct role/context and can enter the matching production workspace route.

**Independent Test**: With multiple approved/managed clubs, load `/v2/my-clubs`, confirm each eligible club appears once with its correct role and the card enters `/v2/my-clubs/:clubId`; confirm an ineligible club never appears.

### Tests for User Story 1

- [X] T010 [P] [US1] Add selection projection and role-privacy assertions in `src/pages/v2/my-clubs-data.test.js`: only approved membership/active manager cards map, each `clubId` is unique, and member cards expose no manager count
- [X] T011 [P] [US1] Add production-card and production-workspace route assertions in `src/pages/v2/my-clubs-data.test.js` for `MyClubsPage.jsx`, `MyClubCard.jsx`, `V2App.jsx`, and no `/v2/demo` destination

### Implementation for User Story 1

- [X] T012 [P] [US1] Implement reusable role-aware card markup in `src/components/v2/my-clubs/MyClubCard.jsx` using display-safe club identity, keyboard-accessible production CTA, and existing V2 button conventions
- [X] T013 [P] [US1] Add demo-derived but V2-scoped card/list/page-heading styles in `src/pages/v2/my-clubs-page/MyClubsPage.scss`, preserving the 1060px desktop baseline without horizontal clipping
- [X] T014 [US1] Implement `src/pages/v2/my-clubs-page/MyClubsPage.jsx` to load the selection projection with `sessionKey`, compose cards using `MyClubCard.jsx`, and provide the production “Khám phá thêm” path
- [X] T015 [US1] Wire `MyClubsPage` into the `/v2/my-clubs` route in `src/pages/v2/V2App.jsx` and verify selected-card navigation preserves the authenticated V2 shell

**Checkpoint**: User Story 1 is independently usable as the MVP once its selection endpoint is available.

---

## Phase 4: User Story 2 - Theo dõi hoạt động và đơn tham gia cá nhân (Priority: P2)

**Goal**: The page preserves the demo’s nearest-activity and personal application context, including authorized self-withdrawal.

**Independent Test**: With a club that has several upcoming activities and a user with applications in multiple states, verify the nearest authorized activity, only own applications, and a successful pending withdrawal refresh.

### Tests for User Story 2

- [X] T016 [P] [US2] Add nearest-activity, absent-activity, null-manager-count copy, and own-application mapping tests in `src/pages/v2/my-clubs-data.test.js`
- [X] T017 [P] [US2] Add withdrawal request and state-result tests in `src/pages/v2/my-clubs-data.test.js`, including retry/conflict behavior without changing another application

### Implementation for User Story 2

- [X] T018 [P] [US2] Extend `src/components/v2/my-clubs/MyClubCard.jsx` to render the earliest authorized activity or the approved schedule-updating copy, and render manager count or “Đơn tham gia đang cập nhật” without guessing a number
- [X] T019 [P] [US2] Implement `src/components/v2/my-clubs/MyMembershipApplications.jsx` to render only current-user join applications, their allowed statuses, empty copy, and a keyboard-accessible withdraw action only when `canWithdraw` is true
- [X] T020 [US2] Integrate application loading, withdrawal mutation, success/current-state refresh, and error feedback in `src/pages/v2/my-clubs-page/MyClubsPage.jsx` using methods from `src/services/api.js`
- [X] T021 [US2] Extend the production styles in `src/pages/v2/my-clubs-page/MyClubsPage.scss` for application rows, status pills, activity summary, pending-count fallback, and withdraw feedback while preserving demo layout

**Checkpoint**: User Stories 1 and 2 preserve all approved data-driven My Clubs UI without exposing other users’ data.

---

## Phase 5: User Story 3 - Hiểu trạng thái truy cập và dữ liệu (Priority: P3)

**Goal**: Users can distinguish loading, empty, expired-session, forbidden, error, and unavailable-summary states without fixtures or stale content.

**Independent Test**: Simulate each availability response and a session change while loading; confirm visible state, retry behavior where appropriate, and no previous-session content.

### Tests for User Story 3

- [X] T022 [P] [US3] Add 401, 403, empty, error, retry, and stale-session lifecycle assertions in `src/pages/v2/my-clubs-data.test.js`
- [X] T023 [P] [US3] Add source assertions in `src/pages/v2/my-clubs-data.test.js` that `MyClubsPage.jsx` reuses `PageState` and new production files do not import `DemoContext`, `model`, fixture actors, or demo mutations

### Implementation for User Story 3

- [X] T024 [US3] Compose loading, empty, unauthorized, forbidden, and retryable-error views with `src/components/v2/PageState.jsx` in `src/pages/v2/my-clubs-page/MyClubsPage.jsx`; do not substitute demo data after a failure
- [X] T025 [US3] Ensure session/route unmount invalidates outstanding selection and application requests in `src/pages/v2/my-clubs-data.js`, and render a truthful post-withdraw conflict/current-state result in `src/pages/v2/my-clubs-page/MyClubsPage.jsx`
- [X] T026 [US3] Refine status and focus-visible presentation in `src/pages/v2/my-clubs-page/MyClubsPage.scss` for 1060px desktop accessibility without introducing horizontal overflow

**Checkpoint**: All required availability and privacy outcomes are independently verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify production migration quality and traceable UI handoff.

- [ ] T027 [P] Run and fix focused adapter/source coverage with `npm run test:demo` after adding `src/pages/v2/my-clubs-data.test.js`
- [X] T028 [P] Run and fix production/demo route coverage with `npm run test:demo:routes` after updating `src/pages/v2/V2App.jsx` and `scripts/demo-smoke.mjs`
- [X] T029 Run `npm run build` and resolve V2 route/style failures before review
- [ ] T030 Perform the acceptance walkthrough in `specs/004-my-club-selection/quickstart.md`, including direct navigation, keyboard traversal at 1060px, session changes, all availability states, and demo isolation
- [X] T031 Verify the backend contract comment on `FPTU-Xperience/fptu-xperience-clubhub-api#15` still matches `specs/004-my-club-selection/contracts/my-clubs-ui-contract.md`; record only UI-side traceability changes in the relevant UI issue/documentation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** has no dependencies.
- **Phase 2** depends on Phase 1 and blocks implementation work; backend contract availability remains an external release dependency, not a backend-source task here.
- **US1** depends on T004–T009.
- **US2** depends on T004–T006 and composes with US1 after T012–T015; it can be implemented against contract fixtures while API delivery is pending.
- **US3** depends on T004–T009 and is completed after the page composition in US1/US2 exists.
- **Polish** follows all desired stories.

### User Story Dependencies

```text
Foundation → US1 (MVP) → US2 → US3 → Polish
                 └──────→ UI-09 workspace migration remains external/downstream
CLBHB-BE-14/#15 → UI data release gate for US1 and US2
CLBHB-BE-12/#13 → server authorization prerequisite for workspace delivery
```

### Parallel Opportunities

- T002 and T003 may run in parallel during setup.
- T006 can proceed independently while T004/T005 are being developed; T007 and T008 use different files after API conventions are confirmed.
- Within US1, T010/T011 and T012/T013 are separate-file work; T014 follows T012/T013.
- Within US2, T016/T017 and T018/T019 are separate-file work; T020 integrates them.
- Within US3, T022/T023 are parallel; T024–T026 follow page composition.

## Implementation Strategy

### MVP First

1. Complete Phases 1–2 with contract-fixture adapter tests.
2. Complete US1 and validate direct production routing, privacy, and demo isolation.
3. Stop for review; it is a useful read-only selection MVP once the selection projection is available.

### Incremental Delivery

1. Add US2 to preserve activity/application context and self-withdrawal.
2. Add US3 to finish availability, error, and stale-session resilience.
3. Complete Phase 6 validation before handoff. Do not wait for or modify workspace/backend source as part of this UI feature.
