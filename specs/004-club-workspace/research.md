# Research: Production Club Workspace

## Decision: Reuse the authenticated selection projection for the workspace home

**Rationale**: `GET /api/clubs/me/selection` already maps current-user club IDs, role, next activity, and manager-only pending count for the My Clubs migration. It supports a truthful home without broad roster or activity data.

**Alternatives considered**:

- Import the demo workspace model and provider: rejected because it exposes fixtures and in-memory mutations in production.
- Fetch public activity feed data by club: rejected because the public DTO is not an authorized internal-workspace contract.
- Block all implementation pending a new aggregate endpoint: rejected for this MVP because the current selection data enables the core destination safely.

## Decision: Defer operational pages with explicit states

**Rationale**: The demo’s activities, attendance, members, quests, points, gifts, reports, finance, and settings depend on synthetic state. Their production data, permission, semester, and mutation contracts are not established.

**Alternatives considered**:

- Show cached or hard-coded counts: rejected because they would misrepresent production truth.
- Hide all navigation: rejected because a clear workspace information architecture communicates the intended product while correctly marking unavailable areas.

## Decision: Use route- and session-aware request gating

**Rationale**: A late response must not show a prior session’s selection after navigation or sign-out. The established My Clubs adapter already defines a request-gate pattern.

**Alternatives considered**:

- Rely solely on component unmount: rejected because session changes can retain the same component tree.
