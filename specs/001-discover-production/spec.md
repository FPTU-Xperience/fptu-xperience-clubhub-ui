# Feature Specification: Production Discover Experience

**Feature Branch**: `004-discover-production`  
**Created**: 2026-09-17  
**Status**: Draft  
**Input**: User description: "Follow GitHub issue #4, using the current codebase and FPTU Xperience documentation."

## Clarifications

### Session 2026-09-17

- Q: Before RE-39 is available, what should Recommended Clubs show to users? → A: Show a non-personalized curated set of clubs, clearly labeled as such.
- Q: Should Discover be a distinct landing page while All Clubs is a dedicated directory destination? → A: Yes. Discover shows only suggested clubs; `/v2/clubs` is the independent complete directory.
- Q: When a user selects a club card from Discover, All Clubs, or Recommended Clubs, where should they go? → A: Open the existing club page for that club.
- Q: If the backend does not provide a trustworthy recruitment status by implementation time, how should All Clubs handle the recruiting-only filter? → A: Disable the recruiting-only filter with an availability-pending explanation.
- Q: Should issue #4 also port the demo club-detail page into production, so Discover cards open a detail route? → A: Yes; create the page under `src/pages/v2` and its reusable components under `src/components/v2`.
- Q: Should the new production Discover experience replace the current `/v2/*` demo entry point, or use a separate production route under `/v2`? → A: Keep the demo at `/v2/demo`; use `/v2` for incoming production migrations.
- Q: Does "migration" permit a redesigned production Discover page? → A: No. Preserve the demo Discover page's complete layout and visual structure exactly, then split that implementation into maintainable V2 page/component modules and replace fixture behavior with production data.
- Q: What is the final Discover/directory structure? → A: Remove the left rail. Discover shows at most 24 suggested clubs over at most four six-card pages with category filtering and no recruiting filter. Clubs shows every club, twelve per page, with all filters. Club details remain independent routes opened from cards.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Discover clubs (Priority: P1)

An authenticated user enters the ClubHub Discover landing page and finds communities through the complete migrated demo layout; the same page contains the searchable club directory.

**Why this priority**: Discover is the entry point for students to find a community and is the core outcome of issue #4.

**Independent Test**: With a catalogue containing clubs in multiple categories and recruitment states, a signed-in user can reach Discover, open a displayed club’s production detail page or continue to All Clubs, apply a search and filters there, and remain in their authenticated session.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens Discover, **When** club data is available, **Then** they see the demo Discover layout and visual hierarchy intact—including its hero, discovery strip, filters, club grid, and bottom callout—with production data.
2. **Given** a user selects a club card from a Discover-area page, **When** the club is available, **Then** they are taken to that club’s production detail page.
3. **Given** an authenticated user opens `/v2/clubs`, **When** club data is available, **Then** the independent Clubs page shows the complete directory with search, category, recruiting filter, club cards, and twelve-card pagination.
4. **Given** clubs from multiple categories are available, **When** a user selects a category in All Clubs, **Then** only clubs in that category are displayed.
5. **Given** the directory contains recruiting and non-recruiting clubs, **When** a user enables the recruiting filter in All Clubs, **Then** only recruiting clubs are displayed.
6. **Given** a user enters a matching search term in All Clubs, **When** the search is applied, **Then** matching clubs remain visible and non-matching clubs do not.
7. **Given** the directory does not provide trustworthy recruitment status, **When** a user views All Clubs, **Then** the recruiting-only control is disabled with an explanation that the filter is not yet available.

---

### User Story 2 - Navigate the student club area (Priority: P1)

An authenticated user moves between the Discover landing, independent Clubs directory, and club details using page actions and club cards without losing context.

**Why this priority**: Issue #4 explicitly requires the shared navigation and reliable access to both directory views.

**Independent Test**: A signed-in user can use each navigation item and arrive at the intended page while remaining signed in and able to access the rest of the authorized application.

**Acceptance Scenarios**:

1. **Given** an authenticated user is on Discover, **When** they select the bottom All Clubs action, **Then** they navigate to `/v2/clubs`.
2. **Given** an authenticated user selects a club card, **When** navigation completes, **Then** they reach the independent `/v2/clubs/:clubId` detail page.
3. **Given** an authenticated user uses Discover-area navigation, **When** they change pages, **Then** their authenticated application context is retained.
4. **Given** a visitor without an authenticated session requests a Discover-area URL, **When** access is evaluated, **Then** they receive the application’s established sign-in handling and do not receive protected user context.

---

### User Story 3 - Understand unavailable results (Priority: P2)

An authenticated user receives a clear, actionable state when club data is loading, no clubs match, access is forbidden, or data cannot be retrieved.

**Why this priority**: The production experience must replace demo-only behavior with truthful states rather than blank pages or fixture fallbacks.

**Independent Test**: Simulate each availability condition and verify that the user sees the corresponding state and can recover where a retry is appropriate.

**Acceptance Scenarios**:

1. **Given** club data is being retrieved, **When** the user visits a directory page, **Then** a loading state is shown until a final state replaces it.
2. **Given** a valid search or filter produces no clubs, **When** results are displayed, **Then** the user sees an empty state that explains no matching clubs were found and can clear or change the filters.
3. **Given** the user is not permitted to view a requested Discover-area resource, **When** access is denied, **Then** they see a clear forbidden state without unrelated club information.
4. **Given** club data cannot be retrieved, **When** the request fails, **Then** the user sees an error state with a retry action; retrying must not substitute demo content.

---

### User Story 4 - Receive recommendations without a redesign (Priority: P3)

An authenticated user sees a bounded suggested-club collection on Discover whose card region can receive personalized recommendations when the capability becomes available.

**Why this priority**: This preserves the dependency boundary requested by RE-39 while allowing the Discover work to ship first.

**Independent Test**: Suggested mode can show a clearly labeled, non-personalized curated set now and later display personalized recommendations in the same directory without restructuring Discover.

**Acceptance Scenarios**:

1. **Given** personalized recommendations are not yet available, **When** a user opens Recommended Clubs, **Then** they see a clearly labeled, non-personalized curated set of clubs rather than simulated personalized recommendations.
2. **Given** personalized recommendation cards become available, **When** they are shown, **Then** they use the established recommendation-card region without changing the page’s navigation or primary layout.

### Edge Cases

- A search term and multiple filters that produce no match show an actionable empty state and do not hide the filter controls.
- Changing a filter while a previous data request is unresolved must not show stale results for the prior filter selection.
- A club returned without optional imagery, schedule, or recruitment information remains understandable and does not break the directory layout.
- Recruitment status is never inferred from active status, membership count, or other unrelated club information.
- A user who can use the application but lacks Discover-area access is shown a forbidden state, while an expired session follows the established sign-in flow.
- Recommendation data that is temporarily unavailable does not prevent access to All Clubs or the rest of the authenticated application.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST provide an authenticated Discover landing page without a left rail, preserving the demo hero, discovery strip, suggested club grid, and bottom callout.
- **FR-001a**: The production Discover migration MUST use `/v2` as its entry point, while the existing demo remains available under `/v2/demo` and is not mounted by production routes.
- **FR-002**: Discover MUST show at most 24 suggested clubs, paginate them six per page for a maximum of four pages, allow category/search filtering, and omit the recruiting-only filter.
- **FR-003**: The system MUST retain the user’s authenticated application context while they navigate among Discover-area destinations.
- **FR-004**: The independent `/v2/clubs` page MUST present the complete directory using cards that communicate each club’s available identity, category, description, schedule, recruitment status, and production detail route.
- **FR-004a**: The system MUST provide a production, read-only club-detail page for each displayed club, using publicly permitted club information and a route from Discover-area club cards.
- **FR-005**: The Clubs page MUST let users search by available club-identifying text, filter by category and recruiting status, and paginate filtered results at exactly twelve clubs per page.
- **FR-005a**: When trustworthy recruitment status is unavailable from the directory source, the recruiting-only filter MUST be disabled with a clear availability-pending explanation; the system MUST NOT infer recruitment status.
- **FR-006**: The system MUST apply search and filter criteria together and reflect the resulting club count or an empty result state.
- **FR-007**: Discover, Clubs, and club detail MUST provide distinct loading, empty, forbidden, and error states appropriate to their data and access condition.
- **FR-008**: The error state MUST offer a retry action when retrying is meaningful, and the system MUST never replace failed production data with demo fixtures.
- **FR-009**: The production Discover area MUST obtain its club, membership-context, and recommendation-facing data from production-compatible data sources; it MUST NOT depend on demo providers, demo actors, in-memory fixture state, or demo-only mutation behavior.
- **FR-010**: The system MUST preserve existing authorized application areas and their access rules; adding Discover MUST NOT replace the application shell or remove existing role-specific pages.
- **FR-011**: The system MUST prevent stale results from a previous directory or recommendation request from appearing as the current page’s data after the user changes destination, filters, or session context.
- **FR-012**: Discover's suggested collection MUST use the common card presentation and remain replaceable by personalized recommendations without restructuring the independent Clubs page.
- **FR-013**: Club information displayed in Discover-area pages MUST be limited to information the current user is permitted to view.
- **FR-014**: The Discover area MUST remain usable at the documented desktop minimum viewport of 1060 pixels without horizontal clipping of primary navigation, filters, or club cards.

### Key Entities _(include if feature involves data)_

- **Club directory entry**: Publicly displayable club information: stable identifier, name, visual identity, description, category, schedule, recruitment status, and available destination.
- **Directory criteria**: A user-selected directory mode, search term, category, recruitment-only preference, and page that define the current result set.
- **Discover access context**: The current signed-in user’s session and permitted club-related context, used to retain authenticated navigation and determine what can be shown.
- **Recommendation entry**: A club proposed to the current user, with enough public club information to render a card and an optional explanation when supplied by the recommendation capability.
- **Page availability state**: The current loading, populated, empty, forbidden, or error condition for a Discover-area page.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: In usability validation, at least 90% of authenticated participants can find and open a club matching a stated interest using All Clubs within 60 seconds.
- **SC-002**: In supported desktop viewports from 1060 pixels wide upward, 100% of primary Discover, All Clubs, and Recommended Clubs navigation items, filters, and primary card actions are visible and operable without horizontal scrolling.
- **SC-003**: In acceptance testing, 100% of loading, empty, forbidden, and error scenarios show a distinct, understandable page state with no demo club or demo-user content.
- **SC-004**: In route acceptance testing, navigation among Discover, Clubs, and club detail retains the authenticated session.
- **SC-005**: Once recommendation data is supplied, a recommendation card can be displayed on Discover without changes to the Clubs page structure.

## Assumptions

- This feature targets the desktop/laptop experience only, with a minimum supported width of 1060 pixels, as documented in the UI handoff.
- Existing authentication and authorization remain authoritative; unauthenticated and expired-session handling follows the current application convention.
- The current club service or a backend contract agreed during planning will provide the public directory information required by the cards. The exact service contract is outside this feature specification.
- The recruiting-only filter becomes operable only when the directory contract supplies trustworthy recruitment status; otherwise it is visibly unavailable.
- Recommended Clubs initially shows a clearly labeled, non-personalized curated set because RE-39 is a dependency; the page retains a stable card region for personalized recommendations.
- Joining, My Clubs, events, and internal club workspace behavior are outside this issue. The production club-detail page is limited to public club information and does not include demo mutations.
- Production work for this feature is located under `src/pages/v2` and `src/components/v2`; legacy pages are not changed unless explicitly authorized.
- The `/v2` route prefix is reserved for incoming production migrations, and the retained UI reference demo is isolated under `/v2/demo`.
- The approved UI-DESIGN demo and the 16 September 2026 UI handoff are the visual and behavior reference; production must not carry its UI lab, demo actor switcher, or fixture fallback.

## Dependencies

- UI-DESIGN reference implementation and the documented UI handoff.
- RE-39 for personalized recommendation content.
- RE-43 for related club discovery data or behavior, as identified by the issue.
- A verified production club-data and authorization contract before production wiring is completed.
