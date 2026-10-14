const KEY = 'clubhub:v2:gift-popularity:1';
export const giftCategory = (gift) => (gift.kind === 'combo' ? 'color' : gift.kind);
export function readGiftPopularity(clubId, storage = globalThis.localStorage) {
    try {
        const values = JSON.parse(storage?.getItem(KEY) || '{}')?.[String(clubId)] || {};
        return Object.fromEntries(
            Object.entries(values).filter(([, count]) => Number.isSafeInteger(count) && count > 0),
        );
    } catch {
        return {};
    }
}
export function recordGiftClaim(clubId, rewardKey, storage = globalThis.localStorage) {
    try {
        const values = JSON.parse(storage?.getItem(KEY) || '{}');
        const counts = readGiftPopularity(clubId, storage);
        values[String(clubId)] = { ...counts, [rewardKey]: (counts[rewardKey] || 0) + 1 };
        storage.setItem(KEY, JSON.stringify(values));
    } catch {
        /* Optional local display metrics must not prevent a successful claim. */
    }
}
export function buildGiftSections(gifts, counts = {}, now = Date.now()) {
    const recent = gifts
        .filter((gift) => {
            const date = Date.parse(gift.createdAt);
            return Number.isFinite(date) && date <= now && date >= now - 30 * 86400000;
        })
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .slice(0, 6);
    const hot = gifts
        .filter((gift) => gift.status === 'published' && (gift.hot || counts[gift.key] > 0))
        .sort((a, b) => Number(!!b.hot) - Number(!!a.hot) || (counts[b.key] || 0) - (counts[a.key] || 0))
        .slice(0, 6);
    return [
        { id: 'recent', items: recent },
        { id: 'hot', items: hot },
        ...['physical', 'frame', 'shape', 'color'].map((id) => ({
            id,
            items: gifts.filter((gift) => giftCategory(gift) === id),
        })),
    ];
}
