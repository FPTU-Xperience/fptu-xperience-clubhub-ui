# Remaining self-profile extensions and membership projections

Implement Status: Not Yet

Status Scope: Backend and FE work beyond the implemented canonical text/phone subset.

Reviewed backend: b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf. `CanonicalProfileEndpoints.Response/PatchAsync` exposes five editable text/list/phone fields. It does not persist headline, date of birth, address, student code, major/year, profile avatar/background/cosmetic layout. `PublicMediaEndpoints` does not make these profile fields writable.

Reuse [canonical GET/PATCH](implemented/canonical-self-profile-api.md). Extend its returned editable-field metadata and version; do not introduce another PUT or arbitrary-user public profile endpoint. Academic identity must have an authoritative Admin/roster source and read-only provenance, not a client assertion. Define validation, clear/null semantics and a migration/import preview before accepting older browser-local fields.

The basic private club member projection is now present: MemberManagementEndpoints resolves current account/profile values, returns separate applicationSnapshot/currentProfile/profileSource, fails unavailable profile authority with 503, and refuses manager personal writes with PERSONAL_PROFILE_SELF_ONLY. FE displays these sources separately. Reuse this mechanism for further fields. Extended-field visibility, live propagation and privacy acceptance still require verification.

Profile media needs owner-bound upload/verification and explicit profile attachment. Existing club/activity media verification can be reused; a public URL alone is not ownership. Cosmetics/catalog/inventory are owned by [the rewards contract](profile-cover-rewards-api.md).

Acceptance: cross-device read after save; two-account isolation; stale GUID rejection; immutable application answers; manager personal writes denied; academic/identity forgery denied; local import requires a deliberate user action; sharing preview hides all private fields. Frontend-only persistence remains labelled device-local until these obligations pass.
