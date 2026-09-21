# Feature Specification: Production Club Workspace

**Feature Branch**: `004-club-workspace`

**Created**: 2026-09-21

**Status**: Ready for implementation

**Input**: User description: "move the demo's club workspace into production ready code, following the migrated pattern"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open an authorized club workspace (Priority: P1)

An authenticated member or manager opens one of their clubs from “Câu lạc bộ của tôi” and sees a production workspace that identifies the club, their role, and the next authorized activity.

**Why this priority**: This replaces the dead-end production placeholder with the core destination behind the existing CTA.

**Independent Test**: Open a direct `/v2/my-clubs/{clubId}` URL using a selection response containing that club; verify the workspace renders only that response’s display-safe information.

**Acceptance Scenarios**:

1. **Given** an authorized member has a selected club, **When** they open its workspace URL, **Then** they see the club name, member role, current workspace navigation, and the next activity when available.
2. **Given** an authorized manager has a selected club with pending-application count, **When** they open its workspace URL, **Then** they see the manager role and the count only when the server supplied it.
3. **Given** the URL names a club absent from the authenticated selection, **When** the selection finishes loading, **Then** the user sees a not-found/unauthorized-safe state and a route back to their clubs.

---

### User Story 2 - Understand unavailable operations (Priority: P2)

An authorized workspace visitor can see which areas will be available, without being shown fake members, points, finances, or mutable demo controls.

**Why this priority**: The demo contains a broad workspace, but those operational data contracts are not yet available to production users.

**Independent Test**: Select any non-home workspace navigation item and verify it identifies the area as upcoming and offers no fabricated records or mutation affordances.

**Acceptance Scenarios**:

1. **Given** a workspace is loaded, **When** a user chooses an uncontracted section, **Then** the screen names that section and explains that its production data is being updated.
2. **Given** a member opens manager-only navigation, **When** the workspace renders, **Then** that navigation is not offered.

---

### User Story 3 - Recover from data states (Priority: P3)

An authenticated user receives clear loading, empty, expired-session, permission, missing-club, and retryable-error feedback while opening a workspace.

**Why this priority**: A production route must not use the demo’s synthetic state switcher or fall back to fixtures on failure.

**Independent Test**: Simulate each selection request outcome and confirm that the matching production state is shown with retry where applicable.

**Acceptance Scenarios**:

1. **Given** the selection request fails, **When** the user chooses retry, **Then** the workspace requests current data again without showing demo content.
2. **Given** the user has no club selections, **When** they open a workspace URL, **Then** they receive the same no-access outcome rather than another club’s information.

### Edge Cases

- A malformed or encoded club identifier is treated as unavailable unless it exactly matches an authorized selection identifier.
- A manager count that is absent, negative, or invalid is presented as updating, never as zero.
- The route must discard an earlier request result after the authenticated session changes or the route unmounts.
- The next activity is optional; no schedule is invented when the server does not supply one.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST replace the `/v2/my-clubs/:clubId` placeholder with a production workspace route.
- **FR-002**: The workspace MUST derive the accessible club only from the authenticated user’s club-selection response and MUST not import demo providers, actors, fixtures, or mutations.
- **FR-003**: The workspace MUST display only display-safe club name, optional logo, role, optional upcoming activity, and manager-only pending-application count from that response.
- **FR-004**: The workspace MUST distinguish member and manager navigation, including manager-only areas.
- **FR-005**: Each operational area without a production contract MUST use an explicit unavailable state and MUST not present fabricated records, counts, or write controls.
- **FR-006**: The workspace MUST provide loading, empty/no-access, unauthorized, forbidden, missing-club, and retryable-error states.
- **FR-007**: Workspace navigation and recovery links MUST remain within `/v2`; no production route may link to `/v2/demo`.
- **FR-008**: Direct workspace URLs MUST be guarded by the server-authorized selection result; client matching is a user-experience guard and not authorization.

### Key Entities *(include if feature involves data)*

- **Workspace selection**: A display-safe, current-user projection that identifies an accessible club, role, optional artwork, optional next activity, and manager-only pending count.
- **Club workspace**: The production view scoped to one authorized selection and one visitor role.
- **Workspace section**: A named area of the workspace; its production availability depends on an explicit data contract.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user with an authorized selection can reach the matching workspace from their club card or direct URL in at most one navigation action after sign-in.
- **SC-002**: In focused route tests, 100% of authorized, missing-club, loading, and failure scenarios show a distinct, truthful state without demo content.
- **SC-003**: A manager sees no more than the manager-only count returned for their selected club, and a member sees none.
- **SC-004**: Every visible workspace action stays within production routes and offers no synthetic data mutation.

## Assumptions

- The existing authenticated club-selection projection remains the MVP source for workspace identity and summary information.
- Detailed activities, attendance, members, points, rewards, finance, reports, settings, and write actions need separate server contracts and are intentionally not migrated as fixtures.
- Desktop layout follows the existing V2 baseline; responsive refinement is outside this migration unless required by existing shared styles.
