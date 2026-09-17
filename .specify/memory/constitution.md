<!--
Sync Impact Report
- Version change: 1.1.0 → 1.1.1
- Modified principles: I. V2-First Production Context (route-boundary clarification).
- Added sections: none.
- Removed sections: none.
- Follow-up TODOs: none.
-->

# FPTU Xperience ClubHub UI Constitution

## Core Principles

### I. V2-First Production Context

All new ClubHub product work MUST be implemented inside the `src/pages/v2` and
`src/components/v2` areas, with supporting V2-local modules when needed. Work MUST NOT modify,
import from, route through, or use legacy pages and components unless the user explicitly directs
that exception. V2 work MUST retain its authorized application context and MUST NOT carry demo UI
lab controls, fixture actors, or in-memory business mutations into production behavior. The V2
production migration entry point is `/v2`; retained UI reference demos MUST be isolated below
`/v2/demo` and MUST NOT be mounted by production routes.

### II. Contract-First, Server-Authoritative Access

Production data access MUST be based on an agreed backend contract, with the server enforcing
identity, membership or assignment, club scope, and resource relationships. Client-side route
guards improve user experience but MUST NOT be treated as access control. A global role MUST NOT
implicitly grant authority for a specific club.

### III. Truthful Data and States

Production screens MUST use explicit data adapters that map authorized source data into view data.
They MUST present distinct loading, empty, forbidden, and error states, and MUST NOT silently fall
back to demo fixtures, demo actors, or in-memory mutation behavior when production data fails.

### IV. Scoped State and Privacy

Data and client state MUST remain scoped to the current user, club, semester where applicable, and
active filters. A change in user, club, or route MUST NOT reveal stale or private data from a prior
context. Features MUST request and display only the information needed for the viewer’s permitted
task.

### V. Verify Change Proportionately

Every change MUST include verification proportional to its risk. Changes to routing, access,
adapter contracts, or shared UI MUST include focused regression checks for direct navigation,
authenticated-session continuity, and failure states. The existing build MUST pass before a change
is considered ready for review.

## Product and Security Constraints

The current UI handoff is the behavioral and visual reference for ClubHub student and club-manager
work. Its desktop baseline is 1060 pixels wide. Legacy administrative experiences remain out of
scope unless the user explicitly authorizes work there.

Club data is public only to the degree the backend permits. Internal data is always constrained by
the active club and, when relevant, the active semester. Archived semesters are read-only for
business operations. Achievement history and reward spending balances are separate concepts and
MUST NOT be conflated.

Demo-only facilities, including the UI lab, actor switching, fixture reset, and mocked business
mutations, MUST remain isolated from production behavior.

## Development Workflow

Feature work MUST begin with an outcome-focused specification and record material decisions before
implementation planning. Plans MUST identify the data contract, authorization boundary, migration
or compatibility impact, and verification approach before source changes begin.

Implement work in small reviewable increments. Do not combine unrelated visual redesign,
authentication changes, and data-schema changes without explicit acceptance criteria for each.
Document assumptions and unresolved upstream dependencies rather than encoding them as product
facts.

Reviews MUST verify compliance with these principles, applicable feature acceptance criteria,
access isolation, and relevant build or focused tests. Amendments require a documented rationale,
semantic version update, and review of impacted specifications and plans.

## Governance

This constitution governs all feature specifications, plans, tasks, and implementation work in this
repository. It supersedes conflicting local conventions unless a documented amendment explicitly
states otherwise. Amendments require a rationale, an impact assessment, and semantic versioning:
major for incompatible principle redefinition or removal, minor for a new or materially expanded
principle, and patch for clarifications that preserve meaning.

Every review MUST check the proposed work against this constitution. Complexity, exceptions, and
deviations require explicit justification in the relevant feature artifact. The UI design handoff
and project documentation remain supporting references; they do not override these governance
rules.

**Version**: 1.1.1 | **Ratified**: 2026-09-17 | **Last Amended**: 2026-09-17
