import { formatErrorMessage, vi } from '../locales/vi'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000')
  .replace(/\/+$/, '');

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
    return formatErrorMessage(statusMessages[response.status], vi.errors.server)
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

    if (response.status === 401) {
      if (endpoint === '/api/auth/login' || endpoint === '/api/auth/register') {
        const authError = new Error(await this.getErrorMessage(response, { isAuthRequest: true }));
        authError.status = response.status;
        throw authError;
      }

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
      // Clear tokens and redirect to login
      this.clearTokens();
      window.location.href = '/login';
      throw new Error(vi.errors.unauthorized);
    }

    if (!response.ok) {
      const requestError = new Error(await this.getErrorMessage(response));
      requestError.status = response.status;
      throw requestError;
    }

    return this.parseResponse(response);
  }

  // Auth endpoints
  async login(username, password) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.setToken(data.accessToken);
    if (data.refreshToken) {
      this.setRefreshToken(data.refreshToken);
    }
    return data;
  }

  async register(username, fullName, email, password) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, fullName, email, password }),
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

  async deleteClub(id) {
    return this.request(`/api/clubs/${id}`, {
      method: 'DELETE',
    });
  }

  async getMyMemberships() {
    return this.request('/api/clubs/me/memberships');
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

  async getClubMember(clubId, memberId, params = { historyPage: 1, historyPageSize: 20 }) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/clubs/${clubId}/members/${memberId}?${query}`);
  }

  async assignClubTreasurer(clubId, memberUserId, memberName) {
    return this.request(`/api/clubs/${clubId}/treasurers`, {
      method: 'POST',
      body: JSON.stringify({ memberUserId, memberName }),
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

  // Activity endpoints
  async getActivities(clubId) {
    const query = clubId ? `?clubId=${clubId}` : '';
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

  async checkInActivity(activityId) {
    return this.request(`/api/activities/${activityId}/check-in`, { method: 'POST' });
  }

  async getMyActivityAttendance(activityId, params = { page: 1, pageSize: 20 }) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/api/activities/${activityId}/my-attendance?${query}`);
  }

  async registerParticipant(activityId, userId, fullName) {
    return this.request(`/api/activities/${activityId}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userId, fullName }),
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
    console.log("[Preview] GET", url);
    console.log("[Preview] Status:", response.status);
    console.log("[Preview] Content-Type:", response.headers.get('content-type') || 'none');

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
    console.log("[Preview] Received bytes:", byteLength);

    if (byteLength === 0) {
      throw new Error('Không có dữ liệu bản xem trước.');
    }

    // Validate PDF signature: %PDF-
    const bytes = new Uint8Array(arrayBuffer);
    const firstFive = bytes.slice(0, 5);
    console.log("[Preview] First 5 bytes:", Array.from(firstFive).map(b => b.toString(16)));

    const isPdf =
      bytes.length >= 5 &&
      bytes[0] === 0x25 && // %
      bytes[1] === 0x50 && // P
      bytes[2] === 0x44 && // D
      bytes[3] === 0x46 && // F
      bytes[4] === 0x2d;   // -

    if (!isPdf) {
      const signature = String.fromCharCode(...firstFive.slice(0, Math.min(20, bytes.length)));
      console.error("[Preview] Invalid PDF signature. Got:", JSON.stringify(signature));
      throw new Error(
        `Bản xem trước không phải PDF hợp lệ. Loại nội dung: ${response.headers.get('content-type') || 'không xác định'}`
      );
    }

    console.log("[Preview] PDF signature validated successfully");
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
