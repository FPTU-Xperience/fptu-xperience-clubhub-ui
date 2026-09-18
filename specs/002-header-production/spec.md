# Feature Specification: Production Application Header

**Feature Branch**: `002-header-production`  
**Created**: 2026-09-17  
**Status**: Draft  
**Input**: User description: "migrate the demo UI's header into production ready code, just like the action with Discovery page"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigate with the production header (Priority: P1)

An authenticated ClubHub user sees the familiar demo-header visual hierarchy on production Discover-area pages and can use it to reach each production destination available to them.

**Why this priority**: The header is the primary, shared navigation surface. Migrating it makes the production area feel coherent while keeping the retained demo isolated.

**Independent Test**: Sign in, visit each current production Discover-area page, activate every visible main-navigation item and the brand, and verify that each destination opens while the authenticated session remains intact.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens a production Discover-area page, **When** the page is ready, **Then** they see the migrated ClubHub brand, primary navigation, campus context, and account area with the demo header's visual hierarchy but no UI-lab or demo controls.
2. **Given** a user is on a production Discover-area page, **When** they select the brand or a primary-navigation item, **Then** they reach its corresponding available production destination without being sent to a demo route.
3. **Given** the user is on one of the header's destinations, **When** the page is rendered, **Then** the header clearly identifies the active destination.
4. **Given** a production destination is not available to the user, **When** the header is rendered, **Then** it is not presented as a working navigation option.

---

### User Story 2 - Understand account and notification status (Priority: P1)

An authenticated user can identify their active account and safely inspect the current notification status from the shared header.

**Why this priority**: The demo header includes account and notification affordances; production must make those surfaces truthful rather than carrying fixture people or local-session notices.

**Independent Test**: Use accounts with and without an avatar or notifications, open and close the notification surface, and confirm that shown identity and notices belong only to the signed-in user.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens a production Discover-area page, **When** the header loads, **Then** it displays the user’s available name, email or equivalent account identifier, and avatar or an accessible fallback.
2. **Given** the user selects the notification control, **When** notification information is available, **Then** they see only their authorized recent notifications and can dismiss the surface without changing page context.
3. **Given** there are no authorized notifications, **When** the user opens the notification control, **Then** they see a clear empty message rather than demo content.
4. **Given** notification information is loading, unavailable, forbidden, or cannot be retrieved, **When** the user opens the notification control, **Then** they see a distinct truthful status and no stale or fixture notices.

---

### User Story 3 - Use the header accessibly and reliably (Priority: P2)

An authenticated user can operate header controls with keyboard or assistive technology and can sign out using the existing application behavior.

**Why this priority**: A shared header amplifies any accessibility or session-continuity failure across every migrated production page.

**Independent Test**: At the supported desktop width, navigate through the header using keyboard only; verify visible focus, meaningful labels, open/close behavior, and sign-out handling.

**Acceptance Scenarios**:

1. **Given** a keyboard user enters the header, **When** they tab through its interactive elements, **Then** controls have a logical order, visible focus, and understandable accessible names.
2. **Given** a user opens the notification surface, **When** they press Escape, activate its close action, or navigate away, **Then** it closes and does not obscure the destination content.
3. **Given** a signed-in user chooses sign out, **When** sign-out completes, **Then** the established sign-in handling is used and private account or notification information is no longer visible.

### Edge Cases

- A user whose name, email, or avatar is unavailable sees a safe, accessible fallback without a blank or broken account area.
- A user changes account or their session expires while a notification surface is open; previously displayed identity and notices are cleared rather than retained.
- A notification request is slow, fails, or is forbidden; the header remains usable and does not block page navigation.
- A user directly opens any supported production Discover-area URL; the same header and valid active-navigation state are presented after access is evaluated.
- At the documented 1060-pixel desktop baseline, brand, primary navigation, account controls, and notification control remain visible and operable without horizontal clipping.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide one shared production header for the production Discover-area routes, preserving the approved demo header's brand, navigation, campus, notification, and account visual hierarchy.
- **FR-002**: The production header MUST be mounted only by production routes under `/v2`; the retained demo header and all demo controls, demo actors, fixture notices, and demo-only routes MUST remain isolated under `/v2/demo`.
- **FR-003**: The header MUST provide the brand destination and only primary-navigation destinations that are currently available and authorized in production.
- **FR-004**: The header MUST visibly identify the active primary destination and retain the user's authenticated application context while navigating between header destinations.
- **FR-005**: The account area MUST show only the current authenticated user's permitted identity information, using a clear accessible fallback when optional profile data is absent.
- **FR-006**: The notification control MUST display only notification information authorized for the current user and session, including a distinct empty state when none is available.
- **FR-007**: The notification control MUST present distinct loading, unavailable, forbidden, and error states, and MUST NOT substitute demo or stale notification content for a production failure.
- **FR-008**: Changing the signed-in user, ending a session, or navigating to a different authorized context MUST clear any prior user's account and notification information from the header.
- **FR-009**: Header controls MUST be keyboard-operable, expose meaningful accessible labels and state, and allow an open notification surface to be dismissed without losing page context.
- **FR-010**: The sign-out action in the header MUST use the application's established sign-out flow and remove private header information when the session ends.
- **FR-011**: At desktop widths of 1060 pixels and above, all primary header controls MUST be visible and operable without horizontal scrolling or clipping.
- **FR-012**: The migration MUST preserve the production Discover experience and existing authorization boundaries; it MUST NOT add demo business behavior or claim access to production destinations, notifications, or profile information that the server does not authorize.

### Key Entities *(include if feature involves data)*

- **Header navigation item**: A labeled production destination that is available and authorized for the current user, with an active state when it matches the current location.
- **Authenticated header identity**: The minimal display-safe account information for the current signed-in user, such as name, account identifier, and optional avatar.
- **Notification summary**: A current-user-authorized update suitable for the header, with enough information to communicate the update without exposing unrelated club or user data.
- **Header availability state**: The loading, populated, empty, unavailable, forbidden, or error condition for account- or notification-related information.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In route acceptance testing, 100% of visible production header destinations open their intended production pages and retain the authenticated session.
- **SC-002**: In acceptance testing, 100% of account and notification scenarios show only the current user's authorized information, with no demo actor, fixture notice, or previous-session content.
- **SC-003**: In supported desktop viewports from 1060 pixels wide upward, 100% of header controls are visible and operable without horizontal scrolling.
- **SC-004**: In keyboard acceptance testing, 100% of interactive header controls can be reached, identified, activated, and—where applicable—dismissed without a pointer device.
- **SC-005**: In availability-state testing, 100% of loading, empty, unavailable, forbidden, and error notification scenarios provide a distinct understandable outcome while page navigation remains usable.

## Assumptions

- The demo header and the production Discover migration are the approved visual reference; this work preserves their shared visual language rather than redesigning the header.
- The production header initially exposes only production destinations that already exist and that the current user may access; retained demo-only destinations are not represented as production links.
- Existing authentication and sign-out behavior remain authoritative. Client-side header visibility improves usability but does not grant access.
- A production notification contract will provide only current-user-authorized display data before notification content is enabled; until it is available, the header must present an explicit unavailable state rather than demo notices.
- The feature is scoped to the shared production Discover-area header at the documented desktop baseline. New destination pages, profile editing, notification management, and changes to demo routes are outside scope.
- Production work remains within the V2 production boundary and must not import demo state, models, or fixture mutation behavior.

## Dependencies

- The established `/v2` production routing and authenticated session behavior delivered by the Discover migration.
- The approved demo header and UI handoff as the visual reference.
- An agreed, server-authoritative contract for any enabled notification data and for the display-safe authenticated identity fields.
- Existing authorization rules for routes and notification visibility.
