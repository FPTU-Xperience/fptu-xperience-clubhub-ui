# Tasks: Production Application Header

**Input**: Design documents from `/specs/002-header-production/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [notification-summary.md](./contracts/notification-summary.md), [quickstart.md](./quickstart.md)

**Tests**: Focused tests are included because this migration changes shared production UI, session-scoped data handling, routing, and availability states under Constitution Principle V.

**Organization**: Tasks are grouped by user story so each increment can be implemented, verified, and reviewed independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with tasks that do not modify the same file and whose prerequisites are complete.
- **[Story]**: Traceability to the feature specification's user stories.

## Phase 1: Setup

**Purpose**: Establish the V2-local boundary and the focused regression-test target.

- [x] T001 Create `src/pages/v2/header-data.test.js` with failing test cases for notification-summary mapping, envelope normalization, `401`/`403`/generic error classification, six-item display cap, and stale-request invalidation.
- [x] T002 [P] Review and preserve the V2 route/data boundaries in `src/pages/v2/V2App.jsx`, `src/components/v2/Header.jsx`, `src/context/AuthContext.jsx`, and `src/services/api.js`; record no source changes in these files until their story-specific tasks.

---

## Phase 2: Foundational

**Purpose**: Build the production-only data boundary that blocks notification behavior but does not import demo or legacy notification state.

**⚠️ CRITICAL**: Complete this phase before implementing User Story 2 notification behavior.

- [x] T003 Implement pure `mapHeaderNotification`, response-envelope normalization, newest-first bounded summary selection, and `classifyHeaderNotificationError` in `src/pages/v2/header-data.js`; expose only `id`, `title`, `message`, `createdAt`, and `isRead`, exclude entries without a stable id, and default missing `isRead` to `false`.
- [x] T004 Implement a V2-local, session-keyed notification request hook and request gate in `src/pages/v2/header-data.js`; fetch only on popover open/retry, expose `idle`, `loading`, `populated`, `empty`, `forbidden`, `unauthorized`, and `error`, and invalidate pending work on session change or unmount.
- [x] T005 Make `src/pages/v2/header-data.test.js` pass for T003–T004 without importing `DemoContext`, `NotificationContext`, demo models, or fixture data.

**Checkpoint**: The header has a tested, session-scoped, truthful notification-data boundary ready for UI consumption.

---

## Phase 3: User Story 1 - Navigate with the production header (Priority: P1) 🎯 MVP

**Goal**: Give every Discover-area production page the approved header hierarchy with safe brand and primary navigation to the currently available production destinations.

**Independent Test**: With an authenticated account, open `/v2`, `/v2/clubs`, and `/v2/clubs/:clubId`; use the brand and each visible primary link, confirm all destinations remain under `/v2`, active navigation updates, and no demo controls or demo routes appear.

### Tests for User Story 1

- [x] T006 [P] [US1] Extend `src/pages/v2/discover-data.test.js` with source-structure assertions that the production app composes the V2 `Header`, defines production navigation, retains `/v2/demo` isolation, and does not import demo state or create demo links.

### Implementation for User Story 1

- [x] T007 [US1] Create `src/components/v2/Header.jsx` with the demo-derived brand, campus context, and primary navigation; derive active state from the current route and make the brand return to `/v2`.
- [x] T008 [US1] Compose the production `Header`, routed page content, and `Footer` directly in `src/pages/v2/V2App.jsx`, continue passing the current authenticated user and sign-out callback, and preserve the `#v2-main` skip-link target.
- [x] T009 [US1] Add component-owned production-header styles to `src/components/v2/Header.scss` using `v2-*` selectors and the approved brand, navigation, campus, account, and active-tab visual language; do not depend on `dx-*` header selectors.
- [x] T010 [US1] Make `src/pages/v2/discover-data.test.js` pass for T006 and verify direct navigation still mounts the shared header on all current Discover-area routes.

**Checkpoint**: User Story 1 is independently deployable: a production-only header exposes the correct navigation and visual hierarchy without migrating demo behavior.

---

## Phase 4: User Story 2 - Understand account and notification status (Priority: P1)

**Goal**: Show display-safe current-account identity and an on-demand, server-backed notification popover with truthful availability states.

**Independent Test**: For authenticated accounts with notices, no notices, denied access, and a simulated retrieval failure, open the notification control and verify only current-session authorized content or the appropriate state appears; switch account or sign out and verify old content is cleared.

### Tests for User Story 2

- [x] T011 [P] [US2] Extend `src/pages/v2/header-data.test.js` with fixture-free cases for array/envelope responses, newest-first ordering, six-item cap, empty results, and request-gate rejection after a session-key change.
- [x] T012 [P] [US2] Extend `src/pages/v2/discover-data.test.js` with source-structure assertions that `Header` uses the V2-local header-data boundary and existing authenticated API service, never `NotificationContext`, `DemoContext`, fixture notices, or `/v2/demo` paths.

### Implementation for User Story 2

- [x] T013 [US2] Extend `src/components/v2/Header.jsx` to render display-safe account name, secondary identifier, and accessible avatar fallback from the current authenticated user without exposing other profile data.
- [x] T014 [US2] Extend `src/components/v2/Header.jsx` to open/close an on-demand notification popover using `src/pages/v2/header-data.js`, show an unread indicator only for current populated data, render at most six summaries, and provide distinct loading, empty, forbidden, unauthorized, and error-with-retry content.
- [x] T015 [US2] Add V2-scoped popover, state, unread-indicator, and account-fallback styles in `src/components/v2/Header.scss`; preserve the demo popover styles and prevent clipping at the 1060px desktop baseline.
- [ ] T016 [US2] Make `src/pages/v2/header-data.test.js` and `src/pages/v2/discover-data.test.js` pass for T011–T012; manually verify that a changed `user.id` or logout clears displayed notification data before another account can see it.

**Checkpoint**: User Story 2 is independently testable: identity and notification state are current-user scoped, authorized, bounded, and never fall back to demo content.

---

## Phase 5: User Story 3 - Use the header accessibly and reliably (Priority: P2)

**Goal**: Make every shared header control keyboard-operable, dismissible, and compatible with the established sign-out/session behavior.

**Independent Test**: At 1060px width, tab through all header controls, verify visible focus and labels, open/close notifications with keyboard and Escape, then sign out while it is open and verify private header content is removed.

### Tests for User Story 3

- [x] T017 [P] [US3] Extend `src/pages/v2/discover-data.test.js` with source-structure assertions for accessible notification-control label/state, keyboard dismissal handling, a popover close action, and the existing sign-out callback in `src/components/v2/Header.jsx`.

### Implementation for User Story 3

- [x] T018 [US3] Extend `src/components/v2/Header.jsx` with logical keyboard control order, visible-focus-compatible semantics, `aria-expanded`/popover relationship, Escape dismissal, explicit close control, and route-change dismissal while retaining the established sign-out callback.
- [x] T019 [US3] Add focus-visible, popover placement, and 1060px desktop resilience rules in `src/components/v2/Header.scss` so brand, navigation, account, bell, and sign-out controls remain visible and operable without horizontal scrolling.
- [ ] T020 [US3] Make `src/pages/v2/discover-data.test.js` pass for T017 and execute the keyboard/direct-navigation/sign-out walkthrough in `specs/002-header-production/quickstart.md`.

**Checkpoint**: All header user stories are independently functional, keyboard-operable, and resilient to session or route changes.

---

## Phase 6: Polish & Cross-Cutting Verification

**Purpose**: Validate integration boundaries, regression safety, and the production build.

- [x] T021 [P] Re-read `specs/002-header-production/contracts/notification-summary.md` against `src/pages/v2/header-data.js` and confirm the implementation maps only contract fields, does not implement read mutations, and treats server authorization as authoritative.
- [x] T022 Run `npm run test:demo` and resolve any production-boundary regression in `src/pages/v2/*.test.js` without changing retained demo behavior.
- [x] T023 Run `npm run test:demo:routes` and resolve any retained-demo route regression in `scripts/demo-smoke.mjs` or the relevant V2 route composition without exposing demo routes from production.
- [x] T024 Run `npm run build` and resolve build failures in the changed V2 header files; record any non-failing existing Vite advisory in the handoff.
- [ ] T025 Run the complete manual checklist in `specs/002-header-production/quickstart.md` at 1060px and with available notification-state fixtures; record results in the implementation handoff.
- [x] T026 Add a regression assertion in `src/pages/v2/discover-data.test.js` that `src/components/v2/Header.jsx` and `src/components/v2/Header.scss` remain free of `dx-*` header dependencies and keep the notification popover anchored beneath the header actions.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: T003 → T004 → T005. It blocks the notification portion of US2.
- **US1 (Phase 3)**: T006 can begin after setup; T007 → T008 → T009 → T010.
- **US2 (Phase 4)**: T011 and T012 can run after Phase 2; T013 → T014 → T015 → T016. It depends on the foundational data boundary and may be integrated after the US1 shell is available.
- **US3 (Phase 5)**: T017 can begin after the header exists; T018 → T019 → T020. It builds on US1/US2 controls but is independently verifiable.
- **Polish (Phase 6)**: Begins after desired user-story work completes; T021 can run alongside test/build tasks, while T025 follows all automated validation.

### User Story Dependencies

- **US1**: No dependency on notification behavior; it is the suggested MVP.
- **US2**: Depends on the shared header component from US1 and the V2-local request boundary from Phase 2.
- **US3**: Depends on the interactive header controls introduced by US1 and US2.

### Parallel Opportunities

- T001 and T002 can proceed in parallel.
- T006 may proceed while Phase 2 is implemented because it changes a different test file.
- After T005, T011 and T012 can run in parallel.
- T021 can run in parallel with T022–T024 once implementation is complete.

## Parallel Example: User Story 2

```text
Task: "Extend src/pages/v2/header-data.test.js with envelope, cap, ordering, and stale-session cases."
Task: "Extend src/pages/v2/discover-data.test.js with production-boundary source assertions."
```

## Implementation Strategy

### MVP First

1. Complete T001–T005 to establish the V2-local notification boundary.
2. Complete T006–T010 to ship the production visual/navigation header.
3. Validate US1 independently before adding notification behavior.

### Incremental Delivery

1. Add US1 for production navigation and visual consistency.
2. Add US2 for truthful account and notification status.
3. Add US3 for accessibility and session-resilience refinements.
4. Complete Phase 6 before review or handoff.
