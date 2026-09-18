# Implementation Plan: Production Discover Experience

**Branch**: `001-discover-production` | **Date**: 2026-09-17 | **Spec**: [spec.md](spec.md)

## Summary

Migrate the V2 entry point so production Discover owns `/v2` and the reference demo is isolated at
`/v2/demo`. Implement a protected suggested-club Discover landing, an independent complete Clubs
directory, and a read-only club detail route entirely in V2 pages and components. Use production adapters and
least-privilege contracts; retain the UI-DESIGN visual language but never its demo provider,
fixtures, UI lab, or business mutations.

## Technical Context

**Language/Version**: JavaScript ES modules; React 18.2

**Primary Dependencies**: React Router 6, existing V2 authentication boundary, `lucide-react`,
Sass, Vite 5

**Storage**: Existing browser session/token storage only. Authoritative club and viewer data remains
in the ClubHub API; Discover introduces no feature persistence.

**Testing**: Existing Node demo tests and SSR smoke, new V2 route/adapter/component tests with the
least added harness, and `npm run build`.

**Target Platform**: Authenticated desktop/laptop browsers, minimum width 1060px

**Project Type**: Single-page web application

**Performance Goals**: Show loading feedback on current route or criteria changes without blocking
navigation; stale responses never replace current V2 content.

**Constraints**: Production implementation belongs in `src/pages/v2` and `src/components/v2`;
`/v2/demo` retains all demo-only providers/state; 401 uses V2 sign-in handling, 403 is visible, and
production requests never substitute fixture content.

**Scale/Scope**: Production V2 routes: suggested Discover, complete Clubs, and independent club
detail. Demo routes are rebased under `/v2/demo`. Discover is capped at 24 suggestions and six cards per page; Clubs uses twelve cards per page;
recruiting-only is unavailable until the API provides reliable recruitment status.

## Constitution Check

| Gate                        | Status                        | Evidence                                                                                                 |
| --------------------------- | ----------------------------- | -------------------------------------------------------------------------------------------------------- |
| V2-first production context | Pass                          | Production pages/components are V2-local; V2 parent separates `/v2` and `/v2/demo`.                      |
| Server-authoritative access | Pass with contract dependency | UI consumes authenticated directory/detail data; detail DTO is least-privilege.                          |
| Truthful data and states    | Pass                          | Adapters expose explicit availability states and prohibit fixture fallback.                              |
| Scoped state and privacy    | Pass                          | Current session, route, detail identifier, and criteria identify requests; raw rosters stay hidden.      |
| Proportional verification   | Pass                          | Route rebasing, production/demo isolation, states, filters, detail, build, and smoke checks are planned. |

**Post-design check**: Pass. The current backend lacks schedule, recruitment, location, cover,
member-count, and public-leader detail fields. The contract requires a separate display-safe detail
response rather than client inference or raw membership data.

## Project Structure

### Documentation (this feature)

```text
specs/001-discover-production/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── discover-ui-contract.md
└── tasks.md                 # created by speckit-tasks
```

### Source Code (repository root)

```text
src/
├── main.jsx                          # V2 parent route boundary only
├── pages/v2/
│   ├── V2App.jsx                     # one V2 auth/access boundary and route owner
│   ├── DemoApp.jsx                    # provider-free demo route composition
│   ├── DiscoverPage.jsx               # suggested landing, maximum four pages
│   ├── AllClubsPage.jsx               # complete directory, twelve per page
│   ├── ClubDetailPage.jsx             # production read-only detail
│   └── discover-data.js               # V2 data adapter and request lifecycle
├── components/v2/
│   ├── DiscoverShell.jsx
│   ├── ClubCard.jsx
│   ├── DirectoryFilters.jsx
│   ├── DirectoryPagination.jsx
│   └── PageState.jsx
└── pages/v2/demo.scss                 # split/re-scope production V2 styles as required

scripts/
└── demo-smoke.mjs                     # rebase existing demo smoke routes to /v2/demo
```

**Structure Decision**: V2 is the sole implementation area. `V2App` owns one authenticated
boundary; its production routes do not import demo state, while `/v2/demo/*` alone wraps retained
demo routes in `DemoProvider`.

## Complexity Tracking

No constitution violations require justification.
