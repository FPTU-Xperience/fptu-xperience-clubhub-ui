# Club governance groups API — BE implementation contract

Canonical D06 contract, 2026-10-12. **Proposed: no governance group/report/history/vice nomination routes exist in API main `80818266`.** Remote main and local HEAD were checked and matched on this date. This replaces the retired `club-member-roles-api.md` single-primary-role proposal. [Product decisions](club-governance-groups-proposal.md), [conventions](api-contract-conventions.md), [current audit](contract-lifecycle-audit.md).

## Binding decisions and UI boundary

Workspace period comes exclusively from the [shared header context](workspace-semester-context-api.md); group/report/history panels do not own a second selector. Bind actual Admin GUID/code projection before live rollout.

- Membership is independent of BQL assignment. An approved member without an effective BQL assignment is an ordinary member.
- Multiple groups per member; effective permissions are their union, constrained by server policy, club scope, membership/account status and assignment validity.
- A BQL report is submitted each semester for reporting/history. Submission does **not** activate/revoke permissions and has no whole-board CTSV approval gate.
- CTSV approves important leadership positions, initially Chủ nhiệm and Phó chủ nhiệm. Custom groups cannot create leadership authority.
- Every applied intra-semester change is persisted: promote/add, transfer, remove/demote, group name/permission change, group dissolution, expiry and revocation. Historical reports and events remain immutable.
- Create default groups for Chủ nhiệm, Phó chủ nhiệm, Content, Event, Nhân sự, Thư ký and Thủ quỹ when a term is initialized; empty groups are valid and confer no grants. MEMBER remains ordinary membership, not a BQL group. Member rows display read-only roles/groups; no direct per-member role dropdown/writer.
- Recommended implementation: ordinary group changes apply on successful Save; unsaved edits have no effect. Assignment validity follows the authoritative semester; leadership validity follows its CTSV appointment decision. Next-semester copy is a staged configuration, never an implicit extension of grants.

Current FE rehearsal is development-only: `/v2/preview/club-governance` and the manager members tab `Ban quản lý`. Synthetic members/semester labels, account+club-scoped browser storage, no governance API request, no real grants, no CTSV transmission. Its numeric revision/fixture IDs are **not API DTOs**. Production build hides these entry points. Enable live controls only after BE policy and integration verification; remove preview storage as the authority rather than uploading fixture data to BE.

## Existing foundations and source evidence

- ClubService `ClubMembership`, `ClubMemberRoleRules`: MEMBER/TREASURER; owner derives from active `ClubManagerAssignment`; at most two treasurers; owner cannot also be treasurer.
- `TransferEndpoints.cs`: existing owner transfer submit/read/CTSV approve/reject. Reuse this workflow for owner; no generic group mutation or role PATCH may transfer ownership.
- `MemberManagementEndpoints.cs`: manager member queries/invitations, existing user-profile snapshot projection. Membership details remain self-owned personal data; see [self-profile-sync](self-profile-sync-api.md). Group management never permits cross-user profile edit.
- Shared `ClubAccessSnapshot`, FinanceService `FinanceExtensions`, ReportService `ReportExtensions`: currently boolean manager/finance policies. Update their capability checks and treasurer recipients together with governance changes.
- AdminService `Semester`: GUID/code/start/end, no duplicate semester table. Current semester routes require BackofficeUser; implement a club-safe projection, not a browser call to backoffice/internal APIs.

## Resources and persistence

| Resource | Required persisted fields / invariants |
| --- | --- |
| GovernanceTerm | opaque id, clubId, authoritative semesterId, status OPEN/ARCHIVED, activeRevisionId, opaque version; unique club+semester |
| GovernanceRevision | termId, sequence, immutable complete configuration, actor, recordedAtUtc, effectiveAtUtc, reason; exactly one active revision for a term, no overlapping effective specialist structures for a club |
| Group | stable groupId across revisions, name (trimmed 1..80), description (0..300), presetCode, dutyCode, protected, permissionCodes, archived marker; names unique case-insensitively within active term |
| Assignment | id, groupId, membershipId/userId (server resolved), effectiveFromUtc, effectiveUntilUtc, source/ending revision; intervals are [from, until), no overlapping duplicate member+group assignment |
| GovernanceChangeSet | id, termId, previous/new revision, action, actor/actorType, reason (1..500), recordedAtUtc, effectiveAtUtc, request correlation/idempotency metadata |
| GovernanceMemberChange | changeSetId, membershipId/userId, before/after group snapshots and effective permission snapshots; queryable even after demotion/removal |
| ReportSubmission | id, termId, submissionNo, sourceRevisionId, immutable snapshot (group/assignment/catalog/policy version + approved leaders), submitter/time/reason; unique term+submissionNo |
| Vice nomination/appointment | id, clubId, membershipId/userId, roleCode VICE_PRESIDENT, status, proposer/reviewer, reason, decided/effective dates, opaque version; leadership duty only granted after approval |

Archive/delete is soft; historical group names, actor display names and member display data at the event are retained minimally. Never write actor, campus, user identity, approval or effective capabilities from client payload as trusted authority. No hard delete of governance history. Fixes are subsequent compensating changes. Reports are independent of today's membership/user/group labels.

## Permission catalog and delegation

`GET /api/clubs/{clubId}/governance/permission-catalog`

```json
{
  "version": "catalog-v1",
  "permissions": [
    {"code":"club.profile.write","label":"Chỉnh sửa trang CLB","area":"CONTENT","delegable":true,"dutyCode":null},
    {"code":"club.finance.submit","label":"Nộp hồ sơ tài chính","area":"FINANCE","delegable":true,"dutyCode":"TREASURER"}
  ],
  "presets": [
    {"code":"CONTENT","label":"Content","permissionCodes":["club.profile.write","club.media.write","event.content.write"],"protected":false},
    {"code":"VICE_PRESIDENT","label":"Phó chủ nhiệm","permissionCodes":[],"protected":true,"requiresApproval":true}
  ],
  "constraints": {"maxTreasurers":2,"ownerCanBeTreasurer":false,"multipleGroupsPerMember":true}
}
```

Examples show a subset, not an exhaustive capability list. Map all current actions before exposing full leadership scope. Catalog includes per-action policy constraints and allowed grant subset for this principal. Renaming or preset choice never grants authority by itself.

| Preset | Default specialization |
| --- | --- |
| CONTENT | club.profile.write, club.media.write, event.content.write |
| EVENT | event.staff.assign, event.registrations.manage; no implicit event-content edit |
| HR | club.members.recruit, club.profile.write; no role administration/member removal |
| SECRETARY | assigned club.reports.draft.write; no default finance/recruitment/event-applications scope |
| TREASURER | club.finance.read/draft.write/submit under finance policy and duty constraints |
| CUSTOM | explicitly selected allowed specialist permissions |
| CLUB_OWNER / VICE_PRESIDENT | server-protected club operations scope from approved appointment; no platform/CTSV authority or cross-user profile write |

Protected governance administration/delegation, leadership nomination/review, ownership and final CTSV approvals cannot be selected in custom groups. Union of specialist groups cannot bypass an approved-leadership requirement. A person holding a capability is not automatically allowed to delegate it. Server assigns restricted duty to custom financial-write/submit groups too; the two-treasurer limit counts unique people across groups and existing effective assignments, not group names. Finance read alone is not treasurer duty. Leadership financial authority is a separate policy branch and does not implicitly put vice presidents in treasurer recipient lists.

## Reads

Base: `/api/clubs/{clubId}/governance`.

| Operation | Purpose / authorization |
| --- | --- |
| GET /semesters | Safe Admin semester projection (id/code/label/start/end/canConfigure); caller must have scoped governance read; dependency failure 503, no invented current term |
| GET /terms/{semesterId} | Effective structure, protected leadership projection, pending nominations allowed to caller, report metadata, actor capabilities and version |
| GET /terms/{semesterId}/eligible-members?search=&page=1&pageSize=20 | Approved, active club memberships for assignments; roster source is club membership, not campus invitation eligibility or global user directory |
| GET /terms/{semesterId}/revisions | Paged immutable configurations with effective intervals |
| GET /terms/{semesterId}/revisions/{revisionId} | Exact historical configuration; revision must belong to same club+term |
| GET /history?semesterId=&membershipId=&groupId=&eventType=&from=&to=&page=1&pageSize=20 | ChangeSet summary or per-person projection, deterministic descending effectiveAt+sequence+id; history read allowed after member demotion |
| GET /terms/{semesterId}/report-submissions | Paged submission metadata |
| GET /terms/{semesterId}/report-submissions/{submissionId} | Exact snapshot, including captured leadership pending metadata if included; pending never rendered as approved |

All paged reads use shared `{items,page,pageSize,totalItems,totalPages}`. Max 100/page. No group-history visibility based solely on former assignment; use current read authority. Public views remain approved leaders/count unless an explicit privacy-safe directory contract is enabled.

Example term response:

```json
{
  "clubId":123,"semesterId":"00000000-0000-4000-8000-000000000001","termId":"term-guid",
  "version":"opaque-v7","revisionId":"revision-guid","revisionNo":7,"status":"OPEN",
  "groups":[{"id":"group-guid","name":"Content","description":"Trang CLB","presetCode":"CONTENT","dutyCode":null,"protected":false,"permissionCodes":["club.profile.write"],"assignments":[{"id":"assignment-guid","membershipId":41,"userId":9,"displayName":"Thành viên mẫu","effectiveFromUtc":"2026-10-12T03:00:00Z","effectiveUntilUtc":null}]}],
  "latestReport":{"id":"submission-guid","submissionNo":1,"sourceRevisionId":"previous-revision-guid"},
  "reportNeedsUpdate":true,
  "viewerCapabilities":["club.governance.read","club.governance.groups.manage","club.governance.report.submit"]
}
```

Example opaque IDs are placeholders. Implement actual GUID validation/persistence. Return only private roster/contact fields needed by the authorized screen; email/phone are unnecessary for this group picker.

## Specialist group mutations — immediate on successful commit

All mutations require approved scoped leadership and `club.governance.groups.manage`, OPEN authoritative term, expectedVersion, reason and Idempotency-Key. Apply group/revision/assignment history/access version/outbox in **one transaction**; return canonical term plus changeSetId/new version. Repeated identical request/key returns original response before checking stale version; changed payload/key reuse is 409.

`POST /terms/{semesterId}/groups` (201)

```json
{"name":"Content","description":"Trang CLB","presetCode":"CONTENT","permissionCodes":["club.profile.write"],"expectedVersion":"opaque-v7","reason":"Lập ban nội dung kỳ này"}
```

`PATCH /terms/{semesterId}/groups/{groupId}` (200): partial name/description/presetCode/permissionCodes + expectedVersion/reason. Omitted fields preserve; cannot write protected/dutyCode/actor/effective capabilities. Server validates desired capabilities and determines duty.

`POST /terms/{semesterId}/assignment-changes` (200): command intent is explicit, not inferred from a display-role diff.

```json
{"action":"TRANSFER","membershipIds":[41],"sourceGroupId":"content-guid","targetGroupId":"event-guid","expectedVersion":"opaque-v8","reason":"Luân chuyển sang điều phối sự kiện"}
```

- ADD: targetGroupId + membershipIds (1..100); keeps existing groups. All-or-nothing; invalid/inactive/duplicate/currently assigned member gives explicit conflict/validation, not silent partial success.
- REMOVE: sourceGroupId + membershipIds; closes these assignments only. Baseline club membership remains approved. Ordinary member iff no effective BQL assignment remains.
- TRANSFER: distinct sourceGroupId and targetGroupId + membershipIds; closes source and creates target atomically; keeps other groups. Target already held returns GROUP_ALREADY_ASSIGNED rather than ambiguously removing source. Invalid target or duty limit fails without changing source.
- Protected source/target is rejected; approved appointment/transfer workflow owns leadership changes.

`POST /terms/{semesterId}/groups/{groupId}/archive`: expectedVersion/reason; closes all effective assignments, removes group from current structure, retains history. Protected group is rejected. Catalog permission withdrawal/term expiry/member departure/security revocation also generate appropriate system ChangeSets and per-person effects; deny permissions on time independently of eventual worker delivery.

## Report submission — no grant or approval side effect

`POST /terms/{semesterId}/report-submissions` (201), scoped `club.governance.report.submit`, Idempotency-Key.

```json
{"sourceRevisionId":"revision-guid","expectedVersion":"opaque-v9","reason":"Báo cáo BQL học kỳ Fall 2026"}
```

Server snapshots exactly the previewed revision and approved leadership at capture time. Stale preview gives 409 REPORT_SOURCE_CHANGED. Submission status SUBMITTED; no whole-report APPROVED/ACTIVE state or review route. Later changes set reportNeedsUpdate; supplementary submission has a new number/reason and does not overwrite the first report. No permission change, no legacy treasurer endpoint call, no owner transfer caused by report submission. Term archival may allow late reporting only under an explicit reporting-window policy; UI rehearsal currently disables historical writes.

## Protected leadership workflow

- OWNER: reuse `POST /api/clubs/{clubId}/transfer-ownership` and existing CTSV transfer review endpoints. Add governance history/access invalidation in the same effective transfer transaction; retain existing state/DTO compatibility.
- VICE: `POST /leadership-nominations` accepts roleCode VICE_PRESIDENT, membershipId, expectedVersion and reason. Return PENDING_APPROVAL, without leadership grants.
- `POST /leadership-nominations/{nominationId}/approve` / `reject`: CTSV correct campus/scope only; expectedVersion, reason, effectiveFromUtc/effectiveUntilUtc for approval; server validates dates/member/proposer/owner state at commit. Persist appointment and grant only at effective activation, not merely when a future-dated decision is approved.
- Term read may combine current owner-transfer and vice nomination metadata into a safe leadership projection. Removal/expiry/revocation of protected appointments uses approved CTSV governance workflow; no group editor bypass.

Existing `POST /api/clubs/{id}/managers` remains an administrative appointment foundation, not a specialist grant shortcut. Do not create a second ownership-transfer implementation. Bootstrap initial leadership remains existing CTSV authority; absence of a board report never blocks authorized leadership creation.

## History response and transactional invariants

```json
{
  "items":[{
    "id":"event-guid","changeSetId":"change-guid","clubId":123,"semesterId":"semester-guid","membershipId":41,
    "eventType":"ASSIGNMENT_TRANSFERRED","previousRevisionId":"revision-a","newRevisionId":"revision-b",
    "before":{"groups":[{"id":"content-guid","name":"Content"}],"permissionCodes":["club.profile.write"]},
    "after":{"groups":[{"id":"event-guid","name":"Sự kiện"}],"permissionCodes":["event.staff.assign"]},
    "actor":{"userId":7,"displayName":"Chủ nhiệm mẫu","type":"USER"},
    "recordedAtUtc":"2026-10-12T03:10:01Z","effectiveAtUtc":"2026-10-12T03:10:00Z","reason":"Luân chuyển công việc"
  }],"page":1,"pageSize":20,"totalItems":1,"totalPages":1
}
```

Event types: GROUP_CREATED/UPDATED/ARCHIVED, ASSIGNMENT_ADDED/REMOVED/TRANSFERRED, PERMISSIONS_CHANGED, LEADERSHIP_NOMINATED/APPROVED/REJECTED/ACTIVATED/REVOKED, ASSIGNMENT_EXPIRED, MEMBER_DEPARTED, SECURITY_REVOKED. A group mutation records group-level event and affected-member snapshots, including names and permission union before/after. Same permission retained through another group is not falsely recorded as revoked. Requests/decisions not yet effective have explicit type/state and must not appear as effective promotions.

History, revision and interval records must reconstruct Content → Event → ordinary within one semester, even before any report is submitted. A group rename/dissolution, member removal or future role catalog change never rewrites old snapshots. Same timestamps have stable revision/sequence ordering. Failed transactions produce no successful-change history. Audit retention/export/deletion policy must be defined before production purge; no purge endpoint in this scope.

## Access integration and migration

Extend existing current-user access projection with `capabilities`, `groupAssignments`, `governanceRevisionId`, `accessVersion`, `validUntilUtc` and protected leadership status. Keep compatibility display flags as projections of actual policies; do not set IsManager/CanManage for every BQL member. Patch each service endpoint/action to consult scoped capability + resource/status checks. Keep final CTSV approval separate.

Finance/report workflow recipients derive from canonical effective TREASURER duty across all groups, unique users. Preserve owner/two-treasurer constraints under concurrent grants; revoke on member departure and all sensitive writes without waiting for cache TTL. Outbox invalidates caches; sensitive operations confirm current authority/version. Grants must not depend on long-lived role claims or browser state.

Migration: preserve existing members, active manager assignments and treasurer records; map specialists to chosen authoritative term only with approved migration policy. Unknown historical semester is marked legacy, never invented as an already-submitted/approved board. Do not fabricate CTSV approval for legacy vice records. Old treasurer mutation endpoints either route through the same revision/history service with compatibility reason/source, or are explicitly retired after FE cutover; never maintain independent writers or OR legacy permissions with revoked new permissions.

FE rollout: add adapters to **existing** `src/services/api.js`, structured code/errors to request errors, server capabilities to workspace rail/selection/per-action gates. Replace role dropdown with effective group badges/filter plus group picker. Real picker must paginate/search approved memberships; preview's six synthetic people are not migrated. Unknown role/capability defaults denied/preserved for diagnosis; failure does not substitute fixture authority.

## Errors and acceptance

Use convention HTTP codes/message/code/traceId/errors. Stable codes: VERSION_CONFLICT, REPORT_SOURCE_CHANGED, GROUP_ALREADY_ASSIGNED, PROTECTED_LEADERSHIP, PERMISSION_NOT_DELEGABLE, MEMBERSHIP_INELIGIBLE, TREASURER_LIMIT, OWNER_TREASURER_CONFLICT, TERM_ARCHIVED, SEMESTER_UNCONFIGURED, LEADERSHIP_PENDING. Avoid leaking inaccessible membership/nomination existence.

Required BE tests: migration/backfill, club/campus isolation, self-promotion rejection, custom/combined group leadership bypass denied, live union/revocation, two-treasurer race across custom groups, atomic transfer rollback, immutable member/group history, report snapshot version conflict, idempotent replay, nomination pending/no grants, future effective appointment, expiry without worker/cache delay, report submission no rights side effect, privacy-safe pagination, shared Finance/Report/Activity policies/recipients and Gateway verbs. Then authenticated FE checks across accounts/devices; source declaration/preview tests alone are not integration sign-off.
