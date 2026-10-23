# Hồ sơ trải nghiệm theo kỳ và tích lũy — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: Existing experience reads versus unapproved new scoring semantics

Backend Progress: PARTIAL_EXISTING_READS_NEW_SCORING_DEFERRED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#decisions).

**Đã có BE:** Self summary/activity-history/contributions/ledger/radar và rule recommendation hiện có; nguồn v2 sessions kiểm tra đăng ký/visibility.

**Chưa hoàn thành / giới hạn:** Không chốt công thức mới/+1/tích lũy/rollover bằng nhãn source-read; không biến raw XP thành ví spendable hoặc null nguồn thành số 0.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Hồ sơ trải nghiệm theo kỳ và tích lũy — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-010 | `GET /api/users/me/contributions` | **✅ HOÀN THÀNH** | Hợp nhất canonical + legacy có nhãn, dedup mirror, lọc kỳ/status/pillar, SQL count/paging; calculation hiện trạng. Legacy semester unassigned, không cộng vào điểm verified. |
| API-011 | `GET /api/contributions/{id}` | **✅ HOÀN THÀNH** | Detail có calculationBreakdown và lịch sử ledger effect/delta/allocation/revision/policy/verification. Snapshot mới bất biến; lịch sử cũ chỉ reconstruct nếu dữ liệu gốc khớp, thiếu căn cứ báo unavailable. |
| API-014 | `GET /api/users/me/experience-ledger` | **✅ HOÀN THÀNH** | Paged self net ledger với sourceType/sourceId/sourceKey/sourceNamespace, policy/formula/revision/verification; không đưa XP mẫu vào ledger. |
| API-017 | `GET /api/users/me/experience-summary` | **✅ HOÀN THÀNH** | Summary đọc toàn bộ net ledger, counts riêng với points; nguồn attendance/membership có availability/asOf/version riêng. Nguồn lỗi trả null, không giả0; historical external counters chưa có snapshot được đánh dấu rõ. |
| API-018 | `GET /api/users/me/activity-history` | **✅ HOÀN THÀNH** | Self-only, cross-activity/session history; SQL filter/count/paging, registration/verified/revoked/legacy tách nhãn, không lộ dữ liệu sinh viên khác. |
| API-026 | `GET /api/v1/declarations/me/radar` | **✅ HOÀN THÀNH** | VERIFIED_NET_LEDGER theo PERIOD và CUMULATIVE; six radarAxes + plusOne, ERI/D/J/M và leader proof theo trụ cột; approved policy/version/asOf/ledgerRevision. Cumulative cần policy scope riêng, thiếu trả503. |

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ — BẮT BUỘC; thay DTO/nghĩa wallet cũ.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

Tái sử dụng declarations/self radar, nhưng phải theo [scoring](experience-scoring-contract.md): contribution đúng kỳ; vector≤3/7; six axes/+1 riêng; policy/formula/ledger snapshots, tiers/title/breakdown và cumulative không reset. BuildStudentRadarAsync đã dùng canonical net ledger theo kỳ và loại declaration mirror, trả policyVersion/isAuthoritative/ledgerBasis; phần CUMULATIVE và snapshot DTO đầy đủ còn thiếu.

GET /api/users/me/experience-summary?semesterId=... đề xuất: scope/semesterId/recognizedContributionCount/rawExperiencePoints/verifiedAttendanceCount/approvedClubCount/availability/policyVersion/ledgerRevision/asOf/version. Tách count khỏi points; không dùng recognizedContributionTotal mơ hồ. Server tổng hợp; thiếu source null+availability, không fake0.

GET /api/users/me/activity-history giữ self/paged/session/source/verified status. GET /api/users/me/contributions theo [verified contributions](verified-contributions-api.md), typed source/status/revision/verified attributes/calculation/evidence refs có quyền. **BỎ QUA** creditedWalletPoints/redemption comparisons.

Self-only/private, reviewer projection có assignment. **BỎ QUA** public student profile preview/sharing; tự preview trước Save vẫn GIỮ. Public club info khác hồ sơ cá nhân. Hiển thị số cùng radar/so chính mình qua kỳ, không competitive leaderboard.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Personal experience summary, evidence and radar

Historical Implement Status: Not Yet

Historical Status Scope: Backend implementation: partial Admin foundations

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: Admin DeclarationEndpoints/StudentRadar projections and XP data exist; Auth UserEndpoints.cs lacks own experience-summary, activity-history and club-contribution aggregate projections. Per-club activity statistics are not a student-wide aggregate.

D03; baseline main 80818266, 2026-10-09. Owner: Auth/profile aggregation with Activity/Club and existing Admin experience reads. This is **partially supported**, not a request to recreate experience scoring.

## Reuse existing APIs

- GET `/api/v1/declarations/me` and existing private declaration detail/update flow return the student's evidence records. CTSV review computes raw points using `ExperienceScoringCalculator`; reviewed declarations feed radar.
- GET `/api/v1/declarations/me/radar?semester={canonicalCode}` returns `StudentRadarResponse`, including pillar raw sums, benchmark/saturated values and overall metrics. Map by canonical pillar identifier; do not reinterpret one of six values as a wallet. Preserve the seventh work component and derived metrics supported by that DTO. Default selection must use server semester metadata rather than the handler's FA26 fallback when introducing the ClubHub view.
- Admin `XpLedgerEntry` has student/campus/semester/type/amount/source metadata, but no club wallet or redemptions. Its presence is not proof of contributed spendable points. Existing anomaly/backoffice ledger reads are not a student club-wallet API.

## Proposed missing projections

GET `/api/users/me/experience-summary?semesterId={code}` ->

```json
{"userId":42,"semesterId":"FALL2026","recognizedContributionTotal":120,"attendedActivityCount":3,"approvedClubCount":1,"sources":{"contributions":"club-approved-ledger","attendance":"verified-attendance","clubs":"approved-memberships"},"asOf":"2026-10-09T08:00:00Z","version":"opaque"}
```

`recognizedContributionTotal` means credited contribution records, not current wallet balance (redemption must not lower this total). If a source is not configured/available, return its total as null plus availability metadata; do not report fabricated 0. Deduplicate approved memberships and verified attendance by stable IDs. Only server attendance status qualifies; registering or self-claiming does not imply participation.

GET `/api/users/me/activity-history?semesterId=...&page=1&pageSize=20` -> paged `{activityId, clubId, clubCode, clubName, title, startsAt, attendanceStatus, verifiedAt}` for that principal only. Empty history is normal. Never expose other participants.

Use existing declarations for declaration evidence; add GET `/api/users/me/contributions?semesterId=...&page=1&pageSize=20` only for approved/pending **club contribution** records not represented there, returning `{id, clubId, clubName, title, status, submittedAt, reviewedAt, creditedWalletPoints, evidenceRefs}`. The UI adapter can merge typed sources (`DECLARATION` / `CLUB_CONTRIBUTION`) without losing review rules or double counting. A consolidated evidence read, if introduced later, must retain source IDs and source-specific authorization; it is not another write/review authority.

## Privacy, persistence and acceptance

Self-only reads regardless of global actor role. Public profile preview excludes private identity, personal evidence, contribution totals, points and contact data; expose only consented display fields. Maintain application/history data after self-profile edits. Aggregation failures preserve independent fields with unavailable metadata, not synthetic sample data. Never calculate final totals client-side from a truncated first page.

Tests: two accounts see only own evidence/history; attendance/cancelled/duplicate cases; consistent totals across pagination and redemption; canonical semester; empty versus unavailable; declaration/radar mapping; public preview privacy. FE owner: `ProfilePage.jsx`, `profile-data.js`; replace seeded evidence and radar only after these reads are deployed. No new profile-summary write endpoint.


</details>

</details>
