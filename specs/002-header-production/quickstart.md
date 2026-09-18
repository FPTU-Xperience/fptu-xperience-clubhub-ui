# Quickstart: Validate the Production Application Header

## Prerequisites

- A running backend reachable through the configured API base URL.
- An account permitted to enter `/v2` and, where possible, accounts with: no notifications, unread notifications, and notification access denied.
- Node dependencies installed.

## Automated verification

From the repository root, run:

```powershell
npm run test:demo
npm run test:demo:routes
npm run build
```

Expected results:

- Focused V2 tests cover header navigation constraints, notification mapping, stale request rejection, and availability-state rendering.
- Retained demo routes pass, demonstrating that `/v2/demo` behavior remains isolated.
- The production build completes successfully (the existing large-chunk advisory is not a failure).

## Manual production walkthrough

1. Sign in and open `/v2`; verify the ClubHub brand, campus context, account identity, notification control, and only Discover and Clubs navigation are present. No UI LAB, actor switcher, reset action, or demo route is visible.
2. Select brand, Discover, and Clubs from both `/v2` and `/v2/clubs`; confirm destinations remain in `/v2`, the active item updates, and the session is retained.
3. Use keyboard only: tab through header controls, verify visible focus and meaningful labels, open notifications, then dismiss with Escape and its close control.
4. Open notifications for an account with summaries; confirm a maximum of six recent, current-user entries are shown and the unread indicator matches unread content.
5. Repeat with an empty response, forbidden response, and simulated request failure; verify distinct truthful text, retry on failure, and no retained notices from an earlier account.
6. Sign out while the notification popover is open, then sign in as a different account; confirm the previous identity and notifications do not reappear.
7. At 1060px width, repeat the navigation and notification interaction; confirm no horizontal clipping or scrolling is needed for header controls.

See [data-model.md](./data-model.md) for expected UI states and [notification-summary.md](./contracts/notification-summary.md) for server-response behavior.
