export async function loadStudentActivityFeed(api, clubId) {
    const items = [];
    let scopeVersion;
    for (let page = 1; ; page++) {
        const query = new URLSearchParams({ page, pageSize: 100, ...(clubId ? { clubId } : {}) });
        const value = await api.request(`/api/v2/activities/feed?${query}`);
        if (
            !Array.isArray(value?.items) ||
            value.page !== page ||
            !Number.isInteger(value.totalPages) ||
            value.totalPages < 0 ||
            value.totalPages > 1000 ||
            typeof value.scopeVersion !== 'string'
        )
            throw new Error('Máy chủ chưa trả feed hoạt động hợp lệ.');
        if (scopeVersion !== undefined && scopeVersion !== value.scopeVersion)
            throw new Error('Quyền xem hoạt động đã thay đổi. Hãy tải lại danh sách.');
        scopeVersion = value.scopeVersion;
        items.push(...value.items);
        if (page >= value.totalPages) return { items };
    }
}

export async function loadStudentActivityDetail(api, activityId) {
    const detail = await api.request(`/api/v2/activities/${encodeURIComponent(activityId)}`);
    try {
        const gallery = await api.request(`/api/activities/${encodeURIComponent(activityId)}/resources`);
        if (!Array.isArray(gallery?.items) || gallery.availability !== 'AVAILABLE')
            throw new Error('Gallery unavailable');
        return {
            ...detail,
            resources: gallery.items,
            resourceCapabilities: gallery.resourceCapabilities,
            resourceAvailability: gallery.availability,
        };
    } catch (error) {
        if (error.status === 401) throw error;
        return {
            ...detail,
            resources: null,
            resourceAvailability: error.status === 403 ? 'ACCESS_DENIED' : 'AUTHORITY_UNAVAILABLE',
        };
    }
}

export async function loadStudentRecommendations(api) {
    const value = await api.request('/api/v2/recommendations/activities?limit=6&scope=PERIOD');
    if (value?.available !== true || !Array.isArray(value.items)) throw new Error('Gợi ý từ máy chủ chưa khả dụng.');
    return value;
}
