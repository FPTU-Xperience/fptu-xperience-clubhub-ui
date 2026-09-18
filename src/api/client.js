import { formatErrorMessage, vi } from '../locales/vi';

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL) {
    console.warn('[ClubHub API] Cảnh báo: Biến VITE_API_BASE_URL chưa được cấu hình cho production!');
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000').replace(/\/+$/, '');

class HttpClient {
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

    getRefreshToken() {
        return localStorage.getItem('refreshToken');
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
            console.error('Refresh token failed:', e);
        }
        return null;
    }

    async request(endpoint, options = {}) {
        const url = this.buildUrl(endpoint);
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(url, { ...options, headers });

        if (endpoint === '/api/auth/google' || endpoint === '/api/auth/dev-login') {
            if (!response.ok) {
                const authError = new Error(await this.getErrorMessage(response, { isAuthRequest: true }));
                authError.status = response.status;
                throw authError;
            }
        }

        if (response.status === 401) {
            const refreshToken = this.getRefreshToken();
            if (refreshToken) {
                const newToken = await this.refresh(refreshToken);
                if (newToken) {
                    headers.Authorization = `Bearer ${newToken}`;
                    const retryResponse = await fetch(url, { ...options, headers });
                    if (retryResponse.ok) {
                        return this.parseResponse(retryResponse);
                    }
                }
            }
            this.clearTokens();
            const unauthorizedError = new Error(vi.errors.unauthorized);
            unauthorizedError.status = 401;
            window.dispatchEvent(new CustomEvent('clubhub:unauthorized'));
            if (window.location.pathname !== '/login') {
                window.location.href = '/login?session=expired';
            }
            throw unauthorizedError;
        }

        if (!response.ok) {
            const requestError = new Error(await this.getErrorMessage(response));
            requestError.status = response.status;
            throw requestError;
        }

        return this.parseResponse(response);
    }
}

export const httpClient = new HttpClient();
export default httpClient;
