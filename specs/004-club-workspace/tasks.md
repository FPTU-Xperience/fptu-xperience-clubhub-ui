# Tasks: Production Club Workspace

**Input**: Design documents from `/specs/004-club-workspace/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/workspace-ui-contract.md

## Phase 1: Setup

- [X] T001 Record the production-workspace scope and V2 isolation in specs/004-club-workspace/spec.md
- [X] T002 Record the selection projection, authorization boundary, and deferred contracts in specs/004-club-workspace/contracts/workspace-ui-contract.md

## Phase 2: Foundational

- [X] T003 Add route-safe club ID decoding and selection resolution in src/pages/v2/workspace-data.js
- [X] T004 Add focused selection-resolution and demo-isolation checks in src/pages/v2/workspace-data.test.js

## Phase 3: User Story 1 - Open an authorized club workspace (Priority: P1)

**Goal**: Replace the production placeholder with a selection-backed workspace home.

**Independent Test**: A direct selected-club route resolves a workspace; another club route resolves to not-found.

- [X] T005 [US1] Implement the production workspace shell and selection-backed home in src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx
- [X] T006 [US1] Implement V2-local workspace layout, roles, summary, and activity styling in src/pages/v2/club-workspace-page/ClubWorkspacePage.scss
- [X] T007 [US1] Route /v2/my-clubs/:clubId/* to the production workspace in src/pages/v2/V2App.jsx

## Phase 4: User Story 2 - Understand unavailable operations (Priority: P2)

**Goal**: Make the workspace information architecture visible without pretending demo operations are live.

**Independent Test**: Each non-home navigation item renders an explicit unavailable state; manager-only items are absent for members.

- [X] T008 [US2] Add role-scoped workspace navigation and truthful unavailable panels in src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx

## Phase 5: User Story 3 - Recover from data states (Priority: P3)

**Goal**: Preserve explicit production request outcomes and recovery links.

**Independent Test**: Loading, API errors, empty selections, and missing route IDs produce distinct states without demo content.

- [X] T009 [US3] Connect request status, retry, and missing-club recovery to PageState in src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx
- [X] T010 [US3] Update the My Clubs route regression assertion in src/pages/v2/my-clubs-data.test.js

## Phase 6: Polish and validation

- [X] T011 Validate focused adapter tests and a production build using specs/004-club-workspace/quickstart.md
- [X] T012 Check whitespace and review the workspace diff with git diff --check
- [X] T013 Replace the shared workspace preview grid with tab-specific mock layouts in src/pages/v2/club-workspace-page/ClubWorkspacePage.jsx and src/pages/v2/club-workspace-page/ClubWorkspacePage.scss
- [X] T014 Split the tab-specific workspace views into src/pages/v2/club-workspace-page/tabs/ components

## Dependencies & Execution Order

- T001–T002 establish scope and contract before source changes.
- T003–T004 are the shared adapter foundation.
- T005–T007 deliver the MVP route and home.
- T008 and T009–T010 complete role visibility and failure states.
- T011–T012 validate all stories.

## Implementation Strategy

The MVP is User Story 1: an authorized visitor can open the correct production workspace. User Story 2 prevents the wider demo scope from leaking into production. User Story 3 ensures failure states remain truthful and retryable.
