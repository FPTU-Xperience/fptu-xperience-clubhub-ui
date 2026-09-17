# Quickstart: Validate Production Discover

## Prerequisites

- Node dependencies installed with `npm ci`.
- A configured ClubHub API base URL and an authenticated test account authorized to view clubs.
- Directory data covering multiple categories, at least one reliable recruiting state, and a club
  with optional visual/schedule information absent.

## Run

1. Start the application with `npm run dev`.
2. Sign in with the test account and open `/v2`.
3. Run `npm run build` before review. Retain `npm run test:demo` and `npm run test:demo:routes` as
   demo regression checks; run the production Discover checks added by implementation.

## Validate journeys

1. Open Discover: verify the demo-derived hero, discovery strip, suggested directory, and bottom
   callout render without a left rail. Confirm at most 24 suggestions, six cards per page, category
   filtering, and no recruiting-only control.
2. Select the bottom All Clubs action: verify `/v2/clubs` opens as an independent complete directory;
   search, choose a category, enable recruiting-only, and confirm pages contain at most twelve cards.
3. Select cards from Discover and Clubs: verify both navigate to the independent club-detail route.
4. Select a card: verify navigation reaches `/v2/clubs/:clubId`, shows only permitted public
   detail, and retains the session.
5. At 1060px and a wider desktop viewport, verify rail, controls, cards, focus order, and primary
   actions remain visible without horizontal scrolling.

## Validate availability and isolation

1. Delay a directory request: loading appears before results.
2. Return no data or apply unmatched criteria: a usable empty state appears with controls intact.
3. Return a valid-session access denial: forbidden appears without unrelated data.
4. Fail the request: error and retry appear; retry never displays fixture cards.
5. Change filters, navigate rapidly, or change session while requests are pending: only the latest
   context may render results.
6. Open `/v2/demo` and a nested demo route: UI LAB remains available there, while `/v2` has no UI
   LAB or demo fixtures. Verify all demo links remain below `/v2/demo`.

See [data-model.md](data-model.md) for states and [discover-ui-contract.md](contracts/discover-ui-contract.md)
for source expectations.

## Validation record — 2026-09-17

- `npm run test:demo`: passed, 24/24 tests.
- `npm run test:demo:routes`: passed, 18/18 retained `/v2/demo` route renders.
- `npm run build`: passed with Vite's existing large-chunk advisory only.
- `nginx.conf`: `try_files $uri $uri/ /index.html` already supplies SPA fallback for direct
  `/v2`, `/v2/clubs/:clubId`, and `/v2/demo/*` requests; no additional rewrite is required.
- Static isolation checks confirm production V2 modules do not import `DemoContext`, `model.js`,
  UI LAB text, or demo fixture behavior, and all retained demo links stay below `/v2/demo`.
