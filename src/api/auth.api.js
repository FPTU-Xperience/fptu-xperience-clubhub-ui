import { httpClient } from './client';

export const authApi = {
    async login(email) {
        if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_DEV_LOGIN !== 'true') {
            throw new Error(
                'Đăng nhập dev-login bị vô hiệu hóa ở môi trường production. Vui lòng đăng nhập bằng Google.',
            );
        }
        const data = await httpClient.request('/api/auth/dev-login', {
            method: 'POST',
            body: JSON.stringify({ email: (email || '').trim() }),
        });
        httpClient.setToken(data.accessToken);
        if (data.refreshToken) {
            httpClient.setRefreshToken(data.refreshToken);
        }
        return data;
    },

    async loginWithGoogle(credential) {
        const data = await httpClient.request('/api/auth/google', {
            method: 'POST',
            body: JSON.stringify({ credential }),
        });
        httpClient.setToken(data.accessToken);
        if (data.refreshToken) {
            httpClient.setRefreshToken(data.refreshToken);
        }
        return data;
    },

    async logout() {
        try {
            const refreshToken = httpClient.getRefreshToken();
            if (refreshToken) {
                await httpClient.request('/api/auth/logout', {
                    method: 'POST',
                    body: JSON.stringify({ refreshToken }),
                });
            }
        } catch (_) {
            // Ignore logout network errors
        }
        httpClient.clearTokens();
    },

    async refresh(refreshToken) {
        return httpClient.refresh(refreshToken);
    },
};

export default authApi;
