const KEY = 'clubhub:v2:reward-lifecycle:1';
function read(storage) {
    try {
        const value = JSON.parse(storage?.getItem(KEY) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
        return {};
    }
}
export function rewardLifecycle(clubId, rewardKey, storage = globalThis.localStorage, now = Date.now()) {
    const entry = read(storage)[String(clubId)]?.[rewardKey];
    if (!entry) return { status: 'published', publishAt: null };
    if (
        !['published', 'draft', 'scheduled', 'deleted'].includes(entry.status) ||
        (entry.status === 'scheduled' && !Number.isFinite(Date.parse(entry.publishAt)))
    )
        return { status: 'draft', publishAt: null };
    if (entry.status === 'scheduled') {
        const start = Date.parse(entry.publishAt),
            end = entry.unpublishAt ? Date.parse(entry.unpublishAt) : Infinity;
        if (end <= start || Number.isNaN(end)) return { status: 'draft', publishAt: null };
        if (now >= end) return { ...entry, status: 'expired', nextChangeAt: null };
        if (now >= start) return { ...entry, status: 'published', nextChangeAt: Number.isFinite(end) ? end : null };
        return { ...entry, nextChangeAt: start };
    }
    return entry;
}
export function setRewardLifecycle(
    clubId,
    rewardKey,
    status,
    publishAt = null,
    storage = globalThis.localStorage,
    now = Date.now(),
) {
    if (!clubId || !rewardKey || !['draft', 'published', 'scheduled', 'deleted'].includes(status))
        throw new Error('Trạng thái quà không hợp lệ.');
    if (status === 'scheduled' && (!Number.isFinite(Date.parse(publishAt)) || Date.parse(publishAt) <= now))
        throw new Error('Chọn thời điểm publish trong tương lai.');
    const values = read(storage);
    const entry = {
        status,
        publishAt: status === 'scheduled' ? new Date(publishAt).toISOString() : null,
        unpublishAt: null,
    };
    values[String(clubId)] = { ...values[String(clubId)], [rewardKey]: entry };
    storage.setItem(KEY, JSON.stringify(values));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('clubhub:cover-rewards-updated'));
    return entry;
}

export function normalizeRewardWindow(start, end, now = Date.now()) {
    const from = Date.parse(start),
        to = Date.parse(end);
    if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from || to <= now)
        throw new Error('Chọn giờ mở/đóng hợp lệ; giờ đóng phải sau giờ mở và thời điểm hiện tại.');
    return { status: 'scheduled', publishAt: new Date(from).toISOString(), unpublishAt: new Date(to).toISOString() };
}
export function setRewardWindow(clubId, rewardKey, start, end, storage = globalThis.localStorage, now = Date.now()) {
    if (!clubId || !rewardKey) throw new Error('Chọn CLB và quà trước khi lưu lịch.');
    const entry = normalizeRewardWindow(start, end, now),
        values = read(storage);
    values[String(clubId)] = { ...values[String(clubId)], [rewardKey]: entry };
    storage.setItem(KEY, JSON.stringify(values));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('clubhub:cover-rewards-updated'));
    return entry;
}
