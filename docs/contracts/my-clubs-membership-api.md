# Xin gia nhập và trạng thái CLB của mình — cập nhật 2026-10-12

Implement Status: Done

Status Scope: BE source: self membership/application history, withdrawal and reapplication

Backend Progress: SOURCE_IMPLEMENTED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/TRIEN_KHAI_CONTRACT_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#membership).

**Đã có BE:** GET /api/clubs/me/membership-applications và POST own pending APPLICATION withdraw đã có; reapply tạo ID mới/giữ lịch sử, metadata source/version/capability/code/logo hiện có.

**Chưa hoàn thành / giới hạn:** UNKNOWN/invitation không tự rút; không dùng manager DELETE thay withdraw. Pins và màn hình FE/live không thuộc nhãn Done này.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Xin gia nhập và trạng thái CLB của mình — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-032 | `POST /api/clubs/{id}/join` | **✅ HOÀN THÀNH** | Join bằng canonical profile Auth, active/unlocked/campus, consent và category info. Identity từ body không ghi đè Auth; transaction/unique/retry, key tùy chọn. Auth outage503. |

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| SUP-04 | `POST /api/clubs/me/membership-applications/{applicationId}/withdraw` | **⏳ CHƯA TRIỂN KHAI** | Chưa có withdrawal; hỗ trợ ngoài tổng 74, FE không giả thành công. |

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ — BẮT BUỘC; richer workflow chỉ hỗ trợ.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

GIỮ clubs/me/access, clubs/me/memberships, club detail/self join/manager approve-reject/status/role. Canonical identity server-derived/consent của sinh viên; manager không consent hộ. Không cần school roster để xác minh account dự án.

GIỮ — HỖ TRỢ self withdrawal/reapply/history đề xuất, invitation metadata/rich cards nếu tiếp tục UI; không bắt buộc mọi rich endpoint riêng, composed reads không cần duplicate. Nếu bật withdraw phải self/state/idempotency/history/active uniqueness, chưa bật không fake success.

**BỎ QUA** roster/invitation semester import dependency và finance/reward quyền legacy. Không bỏ self join/status chỉ vì invite expansion bỏ.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Own memberships, applications and self withdrawal

Historical Implement Status: Not Yet

Historical Status Scope: Backend implementation: existing composed reads only

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: ClubEndpoints.cs exposes own access/memberships and review timestamps; MembershipEndpoints.cs has no self withdrawal route. ClubWorkflowStatuses.cs lacks WITHDRAWN, and ClubMembershipResponse lacks source/capability/version/code/logo.

D10; 2026-10-09, main 80818266. Existing GET `/api/clubs/me/access`, GET `/api/clubs/me/memberships`, public club detail, join and manager approve/reject are usable. Do not duplicate them unless replacing composed reads with the richer projections below.

## Required withdrawal

POST `/api/clubs/me/membership-applications/{applicationId}/withdraw`, self-only; no body, Idempotency-Key supported. `applicationId` is existing membership ID. Under a transaction, verify ownership and pending state. PENDING -> WITHDRAWN only; already WITHDRAWN returns the canonical same result, approved/rejected/removed -> 409. Another actor must not learn or modify the record (404/403 under standard policy). Store actor/time/audit and retain join answers/history. Return 200 `{applicationId, clubId, status:"WITHDRAWN", version, canWithdraw:false}`.

Add a persisted Withdrawn workflow status. Reapplication may create a new pending application with a new ID/history record; uniqueness covers current active pending/approved records rather than all historic rows. Invitation eligibility currently excludes all membership records; change it deliberately with the same active-record predicate when implementing reapply. Concurrent joins/invites/withdrawals cannot create two active memberships. Existing manager DELETE is not self withdrawal.

## Authoritative invitation metadata

Extend me/memberships with `clubCode`, `logoUrl`, `source: "APPLICATION"|"INVITATION"`, `semesterId`, `invitedAt`, `consentedAt`, `canAcceptInvitation`, `canWithdraw`, `version`, and principal-safe role/status. Migration may classify old pending false-consent rows as invitation only when historical creation evidence is reliable; otherwise mark unknown and retain the legacy compatibility adapter until data is reconciled.

Invitation consent through existing join leaves PENDING until manager approval. Follow [invitation contract](club-member-invitations-api.md); no auto-approval. Do not interpret a name/email submitted by the manager as canonical identity. Dedicated decline/expiry controls are deferred; withdrawal is not silently an invitation decline policy.

## Optional richer reads

GET `/api/clubs/me/selection` -> array `{clubId, clubCode, name, logoUrl, role, capabilities, pendingApplications, upcomingActivity}`. Active manager/approved memberships only, deduplicate club with leadership precedence. Pending count is visible only with recruitment-review capability, otherwise null. Upcoming activity is the earliest authorized future activity `{id,title,startTime,location}` or null; no roster.

GET `/api/clubs/me/membership-applications` -> array `{applicationId,club:{clubId,clubCode,name,logoUrl},reason,status,source,canWithdraw,canAcceptInvitation,version}` for own pending/history requests only. Preserve current invitation fields and safely handle empty status sets.

Until these richer reads exist, preserve composed facade methods; absence of extra metadata does not break the current club card. Profile CLB đồng hành can continue membership read + club lookup for `logoUrl`/`clubCode`, including code fallback when an image fails. Returned code must come from canonical club data, not initials derived from club name.

Tests: self/another user, manager/admin cannot impersonate applicant, pending withdrawal retry, stale approved state, reapply and race, invitation consent not membership approval, inactive clubs, privacy, role precedence and safe logo/code projection. FE: my-clubs adapter/page, ProfileClubLogo and invitation consent navigation.

## Current FE consumption — 2026-10-13

The [navigation/inbox addendum](club-navigation-applications-api.md) owns durable pin preference routes and the seven-day result display rule; this file remains the canonical withdrawal workflow. Selection composes own access + active directory, retaining organizational displayRole separately from the coarse MANAGER/MEMBER access gate. Applications now compose self memberships + directory for code/logo and carry requestedAtUtc/reviewedAtUtc. Directory fallback cannot resolve every inactive club, so canonical self DTO metadata is still needed.

The adapter no longer fixes canWithdraw to false: it consumes authoritative true only for a pending sent request, excluding invitations. The inspected backend does not send that capability or implement withdrawal, so the current button remains disabled. Pending invitations remain a separate section. Sent pending requests persist indefinitely in the inbox; approved/rejected results disappear exactly seven elapsed days after reviewedAtUtc, while historical membership/access records remain intact. Unknown/missing/future review times do not qualify as recent results.

Use explicit source/canAcceptInvitation metadata in the deployed replacement rather than permanently inferring invitation status from consent flags. Current browser-local pins are account-scoped UI preferences and do not grant club authority.

</details>
