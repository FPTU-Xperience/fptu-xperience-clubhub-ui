# Ảnh công bố cơ bản và minh chứng riêng tư — cập nhật 2026-10-12

Implement Status: Not Yet

Status Scope: BE verified basic image flows; remaining kinds and live storage acceptance separate

Backend Progress: PARTIAL_BASIC_IMAGES_IMPLEMENTED

Source Review: 2026-10-23; backend `b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62` on `feat/backend-contract-completion`, not backend main. Existing BE proof: 914 passed / 0 failed / 0 skipped; source/local SQL verification, not FE/live acceptance.

Source Evidence: [BE source handoff](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/blob/b1edcbf1f4aefb95c5d8020ee9f7d159b9c20a62/docs/audit/HO_SO_CA_NHAN_BE_2026-10-22.md); [current operation status](be-api-status.md); [wire details](backend-current-integration.md#profile).

**Đã có BE:** POST /api/media/upload-intents và attach club-logo/club-cover/activity-cover/student-avatar/student-cover đã có; ảnh verified bất biến, PNG/JPEG/WebP <=5 MiB.

**Chưa hoàn thành / giới hạn:** Application-logo/club-shape chưa hoàn thành; không tự cấp quyền cho kind mới. R2/CORS/signing origin/delivery/cleanup live chưa nghiệm thu.

Nhãn này mô tả đúng phạm vi ở `Status Scope`; Done của tài liệu/read/source không có nghĩa cả dự án, UI hay deploy đã xong. Các nhận định trước 23/10 và payload đề xuất dưới phần lịch sử không thay trạng thái/wire hiện hành.

<details>
<summary>Yêu cầu gốc và lịch sử trước đồng bộ 23/10 — giữ để tham khảo; không phải trạng thái hiện hành</summary>

<!-- CAPSTONE_SCOPE_2026_10_12 -->
# Ảnh công bố cơ bản và minh chứng riêng tư — cập nhật 2026-10-12

<!-- BE_STATUS_2026_10_14_START -->
## Trạng thái BE hiện hành — 14/10/2026

Đọc [bảng trạng thái API theo actor](be-api-status.md) và [route/DTO thực tế để làm FE](be-integration-guide.md). Nhãn bên dưới là tiến độ BE; không đánh dấu màn hình FE/deployment đã hoàn thành. Nhận định tiến độ cũ và phần lịch sử bên dưới không thay bảng này.

| ID | API thực tế / đề xuất còn thiếu | Trạng thái BE | FE cần biết |
| --- | --- | --- | --- |
| SUP-01 | `POST /api/media/upload-intents` | **✅ HOÀN THÀNH** | Club/activity public image intent; R2 thật cần cấu hình. Kind chỉ club-logo/club-cover/activity-cover, không avatar/cover cá nhân. |
| SUP-02 | `PUT /api/clubs/{clubId}/public-images` | **🟡 CHƯA HOÀN THIỆN** | Write/issued-object verify đã có; cần expectedVersion nhưng manager detail GET chưa trả version, cùng vướng mắc API-033. Không mở Save trước khi BE bổ sung read DTO. |
| SUP-03 | `PUT /api/activities/{activityId}/cover-image` | **✅ HOÀN THÀNH** | Cover activity đúng quyền/version; giữ blueprint và lịch sử. |

<!-- BE_STATUS_2026_10_14_END -->

**Quyết định: GIỮ — HỖ TRỢ; BỎ QUA reward assets.**

[Phạm vi v1.4](capstone-scope-contract.md) ưu tiên hơn bản ngày 05–09/10. BỎ QUA là đánh dấu phạm vi, không xóa code/API/dữ liệu hoặc bỏ kiểm tra quyền. Trạng thái BE và route/DTO đã chốt xem cập nhật 14/10 ở đầu file; các phần chưa triển khai vẫn là đề xuất. Tích hợp FE và deployment được kiểm tra riêng.

GIỮ upload intent/club logo-cover/activity cover/basic avatar nếu UI hứa upload: scope đúng club/self, issued-object ownership/type/size, canonical attachment/DB/Gateway; không fake upload success. Giữ lựa chọn R2 hiện có nếu triển khai, không đổi nhà cung cấp.

**BỎ QUA:** club-shape/reward catalog assets, bắt buộc student-cover/complex layering, club-application-logo mới nếu không chọn club application flow (admin create club đủ phiếu). Không cần tất cả kind trong catalog cũ.

Contribution/attendance evidence **private** theo [contribution](verified-contributions-api.md); không public image intents/storagePath/PII URLs. Basic images hỗ trợ, private evidence bắt buộc.

<details>
<summary>LỊCH SỬ trước 12/10 — giữ nguyên; không dùng phần BỎ QUA để chốt MVP</summary>

# Public image API contract (backend work required)

Historical Implement Status: Not Yet

Historical Status Scope: Backend implementation and storage integration

Historical Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Historical Source Evidence: Club.LogoUrl is readable; public detail mapper returns null cover. No media upload intent, public-images PUT, activity cover PUT or user-image persistence; yarp.json has no /api/media route.

Status: proposed contract for `fptu-xperience-clubhub-api`, rechecked on 2026-10-09 against fetched main `80818266`. The three currently called media/club/activity routes remain absent; self image attachment uses the canonical profile contract below. The first three have frontend callers in `src/services/api.js`; self avatar/background and club shape upload need facade integration when the backend contract exists.

## Existing API baseline

| Flow | Backend route and current capability | Frontend integration |
| --- | --- | --- |
| Club application logo | `POST /api/clubs/applications`, `PUT /api/clubs/applications/{id}` accept `logoUrl` | `ClubsPage.jsx` submits the logo URL; selected files first call upload intent. |
| Admin club logo | `PUT /api/clubs/{id}` accepts `logoUrl`; `StudentAffairsAdministration` allows `ADMIN` and `STUDENT_AFFAIRS_ADMIN` | Admin logo editor in `ClubsPage.jsx` uses `api.updateClub`, sending `isActive` too because the backend request defaults it to `true`. Club managers cannot call this route. |
| Club reads | `GET /api/clubs`, `GET /api/clubs/{id}` return `logoUrl`; public detail DTO declares `coverImageUrl` but mapper returns `null` | Existing club cards and workspace read these URLs. |
| Activity reads and writes | `GET /api/activities`, `GET /api/activities/{id}`, `PUT /api/activities/{id}` exist; activity entity, responses, and update request have no cover field | Existing activity editor cannot save a cover through the generic PUT. |
| Self profile | `GET /api/users/me` exists; there is no self-write or avatar field | `/v2/profile` currently saves its avatar URL in account-scoped local preview state. |

Source: `ClubService/Endpoints/{ApplicationEndpoints,ClubEndpoints}.cs`, `ClubService/Contracts/ClubContracts.cs`, `ClubService/Mappers/ClubMappers.cs`, `ActivityService/Endpoints/{ActivityEndpoints,ActivityWriteEndpoints}.cs`, `ActivityService/Contracts/ActivityContracts.cs`, `AuthService/Endpoints/UserEndpoints.cs`, and `Shared/ClubReportHub.Shared/Auth/JwtServiceCollectionExtensions.cs` in the sibling API repository. The gateway's `yarp.json` has no `/api/media` route.

## 1. Issue a direct upload intent

`POST /api/media/upload-intents` (authenticated). Add a media service route to the API gateway.

```json
{"kind":"club-logo","ownerId":"123","contentType":"image/webp","sizeBytes":1024}
```

`kind` is one of `club-application-logo`, `club-logo`, `club-cover`, `activity-cover`, `student-avatar`, `student-cover`, `club-shape`. For a new club application, `club-application-logo` omits `ownerId`; when revising one, `ownerId` is its application ID. This distinct kind prevents an application ID from being confused with a club ID. For a student avatar, the server derives identity from the authenticated principal and treats any supplied `ownerId` only as a consistency check. For existing club and activity images, require the server-verified club manager assignment or administrative authorization. Validate the owner record and activity-to-club relationship. Club application uploads require an applicant who is eligible to create or revise the application.

Return `201 Created`:

```json
{"uploadUrl":"https://<account>.r2.cloudflarestorage.com/<bucket>/<opaque-key>?X-Amz-...","publicUrl":"https://<read-domain>/<opaque-key>","key":"<opaque-key>"}
```

The service chooses the key, stores a short-lived intent binding actor, kind, owner, key, content type, size, expiry and completion state, and signs a short-lived R2 `PutObject` URL for that bucket/key and exact `Content-Type`. Do not return R2 access credentials. Accept JPEG, PNG and WebP up to 5 MiB; inspect actual bytes and dimensions before attaching a URL. The browser uploads directly with `PUT`, the exact content type, and no application bearer token. R2 CORS must allow the deployed UI origin and `PUT` with `Content-Type`.

The selected public delivery origin is `https://pub-3092f35e8d664b8caf203e269232769a.r2.dev`; keep R2 storage, not Cloudflare Images. Configuration choice is confirmed, but object readability/CORS/live signing were not tested in this source audit. An S3 API URL is not a usable public image URL. Store R2 key and ownership in backend metadata. A URL alone must never authorize a record change.

Errors: `400` invalid kind/type/size/owner format, `401` unauthenticated, `403` actor lacks target permission, `404` target missing, `429` quota/rate limit, `503` signing or storage configuration unavailable. Avoid signing before validation and authorization.

## 2. Save club public images as a manager

`PUT /api/clubs/{clubId}/public-images` (authenticated assigned club manager; optionally student affairs admin).

```json
{"logoUrl":"https://<read-domain>/<issued-key>","coverImageUrl":"https://<read-domain>/<issued-key>"}
```

Both values represent the desired full state; allow `null` to clear either field. Return `200 OK` with the updated club DTO including both fields. Add `CoverImageUrl` to the club entity, migration, response DTOs and public detail mapper. Preserve unrelated club fields and active/deleted status. Confirm each non-null URL maps to an unexpired intent for the same actor and club (or a URL already attached to that club), and that the object exists and passes server-side image validation. The current admin `PUT /api/clubs/{id}` cannot be used here: its policy rejects club managers and its `IsActive` default can reactivate a club. Apply the same issued-object validation to application and admin logo writes when they receive R2 URLs.

Errors: `400` malformed URL or invalid image, `401`, `403`, `404`, `409` conflicting/expired intent.

## 3. Save an activity cover

`PUT /api/activities/{activityId}/cover-image` (authenticated manager of the activity's owning club; optionally an existing activity administrator).

```json
{"coverImageUrl":"https://<read-domain>/<issued-key>"}
```

Allow `null` to clear. Return `200 OK` with updated activity DTO. Add `CoverImageUrl` to the activity entity/migration, list/detail DTOs, and any creation/update response mapping. Validate the issued object belongs to this activity and actor. Use the existing activity management authorization helper and verify its current policy fits this route. Preserve other activity fields and status. Errors: `400`, `401`, `403`, `404`, `409` as above.

## 4. Canonical self images and club shape assets

Student avatar/background attachment uses PATCH `/api/users/me/profile` with `profile.avatarUrl` / `profile.coverImageUrl` and expectedVersion, per [self-profile contract](self-profile-sync-api.md). This supersedes the earlier standalone proposed PUT `/api/users/me/avatar`; do not implement duplicate profile writes unless a compatibility alias is deliberately required. GET profile returns canonical URLs; `/api/users/me` may additionally expose avatar for account chrome under the same privacy policy.

`student-avatar` and `student-cover` intents derive user identity from principal. `club-shape` is a separately managed club-owned transparent PNG asset, requiring catalog publication capability and the actual issuing club ID. PNG only, <=1 MiB, <=4096x4096, decoded transparency check; regular background/avatar/logo allow JPEG/PNG/WebP <=5 MiB with bounded decoded dimensions (proposed <=8192 per side). Reject malformed payload, wrong declared MIME and dimension decompression abuse. User SVG is not accepted; authored starter SVG assets remain controlled application assets.

Shape publication attaches the verified object through the club reward catalog contract, returning immutable asset/cosmetic IDs and provenance. Uploaded background and shape are separate objects/scopes. Private contribution evidence is not a public-image intent; reuse protected evidence storage or add a distinct private-media contract. R2 upload keys must not contain personally identifying names/emails.

## Shared behavior and rollout

- Attach an object to at most one compatible record. On replacement or abandoned upload, expire unattached objects with a lifecycle job; do not delete an old object while still referenced elsewhere.
- Keep signing credentials server-side. Deployment needs server secrets for R2 Access Key ID/Secret, account endpoint, bucket and public read origin. Frontend `VITE_R2_*` values are public identifiers used only to validate a signed upload URL.
- Add route, authorization, validation, persistence and gateway tests in the backend. Verify cross-club denial, self-only avatar updates, expired/replayed intent denial, content mismatch, R2 outage, and public image reads.
- The frontend's file upload controls currently fail with an API error until route 1 exists. Club manager, activity and profile saves additionally depend on routes 2–3 and canonical self-profile/shape publication. Existing URL-only club application and admin logo writes can use the current API, subject to the backend's current lack of issued-object verification.


## Attach verification and rollout additions

The existing FE uploads PUT then submits the returned publicUrl. Keep that wire compatibility initially; on attachment the backend verifies intent binding/HEAD and decoded bytes, marks a durable object verified and consumed/attached, and returns the canonical record. An issued URL is not proof that an object was uploaded. Reusing an already attached URL on the same owner preserves it even after the original intent expiry; cross-owner reuse/replay is denied. Replacement may leave an unattached orphan if the record save fails; cleanup must not remove referenced old objects. Add expectedVersion support to independent logo/cover saves to prevent stale full-state PUT from overwriting the other image; FE currently sends both URLs and must be updated together.

Follow [conventions](api-contract-conventions.md), D01 in [handoff](backend-api-implementation-handoff.md). Actual signing credentials stay server-side. Public domain selection does not verify Gateway, object reads, CORS, backend secrets or deployment. Test all of those before calling upload integration live.


</details>

</details>
