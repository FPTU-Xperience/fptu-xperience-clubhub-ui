# Activity discovery và low-axis rule — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: UI/BE integration and future policy scope

Backend Progress: PARTIAL

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](../../../docs/contracts/be-api-status.md); [wire details](../../../docs/contracts/backend-current-integration.md#existing).

**Đã có BE:** BE feed/detail/rule và safe sessions source đã có.

**Chưa hoàn thành / giới hạn:** FE adoption/E2E chưa xác nhận; scoring mới deferred; ML/schedule matching vẫn bỏ qua.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Activity discovery và low-axis rule — cập nhật 2026-10-12

**Quyết định: GIỮ — BẮT BUỘC; BỎ QUA ML/ghép lịch.**

[Phạm vi v1.4](../../../docs/contracts/capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. API mới vẫn là đề xuất tới khi có migration/Gateway/FE/kiểm thử.

[Discovery API](../../../docs/contracts/activity-discovery-api.md) giữ feed/direct detail/recommendation names, numeric IDs/paging safe. Recommendations target trục thấp/eligibility/ruleVersion/reason; **BỎ QUA** interest/hybrid/ML/schedule engine và yêu cầu external issue/comment trước viết code. Quyền messaging ngoài repo không suy từ dòng lịch sử đó.

Completion chỉ qua verified contribution, không mint lại. modelVersion/phù hợp lĩnh vực quan tâm trong ví dụ cũ là lịch sử, không requirement tối thiểu.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Activity Discovery Contract

Historical Implement Status: Not Yet

Historical Status Scope: Backend implementation

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: Canonical /api/v2 activity feed/detail/recommendations are absent from service endpoints and Gateway; existing management activity reads do not meet this display-safe discovery contract.

**Status**: Proposed dependency for implementation. This document specifies the display-safe
boundary required by the UI; it does not claim the endpoints already exist.

## Authorization rules

For every request, the server obtains the caller from the authenticated session and evaluates each
activity before serializing it.

1. Include an `UPCOMING` or `LIVE` activity when it is public to the caller under the agreed
   policy, or when the caller has active membership/explicit view authority for its club.
2. Do not return `COMPLETED`, `CANCELLED`, unavailable, or otherwise ineligible activities.
3. Do not return a roster, attendance records, user IDs, applications, internal permissions,
   raw ranking score or recommendation as evidence of authority.
4. Re-evaluate eligibility when detail/action resources are requested. Client routing and a
   recommendation result never grant access.

## `GET /api/v2/activities/feed`

Returns the caller's authorized upcoming/live activity collection. The request is authenticated;
server pagination may be added later only with an agreed UI contract. Version one must support the
specification's 50-item validation case without client overfetch of private data.

### Success response — `200 OK`

```json
{
  "items": [
    {
      "id": "activity-123",
      "clubId": "club-fcode",
      "clubName": "F-Code",
      "title": "Workshop React",
      "description": "Nội dung hiển thị cho người được phép xem.",
      "startTime": "2026-09-24T09:00:00+07:00",
      "endTime": "2026-09-24T11:00:00+07:00",
      "location": "Innovation Lab",
      "status": "UPCOMING",
      "nextAction": {
        "kind": "OPEN_ACTIVITY_CONTEXT",
        "label": "Xem trong CLB",
        "available": true
      }
    }
  ]
}
```

### Error behavior

| Status | UI behavior |
| --- | --- |
| `401` | Existing sign-in/session-expiry flow. |
| `403` | Render page forbidden state; do not retain prior user's data. |
| `5xx` or network error | Render retriable error state. |

## `GET /api/v2/recommendations/activities?limit=6`

Returns no more than six rank-ordered activity recommendations for the authenticated caller. The
server filters authorization and availability before ranking/serializing. `limit` greater than six
is clamped to six; an empty `items` array is normal.

### Success response — `200 OK`

```json
{
  "items": [
    {
      "recommendationId": "rec-opaque-456",
      "rank": 1,
      "reason": "Phù hợp với lĩnh vực bạn quan tâm",
      "modelVersion": "activity-v1",
      "activity": {
        "id": "activity-123",
        "clubId": "club-fcode",
        "clubName": "F-Code",
        "title": "Workshop React",
        "description": "Nội dung hiển thị cho người được phép xem.",
        "startTime": "2026-09-24T09:00:00+07:00",
        "endTime": "2026-09-24T11:00:00+07:00",
        "location": "Innovation Lab",
        "status": "UPCOMING",
        "nextAction": { "kind": "VIEW_CLUB", "label": "Xem CLB", "available": true }
      }
    }
  ]
}
```

The UI may omit `reason` when rendering. `modelVersion` and rank are not a permission signal and
must not be used for client authorization.

## Compatibility and migration

- Do not bind this UI to the current `/api/activities` response: it includes participant and
  attendance structures and its existing visibility rules do not meet this contract.
- Preserve the existing `VITE_API_BASE_URL`/Gateway boundary; the browser does not call an internal
  service port or Recommendation Engine directly.
- Map existing backend lifecycle data explicitly to `UPCOMING`/`LIVE` before it reaches the UI.
  The current Activity Service exposes `Scheduled`, `Completed` and `Cancelled`, so `LIVE` and
  public availability require product/backend agreement.
- The contract needs cross-repository ownership and a linked issue/comment before UI implementation
  begins. Existing relevant graph dependencies are UI-02 API adapters, UI-06 activity
  recommendations, RE-35, RE-40 and RE-43.

## API implementation refinement — 2026-10-09

[Discovery API](../../../docs/contracts/activity-discovery-api.md) retains these feed/recommendation route names and adds explicit pagination, numeric server IDs (client may stringify), cover URL, direct safe detail, server-clock LIVE state and private-by-default publication. The string IDs in the original examples above are illustrative, not a requirement to replace existing integer identities. Page size 50 satisfies the original validation case; add UI page handling for larger results. Main 80818266 still lacks this safe feed/ranking boundary. Source contracts/handoff are recorded; no external issue/comment was created by this audit. Ownership/deployment verification remains a future implementation task.


</details>

</details>
