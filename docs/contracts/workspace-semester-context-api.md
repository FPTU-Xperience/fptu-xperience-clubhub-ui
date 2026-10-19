# Shared workspace semester — 2026-10-12

Implement Status: Not Yet

Status Scope: Backend implementation

Source Review: 2026-10-19; backend b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf, fetched current branch and origin/main equal HEAD. Source audit only; live acceptance and service tests unverified.

Source Evidence: Admin semester list remains BackofficeUser-scoped. Club period plans/statistics/PDF now exist; manager-safe catalog/policy metadata and full period attribution still require a contract.

## Current reconciliation — 2026-10-19

Admin semester list remains BackofficeUser-scoped. Club period plans/statistics/PDF now exist; manager-safe catalog/policy metadata and full period attribution still require a contract.

The specification below preserves its original proposed scope. Older dated route-absence and local-only statements are historical where superseded above; use the current lifecycle/index before implementation. Remaining obligations keep this contract Not Yet.


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
