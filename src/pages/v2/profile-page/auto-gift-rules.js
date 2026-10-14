const KEY = 'clubhub:v2:auto-gift-rules:1';
export const MAX_AUTO_GIFT_RULES = 20;
export function normalizeAutoGiftRules(values) {
    if (!Array.isArray(values) || values.length > MAX_AUTO_GIFT_RULES)
        throw new Error('Mỗi quà có tối đa 20 điều kiện tự tặng.');
    const ids = new Set();
    return values.map((value) => {
        if (!value || typeof value.id !== 'string' || !/^[\w-]{1,64}$/.test(value.id) || ids.has(value.id))
            throw new Error('Mã điều kiện không hợp lệ hoặc trùng nhau.');
        ids.add(value.id);
        if (
            !['activity', 'contest'].includes(value.type) ||
            typeof value.eventId !== 'string' ||
            !value.eventId.trim() ||
            value.eventId.length > 100 ||
            typeof value.eventLabel !== 'string' ||
            value.eventLabel.length > 200 ||
            typeof value.enabled !== 'boolean' ||
            !['all', 'rank'].includes(value.audience)
        )
            throw new Error('Chọn hoạt động/contest và đối tượng nhận quà hợp lệ.');
        if (
            value.audience === 'rank' &&
            (!Number.isSafeInteger(value.rankFrom) ||
                !Number.isSafeInteger(value.rankTo) ||
                value.rankFrom < 1 ||
                value.rankTo < value.rankFrom ||
                value.rankTo > 100000)
        )
            throw new Error('Thứ hạng phải từ 1 đến 100.000, hạng cuối không nhỏ hơn hạng đầu.');
        return {
            id: value.id,
            type: value.type,
            eventId: value.eventId.trim(),
            eventLabel: value.eventLabel.trim(),
            audience: value.audience,
            rankFrom: value.audience === 'rank' ? value.rankFrom : null,
            rankTo: value.audience === 'rank' ? value.rankTo : null,
            enabled: value.enabled,
        };
    });
}
function read(storage) {
    try {
        const value = JSON.parse(storage?.getItem(KEY) || '{}');
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch {
        return {};
    }
}
export function readAutoGiftRules(clubId, rewardKey, storage = globalThis.localStorage) {
    try {
        return normalizeAutoGiftRules(read(storage)[String(clubId)]?.[rewardKey] || []);
    } catch {
        return [];
    }
}
export function saveAutoGiftRules(clubId, rewardKey, rules, storage = globalThis.localStorage) {
    if (!clubId || !rewardKey) throw new Error('Chọn CLB và quà trước khi lưu điều kiện.');
    const normalized = normalizeAutoGiftRules(rules),
        values = read(storage);
    values[String(clubId)] = { ...values[String(clubId)], [rewardKey]: normalized };
    storage.setItem(KEY, JSON.stringify(values));
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('clubhub:cover-rewards-updated'));
    return normalized;
}
export function autoGiftRuleLabel(rule) {
    return `${rule.eventLabel || rule.eventId} · ${rule.audience === 'all' ? 'Tất cả người tham gia' : rule.rankFrom === rule.rankTo ? `Hạng ${rule.rankFrom}` : `Hạng ${rule.rankFrom}–${rule.rankTo}`}`;
}
// Eligibility only; production grants require an authorized, transactional server worker.
export function autoGiftRecipients(clubId, rules, result, now = Date.now()) {
    const normalized = normalizeAutoGiftRules(rules);
    if (
        String(result?.clubId) !== String(clubId) ||
        result?.status !== 'COMPLETED' ||
        result.resultsFinalized !== true ||
        !Number.isFinite(Date.parse(result.endTimeUtc)) ||
        Date.parse(result.endTimeUtc) > now
    )
        return [];
    const matching = normalized.filter(
        (rule) => rule.enabled && rule.type === result.type && rule.eventId === String(result.id),
    );
    const recipients = new Set();
    for (const participant of Array.isArray(result.participants) ? result.participants : []) {
        if (!participant.userId || participant.participated !== true || participant.disqualified === true) continue;
        if (
            matching.some(
                (rule) =>
                    rule.audience === 'all' ||
                    (Number.isSafeInteger(participant.rank) &&
                        participant.rank >= rule.rankFrom &&
                        participant.rank <= rule.rankTo),
            )
        )
            recipients.add(String(participant.userId));
    }
    return [...recipients];
}
