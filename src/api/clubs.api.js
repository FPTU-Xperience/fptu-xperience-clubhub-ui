import { httpClient } from './client';

export const clubsApi = {
    getClubs() {
        return httpClient.request('/api/clubs?active=true');
    },

    getClub(id) {
        return httpClient.request(`/api/clubs/${id}`);
    },

    deleteClub(id) {
        return httpClient.request(`/api/clubs/${id}`, {
            method: 'DELETE',
        });
    },

    getMyMemberships() {
        return httpClient.request('/api/clubs/me/memberships');
    },

    getMyClubAccess() {
        return httpClient.request('/api/clubs/me/access');
    },

    getManagedClubs() {
        return httpClient.request('/api/clubs/me/managed');
    },

    joinClub(clubId, request) {
        return httpClient.request(`/api/clubs/${clubId}/join`, {
            method: 'POST',
            body: JSON.stringify(request),
        });
    },

    getClubApplications() {
        return httpClient.request('/api/clubs/applications');
    },

    getMyClubApplications() {
        return httpClient.request('/api/clubs/applications/me');
    },

    createClubApplication(data) {
        return httpClient.request('/api/clubs/applications', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    updateClubApplication(id, data) {
        return httpClient.request(`/api/clubs/applications/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    approveClubApplication(id, review = {}) {
        return httpClient.request(`/api/clubs/applications/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify(review),
        });
    },

    requestClubApplicationRevision(id, review = {}) {
        return httpClient.request(`/api/clubs/applications/${id}/request-revision`, {
            method: 'POST',
            body: JSON.stringify(review),
        });
    },

    rejectClubApplication(id, review = {}) {
        return httpClient.request(`/api/clubs/applications/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify(review),
        });
    },

    getClubMemberships(clubId) {
        return httpClient.request(`/api/clubs/${clubId}/memberships`);
    },

    approveClubMembership(membershipId, note = '') {
        return httpClient.request(`/api/clubs/memberships/${membershipId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    },

    rejectClubMembership(membershipId, note = '') {
        return httpClient.request(`/api/clubs/memberships/${membershipId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    },

    getClubMembers(clubId, params = {}) {
        const query = new URLSearchParams(
            Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
        ).toString();
        return httpClient.request(`/api/clubs/${clubId}/members${query ? `?${query}` : ''}`);
    },

    getClubMember(clubId, memberId, params = { historyPage: 1, historyPageSize: 20 }) {
        const query = new URLSearchParams(params).toString();
        return httpClient.request(`/api/clubs/${clubId}/members/${memberId}?${query}`);
    },

    assignClubTreasurer(clubId, memberUserId, memberName) {
        return httpClient.request(`/api/clubs/${clubId}/treasurers`, {
            method: 'POST',
            body: JSON.stringify({ memberUserId, memberName }),
        });
    },

    deleteClubMember(clubId, memberId) {
        return httpClient.request(`/api/clubs/${clubId}/members/${memberId}`, { method: 'DELETE' });
    },
};

export default clubsApi;
