import { formatErrorMessage, vi } from '../locales/vi';
import { putImageWithIntent, validateImageUpload } from './media-upload';
import { applicationsFromMemberships, selectionFromClubAccess } from './my-clubs-adapter';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000').replace(/\/+$/, '');
// Keep API failures in-page during local UI work. Production always preserves the login redirect.
const AUTH_BYPASS_ENABLED = import.meta.env.DEV && import.meta.env.VITE_DISABLE_AUTH === 'true';

class ApiService {
    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    buildUrl(endpoint) {
        const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        if (this.baseUrl.endsWith('/api') && path.startsWith('/api/')) {
            return `${this.baseUrl}${path.slice(4)}`;
        }
        return `${this.baseUrl}${path}`;
    }

    getToken() {
        return localStorage.getItem('accessToken');
    }

    setToken(token) {
        localStorage.setItem('accessToken', token);
    }

    setRefreshToken(token) {
        localStorage.setItem('refreshToken', token);
    }

    clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    async parseResponse(response) {
        if (response.status === 204) {
            return null;
        }

        const contentType = response.headers.get('content-type') || '';
        return contentType.includes('application/json') ? response.json() : response.text();
    }

    async getErrorMessage(response, { isAuthRequest = false } = {}) {
        const payload = await this.parseResponse(response).catch(() => null);
        if (payload?.message) {
            return formatErrorMessage(payload.message, vi.errors.server);
        }

        if (payload?.errors) {
            const firstValidationError = Object.values(payload.errors).flat().find(Boolean);
            if (firstValidationError) {
                return formatErrorMessage(firstValidationError, vi.errors.validation);
            }
        }

        if (payload?.title) {
            return formatErrorMessage(payload.title, vi.errors.server);
        }

        const statusMessages = {
            400: vi.errors.validation,
            401: isAuthRequest ? vi.errors.credentials : vi.errors.unauthorized,
            403: vi.errors.forbidden,
            404: vi.errors.notFound,
            409: vi.errors.conflict,
            429: vi.errors.rateLimited,
        };
        return formatErrorMessage(statusMessages[response.status], vi.errors.server);
    }

    async request(endpoint, options = {}) {
        const url = this.buildUrl(endpoint);
        const token = this.getToken();

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (endpoint === '/api/auth/google' || endpoint === '/api/auth/dev-login') {
            if (!response.ok) {
                const authError = new Error(await this.getErrorMessage(response, { isAuthRequest: true }));
                authError.status = response.status;
                throw authError;
            }
        }

        if (response.status === 401) {
            // Try to refresh token
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                const newToken = await this.refresh(refreshToken);
                if (newToken) {
                    headers['Authorization'] = `Bearer ${newToken}`;
                    const retryResponse = await fetch(url, { ...options, headers });
                    if (retryResponse.ok) {
                        return this.parseResponse(retryResponse);
                    }
                }
            }
            // Clear tokens and redirect to login, unless the local UI bypass owns the session.
            this.clearTokens();
            if (!AUTH_BYPASS_ENABLED) window.location.href = '/login';
            const authError = new Error(vi.errors.unauthorized);
            authError.status = 401;
            throw authError;
        }

        if (!response.ok) {
            const requestError = new Error(await this.getErrorMessage(response));
            requestError.status = response.status;
            throw requestError;
        }

        return this.parseResponse(response);
    }

    // Auth endpoints
    async login(email) {
        const data = await this.request('/api/auth/dev-login', {
            method: 'POST',
            body: JSON.stringify({ email: (email || '').trim() }),
        });
        this.setToken(data.accessToken);
        if (data.refreshToken) {
            this.setRefreshToken(data.refreshToken);
        }
        return data;
    }

    async loginWithGoogle(credential) {
        const data = await this.request('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        });
        this.setToken(data.accessToken);
        if (data.refreshToken) {
            this.setRefreshToken(data.refreshToken);
        }
        return data;
    }
    async refresh(refreshToken) {
        try {
            const response = await fetch(this.buildUrl('/api/auth/refresh'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken }),
            });
            if (response.ok) {
                const data = await response.json();
                this.setToken(data.accessToken);
                if (data.refreshToken) {
                    this.setRefreshToken(data.refreshToken);
                }
                return data.accessToken;
            }
        } catch (e) {
            console.error('Refresh failed:', e);
        }
        return null;
    }

    async logout() {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await this.request('/api/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify({ refreshToken }),
                });
            }
        } catch (e) {
            // Ignore logout errors
        }
        this.clearTokens();
    }

    // User administration endpoints
    async getUsers(params = { page: 1, pageSize: 20 }) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
        ).toString();
        return this.request(`/api/users${query ? `?${query}` : ''}`);
    }

    async getCurrentUser() {
        return this.request('/api/users/me');
    }

    async createUser(data) {
        return this.request('/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateUser(id, data) {
        return this.request(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async lockUser(id) {
        return this.request(`/api/users/${id}/lock`, { method: 'PATCH' });
    }

    async unlockUser(id) {
        return this.request(`/api/users/${id}/unlock`, { method: 'PATCH' });
    }

    // Club endpoints
    async getClubs() {
        return this.request('/api/clubs?active=true');
    }

    async getClub(id) {
        return this.request(`/api/clubs/${id}`);
    }

    async updateClub(id, data) {
        return this.request(`/api/clubs/${encodeURIComponent(id)}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async uploadPublicImage(file, kind, ownerId = '') {
        validateImageUpload(file);
        const intent = await this.request('/api/media/upload-intents', {
            method: 'POST',
            body: JSON.stringify({
                kind,
                ...(ownerId ? { ownerId: String(ownerId) } : {}),
                contentType: file.type,
                sizeBytes: file.size,
            }),
        });
        return putImageWithIntent(file, intent, {
            bucketName: import.meta.env.VITE_R2_BUCKET_NAME,
            s3Endpoint: import.meta.env.VITE_R2_S3_ENDPOINT,
            publicBaseUrl: import.meta.env.VITE_R2_PUBLIC_BASE_URL,
        });
    }

    async updateClubPublicImages(clubId, images) {
        return this.request(`/api/clubs/${encodeURIComponent(clubId)}/public-images`, {
            method: 'PUT',
            body: JSON.stringify(images),
        });
    }

    // Provisional manager-scoped contract; the current admin PUT /clubs/{id} cannot be used here.
    async updateClubPublicProfile(clubId, fields) {
        return this.request(`/api/clubs/${encodeURIComponent(clubId)}/public-profile`, {
            method: 'PATCH',
            body: JSON.stringify(fields),
        });
    }

    async updateActivityCoverImage(activityId, coverImageUrl) {
        return this.request(`/api/activities/${encodeURIComponent(activityId)}/cover-image`, {
            method: 'PUT',
            body: JSON.stringify({ coverImageUrl }),
        });
    }

    async deleteClub(id) {
        return this.request(`/api/clubs/${id}`, {
            method: 'DELETE',
        });
    }

    async getMyMemberships() {
        return this.request('/api/clubs/me/memberships');
    }

    async getMyClubSelection() {
        const [access, clubs] = await Promise.all([this.getMyClubAccess(), this.getClubs()]);
        return selectionFromClubAccess(access, clubs);
    }

    async getMyMembershipApplications() {
        return applicationsFromMemberships(await this.getMyMemberships());
    }

    async withdrawMyMembershipApplication(applicationId) {
        return this.request(`/api/clubs/me/membership-applications/${applicationId}/withdraw`, { method: 'POST' });
    }

    async getMyClubAccess() {
        return this.request('/api/clubs/me/access');
    }

    async getManagedClubs() {
        return this.request('/api/clubs/me/managed');
    }

    async joinClub(clubId, request) {
        return this.request(`/api/clubs/${clubId}/join`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    }

    async getClubApplications() {
        return this.request('/api/clubs/applications');
    }

    async getMyClubApplications() {
        return this.request('/api/clubs/applications/me');
    }

    async createClubApplication(data) {
        return this.request('/api/clubs/applications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateClubApplication(id, data) {
        return this.request(`/api/clubs/applications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async approveClubApplication(id, review = {}) {
        return this.request(`/api/clubs/applications/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify(review),
        });
    }

    async requestClubApplicationRevision(id, review = {}) {
        return this.request(`/api/clubs/applications/${id}/request-revision`, {
            method: 'POST',
            body: JSON.stringify(review),
        });
    }

    async rejectClubApplication(id, review = {}) {
        return this.request(`/api/clubs/applications/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify(review),
        });
    }

    async getClubMemberships(clubId) {
        return this.request(`/api/clubs/${clubId}/memberships`);
    }

    async approveClubMembership(membershipId, note = '') {
        return this.request(`/api/clubs/memberships/${membershipId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    }

    async rejectClubMembership(membershipId, note = '') {
        return this.request(`/api/clubs/memberships/${membershipId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    }

    async getClubMembers(clubId, params = {}) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
        ).toString();
        return this.request(`/api/clubs/${clubId}/members${query ? `?${query}` : ''}`);
    }

    // Requires a manager-scoped semester roster endpoint; never use the admin user directory.
    async searchEligibleClubMembers(clubId, params) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/clubs/${encodeURIComponent(clubId)}/eligible-members?${query}`);
    }

    async inviteClubMember(clubId, student, semesterId) {
        return this.request(`/api/clubs/${encodeURIComponent(clubId)}/members`, {
            method: 'POST',
            body: JSON.stringify({ userId: Number(student.userId), fullName: student.fullName, role: 'CLUB_MEMBER', semesterId }),
        });
    }

    async getClubMember(clubId, memberId, params = { historyPage: 1, historyPageSize: 20 }) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/clubs/${clubId}/members/${memberId}?${query}`);
    }

    async updateClubMemberProfile(clubId, memberId, data) {
        return this.request(`/api/clubs/${encodeURIComponent(clubId)}/members/${encodeURIComponent(memberId)}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async assignClubTreasurer(clubId, memberUserId, memberName) {
        return this.request(`/api/clubs/${clubId}/treasurers`, {
            method: 'POST',
            body: JSON.stringify({ memberUserId, memberName }),
        });
    }

    async removeClubTreasurer(membershipId) {
        return this.request(`/api/clubs/memberships/${encodeURIComponent(membershipId)}/member`, {
            method: 'POST',
        });
    }

    async deleteClubMember(clubId, memberId) {
        return this.request(`/api/clubs/${clubId}/members/${memberId}`, { method: 'DELETE' });
    }

    // Report endpoints
    async getReports(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/reports${query ? `?${query}` : ''}`);
    }

    async getReport(id) {
        return this.request(`/api/reports/${id}`);
    }

    async getReportingDeadlines() {
        return this.request('/api/reporting-deadlines');
    }

    async createReport(data) {
        return this.request('/api/reports', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateReport(id, data) {
        return this.request(`/api/reports/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async archiveReport(id) {
        return this.request(`/api/reports/${encodeURIComponent(id)}`, { method: 'DELETE' });
    }

    async submitReport(id) {
        return this.request(`/api/reports/${id}/submit`, { method: 'POST' });
    }

    async reviewReport(id, feedback = '') {
        return this.request(`/api/reports/${id}/review`, {
            method: 'POST',
            body: JSON.stringify({ feedback }),
        });
    }

    async approveReport(id, feedback = '') {
        return this.request(`/api/reports/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ feedback }),
        });
    }

    async rejectReport(id, feedback) {
        return this.request(`/api/reports/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ feedback }),
        });
    }

    async uploadReportFile(formData) {
        const url = this.buildUrl('/api/reports/upload');
        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(formatErrorMessage(errorData.message, 'Không thể tải lên báo cáo.'));
            error.status = response.status;
            throw error;
        }

        return this.parseResponse(response);
    }

    async updateUploadedReportFile(reportId, formData) {
        const url = this.buildUrl(`/api/reports/${reportId}/uploaded-file`);
        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(formatErrorMessage(errorData.message, 'Không thể thay đổi tệp báo cáo.'));
            error.status = response.status;
            throw error;
        }

        return this.parseResponse(response);
    }

    async deleteUploadedReportFile(reportId) {
        return this.request(`/api/reports/${reportId}/uploaded-file`, { method: 'DELETE' });
    }

    async downloadUploadedReportFile(reportId, fileName) {
        const url = this.buildUrl(`/api/reports/${reportId}/uploaded-file/download`);
        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        if (response.status === 403) {
            const error = new Error('Bạn không có quyền tải tệp báo cáo này.');
            error.status = 403;
            throw error;
        }
        if (response.status === 404) {
            const error = new Error('Tệp báo cáo không còn tồn tại hoặc không khả dụng.');
            error.status = 404;
            throw error;
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(formatErrorMessage(errorData.message, 'Không thể tải tệp báo cáo.'));
            error.status = response.status;
            throw error;
        }

        const blob = await response.blob();

        let downloadFileName = fileName;
        const disposition = response.headers.get('content-disposition');
        if (disposition) {
            const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
            if (utf8Match && utf8Match[1]) {
                downloadFileName = decodeURIComponent(utf8Match[1]);
            } else {
                const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
                if (asciiMatch && asciiMatch[1]) {
                    downloadFileName = asciiMatch[1];
                }
            }
        }
        if (!downloadFileName) {
            downloadFileName = `report-file-${reportId}`;
        }

        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);
    }

    async downloadReportAttachment(reportId, attachmentId, fileName) {
        const url = this.buildUrl(`/api/reports/${encodeURIComponent(reportId)}/attachments/${encodeURIComponent(attachmentId)}/download`);
        const token = this.getToken();
        const response = await fetch(url, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
            const downloadError = new Error(await this.getErrorMessage(response));
            downloadError.status = response.status;
            throw downloadError;
        }
        const objectUrl = window.URL.createObjectURL(await response.blob());
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName || `attachment-${attachmentId}`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(objectUrl);
    }

    async uploadReportAttachment(reportId, file) {
        const formData = new FormData();
        formData.append('file', file);
        const token = this.getToken();
        const response = await fetch(this.buildUrl(`/api/reports/${encodeURIComponent(reportId)}/attachments/upload`), {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });
        if (!response.ok) {
            const uploadError = new Error(await this.getErrorMessage(response));
            uploadError.status = response.status;
            throw uploadError;
        }
        return this.parseResponse(response);
    }

    async deleteReportAttachment(reportId, attachmentId) {
        return this.request(`/api/reports/${encodeURIComponent(reportId)}/attachments/${encodeURIComponent(attachmentId)}`, {
            method: 'DELETE',
        });
    }

    // Activity endpoints
    async getActivities(clubId) {
        const hasClubId = clubId !== undefined && clubId !== null && clubId !== '';
        const numericClubId = Number(clubId);
        if (hasClubId && (!Number.isSafeInteger(numericClubId) || numericClubId <= 0)) {
            throw new TypeError('Activity clubId must be a positive numeric club ID.');
        }
        const query = hasClubId ? `?clubId=${numericClubId}` : '';
        return this.request(`/api/activities${query}`);
    }

    async getActivity(id) {
        return this.request(`/api/activities/${id}`);
    }

    async createActivity(data) {
        return this.request('/api/activities', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateActivity(activityId, data) {
        return this.request(`/api/activities/${activityId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async cancelActivity(activityId) {
        return this.request(`/api/activities/${encodeURIComponent(activityId)}`, { method: 'DELETE' });
    }

    async checkInActivity(activityId) {
        return this.request(`/api/activities/${activityId}/check-in`, { method: 'POST' });
    }

    async getMyActivityAttendance(activityId, params = { page: 1, pageSize: 20 }) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/activities/${activityId}/my-attendance?${query}`);
    }

    async registerParticipant(activityId, userId = null) {
        return this.request(`/api/activities/${activityId}/participants`, {
            method: 'POST',
            body: JSON.stringify({ userId, fullName: null }),
        });
    }

    async completeActivity(activityId) {
        return this.request(`/api/activities/${activityId}/complete`, {
            method: 'PATCH',
        });
    }

    async getActivityAttendance(clubId, activityId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/clubs/${clubId}/activities/${activityId}/attendance?${query}`);
    }

    async updateActivityAttendance(clubId, activityId, memberId, data) {
        return this.request(`/api/clubs/${clubId}/activities/${activityId}/attendance/${memberId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async bulkUpdateActivityAttendance(clubId, activityId, items) {
        return this.request(`/api/clubs/${clubId}/activities/${activityId}/attendance`, {
            method: 'PUT',
            body: JSON.stringify({ items }),
        });
    }

    // Finance endpoints
    async getBudgetProposals(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/finance/proposals${query ? `?${query}` : ''}`);
    }

    async createBudgetProposal(data) {
        return this.request('/api/finance/proposals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async approveBudget(id, approvedAmount, note) {
        return this.request(`/api/finance/proposals/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ approvedAmount, note }),
        });
    }

    async managerApproveBudget(id, note) {
        return this.request(`/api/finance/proposals/${id}/manager-approve`, {
            method: 'POST',
            body: JSON.stringify({ approvedAmount: null, note }),
        });
    }

    async managerRejectBudget(id, note) {
        return this.request(`/api/finance/proposals/${id}/manager-reject`, {
            method: 'POST',
            body: JSON.stringify({ approvedAmount: null, note }),
        });
    }

    async rejectBudget(id, note) {
        return this.request(`/api/finance/proposals/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ approvedAmount: null, note }),
        });
    }

    async createSettlement(proposalId, data) {
        return this.request(`/api/finance/proposals/${proposalId}/settlements`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async approveSettlement(settlementId, note = '') {
        return this.request(`/api/finance/settlements/${settlementId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    }

    async rejectSettlement(settlementId, note) {
        return this.request(`/api/finance/settlements/${encodeURIComponent(settlementId)}/reject`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    }

    async getFinanceTransactions(clubId) {
        const query = clubId ? `?clubId=${clubId}` : '';
        return this.request(`/api/finance/transactions${query}`);
    }

    // KPI endpoints
    async getKpiRules() {
        return this.request('/api/kpis/rules');
    }

    async getKpiLeaderboard(period) {
        const query = period ? `?period=${period}` : '';
        return this.request(`/api/kpis/leaderboard${query}`);
    }

    async getReportSummary() {
        return this.request('/api/reports/summary');
    }

    async getReportAggregation(period) {
        const query = period ? `?period=${period}` : '';
        return this.request(`/api/reports/aggregate${query}`);
    }

    async getMyDeadlines() {
        return this.request('/api/deadlines/me');
    }

    // Export jobs
    async getExports(params = { page: 1, pageSize: 20 }) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/exports${query ? `?${query}` : ''}`);
    }

    async getExport(id) {
        return this.request(`/api/exports/${id}`);
    }

    async createExport(data) {
        return this.request('/api/exports', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async downloadExport(id, fileName) {
        const url = this.buildUrl(`/api/exports/${id}/download`);
        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        if (response.status === 403) {
            const error = new Error('Bạn không có quyền tải tệp này.');
            error.status = 403;
            throw error;
        }
        if (response.status === 404) {
            const error = new Error('Tệp xuất không còn tồn tại hoặc không khả dụng.');
            error.status = 404;
            throw error;
        }
        if (response.status === 410) {
            const error = new Error('Tệp xuất đã hết hạn.');
            error.status = 410;
            throw error;
        }
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = new Error(formatErrorMessage(errorData.message, 'Không thể tải tệp xuất.'));
            error.status = response.status;
            throw error;
        }

        const blob = await response.blob();

        let downloadFileName = fileName;
        const disposition = response.headers.get('content-disposition');
        if (disposition) {
            const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
            if (utf8Match && utf8Match[1]) {
                downloadFileName = decodeURIComponent(utf8Match[1]);
            } else {
                const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);
                if (asciiMatch && asciiMatch[1]) {
                    downloadFileName = asciiMatch[1];
                }
            }
        }
        if (!downloadFileName) {
            downloadFileName = `export-${id}`;
        }

        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = downloadFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);
    }

    async getUploadedReportFilePreview(reportId) {
        const url = this.buildUrl(`/api/reports/${reportId}/uploaded-file/preview`);
        const headers = {};
        const token = this.getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

        // Log safe diagnostics
        console.log('[Preview] GET', url);
        console.log('[Preview] Status:', response.status);
        console.log('[Preview] Content-Type:', response.headers.get('content-type') || 'none');

        if (!response.ok) {
            const errorText = await response.text().catch(() => '');
            let msg = 'Không thể tải bản xem trước của tệp báo cáo.';
            try {
                const parsed = JSON.parse(errorText);
                if (parsed.message) msg = formatErrorMessage(parsed.message, msg);
            } catch (_) {}
            const err = new Error(msg);
            err.status = response.status;
            throw err;
        }

        const arrayBuffer = await response.arrayBuffer();
        const byteLength = arrayBuffer.byteLength;
        console.log('[Preview] Received bytes:', byteLength);

        if (byteLength === 0) {
            throw new Error('Không có dữ liệu bản xem trước.');
        }

        // Validate PDF signature: %PDF-
        const bytes = new Uint8Array(arrayBuffer);
        const firstFive = bytes.slice(0, 5);
        console.log(
            '[Preview] First 5 bytes:',
            Array.from(firstFive).map((b) => b.toString(16)),
        );

        const isPdf =
            bytes.length >= 5 &&
            bytes[0] === 0x25 && // %
            bytes[1] === 0x50 && // P
            bytes[2] === 0x44 && // D
            bytes[3] === 0x46 && // F
            bytes[4] === 0x2d; // -

        if (!isPdf) {
            const signature = String.fromCharCode(...firstFive.slice(0, Math.min(20, bytes.length)));
            console.error('[Preview] Invalid PDF signature. Got:', JSON.stringify(signature));
            throw new Error(
                `Bản xem trước không phải PDF hợp lệ. Loại nội dung: ${response.headers.get('content-type') || 'không xác định'}`,
            );
        }

        console.log('[Preview] PDF signature validated successfully');
        return bytes;
    }

    // Notifications
    async getNotifications(unreadOnly = false) {
        const query = unreadOnly ? '?unreadOnly=true' : '';
        return this.request(`/api/notifications${query}`);
    }

    async markNotificationRead(id) {
        return this.request(`/api/notifications/${id}/read`, { method: 'PUT' });
    }

    async markAllNotificationsRead() {
        return this.request('/api/notifications/read-all', { method: 'PUT' });
    }
}

export const api = new ApiService();
export default api;
