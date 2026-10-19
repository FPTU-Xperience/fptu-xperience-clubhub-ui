# Optional opt-in public club member directory

Implement Status: Not Yet

Status Scope: Optional/deferred backend capability, not cancelled

Source Review: 2026-10-19; backend b066f96b9fd0ea304e7c498f6ddcc569b2c21ebf, fetched current branch and origin/main equal HEAD. Source audit only; live acceptance and service tests unverified.

Source Evidence: Private member list/detail uses canonical profile projections and separate applicationSnapshot. No opt-in public member route/consent store exists; this optional contract remains active.

## Current reconciliation — 2026-10-19

Private member list/detail uses canonical profile projections and separate applicationSnapshot. No opt-in public member route/consent store exists; this optional contract remains active.

The specification below preserves its original proposed scope. Older dated route-absence and local-only statements are historical where superseded above; use the current lifecycle/index before implementation. Remaining obligations keep this contract Not Yet.


D13; proposed/deferred. Current non-manager workspace shows public leaders and member count; it does not require exposing the full roster. Backend source main 80818266 has manager members/detail reads, not this privacy projection.

Only if product enables the full member directory: GET `/api/clubs/{clubId}/members/public?page=1&pageSize=20` returns `{items:[{displayName,clubRole,avatarUrl?,joinedAt?}],page,pageSize,totalItems,totalPages}`. Include only approved active members who explicitly opted in; exclude user/membership IDs, student code, email, address, phone, birthday, application answers, point balances and internal roles. Directory pagination totals count visible opted-in rows, not private approved membership count. Public leaders remain separately controlled by existing public leader policy.

Opt-in belongs to the authenticated student's canonical profile/privacy settings, for example self PATCH `{privacy:{clubDirectoryOptIn:true}}`; leaders cannot opt in another user. Scope consent per club if allowing different visibility across clubs; persistence then keys `(userId,clubId)` and self-only PATCH `/api/users/me/club-directory-consents/{clubId}` `{optIn,expectedVersion}`. Default false, revoke immediately from subsequent reads/caches, audit without publishing consent details. Adopt the per-club consent route if this optional feature is selected; do not implement both competing consent models.

Tests: no consent yields no item, opt-in displays safe fields, revoke removes cache/read, pending/removed members excluded, pagination reveals no hidden identity, other user cannot alter consent. No current-control unblock depends on this optional endpoint; keep it out of the required first backend batch.
