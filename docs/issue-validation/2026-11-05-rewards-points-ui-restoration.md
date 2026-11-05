# Rewards layout restoration and club/personal points

User correction: integrating real data must retain the established rewards presentation. Restore the grouped catalog, search, sorting, gift cards, original avatar/cover/shape preview components and side detail panel. Retain canonical server catalog, inventory, credit wallet and all version/idempotency checks. Remove the unreachable local sample catalog from the production gifts module.

The manager's Points & achievements page now has **Tính điểm CLB** and **Điểm cá nhân trong CLB** tabs. Ordinary members see only their own club points. The manager view uses the existing `/api/clubs/{clubId}/experience-statistics?semesterId=...` verified net ledger projection and the approved-policy status. It does not create a new scoring policy or assign arbitrary points.

The personal view shows approved XP in the selected semester, approved lifetime XP in this club and the separate spendable credit balance. It reads the complete self contribution pagination before computing totals, isolates club/actor/semester, excludes revoked XP and non-authoritative legacy declarations, and keeps revoked records visible in the history. The credit graph and debit/reversal ledger remain available under an expandable wallet section. No wallet/graph request is made in observation mode.

Existing backend limitations remain visible: physical fulfillment and authoritative hot-gift rankings are unavailable. No local sample gifts, initial 200-credit balance or locally created ownership are used as live data.

Validation before release:

- 333 UI/service/session tests passed; production build passed.
- Rewards component browser checks passed at 1440px and 390px: groups/search/sorting/detail, create/schedule, redemption confirmation/cancel, malformed receipt/stable idempotent retry, single debit, debt blocks free redemption, actor transition and observation privacy.
- Points browser checks passed at both sizes: two manager tabs, member-only personal scope, XP independent of spent credit, complete contribution pagination, revoked entries, club/semester/actor changes, malformed ownership failure and expandable credit graph.
- Built application browser checks passed at both sizes: restored catalog and protected redemption followed by both manager points tabs. These checks intercept synthetic API traffic; they do not establish real-account acceptance.

Local dev server on localhost:5173 serves the updated approved checkout and reuses the original checkout's environment configuration. The original IDE checkout and its unrelated local edits are preserved.
