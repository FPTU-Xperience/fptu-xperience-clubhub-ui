# Implementation Plan: Production Club Workspace

**Branch**: `004-club-workspace` | **Date**: 2026-09-21 | **Spec**: [spec.md](spec.md)

## Summary

Replace the production workspace placeholder with a V2-local workspace shell and home. The shell consumes the existing authenticated club-selection projection, matches the route club identifier, renders role-scoped navigation and a truthful summary, and uses explicit unavailable states for demo operations that lack a production contract.

## Technical Context

**Language/Version**: JavaScript (React 18)

**Primary Dependencies**: React Router, lucide-react, existing V2 shared components

**Storage**: Server-authoritative authenticated API responses; no new client persistence

**Testing**: Node built-in test runner for pure data adapters; Vite production build and route-source smoke checks

**Target Platform**: Browser-based Vite single-page application

**Project Type**: Frontend web application

**Performance Goals**: Render an initial loading state immediately and replace it with the current selection result in one request cycle.

**Constraints**: Production `/v2` must not import demo modules or fixtures. Existing `GET /api/clubs/me/selection` is the only MVP data source. No backend source edits are in scope.

**Scale/Scope**: One authenticated club workspace home, route guard, role-aware navigation, and explicit deferred section states.

## Constitution Check

| Principle | Result | Evidence |
|-----------|--------|----------|
| V2-first production context | Pass | New source is V2-local; the demo remains mounted only beneath `/v2/demo`. |
| Contract-first server authority | Pass | The route is matched against the authenticated selection projection; the backend remains authoritative. |
| Truthful data and states | Pass | The workspace maps only supplied fields and has no fallback fixture data. |
| Scoped state and privacy | Pass | Request gating keys the response to the active session and route selection. |
| Proportional verification | Pass | Adapter tests, direct-route source checks, and build are planned. |

## Project Structure

```text
src/
├── components/v2/my-clubs/
│   └── WorkspacePlaceholder.jsx       # removed after route migration
├── pages/v2/
│   ├── my-clubs-data.js               # existing selection adapter reused
│   ├── workspace-data.js              # workspace route adapter and request hook
│   ├── workspace-data.test.js         # adapter tests
│   └── club-workspace-page/
│       ├── ClubWorkspacePage.jsx      # production shell and section states
│       └── ClubWorkspacePage.scss     # V2-local workspace styling
└── pages/v2/V2App.jsx                 # route integration

specs/004-club-workspace/
├── research.md
├── data-model.md
├── contracts/workspace-ui-contract.md
├── quickstart.md
└── tasks.md
```

**Structure Decision**: Keep the production workspace independent of `src/pages/v2/club-workspace/`, which is demo-only. Reuse only the production selection adapter shape.

## Complexity Tracking

No constitution violations require justification.
