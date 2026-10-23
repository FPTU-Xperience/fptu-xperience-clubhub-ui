# Shared workspace semester — 2026-10-12

Implement Status: Not Yet

Status Scope: BE shared catalog read implemented; governance/finance attribution not complete

Backend Progress: PARTIAL_CATALOG_SOURCE_IMPLEMENTED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#workspace).

**Đã có BE:** GET /api/clubs/{clubId}/workspace-semesters và invitation-semesters đã có, dựa Admin Semester thật, alias year/term/reportPeriod tường minh, availability/current/permissions.

**Chưa hoàn thành / giới hạn:** Không suy kỳ từ tháng/code, nhiều kỳ active báo AMBIGUOUS. Read catalog không cấp quyền governance, không tự thêm semester cho Finance hay reset membership/điểm.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

# Shared workspace semester — 2026-10-12

Historical Implement Status: Not Yet

Historical Status Scope: Backend implementation

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: Admin SemesterEndpoints.cs requires BackofficeUser. No club-safe /semesters projection with configured activity bounds/report aliases, finance attribution or term-indexed schedules; shared FE selection is not server authority.

The workspace header is the single selector. Previously it was a static span; governance, invitations and club schedule editing used independent choices. `WorkspaceSemesterContext` now owns shared selection, keyed by authenticated account + club; tab navigation preserves it, switching club/account does not reuse another scope's selection. Every WorkspaceTabView receives selected metadata. No term/year selector belongs inside a tab or its modal.

## FE audit / current behavior

| Surface | Header consumption / BE boundary |
| --- | --- |
| BQL | Uses selected code to read its local revision/report/history; child is keyed by selection so dialogs and forms reset. No local selector. Existing development periods FA2026/SU2026 remain local, not real semester IDs. |
| Invitations | Uses explicit invitationCode from header catalog, read-only label; search/invite require matching echo. No independent year/term or browser-current default. Eligibility still needs the pending roster/invitation contract. |
| Club schedule | Uses header term/year in editing, no independent picker. Changing the header closes staged club editors. Existing scheduleLabel is one public field, not a history table; untouched text is not silently rewritten. Editing schedule fields writes the selected period. |
| Home/activities | Dashboard scope refreshes on selection; uses existing activity from/to only when valid authoritative UTC bounds exist. Otherwise display explicitly remains all-club. No guessed calendar dates. |
| Attendance | Lives in the selected activity's separate detail page, with no separate workspace tab or semester selector. Reads are keyed by account, activity, club, access mode and page. Attendance requests are activity-scoped; stale scope results are discarded. Direct details fetch the authorized activity by ID, including completed/cancelled records. The workspace manager page reads the club roster; the public-space viewer page reads only own attendance, including for managers. Backend remains authoritative. |
| Reports | Existing query supports exact Period; pass explicit reportPeriod mapping when supplied. Without mapping, label as all-club and preserve current authorized reads; never equate semester code with arbitrary report Period. |
| Finance | Refreshes under selected context, but source operations do not support semester filtering. Display remains all-club; BE must define attribution and query first. Creation date is not financial semester ownership. |
| Members | Roster/consent are continuous club membership; do not remove existing members at term rollover. BQL assignments and invitation roster are period-scoped, separately. |
| Tasks/points | Existing unavailable states remain; future period-aware reads consume the same context. Raw XP, club credit and money remain distinct. |
| Gifts | Club catalog/owned entitlements and wallet remain continuous unless product explicitly binds issuance to a term; no local semester control. |

## Required catalog / adapter metadata

Add scoped `GET /api/clubs/{clubId}/workspace-semesters`, using existing AdminService semesters. Reconcile with governance/semesters and invitation-semesters as projections of **one authority**, not competing catalogs. Current proposed governance semester route may be an adapter to this shared projection. Catalog comes through the existing FE API facade after implementation; no new provisional wrapper is called in this batch.

```json
{"items":[{"id":"00000000-0000-4000-8000-000000000001","code":"FALL2026","label":"Fall 2026","isCurrent":true,"editable":true,"canInvite":true,"startUtc":"2026-09-01T00:00:00Z","endUtc":"2026-12-31T23:59:59Z","reportPeriod":"FALL2026","invitationCode":"FALL2026","year":2026,"term":"FA"}]}
```

Dates/mappings above illustrate the schema, not approved semester configuration. Include term/year only via explicit alias configuration; no guess from arbitrary SemesterCode. Metadata must state endpoint bound inclusivity/timezone. Unknown/unconfigured period mapping yields explicit availability, not an inferred report filter. Validate club/campus scope, read authority and configured report windows; archived role authority remains separate from reading a historical term.

Production currently has no scoped catalog: header remains disabled until server metadata is provided; existing authorized all-club reads continue. Development uses a temporary two-period catalog shared with governance, with **no invented dates or reportPeriod**. Removing runtime test labels does not make that catalog Admin-owned. Extend My Clubs safe selection with semester metadata or load the scoped catalog before enabling production selection. Never broaden Admin semester backoffice policy to let club members mutate semesters.

BE follow-up: governance GUID/code binding; invitation options/eligibility; accurate activity term bounds; explicit Report.Period mapping; finance attribution/filter/paging; term-indexed public club schedule persistence; contribution/points semester rules. All new adapters must invalidate scope state/request caches, discard late old-scope responses and close stale mutation forms. Shared selection never grants manager/treasurer rights.

</details>
