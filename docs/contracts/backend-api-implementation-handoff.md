# Handoff BE/FE theo phiếu đăng ký v1.4 — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: BE implementation tracked by handoff; whole contract is incomplete

Backend Progress: PARTIAL

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#overview).

**Đã có BE:** Các handler trong nhóm 16 consumer thiếu route ban đầu đã có; hoạt động vận hành, roster/invite, lịch học, self fields/media cơ bản và EMBED có persistence.

**Chưa hoàn thành / giới hạn:** Không đồng nghĩa toàn bộ contract Done: điểm hoãn, governance, file resources/cosmetics và live acceptance còn mở.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Handoff BE/FE theo phiếu đăng ký v1.4 — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| Actor tính chính | Hoàn thành | Chưa hoàn thiện | Chưa triển khai | Còn việc |
| --- | ---: | ---: | ---: | ---: |
| Sinh viên | 32 | 0 | 0 | 0 |
| Quản lý CLB | 23 | 1 | 0 | 1 |
| Người xác minh | 5 | 3 | 0 | 3 |
| Quản trị hệ thống | 4 | 6 | 0 | 6 |
| **Tổng 74 operation** | **64** | **10** | **0** | **10** |

**FE có thể tích hợp:** 32 operation Sinh viên, gồm discovery/recommendations, summary/history, contribution/declaration paging và calculation history, radar PERIOD/CUMULATIVE, nhiệm vụ theo trục thấp và join CLB; cùng 23 API Quản lý CLB đã hoàn thành. **Còn việc trong mốc 74:** Quản lý CLB 1, Người xác minh 3, Quản trị hệ thống 6. API-033/SUP-02 còn thiếu đường đọc version cho manager; các phần BỎ QUA và lịch sử giữ nguyên. Hoàn thành BE không đồng nghĩa màn hình FE/deployment đã xong.

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ — BẮT BUỘC; thay thứ tự triển khai cũ.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

## Bắt đầu và căn cứ

Đọc [bảng trạng thái BE ngày 13/10](be-api-status.md) và [hướng dẫn tích hợp thực tế](be-integration-guide.md), rồi [scope](capstone-scope-contract.md), [register](frontend-api-debt-register.md), [scoring](experience-scoring-contract.md) và topic contract. Baseline 12/10 là80818266; lần triển khai Quản lý CLB nằm trong working tree mới. Nhãn BE ở đầu file phản ánh tiến độ hiện tại; checklist phụ thuộc bên dưới là yêu cầu/việc tích hợp, không tự đánh dấu FE hoặc deployment đã hoàn thành.

## Công việc theo phụ thuộc

1. [ ] Tài khoản register/login nội bộ và self profile; admin accounts/roles/club/semesters; capability và phân công verifier. D15/D17, [quyền](internal-accounts-verification-api.md). Dev-login không chứng minh password login hoàn thành.
2. [ ] CLB công bố/gia nhập/trạng thái/vai trò tối thiểu; profile/basic media, activity publish/close/cancel/eligibility và buổi lặp có ID. D01/D02/D04/D06/D10/D11/D12/D20. Không yêu cầu đủ8 chức vụ, form builder hoặc roster trường.
3. [ ] QR30s, window/geofence và fallback manual/online; registration/attendance source identity dùng chung. D16, [attendance](activity-attendance-api.md).
4. [ ] Evidence riêng tư, review assigned/no self, revisions, role upgrades giữ điểm cũ khi bị từ chối; append ledger/unique source/outbox/reversal. D07/D17, [contribution](verified-contributions-api.md).
5. [ ] Chốt P01–P06 với giảng viên trong tài liệu thiết kế; policy/formula versions, vector tối đa3/7, semester/cumulative snapshots, radar6/+1/ERI, tiers/title/breakdown. D03/D18, [scoring](experience-scoring-contract.md). Cấu hình chưa duyệt chỉ demo.
6. [ ] Rule recommendations theo trục thấp/đủ điều kiện/giải thích, chọn nhiệm vụ và completion do verified contribution; không mint lần2. D11/D07.
7. [ ] Kế hoạch mục tiêu kỳ, unique/first-time/role/pillar statistics và PDF snapshot protected; không budget. D19, [plan/report](club-semester-plan-report-api.md).
8. [ ] Notifications đủ4 nhóm trong phiếu; hardening personal writes/quest target/read-time seeds/category/attachment/paging cho workflow giữ. D14; API→DB→FE, đo tải activity list/check-in, migration/deploy/install docs.

Mỗi task chỉ xong khi có source/migration/tests/Gateway/FE proof. Không dùng mock/localStorage hoặc route declaration làm acceptance.

## Ma trận nghiệm thu hiện hành

- [ ] Bốn actor, cùng/khác CLB, self/other, verifier được/không được giao, revoked/locked/expired; không self-review kể cả admin.
- [ ] Register→join→activity registration→QR hoặc manual→review→ledger→radar→quest completion→notification→PDF; reload/restart còn dữ liệu.
- [ ] Chín ví dụ PDF, vector/semester/precision, upgrade reject giữ điểm, unique source/race/replay, correction/history, đổi policy không sửa kết quả cũ âm thầm.
- [ ] Empty/unconfigured/error, paging trên100, QR/GPS/online, service/outbox failure, private download và không lộ PII.
- [ ] Đo tải với kịch bản/số liệu rõ; bàn giao API, migration, config, automated tests và hướng dẫn cài lại.

## BỎ QUA trong checklist cũ

Roster/carry-forward trường, timetable/academic blocks/FAP/OJT integration, wallet/redeem/rewards/PNG bundle, finance/settlement/nguồn lực, competitive leaderboard/public directory, ML/schedule matching, radar trường/anomaly automation. Không chờ chốt giá quà/issuer FPT-DEV/nợ ví/O-04 roster để nghiệm thu MVP.

[Page checklist](page-integration-checklist.md) ghi luồng hiện hành. Các wave0–5 và open choices dưới đây là lịch sử, không còn yêu cầu bắt buộc.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Backend API implementation handoff

Historical Implement Status: Not Yet

Historical Status Scope: Backend work tracked by this handoff

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: The dependency waves remain open: own withdrawal, media/profile, governance, semester roster, credit/rewards, discovery and timetable persistence are absent or incomplete in the source contexts/endpoints.

Updated 2026-10-13 for the next BE batch. Start with [contract lifecycle audit](contract-lifecycle-audit.md), [debt register](frontend-api-debt-register.md), [declaration inventory](api-declaration-inventory.md), and [shared conventions](api-contract-conventions.md). API baseline: remote main and local HEAD both **80818266f617bd5144ab1b1a6cd0e74983983a4d**, checked 2026-10-13. Frontend session commit b9832cd and later uncommitted branding updates were inspected; no backend source was changed. Recheck main before implementation and reconcile any new routes, migrations and permissions.

## Contract precedence and decisions

This handoff/register plus the dated updates in topic contracts supersede the 2026-10-05/07 audit conclusions. Topic contracts own exact payload/state rules; conventions own errors/paging/idempotency. Existing feature specs retain `/api/v2/activities/feed` and recommendation paths; do not invent another feed namespace. Personal profile has one canonical GET/PATCH `/api/users/me/profile`; the old proposed PUT/fullName-only and student-profile aliases are superseded. Preview and Cancel never write; actual Save writes once. Never replace production V2 with demo fixtures.

Reuse Admin semester persistence and declaration/radar/quest infrastructure. Club member roles are organizational, not global auth roles. Personal data is self-managed even for full club leadership. R2 remains the chosen storage with public r2.dev delivery; Cloudflare Images is not selected. Existing/common styles free; paid individual/background/shape/bundle redemption is in club store, while editor shows independent color/shape entries. Text is draggable and 24..240px; PNG shape overlays remain independent of image background.

## Dependency waves and executable tasks

Every unchecked task requires code/migration/tests plus FE integration; checking a route declaration alone is insufficient.

### Wave 0 — baseline and shared authority

- [ ] Fetch main, inspect API AGENTS.md and graph/index tooling; compare against pinned snapshot. Work on an isolated branch/worktree, retain existing local API docs modifications.
- [ ] Capture current service tests, migrations and Gateway routing baseline; classify source/test/deployment separately.
- [ ] Define reusable principal/campus/club capabilities and API error/version/idempotency contract. D06 capability design precedes specialist grants; preserve current manager/treasurer operation until migration.
- [ ] Fix D14 cross-user member-profile write and unsafe quest target verification before enabling new specialist writes/credit.

### Wave 1 — self data, media and club page (D01, D02, D04)

- [ ] Implement canonical self profile persistence, GET/PATCH, private academic/read-only metadata, onboarding completion/preferences; [self contract](self-profile-sync-api.md).
- [ ] Implement media intent persistence/signing, verified object attach and cleanup, Gateway /api/media, R2 CORS/read domain. Avatar/background/transparent shape use distinct scopes; [media contract](public-image-api.md).
- [ ] Add club cover field/mappers/migration, authorized public-images PUT, activity cover field/PUT. All attachments validate actor/object purpose/owner.
- [ ] Implement public-profile PATCH with persisted category validation, partial text state and structured 30-minute weekly schedule; [club contract](club-public-profile-api.md).
- [ ] Remove legacy manager personal-profile mutations; project canonical user fields and immutable applicationSnapshot in member list/detail.
- [ ] Replace local profile/IndexedDB repositories through existing FE facade; deliberate local import review only. Test shared projection/privacy and saved cover preview parity.

### Wave 2 — semester roster, invitations, roles and own applications (D05, D06, D09, D10)

- [ ] Implement one scoped [workspace semester catalog/context](workspace-semester-context-api.md) from existing Admin semesters; provide explicit activity bounds, report Period and invitation aliases. Header is the only selector; reconcile governance/invitation catalogs rather than create competing authorities. Define finance attribution and term-indexed club schedules before claiming every tab is semester-filtered.

- [ ] Add roster revision/import preview+commit/read and audited carry-forward linked to existing semester. [Roster](semester-student-roster-api.md), [invites](club-member-invitations-api.md).
- [ ] Add protected internal eligibility reads and manager/HR semester options/eligible-member lookup. Upgrade existing invite/consent/approve with authoritative identity/source/revision; outbox recipient notifications.
- [ ] Implement [canonical governance groups contract](club-governance-groups-api.md): authoritative term + immutable structure revisions, capability/preset catalog, multi-group specialist assignments and atomic ADD/REMOVE/TRANSFER; preserve owner/two-treasurer rules across custom groups.
- [ ] Persist each intra-term promote/transfer/demote/group-permission change with before/after personal events and assignment intervals in the same transaction; include system expiry/member-departure/revocation and history reads after demotion.
- [ ] Implement independent term report submissions with exact-version snapshots and supplementary history; submission never grants/revokes rights and has no whole-BQL review gate.
- [ ] Implement CTSV-approved vice appointments; reuse existing owner transfer workflow; protected leadership cannot be granted through custom groups. Synchronize shared access, Finance/Report/Activity action policies/recipients, cache invalidation and legacy role-writer cutover.
- [ ] Replace DEV-only governance rehearsal with authoritative facade adapters/approved-member paging/capability gates after BE verification; do not migrate synthetic people, sample semesters or browser grants.
- [ ] Implement self withdrawal/history, authoritative source/canWithdraw/version and active-record uniqueness/reapply; optional richer My Clubs reads only if replacing composed adapters. [My Clubs](my-clubs-membership-api.md).
- [ ] Extend semester with admin calendar block dates and safe student projection, implement private weekly timetable and transactional template import. [Study schedule](study-schedule-api.md). No second semester table.
- [ ] Wire Admin roster/calendar and ClubHub invite/timetable UI; two-account consent must still await manager approval.

### Wave 3 — contributions, wallets, gifts and personal experience (D03, D07, D08)

- [ ] Add published task/submission/evidence/review history and no-self-review; unique server award and outbox. [Contributions](club-contributions-points-api.md).
- [ ] Implement immutable per-club credit wallet, ledger, summary, safe points/badges reads. Raw budgets, XP and money do not become wallet credit implicitly.
- [ ] Implement reward catalog/write/asset publication, inventory and atomic idempotent debit+grants. [Rewards](profile-cover-rewards-api.md). Bundle grants unlock both separate editor choices; do not import sample entitlements/200 balances.
- [ ] Reuse declaration/radar reads and add private activity/contribution summary/history projections; [personal experience](personal-experience-api.md). No duplicate raw scoring engine.
- [ ] Replace unavailable Quests/Points tabs and local Gifts/Cover repositories with authoritative API reads/mutations; preserve empty/error states.

### Wave 4 — discovery and specialist event operations (D11, D12)

- [ ] Implement profile-style activity detail media/document/embed projections and owned upload-intent/commit pipeline; enable `resourceCapabilities` only after deployed verification. Keep public viewer and workspace manager contracts separate. [Activity profile/resources](activity-profile-resources-api.md).

- [ ] Add auditable publication/visibility with default CLUB_ONLY, privacy-safe paged feed/direct detail and server-clock UPCOMING/LIVE; [discovery](activity-discovery-api.md).
- [ ] Route authenticated recommendations via Gateway, use private preference input internally, isolate engine outage and label curated fallback.
- [ ] Add scoped content PATCH, staff assignment and versioned registration form/application/review/withdraw/capacity integration; [event operations](club-event-operations-api.md). Reuse participant/attendance records.
- [ ] Wire FE adapters without broadening membership/private-roster reads or granting global manager roles to specialists.

### Wave 5 — compatibility and release verification

- [ ] D14 canonical manager lookup, custom category round-trips, private attachment DTO, existing query pagination and author deadlines; [hardening](existing-api-hardening.md).
- [ ] D13 opt-in public directory only if explicitly enabled; [optional directory](public-member-directory-api.md). Ordinary member roster remains leaders/count otherwise.
- [ ] Update FE API/page audit and this register per completed capability, with commit/test/gateway evidence; remove provisional UI labels only after deployment verification.
- [ ] Execute acceptance matrix below and record unresolved cases. No backend-only duplicate endpoint creation for already implemented finance/report/notification/transfer workflows.

## Minimum test matrix

Use accounts for system admin, CTSV (two campuses), club owner, vice, Content, Event, HR, treasurer, approved member, pending applicant, invited student and unrelated user. Test own/other club and self/other person; revoked role; inactive/locked account; campus mismatch; expired session; empty/unconfigured state; malformed/unknown fields; stale version; concurrent duplicate; idempotent replay; transaction rollback; internal dependency/R2 outage; outbox duplicate delivery; pagination >100; persistence across reload/devices. Media must prove public read of a verified issued object; direct R2 PUT alone is not completion.

Run backend service/regression tests and migration upgrade path, then Gateway-backed calls and FE checks (`npm run test:demo`, `npm run test:club-page`, focused profile/media/invitation tests, build). Browser UI proof and API endpoint unit tests are separate. API test evidence was inspected but not executed in this audit; do not carry old FE build results forward as backend proof.

## Decisions still requiring explicit product binding before live rollout

- O-04 roster CSV/upload timing and identity matching: provisional parser schema supplied in roster contract; final CTSV policy can replace it without changing canonical preview/commit boundary.
- Semester alias mapping: catalog contains arbitrary codes; configure SP/SU/FA/year aliases and reject ambiguous mappings. Do not equate FA26, FA2026 and FALL2026 implicitly.
- Bind actual FPT Dev numeric club ID/catalog issuer. Provisional FPT-DEV code must never fall back to FPT-TECH.
- Credit correction after spending: the contribution contract proposes an auditable negative-balance debt with new-redemption lock; confirm before live rollout.
- Point award policy/configuration and real entitlement pricing: demo 120/160/200 and 200 starting balance are examples, not financial/credit authorization. Configure approved server policy before minting real points.
- Confirm campus-public activity publication policy; this contract defaults old records to private. Physical gift fulfillment and public member-directory opt-in remain optional extensions.

The handoff is ready for implementation planning; these choices are clearly isolated instead of silently claimed as already approved business rules. No secrets, deploy changes, issue comments or backend commits were created by this audit.

## Audit verification boundary

Routes, DTOs and handlers were inspected from an exported fresh-main snapshot. GitNexus runner/index tools were unavailable, so dependency/callflow graph analysis was not performed. Validation passed for 282 local links across 27 contract documents, 15 JSON examples, 95 public async wrapper enumeration and documentation diff whitespace; no backend tests, migrations, live authorization, database or R2 checks were run. The existing API checkout and its pre-existing documentation changes were retained.

## Session navigation/inbox batch — 2026-10-13

Scope includes the complete latest FE commit `b9832cd33f7d8e17c09982e68a5acca0fc2b21ce`, not just uncommitted follow-up edits. The [commit coverage matrix](club-navigation-applications-api.md#latest-commit-coverage) maps all 16 changed files to a BE obligation, an existing API to reuse, or presentation-only work. Imported parent `9321f84` was checked as well; CSS/markup/demo-loading changes add no new API writer.

- [ ] Follow [club navigation/applications](club-navigation-applications-api.md) for source/capability metadata, canonical code/logo and the seven-day display rule. Use existing reviewedAtUtc; hiding results must never delete approved memberships.
- [ ] Implement optional durable pins when cross-device preference sync is selected, with self-only reads/writes, unique user+club and current access revalidation. Browser pins currently remain temporary.
- [ ] Keep pin/role presentation independent of authorization; verify self withdrawal through the actual deployed route before enabling it.

</details>
