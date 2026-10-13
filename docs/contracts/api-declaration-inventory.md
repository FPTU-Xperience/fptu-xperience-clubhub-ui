# FE facade / BE declaration inventory — 2026-10-13

Implement Status: Done

Status Scope: Documentation: regenerated declaration inventory, not backend feature completion

Source Review: 2026-10-13; backend HEAD and fetched origin/main 80818266f617bd5144ab1b1a6cd0e74983983a4d. Source audit only; live deployment and backend tests were not verified.

Source Evidence: scripts/audit-api-contracts.mjs was executed against current source: 95 wrappers, 87 declared, 2 composed, 6 absent, 0 unresolved wrappers. Unresolved helper groups remain listed explicitly; no handler/deployment sign-off.

Generated with `node scripts/audit-api-contracts.mjs`. BE local HEAD: `80818266f617bd5144ab1b1a6cd0e74983983a4d`; remote comparison is a separate check recorded in the lifecycle audit; this generator does not fetch or verify remote main. This inventories declarations, not handler reachability, DTO compatibility, authorization or deployed health. Report submodule prefix is explicitly resolved from ReportEndpoints.cs. Unresolved group declarations: 17; retained below for manual review.

95 wrappers: 87 declared, 2 composed, 6 absent, 0 unresolved.

| Wrapper | HTTP | Normalized path | Declaration status / source |
| --- | --- | --- | --- |
| login | POST | `/api/auth/dev-login` | DECLARED — src/Services/AuthService/Endpoints/AuthEndpoints.cs:28 |
| loginWithGoogle | POST | `/api/auth/google` | DECLARED — src/Services/AuthService/Endpoints/AuthEndpoints.cs:23 |
| refresh | POST | `/api/auth/refresh` | DECLARED — src/Services/AuthService/Endpoints/AuthEndpoints.cs:40 |
| logout | POST | `/api/auth/logout` | DECLARED — src/Services/AuthService/Endpoints/AuthEndpoints.cs:44 |
| getUsers | GET | `/api/users` | DECLARED — src/Services/AuthService/Endpoints/UserEndpoints.cs:27 |
| getCurrentUser | GET | `/api/users/me` | DECLARED — src/Services/AuthService/Endpoints/UserEndpoints.cs:19 |
| createUser | POST | `/api/users` | DECLARED — src/Services/AuthService/Endpoints/UserEndpoints.cs:31 |
| updateUser | PUT | `/api/users/{}` | DECLARED — src/Services/AuthService/Endpoints/UserEndpoints.cs:32 |
| lockUser | PATCH | `/api/users/{}/lock` | DECLARED — src/Services/AuthService/Endpoints/UserEndpoints.cs:36 |
| unlockUser | PATCH | `/api/users/{}/unlock` | DECLARED — src/Services/AuthService/Endpoints/UserEndpoints.cs:37 |
| getClubs | GET | `/api/clubs` | DECLARED — src/Services/ClubService/Endpoints/ClubEndpoints.cs:25 |
| getClub | GET | `/api/clubs/{}` | DECLARED — src/Services/ClubService/Endpoints/ClubEndpoints.cs:56 |
| updateClub | PUT | `/api/clubs/{}` | DECLARED — src/Services/ClubService/Endpoints/ClubEndpoints.cs:72 |
| uploadPublicImage | POST | `/api/media/upload-intents` | ABSENT |
| updateClubPublicImages | PUT | `/api/clubs/{}/public-images` | ABSENT |
| updateClubPublicProfile | PATCH | `/api/clubs/{}/public-profile` | ABSENT |
| updateActivityCoverImage | PUT | `/api/activities/{}/cover-image` | ABSENT |
| deleteClub | DELETE | `/api/clubs/{}` | DECLARED — src/Services/ClubService/Endpoints/ClubEndpoints.cs:78 |
| getMyMemberships | GET | `/api/clubs/me/memberships` | DECLARED — src/Services/ClubService/Endpoints/ClubEndpoints.cs:46 |
| getMyClubSelection | GET | `/api/clubs/me/access + /api/clubs` | COMPOSED |
| getMyMembershipApplications | GET | `/api/clubs/me/memberships + /api/clubs` | COMPOSED |
| withdrawMyMembershipApplication | POST | `/api/clubs/me/membership-applications/{}/withdraw` | ABSENT |
| getMyClubAccess | GET | `/api/clubs/me/access` | DECLARED — src/Services/ClubService/Endpoints/ClubEndpoints.cs:51 |
| getManagedClubs | GET | `/api/clubs/me/managed` | DECLARED — src/Services/ClubService/Endpoints/ClubEndpoints.cs:41 |
| joinClub | POST | `/api/clubs/{}/join` | DECLARED — src/Services/ClubService/Endpoints/MembershipEndpoints.cs:27 |
| getClubApplications | GET | `/api/clubs/applications` | DECLARED — src/Services/ClubService/Endpoints/ApplicationEndpoints.cs:25 |
| getMyClubApplications | GET | `/api/clubs/applications/me` | DECLARED — src/Services/ClubService/Endpoints/ApplicationEndpoints.cs:31 |
| createClubApplication | POST | `/api/clubs/applications` | DECLARED — src/Services/ClubService/Endpoints/ApplicationEndpoints.cs:40 |
| updateClubApplication | PUT | `/api/clubs/applications/{}` | DECLARED — src/Services/ClubService/Endpoints/ApplicationEndpoints.cs:46 |
| approveClubApplication | POST | `/api/clubs/applications/{}/approve` | DECLARED — src/Services/ClubService/Endpoints/ApplicationEndpoints.cs:52 |
| requestClubApplicationRevision | POST | `/api/clubs/applications/{}/request-revision` | DECLARED — src/Services/ClubService/Endpoints/ApplicationEndpoints.cs:58 |
| rejectClubApplication | POST | `/api/clubs/applications/{}/reject` | DECLARED — src/Services/ClubService/Endpoints/ApplicationEndpoints.cs:64 |
| getClubMemberships | GET | `/api/clubs/{}/memberships` | DECLARED — src/Services/ClubService/Endpoints/MembershipEndpoints.cs:32 |
| approveClubMembership | POST | `/api/clubs/memberships/{}/approve` | DECLARED — src/Services/ClubService/Endpoints/MembershipEndpoints.cs:37 |
| rejectClubMembership | POST | `/api/clubs/memberships/{}/reject` | DECLARED — src/Services/ClubService/Endpoints/MembershipEndpoints.cs:42 |
| getClubMembers | GET | `/api/clubs/{}/members` | DECLARED — src/Services/ClubService/Endpoints/MemberManagementEndpoints.cs:30 |
| searchEligibleClubMembers | GET | `/api/clubs/{}/eligible-members` | ABSENT |
| inviteClubMember | POST | `/api/clubs/{}/members` | DECLARED — src/Services/ClubService/Endpoints/MemberManagementEndpoints.cs:34 |
| getClubMember | GET | `/api/clubs/{}/members/{}` | DECLARED — src/Services/ClubService/Endpoints/MemberManagementEndpoints.cs:39 |
| updateClubMemberProfile | PUT | `/api/clubs/{}/members/{}` | DECLARED — src/Services/ClubService/Endpoints/MemberManagementEndpoints.cs:43 |
| assignClubTreasurer | POST | `/api/clubs/{}/treasurers` | DECLARED — src/Services/ClubService/Endpoints/MembershipEndpoints.cs:47 |
| removeClubTreasurer | POST | `/api/clubs/memberships/{}/member` | DECLARED — src/Services/ClubService/Endpoints/MembershipEndpoints.cs:52 |
| deleteClubMember | DELETE | `/api/clubs/{}/members/{}` | DECLARED — src/Services/ClubService/Endpoints/MemberManagementEndpoints.cs:48 |
| getReports | GET | `/api/reports` | DECLARED — src/Services/ReportService/Endpoints/ReportQueryEndpoints.cs:17 |
| getReport | GET | `/api/reports/{}` | DECLARED — src/Services/ReportService/Endpoints/ReportQueryEndpoints.cs:21 |
| getReportingDeadlines | GET | `/api/reporting-deadlines` | DECLARED — src/Services/ReportService/Endpoints/DeadlineEndpoints.cs:24 |
| createReport | POST | `/api/reports` | DECLARED — src/Services/ReportService/Endpoints/ReportCrudEndpoints.cs:21 |
| updateReport | PUT | `/api/reports/{}` | DECLARED — src/Services/ReportService/Endpoints/ReportCrudEndpoints.cs:22 |
| archiveReport | DELETE | `/api/reports/{}` | DECLARED — src/Services/ReportService/Endpoints/ReportCrudEndpoints.cs:23 |
| submitReport | POST | `/api/reports/{}/submit` | DECLARED — src/Services/ReportService/Endpoints/ReportWorkflowEndpoints.cs:21 |
| reviewReport | POST | `/api/reports/{}/review` | DECLARED — src/Services/ReportService/Endpoints/ReportWorkflowEndpoints.cs:23 |
| approveReport | POST | `/api/reports/{}/approve` | DECLARED — src/Services/ReportService/Endpoints/ReportWorkflowEndpoints.cs:24 |
| rejectReport | POST | `/api/reports/{}/reject` | DECLARED — src/Services/ReportService/Endpoints/ReportWorkflowEndpoints.cs:26 |
| uploadReportFile | POST | `/api/reports/upload` | DECLARED — src/Services/ReportService/Endpoints/ReportFileEndpoints.cs:21 |
| updateUploadedReportFile | PUT | `/api/reports/{}/uploaded-file` | DECLARED — src/Services/ReportService/Endpoints/ReportFileEndpoints.cs:25 |
| deleteUploadedReportFile | DELETE | `/api/reports/{}/uploaded-file` | DECLARED — src/Services/ReportService/Endpoints/ReportFileEndpoints.cs:26 |
| downloadUploadedReportFile | GET | `/api/reports/{}/uploaded-file/download` | DECLARED — src/Services/ReportService/Endpoints/ReportFileEndpoints.cs:24 |
| downloadReportAttachment | GET | `/api/reports/{}/attachments/{}/download` | DECLARED — src/Services/ReportService/Endpoints/ReportFileEndpoints.cs:39 |
| uploadReportAttachment | POST | `/api/reports/{}/attachments/upload` | DECLARED — src/Services/ReportService/Endpoints/ReportFileEndpoints.cs:36 |
| deleteReportAttachment | DELETE | `/api/reports/{}/attachments/{}` | DECLARED — src/Services/ReportService/Endpoints/ReportFileEndpoints.cs:40 |
| getActivities | GET | `/api/activities` | DECLARED — src/Services/ActivityService/Endpoints/ActivityEndpoints.cs:39 |
| getActivity | GET | `/api/activities/{}` | DECLARED — src/Services/ActivityService/Endpoints/ActivityEndpoints.cs:108 |
| createActivity | POST | `/api/activities` | DECLARED — src/Services/ActivityService/Endpoints/ActivityEndpoints.cs:147 |
| updateActivity | PUT | `/api/activities/{}` | DECLARED — src/Services/ActivityService/Endpoints/ActivityWriteEndpoints.cs:18 |
| cancelActivity | DELETE | `/api/activities/{}` | DECLARED — src/Services/ActivityService/Endpoints/ActivityWriteEndpoints.cs:19 |
| checkInActivity | POST | `/api/activities/{}/check-in` | DECLARED — src/Services/ActivityService/Endpoints/ActivityWriteEndpoints.cs:21 |
| getMyActivityAttendance | GET | `/api/activities/{}/my-attendance` | DECLARED — src/Services/ActivityService/Endpoints/ActivityWriteEndpoints.cs:22 |
| registerParticipant | POST | `/api/activities/{}/participants` | DECLARED — src/Services/ActivityService/Endpoints/ActivityWriteEndpoints.cs:20 |
| completeActivity | PATCH | `/api/activities/{}/complete` | DECLARED — src/Services/ActivityService/Endpoints/ActivityWriteEndpoints.cs:23 |
| getActivityAttendance | GET | `/api/clubs/{}/activities/{}/attendance` | DECLARED — src/Services/ActivityService/Endpoints/AttendanceManagementEndpoints.cs:29 |
| updateActivityAttendance | PUT | `/api/clubs/{}/activities/{}/attendance/{}` | DECLARED — src/Services/ActivityService/Endpoints/AttendanceManagementEndpoints.cs:202 |
| bulkUpdateActivityAttendance | PUT | `/api/clubs/{}/activities/{}/attendance` | DECLARED — src/Services/ActivityService/Endpoints/AttendanceManagementEndpoints.cs:348 |
| getBudgetProposals | GET | `/api/finance/proposals` | DECLARED — src/Services/FinanceService/Endpoints/ProposalEndpoints.cs:23 |
| createBudgetProposal | POST | `/api/finance/proposals` | DECLARED — src/Services/FinanceService/Endpoints/ProposalEndpoints.cs:25 |
| approveBudget | POST | `/api/finance/proposals/{}/approve` | DECLARED — src/Services/FinanceService/Endpoints/ProposalEndpoints.cs:32 |
| managerApproveBudget | POST | `/api/finance/proposals/{}/manager-approve` | DECLARED — src/Services/FinanceService/Endpoints/ProposalEndpoints.cs:30 |
| managerRejectBudget | POST | `/api/finance/proposals/{}/manager-reject` | DECLARED — src/Services/FinanceService/Endpoints/ProposalEndpoints.cs:31 |
| rejectBudget | POST | `/api/finance/proposals/{}/reject` | DECLARED — src/Services/FinanceService/Endpoints/ProposalEndpoints.cs:34 |
| createSettlement | POST | `/api/finance/proposals/{}/settlements` | DECLARED — src/Services/FinanceService/Endpoints/SettlementEndpoints.cs:19 |
| approveSettlement | POST | `/api/finance/settlements/{}/approve` | DECLARED — src/Services/FinanceService/Endpoints/SettlementEndpoints.cs:23 |
| rejectSettlement | POST | `/api/finance/settlements/{}/reject` | DECLARED — src/Services/FinanceService/Endpoints/SettlementEndpoints.cs:25 |
| getFinanceTransactions | GET | `/api/finance/transactions` | DECLARED — src/Services/FinanceService/Endpoints/TransactionEndpoints.cs:18 |
| getKpiRules | GET | `/api/kpis/rules` | DECLARED — src/Services/ReportService/Endpoints/KpiEndpoints.cs:25 |
| getKpiLeaderboard | GET | `/api/kpis/leaderboard` | DECLARED — src/Services/ReportService/Endpoints/KpiEndpoints.cs:26 |
| getReportSummary | GET | `/api/reports/summary` | DECLARED — src/Services/ReportService/Endpoints/ReportQueryEndpoints.cs:18 |
| getReportAggregation | GET | `/api/reports/aggregate` | DECLARED — src/Services/ReportService/Endpoints/ReportQueryEndpoints.cs:19 |
| getMyDeadlines | GET | `/api/deadlines/me` | DECLARED — src/Services/ReportService/Endpoints/DeadlineEndpoints.cs:29 |
| getExports | GET | `/api/exports` | DECLARED — src/Services/ExportService/Endpoints/ExportEndpoints.cs:27 |
| getExport | GET | `/api/exports/{}` | DECLARED — src/Services/ExportService/Endpoints/ExportEndpoints.cs:28 |
| createExport | POST | `/api/exports` | DECLARED — src/Services/ExportService/Endpoints/ExportEndpoints.cs:29 |
| downloadExport | GET | `/api/exports/{}/download` | DECLARED — src/Services/ExportService/Endpoints/ExportEndpoints.cs:30 |
| getUploadedReportFilePreview | GET | `/api/reports/{}/uploaded-file/preview` | DECLARED — src/Services/ReportService/Endpoints/ReportFileEndpoints.cs:23 |
| getNotifications | GET | `/api/notifications` | DECLARED — src/Services/NotificationService/Endpoints/NotificationEndpoints.cs:19 |
| markNotificationRead | PUT | `/api/notifications/{}/read` | DECLARED — src/Services/NotificationService/Endpoints/NotificationEndpoints.cs:21 |
| markAllNotificationsRead | PUT | `/api/notifications/read-all` | DECLARED — src/Services/NotificationService/Endpoints/NotificationEndpoints.cs:22 |

## Unresolved declaration groups

- `src\Services\ActivityService\Endpoints\SystemEndpoints.cs:app:/`
- `src\Services\AdminService\Endpoints\AdminEndpoints.cs:endpoints:/__test/audited-operation`
- `src\Services\AdminService\Endpoints\AnomalyEndpoints.cs:api:/ledger`
- `src\Services\AdminService\Endpoints\AnomalyEndpoints.cs:api:/ledger`
- `src\Services\AdminService\Endpoints\BonusMatrixEndpoints.cs:group:/`
- `src\Services\AdminService\Endpoints\BonusMatrixEndpoints.cs:group:/`
- `src\Services\AdminService\Endpoints\BonusMatrixEndpoints.cs:group:/{id}`
- `src\Services\AdminService\Endpoints\BonusMatrixEndpoints.cs:group:/{id}`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/me`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/{id}`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/{id}`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/{id}/status`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/{id}`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/{id}/join`
- `src\Services\AdminService\Endpoints\QuestEndpoints.cs:group:/{id}/complete`
