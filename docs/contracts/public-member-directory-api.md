<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Danh bạ thành viên công khai — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

**⏭ BỎ QUA:** Public student/member directory BỎ QUA; không dùng route proposal cũ.

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: BỎ QUA — NGOÀI PHẠM VI.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

Phiếu mục4 loại public student profile sharing; không yêu cầu công bố roster. **BỎ QUA toàn bộ** members/public/opt-in/consent models/public member-profile workflow. Giữ nội dung, không triển khai vì còn spec cũ.

Club directory/profile công bố và manager roster riêng tư vẫn GIỮ với scope/privacy. Member count/public info không cấp quyền xem contacts/evidence/radar.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Optional opt-in public club member directory

Implement Status: Not Yet

Status Scope: Optional/deferred backend capability, not cancelled

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: MemberManagementEndpoints.cs provides private management reads, but no opt-in member public route or per-club consent persistence. Public leaders/count do not satisfy a consent-based directory; deferral does not mean cancellation.

D13; proposed/deferred. Current non-manager workspace shows public leaders and member count; it does not require exposing the full roster. Backend source main 80818266 has manager members/detail reads, not this privacy projection.

Only if product enables the full member directory: GET `/api/clubs/{clubId}/members/public?page=1&pageSize=20` returns `{items:[{displayName,clubRole,avatarUrl?,joinedAt?}],page,pageSize,totalItems,totalPages}`. Include only approved active members who explicitly opted in; exclude user/membership IDs, student code, email, address, phone, birthday, application answers, point balances and internal roles. Directory pagination totals count visible opted-in rows, not private approved membership count. Public leaders remain separately controlled by existing public leader policy.

Opt-in belongs to the authenticated student's canonical profile/privacy settings, for example self PATCH `{privacy:{clubDirectoryOptIn:true}}`; leaders cannot opt in another user. Scope consent per club if allowing different visibility across clubs; persistence then keys `(userId,clubId)` and self-only PATCH `/api/users/me/club-directory-consents/{clubId}` `{optIn,expectedVersion}`. Default false, revoke immediately from subsequent reads/caches, audit without publishing consent details. Adopt the per-club consent route if this optional feature is selected; do not implement both competing consent models.

Tests: no consent yields no item, opt-in displays safe fields, revoke removes cache/read, pending/removed members excluded, pagination reveals no hidden identity, other user cannot alter consent. No current-control unblock depends on this optional endpoint; keep it out of the required first backend batch.


</details>
