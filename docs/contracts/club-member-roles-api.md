# Club member roles: proposed contract

Status: frontend role catalog and information popup implemented; expanded assignments and permissions require backend implementation. This document does not grant permissions.

## Verified backend boundary

Source audit: `clubhub-api` fetched `origin/main` at `80818266f617bd5144ab1b1a6cd0e74983983a4d` (2026-10-08). Membership roles currently support `MEMBER` / `TREASURER`, with `CLUB_OWNER` derived from club ownership. Invitation payloads use `CLUB_MEMBER`. See `ClubWorkflowStatuses.cs`, `ClubMemberRoleRules.cs`, and `ClubMemberQuery.cs` in the API repository. Treasurer assignment/removal uses the existing API facade. Each club permits at most two treasurers; the owner cannot simultaneously be treasurer. Ownership transfer must remain a separate workflow.

The frontend allows existing member/treasurer transitions only. New role choices open a responsibility description with confirmation disabled; filters for unsupported roles are disabled. Unknown returned roles are preserved rather than mapped to ordinary members. Role names alone never change workspace authorization.

## Role catalog and intended scope

| Code           | Role               | Proposed responsibility and access                                                                                                                              |
| -------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLUB_OWNER     | Chủ nhiệm          | Full club operations, including member administration, profile, event content/staff/applications, recruitment, reports and finance; succession remains separate |
| VICE_PRESIDENT | Phó chủ nhiệm      | Same full club operational scope as the president; no global or CTSV authority                                                                                  |
| CONTENT        | Nội dung (Content) | Create/edit club profile and event content                                                                                                                      |
| EVENT          | Sự kiện (Event)    | Assign staff to events; create/manage/follow event registration applications                                                                                    |
| HR             | Nhân sự            | Recruit members, invite students and process join applications; create/edit club profile                                                                        |
| SECRETARY      | Thư ký             | Assigned minutes and report drafts                                                                                                                              |
| TREASURER      | Thủ quỹ            | Existing financial operations under backend policy                                                                                                              |
| MEMBER         | Thành viên         | Participation and own data under existing policy                                                                                                                |

The initial UI has one primary role per member. If combined duties are needed later, use separate assignments/capabilities rather than expanding a global authentication role. The president and vice president receive the full club operational capability set. Content owns club profile and event content; Event owns staff assignment and event registration applications; HR owns recruitment and club profile. Technical is removed. Service capability names must be mapped to these scopes before enabling assignments.

## Proposed API additions (not available yet)

Temporary self-profile synchronization and the canonical backend handoff are documented in [self-profile-sync-api.md](./self-profile-sync-api.md). Own member details now use the account's temporary profile; other members still use registration snapshots until the backend projection exists.

### Personal profile ownership

Member personal profiles are read projections of the member's own user data, not club-maintained editable copies. Only the authenticated member may update their own profile through the self-profile workflow. Full club authority, including president and vice president, does not permit editing another member's name, email, phone, address or other personal profile fields. Club profile editing refers to the club's public page, not individual member profiles.

The member-management UI removes the profile edit form and profile-update call. Backend must deny club-manager writes through the existing member-profile update route, enforce self identity on personal profile updates, and populate member detail/list responses from authoritative user data. Verify that self-profile updates appear across memberships and cross-user edits are rejected even for club leadership. Existing identity/import rules still govern which personal fields can be edited by the member.

Current implementation gap: `getClubMember` returns a `ClubMembership` projection, including contact/interests/skills snapshots submitted with the join request. The personal profile page currently uses account-scoped browser storage (`profile-data.js`), so the two sources are not synchronized. Reason, expectations and contributions belong to the application, not the personal profile. Legacy goals/personalInfo and raw additionalInfo metadata are not displayed in member details. DemoDataSeeder fills these legacy fields and inserts `source: DEMO_DATASET` and `account` metadata; these must never be presented as personal profile fields. Member details label the snapshot explicitly until backend integration provides authoritative profile data. Do not read the current manager's local profile as another member's profile.

- `GET /api/clubs/{clubId}/member-roles`: server-owned role catalog with code, label, description, assignable flag, and documented capability scope. Owner/treasurer restrictions come from server rules.
- `PATCH /api/clubs/{clubId}/members/{membershipId}/role`: `{ "role": "CONTENT", "expectedVersion": "opaque-version" }`; returns updated member, role, version and authorized capabilities. No owner reassignment through this route.
- Member queries return the organizational role and concurrency version. Role filters accept all enabled catalog codes. Workspace access derives from server capabilities, not labels or frontend catalog entries.

Target authorization: the current club owner and vice president may manage role assignments within their club. Validate approved/current membership, club scope, enabled role, treasurer limits, and concurrency. Students cannot self-promote. Persisted vice-president assignment grants full club operational capabilities, including finance, but never global administrator or CTSV authority. Ownership succession stays separate. HR recruitment access includes invitations and join-application processing, not role administration or removal of existing members. Content profile editing includes the club profile and associated images. Event application access includes creation and follow-up, without bypassing event approval workflows.

Suggested responses: 400 invalid role, 403 missing authority, 404 inaccessible membership, 409 stale version or role constraint. Log actor, member, previous/new role, timestamp and club. Changes must be atomic and take effect in authorization immediately, including removal of old capabilities.

## Implementation sequence and acceptance checks

1. Add persistence/migrations and canonical role catalog while retaining existing membership aliases and treasurer/owner behavior.
2. Define service-enforced capabilities and implement scoped assignment, query/filter, audit and concurrency rules.
3. Extend `src/services/api.js`; replace provisional options with server catalog and enable new confirmation only after the contract is available.
4. Verify owner succession stays separate, cross-club/self-promotion is denied, treasurer constraints remain enforced, specialist roles do not gain member/finance administration, and revocation removes old access. Verify labels, filters and reload show the persisted assignment.

UI reference: `src/pages/v2/club-workspace-page/tabs/members/club-member-roles.js`, `ClubRolesInfo.jsx`, and `MemberManagement.jsx`.


## Capability integration update — 2026-10-09

Main remains 80818266; expanded role/assignment routes are absent. Return the current user's organizational role and explicit capabilities in scoped access projections. Existing `isManager` alone cannot authorize CONTENT/HR profile edit or EVENT staff/application operations. Proposed capability examples: `club.profile.write`, `club.media.write`, `club.members.recruit`, `club.roles.assign`, `event.content.write`, `event.staff.assign`, `event.registrations.manage`, `club.tasks.manage`, `club.contributions.review`, `club.rewards.manage`. Map the agreed role matrix to these in server policy and update FE per-action gating together. Unknown capabilities default denied; labels never grant authority.

Owner/vice full scope is full **club operational** authority, not platform/CTSV final report/finance approval and never another member's personal-profile edit. HR may recruit/review join requests but not self-promote/remove existing members or manage finance. CONTENT writes only public club/event content; EVENT assigns staff/manages registration applications, not financial or personal data. Staff and registration schemas are in [event operations](club-event-operations-api.md). Treasurer remains within existing finance constraints. Avoid using global CLUB_MANAGER assignment to grant specialist duties.

Role persistence/revocation must invalidate access caches/security projections and publish an outbox event; authorization reflects revocation immediately under a bounded cache policy. Version conflicts return 409 and preserve old role. Migrate legacy aliases without silently changing owner/treasurer. [Conventions](api-contract-conventions.md), D06 [handoff](backend-api-implementation-handoff.md).
