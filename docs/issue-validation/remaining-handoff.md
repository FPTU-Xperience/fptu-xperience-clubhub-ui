# FPTU-Xperience — remaining issues and new-chat handoff

## Current release — 2026-11-05 (supersedes the historical open statuses below)

UI correction after user review: [restore the established rewards layout and separate club/personal XP views](2026-11-05-rewards-points-ui-restoration.md). Real credit integration must preserve the existing presentation. Managers have two points tabs; spendable credit is separate from achievement XP.

The approved queue is implemented, tested, committed, pushed and deployed across API, ClubHub UI and Admin UI. [Final source, CI, deployment and online evidence](2026-11-04-queue-rescan.md#final-release-evidence--2026-11-05) records exact revisions and limits.

- C06: real QR image/camera/file UX and registered-public-user manual attendance implemented. User explicitly retained blocking until an approved scoring policy exists; deferred scoring is a settled product rule, not queued work.
- C08: real club credit wallet, immutable verified-XP delta bridge, redemption/ownership/debt and graphs implemented. One verified XP becomes one credit of the same club; XP/radar is never spent. Reversals preserve debt/history and block further redemption, including free items.
- A03/A06: authoritative campus/inspection source integrated, current actor/campus and stale scope checks retained. Roster identity and approved membership are real source data. Major/cohort without an authoritative source stay explicitly unavailable.
- C12: actual semester governance groups, multiple assignments/permission union, immutable history and report snapshots, scoped specialist operations, independent CTSV vice decisions and protected ownership transfer implemented. Legacy treasury duty is reconciled with group duty and its two-person limit. Declaration processing remains outside this implemented specialist catalog and is not granted by a preview checkbox.
- UI deployment 41956419733 / source `537fa59`; Admin 41955136997 / source `20cd2bc`; API product source `ae9e871` with successful ordered recovery rollout 41955930054. All consumers updated before ClubService. Original manual-only API workflow restored at `a32a86e`.
- Validation: 1,058 full SQL API tests, 330 UI tests, 130 Admin tests; final independent online browser rerun passed at desktop/mobile. API health 200, expected entry assets 200, protected routes 401, trusted localhost rules rechecked. Synthetic browser API traffic was fully isolated; real-account acceptance is not claimed.

The remainder is historical handoff context. It does not reopen settled choices or represent current queue status.


Audited 2026-11-03 against current remote branches. Read this file and linked issue validation evidence before implementing. This is a handoff, not proof that remaining code has been implemented.

## Continue instruction
Continue IMPLEMENTING approved issues one group at a time. C03 + C07 were released and validated on 2026-11-04; see [release evidence](2026-11-04-c03-c07.md). C04 Admin pagination/navigation persistence was subsequently implemented and deployed; see [C04 evidence](2026-11-04-c04.md). C06 supported session flow was implemented/deployed and validated; see [C06 evidence](2026-11-04-c06.md), retaining its incomplete boundaries. C10+A04+A05 was explicitly resumed by the user and implemented/deployed; see [formation evidence](2026-11-04-c10-a04-a05.md). Continue downward: C08 is contract-blocked; audit A03 next, followed by A06/C12. C02 cancellation and C12 compatible role restoration were implemented/deployed after the user selected them; see [C02/C12 evidence](2026-11-04-c02-c12.md). Extended/custom/multiple roles remain unsupported. Finish validation and issue evidence before proceeding to the next group. Commit, push and deploy are already authorized. Do not ask again about settled product decisions. The earlier C10+A04+A05 parked instruction is superseded by the user's 2026-11-04 request.

The current toolset has no operation to create/fork a ChatGPT conversation. User must use the application's Fork/Branch/new-chat UI. No new chat was created by the agent.

## Approved addon — event registration cancellation (2026-11-04, Asia/Saigon)

Status: implemented/deployed for the supported cancellation contract on 2026-11-04; see 2026-11-04-c02-c12.md. Keep the approved behavior below.

- Keep the existing button label **“Đã đăng ký”**. Do not replace it with a separate visible “Hủy đăng ký” button.
- The registered button must be clickable when cancellation is supported; clicking opens a cancellation confirmation modal. Clicking it must not immediately mutate registration.
- Modal clearly identifies the event, provides a confirm-cancellation action and a keep-registration/dismiss action.
- Dismiss/keep registration causes no cancellation request or state change.
- Only after confirmed successful API cancellation update registered status/detail and personal schedule from authoritative server state. A permitted subsequent registration can show “Đăng ký tham gia” again.
- On cancellation failure keep the registered state and display the actionable error. Guard duplicate submissions/loading and stale account/activity responses.
- Inspect actual backend cancellation support and eligibility/cutoffs first. Add backend persistence/authorization if necessary and testable, following API AGENTS.md. Do not invent an endpoint or implement client-only cancellation.
- Maintain capacity/counter consistency and account ownership on the server. Preserve attendance/evidence/history according to the real contract; do not silently erase them or invent XP/refund rules.
- Validate confirm/dismiss, successful cancellation plus reload, failed cancellation, account ownership, schedule reconciliation and capacity/concurrent requests where supported.
- Existing approval for implementation, commit, push, deploy and testing applies. Keep issue-scoped evidence. The cancellation addon did not originally unpark C10+A04+A05; the user later explicitly resumed that group on 2026-11-04.

## Repositories and current working branches
- ClubHub UI: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui ; fix/approved-issues-20261103. Head at audit: 587ac6eb7768af8667a68329aaa89d392256e90b.
- Admin UI: https://github.com/FPTU-Xperience/fptu-xperience-admin-ui ; fix/approved-issues-20261103. Head: 73326f9d8474003c61760278cca21c263ef4b787.
- API: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api ; cuongnk/implement-api-contract. Head: cc73e63ac9cb3ac32a404b09bf95e84acb92866b.
- Always re-read remote heads before writing and use expected_sha leases. Do not overwrite another update.
- API main is stale. Do not deploy feat/complete-demo-dataset: it includes unrelated dataset/schema work.
- E:/FPTU-Xperience is not available in this cloud environment; executor reports unavailable. Earlier unrelated local documentation changes were never imported. Do not claim local tests.
- Connected GitHub file/tree/commit/ref/Actions APIs work. GitHub Actions provides the working build/test/SSH/deploy environment.

## Audit: remaining work
| Group | Status / next action |
|---|---|
| C03 + recruitment part of C07 | Implemented/deployed 2026-11-04. Join persists PENDING application; current event manager/eligible HOST reviews, no self-review; assignment only on approval with version/idempotency/current eligibility/capacity/concurrency checks. Workspace queue and minimal public HOST/STAFF projection shipped. See release evidence; real-account acceptance remains unverified. |
| C04 | Implemented/deployed for audited supported lists 2026-11-04. Admin page/filter/sort URL persistence, detail return state, embedded member pagination, club/inbox pagination, users beyond first 500 and real audit server pagination. 125 tests and production browser checks passed. Work inbox stays an explicitly bounded preview; declaration text search is current-page only. See C04 evidence; real-account acceptance unverified. |
| C06 | Supported approved-source session flow implemented 2026-11-04: manager session controls/manual roster and student signed-code/GPS check-in. Keep “chưa implement điểm danh hoàn chỉnh”: deferred-scoring activities cannot create sessions; QR scan UX, outside-member manual roster and real-account acceptance remain open. See 2026-11-04-c06.md. |
| C07 evidence | Implemented/deployed for the supported contract: persisted references to visible same-activity resources, scoped evidence links, server canSubmit, submission/independent verification and recruitment approval integration tested. No invented student upload permission; content/links and existing resource upload flow retained. Submission/verification awards no XP while scoring is deferred. See release evidence; real-account acceptance unverified. |
| C08 | Open/blocker on authoritative redemption contract. Current reward-lifecycle.js still uses localStorage. No reward/redemption endpoint/model found in current production-source API tree. Existing display cannot be treated as authoritative stock, eligibility or balance. Need real contract before claiming production redemption. Include “Chưa mở đổi”, time zone and opening/closing boundaries when implementing. |
| C10 + A04 + A05 | Implemented/deployed 2026-11-04 after explicit user resumption. Required creation fields plus Viết tắt/code; optional profile fields in approved workspace; own queue/revision/resubmit, canonical identity/campus, correct CTSV mappings and explicitly chosen manager with atomic/versioned/idempotent approval. See 2026-11-04-c10-a04-a05.md; real-account acceptance unverified. |
| A03 | Keep user-requested “chưa implement campus” in semesters/student-list scope. API has partial campus support; full integration and honest UI state remain to verify. No fake selector, taxonomy or new campus authorization. |
| A06 | Partial. Radar fields mapped to real response with identity/stale checks and zero retention. Existing major/cohort/membership fields still need authoritative data-source audit; do not add modal fields or manufacture missing data. |
| C12 | Supported role restoration implemented/deployed 2026-11-04: real minimal role directory, separate read/write, MEMBER/TREASURER assignment/revocation, owner protection, slot/version/idempotency/concurrency and effective access refresh. History audit found the expanded governance was a preview/proposal; extended/custom/multiple roles remain unsupported. See 2026-11-04-c02-c12.md. |
| C02 addon: cancellation | Implemented/deployed 2026-11-04. Keep “Đã đăng ký”, confirm/keep modal; own versioned cancellation before start/attendance, preserved row/history, consistent seat reuse, reload and stale-account guards. See 2026-11-04-c02-c12.md; real-account acceptance unverified. |

## Already implemented / preserve
- C01 full display names, not username/last-word greetings.
- C02 student public registration based on IsInternal, same-campus public outsiders and approved internal membership; backend write/read consistency for nullable registration windows and LEGACY.
- Members read activity detail inside workspace using student capability DTO; modify operations remain separately gated.
- Workspace navigation appears only for actual matching approved membership and canonical directory club code.
- Public detail tabs refetch per transition; stale requests ignored, current tab retained.
- Registration exists only in detail, removed from activity directory.
- API isRegistered comes from persisted current-user ActivityParticipants, not inferred from canRegister=false. “Đã đăng ký” survives reload; successful-registration “Máy chủ...” sentence removed.
- Personal schedule uses paginated authenticated /api/users/me/activity-history; includes confirmed public registration outside own clubs, real session times, excludes ended/cancelled/completed occurrences.
- Both club navigation links retain original identity-header placement; only registration sits below metadata.
- Latest spacing: identity bottom padding 12px; metadata-to-registration and registration-to-tabs gaps 12px. Do not move both club links downward again.
- C05 notification preload latest six, explicit refresh, account isolation; panel styling/scrolling/loading/error handled. No automatic mark-read.
- C09 hide/show shape on three cover editors; retain selected image/shape configuration; do not overstate server metadata persistence.
- C11+A01+A02 logout pages, forbidden student Admin flow, normalized errors. Both UIs use API-driven expiry modal; no session polling/focus polling. Preserve working CTSV SSO, demand-driven refresh and actual logout revocation.

## Latest deployment / validation evidence
- UI spacing source: 011ca66db5d0ba80c8c6b06f07f82fc9d04c808f ; deployment https://ac30f023.fptux-clubhub-ui.pages.dev.
- UI source/build run: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41676017266 (312 tests and build preview passed; deployment succeeded; first online browser timeout before API requests).
- Separate online verification succeeded: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-ui/actions/runs/41676739797 . Production expected entry index-CG1OEQWD.js, assets 200, API health 200; 12 browser scenarios measured 12px before/after registration. Includes reload registered state and navigation placement. Browser API traffic was intercepted; no real-user registration performed.
- API source: a25f6ef42e2fb6557fed5fd54157530ece6b58d5 ; live ActivityService image sha256:72b8e7463a638b7beeb415b956c274a5862f653e553e2985910463217c989dcc.
- Full API CI: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/actions/runs/41671908565 — 1014 tests, zero failed/skipped; quality, Admin image and eight model/migration checks passed.
- API deployment: https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/actions/runs/41671954570 — targeted ActivityService rollout, health endpoints 200, anonymous protected endpoints 401.
- Admin auth/session release evidence is in Admin docs/issue-validation/2026-11-03.md (118 tests, deployment 41594312611).
- Real signed-in student/CTSV end-to-end acceptance remains unverified. Builds, fixtures, anonymous smoke and image checks are distinct from real-account validation.

## Historical C03 source evidence (superseded by 2026-11-04 release)
- API src/Services/ActivityService/Endpoints/ActivityStaffingEndpoints.cs:
  - Map exposes staffing, assignments/completions, recruitment positions join, club recruitments; no application approval routes.
  - Join creates ActivityStaffAssignment immediately and audits JOIN_POSITION.
  - Get currently filters assignment visibility by privileged/verifier/self; requested public HOST/STAFF projection requires intentional API design without leaking private evidence.
- UI src/services/activity-staffing.js uses these real routes; inspect all ActivityStaffingPanel callsites and workspace tasks/contributions integration.
- Resource create/upload capability handling already exists; do not replace it with fake upload.
- Existing earlier .NET process-metadata blocker in root tracker is obsolete: Actions now runs full SQL Server integration validation. It is not a reason to leave C03 unimplemented.

## Mandatory workflow constraints
- Read applicable AGENTS.md before editing. API requires actual GitNexus query/context/impact before changing functions/classes and detect-changes --scope all before source commit.
- GitNexus CLI works in Actions (1.6.12). Use exact symbol UIDs to disambiguate; UNKNOWN is unresolved. Warn before HIGH/CRITICAL changes. Confirm unresolved graph results with source references.
- Index process budgets/receiver resolution have limits; do not call an index-wide truncated graph complete. detect-changes partial/truncated is not clean and must be rerun.
- Do not create more diagnostic/deploy workflow files. Use existing .github/workflows/deployment.yml temporarily, then restore workflow_dispatch-only. Current API has only backend-ci.yml, backend-validate.yml, deployment.yml; six garbage workflows/history were removed and sidebar checked.
- UI deployment workflow validates source, actual component browser scenarios, production build preview, deploys using Cloudflare's configured production branch, then checks actual deployed bundle/UI. Wrangler installation prunes unsaved Playwright: restore browser dependency after deploy (already fixed in workflow).
- Backend: never build the whole stack on VPS. Build only required service images on Actions; transfer docker-save archive, rollout targeted service with --no-build --no-deps and explicit rollback image. Preserve real runtime env from running containers without printing secret values. Prior working targeted template is API commit 0d05ba5f81e9e618361f9f0d307c8565950ebd47 (.github/workflows/deployment.yml).
- That template preserves Compose project/workdir/config-file/network labels, JWT/internal/attendance/Redis/SQL/frontend values; SQL password parsing must preserve connection-string quotes. Do not run Compose without these preserved settings.
- Gate rollout on exact source full CI success, check live image ID, health and authorization. Do not rotate secrets or change production allow-lists/accounts.
- No broad disk/cache cleanup or unrelated deploy maintenance; user explicitly said to just deploy.
- User wants phone notification on real blocker if supported; automation creation is not proof of push/SMS delivery. Never claim delivery without receipt.
- No messages to other people, no unsolicited account activation, no fake data/persistence.
- Keep issue-scoped commits and durable validation notes. Continue sequentially; ask only for actual missing product decisions, with evidence/options, while progressing independent work.

## Continuation after the completed release

Do not restart implementation of the completed queue or re-ask its settled policy decisions. Read the current-release section and final evidence first. Product source, CI, deployment, remote parity and real-account acceptance remain separate evidence categories. Future real-account acceptance needs an explicitly authorized student/CTSV session; do not enable accounts or invent credentials. Preserve the required-only club creation form plus Viết tắt/code, canonical semester/campus authority, approved scoring gate, event registration/cancellation behavior, scoped governance and the real XP/credit ledger boundaries. API `AGENTS.md` and existing-workflow-only constraints remain applicable to future work.
