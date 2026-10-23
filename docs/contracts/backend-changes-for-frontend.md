# Chỉ mục thay đổi BE cần cho FE — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: BE capability index and FE adoption

Backend Progress: PARTIAL

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#overview).

**Đã có BE:** F01/F02/F03/F05/F06 đã có bản sửa/luồng nguồn ở BE; đọc bảng current và hướng dẫn wire trước khi nối adapter.

**Chưa hoàn thành / giới hạn:** F04/cơ chế điểm action-final-report đang tạm hoãn; adapter expectedRawXp numeric chưa tương thích null. FE/deployment không được đánh Done.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Chỉ mục thay đổi BE cần cho FE — cập nhật 2026-10-12

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

**Quyết định: GIỮ — HỖ TRỢ; ưu tiên F01–F12.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

Đọc [register D01–D20](frontend-api-debt-register.md) và [handoff](backend-api-implementation-handoff.md). Contract mới: [accounts/verification](internal-accounts-verification-api.md), [attendance/recurrence](activity-attendance-api.md), [contributions/ledger](verified-contributions-api.md), [6+1 scoring](experience-scoring-contract.md), [semester plan/report](club-semester-plan-report-api.md).

GIỮ self profile/club/join/event/notifications. BỎ QUA finance/rewards/wallet/leaderboard/public student directory/school roster/timetable/ML. Bảng14debt và common styles/club store dưới là lịch sử, không còn yêu cầu phát hành. Source existence không là integration sign-off.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Backend changes needed after frontend integration

Historical Implement Status: Not Yet

Historical Status Scope: Backend work indexed here

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: All D01-D14 obligations remain active; source foundations are available but missing capabilities are documented in each topic contract and the current lifecycle matrix.

Rechecked 2026-10-13: remote main and local API HEAD both **80818266f617bd5144ab1b1a6cd0e74983983a4d**. [Contract lifecycle audit](contract-lifecycle-audit.md) records retained/retired contracts and [declaration inventory](api-declaration-inventory.md) covers all current facade wrappers. Source existence and verified deployment are separate; no live gateway/database/R2 behavior was tested.

Start the backend session with [implementation handoff](backend-api-implementation-handoff.md). It contains dependency waves, migration/integration tasks, acceptance checks and unresolved product choices. [Debt register](frontend-api-debt-register.md) owns classifications; [declaration inventory](api-declaration-inventory.md) records current facade-to-BE route matches; [shared conventions](api-contract-conventions.md) owns transport, errors, pagination and idempotency.

## Contract owners

| Debt | Required change | Contract |
| --- | --- | --- |
| D01 | R2 upload intent, verified object attachment, club/activity images and durable self avatar/cover | [Public images](public-image-api.md) |
| D02 | Canonical self GET/PATCH, profile projection, onboarding and private academic fields | [Self profile](self-profile-sync-api.md) |
| D03 | Consolidated self experience/history; reuse existing Admin declarations/radar | [Personal experience](personal-experience-api.md) |
| D04 | Club public-profile PATCH, preview/save, dynamic category and weekly 30-minute schedule | [Club profile](club-public-profile-api.md) |
| D05 | CTSV semester roster/import, eligible-member search and upgraded existing invitation workflow | [Roster](semester-student-roster-api.md), [Invitations](club-member-invitations-api.md) |
| D06 | Multi-group BQL by semester, immediate specialist grants, immutable intra-term personal history, independent report snapshots and CTSV leadership appointments | [Governance groups](club-governance-groups-api.md) |
| D07 | Club tasks, evidence, review, credited wallet/ledger and achievements | [Contributions/points](club-contributions-points-api.md) |
| D08 | Club reward catalog, color/PNG shape/bundle redemption and owned inventory | [Cover rewards](profile-cover-rewards-api.md) |
| D09 | Existing semester-linked academic block dates and private student timetable | [Study schedule](study-schedule-api.md) |
| D10 | Self application withdrawal and reliable invitation discriminator; richer cards optional | [My Clubs/applications](my-clubs-membership-api.md) |
| D11 | Privacy-safe public activity feed/detail and recommendation contract | [Discovery](activity-discovery-api.md) |
| D12 | Specialist event-content editing, staff assignment and registration-form/application review | [Event operations](club-event-operations-api.md) |
| D13 | Optional consent-based public member directory, only if product scope enables it | [Public directory](public-member-directory-api.md) |
| D14 | Revoke cross-user personal writes, canonical manager lookup, quest verification, remove storage paths/read-time samples, paging | [Existing API hardening](existing-api-hardening.md) |

## What is already present

The facade has 95 public async wrappers: 87 declared direct operations, two composed reads and six absent operations. The [facade audit](contract-lifecycle-audit.md) lists them. Existing invitation POST is an upgrade rather than a missing route. Persisted semester/category catalogs, Admin declarations/radar/quest infrastructure, notifications and management workflows should be reused.

Raw experience, credited club points and money remain distinct. Admin XP ledger presence does not establish a spendable club wallet. The 200-point reward samples and local cosmetic grants are temporary UI data, never production credit. Common styles remain free; club-issued rewards are exchanged in the club store and appear as separate colors/shapes in the editor.

## Implementation boundary

No backend source was modified during this scan. Proposed APIs remain contracts until migrations, scoped authorization, Gateway routing, frontend adapters and live integration have been verified. Do not implement old PUT self-profile or student-profile aliases alongside canonical GET/PATCH. Preserve current backend local changes and fetch main again before the next session.

## Navigation and applications — 2026-10-13

[Session addendum](club-navigation-applications-api.md) extends D10 with own withdrawal capability/source metadata, canonical code/logo for inbox cards, seven-day reviewedAtUtc filtering and optional persistent account pins. Existing logo/access/review-date reads are reused; no BE changes are needed for branding, icon alignment or badge colors.

</details>
