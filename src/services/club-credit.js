export const creditGuid = (value) => typeof value === 'string' && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value);
const same = (a, b) => String(a) === String(b);
const validCosmetic = (value) => {
    if (!creditGuid(value?.cosmeticId) || !Number.isSafeInteger(Number(value.issuerClubId)) || Number(value.issuerClubId) < 1 ||
        !['COLOR', 'SHAPE', 'FRAME'].includes(value.kind) || typeof value.label !== 'string' || !value.definition) return false;
    if (value.kind === 'COLOR') return ['background', 'secondary', 'accent', 'ink'].every((key) => /^#[0-9a-f]{6}$/i.test(value.definition[key]));
    try { const url = new URL(value.definition.assetUrl); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
};
export const creditNumber = (value) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);
export function creditWallet(value, userId, clubId) {
    if (!same(value?.userId, userId) || !same(value.clubId, clubId) || value.unit !== 'CLUB_CREDIT' ||
        value.policyVersion !== 'CLUB_VERIFIED_XP_1_TO_1_V1' || !creditGuid(value.version) ||
        !['earnedTotal', 'revokedTotal', 'spentTotal', 'balance'].every((key) => Number.isFinite(value[key])) ||
        ['earnedTotal', 'revokedTotal', 'spentTotal'].some((key) => value[key] < 0) ||
        Math.abs(value.earnedTotal - value.revokedTotal - value.spentTotal - value.balance) > 0.0001)
        throw new Error('Máy chủ chưa xác nhận số dư credit của đúng tài khoản và CLB.');
    return value;
}
export function creditGraph(value, userId, clubId) {
    if (!same(value?.userId, userId) || !same(value.clubId, clubId) || value.unit !== 'CLUB_CREDIT' ||
        !creditGuid(value.version) || value.policyVersion !== 'CLUB_VERIFIED_XP_1_TO_1_V1' || value.timezone !== 'Asia/Ho_Chi_Minh' || !Array.isArray(value.points) || !value.points.length || value.points.length > 365 ||
        value.points.some((row, index, rows) => !/^\d{4}-\d{2}-\d{2}$/.test(row.date) ||
            !['earned', 'spent', 'balance'].every((key) => Number.isFinite(row[key])) || row.spent < 0 ||
            Math.abs(row.earned - row.spent - row.balance) > 0.0001 || index > 0 && row.date <= rows[index - 1].date))
        throw new Error('Biểu đồ credit chưa khớp nguồn dữ liệu chính thức.');
    return value;
}
export function creditPage(value) {
    if (!Array.isArray(value?.items) || !Number.isSafeInteger(value.page) || value.page < 1 ||
        !Number.isSafeInteger(value.totalItems) || value.totalItems < 0 || !Number.isSafeInteger(value.totalPages) || value.totalPages < 0)
        throw new Error('Máy chủ chưa trả danh sách có phân trang hợp lệ.');
    return value;
}
export function rewardCatalog(value, clubId) {
    creditPage(value);
    if (!same(value.clubId, clubId) || !value.capabilities || typeof value.capabilities.canManage !== 'boolean' || typeof value.capabilities.canRedeem !== 'boolean' || value.items.some((row) =>
        !creditGuid(row.id) || !same(row.clubId, clubId) || !creditGuid(row.version) || !row.label ||
        !['COLOR', 'SHAPE', 'FRAME', 'BUNDLE'].includes(row.kind) || !Number.isSafeInteger(row.price) || row.price < 0 || row.price > 100000 ||
        !['DRAFT', 'SCHEDULED', 'OPEN', 'EXPIRED', 'RETIRED'].includes(row.availability) || !Array.isArray(row.grants) || !row.grants.length ||
        new Set(row.grants.map((grant) => grant.cosmeticId)).size !== row.grants.length ||
        row.grants.some((grant) => !validCosmetic(grant) || !same(grant.issuerClubId, clubId))) || new Set(value.items.map((row) => row.id)).size !== value.items.length)
        throw new Error('Danh mục quà chưa khớp CLB hoặc chưa có định nghĩa hợp lệ.');
    return value;
}
export async function cosmeticInventory(api, userId) {
    const items = []; let total;
    for (let page = 1; page <= 100; page++) {
        const value = creditPage(await api.request(`/api/users/me/cosmetics?page=${page}&pageSize=100`));
        if (!same(value.userId, userId) || value.page !== page || total != null && value.totalItems !== total)
            throw new Error('Kho vật phẩm đã thay đổi hoặc không đúng tài khoản. Tải lại để đối chiếu.');
        total = value.totalItems; items.push(...value.items);
        if (page >= value.totalPages) {
            if (items.length !== total || items.some((item) => !validCosmetic(item.cosmetic) || !creditGuid(item.sourceReceiptId)) ||
                new Set(items.map((item) => item.cosmetic.cosmeticId)).size !== total)
                throw new Error('Kho vật phẩm chưa được tải đầy đủ.');
            return items;
        }
    }
    throw new Error('Kho vật phẩm quá lớn để tải trong một lần.');
}
export function rewardReceipt(value, userId, clubId, reward) {
    if (!creditGuid(value?.receiptId) || !same(value.userId, userId) || !same(value.clubId, clubId) || value.rewardId !== reward.id ||
        !creditGuid(value.walletVersion) || !Number.isFinite(value.balance) || ![0, reward.price].includes(value.amount) ||
        !Array.isArray(value.grants) || value.grants.length !== reward.grants.length || new Set(value.grants).size !== value.grants.length ||
        value.grants.some((id) => !reward.grants.some((grant) => grant.cosmeticId === id)))
        throw new Error('Máy chủ chưa xác nhận đúng giao dịch đổi quà. Tải lại ví và lịch sử trước khi thử tiếp.');
    return value;
}
export const rewardMutation = (api, clubId, suffix, body, key, method = 'POST') => api.request(`/api/clubs/${encodeURIComponent(clubId)}/rewards${suffix}`, {
    method, headers: { 'Idempotency-Key': key }, body: JSON.stringify(body),
});
export const rewardTime = (value) => value ? new Date(value).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }) : 'Không giới hạn';
export function rewardWindow(opens, closes) {
    const start = opens ? new Date(opens + ':00+07:00').toISOString() : null;
    const end = closes ? new Date(closes + ':00+07:00').toISOString() : null;
    if (end && Date.parse(end) <= (start ? Date.parse(start) : Date.now())) throw new Error('Giờ đóng phải sau giờ mở và thời điểm hiện tại.');
    return { opensAt: start, closesAt: end };
}
