# Research: Production Application Header

## Decision: Keep the header inside the V2 production shell and extract a focused component

**Rationale**: `V2App` owns the production route boundary, skip link, account identity, and sign-out boundary. Composing dedicated `Header` and `Footer` components directly around its routed page content keeps the application layout explicit without introducing a page-specific shell or importing demo state.

**Alternatives considered**:

- Reuse `DemoApp`'s `Shell`: rejected because it depends on demo context, demo routes, UI-lab controls, and fixture notices.
- Build per-page headers: rejected because active navigation, session privacy, and accessibility would diverge across routes.
- Extend the legacy application header: rejected by the V2-first production boundary.

## Decision: Show only Discover and Clubs as primary production navigation

**Rationale**: The V2 production router currently provides `/v2` and `/v2/clubs`; the demo's activity, My Clubs, and profile destinations are retained only below `/v2/demo`. Presenting only existing authorized production routes avoids fake links and accidental migration of demo behavior.

**Alternatives considered**:

- Retain all demo header links: rejected because it would route production users to demo pages or unbuilt destinations.
- Hide all primary navigation: rejected because it loses a core part of the approved header and weakens cross-page navigation.

## Decision: Use the existing authenticated notification endpoint through a V2-local adapter

**Rationale**: The API service already offers an authenticated notification collection request. A V2-local adapter can map only required fields, normalize variable response envelopes, cap display at six items, classify errors, and reject stale results without importing the legacy notification provider, which is intentionally absent from the V2 application entry.

**Alternatives considered**:

- Import `NotificationContext`: rejected because V2 explicitly excludes legacy polling/provider composition and the context has a different lifecycle.
- Carry demo session notices into the header: rejected because fixtures are not truthful production data.
- Add a new backend endpoint: rejected because the existing notification collection can satisfy the bounded summary need; any missing display-safe field is documented as a contract dependency rather than guessed client-side.

## Decision: Fetch when the notification popover is opened and invalidate on session change or unmount

**Rationale**: On-demand retrieval avoids background polling in a shared shell, minimizes unnecessary personal-data handling, and gives the user fresh content at interaction time. A request gate keyed to the current session prevents an old request from populating a header after logout, user change, route replacement, or component unmount.

**Alternatives considered**:

- Poll globally: rejected because it adds lifecycle and privacy complexity outside the stated scope.
- Cache across users: rejected because it risks cross-session disclosure.
- Never refresh after an error: rejected because an explicit retry is required where meaningful.

## Decision: Copy the approved header visuals into component-owned V2 styles

**Rationale**: The Discover migration established the demo as the visual reference, but the shared production header is an independent component. Its brand, navigation, account, controls, and notification-popover styles are therefore owned by `Header.scss` with `v2-*` selectors. This preserves the approved appearance while preventing the production header from depending on the retained demo stylesheet's `dx-*` selectors.

**Alternatives considered**:

- Continue using `dx-*` classes from `demo.scss`: rejected because the migrated component must remain self-contained and independently maintainable.
- Redesign header styles: rejected by the approved visual-migration scope.
- Modify demo styles/components to serve production: rejected because production and demo must remain isolated.
