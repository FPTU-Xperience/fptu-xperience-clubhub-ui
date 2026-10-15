<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Quy ước API đang áp dụng — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

**🟡 CHƯA HOÀN THIỆN đồng nhất:** mutation key/version và CAS đã có ở luồng mới; paging dùng cả total và totalItems, lỗi có handler chỉ code/message. FE đọc shape theo từng route; không giả định sourceType/status query ở queue đã được hỗ trợ.

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ — HỖ TRỢ.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

## Quy ước hiện hành

- Browser gọi facade hiện có qua Gateway/VITE_API_BASE_URL; presigned image PUT không gửi application token ra storage. Principal và scope server quyết định quyền.
- ID cũ integer giữ nguyên; tài nguyên mới có thể GUID. JSON camelCase, version opaque; instants UTC/offset ISO8601, dates YYYY-MM-DD, giờ buổi Asia/Ho_Chi_Minh. Semester.Id/SemesterCode là authority, không hard-code FA26.
- Paging hiện có: contribution/ledger/manual dùng items/page/pageSize/total/totalPages; member/attendance legacy dùng totalItems, page≥1, pageSize1..100, order ổn định. Route cũ có adapter tương thích; tổng phải từ server, không đếm trang đầu.
- Error mới: message/code; traceId/errors chưa được tất cả handler chuẩn hóa; 400 input,401 auth,403 quyền,404 unavailable,409 version/state/duplicate,429 rate,503 service/policy. FE giữ code/errors, không chỉ message. Thiếu policy được duyệt dùng SCORE_POLICY_UNAPPROVED, không fake0.
- PATCH omitted giữ, null clear nullable, unknown/identity/authority fields reject; expectedVersion recheck tại commit. Mutation trả canonical state/receipt.
- Idempotency-Key cho submit/review/upgrade/correction/check-in/assignment và side effect không lặp; persist actor+route+key+requestHash+response ít nhất24h. Khác payload cùng key→409. Unique nguồn/revision và transaction chống race kể cả khác key.
- Outbox cùng source transaction; consumer dedupe eventId, failure delivery không dựng fake success/counter. Notification chỉ đúng recipient, metadata riêng tư tối thiểu.
- Self profile/radar/evidence/history self-only hoặc reviewer được giao. Club manager không sửa hồ sơ cá nhân người khác. Cấm duyệt/điều chỉnh thủ công contribution của mình qua mọi route.
- Experience raw points/radar/ERI không phải tiền/ví. **BỎ QUA** awards/redemptions/negative-wallet debt/cosmetic entitlement/import roster của bản cũ. Ledger trải nghiệm chỉ ghi thêm, có nguồn/verifier/policy, reversal có lý do.
- Sample không tự được ghi khi GET hoặc migrate thành verified scores. Empty, unconfigured và service failure có trạng thái khác nhau.

Nghiệm thu: DB/migration/restart, quyền own/other club/self/reviewer revoked, concurrent/replay/rollback, gateway và FE integration. [Scoring](experience-scoring-contract.md), [quyền](internal-accounts-verification-api.md) quyết định policy.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# API debt: shared implementation conventions

Implement Status: Not Yet

Status Scope: Backend adoption of proposed conventions

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: Shared auth/error/outbox infrastructure exists, but proposed endpoints do not yet implement this package-wide version, principal, idempotency and migration contract. ClubMembershipResponse lacks version/capability/source; no own withdrawal/pin resources.

Audit date: 2026-10-09. These conventions apply to the **proposed** endpoints in this package; existing production routes retain their compatibility until an explicit migration. See [implementation handoff](backend-api-implementation-handoff.md).

## Authority and transport

- Browser calls the existing `src/services/api.js` facade through `VITE_API_BASE_URL`/Gateway. Only presigned object PUT bypasses the gateway; it never sends an application bearer token to R2. No second client or direct browser calls to internal services.
- Identity comes from the principal. Cross-service roster/profile/access reads require authenticated internal service communication with purpose, campus and club scope. Never trust submitted names, role names, prices or client permission flags.
- Dates for instants are ISO-8601 UTC/offset values. Calendar dates are `YYYY-MM-DD`; local club/timetable times are `HH:mm` in `Asia/Ho_Chi_Minh`. `24:00` is permitted only as a same-day schedule end, never a start.
- Existing user/club/activity/membership IDs remain positive integers. New resources may use opaque GUIDs. JSON uses camelCase; versions are opaque strings, never client-generated timestamps.
- Semester authority is existing AdminService `Semester.Id` (GUID) and `SemesterCode`. FE `SP/SU/FA` and calendar year are UI aliases, not a second semester catalog. Resolve aliases through explicit server metadata; do not assume every `SemesterCode` fits `FALL2026` or infer current semester from browser time.

## Standard responses

Paged new reads return `{ items, page, pageSize, totalItems, totalPages }`, page starts at 1, pageSize 1..100 unless a narrower route specifies otherwise; use deterministic ordering plus ID tie-breaker. Eligible-member lookup retains its existing `semesterId` echo. Empty success is an empty collection, not 404. Unconfigured/unavailable resources use explicit error codes, not fabricated zero values.

Errors retain a human-readable `message` compatible with the current FE client and add stable `code`, `traceId`, and optional field `errors`:

```json
{"message":"The resource changed. Reload and retry.","code":"VERSION_CONFLICT","traceId":"opaque","errors":{}}
```

400 invalid request/unknown fields, 401 invalid session, 403 disallowed operation/field, 404 nonexistent or intentionally undiscoverable resource, 409 stale version/state/duplicate/insufficient points, 422 roster eligibility failure, 429 rate limit, 503 dependency/config unavailable. Return `Retry-After` when appropriate. Redact secrets, private record data and existence details. FE currently retains `status` and formatted message only; a follow-up must retain structured `code/errors` before relying on code-specific UI behavior.

Partial PATCH: omitted values preserve existing values; explicit `null` clears nullable fields, empty strings clear optional text. Reject unknown fields and writable identity/authority fields. Each mutation returns the canonical updated record with `version` unless its contract specifies 204. Use `expectedVersion` on mutable resources; verify state and ownership again at commit.

## Transactions, events and privacy

Idempotency-Key applies to irreversible awards/redemptions/import commits/invitations and append-only evidence/registration submissions. Persist `(actor, route, key, requestHash)` with the committed response for at least 24 hours; same key + changed payload is 409, same request returns original result. Database constraints and transactions still prevent races with different keys.

Cross-service side effects use an outbox committed alongside the source mutation; consumers deduplicate `eventId`. Award/redemption must not succeed halfway through a debit/grant. Notification delivery failure never rolls back an already committed invitation; retry delivery independently.

Self-profile and timetable are self-only. Club leadership never edits another member's personal profile. Scoped organizational roles never grant global admin/CTSV rights. Public DTOs exclude rosters, contacts, user IDs, ledger internals and storage paths. Spendable club credit, raw experience points, Admin XP ledger and financial money are separate quantities; no implicit conversion.

## Required proof per implementation batch

Migrations and upgrade/backfill; endpoint/DTO contracts; principal/campus/club tests; stale-version/concurrent/replay tests; service-failure behavior; outbox/consumer tests where applicable; gateway route precedence and verbs; authenticated FE integration after deployment. Source existence is not a live integration sign-off. Never promote browser fixtures, sample wallets or locally acquired cosmetic ownership into real server grants.


</details>
