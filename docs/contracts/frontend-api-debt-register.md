# Register FE/BE theo phạm vi mới — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: FE integration/debt, separated from BE source readiness

Backend Progress: PARTIAL

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#overview).

**Đã có BE:** Nhóm 16 consumer operation thiếu route tại audit 21/10 đã có handler ở BE; manifest hiện 40 operation mới so với baseline b066f96.

**Chưa hoàn thành / giới hạn:** 16/16 là phạm vi route cũ, không phải mọi chức năng Done. Chuyển consumer lịch học/self media/EMBED và xử lý scoring deferred vẫn là việc FE.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Register FE/BE theo phạm vi mới — cập nhật 2026-10-12

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

**Quyết định: GIỮ — BẮT BUỘC; tái phân loại debt.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

## D01–D14 sau đổi phạm vi

| Debt cũ | Quyết định hiện hành | Phần còn phải làm |
| --- | --- | --- |
| D01 Media | GIỮ HỖ TRỢ; BỎ QUA club-shape/reward assets/complex cover | Basic images nếu UI hứa upload phải persisted/ownership; private evidence thuộc D17 |
| D02 Self profile | GIỮ BẮT BUỘC | GET/PATCH self/privacy; BỎ QUA onboard3 interests/FAP metadata/cosmetic layout như điều kiện nghiệm thu |
| D03 Experience | GIỮ BẮT BUỘC; thay DTO cũ | Six axes/+1, semester/cumulative, score/tiers/titles/breakdown D18; không wallet |
| D04 Club profile | GIỮ BẮT BUỘC | Scoped partial update/category; schedule label chỉ hỗ trợ, không thay session D20 |
| D05 Roster/invites | BỎ QUA roster trường; invite mở rộng CHƯA CẦN | Join/status D10 vẫn giữ; invite cũ nếu dùng resolve account dự án/consent, không school roster |
| D06 Club roles | GIỮ roles/capability tối thiểu; BỎ QUA đủ8 chức vụ | Manager/owner/member scoped; verifier tách D17; finance treasurer ngoài phạm vi |
| D07 Contribution/tasks | GIỮ evidence/review/ledger/nhiệm vụ; BỎ QUA wallet/leaderboard | [Verified contribution](verified-contributions-api.md); experience ledger, quest không mint lại |
| D08 Rewards | BỎ QUA NGOÀI PHẠM VI | Giữ nguyên lịch sử; không là MVP debt |
| D09 Timetable | BỎ QUA CHƯA CẦN/NGOÀI PHẠM VI integration | Semester configuration vẫn giữ F10/D18, không timetable/calendar mới |
| D10 My Clubs | GIỮ join/status/management | Rich cards/withdraw/reapply chỉ HỖ TRỢ, không mở school roster dependency |
| D11 Discovery | GIỮ safe feed/detail/low-axis rules | BỎ QUA ML/hybrid/sở thích/ghép lịch; authorized candidates trước ranking |
| D12 Event | GIỮ lifecycle/registration/conditions/evidence | BỎ QUA specialist/staff/form-builder; QR/session thuộc D16/D20 |
| D13 Public roster | BỎ QUA NGOÀI PHẠM VI | Club info công bố vẫn giữ; hồ sơ sinh viên/roster riêng tư |
| D14 Hardening | GIỮ security/integrity các workflow còn dùng | Personal/quest/seed/attachment/category/paging; finance phát triển mới BỎ QUA |

## Khoảng trống phải bổ sung theo phiếu

| ID | Yêu cầu | Hiện trạng snapshot nguồn | Contract |
| --- | --- | --- | --- |
| D15 | Đăng ký/đăng nhập nội bộ | AuthEndpoints chưa map password/public register; Google/dev-login/refresh/logout đã có | [Accounts](internal-accounts-verification-api.md) |
| D16 | QR30s/window/radius/manual/online | Check-in/attendance route có; chưa chứng minh đủ cơ chế mới, cần test từng điều kiện | [Attendance](activity-attendance-api.md) |
| D17 | Assignment/revisions/upgrades/private evidence/append ledger | Declaration review có; club verified-ledger workflow còn thiếu; legacy CTSV role không là assignment đủ | [Contribution](verified-contributions-api.md), [quyền](internal-accounts-verification-api.md) |
| D18 | Vector/policy versions/đúng kỳ/tích lũy/bậc/title/breakdown | Calculators có; radar hiện cộng declarations không lọc kỳ/một category; P01–P06 chờ duyệt | [Scoring](experience-scoring-contract.md) |
| D19 | Plans/unique/first-time/role/pillar/PDF không budget | Report/export/statistics hạ tầng có; cần rà DTO/definitions/snapshot/FE, chưa kết luận đủ | [Plan/report](club-semester-plan-report-api.md) |
| D20 | Publication/close/recurring session identity | CRUD/cancel có; scheduleLabel không đủ occurrence/attendance/source | [Activity sessions](activity-attendance-api.md) |

95 wrapper/87direct/2composed/6absent của audit cũ chỉ là kiểm kê facade trước đổi phạm vi, không là tỷ lệ hoàn thành phiếu. Route mới là ĐỀ XUẤT, cần API/DB/FE proof. [Handoff](backend-api-implementation-handoff.md).

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Frontend API debt register — 2026-10-09

Historical Implement Status: Not Yet

Historical Status Scope: Backend/integration debt tracked here

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: Regenerated facade inventory retains six absent operations and two composed reads. Topic resource/policy/persistence gaps remain; D10 now also references durable pin preferences and seven-day inbox behavior.

Current declaration recheck and contract cleanup: [lifecycle audit](contract-lifecycle-audit.md), [per-wrapper inventory](api-declaration-inventory.md). API remote main and local HEAD both **80818266f617bd5144ab1b1a6cd0e74983983a4d**, checked 2026-10-13 without modifying BE. The earlier detailed audit was 2026-10-09; its source-marker counts below are dated evidence, not current file/import counts.

The 2026-10-13 source recheck regenerates every current facade declaration and reviews all retained topic/spec contracts. The stale 2026-10-09 literal-marker snapshot has been retired; current route counts come from [declaration inventory](api-declaration-inventory.md). Source review does not verify deployed services, databases, migrations or authenticated integration.

API facade: **95 async public wrappers**, excluding `request`, `parseResponse`, `getErrorMessage`. Of these, **87 have direct declared backend operations**, **2 are composed reads**, and **6 target absent routes**. Direct existence does not imply DTO/authorization compatibility. Backend Admin semester/catalog/quest/declaration/radar routes are largely not represented in this facade yet.

| Debt | UI/source and current behavior | Latest-main classification | Owning contract / implementation outcome |
| --- | --- | --- | --- |
| D01 Media | `api.uploadPublicImage`, club/application/logo dialogs, profile IndexedDB, club transparent-PNG publication | Missing upload intent, club public-image write, activity cover and durable self images; no Gateway media route | [public-image-api](public-image-api.md): R2 r2.dev, verified issued objects, avatar/background/shape kinds and authorized attach |
| D02 Self profile and onboarding | `profile-data.js`, `EditProfileModal`, onboarding, own member projection; localStorage | Missing canonical self read/write; other members use application snapshots; legacy manager personal-profile PUT still exists | [self-profile-sync](self-profile-sync-api.md): one canonical GET/PATCH, cover layout/text, academic authority, onboarding, private club projection |
| D03 Personal experience | `ProfilePage` totals/evidence/radar marked unavailable or illustrative | **Partial**: Admin self declarations, raw scoring, XP ledger entity and self radar already exist; no consolidated ClubHub participation/contribution history | [personal-experience-api](personal-experience-api.md): reuse declarations/radar, add self summary/attendance history, retain quantity separation |
| D04 Public club profile | `ClubPageTab`, Preview then bottom Save/Cancel; provisional PATCH | Missing public-profile PATCH; reads exist; category catalog now dynamic; admin generic PUT is not manager authorization | [club-public-profile](club-public-profile-api.md): granular capability, partial fields, structured weekly schedule and category-code validation |
| D05 Semester roster/invites | `InviteMemberModal`, eligible-member query, invite call, My Clubs consent | **Partial**: semesters persist and invite/consent/approval exist; CTSV roster/eligible search/options/source/notifications absent | [club-member-invitations](club-member-invitations-api.md) + [semester-student-roster](semester-student-roster-api.md) |
| D06 Governance groups | DEV-only group/member/history/report rehearsal with default empty groups; member-row roles are read-only and direct role mutation UI removed | Member/treasurer/owner/owner-transfer foundations exist; multi-group term structure, immutable personal history, report snapshots and vice approvals missing | [club-governance-groups](club-governance-groups-api.md): ordinary specialist Save applies grants; report submit only snapshots; CTSV leadership approval separate; policy enforced across services |
| D07 Tasks/contributions/points | `QuestsTab`, `PointsTab` unavailable; dashboard uses reports rather than fake pending contribution count | Missing **club** task/submission/review, credited club wallet and badges; Admin quest catalog is not this workflow | [club-contributions-points](club-contributions-points-api.md): lifecycle, evidence, transactional awards, safe ledger/leaderboard |
| D08 Gifts/cover cosmetics | `GiftsTab`, `cover-cosmetics.js`, local catalog, 200 sample club points, local entitlement keys | Missing club reward catalog/admin publication, wallet debit/redemption and reusable inventory; samples not production | [profile-cover-rewards](profile-cover-rewards-api.md): individual color/shape/bundle, grants, PNG provenance, idempotent transactions |
| D09 Academic calendar/timetable | `AcademicCalendarPage`, shared mock dates; `/v2/study-schedule` private weekly cells and bulk template | **Partial**: semester identity/start/end exist; block dates, self timetable and import missing | [study-schedule-api](study-schedule-api.md): link to existing semester, private week/slot persistence, admin date configuration |
| D10 Own applications/My Clubs | `withdrawMyMembershipApplication` absent, composed cards omit metadata; invitation heuristic | Missing self withdrawal; richer selection/inbox projections optional; existing me/access + memberships are usable | [my-clubs-membership-api](my-clubs-membership-api.md): self-only withdraw, discriminator, approved count/logos/code, optional composed replacement |
| D11 Discovery/recommendations | `activity-data.js` uses management feed; recommendations are first six with temporary IDs; curated clubs | Missing safe feed/detail and ranking gateway; current activities read membership-scoped with participant data | [activity-discovery-api](activity-discovery-api.md), existing [feature contract](../../specs/003-activity-discovery/contracts/activity-discovery-contract.md) |
| D12 Event specialist operations | role matrix promises Content/Event duties; existing event UI only CRUD/participants/attendance | Existing CRUD/registration does not implement staff assignments, form/version/submitted-answer review lifecycle | [club-event-operations-api](club-event-operations-api.md): event content scope, staff and registration application operations |
| D13 Public member directory | ordinary workspace member view shows leaders/count only | Missing privacy-safe opt-in directory; **optional**, no current full-roster control blocked | [public-member-directory-api](public-member-directory-api.md); defer unless enabled product scope |
| D14 Existing API tightening | legacy admin profile edit blocked; manager assignment trusts name; member personal write; report path field; local 100-row filters | Existing routes need compatibility/security/paging work, not wholesale replacement | [existing-api-hardening](existing-api-hardening.md): self identity, reject cross-user profile writes, scoped lookup, attachment privacy, queries |

## Six currently called absent operations

| FE wrapper | Exact proposed operation | Debt |
| --- | --- | --- |
| uploadPublicImage | POST `/api/media/upload-intents` | D01 |
| updateClubPublicImages | PUT `/api/clubs/{clubId}/public-images` | D01 |
| updateActivityCoverImage | PUT `/api/activities/{activityId}/cover-image` | D01 |
| updateClubPublicProfile | PATCH `/api/clubs/{clubId}/public-profile` | D04 |
| searchEligibleClubMembers | GET `/api/clubs/{clubId}/eligible-members` | D05 |
| withdrawMyMembershipApplication | POST `/api/clubs/me/membership-applications/{applicationId}/withdraw` | D10 |

Invitation POST `/members` exists but ignores semester eligibility and trusts submitted identity; it is an **upgrade**, not a seventh absent endpoint. `updateClubMemberProfile` still exists in the facade/legacy page but is disallowed by the new personal-profile product rule; remove/migrate that caller and revoke manager writes rather than preserving it as a supported future capability.

## Do not duplicate or misclassify

- Semester/catalog CRUD, current notification list/read mutations, club/account reads, membership approvals, treasurer operations, reports/finance/KPI/exports and attendance already have source routes. Wire/test them rather than create duplicate APIs.
- `/api/v1/quests` and `/api/quests` exist, including participation. `CompleteQuestAsync` accepts AnyActor and a requested target user without a scoped reviewer check in the inspected handler: do not use it to award club points; harden before enabling trusted completion (D14).
- `/api/v1/declarations/me`, `/api/v1/declarations/me/radar` exist. Student radar is based on reviewed raw experience and a benchmark, not a spendable point balance. No evidence supports treating Admin `XpLedgerEntries` as a club reward wallet.
- Authentication bypass/dev-login, theme/token cache, demo fixtures, FAP automatic sync, optional full public rosters and new physical reward fulfillment are not implicit requirements to implement every demo feature. Keep accepted dev-login behavior.
- Disband/transfer, manager assignment, role administration, audit events, manual finance adjustment and creation from approved reports have existing backend routes. New UI for them is separately owned.

## Handoff

[Start the next implementation session here](backend-api-implementation-handoff.md). It specifies dependency waves, concrete endpoint/database tasks, contract precedence, acceptance tests and open product choices. All new routes in this package are proposed until verified in source and through the running gateway.

## Session follow-up — 2026-10-13

D10 also covers the [navigation/application addendum](club-navigation-applications-api.md): authoritative self-withdraw capability/source, canonical clubCode/logo for all inbox rows, existing reviewedAtUtc for the seven-day result rule, and optional durable account pin synchronization. Quick switching and branding/badge styling do not need new backend endpoints. Current local pins are not persisted server preferences.

</details>
