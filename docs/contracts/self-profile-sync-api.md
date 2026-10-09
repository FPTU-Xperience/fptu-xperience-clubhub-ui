# Self profile and club member projection

Scope agreed: UI and contract first, temporary data; no backend source modifications or live synchronization claims.

## Current UI behavior

- `profile-data.js` remains an account-scoped browser repository. If no saved profile exists, it imports the latest own membership snapshot returned by `getMyMemberships`, matching authenticated user ID. Saved personal edits take precedence over snapshots. Registration reason, expectations and contributions remain application data and are not imported into profile.
- Profile editing uses a separate `EditProfileModal` with Introduction, Personal and Academic tabs. Preview validates and stages the whole draft without writing storage. Save changes at the bottom of the page persists it; Cancel restores the saved profile. Image editing stays separate.
- The own member row/detail uses the same temporary profile. It never reads another user's local profile record. Other members continue to display explicitly labeled registration snapshots until a scoped server projection exists. Updates remain device-local; no API PUT to another member is issued.
- Profile changes notify same-browser views and storage events refresh other tabs. Self-registration uses the same profile repository.

## Required backend contract

Source audit of fetched `clubhub-api` main `80818266f617bd5144ab1b1a6cd0e74983983a4d`: `/api/users/me` returns auth identity, user updates require system administration. No self-profile write contract exists. Club member details currently map personal fields from `ClubMembership` snapshots.

Proposed endpoints, not yet called by UI:

- `GET /api/users/me/profile`: canonical self profile `{ userId, version, profile: { displayName, headline, about, skills, interests, avatarUrl, coverImageUrl }, personal: { dateOfBirth, phoneNumber, address }, academic: { campus, major, year, studentCode } }`.
- `PATCH /api/users/me/profile`: editable profile/personal fields plus `expectedVersion`; return canonical updated snapshot/version. Identity/email/global roles must not be writable. Imported academic identity may be read-only according to CTSV rules; return explicit editable-field metadata.
- Existing club member list/detail queries project current personal fields from the owning user's profile, subject to club access/privacy. Include `profileSource: "user-profile"` and a separately named `applicationSnapshot` for historical join answers; do not overwrite application history when a profile changes.

Only the current user can update personal profile. Club president/vice-president full club authority does not grant personal-profile write permission. Member detail access is scoped to the actual club and allowed viewers. Never introduce a public arbitrary-user profile endpoint exposing phone, address or date of birth.

Suggested errors: 401 unauthenticated, 403 forbidden field/action, 400 invalid data, 409 stale profile version. Validate date, phone, text/list limits and stored image URL ownership. ClubService can use a scoped profile read integration or event-driven projection; updates must propagate consistently without requiring one write per membership.

## Migration and verification

1. Implement canonical persistence, self read/write authorization and user-owned media storage.
2. Implement private club projection and separate historical application answers, removing manager profile-write access.
3. Route repository load/save through the existing `src/services/api.js`. Offer explicit review/import of local fields; do not silently upload browser data or replace newer server records. Keep local mode clearly isolated.
4. Verify profile save updates member details across devices/clubs, application answers remain unchanged, manager edits and cross-account access are denied, concurrency rejects stale edits, failed saves keep previews, Cancel makes no API calls and privacy projection excludes personal fields.


## Canonical implementation update — 2026-10-09

Follow [shared conventions](api-contract-conventions.md) and D02 in [the handoff](backend-api-implementation-handoff.md). This GET/PATCH pair supersedes older proposed `PUT /api/users/me/profile` and `GET /api/users/me/student-profile`; do not build three competing profile stores. Legacy admin display-name editor must use the same self-service PATCH without changing account identity.

GET returns `{userId,version,profile,personal,academic,onboarding,editableFields}`. Profile includes `displayName`, `headline`, `about`, `skills`, `interests`, `avatarUrl`, `coverImageUrl`, `coverPreset`, `coverBackgroundColor`, `coverShape`, `coverShapeTransform`, `coverText`. `coverPreset` is a free/owned color ID or `custom`; the latter uses the separate background image while retaining `coverBackgroundColor`. Shape/text remain above either background. Definitions/limits are in [cover rewards](profile-cover-rewards-api.md). GET must return explicit defaults for legacy records.

PATCH is a partial `{profile?:{...},personal?:{...},academic?:{...},onboarding?:{...},expectedVersion}` and returns the full canonical snapshot. Preserve the server shape above; the FE temporary flat `saveProfile` patch needs an adapter, not a second persistence model. Reject identity/email/global roles, unknown fields and fields not authorized by `editableFields`. Limits: displayName 1..120, headline <=160, about <=2000, skills/interests <=12 unique entries of <=80 chars each; birthday real nonfuture date, phone optional `+` plus 9..15 digits, address <=500. Private contacts remain private. Academic campus/studentCode and imported identity are CTSV-owned; return editable metadata for self major/year only where policy permits. Browser inference is a suggestion, never authoritative import.

Onboarding stores server `completedAt`, version and timetable-sync intent with the same profile. Completion requires a valid allowed major and at least three distinct interests; subsequent self-profile edits do not reset a completed onboarding. Known interest IDs may be projected for recommendations, but preserve custom user labels. `syncTimetable` is preference only, not evidence of implemented FAP integration. Do not silently import local completed flags.

Cover text is `{visible,eyebrow,title,subtitle,color,size,x,y}`: eyebrow <=80, title/subtitle <=60, hex color or empty for palette, size 24..240 canvas pixels; x/y -100..100 percent, defaults 0. Shape transform x -50..50, y -100..100, scale 25..200 percent, defaults 0/0/100. Server checks owned/free color and shape **even in image mode**; `none` is free. URLs attach only verified actor-owned issued objects; no blob/data URLs in live profile. Text is plain escaped content, not HTML.

Persist one profile per canonical user with optimistic concurrency, self-only mutation, audit and projection event/outbox. Club member personal projection references this record and separates `applicationSnapshot` (reason, expectations, contributions and historic consent). No club leader can mutate it. Revocation/private profile reads must not leak other users. Local import is explicit reviewed migration, never automatic upload of fixtures.

Round-trip tests additionally cover 240px and text drag offsets, independent image/shape ownership, code/logo projection for CLB đồng hành, onboarding completion across devices, imported read-only academic fields, failed Save retains preview, Cancel sends no writes and member snapshots do not overwrite newer profile.
