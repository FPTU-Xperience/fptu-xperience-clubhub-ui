# Implementation Plan: Migrate Production Profile

**Branch**: `005-profile-production` | **Date**: 2026-09-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-profile-production/spec.md`

## Summary

Add the signed-in user's missing `/v2/profile` destination by translating the profile reference's Vietnamese information hierarchy into V2-owned page components and styles. The page will use a V2-local, temporary profile repository that returns normalized mock records and retains permitted edits per authenticated account across reloads. It will reuse existing V2 routing, state, button, and modal patterns without importing demo state or calling a profile API. The repository boundary is intentionally shaped for later replacement by an authorized production profile API.

## Technical Context

**Language/Version**: JavaScript ES modules; React 18.2

**Primary Dependencies**: Vite 5, React Router 6, lucide-react, Sass

**Storage**: Versioned browser local storage for temporary profile mock records, keyed by authenticated user ID or email; no record for an anonymous session

**Testing**: Node built-in test runner for pure V2 data modules; existing route smoke script; Vite production build; manual browser accessibility and responsive checks

**Target Platform**: Modern desktop browser; 1060px desktop baseline with usable narrower-width layout

**Project Type**: Vite single-page web application

**Performance Goals**: Show the first temporary profile state within 3 seconds in 95% of normal development loads; avoid stale profile results after an account or route change

**Constraints**: Authenticated-current-user scope only; local shared-profile preview; no profile API calls; no imports from `DemoContext`, demo actors, `model`, `ui`, `/v2/demo`, or global `demo.scss`; preserve existing V2 account-menu behavior and personal-nav items

**Scale/Scope**: One signed-in student profile per browser-account key; a small representative mock participation/evidence set; two profile tabs and one edit dialog; future API replacement is explicitly out of this implementation

## Constitution Check

### Pre-design gate

| Principle | Plan response | Status |
|---|---|---|
| V2-first production context | Source files live under `src/pages/v2`, `src/components/v2`, and V2-local data modules; demo is visual reference only. | Pass |
| Server-authoritative access | The route resolves only the authenticated user's stable key. The user explicitly requested a temporary mock repository in place of API data; it does not claim live authority and is replaceable by a server-authoritative adapter. | Pass with documented temporary exception |
| Truthful data and states | The page consumes a single local repository and provides loading, empty, forbidden, unauthorized, and error representations. It never silently reads demo state. | Pass |
| Scoped state and privacy | Persisted records are versioned and keyed by user ID/email, never anonymous; shared preview strips private fields locally. | Pass |
| Proportional verification | Pure repository tests, direct-route/account-switch checks, modal keyboard checks, route smoke, and build validation are included. | Pass |
| Migration traceability | This plan records the source reference, mock-service boundary, API-replacement dependency, and verification strategy. | Pass |

### Post-design gate

All gates remain satisfied. The only departure from live contract-first data is the user-approved temporary mock repository. It is isolated to V2, scoped per authenticated identity, marked temporary in its contract, and must be replaced by an authorized API adapter before profile data is represented as live.

## Project Structure

### Documentation (this feature)

```text
specs/005-profile-production/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── profile-service.md
└── tasks.md                 # Generated later by speckit-tasks
```

### Source Code (repository root)

```text
src/
├── components/v2/
│   ├── PageState.jsx
│   └── common/modal/V2Modal.jsx
└── pages/v2/
    ├── V2App.jsx
    ├── profile-data.js
    ├── profile-data.test.js
    └── profile-page/
        ├── ProfilePage.jsx
        └── ProfilePage.scss
```

**Structure Decision**: Keep the route and view orchestration in a new V2 page folder, while the normalized mock repository and its unit tests live beside the other V2 data modules (`activity-data.js`, `my-clubs-data.js`). Reuse shared V2 state and modal primitives rather than copying demo helpers. The profile page owns all profile-specific styles, so demo.scss remains demo-only.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Temporary local repository instead of a live server contract | The user explicitly requested profile services that return mock data before the API exists; a versioned, account-scoped adapter allows the visual migration and gives a single future replacement point. | Reading demo state would violate V2 isolation; embedding fixture records in page components would make API replacement and privacy validation unreliable. |
