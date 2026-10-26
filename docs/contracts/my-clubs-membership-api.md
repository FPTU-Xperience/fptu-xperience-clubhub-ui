> Current reconciliation — 2026-10-26: [API/UI integration and remaining obligations](main-api-ui-reconciliation-2026-10-26.md) supersedes older absence/browser-only claims for the capabilities listed there. The earlier audit/checklists below are historical; source integration and live acceptance remain separate.

# Own memberships, applications and self withdrawal

Implement Status: Not Yet

Status Scope: Backend implementation: existing composed reads only

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: ClubEndpoints.cs exposes own access/memberships and review timestamps; MembershipEndpoints.cs has no self withdrawal route. ClubWorkflowStatuses.cs lacks WITHDRAWN, and ClubMembershipResponse lacks source/capability/version/code/logo.

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

## Current FE consumption — 2026-10-13

The [navigation/inbox addendum](club-navigation-applications-api.md) owns durable pin preference routes and the seven-day result display rule; this file remains the canonical withdrawal workflow. Selection composes own access + active directory, retaining organizational displayRole separately from the coarse MANAGER/MEMBER access gate. Applications now compose self memberships + directory for code/logo and carry requestedAtUtc/reviewedAtUtc. Directory fallback cannot resolve every inactive club, so canonical self DTO metadata is still needed.

The adapter no longer fixes canWithdraw to false: it consumes authoritative true only for a pending sent request, excluding invitations. The inspected backend does not send that capability or implement withdrawal, so the current button remains disabled. Pending invitations remain a separate section. Sent pending requests persist indefinitely in the inbox; approved/rejected results disappear exactly seven elapsed days after reviewedAtUtc, while historical membership/access records remain intact. Unknown/missing/future review times do not qualify as recent results.

Use explicit source/canAcceptInvitation metadata in the deployed replacement rather than permanently inferring invitation status from consent flags. Current browser-local pins are account-scoped UI preferences and do not grant club authority.
