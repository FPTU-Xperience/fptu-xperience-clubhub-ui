# Quickstart: Validate Chọn câu lạc bộ của tôi

## Prerequisites

- Configure the API gateway through `VITE_API_BASE_URL` with [the agreed contract](contracts/my-clubs-ui-contract.md).
- Prepare authenticated accounts: no eligible club; multiple memberships; manager with a count; manager with `pendingApplications: null`; pending join application.
- Treat `/v2/demo` as visual reference only; never use it for production data.

## Run

```powershell
npm run test:demo
npm run test:demo:routes
npm run build
npm run dev
```

## Acceptance walkthrough

1. Open `/v2/my-clubs` as a multi-club member; each eligible club appears once with correct role and no other-account data.
2. Confirm each card uses the nearest authorized upcoming activity, or schedule-updating copy when absent.
3. Confirm manager count is club-scoped; `null` renders “Đơn tham gia đang cập nhật”; members never see manager counts.
4. Confirm only the current user’s join applications appear. Withdraw an eligible pending item, confirm refreshed state, then retry and confirm a truthful conflict/current-state outcome.
5. Select a card and confirm `/v2/my-clubs/:clubId` opens even when it is a placeholder, with no `/v2/demo` link.
6. Exercise loading, empty, 401, 403 and network error. Change account during delayed response and verify no stale content appears.
7. At 1060px+, tab through card CTA, withdrawal and placeholder controls without clipping.

## Automated coverage

- Adapter/source tests: approved/manager mapping, PII stripping, nearest activity, null count, application status, withdrawal and stale-request gate.
- Route smoke: production `/v2/my-clubs` and `/v2/my-clubs/:clubId` routes; new production modules contain no demo imports or links.
- Build and demo smoke remain green.
