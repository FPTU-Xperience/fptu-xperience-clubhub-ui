# Frontend API to backend audit

Source snapshot: 2026-10-05. Compared all 92 public async methods in `src/services/api.js` (excluding its three request/response helpers) with endpoint declarations in the sibling `fptu-xperience-clubhub-api/src/Services/*/Endpoints` and `src/Gateway/ApiGateway/yarp.json`. This is a source contract audit, not a live deployment probe. Route existence means the HTTP method and path are declared; authorization, request fields, response fields, and service health still matter.

## Every frontend method

| Area | Existing backend route used by frontend methods | Status |
| --- | --- | --- |
| Auth and users (10) | `login`, `loginWithGoogle`, `refresh`, `logout`, `getCurrentUser`, `getUsers`, `createUser`, `updateUser`, `lockUser`, `unlockUser` | All 10 routes exist in AuthService. |
| Clubs and memberships (24) | `getClubs`, `getClub`, `updateClub`, `deleteClub`, `getMyMemberships`, `getMyClubAccess`, `getManagedClubs`, `joinClub`, `getClubApplications`, `getMyClubApplications`, `createClubApplication`, `updateClubApplication`, `approveClubApplication`, `requestClubApplicationRevision`, `rejectClubApplication`, `getClubMemberships`, `approveClubMembership`, `rejectClubMembership`, `getClubMembers`, `getClubMember`, `updateClubMemberProfile`, `assignClubTreasurer`, `removeClubTreasurer`, `deleteClubMember` | All 24 routes exist in ClubService. |
| Reports and deadlines (21) | `getReports`, `getReport`, `getReportingDeadlines`, `createReport`, `updateReport`, `archiveReport`, `submitReport`, `reviewReport`, `approveReport`, `rejectReport`, `uploadReportFile`, `updateUploadedReportFile`, `deleteUploadedReportFile`, `downloadUploadedReportFile`, `downloadReportAttachment`, `uploadReportAttachment`, `deleteReportAttachment`, `getReportSummary`, `getReportAggregation`, `getMyDeadlines`, `getUploadedReportFilePreview` | All 21 routes exist in ReportService. |
| Activities and attendance (12) | `getActivities`, `getActivity`, `createActivity`, `updateActivity`, `cancelActivity`, `checkInActivity`, `getMyActivityAttendance`, `registerParticipant`, `completeActivity`, `getActivityAttendance`, `updateActivityAttendance`, `bulkUpdateActivityAttendance` | All 12 routes exist in ActivityService. |
| Finance (10) | `getBudgetProposals`, `createBudgetProposal`, `approveBudget`, `managerApproveBudget`, `managerRejectBudget`, `rejectBudget`, `createSettlement`, `approveSettlement`, `rejectSettlement`, `getFinanceTransactions` | All 10 routes exist in FinanceService. |
| KPIs (2) | `getKpiRules`, `getKpiLeaderboard` | Both routes exist in ReportService. |
| Exports (4) | `getExports`, `getExport`, `createExport`, `downloadExport` | All 4 routes exist in ExportService. |
| Notifications (3) | `getNotifications`, `markNotificationRead`, `markAllNotificationsRead` | All 3 routes exist in NotificationService. |
| Composed reads (2) | `getMyClubSelection` now combines `GET /api/clubs/me/access` with `GET /api/clubs?active=true`; `getMyMembershipApplications` maps `GET /api/clubs/me/memberships` | Existing routes now power both My Clubs reads. The backend provides neither upcoming activity nor pending application counts through these reads. |
| Absent backend routes (4) | `uploadPublicImage`, `updateClubPublicImages`, `updateActivityCoverImage`, `withdrawMyMembershipApplication` | See contracts below. The first three are in [public-image-api.md](public-image-api.md). |

**Count: 86 direct matches + 2 composed reads + 4 absent routes = 92 frontend methods.** No other `src/` module makes an HTTP request outside the `api.js` facade, except `src/services/media-upload.js`, whose browser `PUT` targets the signed R2 URL returned by the absent upload-intent API.

## Integration and compatibility findings

1. **My Clubs reads:** The production UI previously called `/api/clubs/me/selection` and `/api/clubs/me/membership-applications`, neither of which exists. The adapter in `src/services/my-clubs-adapter.js` now maps only current-user access and membership records from existing routes. It strips private membership fields. Its pending rows set `canWithdraw: false`, since the existing `DELETE /api/clubs/memberships/{id}` allows a manager/admin to remove a member and rejects the applicant. Do not use that route for self withdrawal.
2. **User creation:** `POST /api/users` accepts `username`, `fullName`, `email`, and exactly one of `ADMIN`, `CLUB_MANAGER`, or `CLUB_MEMBER`. It has no password input; login uses Google. `UsersPage.jsx` now sends only those fields, shows only accepted roles, and explains Google sign-in. The edit form cannot update `SYSTEM_ADMIN` or `STUDENT_AFFAIRS_ADMIN` through `PUT /api/users/{id}` because that endpoint uses the same restricted role policy, so its edit action is disabled for those rows.
3. **System admin self profile:** `SystemAdminProfile.jsx` previously called `PUT /api/users/{id}` with role `SYSTEM_ADMIN`, which the backend rejects. The edit action is disabled until a self-profile write contract is implemented (below). This does not affect viewing the profile.
4. **Club logo:** `PUT /api/clubs/{id}` exists but is restricted to `ADMIN`/`STUDENT_AFFAIRS_ADMIN`, not an assigned club manager. The admin logo editor uses it and preserves `isActive`, whose backend request default is `true`. A manager-specific public-image write still needs its own route.
5. **Activity covers:** `PUT /api/activities/{id}` exists for activity details but its request disallows unmapped members and has no `coverImageUrl`; the proposed cover endpoint is still required.
6. **Student avatar:** `GET /api/users/me` has no avatar field or self-write. The V2 profile stores its URL only in account-scoped local preview state until a backend write/read contract exists.
7. **Existing backend routes now wired:** `GET /api/users/me` refreshes authenticated identity on reload; member management can update a member profile and remove a treasurer role; managers can cancel scheduled activities and archive eligible reports; report authors can upload, download and remove private evidence attachments; final finance reviewers can reject a submitted settlement with a reason.
8. **Activity response shapes:** Registration, check-in and completion return action results, not `ActivityResponse`. The FE now reads `GET /api/activities/{id}` after each action. Registration no longer submits a full name because the backend obtains it from the roster. The attendance screen renders the actual paged `{ total, items }` response. Activity detail updates no longer send `status`, which the backend explicitly disallows.
9. **Report attachment storage:** `storagePath` is an internal backend path. The FE now downloads through authenticated `GET /api/reports/{id}/attachments/{attachmentId}/download`; it does not expose the internal path as an `href`.
10. **Club workspace dashboard:** Existing club detail, activities, manager membership list, and approved report list now supply member counts, activity counts, pending applications, approved reports, and the next scheduled activity. The dashboard does not invent a contribution review count; that requires the contribution lifecycle and summary contract in [backend-changes-for-frontend.md](backend-changes-for-frontend.md).

These findings use `AuthContracts.cs`, `UserEndpoints.cs`, `ClubContracts.cs`, `ClubMappers.cs`, `ClubEndpoints.cs`, `MembershipEndpoints.cs`, `ClubWorkflowStatuses.cs`, `ActivityContracts.cs`, `ActivityWriteEndpoints.cs`, and the route files named in the table. The gateway routes every existing service area above but has no `/api/media` route.

## Missing backend contract: withdraw own membership application

`POST /api/clubs/me/membership-applications/{applicationId}/withdraw` (authenticated). `applicationId` is the ID of the current user's `ClubMembership` created by `POST /api/clubs/{id}/join`. No request body. Verify `membership.UserId == current principal ID` and `Status == Pending`; never allow the actor to withdraw another member or an approved membership through this route. Return `200 OK` with a current-user-safe membership response containing `status: "WITHDRAWN"`. Add a `Withdrawn` membership status and update join/reapply rules so a withdrawn applicant may submit a new request; ensure pending uniqueness rules remain valid. Return `401`, `403`, `404`, or `409` as appropriate. The existing manager-only membership delete route is not an alias. Once available, set `canWithdraw` for pending rows in the frontend adapter and retain the existing `withdrawMyMembershipApplication` method.

## Optional backend read contracts for the full My Clubs card

The composed reads display club name, logo and role, plus membership status/reason. They cannot provide upcoming activity or manager pending application counts. If those fields are required, add these current-user-scoped endpoints and replace the composed reads:

- `GET /api/clubs/me/selection`: `200 OK` array of `{ "clubId": 123, "name": "...", "logoUrl": "...", "role": "MANAGER", "pendingApplications": 2, "upcomingActivity": { "title": "...", "startTime": "...", "location": "..." } }`. Include only active manager assignments and approved member records for the authenticated principal; deduplicate by club, with manager role taking precedence. Supply the next public upcoming activity and manager-only pending count, or `null` when unavailable. Do not leak rosters.
- `GET /api/clubs/me/membership-applications`: `200 OK` array of `{ "applicationId": 7, "club": { "clubId": 123, "name": "...", "logoUrl": "..." }, "reason": "...", "status": "PENDING", "canWithdraw": true }`. Source only the principal's own join records. `canWithdraw` is true only while the request is pending and the withdraw route above is available. Never include other applicants' private profile fields.

## Missing backend contract: edit own account profile

`PUT /api/users/me/profile` (authenticated `AllActors`), body `{ "fullName": "..." }`. Authorize by principal only; keep email, role, lock state, active state, username, and user ID unchanged. Return `200 OK` with `UserSummary`. The current UI also shows an editable email field; a separate verified email-change flow is needed before that field can be enabled because Google sign-in uses email to identify the account. This route lets `SYSTEM_ADMIN` edit its display name without using management `PUT /api/users/{id}` and without submitting a role the management endpoint rejects. Once available, change `SystemAdminProfile.jsx` to call this route and re-enable supported fields.

## Existing backend routes without a frontend facade

This audit starts from frontend calls, so backend-only operations are **not missing backend contracts**. The newly wired operations above were selected because existing screens already had an authorized place for them. Backend-only workflows still needing dedicated frontend design include role administration; club manager assignment; member invitation and roster resolution; disband and ownership transfer; activity creation from an approved report; report-to-budget linking and attachment metadata creation; manual finance adjustment; and admin audit events. Finance proposal submit and settlement submit routes currently return status/acknowledgment without a state transition, so adding buttons for them would not create a new workflow. These are frontend follow-ups rather than requests for the backend to duplicate existing routes.

## Verification boundary

The API repository's GitNexus CLI/index is unavailable in this checkout, so endpoint declarations and DTOs were inspected directly. No backend files were changed. Live gateway, database, authorization and R2 behavior remain unverified.

Backend changes required for further integration are specified in [backend-changes-for-frontend.md](backend-changes-for-frontend.md).
