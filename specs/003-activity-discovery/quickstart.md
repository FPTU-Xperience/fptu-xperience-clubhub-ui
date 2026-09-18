# Quickstart: Validate Khám phá hoạt động

## Prerequisites

- Install UI dependencies with `npm ci`.
- Configure `VITE_API_BASE_URL` to the Gateway and sign in with test accounts.
- Deploy or stub only the display-safe contracts in
  [activity-discovery-contract.md](contracts/activity-discovery-contract.md); do not point the UI
  at demo fixtures or raw `/api/activities` data.
- Prepare: one public upcoming activity, one live activity in a club the user actively belongs to,
  one non-public activity in a club the user does not belong to, a completed/cancelled activity,
  and a user with no active club memberships.

## Run

1. Start the UI with `npm run dev`.
2. Open `/v2/activities` while authenticated, then open `/v2` for the Discover section.
3. Run `npm run test:demo`, `npm run test:demo:routes`, and `npm run build` before review, plus
   the focused production adapter/route checks introduced by implementation.

## Validate the main journey

1. For a member test account, open `/v2/activities`. Verify each rendered item is `UPCOMING` or
   `LIVE`, public or from an active membership, and contains date, club, title, status and location
   when available.
2. Confirm an item that is both public and from the member's club appears once. Confirm completed,
   cancelled and non-public activities from an unrelated club do not appear.
3. Search by title, club, description and location; verify filtering is limited to the already
   authorized feed and a non-match displays the filtered empty state.
4. Open a card. Verify the read-only detail is in-context, focus can enter/leave it, and only the
   contract-approved next action is offered. Follow it and confirm the target re-checks authority.
5. Open `/v2`. Verify the recommendation section shows at most six rank-ordered eligible items and
   its all-activities action opens `/v2/activities`.

## Validate availability, access and isolation

1. Delay each contract response: the page and recommendation section show their own loading state.
2. Return `items: []`: the page/section shows its normal empty state without demo content.
3. Return `403` for either source: the relevant forbidden state is visible and no prior account's
   entries remain visible.
4. Return a retriable failure: error and retry appear; retry reloads only the current session.
5. Change account or invalidate the session while requests are pending. Verify stale responses are
   ignored and the prior account's activity/recommendation data is not rendered.
6. Open `/v2/demo` and its activity workspace. Verify demo controls and fixtures remain there and
   production `/v2` or `/v2/activities` imports none of their provider/model behavior.
7. Directly load `/v2/activities`, reload the browser, and use keyboard navigation at 1060px and a
   narrower viewport. Verify session continuity, focus visibility and no horizontal clipping of the
   primary action.

See [data-model.md](data-model.md) for state transitions and
[activity-discovery-contract.md](contracts/activity-discovery-contract.md) for expected data and
authorization behavior.
