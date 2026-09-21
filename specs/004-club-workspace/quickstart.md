# Quickstart: Production Club Workspace

## Prerequisites

- Install repository dependencies.
- Authenticate against an API that implements the selection contract in [workspace-ui-contract.md](contracts/workspace-ui-contract.md), or enable only the existing local My Clubs mock for visual development.

## Validate

1. Run `node --test src/pages/v2/workspace-data.test.js`.
2. Run `npm run build`.
3. Start the Vite application and sign in as a user with a selection entry.
4. Open `/v2/my-clubs`, then choose “Vào không gian CLB”; confirm the matching workspace name, role, and activity are rendered.
5. Open the same workspace URL directly; confirm the same current-user result is shown.
6. Open a non-selected club URL; confirm a safe unavailable state with a “Về CLB của tôi” route.
7. As a member, confirm manager-only sections/counts are absent. As a manager, confirm a missing count says it is updating rather than showing zero.
8. Select each deferred area; confirm no records or mutation controls from `/v2/demo` appear.
