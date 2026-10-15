<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Hardening API giữ và tương thích — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| API-031 | `POST /api/v1/quests/{id}/complete` | **✅ HOÀN THÀNH** | Self-only, phải join, expectedVersion participation, verified eligible proof đúng tác giả/kỳ/source/pillar. Kiểm tra live cancellation trước replay, completion history append-only, không mint thêm điểm. note tối đa500. |
| API-032 | `POST /api/clubs/{id}/join` | **✅ HOÀN THÀNH** | Join bằng canonical profile Auth, active/unlocked/campus, consent và category info. Identity từ body không ghi đè Auth; transaction/unique/retry, key tùy chọn. Auth outage503. |
| API-053 | `PUT /api/clubs/{clubId}/members/{memberId}` | **✅ HOÀN THÀNH** | Giữ route tương thích và trả 403 `PERSONAL_PROFILE_SELF_ONLY` khi yêu cầu sửa hồ sơ cá nhân người khác. Tự sửa dùng canonical self profile. |
| API-070 | `GET /api/v1/student-affairs/benchmarks/active` | **🟡 CHƯA HOÀN THIỆN** | active vẫn có thể tự tạo fallback FA26 khi DB trống và không đồng nghĩa APPROVED. FE không dùng response này làm bằng chứng policy đã được duyệt. |
| API-074 | `POST /api/clubs/{id}/managers` | **🟡 CHƯA HOÀN THIỆN** | Constraint/outbox có sẵn; AssignManager vẫn dùng ManagerUserId/ManagerName từ request, chưa resolve account active/unlocked/current name từ Auth. |

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ security/integrity; BỎ QUA finance/roster development.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

GIỮ cấm manager personal writes/canonical assign-invite identity/quest no arbitrary target verification/production GET no samples/private attachments/custom categories/paging/direct safe detail/deadlines-me nếu giữ UI.

Theo kiểm tra12/10: ReportAttachmentResponse còn StoragePath nhưng mapper trả string.Empty; schema cần bỏ/redact, **không kết luận path thật đã lộ** từ response đã đọc. Club CRUD create/update có custom category fallback; application mapper còn cần sửa, không gọi toàn category CRUD thiếu.

CompleteQuestAsync không cấp trusted points theo StudentUserId tự do; áp dụng [assignment/no self](internal-accounts-verification-api.md), không bắt buộc CTSV official actor. Invite dùng account dự án, **BỎ QUA** school roster validation.

**BỎ QUA** phát triển finance/settlement/paging như phân hệ nghiệm thu; legacy còn giữ quyền/privacy/compatibility. Không duplicate existing club/account/report/notification/role/audit APIs.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Existing API contracts requiring changes, not duplicate endpoints

Implement Status: Not Yet

Status Scope: Backend/consumer hardening

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: MemberManagementEndpoints.cs still permits managed personal snapshot writes; ManagerEndpoints.cs trusts client ManagerName; QuestEndpoints.cs accepts target StudentUserId; ReportContracts.cs exposes StoragePath. Existing routes are not proof of the required fixes.

D14; source audit 2026-10-09, main 80818266. Follow [conventions](api-contract-conventions.md). The following are explicit backend or FE integration tasks rather than evidence that every route is absent.

| Finding and source | Required change | Acceptance |
| --- | --- | --- |
| Auth UserEndpoints management PUT rejects SYSTEM_ADMIN target; legacy SystemAdminProfile disabled | Canonical D02 self PATCH for mutable display/presentation fields; preserve identity/email/roles/locks. Migrate legacy editor, no parallel self PUT contract | admin/student self edits; cross-user/role/email writes denied; reload canonical |
| Club MemberManagementEndpoints UpdateMemberProfile authorizes CanManageMemberships and edits personal snapshot | Revoke manager writes to other members; self edits through D02, immutable application snapshot and private canonical projections. Legacy ClubMembersPage still has this caller | owner/vice/manager cannot edit another user's name/contact; historical application unchanged |
| ManagerEndpoints AssignClubManager trusts ManagerName and does not resolve canonical account | Internal Auth lookup verifies exists/active/unlocked/eligible role/campus; derive name; enforce one active managed club and current ownership workflow atomically | forged name/unknown account/locked account/race/cross-campus denied |
| QuestEndpoints CompleteQuestAsync uses AnyActor and accepts request StudentUserId without a scoped verifier guard in that handler | Self completion may only create a self submission, not verified completion/points; trusted verification requires CTSV scope and target campus. Reuse existing quest catalog, tighten write instead of exposing it as club task award | arbitrary target and self-verified credit denied; two actors, duplicate review |
| Admin anomaly/XP ledger helper seeds example entries on reads | Ensure production reads never create illustrative ledger/anomaly awards; seed only explicit development fixtures; do not promote them into club wallet | empty production DB stays empty after GET; counters never debit/mint samples |
| ReportContracts ReportAttachmentResponse exposes StoragePath | Remove/redact path from read DTO, retain opaque ID and metadata; protected download path unchanged | JSON contains no internal path; author/reviewer authorization and denial tested |
| ClubCategories now persist, but application mapper normalizes through static ValidationExtensions | Validate canonical active category **code** against persisted catalog across club create/update/public-profile/application. Preserve unknown historical code; do not collapse valid custom category to OTHER | new category round-trip all flows; invalid/disabled category denied |
| Reports/Finance/Notifications FE filter only first 100 rows | Extend existing query params/paging where unsupported; switch FE to server-side search/status/period filters and total counts | >100 rows, page boundaries and server-role scope; no extra duplicate list API |
| CreateReportPage author fetches admin reporting deadlines and catches 403 | Reuse existing `/api/deadlines/me`, not another deadline endpoint | ordinary author receives own applicable dates; admin directory remains protected |
| ActivityDetailPage finds detail through whole feed | Use D11 display-safe direct detail; management GET stays protected | cold direct URL, 403/404, private records absent |
| Invite POST already exists, semesterId ignored and client FullName trusted | D05 roster revalidation/source/outbox; migration and compatibility documented | selection-to-invite race, false consent, manager cannot personally accept |

Structured error `code/errors` are currently lost by the FE client after message formatting. Add non-breaking Error metadata when wiring new contracts; retain existing status handling and refresh logic. Endpoint existence is not production proof. Read/write authorization, campus policy, DB migration and gateway behavior must be validated separately.

Backend-only existing workflows (disband/transfer/reviews, global roles, audit, manual finance adjustment, approved-report activity creation) are FE work if adding screens; do not duplicate them as missing endpoints. Finance submit routes whose existing handler is acknowledgment-only require lifecycle verification before a button is treated as a state transition.

## Compatibility notes retained from the retired facade audit — 2026-10-13

- User create/update management supports its existing restricted role catalog; Google sign-in is the credential flow, not a client-supplied password. SYSTEM_ADMIN self editing must use the future canonical self profile, not broaden management PUT.
- Admin club PUT accepts logoUrl and can default isActive to true; preserve state in existing callers. Assigned club managers require the scoped public-profile/media writers rather than admin PUT. Activity generic PUT has no cover-image field.
- Activity registration/check-in/completion return action results, not ActivityResponse. Existing FE reloads authorized detail after actions, does not send status in the core edit request, and maps attendance's paged response. Keep that response compatibility when extending resources.
- Existing authenticated report downloads are the attachment transport; never use StoragePath as a browser URL. D14 still must redact the JSON storage path.
- Dashboard counts/next activity compose existing club, activity, manager-membership and report reads. No contribution-review total is fabricated; D07 owns that missing projection. Upcoming/pending card summaries remain optional richer selection data.
- Existing owner transfer/disband/reviews, roles/audit, manual finance adjustments and approved-report activity creation are established backend workflows, not missing APIs just because there is no UI facade/screen. Keep final lifecycle verification separate from route declarations.
