# Research: Production Discover Experience

## Decision: Make `/v2` production and `/v2/demo` the demo boundary

**Decision**: Replace the current top-level demo mount with a V2 parent application: production
Suggested Discover at `/v2`, the complete directory at `/v2/clubs`, and independent club detail at
`/v2/clubs/:clubId`. The retired `/v2/recommended` URL redirects to Discover. Retain demo only at
`/v2/demo/*`.

**Rationale**: Current `/v2/*` routes all enter the demo app. A parent V2 router prevents route
collisions and honors the V2-first constitution.

**Alternatives considered**: Keeping demo at `/v2` or retaining demo aliases was rejected because
both reserve the production namespace and conceal migration mistakes.

## Decision: One V2 auth boundary; demo provider only under the demo route

**Decision**: A V2 parent owns the existing authentication/access boundary. Production routes have
no demo provider; the nested `/v2/demo` branch alone wraps retained demo routes in `DemoProvider`.
Rebase demo links, redirects, reset navigation, and smoke routes to `/v2/demo`.

**Rationale**: Current DemoApp owns both auth and demo state. Nesting it unchanged duplicates
providers and risks production coupling.

**Alternatives considered**: Per-child auth boundaries and a shared demo shell were rejected for
inconsistent access behavior and UI LAB/fixture leakage.

## Decision: V2-local production pages/components and data adapters

**Decision**: Put production pages/adapters in `src/pages/v2` and reusable presentation components
in `src/components/v2`. Reuse only demo visual patterns after removing demo model/context imports.

**Rationale**: This keeps production ownership clear and meets the project’s V2-only rule.

## Decision: Use least-privilege directory and public-detail contracts

**Decision**: Map the authenticated active-club directory to a minimal card model. Add a
display-safe public-detail response for `/v2/clubs/:clubId`; never expose raw club rosters to V2.

**Rationale**: Current responses provide basic identity, category, description, logo, and activity,
but lack schedule, recruitment, location, cover, member count, public leaders, and a complete
viewer relationship. Raw responses contain roster-related data that cards/details do not need.

**Alternatives considered**: Client inference, raw roster reuse, and fixture data were rejected as
untrustworthy, overbroad, or non-production behavior.

## Decision: Truthful fallback and stale-request handling

**Decision**: Missing optional fields display as unavailable; recruiting-only stays disabled until a
reliable contract field exists. Recommended Clubs uses a clearly labeled deterministic curated
subset until RE-39. Requests bind to session, route, club identifier, and criteria; obsolete
responses are canceled or ignored.

**Rationale**: This preserves useful routes without false personalization, inferred recruitment, or
stale/private data leaks.
