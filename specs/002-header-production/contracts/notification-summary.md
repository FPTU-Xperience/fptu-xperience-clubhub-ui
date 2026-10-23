# Header notification và nguồn sự kiện trong phiếu — cập nhật 2026-10-12

Implement Status: Done

Status Scope: BE source: existing self-safe notification reads and committed invite/import outbox; not live delivery

Backend Progress: SOURCE_IMPLEMENTED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HOAN_THIEN_API_BE_KHONG_TINH_DIEM_2026-10-22.md); [current operation status](../../../docs/contracts/be-api-status.md); [wire details](../../../docs/contracts/backend-current-integration.md#roster).

**Đã có BE:** Notification self-safe/read hiện có; invitation/import đã thêm outbox đúng người nhận.

**Chưa hoàn thành / giới hạn:** Chưa nghiệm thu delivery live; không hứa tất cả loại event mới, rewards hoặc governance notices đã có.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Header notification và nguồn sự kiện trong phiếu — cập nhật 2026-10-12

**Quyết định: GIỮ — BẮT BUỘC.**

[Phạm vi v1.4](../../../docs/contracts/capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. API mới vẫn là đề xuất tới khi có migration/Gateway/FE/kiểm thử.

GIỮ GETnotifications self-safe/bounded/errors/no fixtures; full inbox/read mutations tái sử dụng. Membership/activity/review/contribution updates bắt buộc qua outbox đúng recipient. Role/assignment notifications hỗ trợ; **BỎ QUA** redemption/finance/rewards notices như MVP requirement. Deep links kiểm tra quyền, không PII/evidence trong summary.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# UI Contract: Header Notification Summary

Historical Implement Status: Done

Historical Status Scope: Backend source implementation of existing notification read contract

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: NotificationEndpoints.cs GetNotificationsAsync uses authenticated actor and scoped recipients; NotificationExtensions.cs applies access filtering and safe DTO mapping; notification persistence and Gateway route exist. Bounded six-item presentation is FE-only; no live or newly executed service-test claim.

## Scope

The V2 production header reads a bounded presentation of notifications belonging to the current authenticated user. This is a UI-consumption contract; server-side identity and authorization remain authoritative.

## Request

`GET /api/notifications`

- Requires the existing authenticated session.
- The client requests only when the user opens the notification control or explicitly retries.
- The client does not send another user's identifier, club identifier, role, or semester as a means of authorization.

## Successful response

The response may be an array, or an envelope containing an item collection. Each displayable notification should provide:

```json
{
  "id": "notification-id",
  "title": "Short authorized title",
  "message": "Display-safe message",
  "createdAtUtc": "2026-09-17T12:00:00Z",
  "isRead": false
}
```

The V2 adapter accepts equivalent existing timestamp field names but exposes only `id`, `title`, `message`, `createdAt`, and `isRead` to the header. It excludes entries with no stable id and displays at most six mapped summaries, ordered newest first when a trustworthy timestamp is available.

## Status behavior

| Server outcome | Header behavior |
| --- | --- |
| 200 with summaries | Show only mapped summaries for the active session. |
| 200 with no summaries | Show the explicit empty state. |
| 401 | Clear header notification data and follow established sign-in/session handling. |
| 403 | Show notification-unavailable state without prior-user content. |
| Network failure or other non-success | Show error state and Retry action. |

## Privacy and compatibility constraints

- The server must filter notifications to the authenticated user before responding.
- The response must not rely on client-side role checks for authorization.
- The header must not use demo notices, fixture actors, cached entries from another session, or local mutation behavior as a fallback.
- Marking notifications read and navigating to a notification-management page are outside this header migration; the popover is read-only.

## API rescan — 2026-10-09

Notification list and read mutations already exist on main 80818266; no replacement notification service is requested. New invitation, role, contribution and redemption notifications should use source outbox events and recipient deduplication under [shared conventions](../../../docs/contracts/api-contract-conventions.md). Preserve this header's bounded safe projection and session isolation; full inbox pagination is a separate existing-API integration task (D14). See [handoff](../../../docs/contracts/backend-api-implementation-handoff.md).


</details>

</details>
