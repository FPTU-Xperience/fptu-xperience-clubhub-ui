import { httpClient } from './client';

export const financeApi = {
    getBudgetProposals(params = {}) {
        const query = new URLSearchParams(params).toString();
        return httpClient.request(`/api/finance/proposals${query ? `?${query}` : ''}`);
    },

    createBudgetProposal(data) {
        return httpClient.request('/api/finance/proposals', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    approveBudget(id, approvedAmount, note) {
        return httpClient.request(`/api/finance/proposals/${id}/approve`, {
            method: 'POST',
            body: JSON.stringify({ approvedAmount, note }),
        });
    },

    managerApproveBudget(id, note) {
        return httpClient.request(`/api/finance/proposals/${id}/manager-approve`, {
            method: 'POST',
            body: JSON.stringify({ approvedAmount: null, note }),
        });
    },

    managerRejectBudget(id, note) {
        return httpClient.request(`/api/finance/proposals/${id}/manager-reject`, {
            method: 'POST',
            body: JSON.stringify({ approvedAmount: null, note }),
        });
    },

    rejectBudget(id, note) {
        return httpClient.request(`/api/finance/proposals/${id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ approvedAmount: null, note }),
        });
    },

    createSettlement(proposalId, data) {
        return httpClient.request(`/api/finance/proposals/${proposalId}/settlements`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    approveSettlement(settlementId, note = '') {
        return httpClient.request(`/api/finance/settlements/${settlementId}/approve`, {
            method: 'POST',
            body: JSON.stringify({ note }),
        });
    },

    getFinanceTransactions(clubId) {
        const query = clubId ? `?clubId=${clubId}` : '';
        return httpClient.request(`/api/finance/transactions${query}`);
    },
};

export default financeApi;
