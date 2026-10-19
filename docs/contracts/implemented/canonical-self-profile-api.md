# Canonical self-profile text

Implement Status: Done

Status Scope: Existing backend text/phone read-write source contract and FE integration; live acceptance unverified. Additional personal/academic/media fields remain active gaps.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. Evidence: `AuthService/Endpoints/CanonicalProfileEndpoints.cs`, `AuthDbContext.UserProfiles`, its migration, and registration in `AuthService/Program.cs`. Gateway retains `/api/users` routing to AuthService.

`GET /api/users/me/profile` uses the current principal, returning `userId`, opaque GUID `version`, `profileSource`, `identityProvenance`, `profile`, `personal` and `editableFields`. Current editable fields are `profile.displayName`, `profile.about`, `profile.skills`, `profile.interests`, `personal.phoneNumber` only. An account without a stored profile receives a server baseline and GUID.Empty version.

`PATCH /api/users/me/profile` accepts `expectedVersion`, `profile` and `personal`. It rejects unknown/duplicate fields, role/identity/academic writes, empty patches and stale versions. Names are required, max 120 characters; about max 2000; phone max 20 with server validation. The handler validates array element/count limits. Always use server validation as final authority.

```json
{"expectedVersion":"00000000-0000-0000-0000-000000000000","profile":{"displayName":"Sinh viên","about":"","skills":["React"],"interests":[]},"personal":{"phoneNumber":null}}
```

FE: `api.getMyProfile/updateMyProfile`, `services/canonical-profile.js`, `profile-data.js/useProfile`. Server fields override old browser records. A failed read is an error with retry, not a local authoritative fallback. Only explicitly saved editable text is uploaded. Expected version accompanies writes; conflict preserves the draft. A late response from a previous account is discarded. Device-local decorations and unsupported supplemental fields are labelled separately in the editor/save notice.

Private member list/detail resolves current canonical values, returns applicationSnapshot separately and refuses manager personal edits. FE preserves server profileSource/currentProfile and renders historical answers separately. Remaining scope: [profile extensions](../self-profile-extensions-api.md). No claim that phone is public, all fields are persisted, or live propagation is verified.
