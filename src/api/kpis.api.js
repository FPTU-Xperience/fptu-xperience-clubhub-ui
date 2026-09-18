import { httpClient } from './client';
import { formatErrorMessage } from '../locales/vi';

export const kpisApi = {
    getKpiRules() {
        return httpClient.request('/api/kpis/rules');
    },

    getKpiLeaderboard(period) {
        const query = period ? `?period=${period}` : '';
        return httpClient.request(`/api/kpis/leaderboard${query}`);
    },
};

export const exportsApi = {
    getExports(params = { page: 1, pageSize: 20 }) {
        const query = new URLSearchParams(params).toString();
        return httpClient.request(`/api/exports${query ? `?${query}` : ''}`);
    },

    getExport(id) {
        return httpClient.request(`/api/exports/${id}`);
    },

    createExport(data) {
        return httpClient.request('/api/exports', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async downloadExport(id, fileName) {
        const url = httpClient.buildUrl(`/api/exports/${id}/download`);
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
    },
};

export default { kpisApi, exportsApi };
