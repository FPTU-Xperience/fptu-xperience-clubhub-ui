// Approval allows execution; publication independently controls discovery visibility.
export function activityPublication(raw = {}) {
    return {
        isPublished: typeof raw.isPublished === 'boolean' ? raw.isPublished : null,
        publicationVersion:
            Number.isSafeInteger(raw.publicationVersion) && raw.publicationVersion > 0 ? raw.publicationVersion : null,
        sourceApplicationId: raw.sourceApplicationId || null,
        publicationCapabilities: { canManage: raw.publicationCapabilities?.canManage === true },
    };
}
export function isActivityPublic(activity = {}) {
    if (typeof activity.isPublished === 'boolean') return activity.isPublished;
    // Legacy records keep their existing visibility. New application activities fail closed.
    return !activity.sourceApplicationId;
}
export function canManageActivityPublication(activity, access) {
    return (
        activity?.publicationCapabilities?.canManage === true &&
        typeof activity.isPublished === 'boolean' &&
        Number.isSafeInteger(activity.publicationVersion) &&
        activity.publicationVersion > 0 &&
        (Array.isArray(access?.permissions)
            ? access.permissions.includes('activity.publish')
            : access?.isManager === true)
    );
}
export async function saveActivityPublication(api, activity, isPublished, idempotencyKey) {
    const saved = await api.setActivityPublication(
        activity.id,
        {
            isPublished,
            expectedVersion: activity.publicationVersion,
        },
        idempotencyKey,
    );
    if (
        String(saved?.id) !== String(activity.id) ||
        saved?.isPublished !== isPublished ||
        !Number.isSafeInteger(saved.publicationVersion) ||
        saved.publicationVersion <= activity.publicationVersion
    )
        throw new Error('Máy chủ chưa xác nhận trạng thái công khai. Vui lòng tải lại trước khi thử tiếp.');
    return saved;
}
