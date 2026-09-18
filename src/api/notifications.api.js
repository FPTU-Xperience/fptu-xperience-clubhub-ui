import { httpClient } from './client';

export const notificationsApi = {
    getNotifications(unreadOnly = false) {
        const query = unreadOnly ? '?unreadOnly=true' : '';
        return httpClient.request(`/api/notifications${query}`);
    },

    markNotificationRead(id) {
        return httpClient.request(`/api/notifications/${id}/read`, { method: 'PUT' });
    },

    markAllNotificationsRead() {
        return httpClient.request('/api/notifications/read-all', { method: 'PUT' });
    },
};

export default notificationsApi;
