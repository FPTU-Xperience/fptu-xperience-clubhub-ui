import { httpClient } from './client';
import { formatErrorMessage } from '../locales/vi';

export const reportsApi = {
    getReports(params = {}) {
        const query = new URLSearchParams(params).toString();
        return httpClient.request(`/api/reports${query ? `?${query}` : ''}`);
    },

    getReport(id) {
        return httpClient.request(`/api/reports/${id}`);
    },

    getReportingDeadlines() {
        return httpClient.request('/api/reporting-deadlines');
    },

    createReport(data) {
        return httpClient.request('/api/reports', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateReport(id, data) {
        return httpClient.request(`/api/reports/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    submitReport(id) {
        return httpClient.request(`/api/reports/${id}/submit`, { method: 'POST' });
    },

    reviewReport(id, feedback = '') {
        return httpClient.request(`/api/reports/${id}/review`, {
            method: 'POST',
            body: JSON.stringify({ feedback }),
        });
    },

    approveReport(id, feedback = '') {
        return httpClient.request(`/api/reports/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ feedback }),
        });
    },

    rejectReport(id, feedback) {
        return httpClient.request(`/api/reports/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ feedback }),
        });
    },

    async uploadReportFile(formData) {
        const url = httpClient.buildUrl('/api/reports/upload');
        const token = httpClient.getToken();
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
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

        return httpClient.parseResponse(response);
    },

    async updateUploadedReportFile(reportId, formData) {
        const url = httpClient.buildUrl(`/api/reports/${reportId}/uploaded-file`);
        const token = httpClient.getToken();
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
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

        return httpClient.parseResponse(response);
    },

    deleteUploadedReportFile(reportId) {
        return httpClient.request(`/api/reports/${reportId}/uploaded-file`, { method: 'DELETE' });
    },

    async downloadUploadedReportFile(reportId, fileName) {
        const url = httpClient.buildUrl(`/api/reports/${reportId}/uploaded-file/download`);
        const token = httpClient.getToken();
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
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
    },

    async getUploadedReportFilePreview(reportId) {
        const url = httpClient.buildUrl(`/api/reports/${reportId}/uploaded-file/preview`);
        const headers = {};
        const token = httpClient.getToken();
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, { headers });

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
        if (arrayBuffer.byteLength === 0) {
            throw new Error('Không có dữ liệu bản xem trước.');
        }

        const bytes = new Uint8Array(arrayBuffer);
        const isPdf =
            bytes.length >= 5 &&
            bytes[0] === 0x25 && // %
            bytes[1] === 0x50 && // P
            bytes[2] === 0x44 && // D
            bytes[3] === 0x46 && // F
            bytes[4] === 0x2d; // -

        if (!isPdf) {
            throw new Error(
                `Bản xem trước không phải PDF hợp lệ. Loại nội dung: ${response.headers.get('content-type') || 'không xác định'}`,
            );
        }

        return bytes;
    },

    getReportSummary() {
        return httpClient.request('/api/reports/summary');
    },

    getReportAggregation(period) {
        const query = period ? `?period=${period}` : '';
        return httpClient.request(`/api/reports/aggregate${query}`);
    },

    getMyDeadlines() {
        return httpClient.request('/api/deadlines/me');
    },
};

export default reportsApi;
