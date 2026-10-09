# CTSV semester student roster

D05; proposed contract, audited 2026-10-09 against main `80818266`. Complements [invitations](club-member-invitations-api.md); reuse existing AdminService semesters, never create another semester catalog. Shared [conventions](api-contract-conventions.md) apply.

## Import, revision and identity

Persist `SemesterRosterRevision` (semester GUID, campus, revision/version, actor, importedAt, source/import/carry-forward provenance) and immutable revision rows (canonical Auth user ID, studentCode, campusCode, active). Unique `(revisionId,userId)` and student-code uniqueness within the campus/semester. Distinguish no roster, valid empty roster and a carried-forward roster. Existing Auth/Admin contexts have no semester-roster entities.

Proposed parser default for implementation: UTF-8 CSV with exact headers `email,studentCode,campusCode,status`; status is `ACTIVE|INACTIVE`, email matches the canonical verified account case-insensitively, campus uses the existing campus catalog. Optional `userId` must match the resolved account; names are not identity keys. Reject duplicate/conflicting emails/codes, unknown accounts, invalid campuses, non-student actors and mismatched identity. Do not create accounts implicitly or derive campus from student code. This resolves the API schema provisionally; the prior O-04 product question remains a product decision, so keep parser/matching configurable and record the chosen schema version rather than presenting it as a previously approved rule.

POST `/api/v1/semesters/{identifier}/roster-imports/preview` (CTSV scoped campus/admin), multipart `file` + `mode=replace` + `expectedRosterVersion`; alternatively canonical JSON `{schemaVersion:1,rows:[{email,studentCode,campusCode,status,userId?}],expectedRosterVersion}`. Limit proposed at 5 MiB/10,000 rows. Returns `{importId,semesterKey,semesterId,campusCode,baseVersion,expiresAt,rowCount,additions,updates,omissions,errors:[{row,field,code,message}],canCommit}`. Preview persists an immutable reviewed candidate, not the live roster. Expiry is one hour; no commit with unresolved row errors. Zero rows is explicit empty import, not carry-forward.

POST `/api/v1/semesters/{identifier}/roster-imports/{importId}/commit`, `{expectedRosterVersion}`, Idempotency-Key. Verify preview owner/campus/semester/expiry/base version again, commit revision and outbox atomically. Return `{revisionId,version,semesterKey,semesterId,campusCode,activeCount,inactiveCount,source:"IMPORT"}`. Stale preview/expired -> 409; no partial replacement. Readers use one committed revision, never mix rows.

GET `/api/v1/semesters/{identifier}/student-roster?search=...&status=...&page=1&pageSize=20` returns paged safe administration rows plus revision metadata. Managers cannot use this directory. Carry-forward on semester initialization with no explicit import uses the preceding semester in the same campus, records source revision and actor/system job, and is idempotent. Explicit empty import overrides carry-forward; no preceding roster yields `ROSTER_UNAVAILABLE`, not all active accounts.

## Internal and club projections

Protected internal Admin/Auth lookup resolves current revision and account eligibility. It is not a public Gateway endpoint. ClubService exposes existing proposed `/invitation-semesters` and `/eligible-members`; scope by club/campus/recruitment capability. Search requires 2..100 characters, pageSize 1..50, deterministic name/userId order and `semesterId` echo. Exclude current memberships/invitations/managers; historical withdrawn eligibility follows D10's agreed active-record rule. Revalidate roster revision/account active/unlocked at invite, personal consent and final approval. Never trust the earlier search result.

Errors include `ROSTER_UNAVAILABLE`, `ROSTER_CHANGED`, `IMPORT_EXPIRED`, `IDENTITY_UNMATCHED`, `STUDENT_NOT_ELIGIBLE`, `MEMBERSHIP_EXISTS`. Audit only necessary identifiers/counts; do not log raw import contents. Gateway forwarding already covers semester prefixes but must be tested for new multipart/body limits and authorization.

Acceptance: empty vs missing vs carry-forward; duplicate/unknown identities; cross-campus administration; expired/stale commit and replay; concurrent replacement; lookup pagination; eligibility changes between search/invite/accept/approve; account locks; two-account invite consent approval. Semester rollover point reset and office succession are separately scoped, not hidden in roster import.
