# Own memberships, applications and self withdrawal

D10; 2026-10-09, main 80818266. Existing GET `/api/clubs/me/access`, GET `/api/clubs/me/memberships`, public club detail, join and manager approve/reject are usable. Do not duplicate them unless replacing composed reads with the richer projections below.

## Required withdrawal

POST `/api/clubs/me/membership-applications/{applicationId}/withdraw`, self-only; no body, Idempotency-Key supported. `applicationId` is existing membership ID. Under a transaction, verify ownership and pending state. PENDING -> WITHDRAWN only; already WITHDRAWN returns the canonical same result, approved/rejected/removed -> 409. Another actor must not learn or modify the record (404/403 under standard policy). Store actor/time/audit and retain join answers/history. Return 200 `{applicationId, clubId, status:"WITHDRAWN", version, canWithdraw:false}`.

Add a persisted Withdrawn workflow status. Reapplication may create a new pending application with a new ID/history record; uniqueness covers current active pending/approved records rather than all historic rows. Invitation eligibility currently excludes all membership records; change it deliberately with the same active-record predicate when implementing reapply. Concurrent joins/invites/withdrawals cannot create two active memberships. Existing manager DELETE is not self withdrawal.

## Authoritative invitation metadata

Extend me/memberships with `clubCode`, `logoUrl`, `source: "APPLICATION"|"INVITATION"`, `semesterId`, `invitedAt`, `consentedAt`, `canAcceptInvitation`, `canWithdraw`, `version`, and principal-safe role/status. Migration may classify old pending false-consent rows as invitation only when historical creation evidence is reliable; otherwise mark unknown and retain the legacy compatibility adapter until data is reconciled.

Invitation consent through existing join leaves PENDING until manager approval. Follow [invitation contract](club-member-invitations-api.md); no auto-approval. Do not interpret a name/email submitted by the manager as canonical identity. Dedicated decline/expiry controls are deferred; withdrawal is not silently an invitation decline policy.

## Optional richer reads

GET `/api/clubs/me/selection` -> array `{clubId, clubCode, name, logoUrl, role, capabilities, pendingApplications, upcomingActivity}`. Active manager/approved memberships only, deduplicate club with leadership precedence. Pending count is visible only with recruitment-review capability, otherwise null. Upcoming activity is the earliest authorized future activity `{id,title,startTime,location}` or null; no roster.

GET `/api/clubs/me/membership-applications` -> array `{applicationId,club:{clubId,clubCode,name,logoUrl},reason,status,source,canWithdraw,canAcceptInvitation,version}` for own pending/history requests only. Preserve current invitation fields and safely handle empty status sets.

Until these richer reads exist, preserve composed facade methods; absence of extra metadata does not break the current club card. Profile CLB đồng hành can continue membership read + club lookup for `logoUrl`/`clubCode`, including code fallback when an image fails. Returned code must come from canonical club data, not initials derived from club name.

Tests: self/another user, manager/admin cannot impersonate applicant, pending withdrawal retry, stale approved state, reapply and race, invitation consent not membership approval, inactive clubs, privacy, role precedence and safe logo/code projection. FE: my-clubs adapter/page, ProfileClubLogo and invitation consent navigation.
