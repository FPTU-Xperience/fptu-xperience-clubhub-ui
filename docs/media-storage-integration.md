# Public image storage integration

The source-backed existing/missing API comparison and proposed backend request/response contract are in [contracts/public-image-api.md](contracts/public-image-api.md).
The audit of every frontend API method is in [contracts/frontend-api-audit.md](contracts/frontend-api-audit.md).

## Image inventory

| Image | R2 key prefix | Owner and UI | Record field |
| --- | --- | --- | --- |
| Club application logo | `club/applications/` | Applicant, club creation form | `ClubCreationApplication.LogoUrl` (already exists) |
| Club logo | `club/{clubId}/` | Club manager, `Trang CLB` | `Club.LogoUrl` (already exists) |
| Club cover | `club/{clubId}/` | Club manager, `Trang CLB` | Add `Club.CoverImageUrl`; public detail DTO currently returns `null` |
| Activity cover | `public/activities/{activityId}/` | Club manager, workspace activities tab | Add `Activity.CoverImageUrl` to entity and feed/detail DTOs |
| Student avatar | `student/{userId}/` | Authenticated student, `/v2/profile` | Current V2 profile is account-scoped local preview; add a real profile field and endpoint before claiming cross-device persistence |
| Site branding (`fptux.png`, favicon) | Keep in `public/` | Maintainers | Versioned static assets, not user uploads |
| Reports and attachments | Keep in the protected report store | Authorized report users | Private documents must not enter the public-image bucket |

The UI now accepts JPG, PNG, and WebP files up to 5 MB. Server validation must independently inspect the bytes, content type, size, and image dimensions; client checks are only a convenience. Disallow SVG and executable formats. The server assigns opaque object keys and ignores any client-supplied path or identity when deciding access.

## API contract needed for live uploads

The UI is wired to these routes through `src/services/api.js`:

1. `POST /api/media/upload-intents`, authenticated JSON `{ "kind": "club-logo", "ownerId": "123", "contentType": "image/webp", "sizeBytes": 1024 }`. Kinds are `club-application-logo`, `club-logo`, `club-cover`, `activity-cover`, and `student-avatar`; `ownerId` is optional for a new club application and means an application ID when kind is `club-application-logo`. Respond `{ "uploadUrl": "https://<account>.r2.cloudflarestorage.com/<bucket>/<key>?X-Amz-...", "publicUrl": "https://<image-domain>/<key>", "key": "<key>" }`. The server chooses an opaque key, verifies the actor may upload that kind for the target record, checks size/type, and signs a short-lived `PutObject` URL with the exact `Content-Type`. It must not use `ownerId` as proof of ownership. The browser PUTs the file directly to `uploadUrl` without a JWT or R2 secret, then uses `publicUrl` only after a successful PUT.
2. `PUT /api/clubs/{clubId}/public-images`, manager only, JSON `{ "logoUrl": "...", "coverImageUrl": "..." }`. Accept only image URLs issued by the media service for this club, persist both fields, and return the updated club. Add `CoverImageUrl` to the club entity/migration, club response, and public detail mapping.
3. `PUT /api/activities/{activityId}/cover-image`, manager of the owning club only, JSON `{ "coverImageUrl": "..." }`. Accept only an issued activity image URL, persist it, and include `coverImageUrl` in activity feed/detail responses.
4. Student avatar needs a durable authenticated profile write endpoint. Until then, `/v2/profile` stores the returned image URL in the existing account-scoped preview repository on this device.

The club application form already submits `logoUrl` through the existing create/update application endpoints. An image is uploaded when that form is submitted. The record-write endpoints must verify that a submitted URL belongs to an issued key for that actor and target, and that the object exists in R2 before persisting it. A client-provided URL alone is not authorization. If the subsequent record write fails, the uploaded object can be orphaned; the media service should expire unattached objects or support deletion after failed writes.

The current backend has **none** of the media routes above. Its gateway also has no `/api/media` route. The UI displays server errors when these endpoints are unavailable and does not claim a successful save until the record write succeeds.

## Cloudflare setup

The supplied bucket configuration is:

```text
R2 account ID: c2e463013aa669515ae4e2c54843c4ae
S3 client endpoint: https://c2e463013aa669515ae4e2c54843c4ae.r2.cloudflarestorage.com
Bucket: fptux-cloud-storage
S3 region: auto
```

The screenshot's S3 API URL appends `/fptux-cloud-storage` to the account endpoint. Configure an S3 SDK with the account endpoint above and pass the bucket name separately. The signing service needs a bucket-scoped R2 Access Key ID and Secret Access Key as server secrets. The existing Cloudflare Pages deployment token is a different credential and must not be used as an image upload key. Do not place R2 credentials in this UI's `.env` files or GitHub build variables prefixed `VITE_`.

For the UI build, `.env.development` provides `VITE_R2_BUCKET_NAME` and `VITE_R2_S3_ENDPOINT` locally. The Cloudflare Pages workflow injects those same public identifiers into `npm run build`, using repository variables when set and the supplied values as defaults. `.env.development` is gitignored. These build variables do not authenticate uploads or configure the backend API; the backend needs its own server-side R2 configuration.

The shown `fptux-cloud-storage` bucket has public access disabled. For images used in `<img>` tags, configure a production custom domain for public reads or a controlled read proxy. The S3 endpoint used for signed PUTs is not the public image URL. If using the custom domain, make `publicUrl` point there. Configure cache headers for versioned object keys and keep old URLs valid or clean them up when references change.

Configure R2 CORS for the UI's production origin and local development origin (`http://localhost:5173`): allow `PUT`, allow the `Content-Type` header, and optionally expose `ETag`. The browser sends the signed `Content-Type` and file body only. Presigned PUT URLs work on the R2 S3 endpoint, not a custom read domain. A minimal policy is:

```json
[{"AllowedOrigins":["https://<UI_ORIGIN>","http://localhost:5173"],"AllowedMethods":["PUT"],"AllowedHeaders":["Content-Type"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3600}]
```

Cloudflare references: [public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/), [presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), and [browser CORS](https://developers.cloudflare.com/r2/buckets/cors/).

Before enabling the UI in production, verify a manager can upload and replace their club's logo/cover, cannot upload for another club, a student can change only their own avatar, activity covers survive refresh, a public viewer can fetch image URLs without credentials, and unauthorized or oversized uploads fail without creating record references.
