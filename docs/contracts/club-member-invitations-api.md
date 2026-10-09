# Club member invitations and CTSV semester roster

Status (2026-10-09): **partially supported on latest API main**. Semester persistence, invitation creation, personal consent and manager approval exist. CTSV semester roster persistence/import, manager-scoped eligibility search and invite-time student eligibility verification remain missing. Frontend integration with those missing routes is provisional.

## Latest-main audit

Fetched `origin/main` on 2026-10-09 without checking out or changing API source. Audited commit **`80818266f617bd5144ab1b1a6cd0e74983983a4d`**, committed 2026-10-08 16:22:35 +07:00 (`feat(catalog): implement dynamic club categories and semester APIs with persistence`). It is 16 commits ahead of the local API checkout `109c901331d2f9605c79d9fa5d97d81ce10c3091`. Findings below come from the fetched tree, not the older checkout or deployment.

| Capability | Latest main | Evidence under API repository |
| --- | --- | --- |
| Persisted semester list/current semester | Supported: GET `/api/v1/semesters`, `/active`, aliases `/api/semesters`, `/active`; POST/PUT semester configuration | `AdminService/Endpoints/SemesterEndpoints.cs`, `Contracts/SemesterContracts.cs`, migration `20261008090947_AddSemesters`; gateway `yarp.json` forwards both prefixes |
| Manager/student read access to that semester API | Not supported by the existing backoffice policy; all semester routes require `AdminPolicies.BackofficeUser` | `SemesterEndpoints.cs`; do not use these backoffice endpoints as a manager-facing data source without a scoped projection |
| CTSV active-student semester roster, import and carry-forward | Missing: neither AuthDbContext nor AdminDbContext declares roster entities/endpoints | `AuthService/Data/AuthDbContext.cs`, `AdminService/Data/AdminDbContext.cs`; `GoogleSignInService.cs` has commented-out roster checks only |
| Eligible students for a club and semester | Missing: no `/eligible-members` route | `ClubService/Endpoints/MemberManagementEndpoints.cs`; existing `/member-roster` reads club memberships, not the school roster |
| Create pending invitation | Supported: POST `/api/clubs/{clubId}/members` | `MemberManagementEndpoints.cs`; checks management, active club, positive user ID, required name and member role, duplicates and existing manager |
| Resolve canonical student and revalidate semester eligibility during invite | Missing: trusts submitted name/user ID; does not read `semesterId` or call Auth/Admin eligibility lookup | `InviteClubMember` in `MemberManagementEndpoints.cs` |
| Student sees own invitations | Supported through GET `/api/clubs/me/memberships`; no explicit invitation discriminator | `ClubService/Endpoints/ClubEndpoints.cs`, `Contracts/ClubContracts.cs` |
| Student supplies consent and manager approves | Supported: POST `/api/clubs/{id}/join`, then `/api/clubs/memberships/{id}/approve` | `MembershipEndpoints.cs`; regression `tests/Backend.StabilizationTests/ClubAuthorizationRegressionTests.cs`, `InvitedMemberMustPersonallyAcceptBeforeManagerCanApprove` |
| Dedicated invitation notification event/email delivery | Missing in invitation creation and shared integration-event definitions | `InviteClubMember` does not publish a delivery event; `Shared/ClubReportHub.Shared/Events/IntegrationEvent.cs`, NotificationService consumer |

The existing regression test was inspected, not executed in this audit. Deployment, gateway availability, migrations and live delivery remain unverified. [Pinned API commit](https://github.com/FPTU-Xperience/fptu-xperience-clubhub-api/commit/80818266f617bd5144ab1b1a6cd0e74983983a4d).

## Verified source boundary

- `../fptu-xperience-admin-ui/PRODUCT_REQUIREMENTS.md` owns the CTSV active-student semester roster, FR-028–FR-029. `../fptu-xperience-doc/documents/semester-management.md` defines import/carry-forward rules and the unresolved O-04 file schema and identity matching. Use that roster, never a substitute based solely on account activity.
- The inspected Admin UI `src/pages/Seasons.jsx` still stores season configuration in local React state, while the newer API main now persists semesters. Admin `src/pages/Accounts.jsx` imports general accounts using the admin-only user directory. Neither UI flow is a persisted semester roster source. Reuse the new API semester catalog; do not create a second catalog for invitations.
- AuthService has no semester-roster DbSet or roster endpoint. Club managers cannot use the admin-only `/api/users` directory.

## Required lookup

### Authorized semester options

Proposed `GET /api/clubs/{clubId}/invitation-semesters`, authorized for the active manager of that club, returns only `{semesterId, semesterKey, label, isCurrent, canInvite}` for available semesters. `semesterKey` is the existing AdminService semester GUID; `semesterId` is its canonical `SemesterCode` for compatibility with the provisional frontend query. Never hard-code or derive the authoritative current semester from browser dates. Replace the frontend's initial Spring/Summer/Fall/year controls with these server-owned options when this route exists; the current controls are provisional query input, not evidence of a configured CTSV semester.

Do not broaden `AdminPolicies.BackofficeUser` or expose backoffice semester mutation rights to managers. ClubService should obtain the read projection through authenticated internal service communication with AdminService.

### Eligible students

`GET /api/clubs/{clubId}/eligible-members?semesterId=FALL2026&search=...&page=1&pageSize=10`

Authenticate and authorize the active manager of the named club. Resolve the selected semester to the authoritative CTSV roster (including audited carry-forward when applicable), restrict to active roster students whose accounts are active and unlocked, and exclude existing memberships/invitations and active managers of that club. Search display name/student code; apply paging server-side. Return only:

```json
{
  "semesterId": "FALL2026",
  "items": [{ "userId": 42, "fullName": "Nguyễn Văn A", "studentCode": "SE170042", "isActive": true, "isLocked": false, "eligible": true }],
  "page": 1,
  "pageSize": 10,
  "totalPages": 1
}
```

Return a distinct unavailable response when no roster is known; do not silently use the full user directory or an empty synthetic roster. Examples of identifiers are `SPRING2026`, `SUMMER2026`, `FALL2026`; resolve the actual code from the existing Admin semester catalog, which also permits other codes. The response's `semesterId` must match the requested canonical code.

## CTSV roster ownership and persistence

Proposed AdminService persistence: semester roster revision linked to the existing `Semester.Id`, with canonical AuthService user ID, student code, active flag, campus, and import/carry-forward provenance. Store import actor, timestamps and revision; retain previous revisions/history. Resolve account identity using canonical IDs rather than trusting spreadsheet names or inferring campus from a student-code prefix. Only eligible student actors with active, unlocked accounts can be invitation targets. Scope roster reads/imports by the current CTSV actor's campus using the existing campus authorization conventions; a club manager must not query students outside the club's permitted campus scope.

Suggested SA-only routes (not implemented):

- `POST /api/v1/semesters/{identifier}/roster-imports/preview`: validate rows and return additions, omissions, unmatched/duplicate identities and row errors without replacing the live roster.
- `POST /api/v1/semesters/{identifier}/roster-imports/{importId}/commit`: atomically commit the reviewed import revision, verify ownership/campus and reject stale preview revisions.
- `GET /api/v1/semesters/{identifier}/student-roster`: authorized CTSV administration read, not a club-manager directory.

An explicit empty import and no import action must remain distinguishable. No import action carries forward the preceding roster with audit provenance; an explicit valid empty roster must not silently carry forward. Upload schema/timing and exact identity matching are still O-04 in the product baseline and must be settled before the import parser is implemented. The invitation feature consumes this roster; it does not implement point reset, office succession or the rest of semester rollover.

## Existing creation and acceptance

Frontend sends `POST /api/clubs/{clubId}/members` with `{userId, fullName, role:"CLUB_MEMBER", semesterId}` only after selecting a candidate. The existing backend creates a Pending membership with both consent flags false; it checks club management and duplicates but currently trusts client identity and ignores semester eligibility. Before enabling this in production, resolve the canonical student name and revalidate roster membership/account status on the server at invite time, including concurrent duplicate requests. The browser selection alone is not sufficient verification.

For the upgraded contract, make `semesterId` required for this invitation path and resolve it to the existing semester GUID. Treat `fullName` as a legacy compatibility field only; derive the stored name server-side. Fix role to member on the server. Record invitation source, invitedByUserId, invitedAtUtc, semester key and validated roster revision so inbox state and audit do not rely forever on inferring an invitation from false consent flags. Return the pending membership DTO with authoritative `source: "INVITATION"` and `canAcceptInvitation` for the authenticated recipient; map these fields in the frontend when deployed. A successful response means the invitation record has committed, never that the student has already joined.

Suggested errors: 400 invalid input; 401 unauthenticated; 403 wrong club/campus; 404 club/semester/target unknown; 409 duplicate invitation/membership or roster unavailable/stale; 422 student no longer eligible. Include stable error codes such as `ROSTER_UNAVAILABLE`, `STUDENT_NOT_ELIGIBLE`, `MEMBERSHIP_EXISTS` and `ROSTER_CHANGED` so the UI can distinguish missing data, conflict and an actual empty search result. Revalidate ownership, active roster and account state at student acceptance and final manager approval; roster changes after the original invite must not grant obsolete access.

The student reads the pending membership via `/api/clubs/me/memberships`. V2 My Clubs labels unconsented pending memberships as invitations and links to the public club page using the returned club code. That page verifies the invitation belongs to the current user's memberships, opens the existing join form, and submits `/api/clubs/{id}/join` with personally accepted rules/participation commitment. Under the existing backend contract, acceptance supplies consent and leaves the record Pending until the manager approves it; it does not auto-enroll the student. These are in-app invitations, not email delivery or push notifications.

Keep that existing review lifecycle for this contract. Do not introduce automatic approval during consent. If notification delivery is added later, commit the invitation and an outbox event in the same transaction, address it only to the invited student, include a V2 inbox/deep link, and deduplicate by invitation/event ID. Email/push is a separate channel requirement, not a substitute for durable inbox visibility. A decline/expiry workflow is not currently implemented and needs an explicit contract before adding those UI actions.

Backend source: `ClubService/Endpoints/MemberManagementEndpoints.cs`, `MembershipEndpoints.cs`, and `AuthService/Data/AuthDbContext.cs`. The frontend displays an unavailable lookup error for 404/405, keeps Send disabled without a valid selection, rejects results for another semester, clears selections on query/period/page changes, and prevents duplicate submissions. It never fakes successful delivery.

## Verification remaining

Implement and test CTSV roster persistence/import and the authorized lookup; verify active/inactive/locked students, another club's manager, duplicate invitations, forged names/IDs/semesters, and roster changes between search and send. Test with two authenticated accounts: manager invites, student sees and consents, manager approves, approved membership appears after reload. No mock roster is seeded by the frontend.

## Implementation order and acceptance checks

1. Reuse the existing semester persistence; add roster storage/import preview+commit, campus authorization and audited carry-forward. Test empty import versus no import, canonical matching, stale preview and unauthorized campus access.
2. Add protected internal Admin/Auth reads for semester roster/account eligibility, then manager-scoped semester options and eligible-member search in ClubService. Search must be paged, deterministic and exclude all existing memberships/invitations under the current duplicate policy, including rejected/soft-deleted records until a re-invite policy is specified.
3. Upgrade invitation creation to validate canonical target, semester, campus and roster revision server-side; add source/audit metadata and a unique constraint/transaction that prevents concurrent duplicate invitations.
4. Revalidate eligibility on consent/approval; preserve the current Pending → consent → manager-approved flow. Tests must prove a manager cannot consent on a student's behalf and a student cannot accept someone else's invitation.
5. Wire Admin UI roster import to the new API; replace provisional invitation semester selectors with the authorized projection and use the authoritative invitation discriminator in V2 My Clubs. Update gateway configuration and run service/integration/frontend checks.
6. Verify the complete flow through the running gateway with two real accounts and reload both inbox and roster. Inspect migrations and configured internal service authentication separately from endpoint declarations.


## Rescan handoff — 2026-10-09

Fresh fetch still resolves to 80818266; no new eligibility/roster route was found. Exact import schema, revision/commit payloads and carry-forward semantics are expanded in [semester-student-roster-api.md](semester-student-roster-api.md). The schema resolves O-04 provisionally for implementation design, not as an already approved CTSV policy. Use [shared conventions](api-contract-conventions.md) and D05 [handoff](backend-api-implementation-handoff.md).

The recipient/source discriminator and self withdrawal are reconciled in [my-clubs-membership-api.md](my-clubs-membership-api.md). If enabling withdrawn reapplication, update eligible-member exclusion to the same active-record uniqueness rule rather than excluding all history forever. HR recruitment authority comes from the D06 server capability catalog, not global manager role. In-app invitation notifications commit through outbox and existing NotificationService; no new notification list/read API is needed.
