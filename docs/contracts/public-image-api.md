# Public image API contract (backend work required)

Status: proposed contract for `fptu-xperience-clubhub-api`, verified against its source on 2026-10-05. The four routes proposed below are not implemented yet. The first three have frontend callers in `src/services/api.js`; the avatar write will need a frontend caller when the backend route exists.

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

`kind` is one of `club-application-logo`, `club-logo`, `club-cover`, `activity-cover`, `student-avatar`. For a new club application, `club-application-logo` omits `ownerId`; when revising one, `ownerId` is its application ID. This distinct kind prevents an application ID from being confused with a club ID. For a student avatar, the server derives identity from the authenticated principal and treats any supplied `ownerId` only as a consistency check. For existing club and activity images, require the server-verified club manager assignment or administrative authorization. Validate the owner record and activity-to-club relationship. Club application uploads require an applicant who is eligible to create or revise the application.

Return `201 Created`:

```json
{"uploadUrl":"https://<account>.r2.cloudflarestorage.com/<bucket>/<opaque-key>?X-Amz-...","publicUrl":"https://<read-domain>/<opaque-key>","key":"<opaque-key>"}
```

The service chooses the key, stores a short-lived intent binding actor, kind, owner, key, content type, size, expiry and completion state, and signs a short-lived R2 `PutObject` URL for that bucket/key and exact `Content-Type`. Do not return R2 access credentials. Accept JPEG, PNG and WebP up to 5 MiB; inspect actual bytes and dimensions before attaching a URL. The browser uploads directly with `PUT`, the exact content type, and no application bearer token. R2 CORS must allow the deployed UI origin and `PUT` with `Content-Type`.

The R2 bucket shown to the team has public access disabled. Configure a public read custom domain or controlled image proxy before issuing `publicUrl`; an S3 API URL is not a usable public image URL. Store R2 key and ownership in backend metadata. A URL alone must never authorize a record change.

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

## 4. Persist the student's avatar

`PUT /api/users/me/avatar` (authenticated self-service), request `{ "avatarUrl": "https://<read-domain>/<issued-key>" }`; `null` clears. Return `200 OK` with the current-user DTO including `avatarUrl`. Add avatar storage and `avatarUrl` to `GET /api/users/me`; expose it in other user DTOs only where privacy rules allow. Accept only an issued `student-avatar` object for the current principal. Once this exists, replace the local preview avatar write in `/v2/profile` with this route and read its value from `/api/users/me`. The current admin `PUT /api/users/{id}` is not a self-service alternative and has no avatar field.

## Shared behavior and rollout

- Attach an object to at most one compatible record. On replacement or abandoned upload, expire unattached objects with a lifecycle job; do not delete an old object while still referenced elsewhere.
- Keep signing credentials server-side. Deployment needs server secrets for R2 Access Key ID/Secret, account endpoint, bucket and public read origin. Frontend `VITE_R2_*` values are public identifiers used only to validate a signed upload URL.
- Add route, authorization, validation, persistence and gateway tests in the backend. Verify cross-club denial, self-only avatar updates, expired/replayed intent denial, content mismatch, R2 outage, and public image reads.
- The frontend's file upload controls currently fail with an API error until route 1 exists. Club manager, activity and profile saves additionally depend on routes 2–4. Existing URL-only club application and admin logo writes can use the current API, subject to the backend's current lack of issued-object verification.
