# Activity profile / resources — proposed BE contract, 2026-10-12

Implement Status: Not Yet

Status Scope: Backend implementation

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: ActivityEndpoints.cs and ActivityWriteEndpoints.cs provide core CRUD/attendance, but ActivityContracts.cs has no resource gallery/capabilities or cover field; resource upload/commit routes and public activity projection are absent.

This extends [event operations](club-event-operations-api.md), [discovery](activity-discovery-api.md) and the media-intent boundary in [backend handoff](backend-api-implementation-handoff.md). It does not replace registrations, attendance or governance authorization. Source audit: sibling API HEAD `80818266f617bd5144ab1b1a6cd0e74983983a4d`. Existing activity GET/PUT and attendance are declared; activity cover attachment, resource gallery, document/video upload and embedded-link persistence are absent. No BE source/migration was changed.

## Pages and access

- Viewer page: `/v2/activities/{id}`, profile-style cover, title/status/organizer, overview, documents, media and **own** attendance only. No manager controls or roster. Current V2 still requires authentication and uses the existing authorized activity GET; do not call this an anonymous/public transport integration.
- Manager page: `/v2/my-clubs/{clubCode}/activities/{id}`, inside the resolved workspace with separate activity/club-ID validation and current manager gate. Holds core editing, cover upload, resource staging and manager attendance. A manager in club A must not manage an activity in B, even if they can view B. Do not infer rights from local BQL rehearsal, route state or report submission.
- Future CONTENT/event-specialist access must be explicit server activity capabilities from [governance](club-governance-groups-api.md), not global `CLUB_MANAGER` grants. Resource and metadata policies remain distinct from finance, roster and attendance administration.

## Safe read projections

Add `GET /api/public/activities/{id}` for genuinely published, privacy-safe viewer detail. Omit participants, attendance, roster/identity, object keys, upload intents and private resources. Require publication policy and activity status/visibility; no client filter can make a broad transport public.

Extend existing authorized `GET /api/activities/{id}` with optional `coverImageUrl`, `resources` and `resourceCapabilities`. Manager projection can include permitted CLUB resources; other members only within their own club. No signed write URL appears in a read projection. Capability flags default false on unconfigured support and are recomputed per actor/activity.

```json
{"resourceCapabilities":{"canManage":true,"canUpload":true},"resources":[{"id":"resource-id","kind":"DOCUMENT","title":"Thông tin workshop","mimeType":"application/pdf","sizeBytes":20480,"visibility":"PUBLIC","url":"https://media.example.edu/activity-documents/workshop.pdf"}]}
```

`kind`: DOCUMENT / MEDIA / EMBED. `visibility`: PUBLIC / CLUB. Resource metadata includes stable ID, bounded title (160), byte size/MIME for files, ordered position, uploader/audit references **only in authorized manager projections**, version and timestamps. Public resource URLs must be browser-readable; CLUB resources use authorized download delivery or short-lived signed reads that are never reused in public responses. Preserve ordering and explicit availability; null/unconfigured is not an authoritative empty published gallery.

## Upload and commit

The FE provisional resource service uses the existing authenticated API client (`api.request`), not another token client. It is callable from the UI only after the response advertises `canManage` and, for files, `canUpload`. Until then selection/preview is transient and the Save action is disabled; no file bytes or link records are transmitted.

`POST /api/activities/{id}/resources/upload-intents`, Idempotency-Key `<draft-id>:upload`:

```json
{"kind":"DOCUMENT","fileName":"workshop.pdf","mimeType":"application/pdf","sizeBytes":20480}
```

Return `{id,mimeType,uploadUrl,expiresAt}` with a short-lived single-object R2 PUT signature binding activity, actor, object key, exact MIME and byte limit. FE checks HTTPS R2 signed destination and MIME, sends only Content-Type/body (no app token) to R2, then commits through API. Production requires CORS, approved signing origin, intent expiry and a public/private delivery design; successful PUT alone is not attachment persistence. Existing cover flow remains separate (`POST /api/media/upload-intents`, kind `activity-cover`, then `PUT /api/activities/{id}/cover-image`) and is also pending BE implementation.

FE resource PUT also requires the existing public configuration `VITE_R2_S3_ENDPOINT` and `VITE_R2_BUCKET_NAME` to match the signing host/bucket host. An arbitrary R2 account or missing configuration cannot receive the selected file. These values are endpoint/bucket metadata, never signing credentials; signing remains server-side.

`POST /api/activities/{id}/resources`, Idempotency-Key `<draft-id>`:

```json
{"kind":"DOCUMENT","title":"Thông tin workshop","visibility":"CLUB","uploadIntentId":"issued-intent-id"}
```

For links, omit uploadIntentId and use `kind: EMBED`, `url: https://...`. File commit derives storage/delivery fields from its owned issued intent; never accept client blob URLs, arbitrary object keys or public URL ownership claims. Verify object existence, actual bytes/MIME, activity/actor binding, approved file policy, expiry and no replay/cross-activity reuse. Scan/quarantine documents/videos before delivery. Delete abandoned objects on expiry; make retries/idempotent partial batches safe. A committed resource returns its stable ID, and subsequent authorized detail GET includes it. Pending drafts are removed in FE only after that acknowledgement.

Policy defaults implemented in selection: PDF/DOC/DOCX/XLS/XLSX up to 20 MB; JPG/JPEG/PNG/WebP up to 5 MB; MP4/WebM up to 100 MB. These are proposed limits; BE enforces byte/content signatures and document container/macro policy independently. Filename/extension/browser MIME are not proof of contents. No SVG/HTML/executable or macro-extension uploads. Documents default to CLUB; manager explicitly selects visibility before upload. Cover and content editing stay separate forms.

`PATCH /api/activities/{id}/resources/{resourceId}` for title/order/visibility with expectedVersion, and audited detach/delete policy are BE follow-ups; the current FE only removes **unsaved drafts**, not persisted server resources.

## Embedded links

Store an HTTPS URL plus title/visibility/provider, not iframe HTML. Reject script/data/file URLs, credentials, private network targets and invalid host/provider combinations; do not server-fetch arbitrary URLs for previews. FE currently supports controlled YouTube iframe URLs and opens other HTTPS links as external resources. It uses [YouTube's documented iframe format](https://developers.google.com/youtube/player_parameters) with the [privacy-enhanced player](https://support.google.com/youtube/answer/171780), only after an explicit preview click; no autoplay. Additional providers require their own allowlist/adapter. Private documents must not be forwarded to third-party preview services.

## Acceptance / integration

- Same activity ID/club binding on GET, core update, cover, resources and attendance. Test manager in A versus activity B, member versus manager, revoked role, unknown capabilities and partial failures.
- Public transport never includes CLUB URLs, participant/attendance collections or private author fields. Self attendance is a separate authenticated read; public page never loads manager roster.
- Successful resource GET across reload/accounts; published image/browser delivery; authenticated private downloads; scanner failures; object mismatch; MIME/size/extension ambiguity; expired/replayed intent; idempotent retries and orphan cleanup.
- UI stages/validates multiple files atomically, keeps remaining drafts after a partial error, revokes local preview URLs and never reports unsaved resources as persisted. Test tab switching, cancel, cross-activity navigation and disabled Save on current absent endpoints.
