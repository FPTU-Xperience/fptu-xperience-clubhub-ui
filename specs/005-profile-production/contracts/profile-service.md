# Profile theo phiếu v1.4 — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: Profile UI integration and remaining cosmetics/academic source

Backend Progress: PARTIAL

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HO_SO_CA_NHAN_BE_2026-10-22.md); [current operation status](../../../docs/contracts/be-api-status.md); [wire details](../../../docs/contracts/backend-current-integration.md#profile).

**Đã có BE:** Canonical self profile + basic avatar/cover/roster studentCode source đã có.

**Chưa hoàn thành / giới hạn:** FE vẫn phải tích hợp; cosmetics/layout và major/year chưa có nguồn; không dùng local ownership/XP giả.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Profile theo phiếu v1.4 — cập nhật 2026-10-12

**Quyết định: GIỮ self/experience; BỎ QUA quà/public sharing.**

[Phạm vi v1.4](../../../docs/contracts/capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. API mới vẫn là đề xuất tới khi có migration/Gateway/FE/kiểm thử.

GIỮ [self GET/PATCH](../../../docs/contracts/self-profile-sync-api.md) persisted/privacy/preview-save, membership cards, [experience6+1](../../../docs/contracts/experience-scoring-contract.md) semester/cumulative/tiers/titles/history. LocalStorage/IndexedDB chỉ hiện trạng, không acceptance.

**BỎ QUA:** rewards/cosmetic ownership/bundles/complex cover240px/academic official sync/public profile sharing. Free avatar hỗ trợ nếu giữ UI. Evidence/radar self/scoped reviewer, không public preview. D08 handoff cũ ngoài phạm vi.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Profile service boundary — refreshed 2026-10-09

Historical Implement Status: Not Yet

Historical Status Scope: Backend implementation

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: Canonical self-profile GET/PATCH/media/experience/owned-cosmetics contracts remain missing from Auth/Club source. Account-local browser state and membership imports are not durable self-profile integration.

## Current temporary implementation

Consumer: `src/pages/v2/profile-page/ProfilePage.jsx`; temporary owner: `src/pages/v2/profile-data.js`. Authenticated identity remains immutable. Profile/cover presentation is saved in account-keyed localStorage; image blobs are account-keyed IndexedDB. Missing account identity never creates an anonymous shared record. No demo provider is used.

Existing `GET /api/clubs/me/memberships` imports only the current user's snapshot when there are no local edits; approved club cards use API memberships and club reads to resolve `logoUrl`/`clubCode`. These existing reads are not durable profile synchronization. Other members retain explicitly labeled application snapshots until the server projection exists.

Load/save/retry preserve session isolation and prior data on failure. The information modal stages a draft through Preview; bottom Save changes persists locally, Cancel restores the saved snapshot. Cover/avatar editing stays separate. Current editable personal/academic/cover fields exceed the original presentation-only feature scope; immutable auth identity/email/global roles remain protected.

## Canonical backend replacement

[Self-profile contract](../../../docs/contracts/self-profile-sync-api.md) owns GET/PATCH `/api/users/me/profile`, nested partial payloads, editable-field metadata, cover transforms/text, optimistic concurrency and private club projection. Its dated canonical fields supersede the original narrow mock patch/data-model for API implementation. Do not create a second fullName-only PUT or student-profile alias.

[Media](../../../docs/contracts/public-image-api.md) owns user avatar/background attachments. [Cover rewards](../../../docs/contracts/profile-cover-rewards-api.md) owns server-issued/free entitlements, separate editor color/shape choices and club-store redemption. [Personal experience](../../../docs/contracts/personal-experience-api.md) reuses existing Admin declaration/radar infrastructure and specifies missing self history/summary reads. Local samples are never earned grants or credited points.

Follow the [implementation handoff](../../../docs/contracts/backend-api-implementation-handoff.md), D01/D02/D03/D08. Route the replacement through the existing API facade, deliberately review local imports, preserve Preview/Cancel with no write, and prove cross-account/cross-device privacy. API main 80818266 has no canonical self-profile read/write; production integration remains pending.


</details>

</details>
