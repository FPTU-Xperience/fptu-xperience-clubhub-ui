# Backend changes needed after frontend integration

Source review: sibling `fptu-xperience-clubhub-api` on 2026-10-05. The current frontend integrates the existing routes listed in [frontend-api-audit.md](frontend-api-audit.md). The items below need backend changes before their controls can be made live or fully functional.

## Missing routes

Profile page check (2026-10-08): authenticated identity is already supplied by `GET /api/users/me`, and approved club memberships are read from `GET /api/clubs/me/memberships`. Neither endpoint returns academic details, personal activity/evidence totals, or profile images. The V2 profile now shows the approved club list and count from the API; avatar and uploaded cover images are stored per account in browser IndexedDB, while cover preset choice and editable profile text remain in account-scoped localStorage. These images do not sync between devices. A durable profile read/write API and authorized image upload/read contract are required before replacing that temporary storage.

1. Public image upload intent, club manager image write, activity cover write, and durable student avatar write/read: exact authorization, JSON shape, R2 behavior, and gateway requirements are in [public-image-api.md](public-image-api.md).
2. Self withdrawal of a pending club membership application: `POST /api/clubs/me/membership-applications/{applicationId}/withdraw`, with owner authorization, `WITHDRAWN` state, and reapply behavior in [frontend-api-audit.md](frontend-api-audit.md#missing-backend-contract-withdraw-own-membership-application). The existing manager-only `DELETE /api/clubs/memberships/{id}` cannot substitute for it.
3. Self profile update for `SYSTEM_ADMIN` and other actors: `PUT /api/users/me/profile` for display name, plus a separately verified email-change flow if email editing is required. The current management `PUT /api/users/{id}` rejects `SYSTEM_ADMIN` as a target role. See [frontend-api-audit.md](frontend-api-audit.md#missing-backend-contract-edit-own-account-profile).
4. Club contribution review summary: the workspace previously displayed "contributions awaiting confirmation" without a backend source. A manager-scoped `GET /api/clubs/{clubId}/contributions/summary` should return `{ "pendingCount": 0 }` from real contribution submissions, authorize the assigned manager or a club administrator, and return a current-user-safe summary for members if they need a personal count. Define the submission and review lifecycle before reintroducing this metric. Until then, the dashboard shows the existing approved-report count instead.
5. Member experience data for the remaining workspace tabs:
   - `GET /api/clubs/{clubId}/tasks` and `POST /api/clubs/{clubId}/tasks` for manager-created tasks; each row should include `{ id, title, description, dueAt, points, status }`.
   - `POST /api/clubs/{clubId}/tasks/{taskId}/submissions` and manager-only `POST /api/clubs/{clubId}/task-submissions/{submissionId}/review` for member evidence and approve/reject decisions. The review must be idempotent and emit the contribution/points event once.
   - `GET /api/clubs/{clubId}/me/points` for the current member’s immutable contribution ledger and achievement progress; do not return other members’ histories. A club KPI endpoint cannot substitute for this personal ledger.
   - `GET /api/clubs/{clubId}/rewards`, manager-only reward create/update routes, `POST /api/clubs/{clubId}/rewards/{rewardId}/redemptions`, and a manager fulfillment route. Return stock, cost, availability, and the caller’s redemption state; enforce stock and point balance atomically.
6. Public member directory, if the product intends members to see the full roster: `GET /api/clubs/{clubId}/members/public` should return only approved members who opted into the directory as `{ displayName, clubRole, joinedAt? }`. It must never reuse the manager-only `/members` response because that contains contact and membership-application data. Until this route and consent rule exist, member-facing workspace views show the public total and the separately public leadership list; managers see the full approved roster.
7. Manual study schedule and academic calendar: implement authenticated shared calendar GET, admin-only calendar PUT for term/10W/3W start dates, private year/term/block timetable GET, week-scoped PUT/DELETE, and transactional weekly-template bulk import in [the study schedule contract](study-schedule-api.md). [Implementation context](../study-schedule-implementation-context.md) records the decisions and handoff. The `/academic-calendar` admin page and `/v2/study-schedule` student page currently share browser mock dates; student timetable cells remain account-scoped. No BE timetable or academic-calendar API was found in the sibling source on 2026-10-07. Timetable conflict filtering remains a separate feature.

## Existing routes that need contract tightening

### Student profile data in club applications

`POST /api/clubs/{id}/join` currently requires client-supplied `fullName`, `dateOfBirth`, `gender`, `email`, and `phoneNumber`. This duplicates verified account data in every application and forces the applicant to disclose a gender that is not needed to review club participation.

Add an authenticated student-profile source, for example `GET /api/users/me/student-profile`, that returns the server-owned data needed by the application flow: `{ fullName, email, dateOfBirth, phoneNumber, address, interests, skills }`. Provide a separate authenticated update flow for the mutable contact fields with validation and clear privacy rules. Do not expose this response to other students or to public club pages.

Then revise `POST /api/clubs/{id}/join` so the server derives `fullName`, `dateOfBirth`, `email`, `phoneNumber`, and `address` from the authenticated student profile. The request should contain only application-specific input such as `{ reason, expectations?, contributions?, message?, acceptedClubRules, committedToParticipate }`; remove `gender` from both the request and validation. Until this revision is deployed, the frontend retains the legacy gender control solely because the existing API rejects applications without it.

### Manager assignment

`POST /api/clubs/{id}/managers` currently accepts `managerUserId` and a client-supplied `managerName`, then creates an assignment and approved membership without verifying the target user in AuthService. Before a new assignment UI is enabled, the server must verify the target account exists, is active/unlocked, has an eligible club manager actor role, and use its canonical name. Reject an unknown/ineligible account (`400` or `404`) and maintain the one-active-club-per-manager constraint (`409`). Do not trust `managerName` for identity. Return the updated `ClubResponse`. Source: `ClubService/Endpoints/ManagerEndpoints.cs`.

### Member invitations

`POST /api/clubs/{clubId}/members` currently requires the caller to supply `userId`, `fullName`, and `role: "CLUB_MEMBER"`. Club managers cannot access `GET /api/users` because that endpoint requires `UserDirectoryRead`. Provide a manager-scoped eligible-account search/lookup route (for example `GET /api/clubs/{clubId}/eligible-members?search=...`) that returns only ID, display name, and a safe availability flag; verify the selected account again during invite and derive its canonical name server-side. Preserve the current invite/consent rule: an invited member must personally accept club rules through `/join` before approval. Sources: `ClubService/Endpoints/MemberManagementEndpoints.cs`, `AuthService/Endpoints/UserEndpoints.cs`.

### Private report attachment DTO

`ReportAttachmentResponse` currently includes `storagePath`, an internal server filesystem path. The frontend now ignores it and uses authenticated attachment downloads, but the report JSON still exposes it. Remove that field from public/report read DTOs or replace it with an opaque attachment ID and metadata; keep storage paths server-side. The protected download route remains `GET /api/reports/{id}/attachments/{attachmentId}/download`. Sources: `ReportService/Contracts/ReportContracts.cs`, `ReportService/Endpoints/ReportFileEndpoints.cs`.

## Frontend-only follow-ups

Disband and ownership-transfer reviews, role administration, admin audit events, manual finance adjustments, and publication of approved reports as activities already have backend routes. They need purpose-built role-gated frontend workflows and do **not** require duplicate backend endpoints. They are listed in the full audit so they are not mistaken for missing backend work.

## Club workspace tab audit

| Workspace area | Current source | Result |
| --- | --- | --- |
| Dashboard | club detail, activities, manager membership list, approved report list | Live counts and next activity. |
| Hoạt động | `GET /api/activities?clubId={id}` | Live list; manager creation remains available. |
| Điểm danh | activity attendance endpoints | Live activity selector and attendance records, scoped to the manager or current member. |
| Thành viên | `GET /api/clubs/{id}` | Dashboard and manager roster use the same approved membership collection. Members see only publicly exposed leaders. |
| Báo cáo | `GET /api/reports?clubId={id}` | Live, authorization-scoped report list. |
| Tài chính | budget proposal and transaction reads | Live where finance authorization grants access; otherwise an explicit unavailable state. |
| Trang CLB | `GET /api/clubs/{id}` | Live read; image writes await the public-image contract above. |
| Nhiệm vụ & đóng góp | No route | No sample records are shown. Needs task, submission, review, and contribution-summary contracts. |
| Điểm & thành tích | No member/club ledger route | No sample points or badges are shown. A club KPI leaderboard is not a member point ledger. |
| Kho quà | No route | No sample inventory or redemption records are shown. Needs catalog, stock, redemption, and authorization contracts. |
