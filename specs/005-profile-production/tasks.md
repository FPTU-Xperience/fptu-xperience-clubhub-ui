---

description: "Dependency-ordered implementation tasks for the V2 production profile migration"
---

# Tasks: Migrate Production Profile

**Input**: Design documents from `/specs/005-profile-production/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/profile-service.md](./contracts/profile-service.md), [quickstart.md](./quickstart.md)

**Tests**: Focused data-layer tests are required by the plan and constitution verification gate. Browser checks, route smoke, and build validation are captured in the final phase.

**Organization**: Tasks are grouped by user story so each increment can be reviewed and validated independently after its listed dependencies are complete.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel with other tasks in the same phase that touch different files.
- **[Story]**: Links a task to US1, US2, or US3 from the specification.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish the production-owned profile file boundaries without bringing demo code into the V2 path.

- [X] T001 Create the production profile page and owner stylesheet boundaries at `src/pages/v2/profile-page/ProfilePage.jsx` and `src/pages/v2/profile-page/ProfilePage.scss`; do not import `DemoContext`, `model`, `ui`, `demo.scss`, demo actors, or `/v2/demo` modules.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Build and verify the account-scoped temporary profile repository that every story consumes.

**⚠️ CRITICAL**: Complete this phase before building the page interactions; it defines the only mock-data boundary and prevents cross-account leakage.

- [X] T002 Create failing repository tests in `src/pages/v2/profile-data.test.js` for authenticated key selection, no anonymous key, per-account isolation, deterministic seed, corrupt/version-invalid storage recovery, and cloned normalized snapshots using injected in-memory storage.
- [X] T003 Implement the mock-only repository in `src/pages/v2/profile-data.js`: versioned key `clubhub:v2:profile:<accountKey>`, account-scoped seed, normalized profile snapshot, local load/retry hook with a session-aware stale-request gate, and `loading`, `populated`, `empty`, `forbidden`, `unauthorized`, and `error` states; do not call `src/services/api.js`.
- [X] T004 Run `node --test src/pages/v2/profile-data.test.js` after T002–T003 and correct `src/pages/v2/profile-data.js` until the foundational repository tests pass.

**Checkpoint**: The production mock-service boundary is independent of demo state, scoped to the authenticated account, and ready for page consumption.

---

## Phase 3: User Story 1 - View my production profile (Priority: P1) 🎯 MVP

**Goal**: An authenticated student can directly open `/v2/profile` or select Hồ sơ from the V2 account menu and view the reference profile hierarchy using V2-local mock data.

**Independent Test**: With an authenticated account, open `/v2/profile` directly and through the existing account-menu link; confirm the V2 frame, account-scoped profile data, loading/empty/error state behavior, and no demo imports or demo data.

### Tests for User Story 1

- [X] T005 [P] [US1] Extend `src/pages/v2/profile-data.test.js` with representative profile snapshot mapping tests for display-safe avatar/initial fallback, approved club participation, term-filtered evidence, summary counts, and no mutation of the authenticated identity input.

### Implementation for User Story 1

- [X] T006 [US1] Implement the read-only production profile composition in `src/pages/v2/profile-page/ProfilePage.jsx` using `useProfile`/equivalent from `src/pages/v2/profile-data.js` and `src/components/v2/PageState.jsx`; render the reference's Vietnamese cover, identity, academic/sidebar details, skills, club list, overview/evidence tabs, term filter, summary cards, and accessible six-pillar visualization.
- [X] T007 [P] [US1] Translate the reference visual hierarchy into `src/pages/v2/profile-page/ProfilePage.scss` with `v2-profile*` owner selectors, V2 orange/ink/muted/line tokens, editorial cover, 288px desktop sidebar, selected-tab treatment, and narrower-width stacking; do not add profile rules to `src/pages/v2/demo.scss`.
- [X] T008 [US1] Add the authenticated `profile` route and page import in `src/pages/v2/V2App.jsx`, passing the current authenticated user and session key while preserving `/v2/demo/*`, account-menu behavior, and the two-item personal navigation.
- [X] T009 [US1] Perform the direct-route and account-menu acceptance checks in `specs/005-profile-production/quickstart.md` for `src/pages/v2/V2App.jsx` and `src/pages/v2/profile-page/ProfilePage.jsx`, including loading, empty, forbidden, unauthorized, and error state rendering.

**Checkpoint**: `/v2/profile` is a standalone, read-only, V2 production route that preserves the reference hierarchy without depending on demo state.

---

## Phase 4: User Story 2 - Preview privacy-safe shared profile (Priority: P2)

**Goal**: The signed-in student can toggle a local shared-profile preview that makes privacy boundaries visible without publishing any data.

**Independent Test**: Load a profile with a student code, contribution total, evidence, and points; toggle shared preview and verify all private fields disappear, then toggle back and verify the stored profile is unchanged.

### Tests for User Story 2

- [X] T010 [US2] Add privacy-projection tests in `src/pages/v2/profile-data.test.js` that verify shared preview removes `academic.studentCode`, `summary.recognizedContributionTotal`, evidence history, and point detail without persisting a publication or visibility change.

### Implementation for User Story 2

- [X] T011 [US2] Add a local-only privacy projection/helper to `src/pages/v2/profile-data.js` that returns a display-safe shared view and leaves the private normalized snapshot and persisted mock record unchanged.
- [X] T012 [US2] Add the shared-preview toggle, Vietnamese privacy banner, and safe private/shared rendering to `src/pages/v2/profile-page/ProfilePage.jsx`; ensure preview is off initially and creates neither a share link nor a network request.
- [X] T013 [US2] Add the preview-banner and private-field hiding treatments in `src/pages/v2/profile-page/ProfilePage.scss`, including visible focus states for the toggle.

**Checkpoint**: Shared preview is independently usable, privacy-safe, reversible, and does not mutate or publish the profile.

---

## Phase 5: User Story 3 - Update self-managed profile details (Priority: P3)

**Goal**: The signed-in student can update self-managed presentation details in an accessible V2 dialog, with mock changes retained after reload only for the same authenticated account.

**Independent Test**: Save valid permitted fields, reload on the same device, and confirm the change persists only for that account; submit invalid input and confirm the draft/error remain while the last saved profile stays unchanged.

### Tests for User Story 3

- [X] T014 [US3] Add save and validation tests in `src/pages/v2/profile-data.test.js` for a non-empty `displayName`, permitted fields only (`displayName`, `headline`, `about`, `skills`, `interests`), trimmed/de-duplicated bounded skills, same-account reload persistence, rejected protected-field patches, and preservation of the prior record on validation/persistence failure.

### Implementation for User Story 3

- [X] T015 [US3] Implement sanitized editable-patch validation and save behavior in `src/pages/v2/profile-data.js`; keep `AuthContext.user` identity, email, roles, avatar source, academic data, participation, summary, and evidence immutable, and return a fresh normalized snapshot after successful local persistence.
- [X] T016 [US3] Implement the edit flow in `src/pages/v2/profile-page/ProfilePage.jsx` using `src/components/v2/common/modal/V2Modal.jsx`: editable presentation fields only, inline validation/error feedback, retained draft on failure, refresh after save, and no direct `AuthContext.updateProfile` call.
- [X] T017 [US3] Style the profile edit form and save/error feedback in `src/pages/v2/profile-page/ProfilePage.scss` without replacing the shared `V2Modal` focus, Escape, backdrop-close, or focus-restoration behavior.
- [X] T018 [US3] Perform the edit/save/reload/account-isolation and keyboard-modal checks in `specs/005-profile-production/quickstart.md` against `src/pages/v2/profile-page/ProfilePage.jsx` and `src/pages/v2/profile-data.js`.

**Checkpoint**: Permitted mock profile edits are account-isolated and reload-persistent, while protected information remains read-only.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify migration isolation, visual parity, accessibility, and build integrity across all stories.

- [X] T019 [P] Add production-isolation regression assertions in `src/pages/v2/profile-data.test.js` or an appropriate V2 source-inspection test that `src/pages/v2/profile-page/ProfilePage.jsx` and `src/pages/v2/profile-data.js` do not import demo context, demo model/UI helpers, `/v2/demo`, or `src/pages/v2/demo.scss`.
- [X] T020 [P] Review `src/pages/v2/profile-page/ProfilePage.scss` against the profile references in `origin/UI-TO-PRODUCT:src/features/profile/ProfilePage.jsx` and `src/pages/v2/demo.scss`, preserving requested Vietnamese hierarchy and visual tokens while retaining V2 ownership.
- [X] T021 Run focused tests, route smoke, and build from `specs/005-profile-production/quickstart.md`: `node --test src/pages/v2/profile-data.test.js`, `npm run test:demo:routes`, and `npm run build`; record any existing unrelated failure separately.
- [X] T022 Perform final accessibility and responsive acceptance checks from `specs/005-profile-production/quickstart.md` for `src/pages/v2/profile-page/ProfilePage.jsx`, including direct refresh, account change, preview privacy, dialog keyboard behavior, and narrower-width layout.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: Can start immediately.
- **Phase 2**: Depends on T001 and blocks all user-story implementation.
- **US1 (Phase 3)**: Depends on T002–T004; establishes the MVP route and base page.
- **US2 (Phase 4)**: Depends on US1's loaded profile view (T006–T009); its data projection and styling can begin in parallel after the US1 snapshot shape is stable.
- **US3 (Phase 5)**: Depends on US1's loaded profile view and the foundational repository; it does not depend on shared preview behavior.
- **Polish (Phase 6)**: Depends on all desired user-story work.

### User Story Completion Order

```text
Setup (T001)
  └── Foundation (T002–T004)
        └── US1: View profile (T005–T009)  ← MVP
              ├── US2: Shared preview (T010–T013)
              └── US3: Edit profile (T014–T018)
                    └── Polish (T019–T022)
```

### Parallel Opportunities

- T005 and T007 can proceed in parallel once T003 has established the normalized snapshot and before T006 integration completes.
- After US1, implementation work T011–T013 and T015–T017 touches shared profile files and should be coordinated sequentially; the two stories may be split only after a clear file-ownership handoff.
- T019 and T020 can run in parallel; T021 and T022 follow the completed implementation.

## Parallel Example: User Story 1

```text
After T003 establishes the profile snapshot contract:

Task: "T005 Add profile snapshot mapping tests in src/pages/v2/profile-data.test.js"
Task: "T007 Translate profile visual hierarchy in src/pages/v2/profile-page/ProfilePage.scss"

Then complete T006 and T008 before the direct-route acceptance task T009.
```

## Implementation Strategy

### MVP First (US1)

1. Complete T001–T004 to establish the mock repository and its account boundary.
2. Complete T005–T009 to ship the direct, read-only V2 profile route.
3. Stop and validate US1 before adding preview or editing.

### Incremental Delivery

1. US1 delivers the production profile frame and read-only data hierarchy.
2. US2 adds an entirely local privacy-safe preview without expanding API scope.
3. US3 adds saved presentation edits within the same repository contract.
4. Phase 6 validates full behavior and confirms V2/demo isolation.

## Notes

- Every task follows the required checkbox, sequential-ID, story-label, and exact-file-path format.
- The temporary repository is intentional for this feature; do not add profile endpoints to `src/services/api.js` until the future API contract is authorized.
- Do not change the `Của tôi` navigation scope while adding the account-menu Profile destination.
