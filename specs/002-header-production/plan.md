# Implementation Plan: Production Application Header

**Branch**: `002-header-production` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-header-production/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Migrate the demo ClubHub header into the shared V2 production shell without carrying across demo state or routes. Extend the existing Discover shell with the approved brand and visual hierarchy, two currently available production navigation destinations (Discover and Clubs), current-session account identity, and a small notification popover. Add V2-local presentation adapters and request state so only server-authorized current-user data is shown, stale header state is invalidated on session changes, and notification loading, empty, forbidden, and error outcomes remain explicit.

## Technical Context

**Language/Version**: JavaScript ES modules; React 18.2

**Primary Dependencies**: React, React Router 6, Lucide React, Sass, existing V2 authentication context and API service

**Storage**: Browser session tokens and display-safe authenticated user data already managed by the authentication context; no new client persistence

**Testing**: Node built-in test runner for focused V2 unit/source-structure tests; existing demo route smoke test; Vite production build

**Target Platform**: Authenticated browser experience at desktop widths of 1060px and above

**Project Type**: Single-page web application frontend

**Performance Goals**: Header remains interactive while notification data loads; render at most six notification summaries in the popover

**Constraints**: V2-only production modules; no demo imports, demo paths, fixture actors, or fixture notices; server-authoritative access; distinct availability states; no stale cross-session data

**Scale/Scope**: One shared V2 Discover-area shell, two current production navigation destinations, one current-user notification summary request per active header session/on explicit retry

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                                   | Pre-design result | Evidence / required implementation guard                                                                                         |
| ------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| V2-first production context                 | PASS              | Change only `src/components/v2`, `src/pages/v2`, and V2 tests; preserve `/v2/demo` unchanged.                                    |
| Contract-first, server-authoritative access | PASS              | Reuse authenticated API request path; document notification-summary contract; do not derive authorization from client roles.     |
| Truthful data and states                    | PASS              | V2-local adapter and hook expose loading, populated, empty, forbidden, unauthorized, and error; never fall back to demo notices. |
| Scoped state and privacy                    | PASS              | Request identity is tied to session key; cleanup invalidates in-flight work and clears popover state.                            |
| Proportional verification                   | PASS              | Add focused header tests, retain V2 regression tests, route smoke test, and build verification.                                  |

No constitution exception or complexity justification is required.

## Project Structure

### Documentation (this feature)

```text
specs/002-header-production/
├── plan.md              # This file ($speckit-plan command output)
├── research.md          # Phase 0 output ($speckit-plan command)
├── data-model.md        # Phase 1 output ($speckit-plan command)
├── quickstart.md        # Phase 1 output ($speckit-plan command)
├── contracts/           # Phase 1 output ($speckit-plan command)
└── tasks.md             # Phase 2 output ($speckit-tasks command - NOT created by $speckit-plan)
```

### Source Code (repository root)

```text
src/
├── components/v2/
│   ├── Header.jsx                 # shared V2 production header
│   ├── Header.scss               # component-owned header styles
│   ├── Footer.jsx                 # shared V2 production footer
│   └── Footer.scss               # component-owned footer styles
├── pages/v2/
│   ├── header-data.js             # new V2-local notification adapter and request hook
│   ├── header-data.test.js        # new focused adapter/request/header-boundary tests
│   └── V2App.jsx                  # production app container composing header, routed page, and footer
├── context/AuthContext.jsx         # existing authenticated identity and sign-out boundary; consume only
└── services/api.js                 # existing authenticated API transport; consume only
```

**Structure Decision**: Keep the production header in `src/components/v2` and its server-data mapping/request lifecycle in `src/pages/v2`, mirroring the established Discover data boundary. The header consumes—not duplicates—the existing authentication and transport boundaries. Legacy notification context and all demo modules remain excluded from V2 production composition.

## Implementation Sequence

1. Add pure header data mappers and a session-scoped request gate, with tests for authorized display fields, empty data, error classification, and stale-response rejection.
2. Compose dedicated production header and footer components directly in `V2App`, reusing the approved demo-derived visual language while replacing demo paths and state with V2 navigation, authenticated identity, and the local notification hook.
3. Wire the shell to the new component; make Discover and Clubs the only visible production destinations and preserve active-route signaling, skip link, sign-out, and direct-route behavior.
4. Add a bounded six-item notification popover with explicit state content, unread indicator, keyboard dismissal, and cleanup on user/session change.
5. Extend focused V2 tests, run retained V2/demo regressions and a production build, then perform the quickstart manual verification.

## Post-Design Constitution Check

PASS. The design keeps all new behavior in V2, defines the notification boundary before implementation, maps only display-safe fields, scopes state to the authenticated user/session, provides all required availability states, and includes direct navigation, session-continuity, shared-UI, and build verification. No cross-issue migration traceability is required because this plan implements this header migration alone and does not change a linked backend contract; the notification dependency is recorded in [the contract](./contracts/notification-summary.md).
