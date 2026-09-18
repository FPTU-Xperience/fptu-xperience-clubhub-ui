# Implementation Plan: Chọn câu lạc bộ của tôi

**Branch**: `004-my-club-selection` | **Date**: 2026-09-18 | **Spec**: [spec.md](spec.md)

## Summary

Migrate the demo club-selection screen to protected `/v2/my-clubs`, preserving approved visual hierarchy with V2-local components and server-authoritative data. Cards show only the current user's approved clubs/roles, nearest authorized upcoming activity, manager-only pending count, and current-user membership applications with withdrawal. Cards navigate to `/v2/my-clubs/:clubId`, a production placeholder until the separate workspace migration.

The current API has membership/access sources but no privacy-safe aggregate projection, join-application feed, or self-withdraw operation. UI-08/#11 therefore depends on CLBHB-BE-14/#15, which in turn depends on CLBHB-BE-12/#13; UI-09/#12 remains downstream. Existing public-club read fields are consumed only where they are already safe and available. See [contract](contracts/my-clubs-ui-contract.md).

## Technical Context

**Language/Version**: JavaScript ES modules; React 18.2

**Primary Dependencies**: React Router 6, `AuthProvider`, V2 `PageState`, V2 header/footer, `lucide-react`, Sass, Vite 5

**Storage**: Browser token/session only; API is authoritative for all feature data and mutations.

**Testing**: Node built-in V2 adapter/source tests, route smoke, focused route checks, `npm run build`.

**Target Platform**: Authenticated desktop/laptop browsers, minimum width 1060px

**Project Type**: SPA with separately deployed API gateway/services

**Performance Goals**: Explicit loading on entry/session change; stale responses never replace current session/route data.

**Constraints**: V2-local implementation only; no demo imports, fixtures, actors, or mutations. 401/403/empty/error remain distinct. CTA never points to `/v2/demo`.

**Scale/Scope**: One per-user page plus production placeholder route. The API returns complete authorized cards in one projection, avoiding N+1 requests.

## Constitution Check

| Gate | Status | Evidence |
| --- | --- | --- |
| V2-first production context | Pass | New files remain V2-local; demo remains isolated. |
| Server-authoritative access | Pass with backend dependency | Projection resolves membership, role, summaries, application ownership, withdrawal eligibility and route authorization. |
| Truthful data and states | Pass | Explicit availability states; null manager count maps to copy, never a guessed value. |
| Scoped state and privacy | Pass | Session-keyed lifecycle; DTO excludes rosters, other-user IDs, contact details and internal permissions. |
| Proportional verification | Pass | Direct navigation, stale response, withdrawal, availability, adapter, smoke and build validation planned. |
| Linked-issue traceability | Pass with handoff action | Update graph and comment field/privacy limits on UI-08/#11 and BE-14/#15; keep UI-09/BE-12 downstream. |

**Post-design check**: Pass. Existing broad membership/member-list endpoints are not used to infer private or manager-only data.

## Project Structure

### Documentation (this feature)

```text
specs/004-my-club-selection/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/my-clubs-ui-contract.md
└── tasks.md                 # created by speckit-tasks
```

### Source Code (repository root)

```text
src/
├── pages/v2/V2App.jsx                         # production routes
├── pages/v2/my-clubs-page/MyClubsPage.jsx     # page composition
├── pages/v2/my-clubs-page/MyClubsPage.scss    # V2-scoped demo-derived styles
├── pages/v2/my-clubs-data.js                  # DTO adapter and request lifecycle
├── pages/v2/my-clubs-data.test.js             # adapter/privacy/status tests
├── components/v2/my-clubs/MyClubCard.jsx
├── components/v2/my-clubs/MyMembershipApplications.jsx
├── components/v2/my-clubs/WorkspacePlaceholder.jsx
└── services/api.js                            # agreed endpoint methods
```

**Structure Decision**: Follow the Discover migration: V2 page composition, feature-local adapter with stale-request gate, small V2 components, and routes owned by `V2App`. Reuse shared `PageState`, header, footer, and button conventions; do not import demo implementation.

## Complexity Tracking

No constitution violations require justification.
