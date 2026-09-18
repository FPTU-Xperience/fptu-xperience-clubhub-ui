import { httpClient } from './client';

export const usersApi = {
    getUsers(params = { page: 1, pageSize: 20 }) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
        ).toString();
        return httpClient.request(`/api/users${query ? `?${query}` : ''}`);
    },

    createUser(data) {
        return httpClient.request('/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateUser(id, data) {
        return httpClient.request(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    lockUser(id) {
        return httpClient.request(`/api/users/${id}/lock`, { method: 'PATCH' });
    },

    unlockUser(id) {
        return httpClient.request(`/api/users/${id}/unlock`, { method: 'PATCH' });
    },
};

export default usersApi;
