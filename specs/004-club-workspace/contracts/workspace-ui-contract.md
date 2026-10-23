# Workspace theo actor và tính năng v1.4 — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: Workspace integration, separate from ready BE operational routes

Backend Progress: PARTIAL

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md); [current operation status](../../../docs/contracts/be-api-status.md); [wire details](../../../docs/contracts/backend-current-integration.md#actions).

**Đã có BE:** Profile, semester catalogs, application/staffing, invitation/roster và EMBED source đã có.

**Chưa hoàn thành / giới hạn:** Governance/capabilities xuyên service, file pipeline, credit/reward và FE live còn thiếu; label Host/Staff không cấp quyền.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Workspace theo actor và tính năng v1.4 — cập nhật 2026-10-12

**Quyết định: GIỮ core; BỎ QUA finance/rewards/specialist expansion.**

[Phạm vi v1.4](../../../docs/contracts/capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. API mới vẫn là đề xuất tới khi có migration/Gateway/FE/kiểm thử.

GIỮ selection/composed reads, member/applications/basic roles, club profile, activity/registration/attendance/recurrence, contribution/evidence/review, plan/statistics/PDF. Server capabilities và verifier assignment độc lập. Adapter không tự drop unknown valid role khi có server capability; preserve roles/capabilities, deny action không cấp.

**BỎ QUA:** finance/settlement/competitive leaderboard/gifts/wallet/redemption/full specialist consoles/school roster. Points đổi nghĩa experience6+1 nếu dùng. [Contribution](../../../docs/contracts/verified-contributions-api.md), [plan/report](../../../docs/contracts/club-semester-plan-report-api.md) quyết định payload. Rich selection hỗ trợ, không duplicate endpoint bắt buộc.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Production Workspace UI Contract

Historical Implement Status: Not Yet

Historical Status Scope: Backend/integration scope: partial authorized workspace

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: Current route resolves server clubCode from existing own-access/directory composition and role-gates the workspace; richer selection is optional and absent. Governance, profile/media, semester, credit/rewards and withdrawal dependencies remain open.

## Optional proposed rich server projection

`GET /api/clubs/me/selection` remains absent on API main 80818266. Current production selection instead composes existing `/api/clubs/me/access`, active directory and self memberships. The optional richer projection would use this shape; its upcoming activity and manager-only pending counts are not available from the current composed reads:

```json
[
  {
    "clubId": "string",
    "clubCode": "canonical server code",
    "name": "string",
    "logoUrl": "string optional",
    "role": "MEMBER | MANAGER",
    "upcomingActivity": {
      "title": "string",
      "startTime": "ISO-8601 timestamp",
      "location": "string optional"
    },
    "pendingApplications": "non-negative integer; managers only"
  }
]
```

## UI mapping and access boundary

- The client must discard entries without `clubId`, canonical `clubCode`, or a role of `MEMBER`/`MANAGER`.
- The route is displayable only if its decoded `clubCode` matches an authorized selection entry (case-normalized); clubId remains the server resource ID.
- `pendingApplications` is omitted for members and normalized to `null` for a manager if unavailable.
- The response must not contain roster members, personal contact data, points, finance, report, or membership-application detail solely to support this MVP.

## Future workspace contracts (not implemented here)

The original MVP deferred these areas; several now use existing backend APIs as described in the implementation section below. Their scoped authorization remains mandatory:

- activities and attendance
- members and applications
- contributions, points, and rewards
- reports and finance
- club settings

Those contracts must define semester scope, role permissions, pagination where collection data is returned, and write conflict/error behavior.

## Current implementation and backend handoff — 2026-10-09

Activities/attendance, management roster/applications, reports and finance now use existing API routes; they are not all unavailable or missing backend contracts. Member management stays in V2. Club-page editing calls a missing public-profile PATCH, media attachment remains provisional, specialist role assignments are not implemented in main, tasks/points remain unavailable, and rewards/cover ownership are temporary local data.

Attendance navigation follow-up (2026-10-12): removed the standalone attendance tab; attendance reads live inside the activity detail modal and full detail page. Legacy workspace `/attendance` redirects to `/activities`. Detail reloads use the authorized single-activity route and retain completed/cancelled records; discovery still excludes those statuses. Manager mode is club-scoped, member mode reads self only. This move retains existing read capability; it does not add check-in or attendance-update writes.

The [debt register](../../../docs/contracts/frontend-api-debt-register.md) owns those classifications. Exact [My Clubs](../../../docs/contracts/my-clubs-membership-api.md), [club profile](../../../docs/contracts/club-public-profile-api.md), [governance groups](../../../docs/contracts/club-governance-groups-api.md), [invitations](../../../docs/contracts/club-member-invitations-api.md), [contributions](../../../docs/contracts/club-contributions-points-api.md), [event operations](../../../docs/contracts/club-event-operations-api.md) and [rewards](../../../docs/contracts/profile-cover-rewards-api.md) contracts supersede the broad future-work list for the next API session. Governance supports multiple groups, intra-term personal history and independent board reports; only protected leadership needs CTSV approval. DEV-only rehearsal does not grant live access. Organizational capabilities must be server-scoped; full leadership never grants another user's personal-profile edit.

</details>
