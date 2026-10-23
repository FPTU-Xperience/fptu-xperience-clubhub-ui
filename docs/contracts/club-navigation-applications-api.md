# Club quick navigation, pins and application inbox

Implement Status: Not Yet

Status Scope: BE application history/metadata implemented; durable pins optional

Backend Progress: PARTIAL_WITH_OPTIONAL_PINS

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#membership).

**Đã có BE:** Own application history, withdraw/reapply có audit, source/capability/version/code/logo metadata đã có; dữ liệu legacy giữ UNKNOWN.

**Chưa hoàn thành / giới hạn:** Durable pins vẫn chưa triển khai/optional; không chặn việc tích hợp inbox và rút đơn đã có BE. Không suy quyền từ navigation.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Club quick navigation, pins and application inbox

Historical Implement Status: Not Yet

Historical Status Scope: Backend implementation: session addendum

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: Existing code/logo/access/review fields support part of the UI. Self withdrawal, source/action/version metadata and persistent account pins are absent; exact source files and acceptance tasks are detailed below.

This is the session addendum to D10 [own memberships](my-clubs-membership-api.md), D06 [governance](club-governance-groups-api.md) and [shared conventions](api-contract-conventions.md). It adds persistent pin preferences and the inbox display rule; it does not create a second membership, role or withdrawal authority.

## Latest commit coverage

Reviewed the complete 16-file diff of **b9832cd33f7d8e17c09982e68a5acca0fc2b21ce** (`CLBHB-UI: Add quick club navigation and polish membership applications`), not only later working-tree edits. The following matrix binds that commit to backend obligations:

| Committed change / files | BE implementation or reuse | Contract owner |
| --- | --- | --- |
| Workspace quick switch and role subtitle: WorkspaceLeftRail.jsx/.scss | Reuse canonical code/name/logo and self access; isManager/isTreasurer already exist. Future governance display/capabilities must come from server assignments, not the subtitle | This addendum; D06 governance |
| Pin/unpin card, rail shortcut and PinnedClubsProvider: MyClubCard.jsx, LeftRail.jsx/.scss, pinned-clubs.jsx, V2App.jsx | Current implementation is browser-local. Cross-device upgrade needs self-only persisted pins, authorized reads and idempotent pin/unpin described below; a shortcut never grants access | Durable pin section below |
| Logo/code fallback in cards and applications: MyClubCard.jsx, MyMembershipApplications.jsx, my-clubs-adapter.js | Existing Club code/logo can be reused. Extend self membership metadata for clubs missing from the active directory; do not invent initials or an upload API for image display | Self-read extension below; D01 only for actual image writes |
| Inbox API composition: api.js, my-clubs-adapter.js | Current method combines existing own memberships and directory. Backend implementation may extend the self DTO or supply optional D10 inbox, with explicit source/capabilities/version; no new browser client | D10 and self-read section below |
| Pending/results/invitation separation and seven-day timer: my-clubs-data.js, MyClubsPage.jsx, MyMembershipApplications.jsx | Existing requestedAtUtc/reviewedAtUtc must retain decision truth; source discrimination is needed. Optional paged inbox applies visibility before paging and never deletes approved memberships | Seven-day policy below |
| Rút đơn capability and refresh: MyClubsPage.jsx, my-clubs-data.js, my-clubs-adapter.js | Implement own withdrawal endpoint/state/history/reapply and canWithdraw; manager DELETE is not a substitute. Current inspected backend cannot enable this action | Canonical D10 withdrawal |
| Membership boundary/expiry tests: my-clubs-data.test.js, my-clubs-adapter.test.js | Preserve FE boundary tests; BE needs independent principal, state-race, retry/history and reapply tests. FE tests are not service implementation evidence | Acceptance section below |
| Card layout, badges, branding/font and style files: MyClubsPage.scss, WorkspaceLeftRail.scss, LeftRail.scss, index.html | Presentation only; no new BE endpoints, font fields or status-color metadata. Existing server statuses remain authoritative | No BE work |

Also reviewed the imported parent **9321f848e6fbd6f87166af9397d162ae5a1c527d** (`Refactor CSS`). Component-owned styles, lazy demo loading, onboarding/access markup and ClubProfileHeader reuse existing models/API flows and introduce no new mutation endpoint. Durable onboarding/profile remains D02; real club-cover persistence remains D01/D04. Optional cover/location fallback in the public header is not evidence that those fields are persisted. The refactor does not cancel these existing contracts or create another profile/media authority.

## Required backend changes and existing foundations

| Work | Current backend source | Required implementation |
| --- | --- | --- |
| Self withdrawal | No withdrawal POST; `ClubMembershipStatuses` has Pending/Approved/Rejected/Inactive only; DELETE membership is manager/admin removal | Implement the existing D10 self-only withdrawal contract, WITHDRAWN history, concurrency, retry and reapplication |
| Inbox capabilities/source | `ClubMembershipResponse` includes consent and review dates, but no `source`, `canWithdraw`, `canAcceptInvitation`, code/logo or version | Extend the existing self read with principal-safe metadata; do not depend permanently on false-consent inference |
| Seven-day result visibility | Approve/reject set `ReviewedAtUtc`; own membership read returns all retained rows | Reuse that decision timestamp. If adding an inbox query, apply pending/recent-result filtering before pagination; never delete memberships to hide results |
| Cross-device pinned clubs | No pin entity, migration, DTO or route | Implement the opt-in durable pin endpoints below; current browser-local pins remain temporary preferences |
| Quick-switch identity/role | `/me/access` returns isManager/isTreasurer/isApprovedMember; directory supplies code/name/logo | Reuse these reads; optional safe selection projection includes organizational display role and capabilities without member ID arrays |

Evidence under sibling API: `src/Services/ClubService/Endpoints/{ClubEndpoints,MembershipEndpoints}.cs`, `Contracts/ClubContracts.cs`, `Models/{Club,ClubMembership,ClubWorkflowStatuses}.cs`, `Data/ClubDbContext.cs`, `src/Services/AuthService/Data/AuthDbContext.cs`, `src/Gateway/ApiGateway/yarp.json`. None contains persisted pins or self withdrawal. Directory/logo reads already exist; do not invent another upload route to display existing images.

## Existing self membership read: minimum compatible extension

Extend GET `/api/clubs/me/memberships` rather than forcing a new inbox service. Keep existing compatibility fields. Add:

```json
{
  "id": 41,
  "clubId": 123,
  "clubCode": "FPT-TECH",
  "clubName": "Câu lạc bộ Công nghệ FPT",
  "logoUrl": null,
  "status": "PENDING",
  "source": "APPLICATION",
  "requestedAtUtc": "2026-10-13T02:00:00Z",
  "reviewedAtUtc": null,
  "canWithdraw": true,
  "canAcceptInvitation": false,
  "version": "opaque-v1"
}
```

Status may retain the existing server casing while FE normalizes it. `source` is APPLICATION or INVITATION; legacy ambiguous rows must be UNKNOWN rather than fabricated. Only an authenticated owner of a pending submitted application can receive `canWithdraw:true`. Managers/admins do not receive impersonation rights. Invitations remain pending until consent and manager review; self withdrawal is not an invitation-decline policy. Unknown source cannot advertise an unsupported action. Backfill source from reliable creation/audit evidence; preserve fallback compatibility for unresolved legacy rows.

Code and logo come from canonical Club, including for a rejected or otherwise inactive application; the current active-directory join cannot always resolve such rows. Public reads must not reveal private membership records. Do not expose manager/member user ID collections merely to support navigation.

## Own withdrawal

Use only POST `/api/clubs/me/membership-applications/{applicationId}/withdraw`, no request body, existing FE method `withdrawMyMembershipApplication`. Canonical state machine, response, actor/audit, idempotency and unique active-record/reapply migration are owned by [D10](my-clubs-membership-api.md#required-withdrawal).

At commit verify principal ownership, APPLICATION source and PENDING state. Concurrent approve/reject versus withdraw must result in one valid transition; stale approval after withdrawal is rejected, and stale withdrawal after a decision returns 409. Retry after successful withdrawal returns the same canonical WITHDRAWN result. Do not map self withdrawal to manager DELETE, REJECTED or INACTIVE. Retain submitted answers and history, and allow reapply under the active-record uniqueness rule.

FE already contains the withdrawal action/refresh flow. It currently stays disabled because the inspected response lacks `canWithdraw`; adapter now consumes an authoritative true flag only for pending non-invitation rows. After deployment, wire explicit source/capabilities and verify the response plus subsequent self read, not merely the presence of a button.

## Application display policy: seven days

- Sent PENDING applications remain visible without an age limit.
- APPROVED/REJECTED results remain visible while `reviewedAtUtc <= now < reviewedAtUtc + 7 * 24 hours`. This is elapsed time, not seven calendar midnights. Stored timestamps are UTC; user-facing dates use Asia/Saigon.
- Exactly at the seven-day boundary the result disappears from the inbox. Missing/invalid review time cannot establish freshness; do not substitute request time, update time or browser observation time. A future decision timestamp is invalid for display.
- WITHDRAWN/INACTIVE are excluded from this short inbox. This display policy does not delete approved memberships, change workspace access or purge application history.
- Invitations use a separate section and are not treated as sent applications. The seven-day rule applies to sent application outcomes; no invitation expiry/decline is invented.

Current FE filters the full self-membership response and schedules removal at the next deadline. This is already possible with existing review dates; a new backend endpoint is not required for the current unpaged flow. If the optional D10 `/me/membership-applications` projection is implemented, add `view=INBOX|HISTORY`, server `asOf`, source, stable ordering and filter **before** server paging; do not shorten the generic membership read needed by profile/access views. Review/source backfill must retain known truth and leave genuinely unknown dates null.

## Durable pin preferences: selected future replacement for local pins

This is a preference-sync upgrade, not a prerequisite for the current browser-local pin UI. Store pins in ClubService as `UserClubPin(userId, clubId, pinnedAtUtc)`, unique `(userId,clubId)`. User ID always comes from the principal; club ID is the existing positive integer. Do not store labels, logo URLs, roles or workspace authorization in preferences.

| Route | Semantics |
| --- | --- |
| GET `/api/clubs/me/pins` | Return `{items:[{clubId,pinnedAtUtc}],asOf}` for the current principal; ordered pinnedAtUtc ascending then clubId |
| PUT `/api/clubs/me/pins/{clubId}` | No body; idempotently pin an active club currently accessible through active management or approved membership; return canonical pin, preserve original pin time on retry |
| DELETE `/api/clubs/me/pins/{clubId}` | No body; self-only removal, 204 even when absent; must allow removal after membership/access loss |

GET projects only currently accessible active clubs; a pin never grants workspace permission. Pin write rechecks eligibility in a transaction and enforces unique concurrent writes. Existing hidden pins may be retained as preferences; access/read checks always apply, so revoked access never shows a stale workspace shortcut. Global admin status alone does not manufacture a My Clubs membership. Server join/approval/management changes remain authoritative. Gateway's existing `/api/clubs/{**catch-all}` route can forward these paths; verify static `/me/pins` precedence against numeric club routes.

On FE integration: hydrate pins through the existing `api.js` facade, keep account/request isolation, refresh on account/access changes, and rollback/show failure for rejected writes. Browser storage can cache preferences, but cannot override server access. Existing local pins may be imported only after explicit user review; never bulk-upload another account's keys, fixtures or unauthorized clubs. No automatic migration is implied by this contract.

## Optional selection metadata, no duplicate role model

Current switching/card/rail can compose `/me/access` + `/api/clubs` without a new endpoint. Current display role maps manager to CLUB_OWNER, treasurer to TREASURER, otherwise MEMBER. Rich governance group/duty display comes from D06 when implemented; keep display labels independent from access capabilities. Pin state must not alter role/manager gates.

Optional D10 selection DTO may include `{clubId,clubCode,name,logoUrl,displayRole,role,capabilities}` and authorized upcoming/pending metadata. A null/empty logo falls back to the **full server clubCode**, never initials from club name. Font, alignment, icon choice and green/red/yellow status badges are FE concerns and need no BE endpoint. Branding changes also need no backend work.

## Acceptance and delivery order

1. Add source/capability/version metadata and safe code/logo to self memberships; test invitation versus sent pending requests and two-account privacy.
2. Implement D10 persisted withdrawal, migration/history and active-record uniqueness; test owner/non-owner/admin impersonation, duplicate retry, approve/reject race and reapply.
3. Test pending age independence; approved/rejected just before, exactly at and after seven days; UTC/offset equality, missing/future review dates, and preservation of approved access/history.
4. Add durable pins only when deploying preference sync: reload/cross-device persistence, two-account separation, duplicate/concurrent pin, unpin retry, revoked membership, inactive club, stale logo/name/code, refresh/outage and Gateway verbs.
5. Integrate FE after deployment; remove reliance on guessed invitation flags and treat server as preference authority. No local API/source audit establishes live functionality.

</details>
