# Research: Migrate Production Profile

## Decision: Translate the reference rather than transplant its implementation

**Decision**: Use `origin/UI-TO-PRODUCT:src/features/profile/ProfilePage.jsx` and the existing `/v2/demo/profile` screen only as visual/interaction references. Build new V2-owned page code.

**Rationale**: The source variants rely on demo context, demo model helpers, demo UI primitives, or an older context architecture. Current V2 production already has an authenticated shell, a left rail, shared state presentation, and an accessible modal. A direct transplant would couple `/v2/profile` to demo state and bypass current ownership patterns.

**Alternatives considered**:

- Cherry-pick the older feature branch: rejected because it carries incompatible context and component architecture.
- Render the demo route from production: rejected because it exposes demo actors, fixtures, and in-memory mutations.

## Decision: Own the route in the authenticated V2 router

**Decision**: Add the production `profile` child route to `src/pages/v2/V2App.jsx` and pass the current user/session key to the page. Keep the existing account-menu link to `/v2/profile`; do not add Profile to the personal-navigation group.

**Rationale**: The left-rail account menu already points to `/v2/profile`, but no authenticated route currently serves it. The personal group is intentionally limited to Câu lạc bộ and Lịch trình. Direct routes must resolve from the current session, not navigation state.

**Alternatives considered**:

- Add the page below `/v2/demo`: rejected because it is not production navigation.
- Add Profile to `Của tôi`: rejected because it changes the accepted navigation scope.

## Decision: Use a V2-local temporary profile repository

**Decision**: Create `src/pages/v2/profile-data.js` as the sole temporary profile-data boundary. It seeds representative mock data from the authenticated identity, normalizes returned records, validates an editable patch, and persists permitted changes in versioned local storage by account key. It does not call `api.js` during this migration.

**Rationale**: This follows the tested V2 onboarding persistence pattern and keeps all mock behavior replaceable behind a single contract. It also prevents a second signed-in account on the same device from seeing the first account's mock changes.

**Alternatives considered**:

- Keep profile state in component hooks: rejected because it cannot survive refresh and is difficult to replace with an API.
- Write directly through `AuthContext.updateProfile`: rejected because it mutates broad authentication state and is not a profile-service contract.
- Reuse demo fixtures: rejected because it violates demo isolation.

## Decision: Separate authenticated identity from editable presentation name

**Decision**: Keep `AuthContext.user.name`, ID, email, roles, and avatar source immutable for this feature. The editable name field is represented as a profile-owned `displayName`, seeded from the authenticated name and stored only in the temporary profile repository.

**Rationale**: The specification requires identity data to remain authoritative while allowing the reference page's name-edit interaction. Treating the editable value as presentation data avoids changing account identity or authentication storage. A real legal/account-name change requires a separate future account API decision.

**Alternatives considered**:

- Persist the edit to the auth user: rejected because it silently changes shared session identity.
- Remove name from the edit dialog: rejected because it loses a reference interaction without a necessary security gain for the temporary profile.

## Decision: Translate styles into the V2 profile owner stylesheet

**Decision**: Implement profile-specific `v2-profile*` selectors in `profile-page/ProfilePage.scss`, using V2 color and button tokens. Retain the reference cover geometry, identity layout, 288px desktop sidebar, selected tab treatment, privacy banner, stats, radar fallback, and responsive stacking.

**Rationale**: The reference's distinctive editorial hierarchy is an acceptance requirement, while `demo.scss` must remain isolated from production. V2App already supplies orange, ink, muted, and line tokens plus shared button behavior.

**Alternatives considered**:

- Import global `demo.scss`: rejected because it creates cross-route style ownership and demo coupling.
- Approximate the content with generic cards: rejected because it loses demo parity.

## Decision: Reuse V2 interaction and state primitives

**Decision**: Render repository states with `PageState` and edit with `V2Modal`; keep preview state local to the page and make radar semantics accessible through text/ARIA labeling.

**Rationale**: `PageState` already provides consistent loading/error/access states. `V2Modal` already handles Escape, backdrop close, focus trap, and focus restoration. Reusing them preserves established accessibility behavior.

**Alternatives considered**:

- Copy the demo Modal/FormField helpers: rejected because they belong to demo UI dependencies.
- Build a second modal implementation: rejected because it duplicates interaction and accessibility logic.
