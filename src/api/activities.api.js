import { httpClient } from './client';

export const activitiesApi = {
    getActivities(clubId) {
        const query = clubId ? `?clubId=${clubId}` : '';
        return httpClient.request(`/api/activities${query}`);
    },

    getActivity(id) {
        return httpClient.request(`/api/activities/${id}`);
    },

    createActivity(data) {
        return httpClient.request('/api/activities', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateActivity(activityId, data) {
        return httpClient.request(`/api/activities/${activityId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    checkInActivity(activityId) {
        return httpClient.request(`/api/activities/${activityId}/check-in`, { method: 'POST' });
    },

    getMyActivityAttendance(activityId, params = { page: 1, pageSize: 20 }) {
        const query = new URLSearchParams(params).toString();
        return httpClient.request(`/api/activities/${activityId}/my-attendance?${query}`);
    },

    registerParticipant(activityId, userId, fullName) {
        return httpClient.request(`/api/activities/${activityId}/participants`, {
            method: 'POST',
            body: JSON.stringify({ userId, fullName }),
        });
    },

    completeActivity(activityId) {
        return httpClient.request(`/api/activities/${activityId}/complete`, {
            method: 'PATCH',
        });
    },

    getActivityAttendance(clubId, activityId, params = {}) {
        const query = new URLSearchParams(params).toString();
        return httpClient.request(`/api/clubs/${clubId}/activities/${activityId}/attendance?${query}`);
    },

    updateActivityAttendance(clubId, activityId, memberId, data) {
        return httpClient.request(`/api/clubs/${clubId}/activities/${activityId}/attendance/${memberId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    bulkUpdateActivityAttendance(clubId, activityId, items) {
        return httpClient.request(`/api/clubs/${clubId}/activities/${activityId}/attendance`, {
            method: 'PUT',
            body: JSON.stringify({ items }),
        });
    },
};

export default activitiesApi;
