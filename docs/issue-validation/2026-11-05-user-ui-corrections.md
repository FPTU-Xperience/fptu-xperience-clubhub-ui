# User corrections — 2026-11-05

User instruction: record all comments, then fix them sequentially. Implement directly in repository source against implemented API contracts. Do not inject UI/DOM fixes, substitute mock persistence for real data, or replace an established UI when integrating its data.

## 1. Kho quà — restore the existing UI

- Request: the data-integrity integration replaced the UI without approval; restore the existing presentation.
- Keep grouped gifts, search/sort, original avatar/shape/cover previews, gift detail panel, create/edit type cards, input/preview columns and footer.
- Keep real API catalog, inventory, wallet and version/idempotency safeguards. Do not restore the local 200-point sample wallet.
- Status: implemented, committed, pushed and deployed at UI `27de3c0`; workflow `41996264657` completed successfully on retry. The first attempt timed out in the unrelated wrong-session QR browser check; an independent rerun and full CI rerun passed without weakening assertions.
- Validation: 333 tests, production build, component and built/deployed browser checks at 1440px/390px. Synthetic API traffic in automated browser checks is explicitly isolated, not real-account acceptance.
- Details: [rewards/points restoration](2026-11-05-rewards-points-ui-restoration.md).

## 2. Điểm & thành tích — meaningful personal scope and two manager tabs

- Request: the personal points display did not make sense; managers need separate club scoring and personal-in-this-club tabs.
- Managers: **Tính điểm CLB** and **Điểm cá nhân trong CLB**. Members: own club-scoped view.
- Show verified XP for the chosen semester, lifetime XP in this club and the separate spendable credit balance. Exclude revoked XP from current totals while retaining history.
- Status: implemented/deployed with item 1. Club/actor/semester isolation, XP versus spent credit, revoked entries and read-only privacy passed automated checks.

## 3. Member/governance names — use current display name

- Request: the screenshot's member/treasurer list shows a username such as `mr28042005`; use the current profile display name.
- Apply the requirement to the member/governance UI retained after item 5 removes the standalone role section.
- Preserve immutable historical snapshots and protected role authorization. Do not rewrite membership/audit history just to update presentation names.
- Status: IN PROGRESS, not released. A draft API role-reader projection and two targeted passing tests exist in the API worktree; the retained governance surfaces still need to be checked before this item can be marked complete.

## 4. Member tab spacing

- Request: fix spacing in the Member tab.
- Normalize separation between sections, tabs, filters, member rows and action groups; keep desktop/mobile layouts usable.
- Status: DRAFT. Local stylesheet edits exist; review them against the retained layout after item 5. Do not count changes to the soon-to-be-removed standalone role section as the final spacing fix.

## 5. Ban quản lý — reuse old UI; remove standalone role section

- Request: reuse the existing Ban quản lý UI rather than the new presentation; remove the entire **Vai trò trong CLB** section shown in the screenshot, including its separate treasurer rows/reload block.
- Existing presentation reference: `ClubGovernancePreview.jsx` and `ClubGovernancePreview.scss`. Reuse its presentation with canonical governance API state/actions; do not reactivate its localStorage preview state, demo members or fake permissions.
- Preserve current groups, multi-group assignments, protected leadership, scoped capabilities, revisions/history and report snapshots.
- Status: QUEUED. No completed restoration/removal claimed.

## 6. Nhiệm vụ & đóng góp — aggregate event recruitment and assignments

- Request: load recruitment and staffing/assignments from the club's actual events.
- Include events with direct assignments even when no recruitment notice exists. Keep recruitment/application/assignment actions attached to their real event and current actor's permissions.
- Respect club, semester, pagination and private-event boundaries. Distinguish empty data from failed/unavailable sources.
- Status: QUEUED. Current `QuestsTab` reads only the recruitment listing, so events with direct assignments alone can be absent. Audit/implement this after preceding items.

## Continuation rule

Continue from item 3, then 4, 5 and 6 in order. If adjacent items need shared changes, keep their status/evidence separate and do not silently mark a later item complete. Finish source implementation and relevant checks before commit/push/deploy; these release actions remain authorized. Final browser validation is required before stopping. Never claim real-account acceptance from intercepted API fixtures.
