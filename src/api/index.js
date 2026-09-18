export { httpClient, default as client } from './client';
export { authApi, default as auth } from './auth.api';
export { clubsApi, default as clubs } from './clubs.api';
export { activitiesApi, default as activities } from './activities.api';
export { reportsApi, default as reports } from './reports.api';
export { financeApi, default as finance } from './finance.api';
export { notificationsApi, default as notifications } from './notifications.api';
export { usersApi, default as users } from './users.api';
export { kpisApi, exportsApi } from './kpis.api';

import { httpClient } from './client';
import { authApi } from './auth.api';
import { clubsApi } from './clubs.api';
import { activitiesApi } from './activities.api';
import { reportsApi } from './reports.api';
import { financeApi } from './finance.api';
import { notificationsApi } from './notifications.api';
import { usersApi } from './users.api';
import { kpisApi, exportsApi } from './kpis.api';

/**
 * Enterprise Unified API Facade
 * Backward compatible with all existing callers expecting `api.getClubs()`, `api.login()`, etc.
 */
export const api = {
    // Client helpers
    buildUrl: (endpoint) => httpClient.buildUrl(endpoint),
    getToken: () => httpClient.getToken(),
    setToken: (token) => httpClient.setToken(token),
    setRefreshToken: (token) => httpClient.setRefreshToken(token),
    clearTokens: () => httpClient.clearTokens(),
    request: (endpoint, options) => httpClient.request(endpoint, options),

    // Auth
    login: (email) => authApi.login(email),
    loginWithGoogle: (credential) => authApi.loginWithGoogle(credential),
    refresh: (refreshToken) => authApi.refresh(refreshToken),
    logout: () => authApi.logout(),

    // Users
    getUsers: (params) => usersApi.getUsers(params),
    createUser: (data) => usersApi.createUser(data),
    updateUser: (id, data) => usersApi.updateUser(id, data),
    lockUser: (id) => usersApi.lockUser(id),
    unlockUser: (id) => usersApi.unlockUser(id),

    // Clubs
    getClubs: () => clubsApi.getClubs(),
    getClub: (id) => clubsApi.getClub(id),
    deleteClub: (id) => clubsApi.deleteClub(id),
    getMyMemberships: () => clubsApi.getMyMemberships(),
    getMyClubAccess: () => clubsApi.getMyClubAccess(),
    getManagedClubs: () => clubsApi.getManagedClubs(),
    joinClub: (clubId, req) => clubsApi.joinClub(clubId, req),
    getClubApplications: () => clubsApi.getClubApplications(),
    getMyClubApplications: () => clubsApi.getMyClubApplications(),
    createClubApplication: (data) => clubsApi.createClubApplication(data),
    updateClubApplication: (id, data) => clubsApi.updateClubApplication(id, data),
    approveClubApplication: (id, review) => clubsApi.approveClubApplication(id, review),
    requestClubApplicationRevision: (id, review) => clubsApi.requestClubApplicationRevision(id, review),
    rejectClubApplication: (id, review) => clubsApi.rejectClubApplication(id, review),
    getClubMemberships: (clubId) => clubsApi.getClubMemberships(clubId),
    approveClubMembership: (id, note) => clubsApi.approveClubMembership(id, note),
    rejectClubMembership: (id, note) => clubsApi.rejectClubMembership(id, note),
    getClubMembers: (clubId, params) => clubsApi.getClubMembers(clubId, params),
    getClubMember: (clubId, memberId, params) => clubsApi.getClubMember(clubId, memberId, params),
    assignClubTreasurer: (clubId, memberUserId, memberName) =>
        clubsApi.assignClubTreasurer(clubId, memberUserId, memberName),
    deleteClubMember: (clubId, memberId) => clubsApi.deleteClubMember(clubId, memberId),

    // Reports
    getReports: (params) => reportsApi.getReports(params),
    getReport: (id) => reportsApi.getReport(id),
    getReportingDeadlines: () => reportsApi.getReportingDeadlines(),
    createReport: (data) => reportsApi.createReport(data),
    updateReport: (id, data) => reportsApi.updateReport(id, data),
    submitReport: (id) => reportsApi.submitReport(id),
    reviewReport: (id, feedback) => reportsApi.reviewReport(id, feedback),
    approveReport: (id, feedback) => reportsApi.approveReport(id, feedback),
    rejectReport: (id, feedback) => reportsApi.rejectReport(id, feedback),
    uploadReportFile: (formData) => reportsApi.uploadReportFile(formData),
    updateUploadedReportFile: (id, formData) => reportsApi.updateUploadedReportFile(id, formData),
    deleteUploadedReportFile: (id) => reportsApi.deleteUploadedReportFile(id),
    downloadUploadedReportFile: (id, fileName) => reportsApi.downloadUploadedReportFile(id, fileName),
    getUploadedReportFilePreview: (id) => reportsApi.getUploadedReportFilePreview(id),
    getReportSummary: () => reportsApi.getReportSummary(),
    getReportAggregation: (period) => reportsApi.getReportAggregation(period),
    getMyDeadlines: () => reportsApi.getMyDeadlines(),

    // Activities
    getActivities: (clubId) => activitiesApi.getActivities(clubId),
    getActivity: (id) => activitiesApi.getActivity(id),
    createActivity: (data) => activitiesApi.createActivity(data),
    updateActivity: (activityId, data) => activitiesApi.updateActivity(activityId, data),
    checkInActivity: (activityId) => activitiesApi.checkInActivity(activityId),
    getMyActivityAttendance: (activityId, params) => activitiesApi.getMyActivityAttendance(activityId, params),
    registerParticipant: (activityId, userId, fullName) =>
        activitiesApi.registerParticipant(activityId, userId, fullName),
    completeActivity: (activityId) => activitiesApi.completeActivity(activityId),
    getActivityAttendance: (clubId, activityId, params) =>
        activitiesApi.getActivityAttendance(clubId, activityId, params),
    updateActivityAttendance: (clubId, activityId, memberId, data) =>
        activitiesApi.updateActivityAttendance(clubId, activityId, memberId, data),
    bulkUpdateActivityAttendance: (clubId, activityId, items) =>
        activitiesApi.bulkUpdateActivityAttendance(clubId, activityId, items),

    // Finance
    getBudgetProposals: (params) => financeApi.getBudgetProposals(params),
    createBudgetProposal: (data) => financeApi.createBudgetProposal(data),
    approveBudget: (id, amt, note) => financeApi.approveBudget(id, amt, note),
    managerApproveBudget: (id, note) => financeApi.managerApproveBudget(id, note),
    managerRejectBudget: (id, note) => financeApi.managerRejectBudget(id, note),
    rejectBudget: (id, note) => financeApi.rejectBudget(id, note),
    createSettlement: (proposalId, data) => financeApi.createSettlement(proposalId, data),
    approveSettlement: (settlementId, note) => financeApi.approveSettlement(settlementId, note),
    getFinanceTransactions: (clubId) => financeApi.getFinanceTransactions(clubId),

    // KPIs
    getKpiRules: () => kpisApi.getKpiRules(),
    getKpiLeaderboard: (period) => kpisApi.getKpiLeaderboard(period),

    // Exports
    getExports: (params) => exportsApi.getExports(params),
    getExport: (id) => exportsApi.getExport(id),
    createExport: (data) => exportsApi.createExport(data),
    downloadExport: (id, fileName) => exportsApi.downloadExport(id, fileName),

    // Notifications
    getNotifications: (unreadOnly) => notificationsApi.getNotifications(unreadOnly),
    markNotificationRead: (id) => notificationsApi.markNotificationRead(id),
    markAllNotificationsRead: () => notificationsApi.markAllNotificationsRead(),
};

export default api;
