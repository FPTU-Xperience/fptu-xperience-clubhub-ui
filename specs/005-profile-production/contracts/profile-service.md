# Profile service boundary — refreshed 2026-10-09

## Current temporary implementation

Consumer: `src/pages/v2/profile-page/ProfilePage.jsx`; temporary owner: `src/pages/v2/profile-data.js`. Authenticated identity remains immutable. Profile/cover presentation is saved in account-keyed localStorage; image blobs are account-keyed IndexedDB. Missing account identity never creates an anonymous shared record. No demo provider is used.

Existing `GET /api/clubs/me/memberships` imports only the current user's snapshot when there are no local edits; approved club cards use API memberships and club reads to resolve `logoUrl`/`clubCode`. These existing reads are not durable profile synchronization. Other members retain explicitly labeled application snapshots until the server projection exists.

Load/save/retry preserve session isolation and prior data on failure. The information modal stages a draft through Preview; bottom Save changes persists locally, Cancel restores the saved snapshot. Cover/avatar editing stays separate. Current editable personal/academic/cover fields exceed the original presentation-only feature scope; immutable auth identity/email/global roles remain protected.

## Canonical backend replacement

[Self-profile contract](../../../docs/contracts/self-profile-sync-api.md) owns GET/PATCH `/api/users/me/profile`, nested partial payloads, editable-field metadata, cover transforms/text, optimistic concurrency and private club projection. Its dated canonical fields supersede the original narrow mock patch/data-model for API implementation. Do not create a second fullName-only PUT or student-profile alias.

[Media](../../../docs/contracts/public-image-api.md) owns user avatar/background attachments. [Cover rewards](../../../docs/contracts/profile-cover-rewards-api.md) owns server-issued/free entitlements, separate editor color/shape choices and club-store redemption. [Personal experience](../../../docs/contracts/personal-experience-api.md) reuses existing Admin declaration/radar infrastructure and specifies missing self history/summary reads. Local samples are never earned grants or credited points.

Follow the [implementation handoff](../../../docs/contracts/backend-api-implementation-handoff.md), D01/D02/D03/D08. Route the replacement through the existing API facade, deliberately review local imports, preserve Preview/Cancel with no write, and prove cross-account/cross-device privacy. API main 80818266 has no canonical self-profile read/write; production integration remains pending.
